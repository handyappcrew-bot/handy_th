import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AttendanceEmployee {
  id: string;
  name: string;
  badgeType: string;
  time: string;
  actualTime?: string;
  statuses: string[];
  avatarColor: string;
}

const EMPLOYEES_TODAY: AttendanceEmployee[] = [
  { id: "1", name: "정수민", badgeType: "오픈", time: "08:00 - 13:00", actualTime: "08:20", statuses: ["지각"], avatarColor: "#6B4C3B" },
  { id: "2", name: "정수민", badgeType: "오픈", time: "08:20 - 13:00", actualTime: "08:20", statuses: ["근무중"], avatarColor: "#6B4C3B" },
  { id: "3", name: "문자영", badgeType: "오픈, 미들", time: "07:50 - 13:00", statuses: ["근무중"], avatarColor: "#6B4C3B" },
  { id: "4", name: "문자영", badgeType: "오픈, 미들", time: "07:50 - 13:00", statuses: ["근무중"], avatarColor: "#6B4C3B" },
  { id: "5", name: "정수민", badgeType: "미들, 마감", time: "18:00 - 22:00", statuses: ["근무전"], avatarColor: "#6B4C3B" },
  { id: "6", name: "정수민", badgeType: "마감", time: "18:00 - 22:00", statuses: ["근무전"], avatarColor: "#6B4C3B" },
  { id: "7", name: "김정민", badgeType: "미들", time: "10:50 - 13:20", actualTime: "13:20", statuses: ["퇴근"], avatarColor: "#6B4C3B" },
  { id: "8", name: "김정민", badgeType: "미들", time: "11:00 - 14:00", statuses: ["결근"], avatarColor: "#6B4C3B" },
  { id: "9", name: "김정민", badgeType: "미들", time: "00:00 - 00:00", statuses: ["휴가"], avatarColor: "#6B4C3B" },
  { id: "10", name: "박지훈", badgeType: "오픈", time: "08:00 - 14:30", actualTime: "15:00", statuses: ["연장", "근무중"], avatarColor: "#4A90D9" },
  { id: "11", name: "이수진", badgeType: "마감", time: "22:00 - 02:00", actualTime: "02:00", statuses: ["야간", "근무중"], avatarColor: "#6B4FEC" },
  { id: "12", name: "최민준", badgeType: "오픈", time: "09:00 - 14:00", actualTime: "14:00", statuses: ["휴일", "근무완료"], avatarColor: "#E05C00" },
];

const EMPLOYEES_CALENDAR: AttendanceEmployee[] = [
  { id: "1", name: "정수민", badgeType: "오픈", time: "08:00 - 13:00", actualTime: "08:20", statuses: ["지각", "근무중"], avatarColor: "#6B4C3B" },
  { id: "2", name: "정수민", badgeType: "오픈", time: "08:00 - 13:00", actualTime: "08:15", statuses: ["지각"], avatarColor: "#6B4C3B" },
  { id: "3", name: "문자영", badgeType: "오픈, 미들", time: "07:50 - 13:00", statuses: ["근무중"], avatarColor: "#6B4C3B" },
  { id: "5", name: "정수민", badgeType: "미들, 마감", time: "18:00 - 22:00", statuses: ["근무전"], avatarColor: "#6B4C3B" },
  { id: "6", name: "정수민", badgeType: "마감", time: "18:00 - 22:00", statuses: ["근무전"], avatarColor: "#6B4C3B" },
  { id: "7", name: "김정민", badgeType: "미들", time: "10:50 - 13:20", actualTime: "13:20", statuses: ["퇴근"], avatarColor: "#6B4C3B" },
  { id: "8", name: "김정민", badgeType: "미들", time: "11:00 - 14:00", statuses: ["결근"], avatarColor: "#6B4C3B" },
  { id: "11", name: "이수진", badgeType: "마감", time: "22:00 - 02:00", actualTime: "02:00", statuses: ["야간", "근무중"], avatarColor: "#6B4FEC" },
];

