import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown, Plus, X, UserPlus, UserMinus, CalendarClock, Palmtree } from "lucide-react";
import ScheduleMonthlyView from "@/components/schedule/ScheduleMonthlyView";
import ScheduleWeeklyView from "@/components/schedule/ScheduleWeeklyView";
// ScheduleDaySheet 인라인으로 대체
import ScheduleChangeRequestTab, { MOCK_REQUESTS } from "@/components/schedule/ScheduleChangeRequestTab";
import DailyScheduleAdd from "@/components/schedule/DailyScheduleAdd";
import DailyScheduleDelete from "@/components/schedule/DailyScheduleDelete";
import DailyVacationSetting from "@/components/schedule/DailyVacationSetting";
import DailyScheduleChange from "@/components/schedule/DailyScheduleChange";

export default function ScheduleManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") === "일정변경요청" ? "일정 변경 요청" : "주간 일정";
  const [activeTab, setActiveTab] = useState<"주간 일정" | "월간 일정" | "일정 변경 요청">(initialTab as "주간 일정" | "월간 일정" | "일정 변경 요청");
  const [changeRequestCount, setChangeRequestCount] = useState(MOCK_REQUESTS.length);
  const viewMode = activeTab === "월간 일정" ? "월간" : "주간";
  const [currentDate, setCurrentDate] = useState(new Date());
  const [fabOpen, setFabOpen] = useState(false);
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [showDailyAdd, setShowDailyAdd] = useState(false);
  const [showDailyDelete, setShowDailyDelete] = useState(false);
  const [showVacation, setShowVacation] = useState(false);
  const [showScheduleChange, setShowScheduleChange] = useState(false);

  // Daily 컴포넌트 열림 시 BottomNav 숨김
  const anyDailyOpen = showDailyAdd || showDailyDelete || showVacation || showScheduleChange;
  useEffect(() => {
    if (anyDailyOpen) {
      document.body.setAttribute('data-overlay-open', 'true');
    } else {
      document.body.removeAttribute('data-overlay-open');
    }
    return () => { document.body.removeAttribute('data-overlay-open'); };
  }, [anyDailyOpen]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [pickerYear, setPickerYear] = useState(year);

  const navigateMonth = (dir: number) => {
    setCurrentDate(new Date(year, month + dir, 1));
  };

  const getWeekNumber = () => {
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0=일
    // 월요일 기준: 일요일(0)은 7로 처리
    const adjustedFirst = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    const dayOfMonth = currentDate.getDate();
    return Math.ceil((dayOfMonth + adjustedFirst - 1) / 7);
  };

  const navigateWeek = (dir: number) => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + dir * 7);
    setCurrentDate(newDate);
  };

  const headerLabel = viewMode === "월간"
    ? `${year}년 ${month + 1}월`
    : `${month + 1}월 ${getWeekNumber()}째주`;

  const handlePrev = () => viewMode === "월간" ? navigateMonth(-1) : navigateWeek(-1);
  const handleNext = () => viewMode === "월간" ? navigateMonth(1) : navigateWeek(1);

  const fabActions = [
    { icon: <UserPlus className="w-5 h-5" />, label: "일일 일정 추가", key: "add" },
    { icon: <UserMinus className="w-5 h-5" />, label: "직원 일정 삭제", key: "delete" },
    { icon: <CalendarClock className="w-5 h-5" />, label: "직원 일정 변경", key: "change" },
    { icon: <Palmtree className="w-5 h-5" />, label: "직원 휴가 처리", key: "vacation" },
  ];

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-2 px-2 pt-4 pb-2">
          <button onClick={() => navigate('/owner/home')} className="pressable p-1">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>일정 관리</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-5" style={{ gap: '24px' }}>
          {(["주간 일정", "월간 일정", "일정 변경 요청"] as const).map((tab) => {
            const isRequest = tab === "일정 변경 요청";
            const requestCount = changeRequestCount;
            const label = isRequest ? `일정 변경 요청 ${requestCount}건` : tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="pressable py-3 relative whitespace-nowrap"
                style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}
              >
                {isRequest && requestCount > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mr-1 mb-2" />}
                {label}
                {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
              </button>
            );
          })}
        </div>
      </div>

      {(activeTab === "주간 일정" || activeTab === "월간 일정") ? (
        <div className="relative">
          {/* Navigation */}
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={handlePrev} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
            <button onClick={() => { setPickerYear(year); setMonthPickerOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'none', border: 'none', cursor: 'pointer' }}>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{headerLabel} ▾</span>
            </button>
            <button onClick={handleNext} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
          </div>

          {viewMode === "월간" ? (
            <ScheduleMonthlyView
              currentDate={currentDate}
              selectedDay={selectedDay}
              onSelectDay={(day) => { setSelectedDay(day); setCurrentDate(day); }}
            />
          ) : (
            <ScheduleWeeklyView
              currentDate={currentDate}
              onSelectStaff={(day) => setSelectedDay(day)}
              onSelectDay={(day) => setCurrentDate(day)}
            />
          )}

          {/* FAB */}
          {fabOpen && createPortal(
            <>
              {/* 딤드 오버레이 - 바텀네비 포함 전체 덮음 */}
              <div
                onClick={() => setFabOpen(false)}
                style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.80)', zIndex: 190 }}
              />
              {/* 액션 카드 */}
              <div style={{
                position: 'fixed',
                bottom: 'calc(74px + env(safe-area-inset-bottom) + 16px + clamp(52px, 14.9vw, 56px) + 12px)',
                right: 'clamp(14px, 4vw, 20px)',
                zIndex: 200,
                backgroundColor: '#2B2D36',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
                minWidth: 'clamp(180px, 50vw, 210px)',
                animation: 'fadeInUp 0.18s ease',
              }}>
                {fabActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (action.key === "add") { setFabOpen(false); setShowDailyAdd(true); }
                      else if (action.key === "delete") { setFabOpen(false); setShowDailyDelete(true); }
                      else if (action.key === "vacation") { setFabOpen(false); setShowVacation(true); }
                      else if (action.key === "change") { setFabOpen(false); setShowScheduleChange(true); }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      width: '100%',
                      padding: 'clamp(13px, 3.7vw, 16px) clamp(16px, 4.3vw, 20px)',
                      background: 'none',
                      border: 'none',
                      borderBottom: i < fabActions.length - 1 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left' as const,
                    }}
                  >
                    <div style={{
                      width: 'clamp(34px, 9.6vw, 38px)',
                      height: 'clamp(34px, 9.6vw, 38px)',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFFFFF',
                      flexShrink: 0,
                    }}>
                      {action.icon}
                    </div>
                    <span style={{
                      fontSize: 'clamp(14px, 4vw, 15px)',
                      fontWeight: 500,
                      color: '#FFFFFF',
                      letterSpacing: '-0.02em',
                      whiteSpace: 'nowrap' as const,
                    }}>
                      {action.label}
                    </span>
                  </button>
                ))}
              </div>
              
            </>,
            document.body
          )}
          {!showDailyAdd && !showDailyDelete && !showVacation && !showScheduleChange && (
          <div style={{ position: 'fixed', bottom: 'calc(74px + env(safe-area-inset-bottom) + 16px)', right: 'clamp(14px, 4vw, 20px)', zIndex: 201 }}>
            {/* 메인 FAB 버튼 */}
            <button
              onClick={() => setFabOpen(!fabOpen)}
              style={{
                width: 'clamp(52px, 14.9vw, 56px)',
                height: 'clamp(52px, 14.9vw, 56px)',
                borderRadius: '50%',
                backgroundColor: fabOpen ? '#5C5F6B' : '#4261FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(66,97,255,0.35)',
                border: 'none',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {fabOpen
                ? <X style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
                : <Plus style={{ width: '22px', height: '22px', color: '#FFFFFF' }} />
              }
            </button>
          </div>
          )}
        </div>
      ) : (
        <ScheduleChangeRequestTab onCountChange={setChangeRequestCount} />
      )}

      {/* Day Detail Bottom Sheet */}
      {!!selectedDay && createPortal(
        <div className="fixed inset-0 z-[210] flex items-end justify-center bg-black/50" onClick={() => setSelectedDay(null)}>
          <div className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl px-6 pb-8 pt-6" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <h2 className="text-[22px] font-bold text-foreground">
                {`${selectedDay.getFullYear()}년 ${selectedDay.getMonth() + 1}월 ${selectedDay.getDate()}일 (${["일","월","화","수","목","금","토"][selectedDay.getDay()]})`}
              </h2>
              <button onClick={() => setSelectedDay(null)} className="mt-1">
                <X className="h-6 w-6 text-foreground" />
              </button>
            </div>
            {/* Shift entries */}
            <div className="space-y-5">
              {([
                { shift: "오픈" as const, slots: [{ time: "08:00 - 12:00", names: ["문자영", "문자일"] }] },
                { shift: "미들" as const, slots: [{ time: "12:00 - 16:00", names: ["문자이", "문자삼"] }, { time: "15:00 - 19:00", names: ["문자민", "문자통"] }] },
                { shift: "마감" as const, slots: [{ time: "18:00 - 22:00", names: ["문자사", "문자오"] }] },
              ]).map((entry, i) => {
                const shiftStyle = { "오픈": { bg: "#FDF9DF", color: "#FFB300" }, "미들": { bg: "#ECFFF1", color: "#1EDC83" }, "마감": { bg: "#E8F9FF", color: "#14C1FA" }, "일일": { bg: "#EEF1FF", color: "#4261FF" } }[entry.shift];
                const totalCount = entry.slots.reduce((acc, s) => acc + s.names.length, 0);
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-2">
                      <span style={{ borderRadius: '4px', padding: '4px 8px', fontSize: '13px', fontWeight: 500, backgroundColor: shiftStyle.bg, color: shiftStyle.color }}>
                        {entry.shift}
                      </span>
                      <span className="text-[13px] text-muted-foreground">{totalCount}명</span>
                    </div>
                    <div className="space-y-1 pl-2">
                      {entry.slots.map((slot, si) => (
                        <div key={si} className="flex items-start gap-3">
                          <span className="text-[14px] text-muted-foreground whitespace-nowrap">{slot.time}</span>
                          <span className="text-[14px] font-medium text-foreground">{slot.names.join(', ')}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Confirm button */}
            <div>
              <button onClick={() => setSelectedDay(null)} className="pressable mt-8 w-full rounded-2xl py-4 text-[16px] font-semibold text-white" style={{ backgroundColor: '#4261FF' }}>확인</button>
            </div>
          </div>
        </div>,
        document.body
      )}
      </div>

      {showDailyAdd && (
        <DailyScheduleAdd onClose={() => setShowDailyAdd(false)} />
      )}
      {showDailyDelete && (
        <DailyScheduleDelete onClose={() => setShowDailyDelete(false)} />
      )}
      {showVacation && (
        <DailyVacationSetting onClose={() => setShowVacation(false)} />
      )}
      {showScheduleChange && (
        <DailyScheduleChange onClose={() => setShowScheduleChange(false)} />
      )}

      {/* Month Picker Overlay */}
      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
          <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <button onClick={() => setPickerYear(p => p - 1)} className="pressable p-1"><ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => setPickerYear(p => p + 1)} className="pressable p-1"><ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const isSelected = pickerYear === year && i === month;
                return (
                  <button
                    key={i}
                    onClick={() => { setCurrentDate(new Date(pickerYear, i, 1)); setMonthPickerOpen(false); }}
                    className="pressable py-2.5 rounded-xl text-[14px] font-medium"
                    style={{ backgroundColor: isSelected ? '#4261FF' : '#F7F7F8', color: isSelected ? '#FFFFFF' : '#19191B' }}
                  >
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