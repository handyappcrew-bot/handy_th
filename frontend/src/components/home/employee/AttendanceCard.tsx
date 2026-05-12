import { useState, useEffect, useCallback } from "react";
import { Clock } from "lucide-react";

export type AttendanceStatus =
  | "holiday"       // 휴일
  | "before_work"   // 근무전
  | "late"          // 지각
  | "absent"        // 결근
  | "working"       // 근무중
  | "on_break"      // 휴게중
  | "break_done"    // 휴게완료 (근무중)
  | "overtime"      // 초과근무 (퇴근)
  | "off_work"      // 퇴근완료
  ;

interface AttendanceCardProps {
  status: AttendanceStatus;
  scheduleStart: string; // "08:00"
  scheduleEnd: string;   // "13:00"
  clockInTime?: string;  // "07:51"
  breakStartTime?: string;
  breakEndTime?: string;
  wasLate?: boolean;      // 지각 후 출근했는지
  wasAbsent?: boolean;    // 결근 후 출근했는지
  onClockIn: () => void;
  onClockOut: () => void;
  onBreakStart: () => void;
  onBreakEnd: () => void;
  onSubstituteClockIn: () => void;
}

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString("ko-KR", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
};

const parseTime = (timeStr: string): { hours: number; minutes: number } => {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
};

const getMinutesBetween = (start: string, end: string): number => {
  const s = parseTime(start);
  const e = parseTime(end);
  return (e.hours * 60 + e.minutes) - (s.hours * 60 + s.minutes);
};

const formatDuration = (minutes: number): string => {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  return `${h}h ${String(m).padStart(2, "0")}m`;
};

const formatDurationKo = (minutes: number): string => {
  const h = Math.floor(Math.abs(minutes) / 60);
  const m = Math.abs(minutes) % 60;
  if (h > 0 && m > 0) return `${h}시간 ${String(m).padStart(2, "0")}분`;
  if (h > 0) return `${h}시간 00분`;
  return `${m}분`;
};

