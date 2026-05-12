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

import { staffStore } from "@/lib/staffStore";

type SalaryType = "시급" | "월급" | "연봉";
interface StaffEntry {
  name: string; shifts: string[]; type: string; workDays: string;
  salaryType: SalaryType; hourlyWage: number; monthlyWage?: number; annualWage?: number;
  avatarColor: string;
}
const STAFF_LIST: StaffEntry[] = [];

interface DailySalaryDetail {
  base: number; workTime?: string; breakTime?: string; baseHours?: string;
  overtimeExtra?: string; overtime?: number; overtimeHours?: string;
  weekly?: number; weeklyNote?: string; incentive?: number;
  night?: number; nightHours?: string;
  holiday?: number; holidayHours?: string;
}

const STAFF_INDIVIDUAL_SALARY_DETAIL: Record<number, DailySalaryDetail> = {};

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

  const allStaffData = staffStore.getAll();
  const staffData = allStaffData.find(s => s.name === staffName) ?? allStaffData[0];
  const staff: StaffEntry | undefined = staffData ? {
    name: staffData.name,
    shifts: [...new Set(staffData.workSchedule.flatMap(w => w.shifts))],
    type: staffData.employmentType,
    workDays: staffData.workSchedule.map(w => w.day).join(', ') || '-',
    salaryType: staffData.salaryType.startsWith('시급') ? '시급' : '월급',
    hourlyWage: staffData.salaryType.startsWith('시급') ? Number(staffData.salaryAmount.replace(/,/g, '')) || 0 : 0,
    monthlyWage: !staffData.salaryType.startsWith('시급') ? Number(staffData.salaryAmount.replace(/,/g, '')) || 0 : undefined,
    avatarColor: staffData.avatarColor,
  } : undefined;
  const publishedAtRaw = typeof window !== 'undefined' ? localStorage.getItem(`payslip_published_${staffName}`) : null;
  
  const isPaidParam = searchParams.get("paid") === "true";
  const isPublished = isPaidParam;
  const fromParam = searchParams.get("from");

  if (!staff) {
    return (
      <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="pb-24">
          <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
            <div className="flex items-center gap-2 px-2 pt-4 pb-2">
              <button onClick={() => navigate(-1)} className="pressable p-1">
                <ChevronLeft className="h-6 w-6 text-foreground" />
              </button>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여 상세</h1>
            </div>
            <div className="border-b border-border" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 20px' }}>
            <p style={{ fontSize: '14px', color: '#9EA3AD' }}>급여 정보를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  const formatPublishedAt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const detail: DailySalaryDetail = STAFF_INDIVIDUAL_SALARY_DETAIL[dayNum] || { base: 0 };

  const monthDay = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_LABELS[date.getDay()]})`;
  const fmt = (n: number) => n.toLocaleString();
  const hourlyWage = staff.salaryType === "시급" ? (staff.hourlyWage || 0) : 0;

  const incentiveAmt = detail.incentive || 0;
  const totalPay = detail.base + (detail.overtime || 0) + (detail.weekly || 0) + (detail.night || 0) + incentiveAmt;

  const basePayLabel = () => {
    if (staff.salaryType === "시급") return `시급 ${fmt(hourlyWage)}원 기준`;
    if (staff.salaryType === "월급") return `월급 ${fmt(staff.monthlyWage || 0)}원 (일할 계산)`;
    return `연봉 ${((staff.annualWage || 0) / 10000).toFixed(0)}만원 (일할 계산)`;
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
            {staff.salaryType === "시급" ? `${fmt(hourlyWage)}원` : staff.salaryType === "월급" ? `${fmt(staff.monthlyWage || 0)}원` : `${((staff.annualWage || 0) / 10000).toFixed(0)}만원`}
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
