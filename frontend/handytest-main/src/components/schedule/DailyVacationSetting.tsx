import { createPortal } from "react-dom";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { ko } from "date-fns/locale";

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
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

type ShiftType = "오픈" | "미들" | "마감";

interface StaffMember {
  id: string;
  name: string;
  avatarColor: string;
  shifts: ShiftType[];
  employmentType: string;
  workDays: string;
  // Work schedule dates with times (for calendar display)
  scheduleDates: { date: Date; startTime: string; endTime: string; shift?: ShiftType }[];
}

const MOCK_STAFF: StaffMember[] = [
  {
    id: "1", name: "김정민", avatarColor: "#A78BFA", shifts: ["오픈", "미들"], employmentType: "정규직", workDays: "월, 화, 수, 목, 금",
    scheduleDates: [
      { date: new Date(2025, 9, 6), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 7), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 8), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 13), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 14), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 15), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 20), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 21), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 22), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 27), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 28), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 29), startTime: "18:00", endTime: "22:00", shift: "마감" },
    ],
  },
  {
    id: "2", name: "문자영", avatarColor: "#C0392B", shifts: ["오픈", "미들"], employmentType: "알바생", workDays: "월, 화",
    scheduleDates: [
      { date: new Date(2025, 9, 6), startTime: "08:00", endTime: "14:00", shift: "오픈" },
      { date: new Date(2025, 9, 7), startTime: "14:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 13), startTime: "08:00", endTime: "14:00", shift: "오픈" },
      { date: new Date(2025, 9, 14), startTime: "14:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 20), startTime: "08:00", endTime: "14:00", shift: "오픈" },
      { date: new Date(2025, 9, 21), startTime: "14:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 27), startTime: "08:00", endTime: "14:00", shift: "오픈" },
      { date: new Date(2025, 9, 28), startTime: "14:00", endTime: "18:00", shift: "미들" },
    ],
  },
  {
    id: "3", name: "러블리치", avatarColor: "#A78BFA", shifts: ["미들"], employmentType: "알바생", workDays: "목, 금",
    scheduleDates: [
      { date: new Date(2025, 9, 2), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 3), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 9), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 10), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 16), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 17), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 23), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 24), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 30), startTime: "12:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 31), startTime: "12:00", endTime: "18:00", shift: "미들" },
    ],
  },
  {
    id: "4", name: "마메치", avatarColor: "#A78BFA", shifts: ["미들", "마감"], employmentType: "알바생", workDays: "목, 금, 토",
    scheduleDates: [
      { date: new Date(2025, 9, 2), startTime: "12:00", endTime: "17:00", shift: "미들" },
      { date: new Date(2025, 9, 3), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 4), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 9), startTime: "12:00", endTime: "17:00", shift: "미들" },
      { date: new Date(2025, 9, 10), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 11), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 16), startTime: "12:00", endTime: "17:00", shift: "미들" },
      { date: new Date(2025, 9, 17), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 18), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 23), startTime: "12:00", endTime: "17:00", shift: "미들" },
      { date: new Date(2025, 9, 24), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 25), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 30), startTime: "12:00", endTime: "17:00", shift: "미들" },
      { date: new Date(2025, 9, 31), startTime: "17:00", endTime: "22:00", shift: "마감" },
    ],
  },
  {
    id: "5", name: "오야지치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "알바생", workDays: "목, 금",
    scheduleDates: [
      { date: new Date(2025, 9, 2), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 3), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 9), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 10), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 16), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 17), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 23), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 24), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 30), startTime: "17:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 31), startTime: "17:00", endTime: "22:00", shift: "마감" },
    ],
  },
  {
    id: "6", name: "미야오치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "알바생", workDays: "금, 토",
    scheduleDates: [
      { date: new Date(2025, 9, 3), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 4), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 10), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 11), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 17), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 18), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 24), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 25), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 31), startTime: "18:00", endTime: "22:00", shift: "마감" },
    ],
  },
  {
    id: "7", name: "주댕치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "", workDays: "토, 일",
    scheduleDates: [
      { date: new Date(2025, 9, 4), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 5), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 11), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 12), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 18), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 19), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 25), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 26), startTime: "18:00", endTime: "22:00", shift: "마감" },
    ],
  },
  {
    id: "8", name: "정수민", avatarColor: "#6BCB77", shifts: ["오픈", "미들", "마감"], employmentType: "정규직", workDays: "월, 화, 수",
    scheduleDates: [
      { date: new Date(2025, 9, 6), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 7), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 8), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 13), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 14), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 15), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 20), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 21), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 22), startTime: "18:00", endTime: "22:00", shift: "마감" },
      { date: new Date(2025, 9, 27), startTime: "08:00", endTime: "12:00", shift: "오픈" },
      { date: new Date(2025, 9, 28), startTime: "13:00", endTime: "18:00", shift: "미들" },
      { date: new Date(2025, 9, 29), startTime: "18:00", endTime: "22:00", shift: "마감" },
    ],
  },
];

