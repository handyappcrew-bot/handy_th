import { useRef } from "react";
import { ChevronRight } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";

interface Props {
  currentDate: Date;
  onSelectStaff: (day: Date) => void;
  onSelectDay?: (day: Date) => void;
}

const DAY_LABELS = ["월", "화", "수", "목", "금", "토", "일"];

interface StaffSchedule {
  name: string;
  shifts: string[];
  startHour: number;
  endHour: number;
}

const mockStaff: StaffSchedule[] = [
  { name: "문자영", shifts: ["오픈"], startHour: 9, endHour: 10 },
  { name: "정수민", shifts: ["오픈", "미들"], startHour: 9, endHour: 13 },
  { name: "김정민", shifts: ["오픈", "미들", "마감"], startHour: 9, endHour: 23 },
  { name: "키키치", shifts: ["미들"], startHour: 12, endHour: 16 },
  { name: "감자숭이", shifts: ["미들", "마감"], startHour: 13, endHour: 17 },
  { name: "쿠숭이", shifts: ["마감"], startHour: 8, endHour: 14 },
];

const HOURS = Array.from({ length: 17 }, (_, i) => i + 8);
const HOUR_WIDTH = 60;
const LEFT_COL = 140;
const HEADER_H = 36;
const ROW_H = 64;

function getShiftBg(shifts: string[]) {
  if (shifts.includes("마감") && !shifts.includes("오픈")) {
    return shifts.includes("미들") ? "bg-shift-middle-bg" : "bg-shift-close-bg";
  }
  if (shifts.includes("미들") && !shifts.includes("오픈")) return "bg-shift-middle-bg";
  return "bg-shift-open-bg";
}

function getBadgeClass(shifts: string[]) {
  if (shifts.includes("오픈")) return "bg-shift-open-bg text-shift-open";
  if (shifts.includes("미들")) return "bg-shift-middle-bg text-shift-middle";
  return "bg-shift-close-bg text-shift-close";
}

