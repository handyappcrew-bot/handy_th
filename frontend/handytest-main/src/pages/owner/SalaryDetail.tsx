import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const SHIFT_BADGE: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const STAFF_LIST = [
  { name: "김정민", shifts: ["오픈"], type: "정규직", workDays: "월, 화, 수, 목, 금", salaryType: "시급" as const, hourlyWage: 10000, avatarColor: "#5C4033",
    salary: { workHours: "43h", overtime: "+4h 30m", basePay: 430000, overtimePay: 15195, weeklyPay: 12196, nightPay: 0, incentive: 0, totalPay: 457391,
      deductions: { incomeTax: 2060, localTax: 206, nationalPension: 20610, healthInsurance: 15550, longTermCare: 2010, employmentInsurance: 7770 } } },
  { name: "문자영", shifts: ["오픈", "미들"], type: "알바생", workDays: "월, 화", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#C0392B",
    salary: { workHours: "20h", overtime: null, basePay: 220000, overtimePay: 0, weeklyPay: 0, nightPay: 16500, incentive: 0, totalPay: 236500,
      deductions: { incomeTax: 1060, localTax: 106, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 4015 } } },
  { name: "정수민", shifts: ["미들"], type: "알바생", workDays: "월, 화, 수", salaryType: "월급" as const, monthlyWage: 1500000, avatarColor: "#F4D03F",
    salary: { workHours: "60h", overtime: "+2h", basePay: 1500000, overtimePay: 27500, weeklyPay: 0, nightPay: 0, incentive: 50000, totalPay: 1577500,
      deductions: { incomeTax: 25190, localTax: 2519, nationalPension: 71250, healthInsurance: 53925, longTermCare: 6970, employmentInsurance: 13500 } } },
  { name: "김수민", shifts: ["미들"], type: "알바생", workDays: "화, 수", salaryType: "연봉" as const, annualWage: 36000000, avatarColor: "#2C3E50",
    salary: { workHours: "80h", overtime: null, basePay: 3000000, overtimePay: 0, weeklyPay: 0, nightPay: 45000, incentive: 100000, totalPay: 3145000,
      deductions: { incomeTax: 130000, localTax: 13000, nationalPension: 135000, healthInsurance: 102060, longTermCare: 13190, employmentInsurance: 27000 } } },
  { name: "키키치", shifts: ["미들"], type: "알바생", workDays: "목", salaryType: "시급" as const, hourlyWage: 11000, avatarColor: "#8E44AD",
    salary: { workHours: "8h", overtime: null, basePay: 88000, overtimePay: 0, weeklyPay: 0, nightPay: 0, incentive: 0, totalPay: 88000,
      deductions: { incomeTax: 396, localTax: 39, nationalPension: 0, healthInsurance: 0, longTermCare: 0, employmentInsurance: 792 } } },
];

interface DailySalaryDetail {
  base: number; workTime?: string; breakTime?: string; baseHours?: string;
  overtimeExtra?: string; overtime?: number; overtimeHours?: string;
  weekly?: number; weeklyNote?: string; incentive?: number;
  night?: number; nightHours?: string;
  holiday?: number; holidayHours?: string;
}

