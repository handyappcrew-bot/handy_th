import { useState, useEffect, useCallback } from "react";
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

interface ApiRequest {
  id: number;
  source: "worklog" | "schedule";
  employeeName: string;
  uiType: "출·퇴근 시간 변경" | "휴게 시간 변경" | "근무 요일 변경";
  originDate: string;
  originStart?: string;
  originEnd?: string;
  desiredDate: string;
  desiredStart?: string;
  desiredEnd?: string;
  desiredBreakMinutes?: number;
  reason: string;
  createdAt: string;
}

const AVATAR_COLORS = ["#5C4033","#C0392B","#1ABC9C","#2C3E50","#8E44AD","#E67E22","#4261FF","#E74C3C","#27AE60","#F39C12"];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];
const WEEK_DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const statusColor: Record<string, { bg: string; color: string }> = {
  "지각":     { bg: "rgba(255,134,45,0.1)",  color: "#FF862D" },
  "근무중":   { bg: "rgba(16,201,125,0.1)",  color: "#10C97D" },
  "근무전":   { bg: "#F7F7F8",               color: "#9EA3AD" },
  "퇴근":     { bg: "rgba(66,97,255,0.1)",   color: "#4261FF" },
  "결근":     { bg: "rgba(255,61,61,0.1)",   color: "#FF3D3D" },
  "휴가":     { bg: "#F7F7F8",               color: "#9EA3AD" },
  "근무완료": { bg: "rgba(16,201,125,0.1)",  color: "#10C97D" },
  "연장":     { bg: "#E8F3FF",               color: "#7488FE" },
  "야간":     { bg: "rgba(107,79,236,0.1)",  color: "#6B4FEC" },
  "휴일":     { bg: "rgba(224,92,0,0.1)",    color: "#E05C00" },
};

const badgeColor: Record<string, string> = {
  "오픈":       "bg-shift-open-bg text-shift-open",
  "미들":       "bg-shift-middle-bg text-shift-middle",
  "마감":       "bg-shift-close-bg text-shift-close",
  "일일":       "bg-[#EEF1FF] text-[#4261FF]",
  "오픈, 미들": "bg-shift-open-bg text-shift-open",
  "미들, 마감": "bg-shift-middle-bg text-shift-middle",
};

function apiToEmployee(e: any): AttendanceEmployee {
  const statuses: string[] = [];
  if (e.status === "working" || e.status === "on_break") statuses.push("근무중");
  else if (e.status === "off_work") statuses.push("근무완료");
  else statuses.push("결근");

  // 퇴근 완료 시: 실제 출퇴근 시간 표시 / 근무중·결근: 예정 시간 표시
  const isOff = e.status === "off_work";
  const start = isOff ? (e.clock_in ?? e.work_start ?? "--:--") : (e.work_start ?? e.clock_in ?? "--:--");
  const end   = isOff ? (e.clock_out ?? e.work_end ?? "--:--") : (e.work_end ?? "--:--");
  const actualTime = e.clock_in && e.work_start && e.clock_in !== e.work_start ? e.clock_in : undefined;

  return {
    id: String(e.id),
    name: e.name,
    badgeType: e.shift ?? "일일",
    time: `${start} - ${end}`,
    actualTime,
    statuses,
    avatarColor: getAvatarColor(e.id),
  };
}

function mapRequest(r: any, source: "worklog" | "schedule"): ApiRequest {
  let uiType: ApiRequest["uiType"] = "출·퇴근 시간 변경";
  if (source === "worklog") {
    if (r.type === "휴게 시간 변경") uiType = "휴게 시간 변경";
    else if (r.type === "근무 누락") uiType = "근무 요일 변경";
  } else {
    uiType = "근무 요일 변경";
  }
  return {
    id: r.id, source, uiType,
    employeeName: r.employee_name ?? "",
    originDate: source === "worklog" ? (r.date ?? "") : (r.origin_date ?? ""),
    originStart: r.origin_start ?? undefined,
    originEnd: r.origin_end ?? undefined,
    desiredDate: source === "schedule" ? r.desired_date : (r.date ?? ""),
    desiredStart: r.desired_start ?? undefined,
    desiredEnd: r.desired_end ?? undefined,
    desiredBreakMinutes: r.desired_break_minutes ?? undefined,
    reason: r.reason ?? "",
    createdAt: r.created_at ?? "",
  };
}

