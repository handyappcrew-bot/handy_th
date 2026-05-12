import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, Calendar as CalendarIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { MY_SCHEDULE, HOLIDAY_DAYS, VACATION_DAYS } from "@/lib/scheduleData";

const DAYS_KR = ["일", "월", "화", "수", "목", "금", "토"];
const typeLabels: Record<string, string> = { open: "오픈", middle: "미들", close: "마감" };

const typeStyle = {
  open:     { bg: '#FDF9DF', text: '#FFB300' },
  middle:   { bg: '#ECFFF1', text: '#1EDC83' },
  close:    { bg: '#E8F9FF', text: '#14C1FA' },
  vacation: { bg: '#F7F7F8', text: '#AAB4BF' },
  holiday:  { bg: '#FFE8E8', text: '#FF5959' },
};

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDaysInMonth = new Date(year, month, 0).getDate();
  const days: { date: number; month: number; year: number; isOutside: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) days.push({ date: prevDaysInMonth - i, month: month - 1, year, isOutside: true });
  for (let i = 1; i <= daysInMonth; i++) days.push({ date: i, month, year, isOutside: false });
  const remaining = 7 - (days.length % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) days.push({ date: i, month: month + 1, year, isOutside: true });
  return days;
}

function getDateKey(year: number, month: number, date: number) {
  return `${year}-${month + 1}-${date}`;
}

function formatDateDisplay(dateKey: string) {
  const parts = dateKey.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return `${parts[0]}.${String(parts[1]).padStart(2, "0")}.${String(parts[2]).padStart(2, "0")} (${DAYS_KR[d.getDay()]})`;
}

function formatDateShort(dateKey: string) {
  const parts = dateKey.split("-").map(Number);
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  return `${String(parts[0]).slice(2)}.${String(parts[1]).padStart(2, "0")}.${String(parts[2]).padStart(2, "0")}(${DAYS_KR[d.getDay()]})`;
}

const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  for (let m = 0; m < 60; m += 30) {
    TIME_OPTIONS.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
}

type Step = "select-schedule" | "form" | "select-change-date";

