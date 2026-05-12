import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronRight, X } from "lucide-react";

interface AttendanceRecord {
  date: string;
  dayOfWeek: string;
  statuses: string[];
  time: string;       // 예정 근무 시간 (계약 시간)
  actualTime?: string;
}

interface StaffMember {
  id: string;
  name: string;
  shifts: string[];
  type: string;
  days: string;
  avatarColor: string;
  salaryType: "시급" | "일급" | "월급" | "연봉";
  salaryAmount: number;
}

const STAFF_LIST: StaffMember[] = [
  { id: "1",  name: "김정민", shifts: ["오픈"],         type: "정규직", days: "월, 화, 수, 목, 금", avatarColor: "#6B4C3B", salaryType: "시급",  salaryAmount: 10000 },
  { id: "2",  name: "문자영", shifts: ["오픈", "미들"], type: "알바생", days: "월, 화",             avatarColor: "#6B4C3B", salaryType: "시급",  salaryAmount: 11000 },
  { id: "3",  name: "정수민", shifts: ["미들"],         type: "알바생", days: "월, 화, 수",         avatarColor: "#6B4C3B", salaryType: "월급",  salaryAmount: 1500000 },
  { id: "4",  name: "김수민", shifts: ["미들"],         type: "알바생", days: "화, 수",             avatarColor: "#6B4C3B", salaryType: "연봉",  salaryAmount: 36000000 },
  { id: "5",  name: "키키치", shifts: ["미들"],         type: "알바생", days: "목",                 avatarColor: "#6B4C3B", salaryType: "시급",  salaryAmount: 11000 },
  { id: "10", name: "박지훈", shifts: ["오픈"],         type: "정규직", days: "월, 화, 수, 목",     avatarColor: "#4A90D9", salaryType: "월급",  salaryAmount: 2500000 },
  { id: "11", name: "이수진", shifts: ["마감"],         type: "알바생", days: "수, 목, 금",         avatarColor: "#6B4FEC", salaryType: "시급",  salaryAmount: 9860 },
];

const RECORDS_DEFAULT: AttendanceRecord[] = [
  { date: "10월 1일", dayOfWeek: "수", statuses: ["지각", "근무완료"], time: "08:00 - 13:00", actualTime: "08:10" },
  { date: "10월 2일", dayOfWeek: "목", statuses: ["결근"],             time: "08:00 - 13:00" },
  { date: "10월 5일", dayOfWeek: "일", statuses: ["휴일", "근무완료"], time: "08:00 - 13:00", actualTime: "13:00" },
  { date: "10월 6일", dayOfWeek: "월", statuses: ["근무완료"],         time: "08:00 - 13:00", actualTime: "08:10" },
  { date: "10월 7일", dayOfWeek: "화", statuses: ["근무완료"],         time: "08:00 - 13:00", actualTime: "08:10" },
  { date: "10월 8일", dayOfWeek: "수", statuses: ["연장", "근무완료"], time: "08:00 - 13:00", actualTime: "12:30" },
];
const RECORDS_이수진: AttendanceRecord[] = [
  { date: "10월 1일",  dayOfWeek: "수", statuses: ["야간", "근무완료"], time: "22:00 - 02:00", actualTime: "02:00" },
  { date: "10월 3일",  dayOfWeek: "금", statuses: ["야간", "근무완료"], time: "22:00 - 02:00", actualTime: "02:00" },
  { date: "10월 8일",  dayOfWeek: "수", statuses: ["야간", "근무완료"], time: "22:00 - 02:00", actualTime: "02:00" },
  { date: "10월 10일", dayOfWeek: "금", statuses: ["근무완료"],         time: "22:00 - 02:00", actualTime: "01:30" },
  { date: "10월 15일", dayOfWeek: "수", statuses: ["야간", "근무완료"], time: "22:00 - 02:00", actualTime: "02:00" },
  { date: "10월 17일", dayOfWeek: "금", statuses: ["결근"],             time: "22:00 - 02:00" },
];
const RECORDS_박지훈: AttendanceRecord[] = [
  { date: "10월 1일",  dayOfWeek: "수", statuses: ["근무완료"],         time: "08:00 - 14:30", actualTime: "13:00" },
  { date: "10월 6일",  dayOfWeek: "월", statuses: ["연장", "근무완료"], time: "08:00 - 14:30", actualTime: "15:00" },
  { date: "10월 8일",  dayOfWeek: "수", statuses: ["지각", "근무완료"], time: "08:00 - 14:30", actualTime: "08:25" },
  { date: "10월 13일", dayOfWeek: "월", statuses: ["연장", "근무완료"], time: "08:00 - 14:30", actualTime: "14:30" },
  { date: "10월 15일", dayOfWeek: "수", statuses: ["근무완료"],         time: "08:00 - 14:30", actualTime: "13:00" },
];
const RECORDS_MAP: Record<string, AttendanceRecord[]> = {
  "이수진": RECORDS_이수진,
  "박지훈": RECORDS_박지훈,
};
function getRecordsForStaff(name: string): AttendanceRecord[] {
  return RECORDS_MAP[name] || RECORDS_DEFAULT;
}