const EMPLOYEES_PAST: AttendanceEmployee[] = [
  { id: "1", name: "정수민", badgeType: "오픈", time: "08:00 - 13:00", actualTime: "08:20", statuses: ["지각", "퇴근"], avatarColor: "#6B4C3B" },
  { id: "2", name: "정수민", badgeType: "오픈", time: "08:00 - 13:00", statuses: ["근무완료"], avatarColor: "#6B4C3B" },
  { id: "5", name: "정수민", badgeType: "미들, 마감", time: "18:00 - 22:00", statuses: ["근무완료"], avatarColor: "#6B4C3B" },
  { id: "8", name: "김정민", badgeType: "미들", time: "11:00 - 14:00", statuses: ["결근"], avatarColor: "#6B4C3B" },
  { id: "6", name: "정수민", badgeType: "마감", time: "18:00 - 22:00", actualTime: "22:30", statuses: ["연장", "근무완료"], avatarColor: "#6B4C3B" },
  { id: "9", name: "김정민", badgeType: "미들", time: "00:00 - 00:00", statuses: ["휴가"], avatarColor: "#6B4C3B" },
  { id: "11", name: "이수진", badgeType: "마감", time: "22:00 - 02:00", actualTime: "02:00", statuses: ["야간", "근무완료"], avatarColor: "#6B4FEC" },
];

const statusColor: Record<string, { bg: string; color: string }> = {
  "지각":    { bg: "rgba(255,134,45,0.1)",  color: "#FF862D" },
  "근무중":  { bg: "rgba(16,201,125,0.1)",  color: "#10C97D" },
  "근무전":  { bg: "#F7F7F8",               color: "#9EA3AD" },
  "퇴근":    { bg: "rgba(66,97,255,0.1)",   color: "#4261FF" },
  "결근":    { bg: "rgba(255,61,61,0.1)",   color: "#FF3D3D" },
  "휴가":    { bg: "#F7F7F8",               color: "#9EA3AD" },
  "근무완료":{ bg: "rgba(16,201,125,0.1)",  color: "#10C97D" },
  "연장":    { bg: "#E8F3FF",               color: "#7488FE" },
  "야간":    { bg: "rgba(107,79,236,0.1)",  color: "#6B4FEC" },
  "휴일":    { bg: "rgba(224,92,0,0.1)",    color: "#E05C00" },
};

const badgeColor: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
  "일일": "bg-[#EEF1FF] text-[#4261FF]",
  "오픈, 미들": "bg-shift-open-bg text-shift-open",
  "미들, 마감": "bg-shift-middle-bg text-shift-middle",
};