const ScheduleChangeRequest = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-schedule");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<string | null>(null);
  const [changeDateYear, setChangeDateYear] = useState(new Date().getFullYear());
  const [changeDateMonth, setChangeDateMonth] = useState(new Date().getMonth());
  const [changeDate, setChangeDate] = useState<string | null>(null);
  const [clockIn, setClockIn] = useState<string | null>(null);
  const [clockOut, setClockOut] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [clockInPickerOpen, setClockInPickerOpen] = useState(false);
  const [clockOutPickerOpen, setClockOutPickerOpen] = useState(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const today = new Date();
  const isToday = (year: number, month: number, date: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;

  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const changeDateCalendarDays = useMemo(() => getCalendarDays(changeDateYear, changeDateMonth), [changeDateYear, changeDateMonth]);

  const weeks = useMemo(() => {
    const w: typeof calendarDays[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) w.push(calendarDays.slice(i, i + 7));
    return w;
  }, [calendarDays]);

  const changeDateWeeks = useMemo(() => {
    const w: typeof changeDateCalendarDays[] = [];
    for (let i = 0; i < changeDateCalendarDays.length; i += 7) w.push(changeDateCalendarDays.slice(i, i + 7));
    return w;
  }, [changeDateCalendarDays]);

  const prevMonth = (target: "main" | "change") => {
    if (target === "main") {
      if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11); } else setCurrentMonth(currentMonth - 1);
    } else {
      if (changeDateMonth === 0) { setChangeDateYear(changeDateYear - 1); setChangeDateMonth(11); } else setChangeDateMonth(changeDateMonth - 1);
    }
  };

  const nextMonth = (target: "main" | "change") => {
    if (target === "main") {
      if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0); } else setCurrentMonth(currentMonth + 1);
    } else {
      if (changeDateMonth === 11) { setChangeDateYear(changeDateYear + 1); setChangeDateMonth(0); } else setChangeDateMonth(changeDateMonth + 1);
    }
  };

  const selectedSchedule = selectedScheduleDate ? MY_SCHEDULE[selectedScheduleDate] : null;
  const isFormValid = changeDate && clockIn && clockOut;

  const handleConfirm = () => {
    setConfirmDialogOpen(false);
    toast({ description: "일정 변경 요청이 완료 되었어요.", duration: 2000 });
    const fmtKey = (key: string | null) => {
      if (!key) return "";
      const parts = key.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 (${DAYS_KR[d.getDay()]})`;
    };
    navigate("/schedule", { state: { newScheduleRequest: {
      id: String(Date.now()),
      requestStatus: "대기중" as const,
      requestType: "일정 변경 요청" as const,
      requestedAt: Date.now(),
      date: fmtKey(selectedScheduleDate),
      original: {
        date: fmtKey(selectedScheduleDate),
        startTime: selectedSchedule?.start,
        endTime: selectedSchedule?.end,
      },
      desired: {
        date: fmtKey(changeDate),
        startTime: clockIn ?? undefined,
        endTime: clockOut ?? undefined,
      },
      reason,
    }}});
  };

  const handleBack = () => {
    if (step === "form") setStep("select-schedule");
    else if (step === "select-change-date") setStep("form");
    else navigate(-1);
  };

  const renderCalendar = (
    weeksData: typeof weeks,
    yearVal: number,
    monthVal: number,
    selectedKey: string | null,
    onSelect: (key: string) => void,
    showSchedule: boolean
  ) => (
    <>
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={() => prevMonth(showSchedule ? "main" : "change")} className="p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
        <button className="flex items-center gap-1">
          <span className="text-[17px] font-bold text-foreground">{yearVal}년 {monthVal + 1}월</span>
          <ChevronDown className="h-4 w-4 text-foreground" />
        </button>
        <button onClick={() => nextMonth(showSchedule ? "main" : "change")} className="p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
      </div>
      <div className="grid grid-cols-7 px-3">
        {DAYS_KR.map((day, i) => (
          <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
        ))}
      </div>
      <div className="px-3">
        {weeksData.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 mb-1">
            {week.map((d, di) => {
              const key = getDateKey(d.year, d.month, d.date);
              const schedule = !d.isOutside && showSchedule ? MY_SCHEDULE[key] : null;
              const isVacation = !d.isOutside && showSchedule && VACATION_DAYS.includes(key);
              const isHoliday = !d.isOutside && showSchedule && HOLIDAY_DAYS.includes(key);
              const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
              const isSelected = !d.isOutside && key === selectedKey;
              const isSun = di === 0;
              const isSat = di === 6;
              const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';
              return (
                <button key={di} onClick={() => { if (!d.isOutside) onSelect(key); }} className="flex flex-col items-center py-1.5 w-full" style={{ minHeight: showSchedule ? '90px' : '56px' }} disabled={d.isOutside}>
                  <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                      {d.date}
                    </span>
                  </div>
                  {showSchedule && !d.isOutside && (
                    <div className="flex flex-col items-center w-full px-0.5">
                      {isHoliday ? (
                        <div className="flex items-center justify-center w-full" style={{ backgroundColor: typeStyle.holiday.bg, borderRadius: '4px', minHeight: '17px', height: '17px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: typeStyle.holiday.text }}>휴무</span>
                        </div>
                      ) : schedule ? (
                        <div className="flex flex-col items-center justify-center w-full" style={{ backgroundColor: isSelected ? '#E8F3FF' : typeStyle[schedule.type].bg, borderRadius: '4px', minHeight: '36px', padding: '2px 0' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: isSelected ? '#7488FE' : typeStyle[schedule.type].text, lineHeight: '1.3' }}>{schedule.start}</span>
                          <span style={{ fontSize: '10px', color: isSelected ? '#7488FE' : typeStyle[schedule.type].text, lineHeight: '1' }}>-</span>
                          <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: isSelected ? '#7488FE' : typeStyle[schedule.type].text, lineHeight: '1.3' }}>{schedule.end}</span>
                        </div>
                      ) : isVacation ? (
                        <div className="flex items-center justify-center w-full" style={{ backgroundColor: typeStyle.vacation.bg, borderRadius: '4px', minHeight: '17px', height: '17px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: typeStyle.vacation.text }}>휴가</span>
                        </div>
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </>
  );

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={handleBack} className="p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>일정 변경 요청</h1>
      </div>
      <div className="border-b border-border" />

      {step === "select-schedule" && (
        <div className="flex flex-col flex-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">변경을 요청할</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight">일정을 선택해 주세요</h2>
          </div>
          {renderCalendar(weeks, currentYear, currentMonth, selectedScheduleDate, (key) => { if (MY_SCHEDULE[key]) setSelectedScheduleDate(key); }, true)}
          <div className="mt-auto px-5 pb-8 pt-4">
            <button disabled={!selectedScheduleDate} onClick={() => setStep("form")} className="w-full rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: selectedScheduleDate ? '#4261FF' : '#E5E7EB', color: selectedScheduleDate ? '#FFFFFF' : '#9CA3AF' }}>다음</button>
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="flex flex-col flex-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">변경할 일정을</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight">확인해 주세요</h2>
          </div>
          <div className="px-5 pt-4">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>선택한 일정</p>
            {selectedScheduleDate && selectedSchedule && (
              <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{ backgroundColor: '#F0F7FF' }}>
                <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: typeStyle[selectedSchedule.type].bg, color: typeStyle[selectedSchedule.type].text }}>{typeLabels[selectedSchedule.type]}</span>
                <span className="text-[15px] text-foreground font-medium">{formatDateDisplay(selectedScheduleDate)}</span>
                <span className="text-[15px] text-muted-foreground">{selectedSchedule.start} - {selectedSchedule.end}</span>
              </div>
            )}
          </div>
          <div className="h-px bg-border mx-5 my-5" />
          <div className="px-5">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>변경할 날짜 <span style={{ color: '#FF5959' }}>*</span></p>
            <button onClick={() => setStep("select-change-date")} className="w-full flex items-center justify-between rounded-xl border border-input px-4 py-3.5">
              <span className={`text-[15px] ${changeDate ? "text-foreground" : "text-muted-foreground"}`}>{changeDate ? formatDateDisplay(changeDate) : "날짜를 선택해 주세요"}</span>
              <CalendarIcon className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 mt-4">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>출근 시간 <span style={{ color: '#FF5959' }}>*</span></p>
            <button onClick={() => setClockInPickerOpen(true)} className="w-full flex items-center justify-between rounded-xl border border-input px-4 py-3.5">
              <span className={`text-[15px] ${clockIn ? "text-foreground" : "text-muted-foreground"}`}>{clockIn || "출근 시간 선택"}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 mt-4">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>퇴근 시간 <span style={{ color: '#FF5959' }}>*</span></p>
            <button onClick={() => setClockOutPickerOpen(true)} className="w-full flex items-center justify-between rounded-xl border border-input px-4 py-3.5">
              <span className={`text-[15px] ${clockOut ? "text-foreground" : "text-muted-foreground"}`}>{clockOut || "퇴근 시간 선택"}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>
          <div className="px-5 mt-4">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>변경 요청 사유</p>
            <button onClick={() => { setReasonDraft(reason); setReasonSheetOpen(true); }} className="w-full flex items-center rounded-xl border border-input px-4 py-3.5">
              <span className={`text-[15px] ${reason ? "text-foreground" : "text-muted-foreground"}`}>{reason || "변경 사유 입력"}</span>
            </button>
          </div>
          <div className="mt-auto px-5 pb-8 pt-4">
            <button disabled={!isFormValid} onClick={() => setConfirmDialogOpen(true)} className="w-full rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: isFormValid ? '#4261FF' : '#E5E7EB', color: isFormValid ? '#FFFFFF' : '#9CA3AF' }}>일정 변경 요청하기</button>
          </div>
        </div>
      )}

      {step === "select-change-date" && (
        <div className="flex flex-col flex-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">변경할 날짜를</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight">선택해 주세요</h2>
          </div>
          {renderCalendar(changeDateWeeks, changeDateYear, changeDateMonth, changeDate, (key) => { setChangeDate(key); }, false)}
          <div className="mt-auto px-5 pb-8 pt-4">
            <button disabled={!changeDate} onClick={() => setStep("form")} className="w-full rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: changeDate ? '#4261FF' : '#E5E7EB', color: changeDate ? '#FFFFFF' : '#9CA3AF' }}>다음</button>
          </div>
        </div>
      )}

      <Sheet open={clockInPickerOpen} onOpenChange={setClockInPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 border-0 bg-white [&>button]:hidden max-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold text-foreground">출근 시간 선택</h3>
            <button onClick={() => setClockInPickerOpen(false)}><X className="h-6 w-6 text-foreground" /></button>
          </div>
          <div className="overflow-y-auto max-h-[30vh] space-y-1">
            {TIME_OPTIONS.map((t) => (
              <button key={t} onClick={() => { setClockIn(t); setClockInPickerOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] ${clockIn === t ? "font-semibold text-white" : "text-foreground hover:bg-muted"}`} style={clockIn === t ? { backgroundColor: '#4261FF' } : {}}>{t}</button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={clockOutPickerOpen} onOpenChange={setClockOutPickerOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 border-0 bg-white [&>button]:hidden max-h-[50vh]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[18px] font-bold text-foreground">퇴근 시간 선택</h3>
            <button onClick={() => setClockOutPickerOpen(false)}><X className="h-6 w-6 text-foreground" /></button>
          </div>
          <div className="overflow-y-auto max-h-[30vh] space-y-1">
            {TIME_OPTIONS.map((t) => (
              <button key={t} onClick={() => { setClockOut(t); setClockOutPickerOpen(false); }} className={`w-full text-left px-4 py-3 rounded-xl text-[15px] ${clockOut === t ? "font-semibold text-white" : "text-foreground hover:bg-muted"}`} style={clockOut === t ? { backgroundColor: '#4261FF' } : {}}>{t}</button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={reasonSheetOpen} onOpenChange={setReasonSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 border-0 bg-white [&>button]:hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-foreground">변경 요청 사유 입력</h3>
            <button onClick={() => setReasonSheetOpen(false)}><X className="h-6 w-6 text-foreground" /></button>
          </div>
          <div className="relative">
            <textarea value={reasonDraft} onChange={(e) => { if (e.target.value.length <= 50) setReasonDraft(e.target.value); }} placeholder="변경 사유를 입력해 주세요" className="w-full min-h-[180px] rounded-xl border border-input bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" maxLength={50} />
            <span className="absolute bottom-3 right-3 text-[13px] text-muted-foreground">{reasonDraft.length}/50</span>
          </div>
          <div className="flex mt-6" style={{ gap: '10px' }}>
            <button onClick={() => setReasonSheetOpen(false)} className="flex-1 rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: '#DEEBFF', color: '#4261FF' }}>취소</button>
            <button disabled={!reasonDraft.trim()} onClick={() => { setReason(reasonDraft.trim()); setReasonSheetOpen(false); }} className="flex-1 rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: reasonDraft.trim() ? '#4261FF' : '#E5E7EB', color: reasonDraft.trim() ? '#FFFFFF' : '#9CA3AF' }}>입력하기</button>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="[&>button]:hidden p-0 overflow-hidden border-none"
          style={{ width: 'calc(100% - 40px)', maxWidth: '320px', backgroundColor: '#FFFFFF', borderRadius: '20px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <DialogTitle style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', paddingTop: '24px' }}>
              일정 변경 요청하기
            </DialogTitle>
            <DialogDescription style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', lineHeight: '24px', textAlign: 'center', padding: '12px 20px 0', margin: 0 }}>
              아래와 같이 일정을 변경하시겠어요?<br />사장님이 확인 후 일정이 변경돼요
            </DialogDescription>
            {selectedScheduleDate && selectedSchedule && (
              <div className="flex items-center justify-center gap-2 px-5 pt-4">
                <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', whiteSpace: 'nowrap' }}>선택한 일정</span>
                <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>{formatDateShort(selectedScheduleDate)} | {selectedSchedule.start}-{selectedSchedule.end}</span>
              </div>
            )}
            {changeDate && clockIn && clockOut && (
              <div className="flex items-center justify-center gap-2 px-5 pt-2 pb-4">
                <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#70737B', whiteSpace: 'nowrap' }}>변경할 일정</span>
                <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF' }}>{formatDateShort(changeDate)} | {clockIn}-{clockOut}</span>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px', padding: '0 16px 16px 16px', width: '100%' }}>
              <button onClick={() => setConfirmDialogOpen(false)} style={{ flex: 1, height: '48px', backgroundColor: '#DBDCDF', color: '#70737B', borderRadius: '10px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>취소</button>
              <button onClick={handleConfirm} style={{ flex: 1, height: '48px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '10px', fontSize: '16px', fontWeight: 600, border: 'none', cursor: 'pointer' }}>확인</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ScheduleChangeRequest;
