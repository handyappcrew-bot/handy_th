import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SHIFT_BADGE: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

function ConfirmPopup({ title, desc, cancelLabel = "취소", confirmLabel = "확인", onCancel, onConfirm, confirmDanger = false }: {
  title: string; desc: string; cancelLabel?: string; confirmLabel?: string;
  onCancel: () => void; onConfirm: () => void; confirmDanger?: boolean;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center" onClick={onCancel}>
      <div className="animate-in zoom-in-95" style={{ width: "calc(100% - 48px)", maxWidth: "320px", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "#70737B", textAlign: "center", marginBottom: "20px", lineHeight: "1.6", whiteSpace: "pre-line" }}>{desc}</p>
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <button onClick={onCancel} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>{cancelLabel}</button>
          <button onClick={onConfirm} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: confirmDanger ? "#FF5959" : "#4261FF", color: "#FFFFFF" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontSize: 'clamp(18px, 5vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '16px' }}>{children}</h3>;
}

function SubSectionTitle({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: '16px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '10px', marginTop: '4px' }}>{children}</p>;
}

function InfoRow({ label, children }: { label: string | React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '12px' }}>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B', flex: 1 }}>{children}</span>
    </div>
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

// 입력 바텀시트 — 숫자 입력 전용
function InputBottomSheet({ open, onClose, label, value, onConfirm, unit = "원" }: {
  open: boolean; onClose: () => void; label: string;
  value: string; onConfirm: (v: string) => void; unit?: string;
}) {
  // 숫자만 추출 후 콤마 포맷
  const toFormatted = (raw: string) => {
    const num = parseInt(raw.replace(/,/g, '').replace(/[^0-9]/g, ''), 10);
    return isNaN(num) ? "0" : num.toLocaleString();
  };

  const [local, setLocal] = useState(toFormatted(value));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setLocal(toFormatted(value));
      setTimeout(() => {
        inputRef.current?.focus();
        // 커서를 맨 끝으로
        const len = inputRef.current?.value.length || 0;
        inputRef.current?.setSelectionRange(len, len);
      }, 100);
    }
  }, [open, value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, '').replace(/[^0-9]/g, '');
    if (raw === '') { setLocal('0'); return; }
    const num = parseInt(raw, 10);
    setLocal(num.toLocaleString());
  };

  const handleConfirm = () => { onConfirm(local); onClose(); };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={onClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{label}</h2>
            <button onClick={onClose} className="pressable">
              <X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} />
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', height: '52px', padding: '0 16px', border: '2px solid #4261FF', borderRadius: '10px', backgroundColor: '#FFFFFF', marginBottom: '16px' }}>
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              data-no-focus
              value={local}
              onChange={handleChange}
              onKeyDown={e => e.key === 'Enter' && handleConfirm()}
              className="min-w-0 w-full bg-transparent text-right"
              style={{ fontSize: '18px', fontWeight: 600, color: '#19191B', outline: 'none' }}
            />
            <span style={{ fontSize: '16px', color: '#AAB4BF', marginLeft: '8px', flexShrink: 0 }}>{unit}</span>
          </div>
          <button onClick={handleConfirm}
            style={{ width: '100%', height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
            입력 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// 클릭하면 바텀시트 여는 행
function EditRow({ label, value, onEdit, subNote, originalValue }: {
  label: React.ReactNode; value: string; onEdit: () => void; subNote?: string; originalValue?: string;
}) {
  const [pressed, setPressed] = useState(false);
  const isChanged = originalValue !== undefined && value !== originalValue;
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '6px' }}>
        <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', width: '114px', flexShrink: 0, paddingTop: '14px' }}>{label}</span>
        <button
          onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)} onMouseLeave={() => setPressed(false)}
          onTouchStart={() => setPressed(true)} onTouchEnd={() => setPressed(false)}
          onClick={onEdit}
          style={{ flex: 1, height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '0 16px', border: pressed ? '2px solid #4261FF' : isChanged ? '2px solid #FF8F00' : '1px solid #DBDCDF', borderRadius: '10px', backgroundColor: isChanged ? '#FFFBF5' : '#FFFFFF', cursor: 'pointer', transition: 'border 0.15s', gap: '8px' }}>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{value}</span>
          <span style={{ fontSize: '16px', color: '#AAB4BF' }}>원</span>
        </button>
      </div>
      {isChanged && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{originalValue}원</span>
          <span style={{ fontSize: '11px', color: '#9EA3AD' }}>→</span>
          <span style={{ fontSize: '12px', color: '#FF8F00', fontWeight: 600 }}>{value}원으로 수정</span>
        </div>
      )}
      {subNote && <p style={{ fontSize: '12px', color: '#9EA3AD', textAlign: 'right' }}>{subNote}</p>}
    </div>
  );
}

