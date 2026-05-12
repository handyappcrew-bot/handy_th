import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const ATTENDANCE_TYPES = ["근무완료", "연장", "야간", "휴일", "지각", "결근"] as const;
type AttendanceType = typeof ATTENDANCE_TYPES[number] | "무일정";

const EXTENSION_OPTIONS = ["30분", "1시간", "1시간 30분", "2시간", "2시간 30분", "3시간"];
const HOURS_NORMAL = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const HOURS_OVERNIGHT = Array.from({ length: 29 }, (_, i) => String(i % 24).padStart(2, "0"));
const MINUTES_ALL = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

// 급여 유형
type PayType = "시급" | "일급" | "월급" | "연봉";
const PAY_TYPES: PayType[] = ["시급", "일급", "월급", "연봉"];
const PAY_SAMPLE: Record<PayType, number> = {
  "시급": 9860,
  "일급": 78880,   // 시급 × 8h
  "월급": 2060000,
  "연봉": 24720000,
};

function TimePicker({ open, onClose, title, value, onChange, allowOvernight = false, minTime, maxHour, minHour }: {
  open: boolean; onClose: () => void; title: string;
  value: string; onChange: (v: string) => void;
  allowOvernight?: boolean; minTime?: string; maxHour?: number; minHour?: number;
}) {
  const ALL_HOURS = allowOvernight ? HOURS_OVERNIGHT : HOURS_NORMAL;
  const HOURS = ALL_HOURS.slice(minHour ?? 0, maxHour !== undefined ? maxHour + 1 : ALL_HOURS.length);

  const initH = value.split(":")[0] || "00";
  const initM = value.split(":")[1] || "00";
  const [selectedHour, setSelectedHour] = useState(initH);
  const [selectedMinute, setSelectedMinute] = useState(initM);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);
  const hScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    const h = value.split(":")[0] || "00";
    const m = value.split(":")[1] || "00";
    setSelectedHour(h);
    setSelectedMinute(m);
    const hIdx = HOURS.findIndex(x => x === h);
    const mIdx = MINUTES_ALL.findIndex(x => x === m);
    setTimeout(() => {
      if (hIdx >= 0) hourRef.current?.scrollTo({ top: hIdx * 44, behavior: "auto" });
      if (mIdx >= 0) minuteRef.current?.scrollTo({ top: mIdx * 44, behavior: "auto" });
    }, 30);
  }, [open]);

  if (!open) return null;

  const handleHourScroll = () => {
    if (hScrollTimer.current) clearTimeout(hScrollTimer.current);
    hScrollTimer.current = setTimeout(() => {
      const el = hourRef.current; if (!el) return;
      const idx = Math.round(el.scrollTop / 44);
      const clamped = Math.max(0, Math.min(HOURS.length - 1, idx));
      setSelectedHour(HOURS[clamped]);
      el.scrollTo({ top: clamped * 44, behavior: "smooth" });
    }, 100);
  };

  const handleMinuteScroll = () => {
    if (mScrollTimer.current) clearTimeout(mScrollTimer.current);
    mScrollTimer.current = setTimeout(() => {
      const el = minuteRef.current; if (!el) return;
      const idx = Math.round(el.scrollTop / 44);
      const clamped = Math.max(0, Math.min(MINUTES_ALL.length - 1, idx));
      setSelectedMinute(MINUTES_ALL[clamped]);
      el.scrollTo({ top: clamped * 44, behavior: "smooth" });
    }, 100);
  };

  const isDisabledTime = (h: string, m: string) => {
    if (!minTime || allowOvernight) return false;
    const [minH, minM] = minTime.split(":").map(Number);
    const [hh, mm] = [parseInt(h), parseInt(m)];
    return hh * 60 + mm <= minH * 60 + minM;
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-3xl bg-card px-6 pb-8 pt-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{title}</h2>
          <button onClick={onClose} className="pressable p-1"><X className="h-5 w-5 text-foreground" /></button>
        </div>

        <div className="flex items-center justify-center gap-2 relative h-[220px]">
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[44px] bg-[hsl(var(--secondary))] rounded-xl pointer-events-none z-0" />

          <div ref={hourRef} className="relative z-10 h-[220px] w-[80px] overflow-y-auto" style={{ scrollSnapType: "none" }} onScroll={handleHourScroll}>
            <div className="h-[88px]" />
            {HOURS.map((h, i) => (
              <div key={i} style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: h === selectedHour ? 700 : 400, color: h === selectedHour ? 'var(--foreground)' : 'rgba(0,0,0,0.25)', cursor: 'pointer' }}
                onClick={() => { setSelectedHour(h); hourRef.current?.scrollTo({ top: i * 44, behavior: "smooth" }); }}>
                {h}{allowOvernight && i >= 24 && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '3px' }}>+1</span>}
              </div>
            ))}
            <div className="h-[88px]" />
          </div>

          <span className="relative z-10 text-[20px] font-bold text-foreground">:</span>

          <div ref={minuteRef} className="relative z-10 h-[220px] w-[80px] overflow-y-auto" style={{ scrollSnapType: "none" }} onScroll={handleMinuteScroll}>
            <div className="h-[88px]" />
            {MINUTES_ALL.map((m, i) => (
              <div key={m} style={{ height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: m === selectedMinute ? 700 : 400, color: m === selectedMinute ? 'var(--foreground)' : 'rgba(0,0,0,0.25)', cursor: 'pointer' }}
                onClick={() => { setSelectedMinute(m); minuteRef.current?.scrollTo({ top: i * 44, behavior: "smooth" }); }}>
                {m}
              </div>
            ))}
            <div className="h-[88px]" />
          </div>
        </div>

        {minTime && isDisabledTime(selectedHour, selectedMinute) && (
          <p style={{ fontSize: '13px', color: '#FF3D3D', textAlign: 'center', marginTop: '8px' }}>출근 시간보다 빠를 수 없어요</p>
        )}

        <button onClick={() => {
          if (minTime && !allowOvernight && isDisabledTime(selectedHour, selectedMinute)) return;
          onChange(`${selectedHour}:${selectedMinute}`);
          onClose();
        }} className="pressable w-full h-14 rounded-2xl text-lg font-semibold bg-primary text-primary-foreground mt-4">
          확인
        </button>
      </div>
    </div>,
    document.body
  );
}