const STAFF_INDIVIDUAL_SALARY_DETAIL: Record<number, DailySalaryDetail> = {
  1:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h" },
  5:  { base: 40000, workTime: "08:00 - 14:00", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h", overtime: 5500, overtimeHours: "13:00 - 14:00 / (1h, 시급 10,000원 × 1.5배)" },
  6:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", weekly: 8000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
  7:  { base: 45000, workTime: "08:00 - 13:30", breakTime: "30분", baseHours: "4h 30m", holiday: 6000, holidayHours: "08:00 - 13:30 / (4h 30m, 시급 10,000원 × 1.5배)" },
  8:  { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", night: 3000, nightHours: "22:00 - 23:00 / (1h, 시급 10,000원 × 0.5배 추가)" },
  10: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", incentive: 5000 },
  13: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h 12m", overtime: 6000, overtimeHours: "13:00 - 14:12 / (1h 12m, 시급 10,000원 × 1.5배)", incentive: 4000 },
  14: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", weekly: 9000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
  15: { base: 40000, workTime: "08:00 - 13:00", breakTime: "30분", baseHours: "4h", night: 5000, nightHours: "22:00 - 23:00 / (1h, 시급 10,000원 × 0.5배 추가)" },
  20: { base: 40000, workTime: "08:00 - 14:30", breakTime: "30분", baseHours: "4h", overtimeExtra: "+1h 30m", overtime: 7000, overtimeHours: "13:00 - 14:30 / (1h 30m, 시급 10,000원 × 1.5배)", weekly: 3000, weeklyNote: "주 15시간 이상 근무, 1일 평균 근로시간 × 주수" },
};

function InfoRow({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <div style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

export default function SalaryDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const staffName = searchParams.get("name") || "정수민";
  const dateStr = searchParams.get("date") || "2025-10-15";
  const date = new Date(dateStr);
  const dayNum = date.getDate();

  const staff = STAFF_LIST.find(s => s.name === staffName) || STAFF_LIST[0];
  const publishedAtRaw = typeof window !== 'undefined' ? localStorage.getItem(`payslip_published_${staffName}`) : null;
  
  const isPaidParam = searchParams.get("paid") === "true";
  const isPublished = isPaidParam;
  const fromParam = searchParams.get("from");

  const formatPublishedAt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const detail = STAFF_INDIVIDUAL_SALARY_DETAIL[dayNum] || {
    base: staff.salaryType !== "시급" ? Math.round((staff as any).monthlyWage ? (staff as any).monthlyWage / 22 : (staff as any).annualWage / 264) : 0,
    workTime: "08:00 - 13:00", breakTime: "30분"
  };

  const monthDay = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_LABELS[date.getDay()]})`;
  const fmt = (n: number) => n.toLocaleString();
  const hourlyWage = staff.salaryType === "시급" ? (staff as any).hourlyWage : 0;

  const incentiveAmt = detail.incentive || 0;
  const totalPay = detail.base + (detail.overtime || 0) + (detail.weekly || 0) + (detail.night || 0) + incentiveAmt;

  const basePayLabel = () => {
    if (staff.salaryType === "시급") return `시급 ${fmt(hourlyWage)}원 기준`;
    if (staff.salaryType === "월급") return `월급 ${fmt((staff as any).monthlyWage)}원 (일할 계산)`;
    return `연봉 ${((staff as any).annualWage / 10000).toFixed(0)}만원 (일할 계산)`;
  };

  const handleBack = () => {
    if (fromParam === 'all') navigate('/owner/salary', { replace: true });
    else if (fromParam === 'payslip') navigate(`/owner/salary/payslip?name=${encodeURIComponent(staffName)}`, { replace: true });
    else navigate(`/owner/salary?staff=${encodeURIComponent(staffName)}`, { replace: true });
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={handleBack} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여 상세</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* 발급 완료 배너 */}
        {isPublished && (
          <div style={{ padding: '10px 20px', backgroundColor: '#F7F8FF', borderBottom: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '13px', color: '#7488FE' }}>
              {publishedAtRaw ? `${formatPublishedAt(publishedAtRaw)}에 발급된 급여명세서예요` : '급여 명세서가 발급된 건이에요'}
            </span>
          </div>
        )}

        {/* 날짜 + 직원 */}
        <div style={{ padding: '16px 20px 4px', backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', margin: 0 }}>{monthDay}</p>
            {isPublished
              ? <span style={{ fontSize: '11px', fontWeight: 700, color: '#10C97D', backgroundColor: 'rgba(16,201,125,0.08)', border: '1px solid rgba(16,201,125,0.3)', borderRadius: '6px', padding: '2px 8px', flexShrink: 0 }}>발급 완료</span>
              : <span style={{ fontSize: '11px', fontWeight: 700, color: '#1EDC83', backgroundColor: '#ECFFF1', border: '1px solid #1EDC83', borderRadius: '6px', padding: '2px 8px', flexShrink: 0 }}>미발급</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: staff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
              {staff.name.charAt(0)}
            </div>
            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
              {staff.shifts.map(sh => <span key={sh} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE[sh] || ''}`}>{sh}</span>)}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{staff.type}</span>
            </div>
          </div>
          <InfoRow label="근무일">{staff.workDays}</InfoRow>
          <InfoRow label={staff.salaryType === "시급" ? "시급" : staff.salaryType === "월급" ? "월급" : "연봉"}>
            {staff.salaryType === "시급" ? `${fmt(hourlyWage)}원` : staff.salaryType === "월급" ? `${fmt((staff as any).monthlyWage)}원` : `${((staff as any).annualWage / 10000).toFixed(0)}만원`}
          </InfoRow>
          <InfoRow label="급여일">매월 15일</InfoRow>
        </div>

        <Divider thick />

        {/* 근무 정보 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>근무 정보</SectionTitle>
          {detail.workTime && (
            <InfoRow label="근무 시간">
              <div>
                <span>{detail.workTime}</span>
                {detail.overtimeHours && (
                  <span style={{ display: 'block', fontSize: '12px', color: '#FF862D', fontWeight: 600, marginTop: '4px' }}>
                    연장 {detail.overtimeHours.split(' / ')[0]}
                  </span>
                )}
                {detail.nightHours && (
                  <span style={{ display: 'block', fontSize: '12px', color: '#6B4FEC', fontWeight: 600, marginTop: '4px' }}>
                    야간 {detail.nightHours.split(' / ')[0]}
                  </span>
                )}
              </div>
            </InfoRow>
          )}
          {detail.breakTime && <InfoRow label="휴게 시간">{detail.breakTime}</InfoRow>}
          <InfoRow label="총 근무 시간">
            <span>
              {detail.baseHours || '4h'}
              {/* 1. 연장 색상 통일 */}
              {detail.overtimeExtra && <span style={{ color: '#FF862D', fontWeight: 600 }}> ({detail.overtimeExtra})</span>}
            </span>
          </InfoRow>
        </div>

        <Divider thick />

        {/* 기본 급여 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>기본 급여</SectionTitle>
          <InfoRow label="기본급">
            <div>
              <span style={{ fontWeight: 600 }}>{fmt(detail.base)}원</span>
              <span style={{ display: 'block', fontSize: '12px', color: '#9EA3AD', marginTop: '4px' }}>{basePayLabel()}</span>
            </div>
          </InfoRow>

          {/* 4. 없는 항목도 0원으로 항상 노출 */}
          </div>

        <Divider thick />

        {/* 추가 수당 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>추가 수당</SectionTitle>
          <InfoRow label={<span style={{ color: '#FF862D', fontWeight: 600 }}>연장 수당</span>}>
            <div>
              <span style={{ color: detail.overtime ? '#FF862D' : '#AAB4BF', fontWeight: 600 }}>
                {detail.overtime ? `+${fmt(detail.overtime)}원` : '0원'}
              </span>
              {detail.overtimeHours && detail.overtimeHours.split(' / ').map((line, i) => (
                <span key={i} style={{ display: 'block', fontSize: '12px', color: '#9EA3AD', marginTop: i === 0 ? '4px' : '2px' }}>{line}</span>
              ))}
            </div>
          </InfoRow>

          <InfoRow label={<span style={{ color: '#6B4FEC', fontWeight: 600 }}>야간 수당</span>}>
            <div>
              <span style={{ color: detail.night ? '#6B4FEC' : '#AAB4BF', fontWeight: 600 }}>
                {detail.night ? `+${fmt(detail.night)}원` : '0원'}
              </span>
              {detail.nightHours && detail.nightHours.split(' / ').map((line, i) => (
                <span key={i} style={{ display: 'block', fontSize: '12px', color: '#9EA3AD', marginTop: i === 0 ? '4px' : '2px' }}>{line}</span>
              ))}
            </div>
          </InfoRow>

          <InfoRow label={<span style={{ color: '#E05C00', fontWeight: 600 }}>휴일 수당</span>}>
            <div>
              <span style={{ color: detail.holiday ? '#E05C00' : '#AAB4BF', fontWeight: 600 }}>
                {detail.holiday ? `+${fmt(detail.holiday)}원` : '0원'}
              </span>
              {detail.holidayHours && detail.holidayHours.split(' / ').map((line, i) => (
                <span key={i} style={{ display: 'block', fontSize: '12px', color: '#9EA3AD', marginTop: i === 0 ? '4px' : '2px' }}>{line}</span>
              ))}
            </div>
          </InfoRow>

          <InfoRow label={<span style={{ color: '#213DD9', fontWeight: 600 }}>주휴 수당</span>}>
            <div>
              <span style={{ color: detail.weekly ? '#213DD9' : '#AAB4BF', fontWeight: 600 }}>
                {detail.weekly ? `+${fmt(detail.weekly)}원` : '0원'}
              </span>
              {detail.weeklyNote && <span style={{ display: 'block', fontSize: '12px', color: '#9EA3AD', marginTop: '4px' }}>{detail.weeklyNote}</span>}
            </div>
          </InfoRow>

          <InfoRow label={<span>기타 수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>(인센티브)</span></span>}>
            <span style={{ color: incentiveAmt > 0 ? '#10C97D' : '#AAB4BF', fontWeight: 600 }}>
              {incentiveAmt > 0 ? `+${fmt(incentiveAmt)}원` : '0원'}
            </span>
          </InfoRow>
        </div>

        <Divider thick />

        {/* 금일 급여액 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>금일 급여액</SectionTitle>
          <div style={{ backgroundColor: '#F0F4FF', borderRadius: '14px', padding: '14px 16px' }}>
            <p style={{ fontSize: '13px', color: '#70737B', margin: '0 0 8px' }}>
              기본급 {fmt(detail.base)}원
              {detail.overtime ? ` + 연장 ${fmt(detail.overtime)}원` : ''}
              {detail.night ? ` + 야간 ${fmt(detail.night)}원` : ''}
              {detail.holiday ? ` + 휴일 ${fmt(detail.holiday)}원` : ''}
              {detail.weekly ? ` + 주휴 ${fmt(detail.weekly)}원` : ''}
              {incentiveAmt > 0 ? ` + 인센티브 ${fmt(incentiveAmt)}원` : ''}
            </p>
            <p style={{ textAlign: 'right', fontSize: '22px', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em', margin: 0 }}>{fmt(totalPay)}원</p>
          </div>
        </div>

      </div>

      {/* 하단 버튼 — 상세 보기만, 수정은 버튼 클릭 후 수정 화면으로 이동 */}
      {createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderTop: '1px solid #F7F7F8' }}>
          <div style={{ maxWidth: '512px', margin: '0 auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {isPublished && (
              <p style={{ fontSize: '12px', color: '#9EA3AD', textAlign: 'center', margin: 0 }}>
                {publishedAtRaw ? `${formatPublishedAt(publishedAtRaw)}에 발급된 급여명세서예요` : '급여 명세서가 발급된 건이에요'}
              </p>
            )}
            {isPublished ? (
              <button
                onClick={() => navigate(`/owner/salary/payslip/publish?name=${encodeURIComponent(staffName)}&published=true&from=detail${publishedAtRaw ? '&publishedAt=' + encodeURIComponent(publishedAtRaw) : ''}`)}
                style={{ width: '100%', height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
                급여명세서 보기
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => navigate(`/owner/salary/detail/edit?name=${encodeURIComponent(staffName)}&date=${dateStr}`)}
                  style={{ flex: 1, height: '56px', backgroundColor: '#F0F4FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
                  급여 정보 수정하기
                </button>
                <button
                  onClick={() => navigate(`/owner/salary/payslip?name=${encodeURIComponent(staffName)}&from=detail`)}
                  style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', letterSpacing: '-0.02em' }}>
                  급여명세서 확인
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
