import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Info, X } from "lucide-react";
import BottomNav from "@/components/home/employee/BottomNav";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

interface DayPay {
  date: number;
  dayOfWeek: string;
  workPay?: number;
  weeklyHolidayPay?: number;
  isPayday?: boolean;
  isToday?: boolean;
  isOutside?: boolean;
  detail?: {
    timeRange: string;
    totalHours: string;
    overtimeMinutes?: number;
    totalPay: number;
    salary: number;
    incentive?: number;
  };
}

interface PayStub {
  id: string;
  year: number;
  month: number;
  status: "미확인" | "확인 완료";
  netPay: number;
  periodStart: string;
  periodEnd: string;
  payDate: string;
}

const WORK_PATTERNS: Record<number, { timeRange: string; totalHours: string; workPay: number; overtimeMinutes?: number; incentive?: number }> = {
  1: { timeRange: "08:00 - 13:00", totalHours: "5시간", workPay: 5.0 },
  2: { timeRange: "08:00 - 13:00", totalHours: "5시간", workPay: 5.0 },
  3: { timeRange: "13:00 - 17:30", totalHours: "5시간", workPay: 4.5 },
  4: { timeRange: "13:00 - 17:40", totalHours: "5시간", workPay: 5.1, overtimeMinutes: 10, incentive: 15000 },
};

const WEEKLY_HOLIDAY_PAY: Record<number, number> = {
  1: 3.9,
};

const buildCalendar = (year: number, month: number): DayPay[][] => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const dayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const prevMonthDays = new Date(year, month - 1, 0).getDate();
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month;
  const payday = 10;
  const allDays: DayPay[] = [];

  for (let i = 0; i < firstDay; i++) {
    allDays.push({ date: prevMonthDays - firstDay + 1 + i, dayOfWeek: dayNames[i], isOutside: true });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dow = new Date(year, month - 1, d).getDay();
    const pattern = WORK_PATTERNS[dow];
    const isPast = !isCurrentMonth || d < today.getDate();
    const isToday = isCurrentMonth && d === today.getDate();
    const day: DayPay = {
      date: d,
      dayOfWeek: dayNames[dow],
      ...(isToday ? { isToday: true } : {}),
      ...(d === payday ? { isPayday: true } : {}),
    };
    if (pattern && (isPast || isToday)) {
      day.workPay = pattern.workPay;
      day.detail = {
        timeRange: pattern.timeRange,
        totalHours: pattern.totalHours,
        totalPay: Math.round(pattern.workPay * 10000),
        salary: Math.round(pattern.workPay * 10000),
        ...(pattern.overtimeMinutes ? { overtimeMinutes: pattern.overtimeMinutes } : {}),
        ...(pattern.incentive ? { incentive: pattern.incentive } : {}),
      };
      if (WEEKLY_HOLIDAY_PAY[dow]) {
        day.weeklyHolidayPay = WEEKLY_HOLIDAY_PAY[dow];
      }
    }
    allDays.push(day);
  }

  let nextDate = 1;
  while (allDays.length % 7 !== 0) {
    allDays.push({ date: nextDate++, dayOfWeek: dayNames[allDays.length % 7], isOutside: true });
  }

  const weeks: DayPay[][] = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }
  return weeks;
};

const MOCK_PAY_STUBS: PayStub[] = [
  { id: "1", year: 2025, month: 11, status: "미확인", netPay: 1024612, periodStart: "2025.10.01", periodEnd: "2025.10.31", payDate: "2025.11.10" },
  { id: "2", year: 2025, month: 10, status: "확인 완료", netPay: 1024612, periodStart: "2025.10.01", periodEnd: "2025.10.31", payDate: "2025.11.10" },
  { id: "3", year: 2025, month: 9, status: "확인 완료", netPay: 1024612, periodStart: "2025.10.01", periodEnd: "2025.10.31", payDate: "2025.11.10" },
  { id: "4", year: 2025, month: 8, status: "확인 완료", netPay: 1024612, periodStart: "2025.10.01", periodEnd: "2025.10.31", payDate: "2025.11.10" },
];

const WEEKDAY_HEADERS = ["일", "월", "화", "수", "목", "금", "토"];
const NOW_YEAR = new Date().getFullYear();
const NOW_MONTH = new Date().getMonth() + 1;