const AttendanceCard = ({
  status,
  scheduleStart,
  scheduleEnd,
  clockInTime,
  breakStartTime,
  breakEndTime,
  wasLate,
  wasAbsent,
  onClockIn,
  onClockOut,
  onBreakStart,
  onBreakEnd,
  onSubstituteClockIn,
}: AttendanceCardProps) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const totalMinutes = (scheduleStart && scheduleEnd) ? getMinutesBetween(scheduleStart, scheduleEnd) : 0;

  // Calculate progress percentage (wall-clock based, always relative to scheduleStart-scheduleEnd)
  const totalSec = totalMinutes * 60;
  const schedStartSec = scheduleStart ? (() => { const s = parseTime(scheduleStart); return s.hours * 3600 + s.minutes * 60; })() : 0;
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  const getProgress = useCallback(() => {
    if (status === "holiday" || status === "before_work") return 0;
    if (status === "absent") return 100;
    if (status === "off_work") return 100;
    if (status === "overtime") return 100;
    // 결근 후 출근: 게이지 안 채움
    if (wasAbsent) return 0;

    // All progress is relative to scheduleStart → scheduleEnd
    const elapsed = nowSec - schedStartSec;
    return Math.min(100, Math.max(0, (elapsed / totalSec) * 100));
  }, [status, nowSec, schedStartSec, totalSec, wasAbsent]);

  // Late segment: from scheduleStart to clockInTime (orange portion)
  const getLateSegment = useCallback(() => {
    if (!wasLate || !clockInTime) return null;
    const clockIn = parseTime(clockInTime);
    const clockInSec = clockIn.hours * 3600 + clockIn.minutes * 60;
    const lateWidth = ((clockInSec - schedStartSec) / totalSec) * 100;
    return Math.max(0, Math.min(100, lateWidth));
  }, [wasLate, clockInTime, schedStartSec, totalSec]);

  // Break segment for progress bar (relative to scheduleStart → scheduleEnd)
  const getBreakSegment = useCallback(() => {
    if (!breakStartTime || !clockInTime || !scheduleEnd) return null;

    const endSec = (() => { const e = parseTime(scheduleEnd); return e.hours * 3600 + e.minutes * 60; })();
    const barTotalSec = endSec - schedStartSec;
    const breakStart = parseTime(breakStartTime);
    const breakStartOffset = ((breakStart.hours * 3600 + breakStart.minutes * 60) - schedStartSec) / barTotalSec * 100;

    let breakEndOffset: number;
    if (breakEndTime) {
      const breakEnd = parseTime(breakEndTime);
      breakEndOffset = ((breakEnd.hours * 3600 + breakEnd.minutes * 60) - schedStartSec) / barTotalSec * 100;
    } else {
      breakEndOffset = (nowSec - schedStartSec) / barTotalSec * 100;
    }

    return {
      left: Math.max(0, breakStartOffset),
      width: Math.max(0, breakEndOffset - breakStartOffset),
    };
  }, [breakStartTime, breakEndTime, clockInTime, scheduleEnd, nowSec, schedStartSec]);

  // Status badge
  const getBadge = () => {
    const style = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '9999px', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.01em', padding: '0 10px', border: '0px solid transparent', outline: 'none', boxSizing: 'border-box' as const, lineHeight: 1, flexShrink: 0, height: '28px' };
    switch (status) {
      case "holiday":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-gray))', color: 'hsl(var(--status-gray-text))' }}>휴일</span>;
      case "before_work":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-gray))', color: 'hsl(var(--status-gray-text))' }}>근무전</span>;
      case "late":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-late-light))', color: 'hsl(var(--status-late))' }}>지각</span>;
      case "absent":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-absent-light))', color: 'hsl(var(--status-absent))' }}>결근</span>;
      case "working":
      case "break_done":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-green-light))', color: 'hsl(var(--status-green))' }}>근무중</span>;
      case "on_break":
        return <span style={{ ...style, backgroundColor: 'hsl(var(--status-purple-light))', color: 'hsl(var(--status-purple))' }}>휴게중</span>;
      case "overtime":
      case "off_work":
        return <span style={{ ...style, backgroundColor: 'rgba(66,95,255,0.1)', color: '#4261FF' }}>퇴근</span>;
    }
  };

  // Message text
  const getMessage = () => {
    switch (status) {
      case "holiday":
        return "등록된 근무 일정이 없어요 😂";
      case "before_work":
      case "late":
      case "absent":
        return "오늘은 근무 일정이 있는 날이에요 🙌";
      case "working":
      case "break_done": {
        if (!clockInTime) return "근무중이에요";
        const clockIn = parseTime(clockInTime);
        const elapsed = (now.getHours() * 60 + now.getMinutes()) - (clockIn.hours * 60 + clockIn.minutes);
        if (wasAbsent) {
          return `${formatDurationKo(Math.max(0, elapsed))} 근무 했어요`;
        }
        const remaining = totalMinutes - elapsed;
        if (remaining <= 0) return "퇴근 시간이 되었어요!";
        return `퇴근까지 ${formatDurationKo(remaining)} 남았어요`;
      }
      case "on_break": {
        if (!breakStartTime) return "휴게중이에요 ☕";
        const bs = parseTime(breakStartTime);
        const breakMins = (now.getHours() * 60 + now.getMinutes()) - (bs.hours * 60 + bs.minutes);
        return `${breakMins}분째 휴게중이에요 ☕`;
      }
      case "overtime": {
        if (!scheduleEnd) return "퇴근 시간이 초과 되었어요⏳";
        const schedEnd = parseTime(scheduleEnd);
        const overMins = (now.getHours() * 60 + now.getMinutes()) - (schedEnd.hours * 60 + schedEnd.minutes);
        return `퇴근 시간이 ${Math.max(0, overMins)}분 초과 되었어요⏳`;
      }
      case "off_work":
        return "오늘 근무도 수고하셨어요!";
    }
  };

  // Duration label
  const getDurationLabel = () => {
    if (status === "holiday" || status === "before_work" || status === "late" || status === "absent") {
      return formatDuration(totalMinutes);
    }
    if (status === "overtime") {
      if (!clockInTime) return formatDuration(0);
      const clockIn = parseTime(clockInTime);
      const elapsed = (now.getHours() * 60 + now.getMinutes()) - (clockIn.hours * 60 + clockIn.minutes);
      const overMins = elapsed - totalMinutes;
      return `+ ${formatDuration(Math.max(0, overMins))}`;
    }
    if (status === "off_work") {
      return formatDuration(0);
    }
    // Working/break states - show remaining of total scheduled time
    if (!clockInTime) return formatDuration(totalMinutes);
    const clockIn = parseTime(clockInTime);
    const elapsed = (now.getHours() * 60 + now.getMinutes()) - (clockIn.hours * 60 + clockIn.minutes);
    const remaining = totalMinutes - elapsed;
    return formatDuration(Math.max(0, remaining));
  };

  const progress = getProgress();
  const lateSegmentWidth = getLateSegment() ?? 0;
  const breakSeg = getBreakSegment();
  const breakStartPoint = breakSeg?.left ?? 0;
  const breakEndPoint = breakSeg ? breakSeg.left + breakSeg.width : 0;
  const completedBreakMinutes = breakStartTime && breakEndTime
    ? Math.max(0, getMinutesBetween(breakStartTime, breakEndTime))
    : 0;
  const progressFillColor =
    status === "absent"
      ? "hsl(var(--status-absent))"
      : status === "late"
        ? "hsl(var(--progress-late))"
        : status === "overtime" || status === "off_work"
          ? "hsl(var(--primary))"
          : "hsl(var(--progress-green))";

  // When wasLate: first segment is orange (late), rest is green work
  const greenStart = wasLate ? lateSegmentWidth : 0;
  const greenProgress = Math.max(0, progress - greenStart);

  // Work segments accounting for late + break
  const workBeforeBreakWidth = breakSeg
    ? Math.max(0, Math.min(greenProgress, breakStartPoint - greenStart))
    : Math.max(0, greenProgress);
  const breakWidth = breakSeg
    ? Math.max(0, Math.min(progress, breakEndPoint) - breakStartPoint)
    : 0;
  const workAfterBreakWidth = breakSeg
    ? Math.max(0, progress - breakEndPoint)
    : 0;

  // Time labels
  const leftTimeLabel = (status === "holiday" || status === "before_work" || status === "late" || status === "absent") ? scheduleStart : (clockInTime || scheduleStart);
  const leftTimeColor = (status === "holiday" || status === "before_work" || status === "late") ? "hsl(var(--muted-foreground))" : status === "absent" ? "hsl(var(--status-absent))" : (status === "overtime" || status === "off_work") ? "hsl(var(--primary))" : "hsl(var(--status-green))";
  const showEndTime = !wasAbsent;

  return (
    <div className="mx-5 rounded-2xl bg-card p-5" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
      {/* Badge */}
      <div className="mb-3">{getBadge()}</div>

      {/* Message */}
      <p className="mb-1 text-base font-semibold text-[#292B2E]">{getMessage()}</p>

      {/* Clock */}
      <p className="mb-4 text-[42px] font-bold leading-tight tracking-tight text-foreground">
        {formatTime(now)}
      </p>

      {/* Time bar labels */}
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span style={{ color: leftTimeColor }}>{leftTimeLabel}</span>
        <span style={{
          width: '64px',
          height: '20px',
          borderRadius: '16px',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '2px',
          fontSize: '12px',
          backgroundColor:
            status === "on_break" ? '#EEE5FF' :
              (status === "overtime" || status === "off_work") ? '#D3DAFF' :
                (status === "working" || status === "break_done") ? '#E5F9EC' :
                  status === "absent" ? '#DBDCDF' :
                    status === "late" ? '#DBDCDF' :
                      status === "holiday" ? '#DBDCDF' :
                        '#DBDCDF',
          color:
            status === "on_break" ? '#8A61FF' :
              (status === "overtime" || status === "off_work") ? '#4261FF' :
                (status === "working" || status === "break_done") ? '#10C97D' :
                  '#93989E',
        }}>
          <Clock style={{ width: '10px', height: '10px', flexShrink: 0 }} />
          {getDurationLabel()}
        </span>
        {showEndTime && <span style={{ color: (status === "overtime" || status === "off_work") ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>{scheduleEnd}</span>}
      </div>

      {/* Progress bar */}
      <div className="relative mb-5 h-2 w-full overflow-hidden rounded-full bg-muted">
        {/* Late segment (orange) */}
        {lateSegmentWidth > 0 && (
          <div
            className="absolute left-0 top-0 h-full transition-[width] duration-1000 ease-linear"
            style={{
              width: `${Math.min(progress, lateSegmentWidth)}%`,
              backgroundColor: "hsl(var(--progress-late))",
            }}
          />
        )}
        {/* Work before break (green) */}
        {workBeforeBreakWidth > 0 && (
          <div
            className="absolute top-0 h-full transition-[width] duration-1000 ease-linear"
            style={{
              left: `${greenStart}%`,
              width: `${workBeforeBreakWidth}%`,
              backgroundColor: status === "absent" ? "hsl(var(--status-absent))" : status === "late" ? "hsl(var(--progress-late))" : (status === "overtime" || status === "off_work") ? "hsl(var(--primary))" : "hsl(var(--progress-green))",
            }}
          />
        )}
        {/* Break segment (purple) */}
        {breakWidth > 0 && (
          <div
            className="absolute top-0 h-full transition-[left,width] duration-1000 ease-linear"
            style={{
              left: `${breakStartPoint}%`,
              width: `${breakWidth}%`,
              backgroundColor: "hsl(var(--progress-break))",
            }}
          />
        )}
        {/* Work after break (green) */}
        {workAfterBreakWidth > 0 && (
          <div
            className="absolute top-0 h-full transition-[left,width] duration-1000 ease-linear"
            style={{
              left: `${breakEndPoint}%`,
              width: `${workAfterBreakWidth}%`,
              backgroundColor: (status === "overtime" || status === "off_work") ? "hsl(var(--primary))" : "hsl(var(--progress-green))",
            }}
          />
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        {status === "holiday" && (
          <button
            onClick={onSubstituteClockIn}
            className="pressable h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            대타 근무 출근하기
          </button>
        )}
        {(status === "before_work" || status === "late" || status === "absent") && (
          <button
            onClick={onClockIn}
            className="pressable h-12 w-full rounded-xl bg-primary text-base font-semibold text-primary-foreground"
          >
            출근하기
          </button>
        )}
        {status === "working" && (
          <>
            <button
              onClick={onBreakStart}
              className="pressable h-12 flex-1 rounded-xl bg-primary text-base font-semibold text-primary-foreground"
            >
              휴게 시작하기
            </button>
            <button
              onClick={onClockOut}
              className="pressable h-12 flex-1 rounded-xl text-base font-semibold" style={{ backgroundColor: '#DEEBFF', color: '#4261FF' }}
            >
              퇴근하기
            </button>
          </>
        )}
        {status === "on_break" && (
          <>
            <button
              onClick={onBreakEnd}
              className="pressable h-12 flex-1 rounded-xl bg-primary text-base font-semibold text-primary-foreground"
            >
              휴게 종료하기
            </button>
            <button
              onClick={onClockOut}
              className="pressable h-12 flex-1 rounded-xl text-base font-semibold" style={{ backgroundColor: '#DEEBFF', color: '#4261FF' }}
            >
              퇴근하기
            </button>
          </>
        )}
        {status === "break_done" && (
          <>
            <button
              disabled
              className="h-12 flex-1 rounded-xl bg-muted text-base font-semibold text-muted-foreground"
            >
              {completedBreakMinutes}분 휴게 완료
            </button>
            <button
              onClick={onClockOut}
              className="pressable h-12 flex-1 rounded-xl text-base font-semibold" style={{ backgroundColor: '#DEEBFF', color: '#4261FF' }}
            >
              퇴근하기
            </button>
          </>
        )}
        {status === "overtime" && (
          <>
            {completedBreakMinutes > 0 && (
              <button
                disabled
                className="h-12 flex-1 rounded-xl bg-muted text-base font-semibold text-muted-foreground"
              >
                {completedBreakMinutes}분 휴게 완료
              </button>
            )}
            <button
              onClick={onClockOut}
              className={`pressable h-12 ${completedBreakMinutes > 0 ? 'flex-1' : 'w-full'} rounded-xl bg-primary text-base font-semibold text-primary-foreground`}
            >
              퇴근하기
            </button>
          </>
        )}
        {status === "off_work" && (
          <button
            disabled
            className="h-12 w-full rounded-xl text-base font-semibold" style={{ backgroundColor: '#DBDCDF', color: '#93989E' }}
          >
            근무완료
          </button>
        )}
      </div>
    </div>
  );
};

export default AttendanceCard;
