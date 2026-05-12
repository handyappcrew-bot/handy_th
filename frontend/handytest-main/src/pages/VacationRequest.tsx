import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
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

type Step = "select-dates" | "form";

const VacationRequest = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("select-dates");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [reasonDraft, setReasonDraft] = useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const today = new Date();
  const isToday = (year: number, month: number, date: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;

  const calendarDays = useMemo(() => getCalendarDays(currentYear, currentMonth), [currentYear, currentMonth]);
  const weeks = useMemo(() => {
    const w: typeof calendarDays[] = [];
    for (let i = 0; i < calendarDays.length; i += 7) w.push(calendarDays.slice(i, i + 7));
    return w;
  }, [calendarDays]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11); } else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0); } else setCurrentMonth(currentMonth + 1);
  };

  const toggleDate = (key: string) => {
    if (!MY_SCHEDULE[key]) return;
    setSelectedDates(prev => prev.includes(key) ? prev.filter(d => d !== key) : [...prev, key]);
  };

  const isFormValid = selectedDates.length > 0 && reason.trim().length > 0;

  const handleConfirm = () => {
    setConfirmDialogOpen(false);
    toast({ description: "휴가 요청이 완료 되었어요.", duration: 2000 });
    const fmtKey = (key: string) => {
      const parts = key.split("-").map(Number);
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 (${DAYS_KR[d.getDay()]})`;
    };
    const sortedKeys = [...selectedDates].sort((a, b) => {
      const pa = a.split("-").map(Number);
      const pb = b.split("-").map(Number);
      return new Date(pa[0], pa[1] - 1, pa[2]).getTime() - new Date(pb[0], pb[1] - 1, pb[2]).getTime();
    });
    const dateStr = sortedKeys.length === 1
      ? fmtKey(sortedKeys[0])
      : `${fmtKey(sortedKeys[0])} ~ ${fmtKey(sortedKeys[sortedKeys.length - 1])}`;
    navigate("/schedule", { state: { newScheduleRequest: {
      id: String(Date.now()),
      requestStatus: "대기중" as const,
      requestType: "휴가 요청" as const,
      requestedAt: Date.now(),
      date: dateStr,
      desired: { date: dateStr },
      reason,
    }}});
  };

  const handleBack = () => {
    if (step === "form") setStep("select-dates");
    else navigate(-1);
  };

  const sortedSelectedDates = useMemo(() => {
    return [...selectedDates].sort((a, b) => {
      const pa = a.split("-").map(Number);
      const pb = b.split("-").map(Number);
      return new Date(pa[0], pa[1] - 1, pa[2]).getTime() - new Date(pb[0], pb[1] - 1, pb[2]).getTime();
    });
  }, [selectedDates]);

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={handleBack} className="p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>휴가 요청</h1>
      </div>
      <div className="border-b border-border" />

      {step === "select-dates" && (
        <div className="flex flex-col flex-1">
          <div className="px-5 pt-4 pb-1">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">휴가를 요청할</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight">일정을 선택해 주세요</h2>
            <p className="text-[13px] text-muted-foreground mt-1">*일정을 여러 개 선택할 수 있어요</p>
          </div>
          <div className="flex items-center justify-between px-5 py-4">
            <button onClick={prevMonth} className="p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
            <button className="flex items-center gap-1">
              <span className="text-[17px] font-bold text-foreground">{currentYear}년 {currentMonth + 1}월</span>
              <ChevronDown className="h-4 w-4 text-foreground" />
            </button>
            <button onClick={nextMonth} className="p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
          </div>
          <div className="grid grid-cols-7 px-3">
            {DAYS_KR.map((day, i) => (
              <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
            ))}
          </div>
          <div className="px-3">
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 mb-1">
                {week.map((d, di) => {
                  const key = getDateKey(d.year, d.month, d.date);
                  const schedule = !d.isOutside ? MY_SCHEDULE[key] : null;
                  const isVacation = !d.isOutside && VACATION_DAYS.includes(key);
                  const isHoliday = !d.isOutside && HOLIDAY_DAYS.includes(key);
                  const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                  const isSelected = !d.isOutside && selectedDates.includes(key);
                  const isSun = di === 0;
                  const isSat = di === 6;
                  const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';
                  return (
                    <button key={di} onClick={() => { if (!d.isOutside) toggleDate(key); }} className="flex flex-col items-center py-1.5 w-full" style={{ minHeight: '90px' }} disabled={d.isOutside}>
                      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                          {d.date}
                        </span>
                      </div>
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
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="mt-auto px-5 pb-8 pt-4">
            <button disabled={selectedDates.length === 0} onClick={() => setStep("form")} className="w-full rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: selectedDates.length > 0 ? '#4261FF' : '#E5E7EB', color: selectedDates.length > 0 ? '#FFFFFF' : '#9CA3AF' }}>다음</button>
          </div>
        </div>
      )}

      {step === "form" && (
        <div className="flex flex-col flex-1">
          <div className="px-5 pt-4 pb-2">
            <h2 className="text-[22px] font-bold text-foreground leading-tight">휴가를 요청할</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight">일정을 확인해 주세요</h2>
          </div>
          <div className="px-5 pt-4">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>선택한 일정</p>
            <div className="space-y-2">
              {sortedSelectedDates.map(dateKey => {
                const schedule = MY_SCHEDULE[dateKey];
                if (!schedule) return null;
                return (
                  <div key={dateKey} className="flex items-center gap-3 rounded-xl bg-muted px-4 py-3">
                    <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: typeStyle[schedule.type].bg, color: typeStyle[schedule.type].text }}>{typeLabels[schedule.type]}</span>
                    <span className="text-[15px] text-foreground font-medium">{formatDateDisplay(dateKey)}</span>
                    <span className="text-[15px] text-muted-foreground">{schedule.start} - {schedule.end}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="h-px bg-border mx-5 my-5" />
          <div className="px-5">
            <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '8px' }}>휴가 요청 사유 <span style={{ color: '#FF5959' }}>*</span></p>
            <button onClick={() => { setReasonDraft(reason); setReasonSheetOpen(true); }} className="w-full flex items-center rounded-xl border border-input px-4 py-3.5">
              <span className={`text-[15px] ${reason ? "text-foreground" : "text-muted-foreground"}`}>{reason || "요청 사유 입력"}</span>
            </button>
            <div className="flex justify-end mt-1">
              <span className="text-[13px] text-muted-foreground">{reason.length}/100</span>
            </div>
          </div>
          <div className="mt-auto px-5 pb-8 pt-4">
            <button disabled={!isFormValid} onClick={() => setConfirmDialogOpen(true)} className="w-full rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: isFormValid ? '#4261FF' : '#E5E7EB', color: isFormValid ? '#FFFFFF' : '#9CA3AF' }}>휴가 요청하기</button>
          </div>
        </div>
      )}

      <Sheet open={reasonSheetOpen} onOpenChange={setReasonSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 border-0 bg-white [&>button]:hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-bold text-foreground">휴가 요청 사유 입력</h3>
            <button onClick={() => setReasonSheetOpen(false)}><X className="h-6 w-6 text-foreground" /></button>
          </div>
          <div className="relative">
            <textarea value={reasonDraft} onChange={(e) => { if (e.target.value.length <= 50) setReasonDraft(e.target.value); }} placeholder="휴가 요청 사유를 입력해 주세요" className="w-full min-h-[180px] rounded-xl border border-input bg-white px-4 py-3 text-[15px] text-foreground placeholder:text-muted-foreground focus:outline-none resize-none" maxLength={50} />
            <span className="absolute bottom-3 right-3 text-[13px] text-muted-foreground">{reasonDraft.length}/50</span>
          </div>
          <div className="flex mt-6" style={{ gap: '10px' }}>
            <button onClick={() => setReasonSheetOpen(false)} className="flex-1 rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: '#DEEBFF', color: '#4261FF' }}>취소</button>
            <button disabled={!reasonDraft.trim()} onClick={() => { setReason(reasonDraft.trim()); setReasonSheetOpen(false); }} className="flex-1 rounded-2xl py-4 text-[16px] font-semibold" style={{ backgroundColor: reasonDraft.trim() ? '#4261FF' : '#E5E7EB', color: reasonDraft.trim() ? '#FFFFFF' : '#9CA3AF' }}>입력하기</button>
          </div>
        </SheetContent>
      </Sheet>

      <ConfirmDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen} title="휴가 요청하기"
        description={<>휴가를 요청하시겠어요?<br />사장님이 확인 후 휴가로 처리돼요</>}
        buttons={[{ label: "취소", onClick: () => setConfirmDialogOpen(false), variant: "cancel" }, { label: "확인", onClick: handleConfirm }]} />
    </div>
  );
};

export default VacationRequest;
