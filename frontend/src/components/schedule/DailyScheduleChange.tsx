import { createPortal } from "react-dom";
import { useToast } from "@/hooks/use-toast";
import { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Check, X } from "lucide-react";
import { ko } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

const IconOpen = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="4" stroke="#FFB300" strokeWidth="2" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconMiddle = () => (
  <svg width="11" height="11" viewBox="0 0 22 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 13h20M11 1C6.03 1 2 5.03 2 10h18C20 5.03 15.97 1 11 1Z" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="11" y1="1" x2="11" y2="0" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
    <line x1="3.5" y1="3.5" x2="2.5" y2="2.5" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.5" y1="3.5" x2="19.5" y2="2.5" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="#14C1FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const mockSchedule: Record<number, { open: number; middle: number; close: number }> = {};
for (let d = 1; d <= 31; d++) mockSchedule[d] = { open: 1, middle: 1, close: 1 };
mockSchedule[1] = { open: 2, middle: 4, close: 2 };

type ShiftType = "오픈" | "미들" | "마감";
type ChangeType = "근무 일정 변경" | "직원 간 근무 일정 교환" | "대타 근무자 지정";

interface StaffMember {
  id: string;
  name: string;
  avatarColor: string;
  shifts: ShiftType[];
  employmentType: string;
  startTime: string;
  endTime: string;
  workDays?: string[];
}

const MOCK_STAFF_BY_DATE: Record<string, StaffMember[]> = {
  "2025-10-21": [
    { id: "1", name: "김정민", avatarColor: "#A78BFA", shifts: ["오픈"], employmentType: "정규직", startTime: "08:00", endTime: "16:00" },
    { id: "2", name: "정수민", avatarColor: "#6BCB77", shifts: ["미들"], employmentType: "정규직", startTime: "12:00", endTime: "17:00" },
    { id: "3", name: "김수민", avatarColor: "#A78BFA", shifts: ["미들"], employmentType: "정규직", startTime: "12:00", endTime: "18:00" },
    { id: "4", name: "오야지치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "정규직", startTime: "17:30", endTime: "22:00" },
    { id: "5", name: "미야오치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "정규직", startTime: "18:00", endTime: "22:00" },
  ],
};

// All staff for exchange selection
const ALL_STAFF: StaffMember[] = [
  { id: "10", name: "문자영", avatarColor: "#F59E0B", shifts: ["오픈", "미들"], employmentType: "정규직", startTime: "08:00", endTime: "18:00", workDays: ["월", "화"] },
  { id: "2", name: "정수민", avatarColor: "#6BCB77", shifts: ["미들"], employmentType: "정규직", startTime: "13:00", endTime: "18:00", workDays: ["월", "화", "수"] },
  { id: "3", name: "김수민", avatarColor: "#A78BFA", shifts: ["미들"], employmentType: "정규직", startTime: "12:00", endTime: "18:00", workDays: ["화", "수"] },
  { id: "11", name: "키키치", avatarColor: "#EC4899", shifts: ["미들"], employmentType: "정규직", startTime: "12:00", endTime: "18:00", workDays: ["목"] },
  { id: "12", name: "러블리치", avatarColor: "#8B5CF6", shifts: ["미들"], employmentType: "정규직", startTime: "12:00", endTime: "18:00", workDays: ["목", "금"] },
  { id: "13", name: "마메치", avatarColor: "#14B8A6", shifts: ["미들", "마감"], employmentType: "정규직", startTime: "12:00", endTime: "22:00", workDays: ["목", "금", "토"] },
  { id: "4", name: "오야지치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "정규직", startTime: "17:30", endTime: "22:00", workDays: ["목", "금"] },
  { id: "5", name: "미야오치", avatarColor: "#A78BFA", shifts: ["마감"], employmentType: "정규직", startTime: "18:00", endTime: "22:00", workDays: ["금", "토"] },
  { id: "14", name: "주댕치", avatarColor: "#EF4444", shifts: ["마감"], employmentType: "정규직", startTime: "18:00", endTime: "22:00", workDays: ["토", "일"] },
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

const CHANGE_TYPES: ChangeType[] = ["근무 일정 변경", "직원 간 근무 일정 교환", "대타 근무자 지정"];

function ShiftBadge({ shift }: { shift: ShiftType }) {
  return (
    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${SHIFT_BADGE[shift]}`}>
      {shift}
    </span>
  );
}

function formatDateFull(d: Date) {
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;
}

function formatDateShort(d: Date) {
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} (${DAY_NAMES[d.getDay()]})`;
}

function formatDateConfirm(d: Date) {
  return `${String(d.getFullYear()).slice(2)}.${d.getMonth() + 1}.${String(d.getDate()).padStart(2, "0")}(${DAY_NAMES[d.getDay()]})`;
}

function getStaffForDate(date: Date): StaffMember[] {
  const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  return MOCK_STAFF_BY_DATE[key] || MOCK_STAFF_BY_DATE["2025-10-21"] || [];
}

// Get work dates for a staff member in a given month
function getWorkDatesForMonth(staffMember: StaffMember, year: number, month: number): Date[] {
  const dayMap: Record<string, number> = { "일": 0, "월": 1, "화": 2, "수": 3, "목": 4, "금": 5, "토": 6 };
  const workDays = staffMember.workDays || [];
  const dates: Date[] = [];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const dayName = DAY_NAMES[date.getDay()];
    if (workDays.includes(dayName)) {
      dates.push(date);
    }
  }
  return dates;
}

function ScheduleCard({ member, date, label, white }: { member: StaffMember; date: Date; label: string; white?: boolean }) {
  return (
    <>
      <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>{label}</p>
      <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', border: 'none', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
        <div
          className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
          style={{ backgroundColor: member.avatarColor }}
        >
          {member.name.charAt(0)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{member.name}</span>
            <ShiftBadge shift={member.shifts[0]} />
            <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{member.employmentType}</span>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>
            {formatDateFull(date)}  |  {member.startTime} - {member.endTime}
          </p>
        </div>
      </div>
    </>
  );
}

// Steps: 1=date, 2=staff, 3=change type, 4=schedule change form
// Exchange flow: 5=select exchange staff, 6=select exchange date, 7=exchange summary
// Edit flow: 8=edit staff1 time, 9=edit staff2 time
// Substitute flow: 10=select substitute staff, 11=confirmation summary
type StepType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export default function DailyScheduleChange({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<StepType>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calYear, setCalYear] = useState(2025);
  const [calMonth, setCalMonth] = useState(9);
  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const calWeeks = useMemo(() => { const w: typeof calDays[] = []; for (let i = 0; i < calDays.length; i += 7) w.push(calDays.slice(i, i + 7)); return w; }, [calDays]);
  const todayDate = new Date();
  const isToday = (y: number, m: number, d: number) => todayDate.getFullYear() === y && todayDate.getMonth() === m && todayDate.getDate() === d;
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const [changeType, setChangeType] = useState<ChangeType | null>(null);
  const [showChangeTypeSheet, setShowChangeTypeSheet] = useState(false);

  // Step 4: work schedule change
  const [newDate, setNewDate] = useState<Date | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newCalYear, setNewCalYear] = useState(2025);
  const [newCalMonth, setNewCalMonth] = useState(9);
  const [newStartTime, setNewStartTime] = useState("");
  const [newEndTime, setNewEndTime] = useState("");
  const [activeTimePicker, setActiveTimePicker] = useState<string | null>(null); // 'start'|'end'|'editStart'|'editEnd'
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  // cleanup: unmount 시 body 속성/스타일 초기화
  useEffect(() => {
    return () => {
      document.body.removeAttribute('data-overlay-open');
      document.body.style.overflow = '';
    };
  }, []);

  // Exchange flow (steps 5-7)
  const [exchangeStaffId, setExchangeStaffId] = useState<string | null>(null);
  const [exchangeDate, setExchangeDate] = useState<Date | undefined>(undefined);
  const [exchangeCalendarMonth, setExchangeCalendarMonth] = useState(new Date(2025, 9));
  const [showExchangeConfirm, setShowExchangeConfirm] = useState(false);

  // Edit flow (steps 8-9): editable times for each staff after exchange
  const [editStaff1StartTime, setEditStaff1StartTime] = useState("");
  const [editStaff1EndTime, setEditStaff1EndTime] = useState("");
  const [editStaff2StartTime, setEditStaff2StartTime] = useState("");
  const [editStaff2EndTime, setEditStaff2EndTime] = useState("");


  // Substitute flow (steps 10-11)
  const [substituteStaffId, setSubstituteStaffId] = useState<string | null>(null);
  const [showSubstituteConfirm, setShowSubstituteConfirm] = useState(false);

  const staffList = selectedDate ? getStaffForDate(selectedDate) : [];
  const staff = staffList.find((s) => s.id === selectedStaff);
  const exchangeStaff = ALL_STAFF.find((s) => s.id === exchangeStaffId);
  const substituteStaff = ALL_STAFF.find((s) => s.id === substituteStaffId);

  const handleBack = () => {
    if (step === 11) setStep(10);
    else if (step === 10) { setSubstituteStaffId(null); setStep(3); }
    else if (step === 9) { setStep(8); }
    else if (step === 8) { setStep(7); }
    else if (step === 7) setStep(6);
    else if (step === 6) { setExchangeDate(undefined); setStep(5); }
    else if (step === 5) { setExchangeStaffId(null); setStep(3); }
    else if (step === 4) setStep(3);
    else if (step === 3) { setChangeType(null); setStep(2); }
    else if (step === 2) { setSelectedStaff(null); setStep(1); }
    else onClose();
  };

  const handleNext = () => {
    if (step === 1 && selectedDate) setStep(2);
    else if (step === 2 && selectedStaff) setStep(3);
    else if (step === 3 && changeType === "근무 일정 변경") {
      setStep(4);
    } else if (step === 3 && changeType === "직원 간 근무 일정 교환") {
      setStep(5);
    } else if (step === 3 && changeType === "대타 근무자 지정") {
      setStep(10);
    } else if (step === 5 && exchangeStaffId) {
      setStep(6);
    } else if (step === 6 && exchangeDate) {
      setStep(7);
    } else if (step === 10 && substituteStaffId) {
      setStep(11);
    }
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    toast({ description: "일정이 변경되었어요", duration: 2000 });
    onClose();
  };

  const handleExchangeConfirm = () => {
    setShowExchangeConfirm(false);
    toast({ description: "일정이 교환되었어요", duration: 2000 });
    onClose();
  };

  const handleSubstituteConfirm = () => {
    setShowSubstituteConfirm(false);
    toast({ description: "대타 근무자가 등록되었어요", duration: 2000 });
    onClose();
  };

  const calendarClassNames = {
    months: "flex flex-col w-full",
    month: "space-y-2 w-full",
    caption: "flex items-center justify-center relative py-2",
    caption_label: "text-[17px] font-bold text-foreground",
    nav: "flex items-center",
    nav_button: "h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 inline-flex items-center justify-center rounded-full hover:bg-accent",
    nav_button_previous: "absolute left-2",
    nav_button_next: "absolute right-2",
    table: "w-full border-collapse",
    head_row: "flex w-full mb-1",
    head_cell: "flex-1 text-center text-[13px] font-medium py-2 text-muted-foreground first:text-destructive last:text-primary",
    row: "flex w-full",
    cell: "flex-1 text-center p-0 relative h-11 flex items-center justify-center [&:first-child>button]:text-destructive [&:last-child>button]:text-primary [&:has([aria-selected])>button]:text-primary-foreground",
    day: cn("h-10 w-10 p-0 font-normal text-[15px] rounded-full hover:bg-accent mx-auto flex items-center justify-center transition-colors"),
    day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
    day_today: "font-bold text-primary",
    day_outside: "text-muted-foreground/40 opacity-30",
    day_disabled: "text-muted-foreground opacity-50",
    day_hidden: "invisible",
  };

  // Exchange calendar: larger cells for work schedule display
  const exchangeCalendarClassNames = {
    ...calendarClassNames,
    row: "flex w-full",
    cell: "flex-1 text-center p-0 relative flex items-center justify-center [&:first-child>button]:text-destructive [&:last-child>button]:text-primary [&:has([aria-selected])>button]:text-primary-foreground",
    day: cn("h-auto min-h-[60px] w-full p-0 font-normal text-[15px] rounded-lg hover:bg-accent mx-auto flex flex-col items-center justify-start pt-1 transition-colors"),
  };

  const isStep1Valid = !!selectedDate;
  const isStep2Valid = !!selectedStaff;
  const isStep3Valid = !!changeType;
  const isStep4Valid = newDate && newStartTime && newEndTime;
  const isStep5Valid = !!exchangeStaffId;
  const isStep6Valid = !!exchangeDate;

  // Exchange/substitute staff list excluding the originally selected staff
  const exchangeStaffList = ALL_STAFF.filter((s) => s.id !== selectedStaff);
  const substituteStaffList = ALL_STAFF.filter((s) => s.id !== selectedStaff);

  // Get work dates for exchange calendar
  const exchangeWorkDates = exchangeStaff
    ? getWorkDatesForMonth(exchangeStaff, exchangeCalendarMonth.getFullYear(), exchangeCalendarMonth.getMonth())
    : [];

  const isCurrentStepValid = () => {
    switch (step) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      case 5: return isStep5Valid;
      case 6: return isStep6Valid;
      case 8: return true;
      case 10: return !!substituteStaffId;
      default: return false;
    }
  };

  const getButtonLabel = () => {
    if (step === 4) return "변경하기";
    return "다음";
  };

  const handleBottomButton = () => {
    if (step === 4) {
      setShowConfirm(true);
    } else if (step === 8) {
      // Go to step 9 (edit staff 2's time)
      if (staff && exchangeStaff && selectedDate && exchangeDate) {
        setEditStaff2StartTime(parseInt(staff.startTime) < 12 ? `오전 ${staff.startTime}` : `오후 ${staff.startTime}`);
        setEditStaff2EndTime(parseInt(staff.endTime) < 12 ? `오전 ${staff.endTime}` : `오후 ${staff.endTime}`);
      }
            setStep(9);
    } else {
      handleNext();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2">
        <button onClick={handleBack} className="pressable p-1">
          <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{(step >= 4 && changeType) ? changeType : '직원 일정 변경'}</h1>
      </div>

      {/* Step 1: Select date */}
      {step === 1 && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
            변경할 근무 날짜를<br />선택해주세요
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
                    const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                    const isSelected = !d.isOutside && selectedDate && selectedDate.getFullYear() === d.year && selectedDate.getMonth() === d.month && selectedDate.getDate() === d.date;
                    const isSun = di === 0; const isSat = di === 6;
                    const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                    const schedule = !d.isOutside ? mockSchedule[d.date] : null;
                    return (
                      <button key={di} onClick={() => { if (!d.isOutside) setSelectedDate(new Date(d.year, d.month, d.date)); }} className="pressable flex flex-col items-center py-1.5 w-full" style={{ minHeight: '90px', borderRadius: '8px' }} disabled={d.isOutside}>
                        <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : {}) }}>
                            {d.date}
                          </span>
                        </div>
                        {schedule && !d.isOutside && (
                          <div className="flex flex-col w-full px-0.5" style={{ gap: '2px' }}>
                            {[
                              { icon: <IconOpen />, count: schedule.open, bg: '#FDF9DF', text: '#FFB300' },
                              { icon: <IconMiddle />, count: schedule.middle, bg: '#ECFFF1', text: '#1EDC83' },
                              { icon: <IconClose />, count: schedule.close, bg: '#E8F9FF', text: '#14C1FA' },
                            ].map(({ icon, count, bg, text }, idx) => (
                              <div key={idx} style={{ backgroundColor: bg, borderRadius: '4px', padding: '0 4px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                                <span style={{ fontSize: '11px', fontWeight: 600, color: text, lineHeight: 1 }}>{count}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Select staff */}
      {step === 2 && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            선택한 날짜에서 일정을<br />변경할 직원을 선택해주세요
          </h2>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>근무직원</span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {staffList.length}명</span>
          </div>
          <div className="flex flex-col">
            {staffList.map((s) => {
              const isSelected = selectedStaff === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSelectedStaff(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: s.avatarColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      <ShiftBadge shift={s.shifts[0]} />
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{s.employmentType}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>{s.startTime} - {s.endTime}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 3: Select change type */}
      {step === 3 && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            선택한 직원의<br />근무 일정을 변경해주세요
          </h2>
          <ScheduleCard member={staff} date={selectedDate} label="선택한 일정" />
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>일정 변경 유형 <span style={{ color: '#FF3D3D' }}>*</span>
          </p>
          <button
            onClick={() => setShowChangeTypeSheet(true)}
            className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px', marginBottom: '4px' }}
          >
            <span style={{ fontSize: '15px', color: changeType ? '#19191B' : '#9EA3AD' }}>
              {changeType || "변경 유형 선택"}
            </span>
            <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
          </button>
          <p className="text-[14px]" style={{ color: '#AAB4BF', marginTop: '4px', marginBottom: '30px' }}>*일정 변경 시 기존 일정은 새 일정으로 자동 대체돼요</p>
        </div>
      )}

      {/* Step 4: Work schedule change form */}
      {step === 4 && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            선택한 직원의<br />근무 일정을 변경해주세요
          </h2>
          <ScheduleCard member={staff} date={selectedDate} label="선택한 일정" />
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '8px' }}>근무일 변경</p>
          <button
            onClick={() => setShowDatePicker(true)}
            className="w-full flex items-center justify-between"
            style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px', marginBottom: '30px', backgroundColor: '#FFFFFF' }}
          >
            <span style={{ fontSize: '15px', color: newDate ? '#19191B' : '#9EA3AD' }}>
              {newDate ? formatDateShort(newDate) : '날짜 선택'}
            </span>
            <CalendarIcon className="w-5 h-5" style={{ color: '#9EA3AD' }} />
          </button>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>출근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('start')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span style={{ fontSize: '15px', color: newStartTime ? '#19191B' : '#9EA3AD' }}>{newStartTime || "출근 시간 선택"}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>퇴근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('end')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span style={{ fontSize: '15px', color: newEndTime ? '#19191B' : '#9EA3AD' }}>{newEndTime || "퇴근 시간 선택"}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
            {newStartTime && newEndTime && (() => {
              const toMin = (t: string) => { const clean = t.replace('오전 ', '').replace('오후 ', ''); const [h, m] = clean.split(':').map(Number); return h * 60 + (m || 0); };
              const startMin = toMin(newStartTime);
              const endMin = toMin(newEndTime);
              const diff = endMin - startMin;
              if (diff <= 0) return null;
              const h = Math.floor(diff / 60); const m = diff % 60;
              const label = [h > 0 ? `${h}시간` : '', m > 0 ? `${m}분` : ''].filter(Boolean).join(' ');
              return <p className="text-[14px]" style={{ color: '#AAB4BF', marginTop: '6px' }}>총 {label} 근무</p>;
            })()}
          </div>
        </div>
      )}

      {/* Step 5: Select exchange staff */}
      {step === 5 && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            일정을 교환할<br />직원을 선택해주세요
          </h2>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>근무직원</span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {exchangeStaffList.length}명</span>
          </div>
          <div className="flex flex-col">
            {exchangeStaffList.map((s) => {
              const isSelected = exchangeStaffId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setExchangeStaffId(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: s.avatarColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      {s.shifts.map((shift) => (
                        <ShiftBadge key={shift} shift={shift} />
                      ))}
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{s.employmentType}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>
                      {s.workDays?.join(", ")}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 6: Select exchange date from staff's calendar */}
      {step === 6 && exchangeStaff && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
            {exchangeStaff.name} 님의 일정에서<br />교환할 날짜를 선택해주세요
          </h2>
          <div>
            <div className="flex items-center justify-between px-1 py-3">
              <button onClick={() => setExchangeCalendarMonth(new Date(exchangeCalendarMonth.getFullYear(), exchangeCalendarMonth.getMonth() - 1))} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{exchangeCalendarMonth.getFullYear()}년 {exchangeCalendarMonth.getMonth() + 1}월</span>
              <button onClick={() => setExchangeCalendarMonth(new Date(exchangeCalendarMonth.getFullYear(), exchangeCalendarMonth.getMonth() + 1))} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-7">
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
              ))}
            </div>
            <div>
              {(() => {
                const exYear = exchangeCalendarMonth.getFullYear();
                const exMonth = exchangeCalendarMonth.getMonth();
                const exDays = getCalendarDays(exYear, exMonth);
                const exWeeks: typeof exDays[] = [];
                for (let i = 0; i < exDays.length; i += 7) exWeeks.push(exDays.slice(i, i + 7));
                const workDates = exchangeWorkDates;
                return exWeeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 mb-1">
                    {week.map((d, di) => {
                      const dateObj = new Date(d.year, d.month, d.date);
                      const isWork = !d.isOutside && workDates.some(wd => wd.toDateString() === dateObj.toDateString());
                      const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                      const isSelected = !d.isOutside && exchangeDate && exchangeDate.toDateString() === dateObj.toDateString();
                      const isSun = di === 0; const isSat = di === 6;
                      const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                      const schedule = isWork ? { startTime: exchangeStaff.startTime, endTime: exchangeStaff.endTime, shift: exchangeStaff.shifts[0] } : null;
                      const shiftStyle: Record<string, { bg: string; color: string }> = {
                        '오픈': { bg: '#FDF9DF', color: '#FFB300' },
                        '미들': { bg: '#ECFFF1', color: '#1EDC83' },
                        '마감': { bg: '#E8F9FF', color: '#14C1FA' },
                      };
                      return (
                        <button key={di} onClick={() => { if (isWork) setExchangeDate(dateObj); }} className="pressable flex flex-col items-center py-1 w-full" style={{ minHeight: '72px' }} disabled={d.isOutside || !isWork}>
                          <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                              {d.date}
                            </span>
                          </div>
                          {schedule && (() => {
                            const st = shiftStyle[schedule.shift ?? '오픈'] ?? { bg: '#EEF1FF', color: '#4261FF' };
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
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Step 7: Exchange summary */}
      {step === 7 && staff && selectedDate && exchangeStaff && exchangeDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            교환할 근무 일정을<br />확인해주세요
          </h2>

          <ScheduleCard member={staff} date={selectedDate} label="선택한 일정" white />
          
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '10px' }}>교환할 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', height: '68px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: exchangeStaff.avatarColor }}>
              {exchangeStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{exchangeStaff.name}</span>
                <ShiftBadge shift={exchangeStaff.shifts[0]} />
                <span className="text-[12px] text-muted-foreground">{exchangeStaff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>
                {formatDateFull(exchangeDate)}  |  {exchangeStaff.startTime} - {exchangeStaff.endTime}
              </p>
            </div>
          </div>

          {/* 변경될 일정 */}
          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF', marginBottom: '10px' }}>*변경될 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: staff.avatarColor }}>
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
                <ShiftBadge shift={exchangeStaff.shifts[0]} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{staff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>
                {formatDateFull(exchangeDate)}  |  {exchangeStaff.startTime} - {exchangeStaff.endTime}
              </p>
            </div>
          </div>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: exchangeStaff.avatarColor }}>
              {exchangeStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{exchangeStaff.name}</span>
                <ShiftBadge shift={staff.shifts[0]} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{exchangeStaff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>
                {formatDateFull(selectedDate)}  |  {staff.startTime} - {staff.endTime}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 10: Select substitute staff */}
      {step === 10 && staff && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일({DAY_NAMES[selectedDate.getDay()]}) {staff.startTime}-{staff.endTime}<br />대타 근무자를 선택해주세요
          </h2>
          <div className="flex items-center justify-between mb-3">
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>근무직원</span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {substituteStaffList.length}명</span>
          </div>
          <div className="flex flex-col">
            {substituteStaffList.map((s) => {
              const isSelected = substituteStaffId === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setSubstituteStaffId(isSelected ? null : s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: s.avatarColor }}>
                    {s.name.charAt(0)}
                  </div>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      {s.shifts.map((shift) => <ShiftBadge key={shift} shift={shift} />)}
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{s.employmentType}</span>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>{s.workDays?.join(", ")}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 11: Substitute confirmation summary */}
      {step === 11 && staff && selectedDate && substituteStaff && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            아래와 같이<br />일정을 변경할까요?
          </h2>

          <ScheduleCard member={staff} date={selectedDate} label="선택한 일정" />

          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '10px' }}>대타 근무자</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', height: '68px', marginBottom: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: substituteStaff.avatarColor }}>
              {substituteStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{substituteStaff.name}</span>
                <ShiftBadge shift={substituteStaff.shifts[0]} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{substituteStaff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>{substituteStaff.workDays?.join(", ")}</p>
            </div>
          </div>

          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF', marginBottom: '10px' }}>*변경될 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: substituteStaff.avatarColor }}>
              {substituteStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{substituteStaff.name}</span>
                <ShiftBadge shift={substituteStaff.shifts[0]} />
                <span className="text-[12px] text-muted-foreground">{substituteStaff.employmentType}</span>
              </div>
              <p style={{ fontSize: '14px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em', marginTop: '2px' }}>
                {formatDateFull(selectedDate)}  |  {staff.startTime} - {staff.endTime}
              </p>
            </div>
          </div>
        </div>
      )}


      {step === 8 && staff && selectedDate && exchangeStaff && exchangeDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            {staff.name} 님의 근무<br />일정을 확인해주세요
          </h2>
          <p className="text-[13px] text-primary font-bold mb-2">*교환된 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: staff.avatarColor }}>
              {staff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{staff.name}</span>
                <ShiftBadge shift={staff.shifts[0]} />
                <span style={{ fontSize: '12px', color: '#9EA3AD' }}>{staff.employmentType}</span>
              </div>
              <p className="text-[13px] text-primary mt-0.5">
                {formatDateFull(exchangeDate)}  |  {exchangeStaff.startTime} - {exchangeStaff.endTime}
              </p>
            </div>
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>근무일 변경</p>
          <div className="w-full flex items-center justify-between rounded-2xl px-4 py-4 cursor-not-allowed" style={{ border: '1px solid #EAECEF', backgroundColor: '#F7F7F8', marginBottom: '24px' }}>
            <span className="text-[15px] text-muted-foreground">{formatDateShort(exchangeDate)}</span>
            <CalendarIcon className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>출근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('editStart')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span className="text-[15px] text-foreground">{editStaff1StartTime}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>퇴근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('editEnd')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span className="text-[15px] text-foreground">{editStaff1EndTime}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>
        </div>
      )}

      {/* Step 9: Edit staff2 exchanged schedule */}
      {step === 9 && staff && selectedDate && exchangeStaff && exchangeDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            {exchangeStaff.name} 님의 근무<br />일정을 확인해주세요
          </h2>
          <p className="text-[13px] text-primary font-bold mb-2">*교환된 일정</p>
          <div className="rounded-2xl px-4 flex items-center gap-3" style={{ backgroundColor: '#F0F7FF', height: '68px', marginBottom: '30px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div className="w-[44px] h-[44px] rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0" style={{ backgroundColor: exchangeStaff.avatarColor }}>
              {exchangeStaff.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold text-foreground">{exchangeStaff.name}</span>
                <ShiftBadge shift={exchangeStaff.shifts[0]} />
                <span className="text-[12px] text-muted-foreground">{exchangeStaff.employmentType}</span>
              </div>
              <p className="text-[13px] text-primary mt-0.5">
                {formatDateFull(selectedDate)}  |  {staff.startTime} - {staff.endTime}
              </p>
            </div>
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>근무일 변경</p>
          <div className="w-full flex items-center justify-between rounded-2xl px-4 py-4 cursor-not-allowed" style={{ border: '1px solid #EAECEF', backgroundColor: '#F7F7F8', marginBottom: '24px' }}>
            <span className="text-[15px] text-muted-foreground">{formatDateShort(selectedDate)}</span>
            <CalendarIcon className="w-5 h-5 text-muted-foreground/50" />
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>출근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('editStart2')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span className="text-[15px] text-foreground">{editStaff2StartTime}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>
          <p className="text-[16px] font-medium" style={{ color: '#70737B', marginBottom: '16px' }}>퇴근 시간 변경</p>
          <div style={{ marginBottom: '30px' }}>
            <button onClick={() => setActiveTimePicker('editEnd2')} className="w-full flex items-center justify-between" style={{ height: '52px', padding: '0 16px', border: '1px solid #DBDCDF', borderRadius: '10px' }}>
              <span className="text-[15px] text-foreground">{editStaff2EndTime}</span>
              <ChevronDown style={{ width: '20px', height: '20px', color: '#9EA3AD' }} />
            </button>
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      {step === 7 ? (
        <div style={{ padding: '16px 20px 32px' }}>
          <button
            onClick={() => setShowExchangeConfirm(true)}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', color: '#FFFFFF', backgroundColor: '#4261FF', cursor: 'pointer' }}
          >
            교환하기
          </button>
        </div>
      ) : step === 8 ? (
        <div style={{ padding: '16px 20px 32px' }}>
          <button
            onClick={handleBottomButton}
            className="w-full py-4 rounded-2xl text-[16px] font-bold bg-primary text-primary-foreground"
          >
            다음
          </button>
        </div>
      ) : step === 9 ? (
        <div className="px-5 pb-8 pt-4 flex gap-3">
          <button
            onClick={() => { setStep(8); }}
            style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: '1px solid #DBDCDF', color: '#19191B', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
          >
            이전
          </button>
          <button
            onClick={() => setShowExchangeConfirm(true)}
            className="flex-1 py-4 rounded-2xl text-[16px] font-bold bg-primary text-primary-foreground"
          >
            교환하기
          </button>
        </div>
      ) : step === 11 ? (
        <div style={{ padding: '16px 20px 32px' }}>
          <button
            onClick={() => setShowSubstituteConfirm(true)}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: '#4261FF', color: '#FFFFFF' }}
          >
            변경하기
          </button>
        </div>
      ) : (
        <div style={{ padding: '16px 20px 32px' }}>
          <button
            onClick={handleBottomButton}
            disabled={!isCurrentStepValid()}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: 'pointer', backgroundColor: isCurrentStepValid() ? '#4261FF' : '#EAECEF', color: isCurrentStepValid() ? '#FFFFFF' : '#9EA3AD' }}
          >
            {getButtonLabel()}
          </button>
        </div>
      )}

      {/* Change type bottom sheet */}
      {showDatePicker && createPortal(
        <div className="fixed inset-0 z-[200] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => setShowDatePicker(false)} className="pressable p-1">
              <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>직원 일정 변경</h1>
          </div>
          <div className="flex-1 overflow-auto scrollbar-hide px-5">
            <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
              {staff?.name} 님의 일정에서<br />변경할 날짜를 선택해주세요
            </h2>
            <div className="flex items-center justify-between px-1 py-3">
              <button onClick={() => { const d = new Date(newCalYear, newCalMonth - 1, 1); setNewCalYear(d.getFullYear()); setNewCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{newCalYear}년 {newCalMonth + 1}월</span>
              <button onClick={() => { const d = new Date(newCalYear, newCalMonth + 1, 1); setNewCalYear(d.getFullYear()); setNewCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-7">
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
              ))}
            </div>
            <div>
              {(() => {
                const days = getCalendarDays(newCalYear, newCalMonth);
                const weeks: typeof days[] = [];
                for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
                return weeks.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 mb-1">
                    {week.map((d, di) => {
                      const dateObj = new Date(d.year, d.month, d.date);
                      const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                      const isSelected = !d.isOutside && newDate && newDate.toDateString() === dateObj.toDateString();
                      const isSun = di === 0; const isSat = di === 6;
                      const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                      const shiftStyle: Record<string, { bg: string; color: string }> = {
                        '오픈': { bg: '#FDF9DF', color: '#FFB300' },
                        '미들': { bg: '#ECFFF1', color: '#1EDC83' },
                        '마감': { bg: '#E8F9FF', color: '#14C1FA' },
                      };
                      return (
                        <button key={di} onClick={() => { if (!d.isOutside) setNewDate(dateObj); }} className="pressable flex flex-col items-center py-1 w-full" style={{ minHeight: '72px' }} disabled={d.isOutside}>
                          <div style={{ height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                              {d.date}
                            </span>
                          </div>
                          {!d.isOutside && staff && (() => {
                            const st = shiftStyle[staff.shifts[0] ?? '오픈'] ?? { bg: '#ECFFF1', color: '#1EDC83' };
                            const bg = isSelected ? '#E8F3FF' : st.bg;
                            const col = isSelected ? '#7488FE' : st.color;
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', backgroundColor: bg, borderRadius: '4px', padding: '2px 0' }}>
                                <span style={{ fontSize: '11px', fontWeight: 500, color: col, lineHeight: '1.3' }}>{staff.startTime}</span>
                                <span style={{ fontSize: '9px', color: col, lineHeight: '1' }}>-</span>
                                <span style={{ fontSize: '11px', fontWeight: 500, color: col, lineHeight: '1.3' }}>{staff.endTime}</span>
                              </div>
                            );
                          })()}
                        </button>
                      );
                    })}
                  </div>
                ));
              })()}
            </div>
          </div>
          <div style={{ padding: '16px 20px 32px' }}>
            <button
              onClick={() => setShowDatePicker(false)}
              disabled={!newDate}
              style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, border: 'none', cursor: newDate ? 'pointer' : 'default', backgroundColor: newDate ? '#4261FF' : '#EAECEF', color: newDate ? '#FFFFFF' : '#9EA3AD' }}
            >
              다음
            </button>
          </div>
        </div>,
        document.body
      )}

      {activeTimePicker && createPortal(
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50" onClick={() => setActiveTimePicker(null)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
                {activeTimePicker.includes('Start') || activeTimePicker === 'start' ? '출근 시간 선택' : '퇴근 시간 선택'}
              </h3>
              <button onClick={() => setActiveTimePicker(null)} className="pressable p-1">
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="overflow-y-auto scrollbar-hide" style={{ maxHeight: '320px', paddingBottom: '8px' }}>
              {TIME_OPTIONS.map((t) => {
                const toMin = (s: string) => { const c = s.replace('오전 ', '').replace('오후 ', ''); const [h, m] = c.split(':').map(Number); return h * 60 + (m || 0); };
                const isEndPicker = activeTimePicker === 'end' || activeTimePicker === 'editEnd' || activeTimePicker === 'editEnd2';
                const refStartTime =
                  activeTimePicker === 'end' ? newStartTime :
                  activeTimePicker === 'editEnd' ? editStaff1StartTime :
                  activeTimePicker === 'editEnd2' ? editStaff2StartTime : '';
                if (isEndPicker && refStartTime && toMin(t) <= toMin(refStartTime)) return null;
                const currentVal =
                  activeTimePicker === 'start' ? newStartTime :
                  activeTimePicker === 'end' ? newEndTime :
                  activeTimePicker === 'editStart' ? editStaff1StartTime :
                  activeTimePicker === 'editEnd' ? editStaff1EndTime :
                  activeTimePicker === 'editStart2' ? editStaff2StartTime :
                  editStaff2EndTime;
                const isSelected = currentVal === t;
                return (
                  <button key={t} className="pressable w-full flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF' }}
                    onClick={() => {
                      if (activeTimePicker === 'start') setNewStartTime(t);
                      else if (activeTimePicker === 'end') setNewEndTime(t);
                      else if (activeTimePicker === 'editStart') setEditStaff1StartTime(t);
                      else if (activeTimePicker === 'editEnd') setEditStaff1EndTime(t);
                      else if (activeTimePicker === 'editStart2') setEditStaff2StartTime(t);
                      else setEditStaff2EndTime(t);
                      setActiveTimePicker(null);
                    }}>
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

      {showChangeTypeSheet && createPortal(
        <div className="fixed inset-0 z-[300] flex items-end justify-center bg-black/50" onClick={() => setShowChangeTypeSheet(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>일정 변경 유형 선택</h3>
              <button onClick={() => setShowChangeTypeSheet(false)} className="pressable p-1">
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-col py-2">
              {CHANGE_TYPES.map((type) => {
                const isSelected = changeType === type;
                return (
                  <button
                    key={type}
                    onClick={() => { setChangeType(type); setShowChangeTypeSheet(false); }}
                    className="pressable w-full flex items-center justify-between px-5 py-4"
                    style={{ backgroundColor: isSelected ? '#F0F4FF' : '#FFFFFF' }}
                  >
                    <span style={{ fontSize: '15px', fontWeight: isSelected ? 600 : 400, color: isSelected ? '#4261FF' : '#19191B', letterSpacing: '-0.02em' }}>{type}</span>
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

      {/* Work schedule change confirmation popup */}
      {showConfirm && staff && selectedDate && newDate && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>근무 일정 변경하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              아래와 같이 근무 일정을 변경하시겠어요?<br />변경 일정은 해당 직원에게도 안내돼요
            </p>
            <div className="text-left text-[13px] space-y-1.5 w-full mb-5 p-3 rounded-xl" style={{ backgroundColor: '#F7F8FA' }}>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>직원</span><span className="font-bold text-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name}</span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>선택한 일정</span><span className="text-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDateConfirm(selectedDate)} | {staff.startTime}-{staff.endTime}</span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>변경한 일정</span><span className="text-primary font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDateConfirm(newDate)} | {newStartTime.replace("오전 ", "").replace("오후 ", "")}-{newEndTime.replace("오전 ", "").replace("오후 ", "")}</span></div>
            </div>
            <div className="flex" style={{ gap: '8px', width: '100%' }}>
              <button onClick={() => setShowConfirm(false)} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleConfirm} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>변경하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Exchange confirmation popup */}
      {showExchangeConfirm && staff && selectedDate && exchangeStaff && exchangeDate && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowExchangeConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>직원 간 근무 일정 교환하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              아래와 같이 근무 일정을 교환하시겠어요?<br />변경 일정은 해당 직원에게도 안내돼요
            </p>
            <div className="text-left text-[13px] space-y-1.5 mb-5 p-3 rounded-xl w-full" style={{ backgroundColor: '#F7F8FA', overflow: 'hidden' }}>
              <div className="flex gap-2"><span style={{ color: '#9EA3AD', minWidth: '60px', flexShrink: 0 }}>직원</span><span className="font-bold text-foreground truncate">{staff.name} ↔ <span className="text-primary">{exchangeStaff.name}</span></span></div>
              <div style={{ height: '1px', backgroundColor: '#EBEBEB', margin: '4px 0' }} />
              <div className="flex flex-col gap-0.5"><span style={{ color: '#9EA3AD' }}>{staff.name}</span><span className="text-foreground">{formatDateConfirm(selectedDate)} → <span className="text-primary font-bold">{formatDateConfirm(exchangeDate)} | {exchangeStaff.startTime}-{exchangeStaff.endTime}</span></span></div>
              <div className="flex flex-col gap-0.5"><span style={{ color: '#9EA3AD' }}>{exchangeStaff.name}</span><span className="text-foreground">{formatDateConfirm(exchangeDate)} → <span className="text-primary font-bold">{formatDateConfirm(selectedDate)} | {staff.startTime}-{staff.endTime}</span></span></div>
            </div>
            <div className="flex" style={{ gap: '8px', width: '100%' }}>
              <button onClick={() => setShowExchangeConfirm(false)} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleExchangeConfirm} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>교환하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Substitute confirmation popup */}
      {showSubstituteConfirm && staff && selectedDate && substituteStaff && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowSubstituteConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>대타 근무자 등록하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              대타 근무자를 등록하시겠어요?<br />변경 일정은 해당 직원에게도 안내돼요
            </p>
            <div className="text-left text-[13px] space-y-1.5 w-full mb-5 p-3 rounded-xl" style={{ backgroundColor: '#F7F8FA' }}>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>직원</span><span className="font-bold text-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{staff.name} → <span className="text-primary">{substituteStaff.name}</span></span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>근무 일정</span><span className="text-foreground" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{formatDateConfirm(selectedDate)} | {staff.startTime}-{staff.endTime}</span></div>
            </div>
            <div className="flex" style={{ gap: '8px', width: '100%' }}>
              <button onClick={() => setShowSubstituteConfirm(false)} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleSubstituteConfirm} className="pressable flex-1 font-semibold" style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>등록하기</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}