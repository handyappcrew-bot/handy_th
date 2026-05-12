import React, { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "@/components/home/employee/BottomNav";
import MonthlySummary from "@/components/attendance/MonthlySummary";
import AttendanceDetailSheet from "@/components/attendance/AttendanceDetailSheet";
import type { AttendanceDetail, AttendanceStatus } from "@/components/attendance/AttendanceDetailSheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { fetchWorkLogRequests } from "@/api/employee";

type AttendanceTab = "calendar" | "history" | "edit_requests";
type DayStatus = "normal" | "late" | "absent" | "overtime" | "vacation" | "holiday" | "before_work";
type RequestStatus = "대기중" | "승인" | "거절";
type RequestType = "출·퇴근 시간 변경" | "휴게 시간 변경" | "근무 누락";

interface DayData {
  date: number;
  hours?: string;
  extraMinutes?: number;
  lateMinutes?: number;
  status?: DayStatus;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  overtimeMinutes?: number;
  isClosed?: boolean;
  sheetStatus?: AttendanceStatus;
  shiftTypes?: ("오픈" | "미들" | "마감")[];
}

interface HistoryItem {
  date: string;
  dayOfWeek: string;
  badges: { label: string; bg: string; color: string }[];
  startTime: string;
  endTime: string;
  startHighlight?: boolean;
  endHighlight?: boolean;
  sheetStatus?: AttendanceStatus;
  isClosed?: boolean;
  breakMinutes?: number;
  overtimeMinutes?: number;
  calendarDate: number;
  isHoliday?: boolean;
}

interface EditRequest {
  id: string;
  requestStatus: RequestStatus;
  requestType: RequestType;
  requestedAt: number;
  original: {
    label?: string;
    date: string;
    startTime?: string;
    endTime?: string;
    breakMinutes?: number;
  };
  desired: {
    date: string;
    startTime: string;
    endTime: string;
    breakMinutes?: number;
  };
  reason: string;
}

const DAYS_OF_WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

type FilterTab = "전체" | "출·퇴근" | "휴게" | "근무 누락";
const FILTER_TABS: FilterTab[] = ["전체", "출·퇴근", "휴게", "근무 누락"];

const REQUEST_STATUS_STYLE: Record<RequestStatus, { bg: string; color: string }> = {
  "대기중": { bg: '#FDF9DF', color: '#FFB300' },
  "승인": { bg: '#ECFFF1', color: '#1EDC83' },
  "거절": { bg: '#FFEAE6', color: '#FF3D3D' },
};
const REQUEST_TYPE_STYLE = { bg: '#E8F3FF', color: '#4261FF' };

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

const buildCalendarFromLogs = (logs: any[]): Record<number, DayData> => {
  const result: Record<number, DayData> = {};

  logs.forEach((log) => {
    const date = new Date(log.work_date).getDate();
    const startTime = log.start_time?.slice(0, 5) ?? "00:00";
    const endTime = log.end_time?.slice(0, 5) ?? "00:00";
    const schedStart = log.sched_start?.slice(0, 5) ?? null;
    const schedEnd = log.sched_end?.slice(0, 5) ?? null;

    // 실근무 시간 계산
    let workedMin = 0;
    if (log.start_time && log.end_time) {
      workedMin = toMin(endTime) - toMin(startTime);
      if (log.break_start_time && log.break_end_time) {
        workedMin -= toMin(log.break_end_time.slice(0, 5)) - toMin(log.break_start_time.slice(0, 5));
      }
    }

    const hours = workedMin > 0
      ? `${Math.floor(workedMin / 60)}h${workedMin % 60 > 0 ? ` ${workedMin % 60}m` : ""}`
      : undefined;

    // 지각: 실제 출근 > 스케줄 출근
    const lateMin = (log.start_time && schedStart)
      ? Math.max(0, toMin(startTime) - toMin(schedStart))
      : 0;

    // 연장: 실제 퇴근 > 스케줄 퇴근
    const overtimeMin = (schedEnd && log.end_time)
      ? Math.max(0, toMin(endTime) - toMin(schedEnd))
      : 0;

    let status: DayStatus = "normal";
    if (log.status === "absent") status = "absent";
    else if (lateMin > 0) status = "late";        // 지각이면 무조건 late (연장 있어도)
    else if (overtimeMin > 0) status = "overtime";

    let sheetStatus: AttendanceStatus = "근무완료";
    if (log.status === "absent") sheetStatus = "결근";
    else if (log.status === "working") sheetStatus = "퇴근";

    const breakMinutes = (log.break_start_time && log.break_end_time)
      ? toMin(log.break_end_time.slice(0, 5)) - toMin(log.break_start_time.slice(0, 5))
      : 0;

    result[date] = {
      date,
      hours,
      status,
      lateMinutes: lateMin > 0 ? lateMin : undefined,
      extraMinutes: overtimeMin > 0 ? overtimeMin : undefined,
      startTime,
      endTime,
      breakMinutes,
      overtimeMinutes: overtimeMin,
      isClosed: log.status === "off_work",
      sheetStatus,
    };
  });

  return result;
};

const buildHistory = (
  year: number,
  month: number,
  calendar: Record<number, DayData>,
  holidayDays: number[],
  isFutureDay: (day: number) => boolean
): HistoryItem[] => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const items: HistoryItem[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    if (isFutureDay(day)) continue;
    const dayOfWeek = DAY_NAMES[new Date(year, month - 1, day).getDay()];
    const isHoliday = holidayDays.includes(day);
    const d = calendar[day];
    if (isHoliday) {
      items.push({ date: `${month}월 ${day}일`, dayOfWeek, calendarDate: day, isHoliday: true, badges: [{ label: "휴무", bg: '#F7F7F8', color: '#AAB4BF' }], startTime: "00:00", endTime: "00:00", sheetStatus: "휴무", isClosed: false, breakMinutes: 0, overtimeMinutes: 0 });
    } else if (d) {
      const isLate = d.status === "late";
      const isOvertime = (d.extraMinutes ?? 0) > 0;
      const isAbsent = d.status === "absent";
      const isVacation = d.status === "vacation";
      const isBeforeWork = d.sheetStatus === "근무전";
      const badges: { label: string; bg: string; color: string }[] = [];
      if (isAbsent) badges.push({ label: "결근", bg: '#FFEAE6', color: '#FF3D3D' });
      if (isVacation) badges.push({ label: "휴가", bg: '#F7F7F8', color: '#AAB4BF' });
      if (isBeforeWork) badges.push({ label: "근무전", bg: '#F7F7F8', color: '#AAB4BF' });
      if (isLate) badges.push({ label: "지각", bg: '#FFEEE2', color: '#FF862D' });
      if (isOvertime) badges.push({ label: "연장", bg: '#E8F3FF', color: '#7488FE' });
      if (!isAbsent && !isVacation && !isBeforeWork && !isLate && !isOvertime) badges.push({ label: "근무완료", bg: '#ECFFF1', color: '#1EDC83' });
      if ((isLate || isOvertime) && !isAbsent && !isVacation && !isBeforeWork) badges.push({ label: "근무완료", bg: '#ECFFF1', color: '#1EDC83' });
      items.push({ date: `${month}월 ${day}일`, dayOfWeek, calendarDate: day, badges, startTime: d.startTime ?? "00:00", endTime: d.endTime ?? "00:00", startHighlight: isLate, endHighlight: isOvertime, sheetStatus: d.sheetStatus, isClosed: d.isClosed, breakMinutes: d.breakMinutes ?? 0, overtimeMinutes: d.overtimeMinutes ?? 0 });
    }
  }
  return items.sort((a, b) => b.calendarDate - a.calendarDate);
};