function fmtDate(s: string): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일 (${WEEK_DAYS[d.getDay()]})`;
}

function timeAgo(s: string): string {
  if (!s) return "";
  const mins = Math.floor((Date.now() - new Date(s).getTime()) / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function sortEmployees(list: AttendanceEmployee[]) {
  const order = (e: AttendanceEmployee) => {
    if (e.statuses.includes("근무중")) return 0;
    if (e.statuses.includes("근무전")) return 1;
    return 2;
  };
  return [...list].sort((a, b) => order(a) - order(b));
}

async function fetchAttendance(storeId: string, date?: string): Promise<AttendanceEmployee[]> {
  const url = `/api/owner/store/${storeId}/attendance/today${date ? `?date=${date}` : ""}`;
  try {
    const res = await fetch(url, { credentials: "include" });
    if (!res.ok) return [];
    const data = await res.json();
    return data.map(apiToEmployee);
  } catch { return []; }
}

// ── EmployeeRow ──────────────────────────────────────────────────────────────

function EmployeeRow({ emp, onClick, showReturnBadge = false, hideReturnTag = false }: {
  emp: AttendanceEmployee; onClick: () => void;
  showReturnBadge?: boolean; hideReturnTag?: boolean;
}) {
  const isLate      = emp.statuses.includes("지각");
  const isExtension = emp.statuses.includes("연장");
  const isNight     = emp.statuses.includes("야간");
  const isAbsent    = emp.statuses.includes("결근");
  const isHoliday   = emp.statuses.includes("휴일");
  const isWorking   = emp.statuses.includes("근무중");
  const isPre       = emp.statuses.includes("근무전");
  const isVacation  = emp.statuses.includes("휴가");
  const isDone      = emp.statuses.includes("근무완료");
  const startTime   = emp.time.split(" - ")[0];
  const endTime     = emp.time.split(" - ")[1];

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
    if (isAbsent)   return <s style={{ color: '#AAB4BF' }}>{emp.time}</s>;
    if (isVacation) return <><span style={{ color: '#AAB4BF' }}>{startTime}</span><span style={{ color: '#AAB4BF' }}> - </span><span style={{ color: '#AAB4BF' }}>{endTime}</span></>;
    if (isPre)      return <><span style={{ color: '#AAB4BF' }}>{startTime}</span><span style={{ color: '#AAB4BF' }}> - </span><span style={{ color: '#AAB4BF' }}>{endTime}</span></>;
    if (isLate) {
      const lateTime = emp.actualTime || startTime;
      const endColor = isWorking ? '#AAB4BF' : '#19191B';
      return <>
        <span style={{ color: '#FF862D' }}>{lateTime}</span>
        {" - "}
        <span style={{ color: endColor }}>{endTime}</span>
        {lateMins > 0 && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({lateMins}분 지각)</span>}
      </>;
    }
    if (isWorking) {
      const inTime = emp.actualTime || startTime;
      if (isExtension) return <><span style={{ color: '#19191B' }}>{startTime}</span>{" - "}<span style={{ color: '#AAB4BF' }}>{endTime}</span>{extStr && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({extStr})</span>}</>;
      return <><span style={{ color: '#19191B' }}>{inTime}</span><span style={{ color: '#AAB4BF' }}>{" - "}{endTime}</span></>;
    }
    if (isExtension && emp.actualTime) return <><span style={{ color: '#19191B' }}>{startTime}</span>{" - "}<span style={{ color: '#7488FE' }}>{emp.actualTime}</span>{extStr && <span style={{ fontSize: '11px', color: '#AAB4BF', marginLeft: '4px' }}>({extStr})</span>}</>;
    if (isNight)   return <><span style={{ color: '#6B4FEC' }}>{startTime}</span>{" - "}<span style={{ color: '#6B4FEC' }}>{endTime}</span></>;
    if (isHoliday) return <><span style={{ color: '#E05C00' }}>{startTime}</span>{" - "}<span style={{ color: '#E05C00' }}>{endTime}</span></>;
    const inTime = emp.actualTime || startTime;
    const isOut  = emp.statuses.includes("퇴근") || isDone;
    return <>
      <span style={{ color: '#19191B' }}>{inTime}</span>
      {" - "}
      <span style={{ color: isOut ? '#19191B' : '#AAB4BF' }}>{endTime}</span>
    </>;
  };

  const needsReturnBadge = showReturnBadge && (
    (isDone && emp.actualTime && !emp.statuses.includes("퇴근")) ||
    (isLate && !isWorking && !emp.statuses.includes("퇴근") && !emp.statuses.includes("근무완료"))
  );
  const displayStatuses = (() => {
    const base     = needsReturnBadge ? [...emp.statuses, "퇴근"] : emp.statuses;
    const filtered = hideReturnTag ? base.filter(s => s !== "퇴근") : base;
    return filtered.filter(s => s !== "근무완료");
  })();

  return (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 0', width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}>
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

// ── TodayTab ─────────────────────────────────────────────────────────────────

function TodayTab({ employees, onSelectEmployee }: { employees: AttendanceEmployee[]; onSelectEmployee: (emp: AttendanceEmployee) => void }) {
  const [showAll, setShowAll] = useState(false);
  const sorted    = sortEmployees(employees);
  const displayed = showAll ? sorted : sorted.slice(0, 8);
  const today     = new Date();
  const dateStr   = `${today.getFullYear()}년 ${today.getMonth()+1}월 ${today.getDate()}일 (${WEEK_DAYS[today.getDay()]})`;

  const count      = (s: string) => employees.filter(e => e.statuses.includes(s)).length;
  const countExact = (s: string) => employees.filter(e => e.statuses.length === 1 && e.statuses[0] === s).length;

  const stats = [
    { label: "출근",  value: count("근무중") },
    { label: "퇴근",  value: count("퇴근") + count("근무완료") },
    { label: "근무전", value: count("근무전") },
    { label: "지각",  value: count("지각") },
    { label: "연장",  value: count("연장") },
    { label: "야간",  value: count("야간") },
    { label: "휴일",  value: count("휴일") },
    { label: "결근",  value: countExact("결근") },
    { label: "휴가",  value: countExact("휴가") },
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
          <span style={{ fontSize: '20px', fontWeight: 700, color: '#4261FF' }}>{employees.length}명</span>
        </div>
        {stats.length > 0 && <>
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
        </>}
      </div>

      <p style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', marginBottom: '12px' }}>오늘의 근태현황</p>
      {employees.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: '14px', color: '#9EA3AD' }}>오늘 스케줄이 있는 직원이 없습니다</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
          {displayed.map((emp, i) => (
            <div key={emp.id + i}>
              <EmployeeRow emp={emp} onClick={() => onSelectEmployee(emp)} showReturnBadge />
              {i < displayed.length - 1 && <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />}
            </div>
          ))}
        </div>
      )}
      {!showAll && employees.length > 8 && (
        <button onClick={() => setShowAll(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '12px 0', fontSize: '13px', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer' }}>
          더보기 <ChevronDown style={{ width: '16px', height: '16px' }} />
        </button>
      )}
    </div>
  );
}

// ── CalendarTab ───────────────────────────────────────────────────────────────

function CalendarTab({ storeId, onSelectEmployee }: { storeId: string; onSelectEmployee: (emp: AttendanceEmployee) => void }) {
  const today = new Date();
  const [currentDate, setCurrentDate]   = useState(new Date(today));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [pickerYear, setPickerYear]     = useState(currentDate.getFullYear());
  const [employees, setEmployees]       = useState<AttendanceEmployee[]>([]);
  const [showAll, setShowAll]           = useState(false);

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const isSameDay  = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const isToday    = (d: Date) => isSameDay(d, today);
  const isFuture   = (d: Date) => { const t = new Date(today); t.setHours(0,0,0,0); const dd = new Date(d); dd.setHours(0,0,0,0); return dd > t; };

  const activeDate = selectedDate || today;
  const dateStr    = `${String(activeDate.getFullYear()).slice(-2)}.${String(activeDate.getMonth()+1).padStart(2,'0')}.${String(activeDate.getDate()).padStart(2,'0')}`;

  useEffect(() => {
    fetchAttendance(storeId, dateStr).then(data => {
      setEmployees(sortEmployees(data));
      setShowAll(false);
    });
  }, [storeId, dateStr]);

  const getWeekDates = (date: Date) => {
    const d = new Date(date);
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - d.getDay());
    return Array.from({ length: 7 }, (_, i) => { const dd = new Date(sunday); dd.setDate(sunday.getDate() + i); return dd; });
  };
  const weekDates = getWeekDates(currentDate);

  const handleDateClick = (d: Date) => {
    if (isFuture(d)) return;
    if (isToday(d)) { setSelectedDate(null); return; }
    setSelectedDate(prev => prev && isSameDay(prev, d) ? null : d);
  };

  const displayed = showAll ? employees : employees.slice(0, 8);

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '20px' }}>
        <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate()-7); return n; })} className="pressable p-1">
          <ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} />
        </button>
        <button onClick={() => { setPickerYear(year); setMonthPickerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{year}년 {month+1}월</span>
          <ChevronDown style={{ width: '16px', height: '16px', color: '#9EA3AD' }} />
        </button>
        <button onClick={() => setCurrentDate(d => { const n = new Date(d); n.setDate(n.getDate()+7); return n; })} className="pressable p-1">
          <ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} />
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '20px' }}>
        {weekDates.map((d, i) => {
          const isT = isToday(d);
          const sel = selectedDate ? isSameDay(d, selectedDate) && !isT : false;
          const isSun = i === 0; const isSat = i === 6;
          const dayColor  = isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#9EA3AD';
          const dateColor = isT ? '#FFFFFF' : sel ? '#4261FF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
          const future    = isFuture(d);
          return (
            <button key={i} onClick={() => handleDateClick(d)} disabled={future}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'none', border: 'none', cursor: future ? 'default' : 'pointer', opacity: future ? 0.35 : 1 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '44px', height: '64px', borderRadius: '14px', gap: '2px', backgroundColor: isT ? '#4261FF' : sel ? 'rgba(66,97,255,0.1)' : 'transparent' }}>
                <span style={{ fontSize: '12px', fontWeight: 500, color: isT ? '#FFFFFF' : sel ? '#4261FF' : dayColor }}>{WEEK_DAYS[i]}</span>
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

      {employees.length === 0 ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 0' }}>
          <p style={{ fontSize: '14px', color: '#9EA3AD' }}>해당 날짜에 스케줄이 없습니다</p>
        </div>
      ) : (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '0 16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
          {displayed.map((emp, i) => (
            <div key={emp.id + i}>
              <EmployeeRow emp={emp} onClick={() => onSelectEmployee(emp)} hideReturnTag />
              {i < displayed.length - 1 && <div style={{ height: '1px', backgroundColor: '#F0F0F0' }} />}
            </div>
          ))}
        </div>
      )}
      {!showAll && employees.length > 8 && (
        <button onClick={() => setShowAll(true)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', width: '100%', padding: '12px 0', fontSize: '13px', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer' }}>
          더보기 <ChevronDown style={{ width: '16px', height: '16px' }} />
        </button>
      )}

      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
          <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => setPickerYear(p => p-1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => setPickerYear(p => p+1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const isSel = pickerYear === year && i === month;
                return (
                  <button key={i} onClick={() => { setCurrentDate(new Date(pickerYear, i, 1)); setMonthPickerOpen(false); }}
                    className="pressable py-2.5 rounded-xl text-[14px] font-medium"
                    style={{ backgroundColor: isSel ? '#4261FF' : '#F7F7F8', color: isSel ? '#FFFFFF' : '#19191B' }}>
                    {i+1}월
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

// ── RequestTab ────────────────────────────────────────────────────────────────

const REQUEST_FILTERS = ["전체", "출·퇴근", "근무요일", "휴게"];

function RequestTab({ storeId, onCountChange }: { storeId: string; onCountChange: (n: number) => void }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("전체");
  const [requests, setRequests] = useState<ApiRequest[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{ type: "approve" | "reject"; req: ApiRequest } | null>(null);

  const load = useCallback(async () => {
    const [wlRes, scRes] = await Promise.allSettled([
      fetch(`/api/owner/store/${storeId}/worklog-requests`, { credentials: "include" }),
      fetch(`/api/owner/store/${storeId}/schedule-requests`, { credentials: "include" }),
    ]);
    const combined: ApiRequest[] = [];
    if (wlRes.status === "fulfilled" && wlRes.value.ok) {
      const d = await wlRes.value.json();
      d.forEach((r: any) => combined.push(mapRequest(r, "worklog")));
    }
    if (scRes.status === "fulfilled" && scRes.value.ok) {
      const d = await scRes.value.json();
      d.forEach((r: any) => combined.push(mapRequest(r, "schedule")));
    }
    combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setRequests(combined);
    onCountChange(combined.length);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const filterMap: Record<string, string> = { "출·퇴근": "출·퇴근 시간 변경", "근무요일": "근무 요일 변경", "휴게": "휴게 시간 변경" };
  const filtered = filter === "전체" ? requests : requests.filter(r => r.uiType === filterMap[filter]);

  const confirmAction = async () => {
    if (!confirmDialog) return;
    const { type, req } = confirmDialog;
    const status = type === "approve" ? "approved" : "rejected";
    const endpoint = req.source === "worklog"
      ? `/api/owner/store/${storeId}/worklog-requests/${req.id}`
      : `/api/owner/store/${storeId}/schedule-requests/${req.id}`;
    try {
      await fetch(endpoint, { method: "PUT", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    } catch {}
    setRequests(prev => prev.filter(r => !(r.id === req.id && r.source === req.source)));
    onCountChange(requests.length - 1);
    toast({
      description: type === "approve" ? "근태 건의 요청이 수락 되었어요." : "근태 건의 요청이 거절 되었어요.",
      duration: 2000,
      variant: type === "approve" ? "default" : "destructive",
    });
    setConfirmDialog(null);
  };

  return (
    <div style={{ padding: '16px 20px', backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', overflowX: 'auto' }}>
        {REQUEST_FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ height: '28px', padding: '0 14px', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', whiteSpace: 'nowrap', flexShrink: 0, cursor: 'pointer', border: `1px solid ${filter === f ? '#4261FF' : '#DBDCDF'}`, backgroundColor: filter === f ? '#E8F3FF' : '#FFFFFF', color: filter === f ? '#4261FF' : '#AAB4BF' }}>
            {f === "전체" ? `전체 ${requests.length}` : f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
            <p style={{ fontSize: '14px', color: '#9EA3AD' }}>근태 건의 요청이 없습니다</p>
          </div>
        ) : filtered.map(req => (
          <div key={`${req.source}-${req.id}`} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden' }}>
            <div style={{ padding: '16px 16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '20px', borderRadius: '6px', padding: '0 10px', backgroundColor: '#EEF1FF', fontSize: '13px', fontWeight: 600, color: '#4261FF' }}>{req.uiType}</span>
                <span style={{ fontSize: '12px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em' }}>{timeAgo(req.createdAt)}</span>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '2px' }}>요청 직원</p>
                <p style={{ fontSize: '16px', fontWeight: 500, color: '#19191B' }}>{req.employeeName}</p>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '8px' }}>변경 요청 사항</p>
                <div style={{ backgroundColor: '#F7F7F8', borderRadius: '12px', padding: '10px 12px', marginBottom: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#9EA3AD', marginBottom: '4px' }}>기존 일정</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>
                    {req.originDate ? fmtDate(req.originDate) : "미근무 일정"}
                    {req.originStart && req.originEnd ? ` | ${req.originStart} - ${req.originEnd}` : ""}
                  </p>
                </div>
                <div style={{ backgroundColor: '#F0F7FF', borderRadius: '12px', padding: '10px 12px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#4261FF', marginBottom: '4px' }}>변경 일정</p>
                  <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>
                    {fmtDate(req.desiredDate)}
                    {req.desiredStart && req.desiredEnd ? ` | ${req.desiredStart} - ${req.desiredEnd}` : ""}
                  </p>
                  {req.desiredBreakMinutes != null && (
                    <p style={{ fontSize: '13px', color: '#70737B', marginTop: '2px' }}>[휴게] {req.desiredBreakMinutes}분</p>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: '14px' }}>
                <p style={{ fontSize: '14px', color: '#70737B', marginBottom: '2px' }}>요청 사유</p>
                <p style={{ fontSize: '15px', fontWeight: 500, color: '#19191B' }}>{req.reason}</p>
              </div>
            </div>
            <div style={{ height: '1px', backgroundColor: '#F0F0F0', margin: '0 16px' }} />
            <div style={{ display: 'flex', gap: '8px', padding: '12px 16px' }}>
              <button onClick={() => setConfirmDialog({ type: "reject", req })}
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: 'none', backgroundColor: '#DEEBFF', color: '#4261FF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}>거절하기</button>
              <button onClick={() => setConfirmDialog({ type: "approve", req })}
                style={{ flex: 1, height: '48px', borderRadius: '10px', border: 'none', backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', cursor: 'pointer' }}>승인하기</button>
            </div>
          </div>
        ))}
      </div>

      {!!confirmDialog && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={() => setConfirmDialog(null)}>
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
              <button onClick={() => setConfirmDialog(null)} style={{ flex: 1, height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={confirmAction} style={{ flex: 1, height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>확인</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function AttendanceManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "오늘의 근태";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [todayEmployees, setTodayEmployees] = useState<AttendanceEmployee[]>([]);
  const [requestCount, setRequestCount] = useState(0);

  const storeId = localStorage.getItem("currentStoreId") ?? "";
  const tabs = ["오늘의 근태", "주간 근태", "근태 건의 요청"];

  useEffect(() => {
    if (storeId) fetchAttendance(storeId).then(setTodayEmployees);
  }, [storeId]);

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
              const isReq = tab === "근태 건의 요청";
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative whitespace-nowrap"
                  style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
                  {isReq && requestCount > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mr-1 mb-2" />}
                  {isReq ? `근태 변경 요청 ${requestCount}건` : tab}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          {activeTab === "오늘의 근태"    && <TodayTab    employees={todayEmployees} onSelectEmployee={handleSelectEmployee} />}
          {activeTab === "주간 근태"      && <CalendarTab storeId={storeId}          onSelectEmployee={handleSelectEmployee} />}
          {activeTab === "근태 건의 요청" && <RequestTab  storeId={storeId}          onCountChange={setRequestCount} />}
        </div>
      </div>
    </div>
  );
}