export default function ScheduleWeeklyView({ currentDate, onSelectStaff, onSelectDay }: Props) {
  const scrollRef = useDragScroll<HTMLDivElement>();
  const headerScrollRef = useRef<HTMLDivElement>(null);

  const dayOfWeek = currentDate.getDay();
  const monday = new Date(currentDate);
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  monday.setDate(currentDate.getDate() + diffToMonday);
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const isSelectedDay = (d: Date) =>
    d.getFullYear() === currentDate.getFullYear() &&
    d.getMonth() === currentDate.getMonth() &&
    d.getDate() === currentDate.getDate();

  const today = new Date();
  const isTodayDate = (d: Date) =>
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();

  const nowHour = today.getHours() + today.getMinutes() / 60;
  const nowLineLeft = (nowHour - 8) * HOUR_WIDTH;
  const showNowLine = nowHour >= 8 && nowHour < 8 + HOURS.length;

  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  const TIMELINE_W = HOURS.length * HOUR_WIDTH;

  return (
    <div>
      {/* 요일+날짜 선택 */}
      <div style={{ position: 'relative', paddingTop: 8, paddingBottom: 12 }}>
        <div style={{ display: 'flex', paddingLeft: 20, paddingRight: 20, gap: 'calc((100% - 40px - 350px) / 6)' }}>
          {weekDays.map((d, i) => {
            const selected = isSelectedDay(d);
            const isSat = i === 5;
            const isSun = i === 6;
            const isToday = isTodayDate(d);
            const dayLabelColor = selected ? '#FFFFFF' : isToday ? '#4261FF' : isSat ? '#5DB1FF' : isSun ? '#FF5959' : '#70737B';
            const dateColor = selected ? '#FFFFFF' : isToday ? '#4261FF' : isSat ? '#5DB1FF' : isSun ? '#FF5959' : '#292B2E';
            const bgColor = selected ? '#4261FF' : isToday ? '#EEF2FF' : 'transparent';
            return (
              <div
                key={i}
                onClick={() => onSelectDay?.(d)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              >
                <div style={{
                  width: 50, borderRadius: 10,
                  backgroundColor: bgColor,
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  paddingTop: 6, paddingBottom: 6,
                }}>
                  <span style={{ fontSize: 16, fontWeight: 500, color: dayLabelColor, letterSpacing: '-0.02em', marginBottom: 2 }}>
                    {DAY_LABELS[i]}
                  </span>
                  <span style={{ fontSize: 16, fontWeight: 500, color: dateColor, letterSpacing: '-0.02em' }}>
                    {d.getDate()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 시간 헤더 */}
      <div style={{ display: "flex" }}>
        <div style={{ flexShrink: 0, width: LEFT_COL, height: HEADER_H }} />
        <div ref={headerScrollRef} style={{ flex: 1, overflowX: "hidden", height: HEADER_H, position: "relative" }}>
          <div style={{ width: TIMELINE_W, height: HEADER_H, position: "relative" }}>
            {HOURS.map((h) => {
              const isCurrentHour = Math.floor(nowHour) === h;
              return (
                <div key={h} style={{
                  position: "absolute",
                  left: (h - 8) * HOUR_WIDTH,
                  top: 0, height: HEADER_H,
                  display: "flex", alignItems: "flex-end", paddingBottom: 6,
                  transform: h === 8 ? "translateX(0)" : "translateX(-50%)",
                  whiteSpace: "nowrap",
                  fontSize: 12, fontWeight: 500, letterSpacing: "-0.02em",
                  color: isCurrentHour ? "#93989E" : "#AAB4BF",
                }}>
                  {h.toString().padStart(2, "0")}:00
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 헤더 하단 구분선 */}
      <div style={{ height: "0.5px", backgroundColor: "#DBDCDF" }} />

      {/* 바디 */}
      <div style={{ display: "flex" }}>
        <div style={{ flexShrink: 0, width: LEFT_COL }}>
          {mockStaff.map((staff, i) => (
            <button key={i} onClick={() => onSelectStaff(currentDate)}
              style={{ height: ROW_H, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 16px", textAlign: "left", width: "100%", background: "none", border: "none", cursor: "pointer" }}>
              <div style={{ marginBottom: 2 }}>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${staff.shifts.includes("오픈") ? "bg-shift-open-bg text-shift-open" : staff.shifts.includes("미들") ? "bg-shift-middle-bg text-shift-middle" : "bg-shift-close-bg text-shift-close"}`}>
                  {staff.shifts.join(", ")}
                </span>
              </div>
              <span style={{ fontSize: 14, fontWeight: 500, color: "#19191B", display: "flex", alignItems: "center", gap: 2 }}>
                {staff.name} <ChevronRight style={{ width: 14, height: 14, color: "#9EA3AD" }} />
              </span>
            </button>
          ))}
        </div>

        <div ref={scrollRef} onScroll={handleBodyScroll} className="scrollbar-hide" style={{ flex: 1, overflowX: "auto" }}>
          <div style={{ width: TIMELINE_W, position: "relative" }}>
            {HOURS.map((h) => (
              <div key={h} style={{ position: "absolute", top: 0, bottom: 0, left: (h - 8) * HOUR_WIDTH, width: 0.5, backgroundColor: "#DBDCDF", pointerEvents: "none" }} />
            ))}
            {showNowLine && (
              <div style={{ position: "absolute", top: 0, bottom: 0, left: nowLineLeft, width: 1, backgroundColor: "#93989E", pointerEvents: "none", zIndex: 2 }} />
            )}
            {mockStaff.map((staff, i) => (
              <div key={i} style={{ height: ROW_H, position: "relative", display: "flex", alignItems: "center" }}>
                <div className={getShiftBg(staff.shifts)} style={{
                  position: "absolute",
                  left: (staff.startHour - 8) * HOUR_WIDTH,
                  width: (staff.endHour - staff.startHour) * HOUR_WIDTH,
                  height: 32, borderRadius: 0,
                }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}