const SalaryManagement = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"calendar" | "payStub">("calendar");
  const [viewMode, setViewMode] = useState<"monthly" | "daily">("monthly");
  const [selectedDay, setSelectedDay] = useState<DayPay | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [salaryInfoOpen, setSalaryInfoOpen] = useState(false);
  const [calYear, setCalYear] = useState(NOW_YEAR);
  const [calMonth, setCalMonth] = useState(NOW_MONTH);

  const calendar = buildCalendar(calYear, calMonth);
  const unconfirmedCount = MOCK_PAY_STUBS.filter((s) => s.status === "미확인").length;
  const isCurrentMonth = calYear === NOW_YEAR && calMonth === NOW_MONTH;

  const _now = new Date();
  const isCurrentCalMonth = _now.getFullYear() === calYear && _now.getMonth() + 1 === calMonth;
  const lastDay = isCurrentCalMonth ? _now.getDate() - 1 : new Date(calYear, calMonth, 0).getDate();
  const allCalDays = calendar.flat().filter(d => !d.isOutside && d.date >= 1 && d.date <= lastDay);

  const totalPayRaw = allCalDays.reduce((sum, d) => {
    const work = d.workPay ? Math.round(d.workPay * 10000) : 0;
    const weekly = d.weeklyHolidayPay ? Math.round(d.weeklyHolidayPay * 10000) : 0;
    return sum + work + weekly;
  }, 0);

  const totalMinutes = allCalDays.reduce((sum, d) => {
    if (!d.detail) return sum;
    const parts = d.detail.timeRange.split(" - ");
    const [sh, sm] = parts[0].split(":").map(Number);
    const [eh, em] = parts[1].split(":").map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);

  const totalHoursDisplay = `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`;
  const periodLabel = `${calMonth}/1 ~ ${calMonth}/${lastDay} 기준 예상 급여`;

  const dynamicDailyItems = allCalDays
    .filter(d => d.detail)
    .sort((a, b) => b.date - a.date)
    .flatMap(d => {
      const items: { date: string; subtitle: string; amount: number; isBlue?: boolean; isRed?: boolean; dayRef: DayPay }[] = [];
      const dateLabel = `${calMonth}월 ${d.date}일 (${d.dayOfWeek})`;
      if (d.detail) {
        items.push({ date: dateLabel, subtitle: `${d.detail.timeRange} (${d.detail.totalHours})`, amount: d.detail.salary, dayRef: d });
      }
      if (d.weeklyHolidayPay) {
        items.push({ date: dateLabel, subtitle: `주휴수당 (평균 근로시간: ${d.detail?.totalHours || ''})`, amount: Math.round(d.weeklyHolidayPay * 10000), isBlue: true, dayRef: d });
      }
      if (d.detail?.incentive) {
        items.push({ date: dateLabel, subtitle: '기타 인센티브', amount: d.detail.incentive, isRed: true, dayRef: d });
      }
      return items;
    });

  const isTodayDate = (date: number, isOutside?: boolean) => {
    if (isOutside) return false;
    return _now.getFullYear() === calYear && _now.getMonth() + 1 === calMonth && _now.getDate() === date;
  };

  const goPrevMonth = () => {
    if (calMonth === 1) { setCalYear(calYear - 1); setCalMonth(12); }
    else setCalMonth(calMonth - 1);
  };

  const goNextMonth = () => {
    if (isCurrentMonth) return;
    if (calMonth === 12) { setCalYear(calYear + 1); setCalMonth(1); }
    else setCalMonth(calMonth + 1);
  };

  const handleDayClick = (day: DayPay) => {
    if (day.isOutside || !day.detail) return;
    setSelectedDay(day);
    setBottomSheetOpen(true);
  };

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white pb-20">
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-2 px-2 pt-4 pb-2">
          <button onClick={() => navigate("/employee/home")} className="p-1">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>급여 관리</h1>
        </div>
        <div className="flex border-b border-border px-5" style={{ gap: '36px' }}>
          <button onClick={() => setActiveTab("calendar")} className="py-3 relative"
            style={{ fontSize: '16px', fontWeight: activeTab === "calendar" ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === "calendar" ? '#4261FF' : '#AAB4BF' }}>
            급여 캘린더
            {activeTab === "calendar" && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
          </button>
          <button onClick={() => setActiveTab("payStub")} className="py-3 relative"
            style={{ fontSize: '16px', fontWeight: activeTab === "payStub" ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === "payStub" ? '#4261FF' : '#AAB4BF' }}>
            급여 명세서{unconfirmedCount > 0 ? ` ${unconfirmedCount}건` : ""}
            {activeTab === "payStub" && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
          </button>
        </div>
      </div>

      {activeTab === "calendar" ? (
        <div className="pb-8">
          {/* 예상 급여 요약 카드 */}
          <div style={{ margin: '20px', borderRadius: '16px', backgroundColor: '#F0F7FF', width: 'auto' }}>
            <div style={{ padding: '16px 16px 0 16px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#7488FE' }}>
                {periodLabel}
              </span>
              <div className="flex items-center justify-between" style={{ marginTop: '8px' }}>
                <p style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{calMonth}월 예상 급여</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setSalaryInfoOpen(true)}>
                    <Info className="h-[18px] w-[18px]" style={{ color: '#4261FF' }} />
                  </button>
                  <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF' }}>{totalPayRaw.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '12px 16px' }} />
            <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF' }}>총 근무 시간</span>
                <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B' }}>{totalHoursDisplay}</span>
              </div>
              <div className="flex items-center justify-between">
                <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF' }}>시급</span>
                <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B' }}>11,000 원</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border" style={{ marginTop: '20px' }} />

          {/* 월/년 네비게이션 + 월간/일간 토글 */}
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-1">
              <button onClick={goPrevMonth} className="p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{calYear}년 {calMonth}월</span>
              <button onClick={goNextMonth} className="p-1" disabled={isCurrentMonth}>
                <ChevronRight className="h-5 w-5" style={{ color: isCurrentMonth ? '#D1D5DB' : '#19191B' }} />
              </button>
            </div>
            <div className="flex">
              <button onClick={() => setViewMode("monthly")} style={{ width: '36px', height: '22px', borderRadius: '4px 0 0 4px', backgroundColor: viewMode === "monthly" ? '#93989E' : '#F7F7F8', fontSize: '12px', fontWeight: 600, letterSpacing: '-0.02em', color: viewMode === "monthly" ? '#FFFFFF' : '#93989E' }}>월간</button>
              <button onClick={() => setViewMode("daily")} style={{ width: '36px', height: '22px', borderRadius: '0 4px 4px 0', backgroundColor: viewMode === "daily" ? '#93989E' : '#F7F7F8', fontSize: '12px', fontWeight: 600, letterSpacing: '-0.02em', color: viewMode === "daily" ? '#FFFFFF' : '#93989E' }}>일간</button>
            </div>
          </div>

          {viewMode === "monthly" ? (
            <>
              <div className="grid grid-cols-7 px-3">
                {WEEKDAY_HEADERS.map((day, i) => (
                  <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
                ))}
              </div>
              <div className="px-3">
                {calendar.map((week, wi) => (
                  <div key={wi} className="grid grid-cols-7 mb-1">
                    {week.map((day, di) => {
                      const isSun = di === 0;
                      const isSat = di === 6;
                      const isToday = isTodayDate(day.date, day.isOutside);
                      const dateColor = day.isOutside ? '#AAB4BF' : isToday ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';
                      return (
                        <div key={di} className="flex flex-col items-center py-1.5" style={{ minHeight: '72px' }}>
                          <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isToday ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {}) }}>
                              {day.date}
                            </span>
                          </div>
                          {day.workPay && !day.isOutside && (
                            <button onClick={() => handleDayClick(day)} style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: '#F7F7F8', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: day.weeklyHolidayPay ? '4px' : '0' }}>
                              {day.workPay}만
                            </button>
                          )}
                          {day.weeklyHolidayPay && !day.isOutside && (
                            <button onClick={() => handleDayClick(day)} style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: '#E8F3FF', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#7488FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              {day.weeklyHolidayPay}만
                            </button>
                          )}
                          {day.isPayday && !day.isOutside && (
                            <span style={{ fontSize: '14px', marginTop: day.workPay ? '2px' : '0' }}>🪙</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              <p className="mt-2 px-5 text-xs text-muted-foreground">*금액은 만 원 단위로 반올림되어 표시돼요</p>
            </>
          ) : (
            <div className="mt-4 px-5">
              {dynamicDailyItems.map((item, idx) => (
                <div key={idx} className="flex items-start justify-between py-3 border-b border-border last:border-0 cursor-pointer"
                  onClick={() => handleDayClick(item.dayRef)}>
                  <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: item.isBlue ? '#4261FF' : item.isRed ? '#FF3D3D' : '#19191B' }}>{item.date}</p>
                    <p style={{ fontSize: '12px', color: '#AAB4BF', marginTop: '2px' }}>{item.subtitle}</p>
                  </div>
                  <p style={{ fontSize: '14px', fontWeight: 700, color: item.isBlue ? '#4261FF' : item.isRed ? '#FF3D3D' : '#19191B' }}>
                    {item.amount.toLocaleString()}원
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="pb-8" style={{ backgroundColor: '#F7F7F8' }}>
          <div className="px-5 pt-5 pb-3">
            <span className="inline-flex items-center justify-center h-[28px] rounded-full px-4" style={{ border: '1px solid #4261FF', backgroundColor: '#E8F3FF', fontSize: '14px', fontWeight: 600, color: '#4261FF' }}>
              총 {MOCK_PAY_STUBS.length}건
            </span>
          </div>
          <div className="space-y-3 px-5">
            {MOCK_PAY_STUBS.map((stub) => (
              <button key={stub.id} onClick={() => navigate(`/salary/pay-stub/${stub.id}`)} className="w-full rounded-2xl bg-white p-5 text-left" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-lg shrink-0">📁</span>
                    <span style={{ fontSize: '16px', fontWeight: 600, color: '#292B2E', whiteSpace: 'nowrap' }}>{stub.year}년 {stub.month}월 급여 명세서</span>
                    <span className="shrink-0 inline-flex items-center justify-center px-2 h-5 rounded" style={{ fontSize: '12px', fontWeight: 600, whiteSpace: 'nowrap', backgroundColor: stub.status === "미확인" ? '#4261FF' : '#F7F7F8', color: stub.status === "미확인" ? '#FFFFFF' : '#AAB4BF' }}>
                      {stub.status}
                    </span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 ml-2 mt-0.5" />
                </div>
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between">
                    <span style={{ fontSize: '14px', color: '#93989E' }}>실 지급액</span>
                    <span style={{ fontSize: '14px', color: '#70737B' }}>{stub.netPay.toLocaleString()}원</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: '14px', color: '#93989E' }}>기간</span>
                    <span style={{ fontSize: '14px', color: '#70737B' }}>{stub.periodStart} - {stub.periodEnd}</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ fontSize: '14px', color: '#93989E' }}>급여일</span>
                    <span style={{ fontSize: '14px', color: '#70737B' }}>{stub.payDate}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 급여 상세 바텀시트 */}
      {bottomSheetOpen && selectedDay?.detail && (() => {
        const hasWeekly = !!selectedDay.weeklyHolidayPay;
        const weeklyAmount = hasWeekly ? Math.round((selectedDay.weeklyHolidayPay || 0) * 10000) : 0;
        const totalAmount = selectedDay.detail.salary + (selectedDay.detail.incentive || 0) + weeklyAmount;
        return (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setBottomSheetOpen(false)}>
            <div className="w-full max-w-lg rounded-t-3xl bg-white px-6 pt-6 shadow-xl animate-in slide-in-from-bottom" style={{ paddingBottom: 'calc(100px + env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
                  {calYear}년 {calMonth}월 {selectedDay.date}일 ({selectedDay.dayOfWeek})
                </h2>
                <button onClick={() => setBottomSheetOpen(false)} className="p-1">
                  <X className="h-5 w-5 text-foreground" />
                </button>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>{selectedDay.detail.timeRange}</span>
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>{selectedDay.detail.totalHours}</span>
                {selectedDay.detail.overtimeMinutes && (
                  <span style={{ fontSize: '14px', color: '#4261FF' }}>(+{selectedDay.detail.overtimeMinutes}분)</span>
                )}
              </div>
              <p style={{ fontSize: '32px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', marginBottom: '16px' }}>
                {totalAmount.toLocaleString()}원
              </p>
              <div style={{ height: '0.5px', backgroundColor: '#AAB4BF', marginBottom: '16px' }} />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span style={{ fontSize: '14px', color: '#AAB4BF' }}>급여</span>
                  <span style={{ fontSize: '14px', color: '#19191B' }}>{selectedDay.detail.salary.toLocaleString()}원</span>
                </div>
                {(selectedDay.detail.incentive || 0) > 0 && (
                  <div className="flex justify-between">
                    <span style={{ fontSize: '14px', color: '#AAB4BF' }}>기타 인센티브</span>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>{(selectedDay.detail.incentive || 0).toLocaleString()} 원</span>
                  </div>
                )}
                {hasWeekly && (
                  <div className="flex justify-between items-start">
                    <div>
                      <span style={{ fontSize: '14px', color: '#AAB4BF' }}>주휴 수당</span>
                      <br />
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>(평균 근로시간: 5시간 30분)</span>
                    </div>
                    <span style={{ fontSize: '14px', color: '#19191B' }}>{weeklyAmount.toLocaleString()} 원</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* 예상 급여 안내 다이얼로그 */}
      {salaryInfoOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setSalaryInfoOpen(false)}>
          <div style={{ maxWidth: '335px', width: 'calc(100% - 40px)', backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '24px 20px 20px' }} onClick={e => e.stopPropagation()}>
            <div className="relative flex items-center justify-center mb-4">
              <div className="flex items-center gap-1.5">
                <Info className="h-[18px] w-[18px]" style={{ color: '#AAB4BF' }} />
                <span style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>이번 달 예상 급여</span>
              </div>
              <button onClick={() => setSalaryInfoOpen(false)} className="absolute right-0">
                <X className="h-5 w-5" style={{ color: '#292B2E' }} />
              </button>
            </div>
            <p style={{ fontSize: '15px', color: '#70737B', letterSpacing: '-0.02em', lineHeight: '1.7', textAlign: 'center' }}>
              매달 1일부터 어제까지<br />근무를 기준으로 계산해요<br />세금을 공제한 예상 급여를 보여줘요
            </p>
          </div>
        </div>
      )}

      {/* <BottomNav activeTab="salary" onTabChange={() => { }} /> */}
    </div>
  );
};

export default SalaryManagement;