const SHIFT_BADGE: Record<ShiftType, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const TIME_OPTIONS = [
  "오전 06:00", "오전 07:00", "오전 08:00", "오전 09:00", "오전 10:00", "오전 11:00",
  "오후 12:00", "오후 13:00", "오후 14:00", "오후 15:00", "오후 16:00", "오후 17:00",
  "오후 18:00", "오후 19:00", "오후 20:00", "오후 21:00", "오후 22:00", "오후 23:00",
];

function ShiftBadge({ shifts }: { shifts: ShiftType[] }) {
  const label = shifts.join(", ");
  const badgeClass = SHIFT_BADGE[shifts[0]];
  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeClass}`}>
      {label}
    </span>
  );
}

export default function DailyVacationSetting({ onClose }: { onClose: () => void }) {
  // Steps: 1=select staff, 2=select date, 3=select substitute, 4=confirm (no sub), 5=confirm (with sub schedule)
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calYear, setCalYear] = useState(2025);
  const [calMonth, setCalMonth] = useState(9);
  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const calWeeks = useMemo(() => { const w: typeof calDays[] = []; for (let i = 0; i < calDays.length; i += 7) w.push(calDays.slice(i, i + 7)); return w; }, [calDays]);
  const today = new Date();
  const isToday = (y: number, m: number, d: number) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [subStartTime, setSubStartTime] = useState("");
  const [subEndTime, setSubEndTime] = useState("");
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const staff = MOCK_STAFF.find((s) => s.id === selectedStaff);
  const subStaff = MOCK_STAFF.find((s) => s.id === selectedSub);

  // Get scheduled dates for selected staff
  const staffScheduleDates = staff?.scheduleDates.map((sd) => sd.date) || [];

  // Get schedule info for selected date
  const selectedSchedule = staff?.scheduleDates.find(
    (sd) => selectedDate && sd.date.toDateString() === selectedDate.toDateString()
  );

  // Available substitutes (everyone except selected staff)
  const availableSubs = MOCK_STAFF.filter((s) => s.id !== selectedStaff);

  const formatSelectedDate = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;

  const formatShortDate = (d: Date) =>
    `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}(${DAY_NAMES[d.getDay()]})`;

  const handleBack = () => {
    if (step === 5) setStep(3);
    else if (step === 4) setStep(3);
    else if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedStaff) setStep(2);
    else if (step === 2 && selectedDate) setStep(3);
  };

  const handleSkip = () => {
    // Skip substitute selection → go to confirm without sub
    setSelectedSub(null);
    setStep(4);
  };

  const handleSubNext = () => {
    if (selectedSub) {
      // Pre-fill sub times from selected schedule
      if (selectedSchedule) {
        setSubStartTime(`오후 ${selectedSchedule.startTime}`);
        setSubEndTime(`오후 ${selectedSchedule.endTime}`);
      }
      setStep(5);
    }
  };

  const handleConfirmVacation = () => {
    setShowConfirm(false);
    toast({ description: "휴가 설정이 완료되었어요", duration: 2000 });
    onClose();
  };

  

  return (
    <div className="fixed inset-0 z-[200] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2">
        <button onClick={handleBack} className="pressable p-1">
          <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>직원 휴가 설정</h1>
      </div>

      {/* Step 1: Select staff */}
      {step === 1 && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            휴가로 설정할 직원을<br />선택해 주세요
          </h2>

          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '13px', color: '#9EA3AD' }}>근무직원</span>
            <span style={{ fontSize: '13px', color: '#9EA3AD' }}>총 {MOCK_STAFF.length}명</span>
          </div>

          <div className="flex flex-col">
            {MOCK_STAFF.map((s) => {
              const isSelected = selectedStaff === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
                    style={{ backgroundColor: s.avatarColor }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      <ShiftBadge shifts={s.shifts} />
                      {s.employmentType && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>
                          {s.employmentType}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#9EA3AD', marginTop: '2px' }}>{s.workDays}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Select vacation date from staff's schedule */}
      {step === 2 && staff && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
            {staff.name} 님의 일정에서<br />휴가로 설정할 일정을 선택해 주세요
          </h2>

          <div>
            <div className="flex items-center justify-between px-1 py-3">
              <button onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{calYear}년 {calMonth + 1}월</span>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-7">
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
              ))}
            </div>
            <div>
              {calWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 mb-1">
                  {week.map((d, di) => {
                    const dateObj = new Date(d.year, d.month, d.date);
                    const schedule = !d.isOutside ? staff.scheduleDates.find(sd => sd.date.toDateString() === dateObj.toDateString()) : null;
                    const isEnabled = !d.isOutside && staffScheduleDates.some(sd => sd.toDateString() === dateObj.toDateString());
                    const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                    const isSelected = !d.isOutside && selectedDate && selectedDate.toDateString() === dateObj.toDateString();
                    const isSun = di === 0; const isSat = di === 6;
                    const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                    return (
                      <button key={di} onClick={() => { if (isEnabled) setSelectedDate(dateObj); }} className="pressable flex flex-col items-center py-1 w-full" style={{ minHeight: '72px' }} disabled={d.isOutside || !isEnabled}>
                        <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                            {d.date}
                          </span>
                        </div>
                        {schedule && (() => {
                          const shift = schedule.shift ?? staff.shifts[0];
                          const shiftStyle = {
                            "오픈": { bg: '#FDF9DF', color: '#FFB300' },
                            "미들": { bg: '#ECFFF1', color: '#1EDC83' },
                            "마감": { bg: '#E8F9FF', color: '#14C1FA' },
                          }[shift] ?? { bg: '#EEF1FF', color: '#4261FF' };
                          const bg = isSelected ? '#E8F3FF' : shiftStyle.bg;
                          const color = isSelected ? '#7488FE' : shiftStyle.color;
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', backgroundColor: bg, borderRadius: '4px', padding: '2px 0' }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color, lineHeight: '1.3' }}>{schedule.startTime}</span>
                              <span style={{ fontSize: '9px', color, lineHeight: '1' }}>-</span>
                              <span style={{ fontSize: '11px', fontWeight: 500, color, lineHeight: '1.3' }}>{schedule.endTime}</span>
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Select substitute */}
      {step === 3 && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '8px' }}>
            해당 일정의 대타 근무자가<br />있다면 선택해 주세요
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', marginBottom: '24px' }}>
            *대타 근무자가 없다면 선택하지 않아도 돼요
          </p>

          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>근무직원</span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {availableSubs.length}명</span>
          </div>

          <div className="flex flex-col">
            {availableSubs.map((s) => {
              const isSelected = selectedSub === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedSub(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div
                    className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
                    style={{ backgroundColor: s.avatarColor }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left flex-1">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      <ShiftBadge shifts={s.shifts} />
                      {s.employmentType && (
                        <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>
                          {s.employmentType}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '13px', color: '#9EA3AD', marginTop: '2px' }}>{s.workDays}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 4: Confirm without substitute */}
      {step === 4 && staff && selectedDate && selectedSchedule && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            {staff.name} 님의 근무 일정을<br />휴가로 설정할까요?
          </h2>

          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>선택한 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', height: '68px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div
              className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
              style={{ backgroundColor: staff.avatarColor }}
            >
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
                <ShiftBadge shifts={staff.shifts} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{staff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>
                {formatSelectedDate(selectedDate)}  |  {selectedSchedule.startTime} - {selectedSchedule.endTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Confirm with substitute schedule */}
      {step === 5 && staff && subStaff && selectedDate && selectedSchedule && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '8px' }}>
            아래와 같이<br />일정을 변경할까요?
          </h2>
          <p style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', marginBottom: '32px', lineHeight: '1.5' }}>
            *대타 등록 시 현재 선택한 일정은 휴가로 변경되고,<br />대타 근무자에게 새 근무 일정이 추가돼요
          </p>

          {/* 선택한 일정 */}
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '10px' }}>선택한 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', height: '68px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: staff.avatarColor }}>
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
                <ShiftBadge shifts={staff.shifts} />
                {staff.employmentType && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{staff.employmentType}</span>}
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>
                {formatSelectedDate(selectedDate)}  |  {selectedSchedule.startTime} - {selectedSchedule.endTime}
              </p>
            </div>
          </div>

          {/* 대타 근무자 */}
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '10px' }}>대타 근무자</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', height: '68px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: subStaff.avatarColor }}>
              {subStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{subStaff.name}</span>
                <ShiftBadge shifts={subStaff.shifts} />
                {subStaff.employmentType && <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{subStaff.employmentType}</span>}
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>{subStaff.workDays}</p>
            </div>
          </div>

          {/* *변경될 일정 */}
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF', marginBottom: '10px' }}>*변경될 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: subStaff.avatarColor }}>
              {subStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{subStaff.name}</span>
                <ShiftBadge shifts={[selectedSchedule.shift ?? staff.shifts[0]]} />
                {subStaff.employmentType && <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{subStaff.employmentType}</span>}
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>
                {formatSelectedDate(selectedDate)}  |  {selectedSchedule.startTime} - {selectedSchedule.endTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div style={{ padding: '16px 20px 32px' }}>
        {step === 1 && (
          <button
            onClick={handleNext}
            disabled={!selectedStaff}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: selectedStaff ? '#4261FF' : '#EAECEF', color: selectedStaff ? '#FFFFFF' : '#9EA3AD' }}
          >
            다음
          </button>
        )}
        {step === 2 && (
          <button
            onClick={handleNext}
            disabled={!selectedDate}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: selectedDate ? '#4261FF' : '#EAECEF', color: selectedDate ? '#FFFFFF' : '#9EA3AD' }}
          >
            다음
          </button>
        )}
        {step === 3 && (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#DEEBFF', color: '#4261FF', border: 'none', cursor: 'pointer' }}
            >
              이전
            </button>
            <button
              onClick={selectedSub ? handleSubNext : handleSkip}
              style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#4261FF', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
            >
              {selectedSub ? "다음" : "건너뛰기"}
            </button>
          </div>
        )}
        {step === 4 && (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#DEEBFF', color: '#4261FF', border: 'none', cursor: 'pointer' }}
            >
              이전
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#4261FF', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
            >
              설정하기
            </button>
          </div>
        )}
        {step === 5 && (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#DEEBFF', color: '#4261FF', border: 'none', cursor: 'pointer' }}
            >
              이전
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, backgroundColor: '#4261FF', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
            >
              설정하기
            </button>
          </div>
        )}
      </div>

      {/* Confirmation popup - No substitute (step 4) */}
      {showConfirm && step === 4 && selectedDate && selectedSchedule && staff && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>휴가 설정하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' }}>
              해당 일정을 휴가로 설정하시겠어요?<br />
              설정된 일정은 해당 직원에게도 안내돼요
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmVacation}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                설정하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Confirmation popup - With substitute (step 5) */}
      {showConfirm && step === 5 && selectedDate && selectedSchedule && staff && subStaff && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>휴가 설정 및 대타 등록하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              휴가 설정 후 대타 근무자를 등록하시겠어요?<br />
              근무 변경 내용은 해당 직원에게도 전달돼요
            </p>
            <div className="text-left text-[14px] space-y-1 p-3 rounded-xl w-full mb-5" style={{ backgroundColor: '#F7F8FA' }}>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-10">직원</span>
                <span className="text-foreground font-medium">
                  {staff.name} → <span className="text-primary">{subStaff.name}</span>
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-muted-foreground w-10">일정</span>
                <span className="text-foreground font-medium">
                  {formatShortDate(selectedDate)} | {selectedSchedule.startTime}-{selectedSchedule.endTime}
                </span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleConfirmVacation}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                등록하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}