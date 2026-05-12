import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

const DISTANCE_OPTIONS = ["10m", "50m", "100m", "200m"];
const LATE_OPTIONS = ["0분", "5분", "10분", "15분", "20분"];
const OVERTIME_RATE_OPTIONS = ["1.5배 (법정 기준)", "2배 (법정 기준)", "직접 입력"];
const NIGHT_METHOD_OPTIONS = ["미적용", "적용"];
const HOLIDAY_METHOD_OPTIONS = ["미적용", "적용"];

function SelectDrawer({ open, onOpenChange, title, subtitle, options, currentValue, onSelect, allowCustomInput }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string; subtitle?: string;
  options: string[]; currentValue: string; onSelect: (v: string) => void; allowCustomInput?: boolean;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customValue, setCustomValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { if (open) { setShowCustom(false); setCustomValue(""); } }, [open]);
  useEffect(() => { if (showCustom && inputRef.current) inputRef.current.focus(); }, [showCustom]);
  const isCustomValue = allowCustomInput && currentValue && !options.includes(currentValue);
  const handleCustomConfirm = () => {
    if (customValue.trim()) { onSelect(customValue.trim().replace(/배$/, "") + "배"); onOpenChange(false); }
  };
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        {subtitle && <p style={{ padding: "0 20px", fontSize: "13px", color: "#4261FF", marginBottom: "8px" }}>{subtitle}</p>}
        <div style={{ padding: "0 20px 20px" }} className="space-y-1">
          {options.map((opt) => {
            const isCustomOpt = opt === "직접 입력";
            const selected = isCustomOpt ? (isCustomValue || showCustom) : (!showCustom && opt === currentValue);
            return (
              <div key={opt}>
                <button onClick={() => { if (isCustomOpt && allowCustomInput) setShowCustom(true); else { onSelect(opt); onOpenChange(false); } }}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-[15px] transition-colors ${selected ? "bg-primary/10 text-primary font-medium" : "text-foreground"}`}>
                  <span>{opt}</span>
                  {selected && <Check className="w-5 h-5 text-primary" />}
                </button>
                {isCustomOpt && showCustom && (
                  <div className="mt-2 px-1 pb-2 space-y-3">
                    <div className="flex items-center gap-2">
                      <input ref={inputRef} type="number" inputMode="decimal" step="0.1" placeholder="예: 1.5" value={customValue}
                        onChange={e => setCustomValue(e.target.value)} onKeyDown={e => e.key === "Enter" && handleCustomConfirm()}
                        className="flex-1 border border-border rounded-xl px-4 py-3 text-[15px] text-foreground bg-background outline-none focus:border-primary transition-colors" />
                      <span className="text-[15px] text-muted-foreground shrink-0">배</span>
                    </div>
                    <button onClick={handleCustomConfirm} disabled={!customValue.trim()}
                      style={{ width: "100%", height: "52px", borderRadius: "12px", backgroundColor: customValue.trim() ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "15px", fontWeight: 700, color: "#FFFFFF", cursor: customValue.trim() ? "pointer" : "default" }}>
                      입력완료
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ScrollPickerDrawer({ open, onOpenChange, title, options, currentValue, onSelect }: {
  open: boolean; onOpenChange: (v: boolean) => void; title: string;
  options: string[]; currentValue: string; onSelect: (v: string) => void;
}) {
  const [selectedIdx, setSelectedIdx] = useState(() => { const idx = options.indexOf(currentValue); return idx >= 0 ? idx : 0; });
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_HEIGHT = 44;
  useEffect(() => {
    if (open) {
      const idx = options.indexOf(currentValue);
      setSelectedIdx(idx >= 0 ? idx : 0);
      setTimeout(() => { if (containerRef.current) containerRef.current.scrollTop = (idx >= 0 ? idx : 0) * ITEM_HEIGHT; }, 100);
    }
  }, [open, currentValue, options]);
  const handleScroll = () => {
    if (!containerRef.current) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
    setSelectedIdx(Math.max(0, Math.min(idx, options.length - 1)));
  };
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 touch-none" onClick={() => onOpenChange(false)}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF" }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "30px 20px 20px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
          <button className="pressable" onClick={() => onOpenChange(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
        </div>
        <div className="relative h-[220px] overflow-hidden mx-5 mb-6">
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[44px] bg-primary/10 rounded-xl z-0 pointer-events-none" />
          <div ref={containerRef} onScroll={handleScroll} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory scrollbar-hide" style={{ paddingTop: 88, paddingBottom: 88 }}>
            {options.map((opt, i) => (
              <div key={opt}
                className={`h-[44px] flex items-center justify-center snap-center text-[16px] transition-all ${i === selectedIdx ? "text-foreground font-bold scale-105" : "text-muted-foreground/50"}`}
                onClick={() => {
                  setSelectedIdx(i);
                  if (containerRef.current) containerRef.current.scrollTo({ top: i * ITEM_HEIGHT, behavior: "smooth" });
                  onSelect(options[i]);
                  setTimeout(() => onOpenChange(false), 300);
                }}>
                {opt}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ToggleChips({ label, value, options, onChange, subText }: {
  label: string; value: string; options: [string, string]; onChange: (v: string) => void; subText?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '10px' }}>
        {label} <span style={{ color: '#FF3D3D' }}>*</span>
      </label>
      <div style={{ display: 'flex', gap: '8px' }}>
        {options.map(opt => {
          const active = value === opt;
          return (
            <button key={opt} onClick={() => onChange(opt)}
              style={{ flex: 1, height: '44px', borderRadius: '10px', fontSize: '14px', fontWeight: 600, border: active ? '2px solid #4261FF' : '1px solid #DBDCDF', backgroundColor: active ? '#F0F4FF' : '#FFFFFF', color: active ? '#4261FF' : '#70737B', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {active && <Check style={{ width: '14px', height: '14px' }} />}
              {opt}
            </button>
          );
        })}
      </div>
      {subText && <p className="text-[13px]" style={{ color: value === options[0] ? '#4261FF' : '#AAB4BF', marginTop: '6px' }}>{subText}</p>}
    </div>
  );
}

function FieldButton({ label, value, placeholder, onClick, focused, onFocus, onBlur, subText }: {
  label: string; value: string; placeholder: string; onClick: () => void;
  focused: boolean; onFocus: () => void; onBlur: () => void; subText?: string;
}) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '10px' }}>
        {label} <span style={{ color: '#FF3D3D' }}>*</span>
      </label>
      <button onClick={onClick} onMouseDown={onFocus} onMouseUp={onBlur} onMouseLeave={onBlur} onTouchStart={onFocus} onTouchEnd={onBlur}
        className="w-full flex items-center justify-between bg-background"
        style={{ height: '52px', padding: '0 20px', border: focused ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s', marginBottom: subText ? '6px' : '0' }}>
        <span className={value ? "text-foreground" : "text-muted-foreground"} style={{ fontSize: '15px' }}>{value || placeholder}</span>
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      </button>
      {subText && <p className="text-[13px]" style={{ color: '#AAB4BF' }}>{subText}</p>}
    </div>
  );
}

function SectionNotice({ text }: { text: React.ReactNode }) {
  return (
    <div style={{ backgroundColor: '#F7F7F8', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px' }}>
      <p style={{ fontSize: '13px', color: '#70737B', fontWeight: 400, margin: 0, lineHeight: '1.6' }}>{text}</p>
    </div>
  );
}

export default function AttendanceStandard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // ── 플로우 스텝 ──
  const [step, setStep] = useState<1 | 2>(1);

  // ── Step 1: 출퇴근·지각 ──
  const [distance, setDistance] = useState("");
  const [lateStandard, setLateStandard] = useState("");

  // ── Step 2: 연장 수당 ──
  const [overtimeMethod, setOvertimeMethod] = useState("");
  const [overtimeDaily, setOvertimeDaily] = useState("지급");
  const [overtimeWeekly, setOvertimeWeekly] = useState("지급");
  const [overtimeRate, setOvertimeRate] = useState("1.5배 (법정 기준)");
  const [overtimeUnit, setOvertimeUnit] = useState("");

  // ── Step 2: 야간 수당 ──
  const [nightMethod, setNightMethod] = useState("");
  const [nightRate, setNightRate] = useState("1.5배 (법정 기준)");
  const [nightUnit, setNightUnit] = useState("");

  // ── Step 2: 휴일 수당 ──
  const [holidayMethod, setHolidayMethod] = useState("");
  const [holidayRateUnder8, setHolidayRateUnder8] = useState("1.5배 (법정 기준)");
  const [holidayRateOver8, setHolidayRateOver8] = useState("2배 (법정 기준)");
  const [holidayUnit, setHolidayUnit] = useState("");

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── 드로어 open 상태 ──
  const [distanceOpen, setDistanceOpen] = useState(false);
  const [lateOpen, setLateOpen] = useState(false);
  const [overtimeRateOpen, setOvertimeRateOpen] = useState(false);
  const [nightMethodOpen, setNightMethodOpen] = useState(false);
  const [nightRateOpen, setNightRateOpen] = useState(false);
  const [holidayMethodOpen, setHolidayMethodOpen] = useState(false);
  const [holidayRateUnder8Open, setHolidayRateUnder8Open] = useState(false);
  const [holidayRateOver8Open, setHolidayRateOver8Open] = useState(false);

  const isOvertimePaid = overtimeMethod && overtimeMethod !== "미지급";
  const isOvertimeConditional = overtimeMethod === "지급 (법정 기준 · 하루 8시간 및 주 40시간 초과 시)";
  const isNightPaid = nightMethod === "적용";
  const isHolidayPaid = holidayMethod === "적용";

  const isStep1Complete = !!(distance && lateStandard);
  const isStep2Complete = (() => {
    if (!overtimeMethod || !nightMethod || !holidayMethod) return false;
    if (isOvertimePaid && !overtimeUnit) return false;
    if (isNightPaid && !nightUnit) return false;
    if (isHolidayPaid && !holidayUnit) return false;
    return true;
  })();

  const handleBack = () => {
    if (step === 2) setStep(1);
    else navigate(-1);
  };

  const handleNext = () => {
    window.scrollTo(0, 0);
    setStep(2);
  };

  const handleSave = () => {
    setConfirmOpen(false);
    toast({ description: "근태 기준이 저장되었어요", duration: 2000 });
    setTimeout(() => navigate(-1), 500);
  };

  const f = (field: string) => ({
    focused: focusedField === field,
    onFocus: () => setFocusedField(field),
    onBlur: () => setFocusedField(null),
  });

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* ── 헤더 ── */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={handleBack} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>근태 기준 설정</h1>
          </div>

          {/* 진행 표시바 */}
          <div style={{ display: 'flex', gap: '6px', padding: '0 20px 8px' }}>
            {([1, 2] as const).map(s => (
              <div key={s} style={{ flex: 1, height: '4px', borderRadius: '99px', backgroundColor: s <= step ? '#4261FF' : '#DBDCDF', transition: 'background-color 0.3s' }} />
            ))}
          </div>
          {/* 스텝 레이블 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 20px 10px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: step === 1 ? '#4261FF' : '#AAB4BF' }}>
              {step === 1 ? '① 출퇴근 · 지각 기준' : '① 완료'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 600, color: step === 2 ? '#4261FF' : '#AAB4BF' }}>
              {step === 2 ? '② 연장 · 야간 수당' : '② 수당 기준'}
            </span>
          </div>

          <div className="border-b border-border" />
        </div>

        {/* ══════════════════════════════════
            STEP 1 — 출퇴근 허용거리 + 지각 기준
        ══════════════════════════════════ */}
        {step === 1 && (
          <div className="px-5 pt-6">

            <div style={{ marginBottom: '8px' }}>
              <h2 className="text-[16px] font-bold text-foreground" style={{ marginBottom: '16px' }}>출퇴근 허용 거리 설정</h2>
              <FieldButton label="출퇴근 허용 거리" value={distance} placeholder="거리 선택" onClick={() => setDistanceOpen(true)} {...f("distance")}
                subText="*직원이 매장으로부터 설정한 거리 안에 있을 때만 출퇴근 기록이 가능해요" />
            </div>

            <div style={{ marginTop: '16px' }}>
              <h2 className="text-[16px] font-bold text-foreground" style={{ marginBottom: '16px' }}>지각 기준 설정</h2>
              <FieldButton label="지각 기준" value={lateStandard} placeholder="지각 기준 선택" onClick={() => setLateOpen(true)} {...f("late")}
                subText="*출근 시간 기준, 설정한 분이 지난 후 출근하면 지각으로 처리돼요" />
            </div>

            {/* 둘 다 선택 시 요약 카드 */}
            {isStep1Complete && (
              <div style={{ backgroundColor: '#F0F4FF', borderRadius: '12px', padding: '14px 16px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#4261FF', margin: 0 }}>✓ 설정 확인</p>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#70737B' }}>허용 거리</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#19191B' }}>{distance}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', color: '#70737B' }}>지각 기준</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: '#19191B' }}>출근 시간 {lateStandard} 초과 시</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════
            STEP 2 — 연장 수당 + 야간 수당
        ══════════════════════════════════ */}
        {step === 2 && (
          <div className="px-5 pt-6">

            {/* 공통 안내 */}
            <SectionNotice text={<>5인 미만 사업장은 연장·야간·휴일 수당 지급 의무가 없어요. 법적 의무 대상이거나 자율 지급하려면 <b style={{ color: '#19191B' }}>적용</b>으로 설정해 주세요.</>} />

            {/* 연장 수당 */}
            <div style={{ marginBottom: '8px' }}>
              <h2 className="text-[16px] font-bold text-foreground" style={{ marginBottom: '8px' }}>연장 수당 기준 설정</h2>

              {/* 지급 방식 토글 */}
              <ToggleChips
                label="연장 근무 수당 지급 방식"
                value={overtimeMethod === "미지급" ? "미적용" : overtimeMethod ? "적용" : ""}
                options={["적용", "미적용"]}
                onChange={v => {
                  if (v === "미적용") { setOvertimeMethod("미지급"); setOvertimeRate("1.5배 (법정 기준)"); setOvertimeUnit(""); }
                  else { setOvertimeMethod("지급 (법정 기준 · 하루 8시간 및 주 40시간 초과 시)"); }
                }}
                subText={overtimeMethod === "미지급" ? "✗ 연장 근무를 해도 추가 수당을 지급하지 않아요" : overtimeMethod ? "✓ 연장 근무 시 수당이 자동 계산돼요" : undefined}
              />

              {/* 법정 기준 선택 시: 조건 세부 설정 */}
              {isOvertimePaid && isOvertimeConditional && (
                <div style={{ backgroundColor: '#F7F7F8', borderRadius: '14px', padding: '16px', marginBottom: '24px', border: '1px solid #EBEBEB' }}>
                  <p style={{ fontSize: '13px', fontWeight: 700, color: '#4261FF', marginBottom: '4px' }}>수당 발생 조건 선택</p>
                  <p style={{ fontSize: '12px', color: '#70737B', marginBottom: '14px', lineHeight: '1.5' }}>아래 두 조건 중 적용할 항목을 켜주세요. 둘 다 켜도 돼요.</p>

                  {/* 하루 8시간 */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', border: `1.5px solid ${overtimeDaily === "지급" ? '#4261FF' : '#DBDCDF'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: overtimeDaily === "지급" ? '8px' : '0' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#19191B', margin: 0 }}>하루 8시간 초과 시</p>
                        <p style={{ fontSize: '12px', color: '#AAB4BF', margin: '2px 0 0' }}>예: 9시간 근무 → 초과 1시간에 수당 발생</p>
                      </div>
                      <button onClick={() => setOvertimeDaily(overtimeDaily === "지급" ? "미지급" : "지급")}
                        style={{ width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: overtimeDaily === "지급" ? '#4261FF' : '#DBDCDF', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '3px', left: overtimeDaily === "지급" ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                    {overtimeDaily === "지급" && <p style={{ fontSize: '12px', color: '#4261FF', margin: 0, fontWeight: 500 }}>✓ 8시간 초과분부터 수당이 자동 계산돼요</p>}
                  </div>

                  {/* 주 40시간 */}
                  <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px 14px', border: `1.5px solid ${overtimeWeekly === "지급" ? '#4261FF' : '#DBDCDF'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: overtimeWeekly === "지급" ? '8px' : '0' }}>
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#19191B', margin: 0 }}>주 40시간 초과 시</p>
                        <p style={{ fontSize: '12px', color: '#AAB4BF', margin: '2px 0 0' }}>예: 주 43시간 근무 → 초과 3시간에 수당 발생</p>
                      </div>
                      <button onClick={() => setOvertimeWeekly(overtimeWeekly === "지급" ? "미지급" : "지급")}
                        style={{ width: '48px', height: '28px', borderRadius: '14px', border: 'none', cursor: 'pointer', backgroundColor: overtimeWeekly === "지급" ? '#4261FF' : '#DBDCDF', position: 'relative', transition: 'background-color 0.2s', flexShrink: 0 }}>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#FFFFFF', position: 'absolute', top: '3px', left: overtimeWeekly === "지급" ? '23px' : '3px', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
                      </button>
                    </div>
                    {overtimeWeekly === "지급" && <p style={{ fontSize: '12px', color: '#4261FF', margin: 0, fontWeight: 500 }}>✓ 40시간 초과분부터 수당이 자동 계산돼요</p>}
                  </div>
                </div>
              )}

              {isOvertimePaid && (
                <>
                  {/* 수당 지급 비율 */}
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '10px' }}>
                      수당 지급 비율 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <button onClick={() => setOvertimeRateOpen(true)} onMouseDown={() => setFocusedField("overtimeRate")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)} onTouchStart={() => setFocusedField("overtimeRate")} onTouchEnd={() => setFocusedField(null)}
                      className="w-full flex items-center justify-between bg-background"
                      style={{ height: '52px', padding: '0 20px', border: focusedField === "overtimeRate" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s', marginBottom: '8px' }}>
                      <span style={{ fontSize: '15px', color: '#19191B' }}>{overtimeRate}</span>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <div style={{ backgroundColor: '#F7F7F8', borderRadius: '8px', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', color: '#70737B' }}>연장 1시간 계산 예시</span>
                      <span style={{ fontSize: '13px', color: '#AAB4BF' }}>→</span>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: '#4261FF' }}>시급 × {overtimeRate.replace(" (법정 기준)", "")}</span>
                    </div>
                  </div>

                  {/* 수당 발생 최소 단위 */}
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '6px' }}>
                      수당 발생 최소 단위 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <p style={{ fontSize: '12px', color: '#AAB4BF', marginBottom: '10px' }}>몇 분 이상 연장해야 수당이 발생하나요?</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {([
                        { value: "1분 단위 계산", label: "1분" },
                        { value: "10분 단위 계산", label: "10분" },
                        { value: "15분 단위 계산", label: "15분" },
                        { value: "30분 단위 계산", label: "30분" },
                        { value: "1시간 단위 계산", label: "1시간" },
                      ] as const).map(opt => {
                        const isSelected = overtimeUnit === opt.value;
                        return (
                          <button key={opt.value} onClick={() => setOvertimeUnit(opt.value)}
                            style={{ flex: 1, height: '44px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', border: isSelected ? '2px solid #4261FF' : '1.5px solid #DBDCDF', backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF', fontSize: '13px', fontWeight: 700, color: isSelected ? '#4261FF' : '#19191B' }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 야간 수당 */}
            <div style={{ marginTop: '16px' }}>
              <h2 className="text-[16px] font-bold text-foreground" style={{ marginBottom: '8px' }}>야간 수당 기준 설정</h2>
              <ToggleChips label="밤 10시 ~ 새벽 6시 야간 수당 지급" value={nightMethod} options={["적용", "미적용"]} onChange={v => { setNightMethod(v); }}
                subText={nightMethod === "적용" ? "✓ 야간 시간대 근무분에 수당이 자동 계산돼요" : nightMethod === "미적용" ? "✗ 야간 시간대 근무에도 추가 수당이 지급되지 않아요" : undefined} />
              {isNightPaid && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '10px' }}>
                      수당 지급 비율 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <button onClick={() => setNightRateOpen(true)} onMouseDown={() => setFocusedField("nightRate")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)} onTouchStart={() => setFocusedField("nightRate")} onTouchEnd={() => setFocusedField(null)}
                      className="w-full flex items-center justify-between bg-background"
                      style={{ height: '52px', padding: '0 20px', border: focusedField === "nightRate" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s', marginBottom: '6px' }}>
                      <span style={{ fontSize: '15px', color: '#19191B' }}>{nightRate}</span>
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    </button>
                    <p className="text-[13px]" style={{ color: '#AAB4BF' }}>✓ 야간 근무 1시간당 시급의 {nightRate.replace(" (법정 기준)", "")}를 추가 지급해요</p>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '6px' }}>
                      수당 발생 최소 단위 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <p style={{ fontSize: '12px', color: '#AAB4BF', marginBottom: '10px' }}>몇 분 이상 야간 근무해야 수당이 발생하나요?</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {([
                        { value: "1분 단위 계산", label: "1분" },
                        { value: "10분 단위 계산", label: "10분" },
                        { value: "15분 단위 계산", label: "15분" },
                        { value: "30분 단위 계산", label: "30분" },
                        { value: "1시간 단위 계산", label: "1시간" },
                      ] as const).map(opt => {
                        const isSelected = nightUnit === opt.value;
                        return (
                          <button key={opt.value} onClick={() => setNightUnit(opt.value)}
                            style={{ flex: 1, height: '44px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', border: isSelected ? '2px solid #4261FF' : '1.5px solid #DBDCDF', backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF', fontSize: '13px', fontWeight: 700, color: isSelected ? '#4261FF' : '#19191B' }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* 휴일 수당 */}
            <div style={{ marginTop: '16px' }}>
              <h2 className="text-[16px] font-bold text-foreground" style={{ marginBottom: '8px' }}>휴일 수당 기준 설정</h2>
              <ToggleChips label="휴일 근무 수당 지급" value={holidayMethod} options={["적용", "미적용"]} onChange={v => { setHolidayMethod(v); }}
                subText={holidayMethod === "적용" ? "✓ 휴일 근무분에 수당이 자동 계산돼요" : holidayMethod === "미적용" ? "✗ 휴일 근무에도 추가 수당이 지급되지 않아요" : undefined} />
              {isHolidayPaid && (
                <>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '10px' }}>
                      수당 지급 비율 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#70737B', whiteSpace: 'nowrap', width: '72px' }}>8시간 이내</span>
                        <button onClick={() => setHolidayRateUnder8Open(true)} onMouseDown={() => setFocusedField("holidayRateUnder8")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)} onTouchStart={() => setFocusedField("holidayRateUnder8")} onTouchEnd={() => setFocusedField(null)}
                          className="flex-1 flex items-center justify-between bg-background"
                          style={{ height: '48px', padding: '0 16px', border: focusedField === "holidayRateUnder8" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}>
                          <span style={{ fontSize: '14px', color: '#19191B' }}>{holidayRateUnder8}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '13px', color: '#70737B', whiteSpace: 'nowrap', width: '72px' }}>8시간 초과</span>
                        <button onClick={() => setHolidayRateOver8Open(true)} onMouseDown={() => setFocusedField("holidayRateOver8")} onMouseUp={() => setFocusedField(null)} onMouseLeave={() => setFocusedField(null)} onTouchStart={() => setFocusedField("holidayRateOver8")} onTouchEnd={() => setFocusedField(null)}
                          className="flex-1 flex items-center justify-between bg-background"
                          style={{ height: '48px', padding: '0 16px', border: focusedField === "holidayRateOver8" ? '2px solid #4261FF' : '1px solid #DBDCDF', borderRadius: '10px', transition: 'border 0.15s' }}>
                          <span style={{ fontSize: '14px', color: '#19191B' }}>{holidayRateOver8}</span>
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[13px]" style={{ color: '#AAB4BF' }}>✓ 8시간 이내 {holidayRateUnder8.replace(" (법정 기준)", "")}, 8시간 초과분은 {holidayRateOver8.replace(" (법정 기준)", "")} 지급해요</p>
                  </div>
                  <div style={{ marginBottom: '24px' }}>
                    <label className="text-[16px] font-medium" style={{ color: '#70737B', display: 'block', marginBottom: '6px' }}>
                      수당 발생 최소 단위 <span style={{ color: '#FF3D3D' }}>*</span>
                    </label>
                    <p style={{ fontSize: '12px', color: '#AAB4BF', marginBottom: '10px' }}>몇 분 이상 휴일 근무해야 수당이 발생하나요?</p>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {([
                        { value: "1분 단위 계산", label: "1분" },
                        { value: "10분 단위 계산", label: "10분" },
                        { value: "15분 단위 계산", label: "15분" },
                        { value: "30분 단위 계산", label: "30분" },
                        { value: "1시간 단위 계산", label: "1시간" },
                      ] as const).map(opt => {
                        const isSelected = holidayUnit === opt.value;
                        return (
                          <button key={opt.value} onClick={() => setHolidayUnit(opt.value)}
                            style={{ flex: 1, height: '44px', borderRadius: '10px', cursor: 'pointer', transition: 'all 0.15s', border: isSelected ? '2px solid #4261FF' : '1.5px solid #DBDCDF', backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF', fontSize: '13px', fontWeight: 700, color: isSelected ? '#4261FF' : '#19191B' }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── 하단 버튼 ── */}
      {createPortal(
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-lg z-40" style={{ backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
          <div style={{ padding: "16px 20px" }}>
            {step === 1 ? (
              <button onClick={() => isStep1Complete && handleNext()} disabled={!isStep1Complete}
                style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: isStep1Complete ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: isStep1Complete ? "pointer" : "default" }}>
                다음
              </button>
            ) : (
              <button onClick={() => isStep2Complete && setConfirmOpen(true)} disabled={!isStep2Complete}
                style={{ width: "100%", height: "56px", borderRadius: "16px", backgroundColor: isStep2Complete ? "#4261FF" : "#DBDCDF", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: isStep2Complete ? "pointer" : "default" }}>
                저장하기
              </button>
            )}
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="근태 기준 설정 저장"
        description="설정한 내용으로 근태 기준을 저장하시겠어요?"
        buttons={[
          { label: "취소", onClick: () => setConfirmOpen(false), variant: "cancel" },
          { label: "저장하기", onClick: handleSave, variant: "confirm" },
        ]}
      />

      <SelectDrawer open={distanceOpen} onOpenChange={setDistanceOpen} title="출퇴근 허용 거리 설정" options={DISTANCE_OPTIONS} currentValue={distance} onSelect={setDistance} />
      <ScrollPickerDrawer open={lateOpen} onOpenChange={setLateOpen} title="지각 기준 설정" options={LATE_OPTIONS} currentValue={lateStandard} onSelect={setLateStandard} />
      <SelectDrawer open={overtimeRateOpen} onOpenChange={setOvertimeRateOpen} title="수당 지급 비율 선택" options={OVERTIME_RATE_OPTIONS} currentValue={overtimeRate} onSelect={setOvertimeRate} allowCustomInput />
      <SelectDrawer open={nightMethodOpen} onOpenChange={setNightMethodOpen} title="야간 수당 지급 여부" options={NIGHT_METHOD_OPTIONS} currentValue={nightMethod}
        onSelect={v => { setNightMethod(v); if (v === "미적용") setNightRate("1.5배 (법정 기준)"); }} />
      <SelectDrawer open={nightRateOpen} onOpenChange={setNightRateOpen} title="야간 수당 지급 비율 선택" options={OVERTIME_RATE_OPTIONS} currentValue={nightRate} onSelect={setNightRate} allowCustomInput />
      <SelectDrawer open={holidayMethodOpen} onOpenChange={setHolidayMethodOpen} title="휴일 수당 지급 여부" options={HOLIDAY_METHOD_OPTIONS} currentValue={holidayMethod}
        onSelect={v => { setHolidayMethod(v); }} />
      <SelectDrawer open={holidayRateUnder8Open} onOpenChange={setHolidayRateUnder8Open} title="휴일 수당 비율 (8시간 이내)" options={OVERTIME_RATE_OPTIONS} currentValue={holidayRateUnder8} onSelect={setHolidayRateUnder8} allowCustomInput />
      <SelectDrawer open={holidayRateOver8Open} onOpenChange={setHolidayRateOver8Open} title="휴일 수당 비율 (8시간 초과)" options={OVERTIME_RATE_OPTIONS} currentValue={holidayRateOver8} onSelect={setHolidayRateOver8} allowCustomInput />
    </div>
  );
}