const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function EmployeeRow({ emp, onClick, showReturnBadge = false, hideReturnTag = false }: { emp: AttendanceEmployee; onClick: () => void; showReturnBadge?: boolean; hideReturnTag?: boolean }) {
  const isLate      = emp.statuses.includes("지각");
  const isExtension = emp.statuses.includes("연장");
  const isNight     = emp.statuses.includes("야간");
  const isAbsent    = emp.statuses.includes("결근");
  const isHoliday   = emp.statuses.includes("휴일");
  const isWorking   = emp.statuses.includes("근무중");
  const isPre       = emp.statuses.includes("근무전");
  const isVacation  = emp.statuses.includes("휴가");
  const isDone      = emp.statuses.includes("근무완료");
  const startTime = emp.time.split(" - ")[0];
  const endTime   = emp.time.split(" - ")[1];

  const toMin = (t: string) => { const [h, m] = t.trim().slice(0,5).split(":").map(Number); return h*60+(m||0); };

  const lateMins = (() => {
    if (!isLate || !emp.actualTime) return 0;
    return Math.max(0, toMin(emp.actualTime) - toMin(startTime));
  })();

  const extMins = (() => {
    if (!isExtension || !emp.actualTime) return 0;
    let diff = toMin(emp.actualTime) - toMin(endTime || "00:00");
    if (diff < 0) diff += 24 * 60;
    return Math.max(0, diff);
  })();
  const extStr = (() => {
    if (extMins <= 0) return null;
    const h = Math.floor(extMins / 60), m = extMins % 60;
    return m === 0 ? `${h}시간 연장` : h === 0 ? `${m}분 연장` : `${h}시간 ${m}분 연장`;
  })();

  const renderTime = () => {
    // 결근: 취소선
    if (isAbsent) return <s style={{ color: '#AAB4BF' }}>{emp.time}</s>;
    // 휴가: 출퇴근 모두 회색
    if (isVacation) return <><span style={{ color: '#AAB4BF' }}>{startTime}</span><span style={{ color: '#AAB4BF' }}>{" - "}</span><span style={{ color: '#AAB4BF' }}>{endTime}</span></>;
    // 근무전: 출퇴근 모두 회색
    if (isPre) return <><span style={{ color: '#AAB4BF' }}>{startTime}</span><span style={{ color: '#AAB4BF' }}>{" - "}</span><span style={{ color: '#AAB4BF' }}>{endTime}</span></>;
    // 지각
    if (isLate) {
      const lateTime = emp.actualTime || startTime;
      // 근무중: 출근(주황) - 퇴근(회색)
      // 퇴근완료: 출근(주황) - 퇴근(검정)
      const endColor = isWorking ? '#AAB4BF' : '#19191B';
      return (
        <>
          <span style={{ color: '#FF862D' }}>{lateTime}</span>
          {" - "}
          <span style={{ color: endColor }}>{endTime}</span>
          {lateMins > 0 && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({lateMins}분 지각)</span>}
        </>
      );
    }
    // 근무중: 출근(검정) - 퇴근(회색), 연장+근무중이면 (n분 연장) 추가
    if (isWorking) {
      const inTime = emp.actualTime || startTime;
      if (isExtension) {
        return <><span style={{ color: '#19191B' }}>{startTime}</span>{" - "}<span style={{ color: '#AAB4BF' }}>{endTime}</span>{extStr && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({extStr})</span>}</>;
      }
      return <><span style={{ color: '#19191B' }}>{inTime}</span><span style={{ color: '#AAB4BF' }}>{" - "}{endTime}</span></>;
    }
    // 연장: 출근(검정) - 실제퇴근(파랑)
    if (isExtension && emp.actualTime) {
      return <><span style={{ color: '#19191B' }}>{startTime}</span>{" - "}<span style={{ color: '#7488FE' }}>{emp.actualTime}</span>{extStr && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({extStr})</span>}</>;
    }
    // 야간: 출퇴근 모두 보라
    if (isNight) {
      return <><span style={{ color: '#6B4FEC' }}>{startTime}</span>{" - "}<span style={{ color: '#6B4FEC' }}>{endTime}</span></>;
    }
    // 휴일: 출퇴근 모두 주황
    if (isHoliday) {
      return <><span style={{ color: '#E05C00' }}>{startTime}</span>{" - "}<span style={{ color: '#E05C00' }}>{endTime}</span></>;
    }
    // 근무완료/퇴근: 출퇴근 모두 검정
    const inTime = emp.actualTime || startTime;
    const outTime = emp.actualTime || endTime;
    const isOut = emp.statuses.includes("퇴근") || isDone;
    return (
      <>
        <span style={{ color: '#19191B' }}>{inTime}</span>
        {" - "}
        <span style={{ color: isOut ? '#19191B' : '#AAB4BF' }}>{endTime}</span>
      </>
    );
  };

  // 퇴근 배지: 근무완료 + actualTime 있거나, 지각 + 퇴근시간 노출(근무중 아닌) 케이스
  const needsReturnBadge = showReturnBadge && (
    (isDone && emp.actualTime && !emp.statuses.includes("퇴근")) ||
    (isLate && !isWorking && !emp.statuses.includes("퇴근") && !emp.statuses.includes("근무완료"))
  );
  const displayStatuses = (() => {
    const base = needsReturnBadge ? [...emp.statuses, "퇴근"] : emp.statuses;
    const filtered = hideReturnTag ? base.filter(s => s !== "퇴근") : base;
    return filtered.filter(s => s !== "근무완료");
  })();

  return (
    <button className="pressable" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: emp.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, color: '#FFFFFF' }}>
          {emp.name.slice(-2)}
        </div>
        {isWorking && (
          <div style={{ position: 'absolute', top: '0px', right: '0px', width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10C97D', border: '2px solid #FFFFFF' }} />
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
          <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeColor[emp.badgeType] || "bg-muted text-muted-foreground"}`}>
            {emp.badgeType}
          </span>
          <span style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{emp.name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '14px', color: '#AAB4BF' }}>{renderTime()}</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
        {displayStatuses.map((status, i) => {
          const s = statusColor[status] || { bg: '#F7F7F8', color: '#9EA3AD' };
          return (
            <span key={i} style={{ fontSize: '11px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px', backgroundColor: s.bg, color: s.color }}>
              {status}
            </span>
          );
        })}
      </div>
    </button>
  );
}

function TodayTab({ onSelectEmployee }: { onSelectEmployee: (emp: AttendanceEmployee) => void }) {
  const [showAll, setShowAll] = useState(false);
  const sorted = sortEmployees(EMPLOYEES_TODAY);
  const displayed = showAll ? sorted : sorted.slice(0, 8);
  const today = new Date();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const dateStr = `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일 (${dayNames[today.getDay()]})`;

  const count = (status: string) => EMPLOYEES_TODAY.filter(e => e.statuses.includes(status)).length;
  const countExact = (status: string) =>
    EMPLOYEES_TODAY.filter(e => e.statuses.length === 1 && e.statuses[0] === status).length;

  const stats: { label: string; value: number }[] = [
    { label: "출근", value: count("근무중") },
    { label: "퇴근", value: count("퇴근") + count("근무완료") },
    { label: "근무전", value: count("근무전") },
    { label: "지각", value: count("지각") },
    { label: "연장", value: count("연장") },
    { label: "야간", value: count("야간") },
    { label: "휴일", value: count("휴일") },
    { label: "결근", value: countExact("결근") },
    { label: "휴가", value: countExact("휴가") },
  ].filter(s => s.value > 0);

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#FFFFFF', minHeight: '100vh' }}>
      <p style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>{dateStr}</p>

      <div style={{ backgroundColor: '#F0F7FF', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, color: '#7488FE', marginBottom: '8px' }}>
          오늘의 근무 현황
        </span>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#19191B' }}>총 근무자</p>
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#4261FF' }}>{EMPLOYEES_TODAY.length}명</span>
        </div>
        <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '10px 0' }} />
        <p style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.6' }}>
          {(() => {
            const line1 = stats.filter(s => ["출근","퇴근","근무전","지각","결근"].includes(s.label));
            const line2 = stats.filter(s => ["연장","야간","휴일","휴가"].includes(s.label));
            return <>
              {line1.map((s, i) => <span key={s.label}>{i > 0 && ' · '}{s.label} {s.value}명</span>)}
              {line1.length > 0 && line2.length > 0 && <br />}
              {line2.map((s, i) => <span key={s.label}>{i > 0 && ' · '}{s.label} {s.value}명</span>)}
            </>;
          })()}
        </p>
      </div>

      <p style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>오늘의 근태현황</p>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
        {displayed.map((emp, i) => (
          <div key={emp.id + i}>
            <EmployeeRow emp={emp} onClick={() => onSelectEmployee(emp)} showReturnBadge={true} />
            {i < displayed.length - 1 && <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />}
          </div>
        ))}
      </div>
      {!showAll && EMPLOYEES_TODAY.length > 8 && (
        <button className="pressable" onClick={() => setShowAll(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '12px 0', fontSize: '13px', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer' }}>
          더보기 <ChevronDown style={{ width: '16px', height: '16px' }} />
        </button>
      )}
    </div>
  );
}


function sortEmployees(list: AttendanceEmployee[]): AttendanceEmployee[] {
  const order = (e: AttendanceEmployee) => {
    if (e.statuses.includes("근무중")) return 0;
    if (e.statuses.includes("근무전")) return 1;
    return 2; // 퇴근, 근무완료, 결근 등
  };
  return [...list].sort((a, b) => order(a) - order(b));
}

function CalendarTab({ onSelectEmployee }: { onSelectEmployee: (emp: AttendanceEmployee) => void }) {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear] = useState(currentDate.getFullYear());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const dd = new Date(sunday);
      dd.setDate(sunday.getDate() + i);
      dates.push(dd);
    }
    return dates;
  };

  const weekDates = getWeekDates(currentDate);
  const isSameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  const isToday = (d: Date) => isSameDay(d, today);
  const isSelected = (d: Date) => selectedDate ? isSameDay(d, selectedDate) : false;
  const isPast = (d: Date) => { const t = new Date(today); t.setHours(0,0,0,0); const dd = new Date(d); dd.setHours(0,0,0,0); return dd < t; };
  const isFutureDate = (d: Date) => { const t = new Date(today); t.setHours(0,0,0,0); const dd = new Date(d); dd.setHours(0,0,0,0); return dd > t; };

  const handleDateClick = (d: Date) => {
    if (isFutureDate(d)) return;
    if (!isToday(d)) setSelectedDate(selectedDate && isSameDay(d, selectedDate) ? null : d);
  };

  const navigateWeek = (dir: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + dir * 7);
    setCurrentDate(newDate);
  };

  const activeDate = selectedDate || today;
  const rawEmployees = isPast(activeDate) ? EMPLOYEES_PAST : EMPLOYEES_CALENDAR;
  const employees = sortEmployees(rawEmployees);
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? employees : employees.slice(0, 8);

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
        <button onClick={() => navigateWeek(-1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
        <button className="pressable" onClick={() => { setPickerYear(year); setMonthPickerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{year}년 {month + 1}월</span>
          <ChevronDown style={{ width: '16px', height: '16px', color: '#9EA3AD' }} />
        </button>
        <button onClick={() => navigateWeek(1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        {weekDates.map((d, i) => {
          const todayCell = isToday(d);
          const sel = isSelected(d) && !todayCell;
          const isSun = i === 0; const isSat = i === 6;
          const dayColor = isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#9EA3AD';
          const dateColor = todayCell ? '#FFFFFF' : sel ? '#4261FF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
          const future = isFutureDate(d);
          return (
            <button key={i} onClick={() => handleDateClick(d)} disabled={future}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: future ? 'default' : 'pointer', opacity: future ? 0.35 : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '44px', height: '64px', borderRadius: '14px', gap: '2px', backgroundColor: todayCell ? '#4261FF' : sel ? 'rgba(66,97,255,0.1)' : 'transparent' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: todayCell ? '#FFFFFF' : sel ? '#4261FF' : dayColor }}>{WEEK_DAYS[i]}</span>
                <span style={{ fontSize: '16px', fontWeight: 700, color: dateColor }}>{d.getDate()}</span>
              </div>
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>근무 직원</span>
        <span style={{ fontSize: '14px', color: '#9EA3AD' }}>총 {employees.length}명</span>
      </div>
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
        {displayed.map((emp, i) => (
          <div key={emp.id + i}>
            <EmployeeRow emp={emp} onClick={() => onSelectEmployee(emp)} hideReturnTag={true} />
            {i < displayed.length - 1 && <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />}
          </div>
        ))}
      </div>
      {!showAll && employees.length > 8 && (
        <button className="pressable" onClick={() => setShowAll(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '12px 0', fontSize: '13px', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer' }}>
          더보기 <ChevronDown style={{ width: '16px', height: '16px' }} />
        </button>
      )}

      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setMonthPickerOpen(false)}>
          <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => setPickerYear(p => p - 1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => setPickerYear(p => p + 1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const isSel = pickerYear === year && i === month;
                return (
                  <button key={i} onClick={() => { setCurrentDate(new Date(pickerYear, i, 1)); setMonthPickerOpen(false); }}
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
    </div>
  );
}

interface AttendanceRequest {
  id: string;
  type: "출·퇴근 시간 변경" | "휴게 시간 변경" | "근무 요일 변경";
  employeeName: string;
  employeeInfo: string;
  requestedAt: string;
  originalLabel: string;
  originalBadge: string;
  originalSchedule: string;
  originalExtra?: string;
  changedBadge: string;
  changedSchedule: string;
  changedExtra?: string;
  reason: string;
}

const ATTENDANCE_REQUESTS: AttendanceRequest[] = [
  { id: "r1", type: "출·퇴근 시간 변경", employeeName: "문자영", employeeInfo: "22세 · 여자 · 알바생", requestedAt: "7분 전", originalLabel: "기존 일정", originalBadge: "미들", originalSchedule: "2025년 11월 16일 (목) | 13:00 - 22:00", changedBadge: "미들", changedSchedule: "2025년 11월 16일 (금) | 13:00 - 18:30", reason: "퇴근을 깜빡하고 못 눌렀습니다." },
  { id: "r2", type: "휴게 시간 변경", employeeName: "문자영", employeeInfo: "22세 · 여자 · 알바생", requestedAt: "23분 전", originalLabel: "기존 일정", originalBadge: "미들", originalSchedule: "2025년 11월 16일 (목) | 13:00 - 17:00", originalExtra: "[휴게] 2분", changedBadge: "미들", changedSchedule: "2025년 11월 16일 (금) | 13:00 - 17:30", changedExtra: "[휴게] 30분", reason: "휴게 버튼을 깜빡하고 못 눌렀습니다." },
  { id: "r3", type: "근무 요일 변경", employeeName: "문자영", employeeInfo: "22세 · 여자 · 알바생", requestedAt: "1시간 전", originalLabel: "미근무 일정", originalBadge: "", originalSchedule: "2025년 11월 16일 (목)", changedBadge: "미들", changedSchedule: "2025년 11월 16일 (금) | 13:00 - 17:30", changedExtra: "[휴게] 30분", reason: "근무 일정이 추가되어있지 않았습니다." },
];

const REQUEST_FILTERS = ["전체", "출·퇴근", "근무요일", "휴게"];

function RequestTab({ requests, setRequests }: { requests: AttendanceRequest[]; setRequests: React.Dispatch<React.SetStateAction<AttendanceRequest[]>> }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("전체");
  const [confirmDialog, setConfirmDialog] = useState<{ type: "approve" | "reject"; id: string } | null>(null);

  const confirmAction = () => {
    if (!confirmDialog) return;
    setRequests(prev => prev.filter(r => r.id !== confirmDialog.id));
    toast({
      description: confirmDialog.type === "approve" ? "근태 건의 요청이 수락 되었어요." : "근태 건의 요청이 거절 되었어요.",
      duration: 2000,
      variant: confirmDialog.type === "approve" ? "default" : "destructive",
    });
    setConfirmDialog(null);
  };

  const filterMap: Record<string, string> = { "출·퇴근": "출·퇴근 시간 변경", "근무요일": "근무 요일 변경", "휴게": "휴게 시간 변경" };
  const filtered = filter === "전체" ? requests : requests.filter(r => r.type === filterMap[filter]);

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {REQUEST_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="pressable"
            style={{ height: '28px', padding: '0 14px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', border: `1px solid ${filter === f ? '#4261FF' : '#DBDCDF'}`, backgroundColor: filter === f ? '#E8F3FF' : '#FFFFFF', color: filter === f ? '#4261FF' : '#AAB4BF' }}>
            {f === "전체" ? `전체 ${requests.length}` : f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length > 0 ? filtered.map(req => (
          <div key={req.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', borderRadius: '6px', padding: '0 10px', backgroundColor: '#EEF1FF', fontSize: '13px', fontWeight: 600, color: '#4261FF' }}>{req.type}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em' }}>{req.requestedAt}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '2px' }}>요청 직원</p>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{req.employeeName} · {req.employeeInfo}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '8px' }}>변경 요청 사항</p>
                <div style={{ backgroundColor: '#F7F7F8', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#9EA3AD' }}>{req.originalLabel}</span>
                    {req.originalBadge && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeColor[req.originalBadge] || "bg-muted text-muted-foreground"}`}>{req.originalBadge}</span>}
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{req.originalSchedule}</p>
                  {req.originalExtra && <p style={{ fontSize: '13px', color: '#70737B', marginTop: '2px' }}>{req.originalExtra}</p>}
                </div>
                <div style={{ backgroundColor: '#F0F7FF', borderRadius: '12px', padding: '10px 12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#4261FF' }}>변경 일정</span>
                    {req.changedBadge && <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${badgeColor[req.changedBadge] || "bg-muted text-muted-foreground"}`}>{req.changedBadge}</span>}
                  </div>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{req.changedSchedule}</p>
                  {req.changedExtra && <p style={{ fontSize: '13px', color: '#70737B', marginTop: '2px' }}>{req.changedExtra}</p>}
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '2px' }}>요청 사유</p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{req.reason}</p>
              </div>
            </div>
            <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0 16px' }} />
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
              <button onClick={() => setConfirmDialog({ type: "reject", id: req.id })}
                className="pressable"
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: 'none', backgroundColor: '#DEEBFF', color: '#4261FF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}>거절하기</button>
              <button onClick={() => setConfirmDialog({ type: "approve", id: req.id })}
                className="pressable"
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: 'none', backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}>승인하기</button>
            </div>
          </div>
        )) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '14px', color: '#AAB4BF' }}>근태 건의 요청이 없습니다</p>
          </div>
        )}
      </div>

      {!!confirmDialog && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setConfirmDialog(null)}>
          <div style={{ width: 'calc(100% - 48px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>
              {confirmDialog.type === "approve" ? "근태 건의 요청 수락" : "근태 건의 요청 거절"}
            </h3>
            <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
              {confirmDialog.type === "approve"
                ? "근태 건의 요청을 수락하시겠어요?\n수락 즉시 해당 직원의 근태 정보가\n변경 처리돼요"
                : "근태 건의 요청을 거절하시겠어요?\n거절 즉시 해당 직원의 근태 정보가\n변경 처리돼요"}
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button className="pressable" onClick={() => setConfirmDialog(null)} style={{ flex: 1, height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>취소</button>
              <button className="pressable" onClick={confirmAction} style={{ flex: 1, height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>확인</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function AttendanceManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "오늘의 근태";
  const [activeTab, setActiveTab] = useState(initialTab);
  const tabs = ["오늘의 근태", "주간 근태", "근태 건의 요청"];
  const [attendanceRequests, setAttendanceRequests] = useState(ATTENDANCE_REQUESTS);
  const requestCount = attendanceRequests.length;
  const handleSelectEmployee = (emp: AttendanceEmployee) => {
    const params = new URLSearchParams({
      name: emp.name,
      statuses: emp.statuses.join(","),
      time: emp.time,
      ...(emp.actualTime ? { actualTime: emp.actualTime } : {}),
    });
    navigate(`/owner/attendance/${emp.id}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 8px 8px' }}>
            <button onClick={() => navigate('/owner/home')} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>근태 관리</h1>
          </div>
          <div className="flex border-b border-border px-5" style={{ gap: '24px' }}>
            {tabs.map(tab => {
              const isRequest = tab === "근태 건의 요청";
              const label = isRequest ? `근태 변경 요청 ${requestCount}건` : tab;
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative whitespace-nowrap"
                  style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
                  {isRequest && requestCount > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mr-1 mb-2" />}
                  {label}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          {activeTab === "오늘의 근태" && <TodayTab onSelectEmployee={handleSelectEmployee} />}
          {activeTab === "주간 근태" && <CalendarTab onSelectEmployee={handleSelectEmployee} />}
          {activeTab === "근태 건의 요청" && <RequestTab requests={attendanceRequests} setRequests={setAttendanceRequests} />}
        </div>
      </div>
    </div>
  );
}