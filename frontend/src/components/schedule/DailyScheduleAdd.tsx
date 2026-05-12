import { createPortal } from "react-dom";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";
import { format } from "date-fns";

type ShiftType = "오픈" | "미들" | "마감";

interface StaffMember {
  id: string;
  name: string;
  avatarColor: string;
  shifts: ShiftType[];
  employmentType: string;
  workDays: string;
  startTime: string;
  endTime: string;
}

const MOCK_STAFF: StaffMember[] = [
  { id: "1", name: "김정민", avatarColor: "#A78BFA", shifts: ["오픈"], employmentType: "정규직", workDays: "월, 화, 수, 목, 금", startTime: "08:00", endTime: "13:00" },
  { id: "2", name: "문자영", avatarColor: "#C0392B", shifts: ["오픈", "미들"], employmentType: "알바생", workDays: "월, 화", startTime: "08:00", endTime: "16:00" },
  { id: "3", name: "키키치", avatarColor: "#A78BFA", shifts: ["미들"], employmentType: "알바생", workDays: "목", startTime: "12:00", endTime: "18:00" },
  { id: "4", name: "러블리치", avatarColor: "#A78BFA", shifts: ["미들"], employmentType: "알바생", workDays: "목, 금", startTime: "12:00", endTime: "18:00" },
  { id: "5", name: "마메치", avatarColor: "#A78BFA", shifts: ["미들", "마감"], employmentType: "알바생", workDays: "목, 금, 토", startTime: "12:00", endTime: "22:00" },
  { id: "6", name: "오야지치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "알바생", workDays: "목, 금", startTime: "18:00", endTime: "22:00" },
  { id: "7", name: "주댕치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "", workDays: "토, 일", startTime: "18:00", endTime: "22:00" },
];

const SHIFT_BADGE: Record<ShiftType, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const TIME_OPTIONS = [
  "오전 06:00", "오전 07:00", "오전 08:00", "오전 09:00", "오전 10:00", "오전 11:00",
  "오후 12:00", "오후 13:00", "오후 14:00", "오후 15:00", "오후 16:00", "오후 17:00",
  "오후 18:00", "오후 19:00", "오후 20:00", "오후 21:00", "오후 22:00", "오후 23:00",
];

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { year: number; month: number; date: number; isOutside: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    cells.push({ year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), isOutside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ year, month, date: d, isOutside: false });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), isOutside: true });
  }
  return cells;
}

function ShiftBadge({ shifts }: { shifts: ShiftType[] }) {
  const label = shifts.join(", ");
  const badgeClass = SHIFT_BADGE[shifts[0]];
  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>
      {label}
    </span>
  );
}