const tagStyle = (bg: string, color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '17px', borderRadius: '4px', fontSize: '11px', fontWeight: 500, backgroundColor: bg, color });
const badgeStyle = (bg: string, color: string): React.CSSProperties => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '20px', borderRadius: '4px', padding: '0 8px', fontSize: '11px', fontWeight: 500, backgroundColor: bg, color });

const AttendanceManagement = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AttendanceTab>("calendar");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetDetail, setSheetDetail] = useState<AttendanceDetail | null>(null);
  const [filterTab, setFilterTab] = useState<FilterTab>("전체");
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<Record<number, DayData>>({});
  const [holidayDays, setHolidayDays] = useState<number[]>([]);

  // 수정 요청 완료 후 탭 이동 처리
  React.useEffect(() => {
    if (location.state?.newRequest) {
      setActiveTab("edit_requests");
      window.history.replaceState({}, "");
    }
  }, []);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/employee/work/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ employee_id: 1, store_id: 1, year: currentYear, month: currentMonth }),
        });
        const data = await res.json();
        if (res.ok) {
          setCalendarData(buildCalendarFromLogs(data));
          setHolidayDays(
            data
              .filter((log: any) => log.is_holiday)
              .map((log: any) => new Date(log.work_date).getDate())
          );
        }
      } catch (err) { }
    };
    fetchLogs();
  }, [currentYear, currentMonth]);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const data = await fetchWorkLogRequests(1);
        const mapped: EditRequest[] = data.map((r: any) => ({
          id: String(r.id),
          requestStatus: r.status === "pending" ? "대기중" : r.status === "approved" ? "승인" : "거절",
          requestType: r.type as RequestType,
          requestedAt: new Date(r.created_at).getTime(),
          original: {
            date: r.date,
            startTime: r.origin_start ?? undefined,
            endTime: r.origin_end ?? undefined,
            breakMinutes: undefined,
          },
          desired: {
            date: r.date,
            startTime: r.desired_start ?? "00:00",
            endTime: r.desired_end ?? "00:00",
            breakMinutes: r.desired_break ?? undefined,
          },
          reason: r.reason,
        }));
        setEditRequests(mapped);
      } catch (e) {
        console.error(e);
      }
    };
    fetchRequests();
  }, []);

  const today = new Date();
  const todayDate = today.getDate();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() + 1 === currentMonth;

  const isFutureDay = (day: number) => {
    const d = new Date(currentYear, currentMonth - 1, day);
    const t = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return d > t;
  };

  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay();
  const prevMonthDays = new Date(currentYear, currentMonth - 1, 0).getDate();

  const goToPrevMonth = () => {
    if (currentMonth === 1) { setCurrentYear(currentYear - 1); setCurrentMonth(12); }
    else setCurrentMonth(currentMonth - 1);
  };
  const goToNextMonth = () => {
    if (currentMonth === 12) { setCurrentYear(currentYear + 1); setCurrentMonth(1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const calendarWeeks: (number | null)[][] = [];
  let week: (number | null)[] = [];
  for (let i = 0; i < firstDayOfWeek; i++) week.push(-(prevMonthDays - firstDayOfWeek + 1 + i));
  for (let d = 1; d <= daysInMonth; d++) {
    week.push(d);
    if (week.length === 7) { calendarWeeks.push(week); week = []; }
  }
  if (week.length > 0) {
    let nextDate = 1;
    while (week.length < 7) { week.push(nextDate++); }
    calendarWeeks.push(week);
  }

  const historyItems = buildHistory(currentYear, currentMonth, calendarData, holidayDays, isFutureDay);

  const normalCount = historyItems.filter(i => i.badges.some(b => b.label === "근무완료") && !i.badges.some(b => b.label === "지각" || b.label === "연장")).length;
  const lateCount = historyItems.filter(i => i.badges.some(b => b.label === "지각")).length;
  const overtimeCount = historyItems.filter(i => i.badges.some(b => b.label === "연장")).length;
  const absentCount = historyItems.filter(i => i.badges.some(b => b.label === "결근")).length;

  const openSheetByDay = (day: number) => {
    const isHoliday = holidayDays.includes(day);
    const isFuture = isFutureDay(day);
    const dayData = calendarData[day];
    const dayOfWeek = DAY_NAMES[new Date(currentYear, currentMonth - 1, day).getDay()];

    if (isHoliday) {
      setSheetDetail({ year: currentYear, month: currentMonth, date: day, dayOfWeek, status: "휴무", isClosed: false, startTime: "00:00", endTime: "00:00", breakMinutes: 0, overtimeMinutes: 0, shiftTypes: [] });
    } else if (isFuture) {
      setSheetDetail({ year: currentYear, month: currentMonth, date: day, dayOfWeek, status: "근무전", isClosed: false, startTime: "00:00", endTime: "00:00", breakMinutes: 0, overtimeMinutes: 0, shiftTypes: dayData?.shiftTypes ?? [] });
    } else if (dayData) {
      const resolvedStatus = (!isFutureDay(day) && dayData.sheetStatus === "근무전") ? "근무완료" : (dayData.sheetStatus || "근무완료");
      setSheetDetail({
        year: currentYear, month: currentMonth, date: day, dayOfWeek,
        status: resolvedStatus,
        isClosed: dayData.isClosed ?? true,
        startTime: dayData.startTime || "00:00",
        endTime: dayData.endTime || "00:00",
        breakMinutes: dayData.breakMinutes || 0,
        overtimeMinutes: dayData.overtimeMinutes || 0,
        isLate: dayData.status === "late",
        lateMinutes: dayData.lateMinutes || 0,
        shiftTypes: dayData.status === "vacation" ? [] : (dayData.shiftTypes ?? []),
      });
    } else {
      setSheetDetail({ year: currentYear, month: currentMonth, date: day, dayOfWeek, status: "미등록", isClosed: false, startTime: "00:00", endTime: "00:00", breakMinutes: 0, overtimeMinutes: 0, shiftTypes: [] });
    }
    setSheetOpen(true);
  };

  const totalCount = editRequests.length;
  const filteredRequests = editRequests
    .filter(r => {
      if (filterTab === "전체") return true;
      if (filterTab === "출·퇴근") return r.requestType === "출·퇴근 시간 변경";
      if (filterTab === "휴게") return r.requestType === "휴게 시간 변경";
      if (filterTab === "근무 누락") return r.requestType === "근무 누락";
      return true;
    })
    .sort((a, b) => {
      if (a.requestStatus === "대기중" && b.requestStatus !== "대기중") return -1;
      if (a.requestStatus !== "대기중" && b.requestStatus === "대기중") return 1;
      return b.requestedAt - a.requestedAt;
    });

  const handleDeleteConfirm = () => {
    if (deleteTargetId) {
      setEditRequests(prev => prev.filter(r => r.id !== deleteTargetId));
      setDeleteTargetId(null);
      toast({ description: "수정 요청 내역이 삭제됐어요.", duration: 2000 });
    }
  };

  const TAB_LABELS: Record<AttendanceTab, string> = { calendar: "캘린더", history: "출근내역", edit_requests: "수정 요청 내역" };

  console.log(calendarData[7]);

  return (
    <div className="mx-auto max-w-lg min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-2 px-2 pt-4 pb-2">
          <button onClick={() => navigate("/employee/home")} className="pressable p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>출근 관리</h1>
        </div>
        <div className="flex border-b border-border px-5" style={{ gap: '24px' }}>
          {(["calendar", "history", "edit_requests"] as AttendanceTab[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative whitespace-nowrap"
              style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
              {TAB_LABELS[tab]}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 탭 */}
      {activeTab === "calendar" && (
        <div className="pb-24">
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={goToPrevMonth} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
            <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{currentYear}년 {currentMonth}월 ▾</span>
            <button onClick={goToNextMonth} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
          </div>
          <div className="grid grid-cols-7 px-3">
            {DAYS_OF_WEEK.map((d, i) => (
              <div key={d} className={`text-center pb-3 ${i === 0 ? "text-[#FF5959]" : i === 6 ? "text-[#5DB1FF]" : "text-[#70737B]"}`} style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em' }}>{d}</div>
            ))}
          </div>
          <div className="px-3">
            {calendarWeeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 mb-1">
                {week.map((day, di) => {
                  if (day === null || day < 0) {
                    return (
                      <div key={di} className="flex flex-col items-center py-1.5 min-h-[90px]">
                        <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF' }}>{day !== null ? Math.abs(day) : ""}</span>
                        </div>
                      </div>
                    );
                  }
                  const isNextMonth = wi === calendarWeeks.length - 1 && day <= 7 && (week[0] as number) > 7;
                  if (isNextMonth) {
                    return (
                      <div key={di} className="flex flex-col items-center py-1.5 min-h-[90px]">
                        <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF' }}>{day}</span>
                        </div>
                      </div>
                    );
                  }
                  const dayData = calendarData[day];
                  const isToday = isCurrentMonth && day === todayDate;
                  const isSunday = di === 0;
                  const isSaturday = di === 6;
                  const isHoliday = holidayDays.includes(day);
                  const isFuture = isFutureDay(day);
                  return (
                    <div key={di} className="pressable flex flex-col items-center py-1.5 min-h-[90px] cursor-pointer" onClick={() => openSheetByDay(day)}>
                      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        <span style={{
                          fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em',
                          color: isToday ? '#FFFFFF' : isHoliday ? '#DBDCDF' : isSunday ? '#FF5959' : isSaturday ? '#5DB1FF' : '#70737B',
                          textDecoration: isHoliday ? 'line-through' : 'none',
                          ...(isToday ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {})
                        }}>{day}</span>
                      </div>
                      <div className="flex flex-col items-center w-full px-0.5" style={{ gap: '2px', marginTop: '4px' }}>
                        {!isHoliday && isFuture && dayData?.hours && <span style={tagStyle('#F7F7F8', '#AAB4BF')}>{dayData.hours}</span>}
                        {!isHoliday && !isFuture && (
                          <>
                            {dayData?.status === "absent" && <span style={tagStyle('#FFEAE6', '#FF3D3D')}>결근</span>}
                            {dayData?.status === "vacation" && <span style={tagStyle('#F7F7F8', '#AAB4BF')}>휴가</span>}
                            {dayData?.hours && <span style={tagStyle(dayData.status === "late" ? '#FFEEE2' : '#ECFFF1', dayData.status === "late" ? '#FF862D' : '#1EDC83')}>{dayData.hours}</span>}
                            {dayData?.status === "late" && dayData?.lateMinutes && <span style={tagStyle('#F7F7F8', '#AAB4BF')}>-{dayData.lateMinutes}m</span>}
                            {dayData?.extraMinutes !== undefined && dayData.extraMinutes > 0 && <span style={tagStyle('#E8F3FF', '#7488FE')}>+{dayData.extraMinutes}m</span>}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="w-full h-[12px] bg-[#F7F7F8]" />
          <MonthlySummary month={currentMonth} normalCount={normalCount} lateCount={lateCount} overtimeCount={overtimeCount} absentCount={absentCount} />
        </div>
      )}

      {/* 출근내역 탭 */}
      {activeTab === "history" && (
        <div className="pb-8">
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-2">
              <button onClick={goToPrevMonth} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{currentYear}년 {currentMonth}월 ▾</span>
              <button onClick={goToNextMonth} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
            </div>
          </div>
          <div className="divide-y divide-border">
            {historyItems.map((item, idx) => (
              <div key={idx} className="pressable flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => openSheetByDay(item.calendarDate)}>
                <div className="flex-1">
                  <p className="text-[15px] font-semibold text-foreground">{item.date} ({item.dayOfWeek})</p>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {item.badges.map((badge, bi) => <span key={bi} style={badgeStyle(badge.bg, badge.color)}>{badge.label}</span>)}
                    {item.startTime && item.startTime !== "00:00" && (
                      <span className="text-sm text-muted-foreground">
                        <span style={{ color: item.startHighlight ? '#FF862D' : undefined }}>{item.startTime}</span>
                        {" - "}
                        <span style={{ color: item.endHighlight ? '#7488FE' : undefined }}>{item.endTime}</span>
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수정 요청 내역 탭 */}
      {activeTab === "edit_requests" && (
        <div className="pb-8" style={{ backgroundColor: '#F7F7F8' }}>
          <div className="flex px-5 py-3 overflow-x-auto" style={{ gap: '8px' }}>
            {FILTER_TABS.map((f) => {
              const isActive = filterTab === f;
              return (
                <button key={f} onClick={() => setFilterTab(f)}
                  style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: isActive ? '#E8F3FF' : '#FFFFFF', color: isActive ? '#4261FF' : '#AAB4BF', border: `1px solid ${isActive ? '#4261FF' : '#DBDCDF'}` }}>
                  {f === "전체" ? `전체 ${totalCount}` : f}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-4 px-5">
            {filteredRequests.map((req) => {
              const statusStyle = REQUEST_STATUS_STYLE[req.requestStatus];
              const canDelete = req.requestStatus === "승인" || req.requestStatus === "거절";
              return (
                <div key={req.id} className="rounded-2xl bg-white p-5" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span style={badgeStyle(statusStyle.bg, statusStyle.color)}>{req.requestStatus}</span>
                      <span style={badgeStyle(REQUEST_TYPE_STYLE.bg, REQUEST_TYPE_STYLE.color)}>{req.requestType}</span>
                    </div>
                    {canDelete && (
                      <button onClick={() => setDeleteTargetId(req.id)} className="pressable p-1">
                        <Trash2 className="h-[18px] w-[18px]" style={{ color: '#AAB4BF' }} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '6px' }}>기존 일정</p>
                  <div className="rounded-2xl px-5 py-4 mb-3" style={{ backgroundColor: '#F5F6F8' }}>
                    <div className="flex items-center gap-2 flex-wrap">
                      {req.original.label && <span style={badgeStyle('#F7F7F8', '#AAB4BF')}>{req.original.label}</span>}
                      <p style={{ fontSize: '13px', color: '#70737B', letterSpacing: '-0.02em' }}>
                        {req.original.date}{req.original.startTime && ` | ${req.original.startTime} - ${req.original.endTime}`}
                      </p>
                    </div>
                    {req.original.breakMinutes !== undefined && <p style={{ fontSize: '13px', color: '#70737B', letterSpacing: '-0.02em' }}>[휴게] {req.original.breakMinutes}분</p>}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '6px' }}>변경 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: '#F0F7FF' }}>
                    <p style={{ fontSize: '13px', color: '#4261FF', letterSpacing: '-0.02em' }}>{req.desired.date} | {req.desired.startTime} - {req.desired.endTime}</p>
                    {req.desired.breakMinutes !== undefined && <p style={{ fontSize: '13px', color: '#4261FF', letterSpacing: '-0.02em' }}>[휴게] {req.desired.breakMinutes}분</p>}
                  </div>
                  <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '4px' }}>변경 요청 사유</p>
                  <p style={{ fontSize: '13px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>{req.reason}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }} title="수정 요청 내역 삭제"
        description={<>수정 요청 내역을 삭제 하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setDeleteTargetId(null), variant: "cancel" }, { label: "삭제하기", onClick: handleDeleteConfirm }]} />

      <AttendanceDetailSheet
        open={sheetOpen}
        detail={sheetDetail}
        onClose={() => setSheetOpen(false)}
        onRequestEdit={(detail) => { setSheetOpen(false); navigate("/attendance/record-edit", { state: { detail } }); }}
      />
      {/* {!sheetOpen && <BottomNav activeTab="attendance" onTabChange={() => { }} />} */}
    </div>
  );
};

export default AttendanceManagement;