const statusStyle: Record<string, { bg: string; color: string }> = {
  "지각":     { bg: "rgba(255,134,45,0.1)",  color: "#FF862D" },
  "근무완료": { bg: "rgba(16,201,125,0.1)",  color: "#10C97D" },
  "결근":     { bg: "rgba(255,61,61,0.1)",   color: "#FF3D3D" },
  "연장":     { bg: "#E8F3FF",               color: "#7488FE" },
  "야간":     { bg: "rgba(107,79,236,0.1)",  color: "#6B4FEC" },
  "휴일":     { bg: "rgba(224,92,0,0.1)",    color: "#E05C00" },
  "무일정":   { bg: "#F7F7F8",               color: "#9EA3AD" },
};

const shiftColor: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

function buildWorkData(records: AttendanceRecord[]): Record<number, { label: string; type: string }> {
  const map: Record<number, { label: string; type: string }> = {};
  records.forEach(r => {
    const dayMatch = r.date.match(/(\d+)일/);
    if (!dayMatch) return;
    const day = parseInt(dayMatch[1]);
    if (r.statuses.includes("결근")) {
      map[day] = { label: "결근", type: "absent" };
    } else if (r.statuses.includes("휴가")) {
      map[day] = { label: "휴가", type: "vacation" };
    } else if (r.statuses.includes("휴일")) {
      const [start, end] = r.time.split(" - ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
      let hours = end - start; if (hours < 0) hours += 24;
      map[day] = { label: `${Math.round(hours)}시간`, type: "holiday" };
    } else if (r.statuses.includes("지각")) {
      const [start, end] = r.time.split(" - ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
      let hours = end - start; if (hours < 0) hours += 24;
      map[day] = { label: `${Math.round(hours)}시간`, type: "late" };
    } else if (r.statuses.includes("연장")) {
      const [start, end] = r.time.split(" - ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
      let hours = end - start; if (hours < 0) hours += 24;
      map[day] = { label: `${Math.round(hours)}시간`, type: "extended" };
    } else if (r.statuses.includes("야간")) {
      const [start, end] = r.time.split(" - ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
      let hours = end - start; if (hours < 0) hours += 24;
      map[day] = { label: `${Math.round(hours)}시간`, type: "night" };
    } else if (r.statuses.includes("근무완료") || r.statuses.includes("근무중")) {
      const [start, end] = r.time.split(" - ").map(t => { const [h, m] = t.split(":").map(Number); return h + m / 60; });
      let hours = end - start; if (hours < 0) hours += 24;
      map[day] = { label: `${Math.round(hours)}시간`, type: "normal" };
    } else {
      map[day] = { label: "예정", type: "scheduled" };
    }
  });
  return map;
}

const DAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];

const workLabelStyle: Record<string, { bg: string; color: string }> = {
  normal:    { bg: '#ECFFF1', color: '#10C97D' },
  late:      { bg: 'rgba(255,134,45,0.1)', color: '#FF862D' },
  extended:  { bg: '#E8F3FF', color: '#7488FE' },
  night:     { bg: 'rgba(107,79,236,0.1)', color: '#6B4FEC' },
  holiday:   { bg: 'rgba(224,92,0,0.1)',   color: '#E05C00' },
  absent:    { bg: '#FFEAE6', color: '#FF3D3D' },
  vacation:  { bg: '#F7F7F8', color: '#9EA3AD' },
  scheduled: { bg: '#F7F7F8', color: '#9EA3AD' },
};

interface WorkInfoData {
  date: string;
  statuses: string[];
  shift?: string;
  shiftTime?: string;   // 예정 근무 시간 (계약)
  clockIn: string;      // 실제 출근
  clockOut: string;     // 실제 퇴근
  breakTime: string;
  lateMinutes?: number;
  extensionHours?: number;
  nightHours?: number;
}

function buildWorkInfoFromRecords(records: AttendanceRecord[]): Record<number, WorkInfoData> {
  const map: Record<number, WorkInfoData> = {};
  records.forEach(r => {
    const dayMatch = r.date.match(/(\d+)일/);
    if (!dayMatch) return;
    const day = parseInt(dayMatch[1]);
    const fmt = (t: string) => { const tr = t.trim().slice(0,5); const ci = tr.indexOf(":"); if (ci === -1) return tr.padStart(2,"0")+":00"; return tr.slice(0,ci).padStart(2,"0")+":"+tr.slice(ci+1,ci+3).padStart(2,"0"); };
    const parts = r.time.split(" - ");
    // 예정 시간 (계약)
    const scheduledIn  = fmt(parts[0] || "00:00");
    const scheduledOut = fmt(parts[1] || "00:00");
    // 실제 시간
    const actualFmt = r.actualTime ? fmt(r.actualTime) : undefined;
    const isLate     = r.statuses.includes("지각");
    const isExtended = r.statuses.includes("연장");
    const isNight    = r.statuses.includes("야간");

    // 실제 출근: 지각이면 actualTime, 아니면 예정 출근
    const clockIn  = isLate && actualFmt ? actualFmt : scheduledIn;
    // 실제 퇴근: 연장/야간이면 actualTime, 아니면 예정 퇴근
    const clockOut = (isExtended || isNight) && actualFmt ? actualFmt : scheduledOut;

    map[day] = {
      date: r.date,
      statuses: r.statuses,
      shift: isNight ? "마감" : "오픈",
      // shiftTime = 예정 근무 시간 (계약 기준)
      shiftTime: `${scheduledIn} ~ ${scheduledOut}`,
      clockIn,
      clockOut,
      breakTime: "30분",
      lateMinutes: isLate && actualFmt ? (() => {
        const [sh, sm] = scheduledIn.split(":").map(Number);
        const [ah, am] = actualFmt.split(":").map(Number);
        return Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
      })() : undefined,
      extensionHours: isExtended ? (() => {
        const [sh, sm] = scheduledIn.split(":").map(Number);
        const out = actualFmt || scheduledOut;
        const [eh, em] = out.split(":").map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        return Math.round(mins / 60);
      })() : undefined,
      nightHours: isNight ? (() => {
        const [sh, sm] = scheduledIn.split(":").map(Number);
        const [eh, em] = scheduledOut.split(":").map(Number);
        let mins = (eh * 60 + em) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        return Math.round(mins / 60);
      })() : undefined,
    };
  });
  return map;
}

function getWorkInfoForDay(day: number, month: number, year: number, workInfoMap: Record<number, WorkInfoData>): WorkInfoData | null {
  if (workInfoMap[day]) return workInfoMap[day];
  const monthNames = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];
  return { date: `${monthNames[month - 1]} ${day}일`, statuses: ["무일정"], clockIn: "00:00", clockOut: "00:00", breakTime: "0분" };
}

function MonthlyCalendar({ year, month, selectedDay, onSelectDay, onClickMonthHeader, onNavigateMonth, workData }: {
  year: number; month: number; selectedDay: number | null;
  onSelectDay: (day: number) => void; onClickMonthHeader: () => void; onNavigateMonth: (dir: number) => void;
  workData: Record<number, { label: string; type: string }>;
}) {
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const todayDate = isCurrentMonth ? today.getDate() : -1;
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const cells: { day: number; isOutside: boolean }[] = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, isOutside: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, isOutside: false });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) cells.push({ day: i, isOutside: true });
  const weeks: { day: number; isOutside: boolean }[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <div style={{ paddingBottom: '16px', marginTop: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '16px' }}>
        <button onClick={() => onNavigateMonth(-1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
        <button onClick={onClickMonthHeader} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{year}년 {month}월</span>
          <ChevronDown style={{ width: '16px', height: '16px', color: '#9EA3AD' }} />
        </button>
        <button onClick={() => onNavigateMonth(1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
      </div>
      <div className="grid grid-cols-7" style={{ marginBottom: '4px' }}>
        {DAY_HEADERS.map((d, i) => (
          <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: 500, padding: '4px 0', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#9EA3AD' }}>{d}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7">
          {week.map((cell, ci) => {
            if (cell.isOutside) return (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '72px', padding: '4px 0' }}>
                <span style={{ fontSize: '13px', color: '#DBDCDF' }}>{cell.day}</span>
              </div>
            );
            const isToday = cell.day === todayDate;
            const isSelected = cell.day === selectedDay;
            const work = workData[cell.day];
            const isSun = ci === 0; const isSat = ci === 6;
            const dateColor = isToday ? '#FFFFFF' : isSelected ? '#4261FF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
            const wStyle = work ? workLabelStyle[work.type] || workLabelStyle.scheduled : null;
            return (
              <button key={ci} onClick={() => onSelectDay(cell.day)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '72px', padding: '4px 0', background: 'none', border: 'none', cursor: 'pointer' }}>
                <div style={{ width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', backgroundColor: isToday ? '#4261FF' : isSelected ? 'rgba(66,97,255,0.1)' : 'transparent' }}>
                  <span style={{ fontSize: '14px', fontWeight: isToday || isSelected ? 700 : 500, color: dateColor }}>{cell.day}</span>
                </div>
                {work && wStyle && (
                  <span style={{ fontSize: '10px', fontWeight: 600, marginTop: '2px', width: '40px', height: '17px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px', backgroundColor: wStyle.bg, color: wStyle.color }}>
                    {work.label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default function AttendanceDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialName = searchParams.get("name") || "정수민";
  const incomingStatuses = searchParams.get("statuses")?.split(",").filter(Boolean) || [];
  const incomingTime = searchParams.get("time") || "";
  const incomingActualTime = searchParams.get("actualTime") || "";

  const [selectedStaff, setSelectedStaff] = useState<StaffMember>(STAFF_LIST.find(s => s.name === initialName) || STAFF_LIST[0]);
  const [staffPickerOpen, setStaffPickerOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedMonth, setSelectedMonth] = useState(10);
  const [pickerYear, setPickerYear] = useState(2025);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [workInfoOpen, setWorkInfoOpen] = useState(false);
  const [workInfoData, setWorkInfoData] = useState<WorkInfoData | null>(null);

  const baseRecords = getRecordsForStaff(selectedStaff.name);
  const staffRecords = (() => {
    if (!incomingStatuses.length || !incomingTime) return baseRecords;
    const today = new Date();
    const todayLabel = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayNames = ["일","월","화","수","목","금","토"];
    const todayRecord: AttendanceRecord = {
      date: todayLabel, dayOfWeek: dayNames[today.getDay()],
      statuses: incomingStatuses, time: incomingTime, actualTime: incomingActualTime || undefined,
    };
    const filtered = baseRecords.filter(r => r.date !== todayLabel);
    return [...filtered, todayRecord].sort((a, b) => {
      const da = parseInt(a.date.match(/(\d+)일/)?.[1] || "0");
      const db = parseInt(b.date.match(/(\d+)일/)?.[1] || "0");
      return da - db;
    });
  })();

  const baseWorkInfoMap = buildWorkInfoFromRecords(staffRecords);
  const workInfoMap = (() => {
    if (!incomingStatuses.length || !incomingTime) return baseWorkInfoMap;
    const today = new Date();
    const todayDay = today.getDate();
    const timeParts = incomingTime.split(" - ");
    const fmt = (t: string) => { const tr = t.trim(); const ci = tr.indexOf(":"); if (ci === -1) return tr.padStart(2,"0")+":00"; return tr.slice(0,ci).padStart(2,"0")+":"+tr.slice(ci+1,ci+3).padStart(2,"0"); };
    const scheduledIn  = fmt(timeParts[0] || "00:00");
    const scheduledOut = fmt(timeParts[1] || "00:00");
    const isLate     = incomingStatuses.includes("지각");
    const isExtended = incomingStatuses.includes("연장");
    const isNight    = incomingStatuses.includes("야간");
    const actualFmt  = incomingActualTime ? fmt(incomingActualTime) : undefined;
    const todayEntry: WorkInfoData = {
      date: `${today.getMonth() + 1}월 ${todayDay}일`,
      statuses: incomingStatuses,
      shift: selectedStaff.shifts[0] || "마감",
      shiftTime: `${scheduledIn} ~ ${scheduledOut}`,
      clockIn:  isLate && actualFmt ? actualFmt : scheduledIn,
      clockOut: (isExtended || isNight) && actualFmt ? actualFmt : scheduledOut,
      breakTime: "30분",
      lateMinutes: isLate && actualFmt ? (() => {
        const [sh, sm] = scheduledIn.split(":").map(Number);
        const [ah, am] = actualFmt.split(":").map(Number);
        return Math.max(0, (ah * 60 + am) - (sh * 60 + sm));
      })() : undefined,
      extensionHours: isExtended && actualFmt ? (() => {
        const [eh, em] = scheduledOut.split(":").map(Number);
        const [ah, am] = actualFmt.split(":").map(Number);
        return Math.max(0, Math.round(((ah * 60 + am) - (eh * 60 + em)) / 60));
      })() : undefined,
      nightHours: isNight && actualFmt ? (() => {
        const [sh, sm] = scheduledIn.split(":").map(Number);
        const [ah, am] = actualFmt.split(":").map(Number);
        let mins = (ah * 60 + am) - (sh * 60 + sm);
        if (mins < 0) mins += 24 * 60;
        return Math.round(mins / 60);
      })() : undefined,
    };
    return { ...baseWorkInfoMap, [todayDay]: todayEntry };
  })();

  const handleDaySelect = (day: number) => {
    setSelectedDay(day);
    const info = getWorkInfoForDay(day, selectedMonth, selectedYear, workInfoMap);
    if (info) { setWorkInfoData(info); setWorkInfoOpen(true); }
  };

  const handleRecordClick = (record: AttendanceRecord) => {
    const dayMatch = record.date.match(/(\d+)일/);
    const day = dayMatch ? parseInt(dayMatch[1]) : 0;
    const info = getWorkInfoForDay(day, selectedMonth, selectedYear, workInfoMap);
    if (info) { setWorkInfoData(info); setWorkInfoOpen(true); }
  };

  const monthRecords = staffRecords.filter(r => {
    const m = r.date.match(/(\d+)월/);
    return m ? parseInt(m[1]) === selectedMonth : true;
  });
  const displayed = showAll ? monthRecords : monthRecords.slice(0, 5);
  const summaryStats = {
    completed: monthRecords.filter(r => r.statuses.includes("근무완료")).length,
    late:      monthRecords.filter(r => r.statuses.includes("지각")).length,
    extended:  monthRecords.filter(r => r.statuses.includes("연장")).length,
    night:     monthRecords.filter(r => r.statuses.includes("야간")).length,
    holiday:   monthRecords.filter(r => r.statuses.includes("휴일")).length,
    absent:    monthRecords.filter(r => r.statuses.includes("결근")).length,
    vacation:  monthRecords.filter(r => r.statuses.includes("휴가")).length,
  };

  const navigateMonth = (dir: number) => {
    let m = selectedMonth + dir; let y = selectedYear;
    if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; }
    setSelectedMonth(m); setSelectedYear(y); setSelectedDay(null);
  };

  const dayOfWeekNames = ["일","월","화","수","목","금","토"];

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        <div className="sticky top-0 z-30" style={{ backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 8px 8px' }}>
            <button onClick={() => navigate(-1)} className="pressable p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>근태 상세</h1>
          </div>
          <div className="border-b border-border" />
        </div>

        {/* Profile */}
        <div style={{ padding: '16px 20px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: selectedStaff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 600, color: '#FFFFFF', flexShrink: 0 }}>
              {selectedStaff.name.slice(-2)}
            </div>
            <button onClick={() => setStaffPickerOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{selectedStaff.name}</span>
              {selectedStaff.shifts.map((shift, i) => (
                <span key={i} className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${shiftColor[shift] || "bg-muted text-muted-foreground"}`}>{shift}</span>
              ))}
              <span style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '99px', backgroundColor: '#F7F7F8', color: '#9EA3AD' }}>{selectedStaff.type}</span>
              <ChevronDown style={{ width: '16px', height: '16px', color: '#9EA3AD' }} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '12px' }}>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#70737B', width: '60px' }}>생년월일</span>
              <span style={{ fontSize: '14px', color: '#19191B' }}>2001.01.17</span>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <span style={{ fontSize: '14px', color: '#70737B', width: '60px' }}>전화번호</span>
              <span style={{ fontSize: '14px', color: '#19191B' }}>010-5713-0208</span>
            </div>
          </div>
        </div>

        <div style={{ height: '12px', backgroundColor: '#F7F7F8' }} />

        {/* Calendar */}
        <div style={{ padding: '0 20px' }}>
          <MonthlyCalendar
            year={selectedYear} month={selectedMonth}
            selectedDay={selectedDay} onSelectDay={handleDaySelect}
            onClickMonthHeader={() => { setPickerYear(selectedYear); setMonthPickerOpen(true); }}
            onNavigateMonth={navigateMonth}
            workData={buildWorkData(staffRecords.filter(r => {
              const m = r.date.match(/(\d+)월/);
              return m ? parseInt(m[1]) === selectedMonth : true;
            }))}
          />
        </div>

        <div style={{ height: '12px', backgroundColor: '#F7F7F8' }} />

        {/* Summary + Records */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ backgroundColor: '#F0F7FF', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, color: '#7488FE', marginBottom: '8px' }}>
              {selectedYear}년 {selectedMonth}월 근태 현황
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {summaryStats.completed > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(16,201,125,0.1)', color: '#10C97D' }}>근무완료 {summaryStats.completed}회</span>}
              {summaryStats.late > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,134,45,0.1)', color: '#FF862D' }}>지각 {summaryStats.late}회</span>}
              {summaryStats.extended > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#E8F3FF', color: '#7488FE' }}>연장 {summaryStats.extended}회</span>}
              {summaryStats.night > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(107,79,236,0.1)', color: '#6B4FEC' }}>야간 {summaryStats.night}회</span>}
              {summaryStats.holiday > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(224,92,0,0.1)', color: '#E05C00' }}>휴일 {summaryStats.holiday}회</span>}
              {summaryStats.absent > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: 'rgba(255,61,61,0.1)', color: '#FF3D3D' }}>결근 {summaryStats.absent}회</span>}
              {summaryStats.vacation > 0 && <span style={{ fontSize: '13px', fontWeight: 500, padding: '4px 10px', borderRadius: '6px', backgroundColor: '#F7F7F8', color: '#9EA3AD' }}>휴가 {summaryStats.vacation}회</span>}
            </div>
          </div>

          <p style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>{selectedMonth}월 근무 상세내역</p>
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 16px', border: '1px solid #F0F0F0' }}>
            {displayed.map((record, i) => {
              const isLate     = record.statuses.includes("지각");
              const isExtended = record.statuses.includes("연장");
              const isAbsent   = record.statuses.includes("결근");
              const isNight    = record.statuses.includes("야간");
              const isHoliday  = record.statuses.includes("휴일");
              // 지각 시간 계산
              const lateMins = (() => {
                if (!isLate || !record.actualTime) return 0;
                const fmt = (t: string) => { const tr = t.trim().slice(0,5); const [h,m] = tr.split(":").map(Number); return h*60+(m||0); };
                return Math.max(0, fmt(record.actualTime) - fmt(record.time.split(" - ")[0] || "00:00"));
              })();
              // 연장 시간 계산
              const extMins = (() => {
                if (!isExtended || !record.actualTime) return 0;
                const fmt = (t: string) => { const tr = t.trim().slice(0,5); const [h,m] = tr.split(":").map(Number); return h*60+(m||0); };
                let diff = fmt(record.actualTime) - fmt(record.time.split(" - ")[1] || "00:00");
                if (diff < 0) diff += 24 * 60;
                return Math.max(0, diff);
              })();
              const extStr = (() => {
                if (extMins <= 0) return null;
                const h = Math.floor(extMins / 60), m = extMins % 60;
                return m === 0 ? `${h}시간 연장` : h === 0 ? `${m}분 연장` : `${h}시간 ${m}분 연장`;
              })();
              return (
                <div key={i}>
                  <button onClick={() => handleRecordClick(record)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                    <div>
                      <p style={{ fontSize: '15px', fontWeight: 600, color: '#19191B', marginBottom: '4px' }}>{record.date} ({record.dayOfWeek})</p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        {record.statuses.map((s, j) => {
                          const st = statusStyle[s] || { bg: '#F7F7F8', color: '#9EA3AD' };
                          return <span key={j} style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', backgroundColor: st.bg, color: st.color }}>{s}</span>;
                        })}
                        {isLate && lateMins > 0 && (
                          <span style={{ fontSize: '11px', color: '#AAB4BF' }}>({lateMins}분 지각)</span>
                        )}
                        <span style={{ fontSize: '13px', color: '#9EA3AD' }}>
                          {isAbsent ? <s>{record.time}</s>
                            : isLate ? <><span style={{ color: '#FF862D', fontWeight: 600 }}>{record.actualTime}</span> - {record.time.split(" - ")[1]?.trim()}</>
                            : isExtended ? <>{record.time.split(" - ")[0]?.trim()} - <span style={{ color: '#7488FE', fontWeight: 600 }}>{record.actualTime}</span>{extStr ? <span style={{ color: '#AAB4BF', fontSize: '11px', marginLeft: '4px' }}>({extStr})</span> : null}</>
                            : isNight ? <><span style={{ color: '#6B4FEC', fontWeight: 600 }}>{record.time.split(" - ")[0]?.trim()}</span> - <span style={{ color: '#6B4FEC', fontWeight: 600 }}>{record.time.split(" - ")[1]?.trim()}</span></>
                            : isHoliday ? <><span style={{ color: '#E05C00', fontWeight: 600 }}>{record.time.split(" - ")[0]?.trim()}</span> - <span style={{ color: '#E05C00', fontWeight: 600 }}>{record.time.split(" - ")[1]?.trim()}</span></>
                            : record.time}
                        </span>
                      </div>
                    </div>
                    <ChevronRight style={{ width: '18px', height: '18px', color: '#DBDCDF', flexShrink: 0 }} />
                  </button>
                  {i < displayed.length - 1 && <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />}
                </div>
              );
            })}
          </div>
          {!showAll && monthRecords.length > 5 && (
            <button onClick={() => setShowAll(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '12px 0', fontSize: '13px', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer' }}>
              더보기 <ChevronDown style={{ width: '16px', height: '16px' }} />
            </button>
          )}
        </div>

        {/* Month picker */}
        {monthPickerOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
            <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <button onClick={() => setPickerYear(p => p - 1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
                <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
                <button onClick={() => setPickerYear(p => p + 1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {Array.from({ length: 12 }, (_, i) => {
                  const isSel = pickerYear === selectedYear && i + 1 === selectedMonth;
                  return (
                    <button key={i} onClick={() => { setSelectedYear(pickerYear); setSelectedMonth(i + 1); setSelectedDay(null); setMonthPickerOpen(false); }}
                      className="pressable py-2.5 rounded-xl text-[14px] font-medium"
                      style={{ backgroundColor: isSel ? '#4261FF' : '#F7F7F8', color: isSel ? '#FFFFFF' : '#19191B' }}>
                      {i + 1}월
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Staff picker */}
        {staffPickerOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none" onClick={() => setStaffPickerOpen(false)}>
            <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="px-6 pt-6">
                <div className="flex items-center justify-between" style={{ marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>직원 선택하기</h3>
                  <button onClick={() => setStaffPickerOpen(false)} className="pressable p-1"><X className="w-5 h-5 text-foreground" /></button>
                </div>
                <div className="flex items-center justify-between" style={{ marginBottom: '4px', marginTop: '4px' }}>
                  <span style={{ fontSize: '14px', color: '#AAB4BF' }}>근무 직원</span>
                  <span style={{ fontSize: '14px', color: '#AAB4BF' }}>총 {STAFF_LIST.length}명</span>
                </div>
              </div>
              <div className="overflow-y-auto py-[10px]" style={{ maxHeight: '60vh' }}>
                {STAFF_LIST.map((staff) => {
                  const isSel = staff.id === selectedStaff.id;
                  return (
                    <button key={staff.id} onClick={() => { setSelectedStaff(staff); setStaffPickerOpen(false); }}
                      className="pressable w-full flex items-center justify-between px-6 py-[10px]"
                      style={{ backgroundColor: isSel ? '#F0F4FF' : '#FFFFFF' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[14px] font-bold" style={{ backgroundColor: staff.avatarColor }}>
                          {staff.name.charAt(0)}
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5" style={{ marginBottom: '2px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, color: isSel ? '#4261FF' : '#19191B' }}>{staff.name}</span>
                            {staff.shifts.map((shift, i) => <span key={i} className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${shiftColor[shift] || 'bg-muted text-muted-foreground'}`}>{shift}</span>)}
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">{staff.type}</span>
                          </div>
                          <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{staff.days}</span>
                        </div>
                      </div>
                      {isSel && <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#4261FF', flexShrink: 0 }} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* Work info bottom sheet */}
        {workInfoOpen && createPortal(
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none" onClick={() => setWorkInfoOpen(false)}>
            <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
              {workInfoData && (() => {
                const primaryStatus = workInfoData.statuses.includes("지각") ? "지각"
                  : workInfoData.statuses.includes("연장") ? "연장"
                  : workInfoData.statuses.includes("야간") ? "야간"
                  : workInfoData.statuses.includes("휴일") ? "휴일"
                  : workInfoData.statuses.includes("결근") ? "결근"
                  : workInfoData.statuses[0];
                const dayMatch = workInfoData.date.match(/(\d+)월\s*(\d+)일/);
                const dayOfWeek = dayMatch ? dayOfWeekNames[new Date(selectedYear, parseInt(dayMatch[1]) - 1, parseInt(dayMatch[2])).getDay()] : "";
                const st = statusStyle[primaryStatus] || { bg: '#F7F7F8', color: '#9EA3AD' };
                return (
                  <div style={{ padding: '24px 24px 32px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
                      <div>
                        <p style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{selectedYear}년 {workInfoData.date} ({dayOfWeek})</p>
                        <p style={{ fontSize: '14px', color: '#70737B', marginTop: '4px' }}>근무 정보</p>
                      </div>
                      <button onClick={() => setWorkInfoOpen(false)} className="pressable p-1"><X className="w-5 h-5 text-foreground" /></button>
                    </div>

                    <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: '13px', fontWeight: 600, padding: '4px 10px', borderRadius: '6px', backgroundColor: st.bg, color: st.color, marginBottom: '12px' }}>
                      {primaryStatus}
                    </span>

                    {/* 예정 근무 시간 — 계약 기준 */}
                    {primaryStatus !== "무일정" && primaryStatus !== "결근" && workInfoData.shift && workInfoData.shiftTime && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${shiftColor[workInfoData.shift] || "bg-muted text-muted-foreground"}`}>{workInfoData.shift}</span>
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#70737B' }}>{workInfoData.shiftTime}</span>
                        <span style={{ fontSize: '12px', color: '#AAB4BF' }}>근무 일정</span>
                      </div>
                    )}

                    <div style={{ borderTop: '1px solid #F0F0F0', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {primaryStatus === "결근" ? (
                        <p style={{ fontSize: '14px', color: '#FF3D3D', fontWeight: 500 }}>결근으로 처리된 날이에요. 근태 기록이 없어요</p>
                      ) : primaryStatus === "무일정" ? (
                        <p style={{ fontSize: '14px', color: '#9EA3AD', fontWeight: 500 }}>근무 일정이 없는 날이에요</p>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '15px', color: '#70737B' }}>출근</span>
                            <span style={{ fontSize: '15px', fontWeight: 500, color: primaryStatus === "지각" ? "#FF862D" : '#19191B' }}>
                              {workInfoData.clockIn}
                              {primaryStatus === "지각" && !!workInfoData.lateMinutes && (
                                <span style={{ fontSize: '12px', color: '#9EA3AD', marginLeft: '4px' }}>({workInfoData.lateMinutes}분 지각)</span>
                              )}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '15px', color: '#70737B' }}>퇴근</span>
                            <span style={{ fontSize: '15px', fontWeight: 500, color: primaryStatus === "연장" ? "#7488FE" : primaryStatus === "야간" ? "#6B4FEC" : primaryStatus === "휴일" ? "#E05C00" : '#19191B' }}>
                              {workInfoData.clockOut}
                              {primaryStatus === "연장" && workInfoData.extensionHours && <span style={{ fontSize: '12px', color: '#9EA3AD', marginLeft: '4px' }}>({workInfoData.extensionHours}시간 연장)</span>}
                              {primaryStatus === "야간" && workInfoData.nightHours && <span style={{ fontSize: '12px', color: '#9EA3AD', marginLeft: '4px' }}>({workInfoData.nightHours}시간 야간)</span>}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '15px', color: '#70737B' }}>휴게시간</span>
                            <span style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{workInfoData.breakTime}</span>
                          </div>
                        </>
                      )}
                    </div>

                    <button onClick={() => {
                      setWorkInfoOpen(false);
                      const dayMatch = workInfoData.date.match(/(\d+)월\s*(\d+)일/);
                      const dw = dayMatch ? dayOfWeekNames[new Date(selectedYear, parseInt(dayMatch[1]) - 1, parseInt(dayMatch[2])).getDay()] : "";
                      const params = new URLSearchParams({
                        staffName: selectedStaff.name,
                        date: `${selectedYear}년 ${workInfoData.date} (${dw})`,
                        status: primaryStatus,
                        shift: workInfoData.shift || "",
                        shiftTime: workInfoData.shiftTime || "",
                        clockIn: workInfoData.clockIn,
                        clockOut: workInfoData.clockOut,
                        salaryType: selectedStaff.salaryType,
                        salaryAmount: String(selectedStaff.salaryAmount),
                      });
                      navigate(`/owner/attendance/edit?${params.toString()}`);
                    }}
                      style={{ width: '100%', marginTop: '20px', height: '56px', borderRadius: '16px', backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', border: 'none', cursor: 'pointer' }}>
                      근태 정보 수정하기
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
}