export default function DailyScheduleAdd({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [calendarDates, setCalendarDates] = useState<Date[]>([]);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeTimePicker, setActiveTimePicker] = useState<"start" | "end" | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const calWeeks = useMemo(() => {
    const w: typeof calDays[] = [];
    for (let i = 0; i < calDays.length; i += 7) w.push(calDays.slice(i, i + 7));
    return w;
  }, [calDays]);

  const staff = MOCK_STAFF.find((s) => s.id === selectedStaff);
  const isStep1Valid = !!selectedStaff;
  const isStep2Valid = !!(startTime && endTime);

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    toast({ description: "일정이 추가되었어요", duration: 2000 });
    onClose();
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else onClose();
  };

  const formatDateLabel = (dates: Date[]) => {
    if (dates.length === 0) return "근무일 선택";
    return dates
      .sort((a, b) => a.getTime() - b.getTime())
      .map((d) => `${format(d, "yyyy.MM.dd")} (${DAY_NAMES[d.getDay()]})`)
      .join(", ");
  };

  const toggleDate = (d: { year: number; month: number; date: number; isOutside: boolean }) => {
    if (d.isOutside) return;
    const dateObj = new Date(d.year, d.month, d.date);
    setCalendarDates((prev) => {
      const exists = prev.some((p) => p.toDateString() === dateObj.toDateString());
      return exists ? prev.filter((p) => p.toDateString() !== dateObj.toDateString()) : [...prev, dateObj];
    });
  };

  const todayDate = new Date();
  const isToday = (y: number, m: number, d: number) =>
    todayDate.getFullYear() === y && todayDate.getMonth() === m && todayDate.getDate() === d;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2">
        <button onClick={handleBack} className="pressable p-1">
          <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>일일 일정 추가</h1>
      </div>

      {/* Step 1: 직원 선택 */}
      {step === 1 && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            일일 일정을 등록할<br />직원을 선택해 주세요
          </h2>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>근무직원</span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {MOCK_STAFF.length}명</span>
          </div>

          <div className="flex flex-col">
            {MOCK_STAFF.map((s) => {
              const isSelected = selectedStaff === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl"
                  style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
                    style={{ backgroundColor: s.avatarColor }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      <ShiftBadge shifts={s.shifts} />
                      {s.employmentType && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>
                          {s.employmentType}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>{s.workDays}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: 날짜·시간 입력 */}
      {step === 2 && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            등록할 일일 일정의<br />날짜와 시간을 입력해 주세요
          </h2>

          <p style={{ fontSize: '16px', fontWeight: 500, color: '#70737B', marginBottom: '16px' }}>직원선택</p>
          {staff && (
            <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', height: '68px', marginBottom: '30px' }}>
              <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: staff.avatarColor }}>
                {staff.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
                  <ShiftBadge shifts={staff.shifts} />
                  {staff.employmentType && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{staff.employmentType}</span>
                  )}
                </div>
                <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>{staff.workDays}</p>
              </div>
            </div>
          )}

          <p style={{ fontSize: '16px', fontWeight: 500, color: '#70737B', marginBottom: '16px' }}>근무일</p>
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-between"
            style={{ minHeight: '52px', padding: '12px 16px', border: '1px solid #DBDCDF', borderRadius: '10px', marginBottom: '4px', backgroundColor: '#FFFFFF', alignItems: 'flex-start' }}
          >
            <span style={{ fontSize: '15px', color: calendarDates.length > 0 ? '#19191B' : '#9EA3AD', textAlign: 'left', flex: 1, lineHeight: '1.5' }}>
              {formatDateLabel(calendarDates)}
            </span>
            <ChevronRight style={{ width: '20px', height: '20px', color: '#9EA3AD', flexShrink: 0, marginTop: '2px' }} />
          </button>
          <p style={{ fontSize: '14px', color: '#AAB4BF', marginBottom: '30px' }}>*근무일 복수 선택이 가능해요</p>

          <p style={{ fontSize: '16px', fontWeight: 500, color: '#70737B', marginBottom: '16px' }}>출근 시간</p>
          <div style={{ marginBottom: '30px' }}>
            <button
              onClick={() => setActiveTimePicker('start')}
              className="w-full flex items-center justify-between"
              style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
            >
              <span style={{ fontSize: '15px', color: startTime ? '#19191B' : '#9EA3AD' }}>
                {startTime || "출근 시간 선택"}
              </span>
              <ChevronRight style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>

          <p style={{ fontSize: '16px', fontWeight: 500, color: '#70737B', marginBottom: '16px' }}>퇴근 시간</p>
          <div style={{ marginBottom: '30px' }}>
            <button
              onClick={() => setActiveTimePicker('end')}
              className="w-full flex items-center justify-between"
              style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}
            >
              <span style={{ fontSize: '15px', color: endTime ? '#19191B' : '#9EA3AD' }}>
                {endTime || "퇴근 시간 선택"}
              </span>
              <ChevronRight style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
            {startTime && endTime && (() => {
              const toMin = (t: string) => { const clean = t.replace('오전 ', '').replace('오후 ', ''); const [h, m] = clean.split(':').map(Number); return h * 60 + (m || 0); };
              const diff = toMin(endTime) - toMin(startTime);
              if (diff <= 0) return null;
              const h = Math.floor(diff / 60); const m = diff % 60;
              const label = [h > 0 ? `${h}시간` : '', m > 0 ? `${m}분` : ''].filter(Boolean).join(' ');
              return <p className="text-[14px]" style={{ color: '#AAB4BF', marginTop: '6px' }}>총 {label} 근무</p>;
            })()}
          </div>
        </div>
      )}

      {/* Bottom button */}
      {step === 1 ? (
        <div style={{ padding: '16px 20px 32px' }}>
          <button
            onClick={handleNext}
            disabled={!isStep1Valid}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', letterSpacing: '-0.02em', backgroundColor: isStep1Valid ? '#4261FF' : '#EAECEF', color: isStep1Valid ? '#FFFFFF' : '#9EA3AD' }}
          >
            다음
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 20px 32px', display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setStep(1)}
            style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', backgroundColor: '#DEEBFF', color: '#4261FF', border: 'none', cursor: 'pointer' }}
          >
            이전
          </button>
          <button
            onClick={handleNext}
            disabled={!isStep2Valid}
            style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', backgroundColor: isStep2Valid ? '#4261FF' : '#EAECEF', color: isStep2Valid ? '#FFFFFF' : '#9EA3AD', border: 'none', cursor: 'pointer' }}
          >
            추가하기
          </button>
        </div>
      )}

      {/* 날짜 선택 풀스크린 */}
      {showDatePicker && createPortal(
        <div className="fixed inset-0 z-[300] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => setShowDatePicker(false)} className="pressable p-1">
              <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>일일 일정 추가</h1>
          </div>
          <div className="flex-1 overflow-auto scrollbar-hide px-5">
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
              {staff?.name} 님의 일정에서<br />근무일을 선택해주세요
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 4px 12px' }}>
              <button onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1">
                <ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} />
              </button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{calYear}년 {calMonth + 1}월</span>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1">
                <ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} />
              </button>
            </div>
            <div className="grid grid-cols-7" style={{ marginBottom: '4px' }}>
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>
                  {day}
                </div>
              ))}
            </div>
            {calWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 mb-1">
                {week.map((d, di) => {
                  const dateObj = new Date(d.year, d.month, d.date);
                  const staffWorkDays = staff ? staff.workDays.split(",").map((s) => s.trim()) : [];
                  const dayName = ["일", "월", "화", "수", "목", "금", "토"][dateObj.getDay()];
                  const isWork = !d.isOutside && staffWorkDays.includes(dayName);
                  const isSelectable = !d.isOutside && !isWork;
                  const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                  const isSelected = !d.isOutside && calendarDates.some((p) => p.toDateString() === dateObj.toDateString());
                  const isSun = di === 0; const isSat = di === 6;
                  const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                  const schedule = isWork && staff ? { startTime: staff.startTime, endTime: staff.endTime, shift: staff.shifts[0] } : null;
                  const shiftStyle: Record<string, { bg: string; color: string }> = {
                    '오픈': { bg: '#FDF9DF', color: '#FFB300' },
                    '미들': { bg: '#ECFFF1', color: '#1EDC83' },
                    '마감': { bg: '#E8F9FF', color: '#14C1FA' },
                  };
                  return (
                    <button
                      key={di}
                      onClick={() => { if (isSelectable) toggleDate(d); }}
                      className="pressable flex flex-col items-center py-1 w-full"
                      style={{ minHeight: '72px' }}
                      disabled={d.isOutside || isWork}
                    >
                      <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                          {d.date}
                        </span>
                      </div>
                      {schedule && (() => {
                        const st = shiftStyle[schedule.shift ?? '미들'] ?? { bg: '#ECFFF1', color: '#1EDC83' };
                        const bg = isSelected ? '#E8F3FF' : st.bg;
                        const col = isSelected ? '#7488FE' : st.color;
                        return (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', backgroundColor: bg, borderRadius: '4px', padding: '2px 0' }}>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: col, lineHeight: '1.3' }}>{schedule.startTime}</span>
                            <span style={{ fontSize: '9px', color: col, lineHeight: '1' }}>-</span>
                            <span style={{ fontSize: '11px', fontWeight: 500, color: col, lineHeight: '1.3' }}>{schedule.endTime}</span>
                          </div>
                        );
                      })()}
                    </button>
                  );
                })}
              </div>
            ))}
            <p style={{ fontSize: '13px', color: '#AAB4BF', marginTop: '8px' }}>*복수 선택이 가능해요</p>
          </div>
          <div style={{ padding: '16px 20px 32px' }}>
            <button
              onClick={() => setShowDatePicker(false)}
              style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#4261FF', color: '#FFFFFF' }}
            >
              확인
            </button>
          </div>
        </div>,
        document.body
      )}

      {/* 시간 선택 바텀시트 */}
      {activeTimePicker && createPortal(
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50" onClick={() => setActiveTimePicker(null)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 20px 12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
                {activeTimePicker === 'start' ? '출근 시간 선택' : '퇴근 시간 선택'}
              </h3>
              <button onClick={() => setActiveTimePicker(null)} className="pressable p-1">
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '320px', paddingBottom: '8px' }}>
              {TIME_OPTIONS.map((t) => {
                const toMin = (s: string) => { const c = s.replace('오전 ', '').replace('오후 ', ''); const [h, m] = c.split(':').map(Number); return h * 60 + (m || 0); };
                if (activeTimePicker === 'end' && startTime && toMin(t) <= toMin(startTime)) return null;
                const currentVal = activeTimePicker === 'start' ? startTime : endTime;
                const isSelected = currentVal === t;
                return (
                  <button
                    key={t}
                    className="pressable w-full flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF' }}
                    onClick={() => {
                      if (activeTimePicker === 'start') setStartTime(t);
                      else setEndTime(t);
                      setActiveTimePicker(null);
                    }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#4261FF' : '#19191B', letterSpacing: '-0.02em' }}>{t}</span>
                    {isSelected && <Check className="w-5 h-5" style={{ color: '#4261FF' }} />}
                  </button>
                );
              })}
            </div>
            <div style={{ height: '32px' }} />
          </div>
        </div>,
        document.body
      )}

      {/* 확인 팝업 */}
      {showConfirm && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>일일 일정 추가하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              작성한 일정을 등록하시겠어요?<br />
              추가된 근무 일정은 해당 직원에게도 안내돼요
            </p>
            <div className="text-left text-[13px] space-y-1.5 w-full mb-5 p-3 rounded-xl" style={{ backgroundColor: '#F7F8FA' }}>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>직원</span><span style={{ fontWeight: 700, color: '#19191B' }}>{staff?.name}</span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>근무일</span><span style={{ color: '#19191B' }}>{formatDateLabel(calendarDates)}</span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>근무시간</span><span style={{ color: '#4261FF', fontWeight: 700 }}>{startTime} - {endTime}</span></div>
            </div>
            <div className="flex" style={{ gap: '8px', width: '100%' }}>
              <button onClick={() => setShowConfirm(false)} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleConfirm} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>추가하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
