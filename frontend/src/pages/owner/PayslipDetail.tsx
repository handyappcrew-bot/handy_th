import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { staffStore } from "@/lib/staffStore";

const SHIFT_BADGE: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};


function InfoRow({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1 }}>{children}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

function SubSectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '16px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '10px', marginTop: '4px' }}>{children}</p>;
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

export default function PayslipDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffName = searchParams.get("name") || "";
  const payslipId = searchParams.get("id");
  const pyParam = searchParams.get("py");
  const pmParam = searchParams.get("pm");
  const isPaid = searchParams.get("paid") === "true";
  const isEditing = searchParams.get("editing") === "true";
  const from = searchParams.get("from");
  const [expanded, setExpanded] = useState(false);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const [payslip, setPayslip] = useState<any>(null);
  const [isTransferred, setIsTransferred] = useState(false);
  const [transferredAt, setTransferredAt] = useState<string | null>(null);
  const storeId = localStorage.getItem("currentStoreId");

  useEffect(() => {
    if (!payslipId || !storeId) return;
    fetch(`/api/owner/store/${storeId}/payslips/${payslipId}`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return;
        setPayslip(data);
        setIsTransferred(data.is_transferred);
        setTransferredAt(data.transferred_at || null);
      })
      .catch(() => {});
  }, [payslipId, storeId]);

  const fmtTransferTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '이체 완료';
    return `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 이체 완료`;
  };

  const publishedAtRaw = payslip?.published_at || null;
  const isActuallyPublished = !isEditing && (isPaid || !!payslip?.is_published);

  const formatPublishedAt = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  const fmt = (n: number) => n.toLocaleString();
  const minToHourStr = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
  };

  const allStaff = staffStore.getAll();
  const staffData = allStaff.find(s => s.name === (payslip?.name || staffName)) ?? allStaff.find(s => s.name === staffName);
  const staff = {
    name: payslip?.name || staffName,
    shifts: staffData ? [...new Set(staffData.workSchedule.flatMap(w => w.shifts))] : [] as string[],
    type: payslip?.employee_type || staffData?.employmentType || "-",
    avatarColor: staffData?.avatarColor || "#4261FF",
    birth: payslip?.birth || '-',
    phone: payslip?.phone || '-',
  };

  const contractInfo = {
    payDay: payslip?.salary_day ? `${payslip.salary_day}일` : '-',
    workSchedule: staffData?.workSchedule.map(w => ({ day: w.day, time: w.shifts.join('/'), shifts: w.shifts })) || [],
    hourlyWage: payslip?.hourly_rate ? `${Number(payslip.hourly_rate).toLocaleString()}원` : '-',
    bank: payslip?.bank || '-',
    account: payslip?.account_number || '-',
  };

  const fmt0 = (n: number) => n.toLocaleString();

  const basePay      = payslip?.base_pay ?? 0;
  const overtimePay  = payslip?.overtime_pay ?? 0;
  const nightPay     = payslip?.night_pay ?? 0;
  const holidayPay   = payslip?.holiday_pay ?? 0;
  const weeklyAllow  = payslip?.weekly_leave_pay ?? 0;
  const otherAllow   = payslip?.other_allowance ?? 0;
  const incomeTaxVal = payslip?.income_tax ?? 0;
  const localTaxVal  = payslip?.local_income_tax ?? 0;
  const pensionVal   = payslip?.national_pension ?? 0;
  const healthVal    = payslip?.health_insurance ?? 0;
  const ltcVal       = payslip?.long_term_care ?? 0;
  const employVal    = payslip?.employment_insurance ?? 0;

  const totalPayNum      = payslip?.total_pay ?? (basePay + overtimePay + nightPay + holidayPay + weeklyAllow + otherAllow);
  const incomeTaxTotalNum = incomeTaxVal + localTaxVal;
  const socialTotalNum   = pensionVal + healthVal + ltcVal + employVal;
  const totalDeductionNum = payslip?.total_deduction ?? (incomeTaxTotalNum + socialTotalNum);
  const netSalaryNum     = payslip?.net_pay ?? (totalPayNum - totalDeductionNum);

  const periodStr = payslip
    ? `${payslip.pay_period_start.replace(/-/g,'.')} - ${payslip.pay_period_end.replace(/-/g,'.')}`
    : pyParam && pmParam ? `${pyParam}.${String(pmParam).padStart(2,'0')}.01 - ${pyParam}.${String(pmParam).padStart(2,'0')}.말일` : '-';

  const salaryInfo = {
    period: periodStr,
    totalPayment: `${fmt0(totalPayNum)}원`,
    totalDeduction: `${fmt0(totalDeductionNum)}원`,
    netSalary: fmt0(netSalaryNum),
  };

  const workDetail = {
    workDays: payslip ? `${payslip.work_days}일` : '-',
    actualHours: payslip ? minToHourStr(payslip.actual_work_minutes) : '-',
    overtimeHours: payslip ? minToHourStr(payslip.overtime_minutes) : '-',
    nightHours: payslip ? minToHourStr(payslip.night_minutes || 0) : '-',
    holidayHours: payslip ? minToHourStr(payslip.holiday_minutes || 0) : '-',
    weeklyAllowanceHours: payslip ? minToHourStr(payslip.weekly_leave_minutes || 0) : '-',
    weeklyNote: "",
    totalPayHours: payslip ? minToHourStr((payslip.actual_work_minutes || 0) + (payslip.overtime_minutes || 0) + (payslip.weekly_leave_minutes || 0)) : '-',
  };

  const payDetail = {
    basePay: { amount: `${fmt0(basePay)}원`, note: `(${minToHourStr(payslip?.actual_work_minutes || 0)})` },
    overtimePay: { amount: `${fmt0(overtimePay)}원`, note: `(${minToHourStr(payslip?.overtime_minutes || 0)})` },
    nightPay: { amount: `${fmt0(nightPay)}원`, note: `(${minToHourStr(payslip?.night_minutes || 0)})` },
    holidayPay: { amount: `${fmt0(holidayPay)}원`, note: `(${minToHourStr(payslip?.holiday_minutes || 0)})` },
    weeklyAllowance: { amount: `${fmt0(weeklyAllow)}원`, note: `(${minToHourStr(payslip?.weekly_leave_minutes || 0)})` },
    otherAllowance: { amount: `${fmt0(otherAllow)}원`, label: "(인센티브)" },
    totalPayment: `${fmt0(totalPayNum)}원`,
  };

  const deductionDetail = {
    incomeTax: `${fmt0(incomeTaxVal)}원`,
    localTax: `${fmt0(localTaxVal)}원`,
    incomeTaxTotal: `${fmt0(incomeTaxTotalNum)}원`,
    nationalPension: { amount: `${fmt0(pensionVal)}원`, note: "(근로자 부담 4.5%)" },
    healthInsurance: { amount: `${fmt0(healthVal)}원`, note: "(근로자 부담 3.545%)" },
    longTermCare: { amount: `${fmt0(ltcVal)}원`, note: "(건강보험료의 12.81%)" },
    employmentInsurance: { amount: `${fmt0(employVal)}원`, note: "(근로자 부담 0.9%)" },
    socialTotal: `${fmt0(socialTotalNum)}원`,
    totalDeduction: `${fmt0(totalDeductionNum)}원`,
  };

  const cumulativeSalary = { period: periodStr, amount: `${fmt0(netSalaryNum)}원` };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => from === 'detail' ? navigate(-1) : navigate("/owner/salary?tab=payslip", { replace: true })} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여명세서 확인</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 발행 시각 안내 */}
        {isActuallyPublished && publishedAtRaw && (
          <div style={{ padding: '10px 20px', backgroundColor: '#F7F8FF', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '13px', color: '#7488FE' }}>
              {formatPublishedAt(publishedAtRaw)}에 발급된 급여명세서예요
            </span>
          </div>
        )}

        {/* 미발급 안내 배너 */}
        {!isActuallyPublished && (
          <div style={{ padding: '10px 20px', backgroundColor: '#F7F8FF', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '13px', color: '#7488FE' }}>
              급여명세서를 확인 후 발급해주세요
            </span>
          </div>
        )}

        {/* 이체 확인 요청 배너 — 발행 후 & 이체 미완료 시 노출 */}
        {isActuallyPublished && isTransferred && (
          <div style={{ padding: '10px 20px', backgroundColor: '#ECFFF1', borderBottom: '1px solid #A7F3D0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>✅</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#065F46' }}>{fmtTransferTime(transferredAt)}</span>
          </div>
        )}
        {isActuallyPublished && !isTransferred && (
          <div style={{ padding: '12px 20px', backgroundColor: '#FFF8E1', borderBottom: '1px solid #FFE082', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>💸</span>
              <span style={{ fontSize: '13px', fontWeight: 500, color: '#92400E', lineHeight: '1.5' }}>급여 이체 후 이체 확인 버튼을<br />눌러주세요</span>
            </div>
            <button
              onClick={() => setTransferConfirmOpen(true)}
              style={{ flexShrink: 0, height: '34px', padding: '0 14px', borderRadius: '8px', border: 'none', backgroundColor: '#FFB300', fontSize: '13px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              이체 확인
            </button>
          </div>
        )}

        {/* 직원 정보 */}
        <div style={{ padding: '16px 20px 4px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: staff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
              {staff.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
              {staff.shifts.map(sh => <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[sh] || ''}`}>{sh}</span>)}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{staff.type}</span>
              {!isActuallyPublished && <button onClick={() => setStaffPickerOpen(true)} className="pressable p-0.5"><ChevronDown className="w-4 h-4 text-muted-foreground" /></button>}
            </div>
          </div>
          <InfoRow label="생년월일">{staff.birth}</InfoRow>
          <InfoRow label="전화번호">{staff.phone}</InfoRow>
        </div>

        <Divider thick />

        {/* 계약 정보 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>계약 정보</SectionTitle>
          <InfoRow label="급여일">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {contractInfo.payDay}
              {!isActuallyPublished && (() => {
                const now = new Date();
                const todayDate = now.getDate();
                const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
                const days = contractInfo.payDay.split(',').map(d => {
                  const t = d.trim().replace('일', '');
                  if (t === '말') return lastDay;
                  return parseInt(t);
                }).filter(n => !isNaN(n));
                const nearest = days.map(day => ({ day, diff: day >= todayDate ? day - todayDate : day + lastDay - todayDate })).sort((a, b) => a.diff - b.diff)[0];
                if (!nearest) return null;
                const label = nearest.diff === 0 ? 'D-day' : `D-${nearest.diff}`;
                const color = nearest.diff === 0 ? '#FF3D3D' : nearest.diff === 1 ? '#FF8F00' : '#9EA3AD';
                return <span style={{ fontSize: '12px', fontWeight: 700, color }}>({label})</span>;
              })()}
            </span>
          </InfoRow>
          <InfoRow label="근무일">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {contractInfo.workSchedule.map((ws, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', width: '14px' }}>{ws.day}</span>
                  <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>{ws.time}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {ws.shifts.map(s => <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[s] || 'bg-muted text-muted-foreground'}`}>{s}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </InfoRow>
          <InfoRow label="시급">{contractInfo.hourlyWage}</InfoRow>
          <InfoRow label="은행">{contractInfo.bank}</InfoRow>
          <InfoRow label="계좌번호"><span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', textDecoration: 'underline' }}>{contractInfo.account}</span></InfoRow>
        </div>

        <Divider thick />

        {/* 급여 정보 */}
        <div style={{ backgroundColor: '#FFFFFF' }}>
          <div style={{ padding: '16px 20px' }}>
            <SectionTitle>급여 정보</SectionTitle>
            <div style={{ backgroundColor: '#F0F4FF', borderRadius: '14px', padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 700, color: '#19191B' }}>지급될 급여</span>
                </div>
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>({salaryInfo.period})</span>
              </div>
              <p style={{ fontSize: '13px', color: '#70737B', marginBottom: '8px' }}>
                지급액 합계 {salaryInfo.totalPayment} - 총 공제액 {salaryInfo.totalDeduction}
              </p>
              <p style={{ textAlign: 'right', fontSize: '22px', fontWeight: 700, color: '#4261FF', margin: 0 }}>
                총 {salaryInfo.netSalary}원
              </p>
            </div>
          </div>
          {!expanded ? (
            <button onClick={() => setExpanded(true)} className="w-full flex items-center justify-center gap-1" style={{ fontSize: '14px', color: '#9EA3AD', padding: '16px 20px' }}>
              상세 보기 <ChevronDown className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Divider thick />

              {/* 근무 내역 */}
              <div style={{ padding: '16px 20px' }}>
                <SectionTitle>근무 내역</SectionTitle>
                <InfoRow label="근로일수">{workDetail.workDays}</InfoRow>
                <InfoRow label="실근로시간">{workDetail.actualHours}</InfoRow>
                <InfoRow label="연장근로시간">{workDetail.overtimeHours}</InfoRow>
                <InfoRow label="야간근로시간">{workDetail.nightHours}</InfoRow>
                <InfoRow label="휴일근로시간">{workDetail.holidayHours}</InfoRow>
                <InfoRow label="주휴수당시간">
                  <div>
                    <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>{workDetail.weeklyAllowanceHours}</span>
                    <br />
                    <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{workDetail.weeklyNote}</span>
                  </div>
                </InfoRow>
                <InfoRow label="총 지급시간">{workDetail.totalPayHours}</InfoRow>
              </div>

              <Divider thick />

              {/* 지급 내역 */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', margin: 0 }}>지급 내역</h3>
                </div>
                <InfoRow label="기본급">
                  <div>{payDetail.basePay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.basePay.note}</span></div>
                </InfoRow>
                <InfoRow label="연장수당">
                  <div>{payDetail.overtimePay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.overtimePay.note}</span></div>
                </InfoRow>
                <InfoRow label="야간수당">
                  <div>{payDetail.nightPay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.nightPay.note}</span></div>
                </InfoRow>
                <InfoRow label="휴일수당">
                  <div>{payDetail.holidayPay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.holidayPay.note}</span></div>
                </InfoRow>
                <InfoRow label="주휴수당">
                  <div>{payDetail.weeklyAllowance.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.weeklyAllowance.note}</span></div>
                </InfoRow>
                <InfoRow label={<>기타 수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{payDetail.otherAllowance.label}</span></>}>
                  <div>{payDetail.otherAllowance.amount}</div>
                </InfoRow>
                <InfoRow label="지급액 합계"><span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{payDetail.totalPayment}</span></InfoRow>
              </div>

              <Divider thick />

              {/* 공제 내역 */}
              <div style={{ padding: '16px 20px' }}>
                <SectionTitle>공제 내역</SectionTitle>

                <SubSectionTitle>소득세</SubSectionTitle>
                <div>
                  <InfoRow label="소득세">{deductionDetail.incomeTax}</InfoRow>
                  <InfoRow label="지방소득세">{deductionDetail.localTax}</InfoRow>
                </div>
                <InfoRow label="소득세 합계"><span style={{ fontWeight: 600 }}>{deductionDetail.incomeTaxTotal}</span></InfoRow>

                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '4px 0 12px' }} />

                <SubSectionTitle>4대 보험</SubSectionTitle>
                <div>
                  <InfoRow label="국민연금">{deductionDetail.nationalPension.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}> {deductionDetail.nationalPension.note}</span></InfoRow>
                  <InfoRow label="건강보험">{deductionDetail.healthInsurance.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}> {deductionDetail.healthInsurance.note}</span></InfoRow>
                  <InfoRow label="장기요양보험">{deductionDetail.longTermCare.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}> {deductionDetail.longTermCare.note}</span></InfoRow>
                  <InfoRow label="고용보험">{deductionDetail.employmentInsurance.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}> {deductionDetail.employmentInsurance.note}</span></InfoRow>
                </div>
                <InfoRow label="4대보험 합계"><span style={{ fontWeight: 600 }}>{deductionDetail.socialTotal}</span></InfoRow>

                <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '4px 0 12px' }} />
                <InfoRow label="총 공제액"><span style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{deductionDetail.totalDeduction}</span></InfoRow>
              </div>

              <Divider thick />

              {/* 누적 급여 */}
              <div style={{ padding: '16px 20px' }}>
                <div style={{ backgroundColor: '#F0F4FF', borderRadius: '14px', padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, color: '#19191B' }}>지급까지 누적 급여</span>
                    <span style={{ fontSize: '12px', color: '#9EA3AD' }}>({cumulativeSalary.period})</span>
                  </div>
                  <p style={{ textAlign: 'right', fontSize: '22px', fontWeight: 700, color: '#4261FF', margin: 0 }}>{cumulativeSalary.amount}</p>
                </div>
              </div>

              <Divider thick />

              {/* 고지 문구 */}
              <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
                <p style={{ fontSize: '12px', color: '#9EA3AD', lineHeight: '1.7' }}>
                  본 급여명세서는 국민연금(4.5%), 건강보험(3.545%), 장기요양보험(건강보험료의 12.81%), 고용보험(0.9%) 등 법정 4대 보험 요율을 적용하여 공제하였으며, 근로소득세 및 지방소득세가 함께 공제되었습니다.
                </p>
              </div>

              <button onClick={() => setExpanded(false)} className="w-full flex items-center justify-center gap-1" style={{ fontSize: '14px', color: '#9EA3AD', padding: '12px 20px 16px' }}>
                닫기 <ChevronDown className="w-4 h-4 rotate-180" />
              </button>
            </>
          )}
        {/* 이체 완료 체크 — 발행 후에만 노출 */}
        {isActuallyPublished && (
          <>
            <Divider thick />
            <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: '#19191B', marginBottom: '2px' }}>실제 이체 완료 여부</p>
                  {isTransferred
                    ? <p style={{ fontSize: '13px', color: '#10C97D', fontWeight: 500 }}>{fmtTransferTime(transferredAt ?? '')}</p>
                    : <p style={{ fontSize: '13px', color: '#9EA3AD' }}>명세서 전송과 별개로 이체 여부를 기록해요</p>}
                </div>
                <button
                  onClick={() => { if (!isTransferred) setTransferConfirmOpen(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '40px', padding: '0 14px', borderRadius: '10px', border: `1px solid ${isTransferred ? 'rgba(16,201,125,0.3)' : '#DBDCDF'}`, backgroundColor: isTransferred ? 'rgba(16,201,125,0.08)' : '#FFFFFF', fontSize: '14px', fontWeight: 600, color: isTransferred ? '#10C97D' : '#70737B', cursor: 'pointer' }}>
                  {isTransferred && <Check style={{ width: '14px', height: '14px' }} />}
                  {isTransferred ? '이체 완료' : '이체 확인'}
                </button>
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* 하단 버튼 */}
      {createPortal(
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
          <div style={{ maxWidth: "512px", margin: "0 auto", padding: "16px 20px", display: "flex", gap: "8px" }}>
            {isActuallyPublished ? (
              <button disabled style={{ width: '100%', height: '56px', backgroundColor: '#F7F7F8', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#AAB4BF', cursor: 'default' }}>
                급여 명세서 발급 완료
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate(`/owner/salary/payslip/edit?id=${payslipId}&name=${encodeURIComponent(staff.name)}&py=${pyParam}&pm=${pmParam}`)}
                  style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer' }}>
                  수정하기
                </button>
                <button
                  onClick={() => navigate(`/owner/salary/payslip/publish?id=${payslipId}&name=${encodeURIComponent(staff.name)}&py=${pyParam}&pm=${pmParam}`)}
                  style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
                  급여명세서 미리보기
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 이체 완료 확인 팝업 */}
      {transferConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center" onClick={() => setTransferConfirmOpen(false)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 20px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px', letterSpacing: '-0.02em' }}>이체 완료 처리</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '24px', lineHeight: '1.6', letterSpacing: '-0.02em' }}>{staffName}님 급여를 실제로<br />이체하셨나요?</p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setTransferConfirmOpen(false)} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#70737B', backgroundColor: '#F7F7F8', cursor: 'pointer', letterSpacing: '-0.02em' }}>취소</button>
              <button onClick={() => {
                setTransferConfirmOpen(false);
                const now = new Date().toISOString();
                setIsTransferred(true);
                setTransferredAt(now);
                if (payslipId && storeId) {
                  fetch(`/api/owner/store/${storeId}/payslips/${payslipId}/transfer`, { method: 'POST', credentials: 'include' }).catch(() => {});
                }
              }} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>이체 완료</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 직원 선택 바텀시트 */}
      {staffPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setStaffPickerOpen(false)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="px-6 pt-6">
              <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>직원 선택하기</h3>
                <button onClick={() => setStaffPickerOpen(false)} className="pressable p-1">
                  <X className="w-5 h-5 text-foreground" />
                </button>
              </div>
              <div className="flex items-center justify-between" style={{ marginBottom: '4px', marginTop: '4px' }}>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>발급 대기 직원</span>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 {allStaff.length}명</span>
              </div>
            </div>
            <div className="overflow-y-auto py-[10px]" style={{ maxHeight: '60vh' }}>
              {allStaff.map((s, i) => {
                const sShifts = [...new Set(s.workSchedule.flatMap(w => w.shifts))];
                const sWorkDays = s.workSchedule.map(w => w.day).join(', ') || '-';
                return (
                <button key={i} onClick={() => { setStaffPickerOpen(false); navigate(`/owner/salary/payslip?name=${encodeURIComponent(s.name)}`); }}
                  className="pressable w-full flex items-center justify-between px-6 py-[10px]"
                  style={{ backgroundColor: s.name === staff.name ? '#F0F4FF' : '#FFFFFF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: s.avatarColor }}>{s.name.charAt(0)}</div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: s.name === staff.name ? '#4261FF' : '#19191B' }}>{s.name}</span>
                        {sShifts.map(sh => <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[sh] || ''}`}>{sh}</span>)}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.employmentType}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{sWorkDays}</span>
                    </div>
                  </div>
                  {s.name === staff.name && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4261FF', flexShrink: 0 }} />}
                </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