function Divider({ thick }: { thick?: boolean }) {
  return <div style={{ height: thick ? '12px' : '1px', backgroundColor: thick ? '#F7F7F8' : '#F0F0F0', margin: thick ? '0' : '4px 0' }} />;
}

function SelectRow({ label, value, onClick, required }: {
  label: string; value: string; onClick: () => void; required?: boolean;
}) {
  const [pressed, setPressed] = useState(false);
  return (
    <div style={{ marginBottom: '24px' }}>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#70737B', letterSpacing: '-0.02em', marginBottom: '10px' }}>
        {label}{required && <span style={{ color: '#FF3D3D' }}> *</span>}
      </p>
      <button onClick={onClick}
        onMouseDown={() => setPressed(true)} onMouseUp={() => setPressed(false)}
        onMouseLeave={() => setPressed(false)} onTouchStart={() => setPressed(true)}
        onTouchEnd={() => setPressed(false)}
        style={{ width: '100%', height: '52px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', borderRadius: '10px', border: pressed ? '2px solid #4261FF' : '1px solid #DBDCDF', backgroundColor: '#FFFFFF', cursor: 'pointer', boxSizing: 'border-box', transition: 'border 0.15s' }}>
        <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B', letterSpacing: '-0.02em' }}>{value}</span>
        <ChevronDown style={{ width: '20px', height: '20px', color: '#AAB4BF', flexShrink: 0 }} />
      </button>
    </div>
  );
}