// 금액 파싱 (콤마 제거 후 숫자)
const parseAmt = (s: string) => parseInt(s.replace(/,/g, ''), 10) || 0;
// 숫자 → 콤마 포맷
const fmt = (n: number) => n.toLocaleString();

export default function PayslipEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const staffName = searchParams.get("name") || "김정민";
  const isPublished = typeof window !== 'undefined' && (!!localStorage.getItem(`payslip_published_${staffName}`));
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [saveConfirmOpen, setSaveConfirmOpen] = useState(false);
  const [activeSheet, setActiveSheet] = useState<string | null>(null);

  // 초기값 (isDirty 비교용)
  const INITIAL = {
    basePay: "1,617,000", overtimePay: "88,000", nightPay: "44,000",
    holidayPay: "55,000",
    weeklyAllowance: "319,000", otherAllowance: "0",
    incomeTax: "2,430", localTax: "243", nationalPension: "95,731",
    healthInsurance: "75,436", longTermCare: "9,762", employmentInsurance: "928",
  };

  // 지급 내역
  const [basePay, setBasePay] = useState(INITIAL.basePay);
  const [overtimePay, setOvertimePay] = useState(INITIAL.overtimePay);
  const [nightPay, setNightPay] = useState(INITIAL.nightPay);
  const [holidayPay, setHolidayPay] = useState(INITIAL.holidayPay);
  const [weeklyAllowance, setWeeklyAllowance] = useState(INITIAL.weeklyAllowance);
  const [otherAllowance, setOtherAllowance] = useState(INITIAL.otherAllowance);

  // 공제 내역
  const [incomeTax, setIncomeTax] = useState(INITIAL.incomeTax);
  const [localTax, setLocalTax] = useState(INITIAL.localTax);
  const [nationalPension, setNationalPension] = useState(INITIAL.nationalPension);
  const [healthInsurance, setHealthInsurance] = useState(INITIAL.healthInsurance);
  const [longTermCare, setLongTermCare] = useState(INITIAL.longTermCare);
  const [employmentInsurance, setEmploymentInsurance] = useState(INITIAL.employmentInsurance);

  const staff = { name: staffName, shifts: ["오픈"], type: "정규직", birth: "2001.01.17", phone: "010-5713-0208", avatarColor: "#F4D03F" };

  // 합계 계산
  const totalPay = parseAmt(basePay) + parseAmt(overtimePay) + parseAmt(nightPay) + parseAmt(holidayPay) + parseAmt(weeklyAllowance) + parseAmt(otherAllowance);
  const incomeTaxTotal = parseAmt(incomeTax) + parseAmt(localTax);
  const socialTotal = parseAmt(nationalPension) + parseAmt(healthInsurance) + parseAmt(longTermCare) + parseAmt(employmentInsurance);
  const totalDeduction = incomeTaxTotal + socialTotal;
  const netPay = totalPay - totalDeduction;

  const isDirty = basePay !== INITIAL.basePay || overtimePay !== INITIAL.overtimePay ||
    nightPay !== INITIAL.nightPay || holidayPay !== INITIAL.holidayPay ||
    weeklyAllowance !== INITIAL.weeklyAllowance ||
    otherAllowance !== INITIAL.otherAllowance || incomeTax !== INITIAL.incomeTax ||
    localTax !== INITIAL.localTax || nationalPension !== INITIAL.nationalPension ||
    healthInsurance !== INITIAL.healthInsurance || longTermCare !== INITIAL.longTermCare ||
    employmentInsurance !== INITIAL.employmentInsurance;

  const handleBack = () => { if (isDirty) setCancelConfirmOpen(true); else navigate(-1); };
  const handleSave = () => { setSaveConfirmOpen(true); };
  const handleSaveConfirm = () => {
    setSaveConfirmOpen(false);
    toast({ description: "급여명세서가 수정되었어요.", duration: 2000 });
    // 수정된 항목 수집
    const changes: Record<string, { label: string; from: string; to: string }> = {};
    const fieldLabels: Record<string, string> = {
      basePay: "기본급", overtimePay: "연장수당", nightPay: "야간수당",
      holidayPay: "휴일수당", weeklyAllowance: "주휴수당", otherAllowance: "기타 수당",
      incomeTax: "소득세", localTax: "지방소득세", nationalPension: "국민연금",
      healthInsurance: "건강보험", longTermCare: "장기요양보험", employmentInsurance: "고용보험",
    };
    const current: Record<string, string> = { basePay, overtimePay, nightPay, holidayPay, weeklyAllowance, otherAllowance, incomeTax, localTax, nationalPension, healthInsurance, longTermCare, employmentInsurance };
    Object.keys(INITIAL).forEach(key => {
      if (current[key] !== INITIAL[key as keyof typeof INITIAL]) {
        changes[key] = { label: fieldLabels[key], from: INITIAL[key as keyof typeof INITIAL], to: current[key] };
      }
    });
    const hasModified = Object.keys(changes).length > 0;
    const changesParam = hasModified ? `&changes=${encodeURIComponent(JSON.stringify(changes))}` : "";
    setTimeout(() => navigate(`/owner/salary/payslip?name=${encodeURIComponent(staffName)}&editing=true${hasModified ? "&modified=true" : ""}${changesParam}`, { replace: true }), 500);
  };

  const sheets: Record<string, { label: string; value: string; setter: (v: string) => void; subNote?: string }> = {
    basePay: { label: "기본급", value: basePay, setter: setBasePay, subNote: "147시간" },
    overtimePay: { label: "연장수당", value: overtimePay, setter: setOvertimePay, subNote: "시급 11,000원 × 1.5배 (법정 기준) · 8시간" },
    nightPay: { label: "야간수당", value: nightPay, setter: setNightPay, subNote: "시급 11,000원 × 0.5배 추가 (법정 기준) · 4시간" },
    holidayPay: { label: "휴일수당", value: holidayPay, setter: setHolidayPay, subNote: "시급 11,000원 × 1.5배 (8시간 이내, 법정 기준) · 4시간 30분" },
    weeklyAllowance: { label: "주휴수당", value: weeklyAllowance, setter: setWeeklyAllowance, subNote: "1일 평균 근로시간 5.8 × 5주 = 29시간" },
    otherAllowance: { label: "기타 수당 (인센티브)", value: otherAllowance, setter: setOtherAllowance },
    incomeTax: { label: "소득세", value: incomeTax, setter: setIncomeTax, subNote: "근로자 부담 3%" },
    localTax: { label: "지방소득세", value: localTax, setter: setLocalTax, subNote: "소득세의 10%" },
    nationalPension: { label: "국민연금", value: nationalPension, setter: setNationalPension, subNote: "근로자 부담 4.5%" },
    healthInsurance: { label: "건강보험", value: healthInsurance, setter: setHealthInsurance, subNote: "근로자 부담 3.545%" },
    longTermCare: { label: "장기요양보험", value: longTermCare, setter: setLongTermCare, subNote: "건강보험료의 12.81%" },
    employmentInsurance: { label: "고용보험", value: employmentInsurance, setter: setEmploymentInsurance, subNote: "근로자 부담 0.9%" },
  };

  const active = activeSheet ? sheets[activeSheet] : null;

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ minHeight: '100dvh' }}>
      <div className="pb-32">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={handleBack} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여명세서 수정</h1>
            </div>
          </div>
          <div className="border-b border-border" />
        </div>

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
            </div>
          </div>
          <InfoRow label="생년월일">{staff.birth}</InfoRow>
          <InfoRow label="전화번호">{staff.phone}</InfoRow>
        </div>

        <Divider thick />

        {/* 근무 내역 (읽기전용) */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>근무 내역</SectionTitle>
          <InfoRow label="근로일수">23일</InfoRow>
          <InfoRow label="실근로시간">147시간</InfoRow>
          <InfoRow label="연장근로시간">8시간</InfoRow>
          <InfoRow label="야간근로시간">4시간</InfoRow>
          <InfoRow label="휴일근로시간">4시간 30분</InfoRow>
          <InfoRow label="주휴수당시간">
            <div>
              <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>29시간</span>
              <br />
              <span style={{ fontSize: '12px', color: '#9EA3AD' }}>(1일 평균 근로시간 5.8 × 5주)</span>
            </div>
          </InfoRow>
          <InfoRow label="총 지급시간">188시간</InfoRow>
        </div>

        <Divider thick />

        {/* 지급 내역 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>지급 내역</SectionTitle>
          <EditRow label="기본급" value={basePay} onEdit={() => setActiveSheet("basePay")} subNote="147시간" originalValue={INITIAL.basePay} />
          <EditRow label={<>연장수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>× 1.5배 (법정)</span></>} value={overtimePay} onEdit={() => setActiveSheet("overtimePay")} subNote="시급 11,000원 × 1.5배 · 8시간" originalValue={INITIAL.overtimePay} />
          <EditRow label={<>야간수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>× 0.5배 추가</span></>} value={nightPay} onEdit={() => setActiveSheet("nightPay")} subNote="시급 11,000원 × 0.5배 추가 · 4시간" originalValue={INITIAL.nightPay} />
          <EditRow label={<>휴일수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>× 1.5배 (8h↓)</span></>} value={holidayPay} onEdit={() => setActiveSheet("holidayPay")} subNote="시급 11,000원 × 1.5배 · 4시간 30분" originalValue={INITIAL.holidayPay} />
          <EditRow label={<>주휴수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>평균 5.8h × 5주</span></>} value={weeklyAllowance} onEdit={() => setActiveSheet("weeklyAllowance")} subNote="29시간" originalValue={INITIAL.weeklyAllowance} />
          <EditRow label={<>기타 수당<br /><span style={{ fontSize: '12px', color: '#9EA3AD' }}>(인센티브)</span></>} value={otherAllowance} onEdit={() => setActiveSheet("otherAllowance")} originalValue={INITIAL.otherAllowance} />

          {/* 지급액 합계 카드 */}
          <div style={{ backgroundColor: '#F0F4FF', borderRadius: '12px', padding: '14px 16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>지급액 합계</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em' }}>{fmt(totalPay)}원</span>
            </div>
          </div>
        </div>

        <Divider thick />

        {/* 공제 내역 */}
        <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF' }}>
          <SectionTitle>공제 내역</SectionTitle>

          <SubSectionTitle>소득세</SubSectionTitle>
          <div style={{ paddingLeft: '8px' }}>
            <EditRow label="소득세" value={incomeTax} onEdit={() => setActiveSheet("incomeTax")} subNote="근로자 부담 3%" originalValue={INITIAL.incomeTax} />
            <EditRow label="지방소득세" value={localTax} onEdit={() => setActiveSheet("localTax")} subNote="소득세의 10%" originalValue={INITIAL.localTax} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 0', borderTop: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#19191B' }}>소득세 합계</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#19191B' }}>{fmt(incomeTaxTotal)}원</span>
          </div>

          <SubSectionTitle>4대 보험</SubSectionTitle>
          <div style={{ paddingLeft: '8px' }}>
            <EditRow label="국민연금" value={nationalPension} onEdit={() => setActiveSheet("nationalPension")} subNote="근로자 부담 4.5%" originalValue={INITIAL.nationalPension} />
            <EditRow label="건강보험" value={healthInsurance} onEdit={() => setActiveSheet("healthInsurance")} subNote="근로자 부담 3.545%" originalValue={INITIAL.healthInsurance} />
            <EditRow label="장기요양보험" value={longTermCare} onEdit={() => setActiveSheet("longTermCare")} subNote="건강보험료의 12.81%" originalValue={INITIAL.longTermCare} />
            <EditRow label="고용보험" value={employmentInsurance} onEdit={() => setActiveSheet("employmentInsurance")} subNote="근로자 부담 0.9%" originalValue={INITIAL.employmentInsurance} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', padding: '8px 0', borderTop: '1px solid #F0F0F0' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#19191B' }}>4대보험 합계</span>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#19191B' }}>{fmt(socialTotal)}원</span>
          </div>

          {/* 총 공제액 */}
          <div style={{ backgroundColor: '#F7F7F8', borderRadius: '12px', padding: '14px 16px', marginTop: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>총 공제액</span>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{fmt(totalDeduction)}원</span>
            </div>
          </div>

          {/* 실지급액 카드 */}
          <div style={{ backgroundColor: '#F0F4FF', borderRadius: '12px', padding: '14px 16px', marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
              <span style={{ fontSize: '15px', fontWeight: 700, color: '#4261FF' }}>실 지급액</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#4261FF', letterSpacing: '-0.02em' }}>{fmt(netPay)}원</span>
            </div>
            <div style={{ height: '1px', backgroundColor: 'rgba(66,97,255,0.15)', marginBottom: '10px' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', color: '#70737B' }}>지급액 합계</span>
              <span style={{ fontSize: '13px', color: '#19191B', fontWeight: 500 }}>{fmt(totalPay)}원</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '13px', color: '#70737B' }}>총 공제액</span>
              <span style={{ fontSize: '13px', color: '#19191B', fontWeight: 500 }}>- {fmt(totalDeduction)}원</span>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 버튼 */}
      {createPortal(
        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
          <div style={{ maxWidth: "512px", margin: "0 auto", padding: "16px 20px", display: "flex", gap: "8px" }}>
            {isPublished ? (
              <>
                <button onClick={handleBack}
                  style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer' }}>
                  취소
                </button>
                <button onClick={handleSave}
                  style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
                  급여명세서 수정하기
                </button>
              </>
            ) : (
              <>
                <button onClick={handleBack}
                  style={{ width: '122px', height: '56px', flexShrink: 0, backgroundColor: '#DEEBFF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#4261FF', cursor: 'pointer' }}>
                  취소
                </button>
                <button onClick={handleSave}
                  style={{ flex: 1, height: '56px', backgroundColor: '#4261FF', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer' }}>
                  수정하기
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}

      {/* 입력 바텀시트 */}
      {active && (
        <InputBottomSheet
          open={!!activeSheet}
          onClose={() => setActiveSheet(null)}
          label={active.label}
          value={active.value}
          onConfirm={active.setter}
        />
      )}

      {saveConfirmOpen && <ConfirmPopup
        title="급여명세서 수정"
        desc={"입력한 내용으로 급여 명세서를 수정하시겠어요?"}
        cancelLabel="취소"
        confirmLabel="확인"
        onCancel={() => setSaveConfirmOpen(false)}
        onConfirm={handleSaveConfirm}
      />}

      {cancelConfirmOpen && <ConfirmPopup
        title="급여명세서 수정 취소"
        desc={"수정 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?"}
        cancelLabel="취소"
        confirmLabel="확인"
        onCancel={() => setCancelConfirmOpen(false)}
        onConfirm={() => { setCancelConfirmOpen(false); navigate(-1); }}
      />}
    </div>
  );
}
