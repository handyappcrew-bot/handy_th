import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";

const SHIFT_BADGE: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const PAYSLIP_STAFF = [
  { name: "김정민", shifts: ["오픈"], type: "정규직", workDays: "월, 화, 수, 목, 금", birth: "2001.01.17", phone: "010-5713-0208", avatarColor: "#5C4033", status: "지급 전" as const },
  { name: "정수민", shifts: ["오픈"], type: "정규직", workDays: "월, 화, 수, 목, 금", birth: "2001.01.17", phone: "010-5713-0208", avatarColor: "#F4D03F", status: "지급 전" as const },
];

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
  const staffName = searchParams.get("name") || "김정민";
  const isPaid = searchParams.get("paid") === "true";
  const isEditing = searchParams.get("editing") === "true";
  const isModified = searchParams.get("modified") === "true";
  const from = searchParams.get("from");
  const changesRaw = searchParams.get("changes");
  const changes: Record<string, { label: string; from: string; to: string }> = changesRaw ? (() => { try { return JSON.parse(decodeURIComponent(changesRaw)); } catch { return {}; } })() : {};
  const [expanded, setExpanded] = useState(false);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const transferKey = `payslip_transferred_2025_10_${staffName}`;
  const [transferredAt, setTransferredAt] = useState<string | null>(() => localStorage.getItem(transferKey));
  const saveTransfer = (val: string | null) => { setTransferredAt(val); if (val) localStorage.setItem(transferKey, val); else localStorage.removeItem(transferKey); };
  const [transferConfirmOpen, setTransferConfirmOpen] = useState(false);
  const isTransferred = !!transferredAt;

  const fmtTransferTime = (iso: string) => {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '이체 완료';
    return `${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')} 이체 완료`;
  };

  const publishedAtRaw = localStorage.getItem(`payslip_published_${staffName}`) || searchParams.get("publishedAt");
  const isActuallyPublished = !isEditing && (isPaid || !!publishedAtRaw);

  const formatPublishedAt = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
  };

  const staff = PAYSLIP_STAFF.find(s => s.name === staffName) || PAYSLIP_STAFF[0];

  const contractInfo = {
    payDay: "15일",
    workSchedule: [
      { day: "월", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
      { day: "화", time: "08:00 ~ 22:00", shifts: ["오픈", "미들", "마감"] },
      { day: "수", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
      { day: "목", time: "08:00 ~ 16:00", shifts: ["오픈", "미들"] },
    ],
    hourlyWage: "11,000원",
    bank: "신한은행",
    account: "333333333333",
  };

  const parseAmt = (s: string) => parseInt(s.replace(/,/g, ''), 10) || 0;
  const fmt = (n: number) => n.toLocaleString();

  const BASE = {
    basePay: "1,617,000", overtimePay: "88,000", nightPay: "44,000",
    holidayPay: "55,000",
    weeklyAllowance: "319,000", otherAllowance: "0",
    incomeTax: "2,430", localTax: "243", nationalPension: "95,731",
    healthInsurance: "75,436", longTermCare: "9,762", employmentInsurance: "928",
  };

  const get = (key: keyof typeof BASE) => changes[key]?.to ?? BASE[key];

  const basePay      = get("basePay");
  const overtimePay  = get("overtimePay");
  const nightPay     = get("nightPay");
  const holidayPay   = get("holidayPay");
  const weeklyAllow  = get("weeklyAllowance");
  const otherAllow   = get("otherAllowance");
  const incomeTaxVal = get("incomeTax");
  const localTaxVal  = get("localTax");
  const pensionVal   = get("nationalPension");
  const healthVal    = get("healthInsurance");
  const ltcVal       = get("longTermCare");
  const employVal    = get("employmentInsurance");

  const totalPayNum      = parseAmt(basePay) + parseAmt(overtimePay) + parseAmt(nightPay) + parseAmt(holidayPay) + parseAmt(weeklyAllow) + parseAmt(otherAllow);
  const incomeTaxTotalNum = parseAmt(incomeTaxVal) + parseAmt(localTaxVal);
  const socialTotalNum   = parseAmt(pensionVal) + parseAmt(healthVal) + parseAmt(ltcVal) + parseAmt(employVal);
  const totalDeductionNum = incomeTaxTotalNum + socialTotalNum;
  const netSalaryNum     = totalPayNum - totalDeductionNum;

  const salaryInfo = {
    period: "2025.10.01 - 2025.10.31",
    totalPayment: `${fmt(totalPayNum)}원`,
    totalDeduction: `${fmt(totalDeductionNum)}원`,
    netSalary: fmt(netSalaryNum),
  };

  const workDetail = {
    workDays: "23일",
    actualHours: "147시간",
    overtimeHours: "8시간",
    nightHours: "4시간",
    holidayHours: "4시간 30분",
    weeklyAllowanceHours: "29시간",
    weeklyNote: "(1일 평균 근로시간 5.8 × 5주)",
    totalPayHours: "192시간 30분",
  };

  const payDetail = {
    basePay: { amount: `${basePay}원`, note: "(147시간)" },
    overtimePay: { amount: `${overtimePay}원`, note: "(8시간)" },
    nightPay: { amount: `${nightPay}원`, note: "(4시간)" },
    holidayPay: { amount: `${holidayPay}원`, note: "(4시간 30분)" },
    weeklyAllowance: { amount: `${weeklyAllow}원`, note: "(29시간)" },
    otherAllowance: { amount: `${otherAllow}원`, label: "(인센티브)" },
    totalPayment: `${fmt(totalPayNum)}원`,
  };

  const deductionDetail = {
    incomeTax: `${incomeTaxVal}원`,
    localTax: `${localTaxVal}원`,
    incomeTaxTotal: `${fmt(incomeTaxTotalNum)}원`,
    nationalPension: { amount: `${pensionVal}원`, note: "(근로자 부담 4.5%)" },
    healthInsurance: { amount: `${healthVal}원`, note: "(근로자 부담 3.545%)" },
    longTermCare: { amount: `${ltcVal}원`, note: "(건강보험료의 12.81%)" },
    employmentInsurance: { amount: `${employVal}원`, note: "(근로자 부담 0.9%)" },
    socialTotal: `${fmt(socialTotalNum)}원`,
    totalDeduction: `${fmt(totalDeductionNum)}원`,
  };

  const cumulativeSalary = { period: "2025.10.01 - 2025.10.31", amount: "3,450,000원" };

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
                  {isModified && <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF8F00', backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>수정됨</span>}
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
                  {isModified && <span style={{ fontSize: '11px', fontWeight: 700, color: '#FF8F00', backgroundColor: '#FFF3E0', padding: '2px 8px', borderRadius: '99px' }}>수정됨</span>}
                </div>
                <InfoRow label="기본급">
                  <div>
                    {payDetail.basePay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.basePay.note}</span>
                    {changes.basePay && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.basePay.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.basePay.to}원으로 수정</span></div>}
                  </div>
                </InfoRow>
                <InfoRow label="연장수당">
                  <div>
                    {payDetail.overtimePay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.overtimePay.note}</span>
                    <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 1.5배 (법정 기준)</span>
                    {changes.overtimePay && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.overtimePay.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.overtimePay.to}원으로 수정</span></div>}
                  </div>
                </InfoRow>
                <InfoRow label="야간수당">
                  <div>
                    {payDetail.nightPay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.nightPay.note}</span>
                    <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 0.5배 추가 (법정 기준)</span>
                    {changes.nightPay && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.nightPay.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.nightPay.to}원으로 수정</span></div>}
                  </div>
                </InfoRow>
                <InfoRow label="휴일수당">
                  <div>
                    {payDetail.holidayPay.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.holidayPay.note}</span>
                    <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>시급 11,000원 × 1.5배 (8시간 이내, 법정 기준)</span>
                    {changes.holidayPay && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.holidayPay.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.holidayPay.to}원으로 수정</span></div>}
                  </div>
                </InfoRow>
                <InfoRow label="주휴수당">
                  <div>
                    {payDetail.weeklyAllowance.amount}<span style={{ fontSize: '13px', color: '#9EA3AD' }}>{payDetail.weeklyAllowance.note}</span>
                    <br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>1일 평균 근로시간 5.8 × 5주 (주 15시간 이상 기준)</span>
                    {changes.weeklyAllowance && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.weeklyAllowance.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.weeklyAllowance.to}원으로 수정</span></div>}
                  </div>
                </InfoRow>
                <InfoRow label={<>기타 수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{payDetail.otherAllowance.label}</span></>}>
                  <div>
                    {payDetail.otherAllowance.amount}
                    {changes.otherAllowance && <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}><span style={{ fontSize: '12px', color: '#9EA3AD' }}>{changes.otherAllowance.from}원</span><span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span><span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{changes.otherAllowance.to}원으로 수정</span></div>}
                  </div>
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
                  onClick={() => navigate(`/owner/salary/payslip/edit?name=${encodeURIComponent(staff.name)}`)}
                  style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer' }}>
                  수정하기
                </button>
                <button
                  onClick={() => navigate(`/owner/salary/payslip/publish?name=${encodeURIComponent(staff.name)}${isModified ? "&modified=true" : ""}${changesRaw ? "&changes=" + encodeURIComponent(changesRaw) : ""}`)}
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
              <button onClick={() => { setTransferConfirmOpen(false); saveTransfer(new Date().toISOString()); }} style={{ flex: 1, height: '52px', borderRadius: '14px', border: 'none', fontSize: '15px', fontWeight: 700, color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>이체 완료</button>
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
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 {PAYSLIP_STAFF.filter(s => s.status === "지급 전").length}명</span>
              </div>
            </div>
            <div className="overflow-y-auto py-[10px]" style={{ maxHeight: '60vh' }}>
              {PAYSLIP_STAFF.filter(s => s.status === "지급 전").map((s, i) => (
                <button key={i} onClick={() => { setStaffPickerOpen(false); navigate(`/owner/salary/payslip?name=${encodeURIComponent(s.name)}`); }}
                  className="pressable w-full flex items-center justify-between px-6 py-[10px]"
                  style={{ backgroundColor: s.name === staff.name ? '#F0F4FF' : '#FFFFFF' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: s.avatarColor }}>{s.name.charAt(0)}</div>
                    <div className="text-left">
                      <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, color: s.name === staff.name ? '#4261FF' : '#19191B' }}>{s.name}</span>
                        {s.shifts.map(sh => <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[sh] || ''}`}>{sh}</span>)}
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{s.type}</span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{s.workDays}</span>
                    </div>
                  </div>
                  {s.name === staff.name && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4261FF', flexShrink: 0 }} />}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