export default function AttendanceEdit() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const staffName = searchParams.get("staffName") || "정수민";
  const dateStr = searchParams.get("date") || "2025년 11월 1일 (수)";
  const originalStatus = searchParams.get("status") || "근무완료";
  const originalShift = searchParams.get("shift") || "";
  const originalClockIn = searchParams.get("clockIn") || "13:30";
  const originalClockOut = searchParams.get("clockOut") || "17:00";
  const staffSalaryType = (searchParams.get("salaryType") || "시급") as PayType;
  const staffSalaryAmount = Number(searchParams.get("salaryAmount") || PAY_SAMPLE["시급"]);

  const isNoSchedule = originalStatus === "무일정";

  const [selectedType, setSelectedType] = useState<AttendanceType>(
    isNoSchedule ? "무일정" : (originalStatus as AttendanceType)
  );
  const [typePickerOpen, setTypePickerOpen] = useState(false);
  const [contractIn, setContractIn] = useState(originalClockIn);
  const [contractOut, setContractOut] = useState(originalClockOut);
  const [contractInPickerOpen, setContractInPickerOpen] = useState(false);
  const [contractOutPickerOpen, setContractOutPickerOpen] = useState(false);
  const [clockIn, setClockIn] = useState(originalClockIn);
  const [clockInPickerOpen, setClockInPickerOpen] = useState(false);
  const [clockOut, setClockOut] = useState(originalClockOut);
  const [clockOutPickerOpen, setClockOutPickerOpen] = useState(false);
  const [extensionTime, setExtensionTime] = useState("1시간 30분");
  const [extensionPickerOpen, setExtensionPickerOpen] = useState(false);
  const [lateTime, setLateTime] = useState("00:10");
  const [lateTimePickerOpen, setLateTimePickerOpen] = useState(false);
  const [salaryOption, setSalaryOption] = useState<string>("");
  // 급여 유형은 직원관리 등록값 고정 (선택 불가)
  const payType = staffSalaryType;
  const [confirmOpen, setConfirmOpen] = useState(false);

  const showTimeFields = selectedType === "근무완료" || selectedType === "연장" || selectedType === "지각" || selectedType === "야간" || selectedType === "휴일";
  const showExtension = selectedType === "연장";
  const showLate = selectedType === "지각";
  const isDisabled = selectedType === "무일정";

  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

  const calcTotalMin = () => {
    let diff = toMin(clockOut) - toMin(clockIn);
    if (diff < 0) diff += 24 * 60;
    return diff;
  };

  const calcTotalTime = () => {
    const total = calcTotalMin();
    const h = Math.floor(total / 60), m = total % 60;
    return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
  };

  const isClockOutInvalid = (() => {
    if (selectedType === "야간" || selectedType === "연장") return false;
    // 같은 시간이면 무효, 다른 시간이면 익일 허용
    return toMin(clockOut) === toMin(clockIn);
  })();

  const HOURLY_WAGE = staffSalaryAmount;

  // 급여 유형별 시급 환산
  const toHourlyRate = () => {
    if (payType === "시급") return HOURLY_WAGE;
    if (payType === "일급") return HOURLY_WAGE / 8;
    if (payType === "월급") return HOURLY_WAGE / 209; // 월 209시간 기준
    if (payType === "연봉") return HOURLY_WAGE / 2508; // 연 2508시간 기준
    return HOURLY_WAGE;
  };

  const hourlyRate = toHourlyRate();

  const calcSalaryChange = () => {
    if (selectedType === "근무완료") {
      const pay = Math.round((calcTotalMin() / 60) * hourlyRate);
      return { amount: pay, color: "#10C97D", sign: "+", desc: payType === "시급" ? `시급 ${HOURLY_WAGE.toLocaleString()}원 × ${calcTotalTime()}` : payType === "일급" ? `일급 ${HOURLY_WAGE.toLocaleString()}원 기준` : payType === "월급" ? `월급 ${HOURLY_WAGE.toLocaleString()}원 ÷ 209h × ${calcTotalTime()}` : `연봉 ${HOURLY_WAGE.toLocaleString()}원 ÷ 2508h × ${calcTotalTime()}` };
    }
    if (selectedType === "연장") {
      const [schH, schM] = contractOut.split(":").map(Number);
      const [actH, actM] = clockOut.split(":").map(Number);
      let extMin = (actH * 60 + actM) - (schH * 60 + schM);
      if (extMin < 0) extMin += 24 * 60;
      const extHStr = (() => { const h = Math.floor(extMin/60), m = extMin%60; return m===0?`${h}시간`:`${h}시간 ${m}분`; })();
      const pay = Math.round((extMin / 60) * hourlyRate * 1.5);
      return { amount: pay, color: "#7488FE", sign: "+", desc: `${payType === "시급" ? `시급 ${HOURLY_WAGE.toLocaleString()}원` : `환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`} × 1.5배 × ${extHStr}` };
    }
    if (selectedType === "야간") {
      const NIGHT_START = 22 * 60;
      const inMin = toMin(clockIn);
      let outMin = toMin(clockOut);
      if (outMin <= NIGHT_START) outMin += 24 * 60;
      const nightMin = Math.max(0, outMin - Math.max(inMin, NIGHT_START));
      const nightHStr = (() => { const h = Math.floor(nightMin/60), m = nightMin%60; return m===0?`${h}시간`:`${h}시간 ${m}분`; })();
      const pay = Math.round((nightMin / 60) * hourlyRate * 0.5);
      return { amount: pay, color: "#6B4FEC", sign: "+", desc: `${payType === "시급" ? `시급 ${HOURLY_WAGE.toLocaleString()}원` : `환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`} × 0.5배 추가 × ${nightHStr}` };
    }
    if (selectedType === "지각") {
      const [lH, lM] = lateTime.split(":").map(Number);
      const lateMin = lH * 60 + lM;
      const pay = Math.round((lateMin / 60) * hourlyRate);
      const lateStr = lM === 0 ? `${lH}시간` : lH === 0 ? `${lM}분` : `${lH}시간 ${lM}분`;
      return { amount: pay, color: "#FF862D", sign: "-", desc: `${payType === "시급" ? `시급 ${HOURLY_WAGE.toLocaleString()}원` : `환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`} × ${lateStr}` };
    }
    if (selectedType === "휴일") {
      const totalMin = calcTotalMin();
      const totalH = Math.floor(totalMin / 60), totalM = totalMin % 60;
      const totalStr = totalM === 0 ? `${totalH}시간` : `${totalH}시간 ${totalM}분`;
      const pay = Math.round((totalMin / 60) * hourlyRate * 1.5);
      return { amount: pay, color: "#E05C00", sign: "+", desc: `${payType === "시급" ? `시급 ${HOURLY_WAGE.toLocaleString()}원` : `환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`} × 1.5배 × ${totalStr}` };
    }
    if (selectedType === "결근") {
      const pay = payType === "월급" ? Math.round(HOURLY_WAGE / 30)
        : payType === "연봉" ? Math.round(HOURLY_WAGE / 365)
        : payType === "일급" ? HOURLY_WAGE
        : Math.round(hourlyRate * 8);
      const desc = payType === "월급" ? `월급 ${HOURLY_WAGE.toLocaleString()}원 ÷ 30일`
        : payType === "연봉" ? `연봉 ${HOURLY_WAGE.toLocaleString()}원 ÷ 365일`
        : payType === "일급" ? `일급 ${HOURLY_WAGE.toLocaleString()}원`
        : `시급 ${HOURLY_WAGE.toLocaleString()}원 × 8시간`;
      return { amount: pay, color: "#FF3D3D", sign: "-", desc };
    }
    return null;
  };

  const salaryInfo = calcSalaryChange();

  const handleConfirm = () => {
    setConfirmOpen(false);
    toast({ description: "근태 정보가 수정 되었어요." });
    navigate(-1);
  };

  const BottomSheet = ({ open, onClose, title, children }: {
    open: boolean; onClose: () => void; title: string; children: React.ReactNode;
  }) => {
    if (!open) return null;
    return createPortal(
      <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={onClose}>
        <div style={{ width: '100%', maxWidth: '512px', borderRadius: '20px 20px 0 0', backgroundColor: '#FFFFFF', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
          <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{title}</h2>
            <button onClick={onClose} className="pressable p-1"><X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} /></button>
          </div>
          <div style={{ overflowY: 'auto', padding: '0 20px 32px' }}>{children}</div>
        </div>
      </div>,
      document.body
    );
  };

  const OptionItem = ({ label, selected, onSelect, disabled }: { label: string; selected: boolean; onSelect: () => void; disabled?: boolean }) => (
    <button onClick={disabled ? undefined : onSelect} disabled={disabled}
      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 12px', borderRadius: '12px', backgroundColor: selected ? '#F0F4FF' : 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.35 : 1 }}>
      <span style={{ fontSize: '16px', fontWeight: selected ? 700 : 500, color: selected ? '#4261FF' : '#19191B', letterSpacing: '-0.02em' }}>{label}</span>
      {selected && <Check style={{ width: '18px', height: '18px', color: '#4261FF' }} />}
    </button>
  );

  // 계약 근무 카드 (연장/야간 공통)
  const ContractCard = ({ contractStr }: { contractStr: string }) => isNoSchedule ? (
    <>
      <p style={{ fontSize: '14px', fontWeight: 600, color: '#70737B', letterSpacing: '-0.02em', marginBottom: '10px' }}>계약 근무 시간</p>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: '#9EA3AD', marginBottom: '6px' }}>계약 출근</p>
          <SelectRow label="" value={contractIn} onClick={() => setContractInPickerOpen(true)} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: '12px', color: '#9EA3AD', marginBottom: '6px' }}>계약 퇴근</p>
          <SelectRow label="" value={contractOut} onClick={() => setContractOutPickerOpen(true)} />
        </div>
      </div>
    </>
  ) : (
    <div style={{ backgroundColor: '#F7F7F8', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
      <p style={{ fontSize: '12px', color: '#9EA3AD', fontWeight: 500, marginBottom: '6px' }}>계약 근무 시간</p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {originalShift && <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px', backgroundColor: '#E8F3FF', color: '#4261FF' }}>{originalShift}</span>}
          <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{contractIn} - {contractOut}</span>
        </div>
        <span style={{ fontSize: '13px', color: '#9EA3AD' }}>{contractStr}</span>
      </div>
    </div>
  );

  const makeContractStr = () => {
    const [sH, sM] = contractIn.split(":").map(Number);
    const [eH, eM] = contractOut.split(":").map(Number);
    let m = (eH*60+eM)-(sH*60+sM); if (m<0) m+=24*60;
    const h=Math.floor(m/60), mn=m%60;
    return mn===0?`${h}시간`:`${h}시간 ${mn}분`;
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate(-1)} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>근태 정보 수정</h1>
          </div>
        </div>

        <div style={{ padding: '20px 20px 0' }}>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '28px' }}>
            {staffName} 직원의 근태 정보 수정
          </p>

          <p style={{ fontSize: '14px', fontWeight: 500, color: '#9EA3AD', letterSpacing: '-0.02em', marginBottom: '10px' }}>수정할 근태</p>
          <div style={{ backgroundColor: '#F0F4FF', borderRadius: '14px', padding: '14px 16px', marginBottom: '28px' }}>
            <p style={{ fontSize: '15px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
              {dateStr} {isNoSchedule ? "[무일정]" : `[${originalStatus}]`}
            </p>
            {!isNoSchedule && originalStatus !== "결근" && originalShift && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#4261FF' }}>{originalShift}</span>
                <span style={{ fontSize: '14px', color: '#70737B' }}>{originalClockIn} - {originalClockOut}</span>
              </div>
            )}
          </div>

          <SelectRow label="근태 유형" value={selectedType} onClick={() => setTypePickerOpen(true)} required />
          {isDisabled && <p style={{ fontSize: '13px', color: '#AAB4BF', marginTop: '-16px', marginBottom: '24px' }}>변경하실 근태 유형을 선택해주세요</p>}

          {/* 출근/퇴근 — 연장/야간 제외 */}
          {showTimeFields && selectedType !== "연장" && selectedType !== "야간" && (
            <SelectRow label="출근 시간" value={clockIn} onClick={() => setClockInPickerOpen(true)} required />
          )}
          {showTimeFields && selectedType !== "연장" && selectedType !== "야간" && (            <>
              <SelectRow label="퇴근 시간" value={clockOut} onClick={() => setClockOutPickerOpen(true)} required />
              {isClockOutInvalid
                ? <p style={{ fontSize: '13px', color: '#FF3D3D', marginTop: '-16px', marginBottom: '24px' }}>출근 시간과 퇴근 시간이 같을 수 없어요</p>
                : <p style={{ fontSize: '13px', color: '#9EA3AD', marginTop: '-16px', marginBottom: '24px' }}>총 근무시간: {calcTotalTime()}{toMin(clockOut) < toMin(clockIn) ? ' (익일)' : ''}</p>}
            </>
          )}

          {/* 연장 */}
          {showExtension && (() => {
            const contractStr = makeContractStr();
            const [schH, schM] = contractOut.split(":").map(Number);
            const [actH, actM] = clockOut.split(":").map(Number);
            let extMin = (actH*60+actM)-(schH*60+schM); if (extMin<0) extMin+=24*60;
            const extH2=Math.floor(extMin/60), extM2=extMin%60;
            const extStr = extMin<=0?"0분":extM2===0?`${extH2}시간`:`${extH2}시간 ${extM2}분`;
            const overNight = actH < schH;
            return (
              <>
                <ContractCard contractStr={contractStr} />
                <SelectRow label="실제 퇴근 시간" value={`${clockOut}${overNight?" (익일)":""}`} onClick={() => setClockOutPickerOpen(true)} required />
                <div style={{ backgroundColor: '#F0F4FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', border: '1px solid rgba(116,136,254,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#7488FE', fontWeight: 600, marginBottom: '8px' }}>연장 근무 내역</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>계약 퇴근</span>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>{contractOut}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>실제 퇴근</span>
                    <span style={{ fontSize: '14px', color: '#7488FE', fontWeight: 600 }}>{clockOut}{overNight?" (익일)":""}</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'rgba(116,136,254,0.15)', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#7488FE' }}>연장 시간</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#7488FE' }}>+{extStr}</span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 야간 */}
          {selectedType === "야간" && (() => {
            const contractStr = makeContractStr();
            const NIGHT_START = 22*60;
            const inMin = toMin(contractIn);
            let outMin = toMin(clockOut);
            if (outMin <= NIGHT_START) outMin += 24*60;
            const nightMin = Math.max(0, outMin - Math.max(inMin, NIGHT_START));
            const nH=Math.floor(nightMin/60), nM=nightMin%60;
            const nightStr = nightMin<=0?"0분":nM===0?`${nH}시간`:`${nH}시간 ${nM}분`;
            return (
              <>
                <ContractCard contractStr={contractStr} />
                <SelectRow label="실제 퇴근 시간 (익일)" value={clockOut} onClick={() => setClockOutPickerOpen(true)} required />
                <div style={{ backgroundColor: '#F5F2FF', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', border: '1px solid rgba(107,79,236,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#6B4FEC', fontWeight: 600, marginBottom: '8px' }}>야간 근무 내역</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>야간 시작 (22:00 이후)</span>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>22:00</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>실제 퇴근</span>
                    <span style={{ fontSize: '14px', color: '#6B4FEC', fontWeight: 600 }}>{clockOut} (익일)</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'rgba(107,79,236,0.15)', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: '#6B4FEC' }}>야간 시간</span>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: '#6B4FEC' }}>+{nightStr}</span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 지각 */}
          {showLate && (() => {
            const [lH, lM] = lateTime.split(":").map(Number);
            const lateMin = lH*60+lM;
            let totalMin = toMin(clockOut)-toMin(clockIn); if (totalMin<0) totalMin+=24*60;
            const actualMin = Math.max(0, totalMin-lateMin);
            const aH=Math.floor(actualMin/60), aM=actualMin%60;
            const actualStr = aM===0?`${aH}시간`:`${aH}시간 ${aM}분`;
            const lateStr = lM===0?`${lH}시간`:lH===0?`${lM}분`:`${lH}시간 ${lM}분`;
            return (
              <>
                <SelectRow label="지각 시간" value={lateStr} onClick={() => setLateTimePickerOpen(true)} required />
                <div style={{ backgroundColor: '#FFF5EC', borderRadius: '12px', padding: '14px 16px', marginBottom: '24px', border: '1px solid rgba(255,134,45,0.2)' }}>
                  <p style={{ fontSize: '12px', color: '#FF862D', fontWeight: 600, marginBottom: '8px' }}>지각 근무 내역</p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>출근</span>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>{clockIn}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>퇴근</span>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>{clockOut}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', color: '#70737B' }}>지각</span>
                    <span style={{ fontSize: '14px', color: '#FF862D', fontWeight: 600 }}>-{lateStr}</span>
                  </div>
                  <div style={{ height: '1px', backgroundColor: 'rgba(255,134,45,0.2)', marginBottom: '8px' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#19191B' }}>실제 근무</span>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{actualStr}</span>
                  </div>
                </div>
              </>
            );
          })()}

          {/* 급여 처리 */}
          {(selectedType === "근무완료" || selectedType === "연장" || selectedType === "야간" || selectedType === "휴일" || selectedType === "지각" || selectedType === "결근") && (
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#70737B', letterSpacing: '-0.02em', marginBottom: '10px' }}>급여 처리</p>

              {/* 직원 등록 급여 유형 표시 (직원관리 기준) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', padding: '10px 14px', backgroundColor: '#F7F7F8', borderRadius: '10px' }}>
                <span style={{ fontSize: '13px', color: '#70737B' }}>급여 유형</span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#19191B' }}>{payType}</span>
                <span style={{ fontSize: '13px', color: '#9EA3AD', marginLeft: 'auto' }}>{HOURLY_WAGE.toLocaleString()}원</span>
              </div>

              {/* 예상 급여 변동 */}
              {salaryInfo && (
                <div style={{ backgroundColor: '#F7F7F8', borderRadius: '12px', padding: '14px 16px', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <div>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: '#70737B', marginBottom: '4px' }}>예상 급여 변동</p>
                      <p style={{ fontSize: '12px', color: '#9EA3AD' }}>{salaryInfo.desc}</p>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: 700, color: salaryInfo.color, flexShrink: 0, marginLeft: '8px' }}>
                      {salaryInfo.sign}{salaryInfo.amount.toLocaleString()}원
                    </span>
                  </div>
                  <p style={{ fontSize: '11px', color: '#AAB4BF', marginTop: '4px' }}>
                    {payType === "시급" && `시급 ${PAY_SAMPLE[payType].toLocaleString()}원 기준`}
                    {payType === "일급" && `일급 ${PAY_SAMPLE[payType].toLocaleString()}원 → 환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`}
                    {payType === "월급" && `월급 ${PAY_SAMPLE[payType].toLocaleString()}원 ÷ 월 209시간 → 환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`}
                    {payType === "연봉" && `연봉 ${PAY_SAMPLE[payType].toLocaleString()}원 ÷ 연 2508시간 → 환산 시급 ${Math.round(hourlyRate).toLocaleString()}원`}
                    {" · 실제 급여와 다를 수 있어요"}
                  </p>
                </div>
              )}

              {/* 급여 처리 선택 버튼 */}
              {selectedType === "근무완료" && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {["급여 반영", "급여 미반영"].map(opt => {
                    const sel = salaryOption === opt;
                    return <button key={opt} onClick={() => setSalaryOption(opt)} style={{ flex: 1, height: '48px', borderRadius: '10px', border: sel ? '2px solid #4261FF' : '1px solid #DBDCDF', backgroundColor: sel ? '#F0F4FF' : '#FFFFFF', fontSize: '14px', fontWeight: 600, color: sel ? '#4261FF' : '#70737B', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.02em' }}>{opt}</button>;
                  })}
                </div>
              )}
              {(selectedType === "연장" || selectedType === "야간" || selectedType === "휴일") && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {["수당 지급", "수당 미지급"].map(opt => {
                    const sel = salaryOption === opt;
                    return <button key={opt} onClick={() => setSalaryOption(opt)} style={{ flex: 1, height: '48px', borderRadius: '10px', border: sel ? '2px solid #4261FF' : '1px solid #DBDCDF', backgroundColor: sel ? '#F0F4FF' : '#FFFFFF', fontSize: '14px', fontWeight: 600, color: sel ? '#4261FF' : '#70737B', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.02em' }}>{opt}</button>;
                  })}
                </div>
              )}
              {(selectedType === "지각" || selectedType === "결근") && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  {["급여 차감", "차감 없음"].map(opt => {
                    const sel = salaryOption === opt;
                    return <button key={opt} onClick={() => setSalaryOption(opt)} style={{ flex: 1, height: '48px', borderRadius: '10px', border: sel ? '2px solid #4261FF' : '1px solid #DBDCDF', backgroundColor: sel ? '#F0F4FF' : '#FFFFFF', fontSize: '14px', fontWeight: 600, color: sel ? '#4261FF' : '#70737B', cursor: 'pointer', transition: 'all 0.15s', letterSpacing: '-0.02em' }}>{opt}</button>;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {createPortal(
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40, backgroundColor: '#FFFFFF', borderTop: '1px solid #F7F7F8' }}>
          <div style={{ maxWidth: '512px', margin: '0 auto', padding: '16px 20px' }}>
            <button onClick={() => !(isDisabled || isClockOutInvalid) && setConfirmOpen(true)}
              style={{ width: '100%', height: '56px', borderRadius: '16px', border: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: (isDisabled || isClockOutInvalid) ? '#AAB4BF' : '#FFFFFF', backgroundColor: (isDisabled || isClockOutInvalid) ? '#F7F7F8' : '#4261FF', cursor: (isDisabled || isClockOutInvalid) ? 'default' : 'pointer' }}>
              근태 정보 수정하기
            </button>
          </div>
        </div>,
        document.body
      )}

      <BottomSheet open={typePickerOpen} onClose={() => setTypePickerOpen(false)} title="근태 유형 선택">
        {ATTENDANCE_TYPES.map(type => (
          <OptionItem key={type} label={type} selected={selectedType === type} onSelect={() => { setSelectedType(type); setTypePickerOpen(false); }} />
        ))}
      </BottomSheet>

      <TimePicker open={clockInPickerOpen} onClose={() => setClockInPickerOpen(false)} title="출근 시간 선택" value={clockIn} onChange={setClockIn} />
      <TimePicker open={clockOutPickerOpen} onClose={() => setClockOutPickerOpen(false)} title="퇴근 시간 선택"
        value={clockOut} onChange={setClockOut}
        allowOvernight={true}
        minHour={selectedType === "야간" ? 22 : undefined} />
      <TimePicker open={lateTimePickerOpen} onClose={() => setLateTimePickerOpen(false)} title="지각 시간 선택" value={lateTime} onChange={setLateTime} maxHour={3} />
      <TimePicker open={contractInPickerOpen} onClose={() => setContractInPickerOpen(false)} title="계약 출근 시간" value={contractIn} onChange={setContractIn} />
      <TimePicker open={contractOutPickerOpen} onClose={() => setContractOutPickerOpen(false)} title="계약 퇴근 시간" value={contractOut} onChange={v => { setContractOut(v); setClockOut(v); }} minTime={contractIn} />

      {confirmOpen && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={() => setConfirmOpen(false)}>
          <div className="animate-in zoom-in-95" style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>근태 정보 수정</h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.6', letterSpacing: '-0.02em', whiteSpace: 'pre-line' }}>
              {"해당 직원의 근태 정보를 수정하시겠어요?\n수정 즉시 해당 직원의 근태 정보가\n변경 처리돼요"}
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setConfirmOpen(false)} style={{ flex: 1, height: '52px', backgroundColor: '#F7F7F8', color: '#70737B', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '-0.02em' }}>취소</button>
              <button onClick={handleConfirm} style={{ flex: 1, height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer', letterSpacing: '-0.02em' }}>확인</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
