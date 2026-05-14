import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffStore, StaffData, TaxItem, WorkScheduleEntry, ShiftType } from "@/lib/staffStore";

const SHEET_DURATION = 500;

function useBottomSheet(open: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const openedOnce = useRef(false);
  useEffect(() => {
    if (!open && !openedOnce.current) return;
    openedOnce.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (open) {
      setClosing(false);
      setMounted(true);
    } else {
      setClosing(true);
      timerRef.current = setTimeout(() => { setMounted(false); setClosing(false); }, SHEET_DURATION);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [open]);
  const animStyle: React.CSSProperties = { animation: closing ? `slideDown ${SHEET_DURATION}ms cubic-bezier(0.32,0.72,0,1) both` : `slideUp ${SHEET_DURATION}ms cubic-bezier(0.32,0.72,0,1) both` };
  const overlayStyle: React.CSSProperties = { animation: closing ? `overlayHide ${SHEET_DURATION}ms cubic-bezier(0.32,0.72,0,1) both` : `overlayShow ${SHEET_DURATION}ms cubic-bezier(0.32,0.72,0,1) both` };
  const requestClose = () => {
    if (closing) return;
    setClosing(true);
    timerRef.current = setTimeout(() => { setMounted(false); setClosing(false); onClose(); }, SHEET_DURATION);
  };
  return { mounted, animStyle, overlayStyle, requestClose };
}

// ── 섹션명 매핑 ────────────────────────────────────────────
const SECTION_TITLES: Record<string, string> = {
  "계약정보": "계약 정보 수정",
  "세금": "세금 수정",
  "인적사항": "인적 사항 수정",
  "메모": "메모 수정",
  "계약서": "계약서 수정",
  "근무상태": "근무 상태 수정",
};
const SECTION_TITLES_NEW: Record<string, string> = {
  "계약정보": "계약 정보 등록",
  "세금": "세금 등록",
  "인적사항": "인적 사항 등록",
  "메모": "메모 등록",
  "계약서": "계약서 등록",
  "근무상태": "근무 상태 등록",
};

// ── 공용 드로어들 ───────────────────────────────────────────
const EMPLOYMENT_OPTIONS = ["알바생", "정규직", "계약직"];
const PROBATION_OPTIONS = ["95%", "90%", "85%", "80%", "75%", "70%"];
const PAY_PERIOD_OPTIONS = ["시급", "월급 (연봉 포함)"];
const PAY_CYCLE_OPTIONS = ["월 1회 (월급)", "주급", "월 2회"];
const PAY_DAY_OPTIONS: Record<string, string[]> = {
  "월 1회 (월급)": ["1일", "매달 말일", "15일", "25일", "2일", "3일", "4일", "5일", "6일", "7일", "8일", "9일", "10일", "11일", "12일", "13일", "14일", "16일", "17일", "18일", "19일", "20일", "21일", "22일", "23일", "24일", "26일", "27일", "28일", "29일", "30일", "31일"],
  "월 2회": ["1일, 15일", "1일, 16일", "7일, 21일"],
  "주급": ["매주 월요일", "매주 화요일", "매주 수요일", "매주 목요일", "매주 금요일", "매주 토요일", "매주 일요일"],
};
const BANK_LIST = ["국민은행", "신한은행", "농협", "우리은행", "기업은행", "하나은행", "토스뱅크", "카카오뱅크", "새마을금고", "케이뱅크", "우체국", "SC제일은행", "IM뱅크", "부산은행", "광주은행", "경남은행", "신협", "산업은행", "수협은행", "한국씨티은행", "SBI저축은행", "제주은행", "전북은행", "산림조합중앙회"];
const SHIFT_BADGE_STYLES: Record<ShiftType, string> = { "오픈": "bg-shift-open-bg text-shift-open", "미들": "bg-shift-middle-bg text-shift-middle", "마감": "bg-shift-close-bg text-shift-close" };
const DAYS = ["월", "화", "수", "목", "금", "토", "일"] as const;
const DAY_FULL: Record<string, string> = { "월": "월요일", "화": "화요일", "수": "수요일", "목": "목요일", "금": "금요일", "토": "토요일", "일": "일요일" };
const SHIFT_PRESETS = [
  { key: "오픈" as ShiftType, label: "오픈", timeLabel: "(09:00 - 12:00)", defaultStart: "09:00", defaultEnd: "12:00" },
  { key: "미들" as ShiftType, label: "미들", timeLabel: "(12:00 - 18:00)", defaultStart: "12:00", defaultEnd: "18:00" },
  { key: "마감" as ShiftType, label: "마감", timeLabel: "(18:00 - 22:00)", defaultStart: "18:00", defaultEnd: "22:00" },
];
const TIME_OPTIONS = Array.from({ length: 49 }, (_, i) => { const h = String(Math.floor(i / 2)).padStart(2, "0"); const m = i % 2 === 0 ? "00" : "30"; return `${h}:${m}`; }).filter(t => t <= "24:00");

// ── 공용 팝업 컴포넌트 ──────────────────────────────────────
function ConfirmPopup({ title, desc, cancelLabel = "취소", confirmLabel = "확인", onCancel, onConfirm }: {
  title: string; desc: string; cancelLabel?: string; confirmLabel?: string;
  onCancel: () => void; onConfirm: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center sheet-overlay">
      <div className="animate-in zoom-in-95" style={{ width: "calc(100% - 48px)", maxWidth: "320px", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "8px" }}>{title}</h3>
        <p style={{ fontSize: "14px", color: "#70737B", textAlign: "center", marginBottom: "20px", lineHeight: "1.5", whiteSpace: "pre-line" }}>{desc}</p>
        <div style={{ display: "flex", gap: "10px", width: "100%" }}>
          <button className="pressable" onClick={onCancel} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>{cancelLabel}</button>
          <button className="pressable" onClick={onConfirm} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" }}>{confirmLabel}</button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SelectionDrawer({ open, onOpenChange, title, options, selected, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; options: string[]; selected: string; onSelect: (v: string) => void }) {
  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, () => onOpenChange(false));
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={requestClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 20px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
            <button className="pressable" onClick={requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
          </div>
          {options.map(opt => {
            const isSel = opt === selected;
            return (
              <button key={opt} onClick={() => { onSelect(opt); requestClose(); }}
                className={`pressable w-full flex items-center justify-between py-3.5 px-4 rounded-xl mb-1 ${isSel ? "bg-primary/10" : "bg-transparent active:bg-muted/50"}`}>
                <span className={`text-[15px] font-medium ${isSel ? "text-primary" : "text-foreground"}`}>{opt}</span>
                {isSel && <Check className="w-5 h-5 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>,
    document.body
  );
}

function TaxInputDrawer({ open, onOpenChange, title, value, onConfirm, prefix, taxLabel }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; value: string; onConfirm: (v: string) => void; prefix?: string; taxLabel?: string }) {
  const [inputValue, setInputValue] = useState(value);
  const [taxFocused, setTaxFocused] = useState(false);
  useEffect(() => { if (open) setInputValue(value); }, [open, value]);
  const taxHasVal = inputValue.trim().length > 0;
  const borderColor = !taxHasVal ? "#FF3D3D" : taxFocused ? "#4261FF" : "#DBDCDF";
  const borderWidth = (!taxHasVal || taxFocused) ? "2px" : "1px";
  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, () => onOpenChange(false));
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={requestClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 20px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
            <button className="pressable" onClick={requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
          </div>
          <div className="flex items-center" style={{ border: `${borderWidth} solid ${borderColor}`, borderRadius: "10px", height: "52px", marginBottom: !taxHasVal ? "8px" : "16px", transition: "border 0.15s", overflow: "hidden" }}>
            {prefix && <span className="text-[14px] text-muted-foreground" style={{ paddingLeft: "20px", flexShrink: 0 }}>{prefix}</span>}
            <input type="text" inputMode="decimal" value={inputValue} onChange={e => setInputValue(e.target.value)} onFocus={() => setTaxFocused(true)} onBlur={() => setTaxFocused(false)}
              style={{ flex: 1, fontSize: "14px", fontWeight: 500, color: "#19191B", background: "transparent", border: "none", outline: "none", boxShadow: "none", WebkitAppearance: "none", appearance: "none", paddingLeft: prefix ? "8px" : "20px", paddingRight: "8px", height: "100%", caretColor: "#19191B", WebkitTapHighlightColor: "transparent" }} />
            <span className="text-[14px] text-muted-foreground" style={{ paddingRight: "20px", flexShrink: 0 }}>%</span>
          </div>
          {!taxHasVal && (
            <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginBottom: "16px" }}>{taxLabel ? `${taxLabel} 비율을 입력해주세요` : "비율을 입력해주세요"}</p>
          )}
          <button onClick={() => { if (!taxHasVal) return; onConfirm(inputValue); requestClose(); }}
            className="pressable"
            style={{ width: "100%", height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: taxHasVal ? "pointer" : "default", backgroundColor: taxHasVal ? "#4261FF" : "#DBDCDF", color: "#FFFFFF", marginTop: taxHasVal ? "24px" : "0" }}>
            입력 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function TextInputDrawer({ open, onOpenChange, title, value, onConfirm, placeholder, inputMode = "text", subText, isCurrency, minAmount }: { open: boolean; onOpenChange: (v: boolean) => void; title: string; value: string; onConfirm: (v: string) => void; placeholder?: string; inputMode?: "text" | "numeric" | "tel"; subText?: string; isCurrency?: boolean; minAmount?: number }) {
  const fmt = (v: string) => { const n = v.replace(/[^0-9]/g, ""); return n ? Number(n).toLocaleString() : ""; };
  const [val, setVal] = useState(isCurrency ? fmt(value) : value);
  const [focused, setFocused] = useState(false);
  useEffect(() => { if (open) setVal(isCurrency ? fmt(value) : value); }, [open, value]);
  const raw = isCurrency ? Number(val.replace(/,/g, "")) : 0;
  const belowMin = isCurrency && minAmount !== undefined && val.trim().length > 0 && raw < minAmount;
  const hasVal = val.trim().length > 0 && !belowMin;
  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, () => onOpenChange(false));
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={requestClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 20px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
            <button className="pressable" onClick={requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
          </div>
          <input type="text" inputMode={isCurrency ? "numeric" : inputMode} value={val} onChange={e => setVal(isCurrency ? fmt(e.target.value) : e.target.value)}
            placeholder={placeholder || "입력해주세요"}
            onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
            className="focus:outline-none focus-visible:outline-none focus-visible:ring-0"
            style={{ width: "100%", height: "52px", borderRadius: "12px", border: focused ? "2px solid #4261FF" : "1px solid #DBDCDF", paddingLeft: "16px", paddingRight: "16px", fontSize: "16px", color: "#19191B", outline: "none", WebkitAppearance: "none", appearance: "none", boxSizing: "border-box", marginBottom: (subText || belowMin) ? "8px" : "16px", backgroundColor: "#FFFFFF", transition: "border 0.15s" }} />
          {belowMin && <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginBottom: "16px" }}>최저시급 10,320원 미만은 입력할 수 없어요</p>}
          {!belowMin && subText && <p style={{ fontSize: "13px", fontWeight: 600, color: "#4261FF", marginBottom: "16px", whiteSpace: "pre-line" }}>{subText}</p>}
          <button onClick={() => { onConfirm(isCurrency ? val.replace(/,/g, "") : val); requestClose(); }}
            className="pressable"
            style={{ ...(hasVal ? { width: "100%", height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" } : { width: "100%", height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#FFFFFF" }), marginTop: "24px" }}>
            입력 완료
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function BankSelectionDrawer({ open, onOpenChange, selected, onSelect }: { open: boolean; onOpenChange: (v: boolean) => void; selected: string; onSelect: (v: string) => void }) {
  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, () => onOpenChange(false));
  if (!mounted) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={requestClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
          <div style={{ padding: "30px 20px 20px", flexShrink: 0 }}>
            <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>은행을 선택해주세요</h2>
              <button className="pressable" onClick={requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
            </div>
          </div>
          <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 20px" }}>
            <div className="grid grid-cols-3 gap-2">
              {BANK_LIST.map(b => (
                <button key={b} onClick={() => { onSelect(b); requestClose(); }} className="pressable"
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 8px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, backgroundColor: b === selected ? "#E8F3FF" : "#F7F7F8", color: b === selected ? "#4261FF" : "#19191B", border: b === selected ? "1px solid #4261FF" : "1px solid transparent" }}>
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function WorkDayDrawer({ open, onOpenChange, workSchedule, onAdd, onDelete }: { open: boolean; onOpenChange: (v: boolean) => void; workSchedule: WorkScheduleEntry[]; onAdd: (e: WorkScheduleEntry) => void; onDelete: (days: string[]) => void }) {
  const { toast } = useToast();
  const [step, setStep] = useState<"list" | "selectDay" | "selectShifts" | "selectTime">("list");
  const [selDay, setSelDay] = useState("");
  const [selShifts, setSelShifts] = useState<ShiftType[]>([]);
  const [shiftTimes, setShiftTimes] = useState<Record<string, { start: string; end: string }>>({});
  const [shiftIdx, setShiftIdx] = useState(0);
  const [listSel, setListSel] = useState<string[]>([]);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const reset = () => { setStep("list"); setSelDay(""); setSelShifts([]); setShiftTimes({}); setShiftIdx(0); setListSel([]); setDeleteConfirmOpen(false); };
  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, () => { reset(); onOpenChange(false); });
  const handleClose = () => { reset(); requestClose(); };

  const goSelectTime = () => {
    const ORDER = ["오픈", "미들", "마감"];
    const sorted = [...selShifts].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
    const defs: Record<string, { start: string; end: string }> = {};
    sorted.forEach(s => { const p = SHIFT_PRESETS.find(o => o.key === s); defs[s] = { start: p?.defaultStart || "09:00", end: p?.defaultEnd || "18:00" }; });
    setSelShifts(sorted);
    setShiftTimes(defs); setShiftIdx(0); setStep("selectTime");
  };
  const handleFinish = () => {
    if (shiftIdx < selShifts.length - 1) { setShiftIdx(shiftIdx + 1); return; }
    const sorted = [...selShifts].sort((a, b) => (["오픈", "미들", "마감"].indexOf(a)) - (["오픈", "미들", "마감"].indexOf(b)));
    onAdd({ day: selDay, time: `${shiftTimes[sorted[0]]?.start} ~ ${shiftTimes[sorted[sorted.length - 1]]?.end}`, shifts: sorted });
    reset(); requestClose();
    toast({ description: "근무일이 추가 되었어요.", duration: 2000 });
  };
  const cs = selShifts[shiftIdx];
  const cso = SHIFT_PRESETS.find(o => o.key === cs);

  return (
    <>
      {/* 삭제 확인 팝업 — z-[200]으로 바텀시트 딤드 위에 표시 */}
      {deleteConfirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center sheet-overlay">
          <div className="animate-in zoom-in-95" style={{ width: "calc(100% - 48px)", maxWidth: "320px", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#19191B", textAlign: "center", marginBottom: "8px" }}>근무일 삭제하기</h3>
            <p style={{ fontSize: "14px", color: "#70737B", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" }}>선택한 근무일을 삭제하시겠어요?</p>
            <div style={{ display: "flex", gap: "10px", width: "100%" }}>
              <button onClick={() => { setDeleteConfirmOpen(false); setListSel([]); }}
                className="pressable"
                style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>취소</button>
              <button onClick={() => {
                className="pressable"
                onDelete(listSel);
                setListSel([]);
                setDeleteConfirmOpen(false);
                // 바텀시트 닫기 (애니메이션 500ms) → 완전히 닫힌 후 토스트
                handleClose();
                setTimeout(() => toast({ description: "근무일이 삭제 되었어요.", duration: 2000 }), 550);
              }}
                style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" }}>삭제하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 바텀시트 드로어 */}
      {mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={handleClose}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 20px 20px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: step === "list" ? "20px" : "10px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>
                  {step === "list" ? "근무일 선택하기" : "근무일 추가하기"}
                </h2>
                <button className="pressable" onClick={handleClose}>
                  <X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} />
                </button>
              </div>

              {step === "list" && (
                <>
                  {workSchedule.length === 0
                    ? <p className="text-center text-[14px] text-muted-foreground py-10">근무일을 추가해 주세요</p>
                    : (
                      <div className="space-y-1 mb-4">
                        {workSchedule.map(ws => {
                          const isSel = listSel.includes(ws.day);
                          return (
                            <button key={ws.day}
                              onClick={() => setListSel(p => p.includes(ws.day) ? p.filter(d => d !== ws.day) : [...p, ws.day])}
                              className={`pressable w-full flex items-center justify-between py-3.5 px-4 rounded-xl ${isSel ? "bg-primary/10" : "bg-transparent active:bg-muted/50"}`}>
                              <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                  {ws.shifts.map(s => <span key={s} className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${SHIFT_BADGE_STYLES[s as ShiftType]}`}>{s}</span>)}
                                </div>
                                <span className={`text-[15px] font-medium ${isSel ? "text-primary" : "text-foreground"}`}>{ws.day} ({ws.time.replace(" ~ ", " - ")})</span>
                              </div>
                              {isSel && <Check className="w-5 h-5 text-primary" />}
                            </button>
                          );
                        })}
                      </div>
                    )
                  }
                  <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                    <button
                      className="pressable"
                      onClick={() => { if (listSel.length > 0) setDeleteConfirmOpen(true); }}
                      style={{ ...(listSel.length > 0 ? { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" } : { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#FFFFFF" }) }}>
                      삭제하기
                    </button>
                    <button
                      className="pressable"
                      onClick={() => { setSelDay(""); setSelShifts([]); setStep("selectDay"); }}
                      style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DEEBFF", color: "#4261FF" }}>
                      추가하기
                    </button>
                  </div>
                </>
              )}

              {step === "selectDay" && (
                <>
                  <p style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "-0.02em", color: "#70737B", marginBottom: "16px" }}>근무 요일을 선택해주세요</p>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginBottom: "24px" }}>
                    {DAYS.map(d => (
                      <button key={d} onClick={() => setSelDay(d)}
                        className="pressable"
                        style={{ width: "40px", height: "40px", borderRadius: "10px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer", backgroundColor: d === selDay ? "#4261FF" : "#F7F7F8", color: d === selDay ? "#FFFFFF" : "#70737B" }}>
                        {d}
                      </button>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                    <button onClick={() => setStep("list")} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DEEBFF", color: "#4261FF" }}>이전</button>
                    <button onClick={() => { if (!selDay) return; setSelShifts([]); setStep("selectShifts"); }} disabled={!selDay}
                      style={{ ...(selDay ? { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" } : { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#FFFFFF" }) }}>다음</button>
                  </div>
                </>
              )}

              {step === "selectShifts" && (
                <>
                  <p style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "-0.02em", color: "#70737B", marginBottom: "16px" }}><span style={{ color: "#4261FF" }}>[{DAY_FULL[selDay]}]</span> 일정 파트를 선택해주세요</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0", marginBottom: "24px" }}>
                    {SHIFT_PRESETS.map(opt => {
                      const checked = selShifts.includes(opt.key);
                      return (
                        <button key={opt.key} onClick={() => setSelShifts(p => p.includes(opt.key) ? p.filter(x => x !== opt.key) : [...p, opt.key])}
                          className="pressable flex items-center gap-3 w-full text-left" style={{ padding: "8px 0" }}>
                          <div style={{ width: "24px", height: "24px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: checked ? "#4261FF" : "#FFFFFF", border: checked ? "1px solid #4261FF" : "1px solid #DBDCDF", flexShrink: 0 }}>
                            {checked && <Check style={{ width: "14px", height: "14px", color: "#FFFFFF" }} />}
                          </div>
                          <span style={{ fontSize: "15px", fontWeight: 500, color: "#19191B" }}>{opt.label} <span style={{ color: "#70737B" }}>{opt.timeLabel}</span></span>
                        </button>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                    <button onClick={() => setStep("selectDay")} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DEEBFF", color: "#4261FF" }}>이전</button>
                    <button onClick={() => { if (selShifts.length === 0) return; goSelectTime(); }} disabled={selShifts.length === 0}
                      style={{ ...(selShifts.length > 0 ? { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" } : { flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#FFFFFF" }) }}>다음</button>
                  </div>
                </>
              )}

              {step === "selectTime" && cs && (() => {
                const _partStartH = parseInt(cso?.defaultStart?.split(":")[0] || "0");
                const _partEndH   = parseInt(cso?.defaultEnd?.split(":")[0] || "24");
                const _startMinH  = Math.max(0, _partStartH - 1);
                const _startMaxH  = _partEndH - 1;
                const _endMinH    = _partStartH;
                const _endMaxH    = _partEndH;
                const _startVal   = shiftTimes[cs]?.start || cso?.defaultStart || "09:00";
                const _endVal     = shiftTimes[cs]?.end   || cso?.defaultEnd   || "12:00";
                const [_sH, _sM]  = _startVal.split(":");
                const [_eH, _eM]  = _endVal.split(":");
                const _sHn = parseInt(_sH), _sMn = parseInt(_sM);
                const _eHn = parseInt(_eH), _eMn = parseInt(_eM);
                const _startHours = Array.from({ length: _startMaxH - _startMinH + 1 }, (_, i) => _startMinH + i);
                const _endHours   = Array.from({ length: _endMaxH - _endMinH + 1 }, (_, i) => _endMinH + i);
                const _startMins  = _sHn >= _startMaxH ? [0] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                const _endMins    = _eHn >= _endMaxH   ? [0] : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
                const _onStartH   = (h: number) => setShiftTimes(p => {
                  const curEndH = parseInt((p[cs]?.end || _endVal).split(":")[0]);
                  const newEnd  = h >= curEndH ? `${String(Math.min(h + 1, _endMaxH)).padStart(2,"0")}:00` : (p[cs]?.end || _endVal);
                  return { ...p, [cs]: { start: `${String(h).padStart(2,"0")}:${_sM}`, end: newEnd } };
                });
                return (
                  <>
                    <p style={{ fontSize: "16px", fontWeight: 500, letterSpacing: "-0.02em", color: "#70737B", marginBottom: "16px" }}>
                      <span style={{ color: "#4261FF" }}>[{DAY_FULL[selDay]}]</span> {cso?.key} 근무 시간을 선택해주세요
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ flex: 1, display: "flex", gap: "4px", overflow: "hidden" }}>
                        <ScrollPicker items={_startHours} selected={_sHn} suffix="시" onSelect={_onStartH} />
                        <ScrollPicker items={_startMins} selected={_sMn} suffix="분"
                          onSelect={m => setShiftTimes(p => ({ ...p, [cs]: { ...p[cs], start: `${_sH}:${String(m).padStart(2,"0")}` } }))} />
                      </div>
                      <span style={{ fontSize: "16px", color: "#70737B", flexShrink: 0 }}>~</span>
                      <div style={{ flex: 1, display: "flex", gap: "4px", overflow: "hidden" }}>
                        <ScrollPicker items={_endHours} selected={_eHn} suffix="시"
                          onSelect={h => setShiftTimes(p => ({ ...p, [cs]: { ...p[cs], end: `${String(h).padStart(2,"0")}:${_eM}` } }))} />
                        <ScrollPicker items={_endMins} selected={_eMn} suffix="분"
                          onSelect={m => setShiftTimes(p => ({ ...p, [cs]: { ...p[cs], end: `${_eH}:${String(m).padStart(2,"0")}` } }))} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                      <button onClick={() => shiftIdx > 0 ? setShiftIdx(shiftIdx - 1) : setStep("selectShifts")}
                        className="pressable"
                        style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DEEBFF", color: "#4261FF" }}>이전</button>
                      <button onClick={handleFinish}
                        className="pressable"
                        style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF" }}>
                        {shiftIdx === selShifts.length - 1 ? "추가하기" : "다음"}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
// ── 날짜 선택 드로어 (수습 기간용) ──────────────────────────
// 단일 컬럼 스크롤 피커
function ScrollPicker({ items, selected, onSelect, suffix }: { items: number[]; selected: number; onSelect: (v: number) => void; suffix: string }) {
  const ITEM_H = 44;
  const VISIBLE = 5;
  const containerRef = useRef<HTMLDivElement>(null);
  // 스크롤 이벤트로 인한 selected 업데이트가 다시 스크롤을 유발하는 루프 방지
  const userScrolling = useRef(false);
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 마운트 시 초기 위치 — rAF 두 번 지연으로 드로어 애니메이션 완료 후 실행
  useEffect(() => {
    let raf1: number, raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const idx = items.indexOf(selected);
        if (containerRef.current && idx >= 0) {
          containerRef.current.scrollTop = idx * ITEM_H;
        }
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // 마운트 1회만 실행
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // items 변경(월 바뀌어 days 재계산) 시 위치 보정
  useEffect(() => {
    if (userScrolling.current) return;
    const idx = items.indexOf(selected);
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTop = idx * ITEM_H;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    userScrolling.current = true;
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      if (!containerRef.current) return;
      const raw = containerRef.current.scrollTop;
      const idx = Math.round(raw / ITEM_H);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      // 스냅 위치로 부드럽게 정렬
      containerRef.current.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      if (items[clamped] !== selected) onSelect(items[clamped]);
      // smooth 스크롤 끝난 후 플래그 해제
      setTimeout(() => { userScrolling.current = false; }, 200);
    }, 120);
  };

  const handleItemClick = (item: number) => {
    onSelect(item);
    const idx = items.indexOf(item);
    if (containerRef.current && idx >= 0) {
      containerRef.current.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
    }
  };

  return (
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>
      {/* 선택 영역 강조 */}
      <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: `${ITEM_H}px`, transform: "translateY(-50%)", backgroundColor: "#F0F3FF", borderRadius: "10px", pointerEvents: "none", zIndex: 1 }} />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{ overflowY: "scroll", height: `${ITEM_H * VISIBLE}px`, scrollbarWidth: "none", msOverflowStyle: "none", position: "relative", zIndex: 2, touchAction: "pan-y" }}
        className="hide-scrollbar"
      >
        {/* 상단 패딩 */}
        <div style={{ height: `${ITEM_H * 2}px` }} />
        {items.map(item => (
          <div key={item}
            onClick={() => handleItemClick(item)}
            style={{ height: `${ITEM_H}px`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <span style={{ fontSize: "17px", fontWeight: item === selected ? 700 : 400, color: item === selected ? "#4261FF" : "#70737B", transition: "color 0.15s, font-weight 0.15s" }}>
              {String(item).padStart(suffix === "월" || suffix === "일" ? 2 : 0, "0")}{suffix}
            </span>
          </div>
        ))}
        {/* 하단 패딩 */}
        <div style={{ height: `${ITEM_H * 2}px` }} />
      </div>
    </div>
  );
}

function DatePickerDrawer({ open, onClose, title, value, onConfirm }: {
  open: boolean; onClose: () => void; title: string; value: string; onConfirm: (v: string) => void;
}) {
  const now = new Date();
  const [year, setYear] = useState(value ? parseInt(value.split(".")[0]) : now.getFullYear());
  const [month, setMonth] = useState(value ? parseInt(value.split(".")[1]) : now.getMonth() + 1);
  const [day, setDay] = useState(value ? parseInt(value.split(".")[2]) : now.getDate());

  const { mounted, animStyle, overlayStyle, requestClose } = useBottomSheet(open, onClose);

  const years = Array.from({ length: 10 }, (_, i) => now.getFullYear() - 2 + i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // 월/일 변경 시 범위 초과 방지
  const safeDay = Math.min(day, daysInMonth);

  const formatted = `${year}.${String(month).padStart(2, "0")}.${String(safeDay).padStart(2, "0")}`;

  if (!mounted) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={overlayStyle} onClick={requestClose}>
      <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...animStyle }} onClick={e => e.stopPropagation()} onTouchMove={e => e.stopPropagation()}>
        <div style={{ padding: "30px 20px 20px" }}>
          <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{title}</h2>
            <button className="pressable" onClick={requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
          </div>
          {/* 3컬럼 드럼롤 피커 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <ScrollPicker items={years} selected={year} onSelect={setYear} suffix="년" />
            <ScrollPicker items={months} selected={month} onSelect={m => { setMonth(m); if (day > new Date(year, m, 0).getDate()) setDay(new Date(year, m, 0).getDate()); }} suffix="월" />
            <ScrollPicker items={days} selected={safeDay} onSelect={setDay} suffix="일" />
          </div>
          <button onClick={() => { requestClose(); setTimeout(() => onConfirm(formatted), 50); }}
            className="pressable"
            style={{ width: "100%", height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF", marginTop: "24px" }}>
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
}

// ── 공용 하단 버튼 ──────────────────────────────────────────
function BottomButtons({ onCancel, onSave }: { onCancel: () => void; onSave: () => void }) {
  return createPortal(
    <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: "#FFFFFF", borderTop: "1px solid #F7F7F8" }}>
      <div style={{ maxWidth: "512px", margin: "0 auto", padding: "16px 20px", display: "flex", gap: "8px" }}>
        <button className="pressable" onClick={onCancel} style={{ width: "122px", height: "56px", flexShrink: 0, backgroundColor: "#DEEBFF", borderRadius: "16px", border: "none", fontSize: "16px", fontWeight: 700, color: "#4261FF", cursor: "pointer" }}>취소</button>
        <button className="pressable" onClick={onSave} style={{ flex: 1, height: "56px", backgroundColor: "#4261FF", borderRadius: "16px", border: "none", fontSize: "16px", fontWeight: 700, color: "#FFFFFF", cursor: "pointer" }}>저장하기</button>
      </div>
    </div>,
    document.body
  );
}

// ── 섹션별 컴포넌트 ─────────────────────────────────────────

function SectionContract({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: (flag?: string) => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [employmentType, setEmploymentType] = useState(initial.employmentType);
  const [salaryType, setSalaryType] = useState(initial.salaryType);
  const [isAnnualSalary, setIsAnnualSalary] = useState(initial.isAnnualSalary);
  const [annualSalary, setAnnualSalary] = useState(initial.annualSalary);
  const [salaryAmount, setSalaryAmount] = useState(initial.salaryAmount);
  const [payCycle, setPayCycle] = useState(initial.payCycle);
  const [payDay, setPayDay] = useState(initial.payDay);
  const [includeHolidayPay, setIncludeHolidayPay] = useState(initial.includeHolidayPay);
  const [includeBreakTime, setIncludeBreakTime] = useState(initial.includeBreakTime ?? false);
  const [breakMinutes, setBreakMinutes] = useState(initial.breakMinutes ?? 30);
  const [breakTimeOpen, setBreakTimeOpen] = useState(false);
  const [breakFocused, setBreakFocused] = useState(false);
  const [probation, setProbation] = useState(initial.probation);
  const [probationRate, setProbationRate] = useState(initial.probation ? initial.probationRate : "");
  const [probationStart, setProbationStart] = useState(initial.probationStart);
  const [probationEnd, setProbationEnd] = useState(initial.probationEnd);
  const [workSchedule, setWorkSchedule] = useState<WorkScheduleEntry[]>(initial.workSchedule);

  const [empTypeOpen, setEmpTypeOpen] = useState(false);
  const [salaryTypeOpen, setSalaryTypeOpen] = useState(false);
  const [payCycleOpen, setPayCycleOpen] = useState(false);
  const [payDayOpen, setPayDayOpen] = useState(false);
  const [probRateOpen, setProbRateOpen] = useState(false);
  const [workDayOpen, setWorkDayOpen] = useState(false);
  const [salaryDrawerOpen, setSalaryDrawerOpen] = useState(false);
  const [annualSalaryDrawerOpen, setAnnualSalaryDrawerOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [probStartOpen, setProbStartOpen] = useState(false);
  const [probEndOpen, setProbEndOpen] = useState(false);

  const payDay$ = useBottomSheet(payDayOpen, () => setPayDayOpen(false));

  // ── 검증 ──
  const [validationError, setValidationError] = useState<string>("");
  const [errorField, setErrorField] = useState<string>("");
  // 각 필드로 스크롤하기 위한 ref
  const refs: Record<string, React.RefObject<HTMLDivElement>> = {
    employmentType: useRef<HTMLDivElement>(null),
    salaryType: useRef<HTMLDivElement>(null),
    salaryAmount: useRef<HTMLDivElement>(null),
    payCycle: useRef<HTMLDivElement>(null),
    payDay: useRef<HTMLDivElement>(null),
    probationRate: useRef<HTMLDivElement>(null),
    probationPeriod: useRef<HTMLDivElement>(null),
    workSchedule: useRef<HTMLDivElement>(null),
  };

  // dirty 감지
  const isDirty = JSON.stringify({ employmentType, salaryType, isAnnualSalary, annualSalary, salaryAmount, payCycle, payDay, includeHolidayPay, includeBreakTime, breakMinutes, probation, probationRate, probationStart, probationEnd, workSchedule })
    !== JSON.stringify({ employmentType: initial.employmentType, salaryType: initial.salaryType, isAnnualSalary: initial.isAnnualSalary, annualSalary: initial.annualSalary, salaryAmount: initial.salaryAmount, payCycle: initial.payCycle, payDay: initial.payDay, includeHolidayPay: initial.includeHolidayPay, includeBreakTime: initial.includeBreakTime ?? false, breakMinutes: initial.breakMinutes ?? 30, probation: initial.probation, probationRate: initial.probation ? initial.probationRate : "", probationStart: initial.probationStart, probationEnd: initial.probationEnd, workSchedule: initial.workSchedule });

  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);

  const handleSave = () => {
    // 필수 필드 순서대로 검증 (최상단 먼저)
    const checks: { key: string; fail: boolean; msg: string }[] = [
      { key: "employmentType", fail: !employmentType, msg: "고용 형태를 선택해주세요" },
      { key: "salaryType", fail: !salaryType, msg: "급여 형태를 선택해주세요" },
      { key: "salaryAmount", fail: !(salaryType === "월급 (연봉 포함)" && isAnnualSalary) && !salaryAmount, msg: `${salaryType || "급여"} 금액을 입력해주세요` },
      { key: "payCycle", fail: salaryType === "시급" && !payCycle, msg: "급여 지급 주기를 선택해주세요" },
      { key: "payDay", fail: !payDay, msg: "급여일을 선택해주세요" },
      { key: "probationRate", fail: probation && !probationRate, msg: "수습 비율을 선택해주세요" },
      { key: "probationPeriod", fail: probation && (!probationStart || !probationEnd), msg: !probationStart ? "수습 시작일을 선택해주세요" : "수습 종료일을 선택해주세요" },
      { key: "workSchedule", fail: workSchedule.length === 0, msg: "근무일을 선택해주세요" },
    ];
    const first = checks.find(c => c.fail);
    if (first) {
      setErrorField(first.key);
      setValidationError(first.msg);
      // 해당 필드로 스크롤
      refs[first.key]?.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrorField("");
    setValidationError("");
    setSaveOpen(true);
  };
  const doSave = () => {
    const taxDone = initial.incomeTax.some(t => t.active) || initial.socialInsurance.some(t => t.active);
    const shouldClearNew = initial.isNew && !!salaryType && taxDone;
    staffStore.update(staffId, {
      employmentType: employmentType as any,
      salaryType,
      isAnnualSalary,
      annualSalary,
      salaryAmount,
      payCycle,
      payDay,
      includeHolidayPay,
      includeBreakTime,
      breakMinutes,
      probation,
      probationRate,
      probationStart,
      probationEnd,
      workSchedule,
      ...(shouldClearNew ? { isNew: false } : {}),
    });
    setSaveOpen(false);
    toast({ description: "계약 정보가 저장되었어요.", duration: 2000 });
    onBack(shouldClearNew ? "completed" : undefined);
  };

  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "20px" }}>계약 정보</h3>
        <FieldBlock label="입사일"><span style={{ fontSize: "16px", fontWeight: 500, color: "#19191B" }}>{initial.hireDate} (+{initial.hireDaysAgo}일)</span></FieldBlock>
        {/* step 1: 고용 형태 — 항상 노출 */}
        <div ref={refs.employmentType}><SelectField label="고용 형태" value={employmentType || "미선택"} onTap={() => { setEmpTypeOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "employmentType"} errorMsg={errorField === "employmentType" ? validationError : ""} /></div>
        {!employmentType && initial.isNew && !errorField && <p style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 600, marginTop: "-8px", marginBottom: "16px" }}>고용 형태를 선택해주세요</p>}

        {/* step 2: 급여 형태 — 고용 형태 선택 후 */}
        {(employmentType || !initial.isNew) && (
          <>
            <div ref={refs.salaryType}><SelectField label="급여 형태" value={salaryType || "미선택"} onTap={() => { setSalaryTypeOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "salaryType"} errorMsg={errorField === "salaryType" ? validationError : ""} /></div>
            {!salaryType && initial.isNew && !errorField && <p style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 600, marginTop: "-8px", marginBottom: "16px" }}>급여 형태를 선택해주세요</p>}
          </>
        )}

        {/* step 3: 급여 금액 — 급여 형태 선택 후 */}
        {(salaryType || !initial.isNew) && (
          <>
            {salaryType === "월급 (연봉 포함)" && (
              <FieldBlock label="연봉 계약 여부">
                <ToggleChip active={isAnnualSalary} label="연봉 계약" onClick={() => setIsAnnualSalary(!isAnnualSalary)} />
              </FieldBlock>
            )}
            {!(salaryType === "월급 (연봉 포함)" && isAnnualSalary) && (
              <>
                <div ref={refs.salaryAmount}><InputField label={salaryType === "월급 (연봉 포함)" ? "월급" : salaryType || "급여"} value={salaryAmount ? `${Number(salaryAmount.replace(/,/g, "")).toLocaleString()}원` : "미입력"} onTap={() => { setSalaryDrawerOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "salaryAmount"} errorMsg={errorField === "salaryAmount" ? validationError : ""} /></div>
                {salaryAmount
                  ? <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-8px", marginBottom: "16px" }}>*입력하신 {salaryType === "월급 (연봉 포함)" ? "월급" : salaryType} 기준으로 직원 급여가 계산돼요</p>
                  : (initial.isNew && !errorField && <p style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 600, marginTop: "-8px", marginBottom: "16px" }}>{salaryType === "월급 (연봉 포함)" ? "월급" : salaryType || "급여"} 금액을 입력해주세요</p>)
                }
              </>
            )}
            {salaryType === "월급 (연봉 포함)" && isAnnualSalary && (
              <>
                <InputField label="연봉 (세전)" value={annualSalary ? `${Number(annualSalary.replace(/,/g, "")).toLocaleString()}원` : "미입력"} onTap={() => setAnnualSalaryDrawerOpen(true)} />
                <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-8px", marginBottom: "16px" }}>*입력하신 연봉 기준으로 직원 급여가 계산돼요</p>
                <FieldBlock label="월 지급액 자동 계산 (세전)">
                  <div style={{ height: "48px", border: "1px solid #EBEBEB", borderRadius: "10px", paddingLeft: "16px", paddingRight: "16px", backgroundColor: "#F7F7F8", display: "flex", alignItems: "center" }}>
                    <span style={{ fontSize: "16px", color: annualSalary ? "#19191B" : "#9EA3AD" }}>
                      {annualSalary ? `${Math.round(Number(annualSalary.replace(/,/g, "")) / 12).toLocaleString()}원` : "연봉 입력 시 자동 계산"}
                    </span>
                  </div>
                </FieldBlock>
              </>
            )}
          </>
        )}

        {/* step 4: 급여 지급 주기 (시급만) — 급여 금액 입력 후 */}
        {salaryType === "시급" && (salaryAmount || !initial.isNew) && (
          <>
            <div ref={refs.payCycle}><SelectField label="급여 지급 주기" value={payCycle || "미선택"} onTap={() => { setPayCycleOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "payCycle"} errorMsg={errorField === "payCycle" ? validationError : ""} /></div>
            {!payCycle && initial.isNew && !errorField && <p style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 600, marginTop: "-8px", marginBottom: "16px" }}>급여 지급 주기를 선택해주세요</p>}
          </>
        )}

        {/* step 5: 급여일 — 급여 금액 입력 후 (시급은 지급주기까지 선택 후) */}
        {(((salaryType === "시급" ? (salaryAmount && payCycle) : (salaryAmount || (salaryType === "월급 (연봉 포함)" && isAnnualSalary && annualSalary)))) || !initial.isNew) && (
          <>
            <div ref={refs.payDay}><SelectField label="급여일" value={payDay || "미선택"} onTap={() => { setPayDayOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "payDay"} errorMsg={errorField === "payDay" ? validationError : ""} /></div>
            {payDay && <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-8px", marginBottom: "16px" }}>{payDay === "매달 말일" ? "*매달 말일에 급여를 지급해요" : `*매달 ${payDay}에 급여를 지급해요`}</p>}
            {/* 급여일 미선택 시 입력 유도 */}
            {!payDay && initial.isNew && !errorField && <p style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 600, marginTop: "-8px", marginBottom: "16px" }}>급여일을 선택해주세요</p>}
          </>
        )}

        {/* step 6: 수습 + 주휴 + 근무일 — 급여일 선택 후 */}
        {(payDay || !initial.isNew) && (
          <>
            <FieldBlock label="수습">
              <ToggleChip active={probation} label="수습 적용" onClick={() => { setProbation(p => { if (!p) setProbationRate(""); return !p; }); }} />
              <p style={{ fontSize: "14px", color: "#70737B", marginTop: "6px" }}>*해당 직원이 수습기간이 필요한 직원이면 선택해주세요</p>
            </FieldBlock>
            {probation && (
              <>
                <div ref={refs.probationRate}><SelectField label="수습 비율" value={probationRate || "미선택"} onTap={() => { setProbRateOpen(true); setErrorField(""); setValidationError(""); }} error={errorField === "probationRate"} errorMsg={errorField === "probationRate" ? validationError : ""} /></div>
                {(() => {
                  const rate = parseFloat(probationRate) / 100;
                  if (isNaN(rate)) return null;
                  if (salaryType === "월급 (연봉 포함)" && isAnnualSalary) {
                    const annualBase = parseFloat(annualSalary.replace(/,/g, ""));
                    if (isNaN(annualBase) || annualBase <= 0) return null;
                    const monthly = Math.round(annualBase / 12);
                    const applied = Math.round(monthly * rate);
                    return <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-8px", marginBottom: "16px" }}>*월 지급액 {monthly.toLocaleString()}원의 {probationRate}: <span style={{ color: "#10C97D" }}>{applied.toLocaleString()}원 적용</span></p>;
                  }
                  const base = parseFloat(salaryAmount.replace(/,/g, ""));
                  if (isNaN(base) || base <= 0) return null;
                  const applied = Math.round(base * rate);
                  const salaryLabel = salaryType === "월급 (연봉 포함)" ? "월급" : salaryType;
                  return <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-8px", marginBottom: "16px" }}>*{salaryLabel} {Number(salaryAmount.replace(/,/g, "")).toLocaleString()}원의 {probationRate}: <span style={{ color: "#10C97D" }}>{applied.toLocaleString()}원 적용</span></p>;
                })()}
                <div ref={refs.probationPeriod}>
                  <FieldBlock label="수습 기간">
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <button onClick={() => { setProbStartOpen(true); setErrorField(""); setValidationError(""); }} className="pressable select-trigger flex items-center justify-between"
                        style={{ flex: 1, height: "48px", borderRadius: "10px", paddingLeft: "16px", paddingRight: "12px", border: !probationStart ? "1px solid #FF3D3D" : "1px solid #DBDCDF" }}>
                        <span style={{ fontSize: "15px", fontWeight: 500, color: probationStart ? "#19191B" : "#9EA3AD" }}>{probationStart || "시작일"}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <span style={{ fontSize: "14px", color: "#70737B", flexShrink: 0 }}>~</span>
                      <button onClick={() => { setProbEndOpen(true); setErrorField(""); setValidationError(""); }} className="pressable select-trigger flex items-center justify-between"
                        style={{ flex: 1, height: "48px", borderRadius: "10px", paddingLeft: "16px", paddingRight: "12px", border: !probationEnd ? "1px solid #FF3D3D" : "1px solid #DBDCDF" }}>
                        <span style={{ fontSize: "15px", fontWeight: 500, color: probationEnd ? "#19191B" : "#9EA3AD" }}>{probationEnd || "종료일"}</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                    {errorField === "probationPeriod" && (
                      <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginTop: "4px" }}>{validationError}</p>
                    )}
                  </FieldBlock>
                </div>
                <p style={{ fontSize: "13px", fontWeight: 500, color: "#4261FF", marginTop: "6px", marginBottom: "16px", lineHeight: "1.5" }}>*수습 기간 동안 설정한 비율로 급여가 지급돼요. 기간이 종료되면 자동으로 해제되고 정상 급여로 전환돼요.</p>
              </>
            )}

            {/* step 7: 주휴 (시급만) */}
            {salaryType === "시급" && (
              <FieldBlock label="주휴">
                <ToggleChip active={includeHolidayPay} label="주휴 포함" onClick={() => setIncludeHolidayPay(!includeHolidayPay)} />
                {includeHolidayPay && (
                  <p style={{ fontSize: "14px", color: "#70737B", marginTop: "6px" }}>*해당 직원이 주 15시간 이상 일하면서, 만근 시에 주휴수당이 자동 발생해요</p>
                )}
              </FieldBlock>
            )}

            {/* step 7-1: 휴게 */}
            <FieldBlock label="휴게">
              <ToggleChip active={includeBreakTime} label="휴게 포함" onClick={() => setIncludeBreakTime(!includeBreakTime)} />
              {includeBreakTime && (
                <>
                  <p style={{ fontSize: "14px", color: "#70737B", marginTop: "8px", marginBottom: "4px" }}>휴게 시간</p>
                  <button onClick={() => setBreakTimeOpen(true)}
                    onMouseDown={() => setBreakFocused(true)} onMouseUp={() => setBreakFocused(false)} onMouseLeave={() => setBreakFocused(false)}
                    onTouchStart={() => setBreakFocused(true)} onTouchEnd={() => setBreakFocused(false)}
                    style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", height: "48px", borderRadius: "10px", paddingLeft: "16px", paddingRight: "16px", border: breakFocused ? "2px solid #4261FF" : "1px solid #DBDCDF", background: "#FFFFFF", cursor: "pointer", outline: "none", transition: "border 0.15s" }}>
                    <span style={{ fontSize: "16px", fontWeight: 500, color: "#19191B" }}>{breakMinutes}분</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <p style={{ fontSize: "14px", color: "#70737B", marginTop: "6px" }}>*근무 시간에서 휴게 시간이 제외되어 급여가 계산돼요</p>
                </>
              )}
            </FieldBlock>
            {breakTimeOpen && createPortal(
              <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setBreakTimeOpen(false)}>
                <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", padding: "30px 20px 20px" }} onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
                    <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>휴게 시간 선택하기</h2>
                    <button className="pressable" onClick={() => setBreakTimeOpen(false)}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
                  </div>
                  {[15, 30, 60, 90, 120].map(min => {
                    const isSel = min === breakMinutes;
                    return (
                      <button key={min} onClick={() => { setBreakMinutes(min); setBreakTimeOpen(false); }}
                        className={`pressable w-full flex items-center justify-between py-3.5 px-4 rounded-xl mb-1 ${isSel ? "bg-primary/10" : "bg-transparent active:bg-muted/50"}`}>
                        <span className={`text-[15px] font-medium ${isSel ? "text-primary" : "text-foreground"}`}>{min}분</span>
                        {isSel && <Check className="w-5 h-5 text-primary" />}
                      </button>
                    );
                  })}
                </div>
              </div>,
              document.body
            )}

            {/* step 8: 근무일 */}
            <div ref={refs.workSchedule}>
          <FieldBlock label="근무일">
            <button
              onClick={() => { setWorkDayOpen(true); setErrorField(""); setValidationError(""); }}
              className="pressable select-trigger w-full text-left"
              style={{
                border: errorField === "workSchedule" ? "1px solid #FF3D3D" : workSchedule.length === 0 ? "1px solid #FF3D3D" : "1px solid #DBDCDF",
                borderRadius: "10px",
                padding: workSchedule.length > 0 ? "12px 16px" : "0 16px",
                minHeight: "48px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: "8px",
                backgroundColor: "transparent",
              }}
            >
              {workSchedule.length === 0 ? (
                <span style={{ fontSize: "16px", fontWeight: 500, color: "#70737B", lineHeight: "48px" }}>미선택</span>
              ) : (
                <>
                  {workSchedule.map(ws => (
                    <div key={ws.day} style={{ display: "flex", alignItems: "center", gap: "8px", width: "100%" }}>
                      <span style={{ fontSize: "15px", fontWeight: 500, color: "#19191B", width: "16px", flexShrink: 0 }}>{ws.day}</span>
                      <span style={{ fontSize: "15px", color: "#19191B" }}>{ws.time}</span>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {ws.shifts.map(s => <span key={s} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${SHIFT_BADGE_STYLES[s as ShiftType]}`}>{s}</span>)}
                      </div>
                    </div>
                  ))}
                </>
              )}
            </button>
            {errorField === "workSchedule" && (
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginTop: "4px" }}>{validationError}</p>
            )}
            <p style={{ fontSize: "14px", color: "#70737B", marginTop: "6px" }}>*해당 직원이 근무할 요일의 파트를 선택해주세요</p>
            </FieldBlock>
            </div>
          </>
        )}

        {/* ── 예상 급여 미리보기 ── */}
        {(() => {
          // 근무일에서 주간 총 근무시간 계산
          const totalWeeklyHours = workSchedule.reduce((sum, ws) => {
            const [start, end] = ws.time.split(" ~ ").map(t => {
              const [h, m] = t.split(":").map(Number);
              return h + m / 60;
            });
            return sum + Math.max(0, end - start);
          }, 0);

          if (totalWeeklyHours === 0) return null;

          // 파트별 급여 계산
          const probRate = probation && probationRate ? parseFloat(probationRate) / 100 : 1;
          const holidayHours = (salaryType === "시급" && includeHolidayPay && totalWeeklyHours >= 15)
            ? (totalWeeklyHours / 40) * 8
            : 0;

          let lines: { label: string; amount: number }[] = [];

          if (salaryType === "시급" && salaryAmount) {
            const hourly = Number(salaryAmount.replace(/,/g, ""));
            const weeklyPay = (totalWeeklyHours + holidayHours) * hourly;
            const monthlyPay = weeklyPay * 4;

            if (payCycle === "주급") {
              lines = [{ label: "주 급여 예상", amount: Math.round(weeklyPay * probRate) }];
            } else if (payCycle === "월 2회") {
              lines = [{ label: "2주 급여 예상", amount: Math.round(weeklyPay * 2 * probRate) }];
            } else {
              // 월 1회 (기본)
              lines = [{ label: "월 급여 예상", amount: Math.round(monthlyPay * probRate) }];
            }
          } else if (salaryType === "월급 (연봉 포함)" && !isAnnualSalary && salaryAmount) {
            const monthly = Number(salaryAmount.replace(/,/g, ""));
            lines = [{ label: "월 급여 예상", amount: Math.round(monthly * probRate) }];
          } else if (salaryType === "월급 (연봉 포함)" && isAnnualSalary && annualSalary) {
            const monthly = Math.round(Number(annualSalary.replace(/,/g, "")) / 12);
            lines = [{ label: "월 급여 예상", amount: Math.round(monthly * probRate) }];
          }

          if (lines.length === 0) return null;

          const hasHoliday = holidayHours > 0;
          const hasProbation = probation && probationRate && parseFloat(probationRate) < 100;

          return (
            <div style={{ marginTop: "16px", padding: "14px 16px", backgroundColor: "#F0F3FF", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: hasHoliday || hasProbation ? "8px" : "0" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#4261FF" }}>예상 급여 (세전)</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#4261FF" }}>
                  {lines[0].amount.toLocaleString()}원
                </span>
              </div>
              {(hasHoliday || hasProbation) && (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  {hasProbation && (
                    <p style={{ fontSize: "14px", color: "#70737B", margin: 0 }}>
                      *수습 {probationRate} 적용
                    </p>
                  )}
                  {hasHoliday && (
                    <p style={{ fontSize: "14px", color: "#70737B", margin: 0 }}>
                      *주휴수당 포함 (주 {totalWeeklyHours.toFixed(1)}시간 근무 기준)
                    </p>
                  )}
                </div>
              )}
              <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "2px" }}>
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*세금 공제 전 금액으로 실수령액과 다를 수 있어요</p>
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*월 환산은 4주 기준이며 휴게시간 미포함이에요</p>
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*계약서 기준 예상 금액이에요. 실제 일정에 따라 야간·연장 수당이 추가되면 실지급액이 달라질 수 있어요</p>
              </div>
            </div>
          );
        })()}
      </div>

      <SelectionDrawer open={empTypeOpen} onOpenChange={setEmpTypeOpen} title="고용 형태 선택하기" options={EMPLOYMENT_OPTIONS} selected={employmentType} onSelect={(v) => setEmploymentType(v as "정규직" | "알바생")} />
      <SelectionDrawer open={salaryTypeOpen} onOpenChange={setSalaryTypeOpen} title="급여 형태 선택하기" options={PAY_PERIOD_OPTIONS} selected={salaryType} onSelect={v => { setSalaryType(v); setSalaryAmount(""); }} />
      <SelectionDrawer open={payCycleOpen} onOpenChange={setPayCycleOpen} title="지급 주기 선택하기" options={PAY_CYCLE_OPTIONS} selected={payCycle} onSelect={v => { setPayCycle(v); setPayDay(""); }} />
      <SelectionDrawer open={probRateOpen} onOpenChange={setProbRateOpen} title="수습 비율 선택하기" options={PROBATION_OPTIONS} selected={probationRate} onSelect={setProbationRate} />
      <WorkDayDrawer open={workDayOpen} onOpenChange={setWorkDayOpen} workSchedule={workSchedule} onAdd={e => setWorkSchedule(p => [...p.filter(w => w.day !== e.day), e])} onDelete={days => setWorkSchedule(p => p.filter(w => !days.includes(w.day)))} />
      <TextInputDrawer open={salaryDrawerOpen} onOpenChange={setSalaryDrawerOpen} title={salaryType === "월급 (연봉 포함)" ? "월급 입력하기" : `${salaryType} 입력하기`} value={salaryAmount} onConfirm={setSalaryAmount} isCurrency placeholder="숫자만 입력" subText={salaryType === "시급" ? "2026년 최저시급은 시간당 10,320원이에요" : "주 40시간(월 209시간) 기준 최저 월급은\n2,156,880원이에요"} minAmount={salaryType === "시급" ? 10320 : undefined} />
      <TextInputDrawer open={annualSalaryDrawerOpen} onOpenChange={setAnnualSalaryDrawerOpen} title="연봉 입력하기" value={annualSalary} onConfirm={setAnnualSalary} isCurrency placeholder="숫자만 입력" subText={"주 40시간 기준 최저 연봉은\n25,882,560원이에요"} />

      {payDay$.mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={payDay$.overlayStyle} onClick={payDay$.requestClose}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...payDay$.animStyle }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", flexDirection: "column", maxHeight: "60vh" }}>
              <div style={{ padding: "30px 20px 12px", flexShrink: 0 }}>
                <div className="flex items-center justify-between">
                  <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>급여일 선택하기</h2>
                  <button className="pressable" onClick={payDay$.requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
                </div>
              </div>
              <div style={{ overflowY: "auto", flex: 1, padding: "0 20px 20px" }}>
                {(PAY_DAY_OPTIONS[payCycle] || PAY_DAY_OPTIONS["월 1회 (월급)"]).map(opt => {
                  const isSel = opt === payDay;
                  return (
                    <button key={opt} onClick={() => { setPayDay(opt); payDay$.requestClose(); }} className={`pressable w-full flex items-center justify-between py-3.5 px-4 rounded-xl mb-1 ${isSel ? "bg-primary/10" : "bg-transparent active:bg-muted/50"}`}>
                      <span className={`text-[15px] font-medium ${isSel ? "text-primary" : "text-foreground"}`}>{opt}</span>
                      {isSel && <Check className="w-5 h-5 text-primary" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* 수습 기간 시작일 드로어 */}
      {probStartOpen && createPortal(
        <DatePickerDrawer
          open={probStartOpen}
          onClose={() => setProbStartOpen(false)}
          title="수습 시작일 선택"
          value={probationStart}
          onConfirm={v => setProbationStart(v)}
        />,
        document.body
      )}
      {/* 수습 기간 종료일 드로어 */}
      {probEndOpen && createPortal(
        <DatePickerDrawer
          open={probEndOpen}
          onClose={() => setProbEndOpen(false)}
          title="수습 종료일 선택"
          value={probationEnd}
          onConfirm={v => setProbationEnd(v)}
        />,
        document.body
      )}
      {cancelOpen && <ConfirmPopup title={`계약 정보 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="계약 정보 저장하기" desc="계약 정보를 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={handleSave} />
    </>
  );
}

function SectionTax({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: (flag?: string) => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [incomeTax, setIncomeTax] = useState<TaxItem[]>(initial.incomeTax);
  const [socialInsurance, setSocialInsurance] = useState<TaxItem[]>(initial.socialInsurance);
  const [taxDrawer, setTaxDrawer] = useState<{ open: boolean; listType: "income" | "social"; key: string; title: string; value: string; prefix?: string; taxLabel?: string }>({ open: false, listType: "income", key: "", title: "", value: "" });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [focusedTaxKey, setFocusedTaxKey] = useState("");
  const isDirty = JSON.stringify({ incomeTax, socialInsurance }) !== JSON.stringify({ incomeTax: initial.incomeTax, socialInsurance: initial.socialInsurance });
  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);

  // 포커스용 ref — 각 세금 항목 key로 접근
  const taxRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [errorField, setErrorField] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSave = () => {
    // 활성화된 항목 중 비율이 비어있는 것 순서대로 검증
    const allTax = [...incomeTax, ...socialInsurance];
    const first = allTax.find(t => t.active && (!t.value || t.value.trim() === ""));
    if (first) {
      setErrorField(first.key);
      setErrorMsg(`${first.label} 비율을 입력해주세요`);
      taxRefs.current[first.key]?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setErrorField("");
    setErrorMsg("");
    setSaveOpen(true);
  };

  const doSave = () => {
    const contractDone = !!initial.salaryType;
    const taxDone = [...incomeTax, ...socialInsurance].some(t => t.active);
    const shouldClearNew = initial.isNew && contractDone && taxDone;
    staffStore.update(staffId, { incomeTax, socialInsurance, ...(shouldClearNew ? { isNew: false } : {}) });
    setSaveOpen(false);
    toast({ description: "세금 정보가 저장되었어요.", duration: 2000 });
    onBack(shouldClearNew ? "completed" : undefined);
  };
  const toggleTax = (list: TaxItem[], setList: (v: TaxItem[]) => void, key: string) => {
    setList(list.map(t => t.key === key ? { ...t, active: !t.active } : t));
    // 토글 시 해당 필드 에러 해제
    if (errorField === key) { setErrorField(""); setErrorMsg(""); }
  };
  const openTaxDrawer = (listType: "income" | "social", tax: TaxItem) => {
    setFocusedTaxKey(tax.key);
    setTaxDrawer({ open: true, listType, key: tax.key, title: `${tax.label} 입력하기`, value: tax.value, prefix: tax.key === "longterm" ? "건강보험의" : undefined, taxLabel: tax.label });
    // 드로어 열면 에러 해제
    if (errorField === tax.key) { setErrorField(""); setErrorMsg(""); }
  };
  const handleTaxConfirm = (val: string) => {
    if (taxDrawer.listType === "income") setIncomeTax(incomeTax.map(t => t.key === taxDrawer.key ? { ...t, value: val } : t));
    else setSocialInsurance(socialInsurance.map(t => t.key === taxDrawer.key ? { ...t, value: val } : t));
    if (errorField === taxDrawer.key) { setErrorField(""); setErrorMsg(""); }
    setFocusedTaxKey("");
  };

  const TaxRow = ({ tax, onToggle, onEdit }: { tax: TaxItem; onToggle: () => void; onEdit: () => void }) => {
    // 활성화됐는데 값이 없으면 항상 빨간 테두리 (계약 정보 수정과 동일)
    const isEmpty = tax.active && (!tax.value || tax.value.trim() === "");
    const isError = errorField === tax.key;
    const isFocused = focusedTaxKey === tax.key;
    const showRed = isEmpty || isError;
    const borderStyle = showRed ? "2px solid #FF3D3D" : isFocused ? "2px solid #4261FF" : "1px solid #DBDCDF";
    return (
      <div ref={el => { taxRefs.current[tax.key] = el; }} style={{ marginBottom: "8px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button className="pressable" onClick={onToggle} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px", width: "134px", height: "48px", borderRadius: "10px", border: `1px solid ${tax.active ? "rgba(16,201,125,0.3)" : "#DBDCDF"}`, fontSize: "14px", fontWeight: 500, cursor: "pointer", flexShrink: 0, backgroundColor: tax.active ? "rgba(16,201,125,0.1)" : "#FFFFFF", color: tax.active ? "#10C97D" : "#93989E" }}>
            {tax.active && <Check style={{ width: "14px", height: "14px" }} />}{tax.label}
          </button>
          <button className="pressable" onClick={() => tax.active && onEdit()} style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", flex: 1, height: "48px", borderRadius: "10px", border: borderStyle, paddingLeft: "12px", paddingRight: "12px", background: tax.active ? "#FFFFFF" : "#F7F7F8", cursor: tax.active ? "pointer" : "default", transition: "border 0.15s" }}>
            {tax.key === "longterm" && <span style={{ fontSize: "14px", color: "#70737B", flexShrink: 0, marginRight: "4px" }}>건강보험의</span>}
            <span style={{ fontSize: "14px", fontWeight: 500, color: tax.active ? (isEmpty ? "#70737B" : "#19191B") : "#C0C4CC", flex: 1, textAlign: "right" }}>
              {isEmpty ? "미입력" : tax.value}
            </span>
            <span style={{ fontSize: "14px", color: tax.active ? "#70737B" : "#C0C4CC" }}>%</span>
          </button>
        </div>
        {isError && (
          <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginTop: "4px" }}>{errorMsg}</p>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "2px" }}>세금</h3>
        <p style={{ fontSize: "14px", color: "#70737B", marginBottom: "20px" }}>*해당 직원이 부담해야하는 세금 항목을 선택 후 세율을 수정해주세요</p>
        <div style={{ marginBottom: "12px" }}>
          <span style={{ fontSize: "16px", fontWeight: 500, color: "#70737B", display: "block", marginBottom: "8px" }}>소득세</span>
          {incomeTax.map(tax => <TaxRow key={tax.key} tax={tax} onToggle={() => toggleTax(incomeTax, setIncomeTax, tax.key)} onEdit={() => openTaxDrawer("income", tax)} />)}
        </div>
        <div>
          <span style={{ fontSize: "16px", fontWeight: 500, color: "#70737B", display: "block", marginBottom: "8px" }}>4대 보험</span>
          {socialInsurance.map(tax => (
            <div key={tax.key}>
              <TaxRow tax={tax} onToggle={() => toggleTax(socialInsurance, setSocialInsurance, tax.key)} onEdit={() => openTaxDrawer("social", tax)} />
              {tax.key === "industrial" && <p style={{ fontSize: "14px", color: "#70737B", marginTop: "-4px", marginBottom: "8px" }}>*산재보험은 사업주가 전액 부담하는 보험으로 급여 공제 항목에는 포함되지 않습니다</p>}
            </div>
          ))}
        </div>

        {/* ── 예상 급여 (세후) 미리보기 ── */}
        {(() => {
          const s = initial;
          const totalWeeklyHours = s.workSchedule.reduce((sum, ws) => {
            const [start, end] = ws.time.split(" ~ ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
            return sum + Math.max(0, end - start);
          }, 0);
          if (totalWeeklyHours === 0 && !s.salaryAmount && !s.annualSalary) return null;

          const probRate = s.probation && s.probationRate ? parseFloat(s.probationRate) / 100 : 1;
          const holidayHours = (s.salaryType === "시급" && s.includeHolidayPay && totalWeeklyHours >= 15) ? (totalWeeklyHours / 40) * 8 : 0;

          let grossMonthly = 0;
          if (s.salaryType === "시급" && s.salaryAmount) {
            const hourly = Number(s.salaryAmount.replace(/,/g, ""));
            grossMonthly = Math.round((totalWeeklyHours + holidayHours) * hourly * 4 * probRate);
          } else if (s.salaryType === "월급 (연봉 포함)" && !s.isAnnualSalary && s.salaryAmount) {
            grossMonthly = Math.round(Number(s.salaryAmount.replace(/,/g, "")) * probRate);
          } else if (s.salaryType === "월급 (연봉 포함)" && s.isAnnualSalary && s.annualSalary) {
            grossMonthly = Math.round(Number(s.annualSalary.replace(/,/g, "")) / 12 * probRate);
          }
          if (grossMonthly === 0) return null;

          // 활성화된 세금 항목별 공제액 계산 (산재 제외)
          // 장기요양보험은 건강보험료의 n% (grossMonthly 기준 아님)
          const allTax = [...incomeTax, ...socialInsurance];
          const healthTax = socialInsurance.find(t => t.key === "health");
          const healthAmount = (healthTax?.active && healthTax.value)
            ? Math.round(grossMonthly * parseFloat(healthTax.value) / 100)
            : 0;

          const taxLines = allTax
            .filter(t => t.active && t.key !== "industrial")
            .map(t => {
              const amount = t.key === "longterm"
                ? Math.round(healthAmount * parseFloat(t.value || "0") / 100)
                : Math.round(grossMonthly * parseFloat(t.value || "0") / 100);
              return { key: t.key, label: t.label, value: t.value, amount };
            });

          const taxAmount = taxLines.reduce((sum, t) => sum + t.amount, 0);
          const netMonthly = grossMonthly - taxAmount;

          return (
            <div style={{ marginTop: "20px", padding: "14px 16px", backgroundColor: "#F0F3FF", borderRadius: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: 600, color: "#4261FF" }}>예상 급여 (세후)</span>
                <span style={{ fontSize: "18px", fontWeight: 700, color: "#4261FF" }}>{netMonthly.toLocaleString()}원</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*세전 {grossMonthly.toLocaleString()}원에서 세금 {taxAmount.toLocaleString()}원 공제</p>
                {taxLines.map(t => (
                  <p key={t.key} style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>
                    · {t.label} {t.key === "longterm" ? `(건강보험의 ${t.value}%)` : `${t.value}%`} → {t.amount.toLocaleString()}원
                  </p>
                ))}
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*산재보험은 사업주 부담으로 공제 제외</p>
                <p style={{ fontSize: "13px", color: "#9EA3AD", margin: 0 }}>*실제 급여와 다를 수 있어요</p>
              </div>
            </div>
          );
        })()}
      </div>
      <TaxInputDrawer open={taxDrawer.open} onOpenChange={v => { setTaxDrawer(p => ({ ...p, open: v })); if (!v) setFocusedTaxKey(""); }} title={taxDrawer.title} value={taxDrawer.value} onConfirm={handleTaxConfirm} prefix={taxDrawer.prefix} taxLabel={taxDrawer.taxLabel} />
      {cancelOpen && <ConfirmPopup title={`세금 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="세금 저장하기" desc="세금 정보를 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={handleSave} />
    </>
  );
}

function SectionPersonal({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: () => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [bank, setBank] = useState(initial.bank);
  const [accountNumber, setAccountNumber] = useState(initial.accountNumber);
  const [accountOpen, setAccountOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [errorField, setErrorField] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const isDirty = bank !== initial.bank || accountNumber !== initial.accountNumber;
  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);
  const handleSave = () => {
    if (!bank || bank.trim() === "") { setErrorField("bank"); setErrorMsg("은행을 선택해주세요"); return; }
    if (!accountNumber || accountNumber.trim() === "") { setErrorField("accountNumber"); setErrorMsg("계좌번호를 입력해주세요"); return; }
    setErrorField(""); setErrorMsg("");
    setSaveOpen(true);
  };
  const doSave = () => {
    staffStore.update(staffId, { bank, accountNumber });
    setSaveOpen(false);
    toast({ description: "인적 사항이 저장되었어요.", duration: 2000 });
    onBack();
  };
  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "20px" }}>인적 사항</h3>
        <FieldBlock label="생년월일"><span style={{ fontSize: "16px", fontWeight: 500, color: "#19191B" }}>{initial.birthDate} ({initial.birthAge}세)</span></FieldBlock>
        <FieldBlock label="성별"><span style={{ fontSize: "16px", fontWeight: 500, color: "#19191B" }}>{initial.gender === '남' ? '남자' : '여자'}</span></FieldBlock>
        <FieldBlock label="전화번호"><span style={{ fontSize: "16px", fontWeight: 500, color: initial.phone ? "#19191B" : "#9EA3AD" }}>{initial.phone || "미등록"}</span></FieldBlock>
        <SelectField label="은행" value={bank || "미선택"} onTap={() => { setBankOpen(true); if (errorField === "bank") { setErrorField(""); setErrorMsg(""); } }} error={errorField === "bank"} errorMsg={errorField === "bank" ? errorMsg : ""} />
        <InputField label="계좌번호" value={accountNumber || "미입력"} onTap={() => { setAccountOpen(true); if (errorField === "accountNumber") { setErrorField(""); setErrorMsg(""); } }} error={errorField === "accountNumber"} errorMsg={errorField === "accountNumber" ? errorMsg : ""} />
      </div>
      <TextInputDrawer open={accountOpen} onOpenChange={setAccountOpen} title="계좌번호 입력하기" value={accountNumber} onConfirm={setAccountNumber} placeholder="숫자만 입력" inputMode="numeric" />
      <BankSelectionDrawer open={bankOpen} onOpenChange={setBankOpen} selected={bank} onSelect={setBank} />
      {cancelOpen && <ConfirmPopup title={`인적 사항 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="인적 사항 저장하기" desc="인적 사항을 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={handleSave} />
    </>
  );
}

function SectionMemo({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: () => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [memo, setMemo] = useState(initial.memo);
  const [memoTemp, setMemoTemp] = useState(memo);
  const [memoDrawerOpen, setMemoDrawerOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const memo$ = useBottomSheet(memoDrawerOpen, () => setMemoDrawerOpen(false));
  const isDirty = memo !== initial.memo;
  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);
  const doSave = () => {
    staffStore.update(staffId, { memo });
    setSaveOpen(false);
    toast({ description: "메모가 저장되었어요.", duration: 2000 });
    onBack();
  };
  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "20px" }}>메모</h3>
        <FieldBlock label="메모 내용">
          <button onClick={() => { setMemoTemp(memo); setMemoDrawerOpen(true); }} className="pressable select-trigger text-left whitespace-pre-wrap"
            style={{ width: "100%", fontSize: "16px", fontWeight: 500, color: memo ? "#19191B" : "#9EA3AD", border: "1px solid #DBDCDF", borderRadius: "10px", padding: "13px 16px", minHeight: "48px", background: "transparent" }}>
            {memo || "메모를 입력해 주세요"}
          </button>
        </FieldBlock>
      </div>
      {memo$.mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={memo$.overlayStyle} onClick={memo$.requestClose}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...memo$.animStyle }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 20px 20px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>메모 입력하기</h2>
                <button className="pressable" onClick={memo$.requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
              </div>
              <div className="relative mb-4">
                <textarea value={memoTemp} onChange={e => { if (e.target.value.length <= 50) setMemoTemp(e.target.value); }} placeholder="등록하실 메모를 입력해 주세요" rows={6} data-no-focus className="w-full text-[14px] font-medium text-foreground bg-transparent outline-none focus:outline-none border border-border rounded-xl px-4 py-3 resize-none" />
                <span className="absolute bottom-4 right-4 text-[12px] text-muted-foreground">{memoTemp.length}/50</span>
              </div>
              {memoTemp.trim().length > 0 ? (
                <button className="pressable" onClick={() => { setMemo(memoTemp); memo$.requestClose(); }} style={{ width: "100%", height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#4261FF", color: "#FFFFFF", marginTop: "24px" }}>입력완료</button>
              ) : (
                <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
                  <button className="pressable" onClick={memo$.requestClose} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DBDCDF", color: "#70737B" }}>취소</button>
                  <button className="pressable" onClick={() => { setMemo(""); memo$.requestClose(); }} style={{ flex: 1, height: "56px", borderRadius: "10px", fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em", border: "none", cursor: "pointer", backgroundColor: "#DEEBFF", color: "#4261FF" }}>건너뛰기</button>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {cancelOpen && <ConfirmPopup title={`메모 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="메모 저장하기" desc="메모를 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={() => setSaveOpen(true)} />
    </>
  );
}

function SectionDocs({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: () => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [docs, setDocs] = useState({ resume: initial.resume, laborContract: initial.laborContract, healthCert: initial.healthCert });
  const [uploadDrawer, setUploadDrawer] = useState<{ open: boolean; key: keyof typeof docs; title: string }>({ open: false, key: "resume", title: "" });
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; key: keyof typeof docs; label: string }>({ open: false, key: "resume", label: "" });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const upload$ = useBottomSheet(uploadDrawer.open, () => setUploadDrawer(p => ({ ...p, open: false })));
  const isDirty = JSON.stringify(docs) !== JSON.stringify({ resume: initial.resume, laborContract: initial.laborContract, healthCert: initial.healthCert });
  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);
  const doSave = () => {
    staffStore.update(staffId, docs);
    setSaveOpen(false);
    toast({ description: "계약서가 저장되었어요.", duration: 2000 });
    onBack();
  };
  const docList = [
    { key: "resume" as const, label: "이력서", title: "이력서 업로드하기" },
    { key: "laborContract" as const, label: "근로계약서", title: "근로계약서 업로드하기" },
    { key: "healthCert" as const, label: "보건증", title: "보건증 업로드하기" },
  ];
  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "20px" }}>계약서</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {docList.map(doc => (
            <div key={doc.key}>
              <span style={{ fontSize: "16px", fontWeight: 500, color: "#70737B", display: "block", marginBottom: "8px" }}>{doc.label}</span>
              {docs[doc.key] ? (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button className="pressable" onClick={() => setImagePreview(docs[doc.key])} style={{ fontSize: "16px", fontWeight: 500, color: "#4261FF", textDecoration: "underline", flex: 1, textAlign: "left", background: "none", border: "none", cursor: "pointer", padding: 0 }}>{docs[doc.key]}</button>
                  <button className="pressable" onClick={() => setDeleteConfirm({ open: true, key: doc.key, label: doc.label })} style={{ fontSize: "13px", color: "#FF3D3D", fontWeight: 500, padding: "6px 12px", border: "1px solid rgba(255,61,61,0.3)", borderRadius: "8px", background: "none", cursor: "pointer" }}>삭제</button>
                </div>
              ) : (
                <button onClick={() => setUploadDrawer({ open: true, key: doc.key, title: doc.title })} className="pressable select-trigger"
                  style={{ width: "100%", height: "48px", border: "1px solid #DBDCDF", borderRadius: "10px", paddingLeft: "16px", fontSize: "16px", fontWeight: 500, color: "#9EA3AD", textAlign: "center", background: "transparent", cursor: "pointer" }}>
                  {doc.title}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
      {upload$.mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={upload$.overlayStyle} onClick={upload$.requestClose}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...upload$.animStyle }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 20px 20px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>{uploadDrawer.title}</h2>
                <button className="pressable" onClick={upload$.requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
              </div>
              {["앨범에서 선택하기", "카메라 촬영하기"].map(label => (
                <button key={label} onClick={() => {
                  const fileName = `${initial.name}_${uploadDrawer.title || uploadDrawer.key}.png`;
                  setDocs(p => ({ ...p, [uploadDrawer.key]: fileName }));
                  upload$.requestClose();
                  toast({ description: "업로드가 완료되었습니다.", duration: 2000 });
                }}
                  onMouseDown={e => { e.currentTarget.style.backgroundColor = "#E8F3FF"; e.currentTarget.style.color = "#4261FF"; }}
                  onMouseUp={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#19191B"; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#19191B"; }}
                  onTouchStart={e => { e.currentTarget.style.backgroundColor = "#E8F3FF"; e.currentTarget.style.color = "#4261FF"; }}
                  onTouchEnd={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#19191B"; }}
                  style={{ width: "100%", height: "48px", borderRadius: "10px", backgroundColor: "transparent", display: "flex", alignItems: "center", paddingLeft: "16px", fontSize: "16px", fontWeight: 500, color: "#19191B", transition: "background-color 0.1s" }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>,
        document.body
      )}
      {deleteConfirm.open && <ConfirmPopup title={`${deleteConfirm.label} 삭제하기`} desc={`${deleteConfirm.label}를 삭제하시겠어요?`} cancelLabel="취소" confirmLabel="삭제하기" onCancel={() => setDeleteConfirm({ open: false, key: "resume", label: "" })} onConfirm={() => { setDocs(p => ({ ...p, [deleteConfirm.key]: "" })); setDeleteConfirm({ open: false, key: "resume", label: "" }); toast({ description: `${deleteConfirm.label}이(가) 삭제되었습니다.`, duration: 2000 }); }} />}
      {imagePreview && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setImagePreview("")}>
          <div style={{ width: "calc(100% - 48px)", maxWidth: "420px", backgroundColor: "#FFFFFF", borderRadius: "20px", overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #F0F0F0" }}>
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em" }}>{imagePreview}</span>
              <button className="pressable" onClick={() => setImagePreview("")}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
            </div>
            <div style={{ padding: "20px", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "240px", backgroundColor: "#F7F7F8" }}>
              {imagePreview.match(/\.(png|jpg|jpeg|gif|webp)$/i) ? (
                <div style={{ width: "100%", aspectRatio: "3/4", backgroundColor: "#E8E8E8", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", backgroundColor: "#DBDCDF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9EA3AD" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#70737B" }}>{imagePreview}</span>
                  <span style={{ fontSize: "12px", color: "#9EA3AD" }}>실제 환경에서는 이미지가 표시돼요</span>
                </div>
              ) : (
                <div style={{ width: "100%", aspectRatio: "3/4", backgroundColor: "#E8E8E8", borderRadius: "12px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                  <div style={{ width: "64px", height: "64px", backgroundColor: "#DBDCDF", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9EA3AD" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  </div>
                  <span style={{ fontSize: "14px", fontWeight: 500, color: "#70737B" }}>{imagePreview}</span>
                  <span style={{ fontSize: "12px", color: "#9EA3AD" }}>실제 환경에서는 파일이 표시돼요</span>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
      {cancelOpen && <ConfirmPopup title={`계약서 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="계약서 저장하기" desc="계약서 정보를 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={() => setSaveOpen(true)} />
    </>
  );
}

function SectionWorkStatus({ staffId, initial, onBack, onRequestCancel }: { staffId: string; initial: StaffData; onBack: () => void; onRequestCancel?: (fn: () => void) => void }) {
  const { toast } = useToast();
  const [workStatus, setWorkStatus] = useState(initial.workStatus);
  const [workStatusOpen, setWorkStatusOpen] = useState(false);
  const [workStatusConfirm, setWorkStatusConfirm] = useState<{ open: boolean; status: string }>({ open: false, status: "" });
  const [cancelOpen, setCancelOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const ws$ = useBottomSheet(workStatusOpen, () => setWorkStatusOpen(false));
  const isDirty = workStatus !== initial.workStatus;
  const handleCancel = () => { if (isDirty) setCancelOpen(true); else onBack(); };
  useEffect(() => { onRequestCancel?.(() => handleCancel()); }, [isDirty]);
  const doSave = () => {
    staffStore.update(staffId, { workStatus });
    setSaveOpen(false);
    toast({ description: "근무 상태가 저장되었어요.", duration: 2000 });
    onBack();
  };
  return (
    <>
      <div className="bg-card px-5 py-5">
        <h3 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em", marginBottom: "20px" }}>근무 상태</h3>
        <SelectField label="근무 상태" value={workStatus || "미선택"} onTap={() => setWorkStatusOpen(true)} />
      </div>
      {ws$.mounted && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" style={ws$.overlayStyle} onClick={ws$.requestClose}>
          <div style={{ width: "100%", maxWidth: "512px", borderRadius: "20px 20px 0 0", backgroundColor: "#FFFFFF", ...ws$.animStyle }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "30px 20px 20px" }}>
              <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
                <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#19191B" }}>근무 상태 선택하기</h2>
                <button className="pressable" onClick={ws$.requestClose}><X style={{ width: "20px", height: "20px", color: "#19191B" }} strokeWidth={2.5} /></button>
              </div>
              {["재직", "휴직", "퇴사"].map(status => {
                const isSel = status === workStatus;
                return (
                  <button key={status} onClick={() => { ws$.requestClose(); if (status !== workStatus) setWorkStatusConfirm({ open: true, status }); }}
                    onMouseDown={e => { e.currentTarget.style.backgroundColor = "#E8F3FF"; e.currentTarget.style.color = "#4261FF"; }}
                    onMouseUp={e => { e.currentTarget.style.backgroundColor = isSel ? "#E8F3FF" : "transparent"; e.currentTarget.style.color = isSel ? "#4261FF" : "#19191B"; }}
                    onMouseLeave={e => { e.currentTarget.style.backgroundColor = isSel ? "#E8F3FF" : "transparent"; e.currentTarget.style.color = isSel ? "#4261FF" : "#19191B"; }}
                    onTouchStart={e => { e.currentTarget.style.backgroundColor = "#E8F3FF"; e.currentTarget.style.color = "#4261FF"; }}
                    onTouchEnd={e => { e.currentTarget.style.backgroundColor = isSel ? "#E8F3FF" : "transparent"; e.currentTarget.style.color = isSel ? "#4261FF" : "#19191B"; }}
                    style={{ width: "100%", height: "48px", borderRadius: "10px", backgroundColor: isSel ? "#E8F3FF" : "transparent", display: "flex", alignItems: "center", paddingLeft: "16px", fontSize: "16px", fontWeight: 500, color: isSel ? "#4261FF" : "#19191B", transition: "background-color 0.1s" }}>
                    {status}
                  </button>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
      {workStatusConfirm.open && <ConfirmPopup
        title={`${workStatusConfirm.status} 상태로 변경하기`}
        desc={workStatusConfirm.status === "재직" ? "재직 상태로 변경하시겠어요?\n일정, 급여 등 직원 기능을\n다시 사용할 수 있어요" : workStatusConfirm.status === "휴직" ? "휴직 상태로 변경하시겠어요?\n휴직 상태가 되면 일정, 급여 등\n모든 기능에서 제외돼요" : "퇴사 상태로 변경하시겠어요?\n해당 직원은 매장 직원 목록에서 제외돼요"}
        cancelLabel="취소" confirmLabel="확인"
        onCancel={() => setWorkStatusConfirm({ open: false, status: "" })}
        onConfirm={() => { setWorkStatus(workStatusConfirm.status); setWorkStatusConfirm({ open: false, status: "" }); }}
      />}
      {cancelOpen && <ConfirmPopup title={`근무 상태 ${initial.isNew ? "등록" : "수정"} 취소`} desc={`${initial.isNew ? "등록" : "수정"} 중인 내용이 저장되지 않아요.\n정말 취소하시겠어요?`} cancelLabel="취소" confirmLabel="확인" onCancel={() => setCancelOpen(false)} onConfirm={() => { setCancelOpen(false); onBack(); }} />}
      {saveOpen && <ConfirmPopup title="근무 상태 저장하기" desc="근무 상태를 저장하시겠어요?" cancelLabel="취소" confirmLabel="저장하기" onCancel={() => setSaveOpen(false)} onConfirm={doSave} />}
      <BottomButtons onCancel={handleCancel} onSave={() => setSaveOpen(true)} />
    </>
  );
}

// ── 헬퍼 UI ────────────────────────────────────────────────
function FieldBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <span style={{ fontSize: "16px", fontWeight: 500, color: "#70737B", display: "block", marginBottom: "8px" }}>{label}</span>
      {children}
    </div>
  );
}

// 미선택 상태 판별 — 이 목록에 해당하면 placeholder 스타일 적용
const EMPTY_PLACEHOLDERS = new Set(["미선택", "미입력", "선택하기"]);
const isEmptyValue = (v: string) => EMPTY_PLACEHOLDERS.has(v);

// 직접 입력 필드 (화살표 없음) — 금액 입력 등
function InputField({ label, value, onTap, error, errorMsg }: { label: string; value: string; onTap: () => void; error?: boolean; errorMsg?: string }) {
  const [focused, setFocused] = useState(false);
  const empty = isEmptyValue(value);
  const border = error ? "2px solid #FF3D3D" : focused ? "2px solid #4261FF" : empty ? "1px solid #FF3D3D" : "1px solid #DBDCDF";
  return (
    <FieldBlock label={label}>
      <button onClick={onTap} onMouseDown={() => setFocused(true)} onMouseUp={() => setFocused(false)} onMouseLeave={() => setFocused(false)} onTouchStart={() => setFocused(true)} onTouchEnd={() => setFocused(false)} className="pressable select-trigger flex items-center justify-between"
        style={{ width: "100%", height: "48px", borderRadius: "10px", paddingLeft: "16px", paddingRight: "16px", border, transition: "border 0.15s", outline: "none" }}>
        <span style={{ fontSize: "16px", fontWeight: 500, color: empty ? "#70737B" : "#19191B" }}>{value}</span>
      </button>
      {error && errorMsg && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginTop: "4px" }}>{errorMsg}</p>
      )}
    </FieldBlock>
  );
}

function SelectField({ label, value, onTap, error, errorMsg }: { label: string; value: string; onTap: () => void; error?: boolean; errorMsg?: string }) {
  const [focused, setFocused] = useState(false);
  const empty = isEmptyValue(value);
  const border = error ? "2px solid #FF3D3D" : focused ? "2px solid #4261FF" : empty ? "1px solid #FF3D3D" : "1px solid #DBDCDF";
  return (
    <FieldBlock label={label}>
      <button onClick={onTap} onMouseDown={() => setFocused(true)} onMouseUp={() => setFocused(false)} onMouseLeave={() => setFocused(false)} onTouchStart={() => setFocused(true)} onTouchEnd={() => setFocused(false)} className="pressable select-trigger flex items-center justify-between"
        style={{ width: "100%", height: "48px", borderRadius: "10px", paddingLeft: "16px", paddingRight: "16px", border, transition: "border 0.15s", outline: "none" }}>
        <span style={{ fontSize: "16px", fontWeight: 500, color: empty ? "#70737B" : "#19191B" }}>{value}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {error && errorMsg && (
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#FF3D3D", marginTop: "4px" }}>{errorMsg}</p>
      )}
    </FieldBlock>
  );
}

function ToggleChip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button className="pressable" onClick={onClick} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "4px", fontSize: "14px", fontWeight: 500, width: "110px", height: "48px", borderRadius: "10px", cursor: "pointer", backgroundColor: active ? "rgba(16,201,125,0.1)" : "#FFFFFF", color: active ? "#10C97D" : "#93989E", border: `1px solid ${active ? "rgba(16,201,125,0.3)" : "#DBDCDF"}` }}>
      {active && <Check style={{ width: "14px", height: "14px" }} />} {label}
    </button>
  );
}

// ── 메인 ────────────────────────────────────────────────────
export default function StaffEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const section = searchParams.get("section") || "계약정보";

  const [staff, setStaff] = useState<StaffData | undefined>(staffStore.getById(id || ""));
  useEffect(() => {
    setStaff(staffStore.getById(id || ""));
    return staffStore.subscribe(() => setStaff(staffStore.getById(id || "")));
  }, [id]);

  if (!staff) {
    return <div className="min-h-screen bg-background max-w-lg mx-auto flex items-center justify-center"><p className="text-muted-foreground">직원 정보를 찾을 수 없습니다.</p></div>;
  }

  const sectionTitle = (staff.isNew ? SECTION_TITLES_NEW : SECTION_TITLES)[section] || (staff.isNew ? "직원 정보 등록" : "직원 정보 수정");
  const onBack = (flag?: string) => navigate(`/owner/staff/${id}`, { state: { flag } });

  // 뒤로가기 버튼 → 섹션의 handleCancel 호출
  const cancelFnRef = useRef<(() => void) | null>(null);
  const handleHeaderBack = () => {
    if (cancelFnRef.current) cancelFnRef.current();
    else onBack();
  };

  const renderSection = () => {
    const props = { staffId: id || "", initial: staff, onBack, onRequestCancel: (fn: () => void) => { cancelFnRef.current = fn; } };
    switch (section) {
      case "계약정보": return <SectionContract {...props} />;
      case "세금": return <SectionTax {...props} />;
      case "인적사항": return <SectionPersonal {...props} />;
      case "메모": return <SectionMemo {...props} />;
      case "계약서": return <SectionDocs {...props} />;
      case "근무상태": return <SectionWorkStatus {...props} />;
      default: return <SectionContract {...props} />;
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto">
      <div className="pb-24">
        <div className="sticky top-0 z-10" style={{ backgroundColor: "#FFFFFF" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "16px 8px 8px" }}>
            <button onClick={handleHeaderBack} className="pressable p-1"><ChevronLeft className="w-6 h-6 text-foreground" /></button>
            <h1 style={{ fontSize: "clamp(18px, 5vw, 20px)", fontWeight: 700, color: "#19191B", letterSpacing: "-0.02em" }}>{sectionTitle}</h1>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0 20px" }}>
          <div style={{ width: "clamp(100px, 32vw, 120px)", height: "clamp(100px, 32vw, 120px)", borderRadius: "50%", backgroundColor: staff.avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "clamp(28px, 8vw, 36px)", fontWeight: 700, color: "#FFFFFF" }}>
            {staff.name.charAt(0)}
          </div>
          <p style={{ fontSize: "clamp(18px, 5.5vw, 20px)", fontWeight: 700, letterSpacing: "-0.02em", color: "#19191B", marginTop: "clamp(12px, 4vw, 16px)" }}>{staff.name}</p>
        </div>

        <div style={{ height: "12px", backgroundColor: "#F7F7F8" }} />

        {renderSection()}
      </div>
    </div>
  );
}