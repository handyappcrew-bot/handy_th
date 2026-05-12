import { createPortal } from "react-dom";
import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";

function getCalendarDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevDays = new Date(year, month, 0).getDate();
  const cells: { year: number; month: number; date: number; isOutside: boolean }[] = [];
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevDays - i);
    cells.push({ year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), isOutside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) cells.push({ year, month, date: d, isOutside: false });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, month + 1, i);
    cells.push({ year: d.getFullYear(), month: d.getMonth(), date: d.getDate(), isOutside: true });
  }
  return cells;
}
const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];
const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

type ShiftType = "오픈" | "미들" | "마감";

interface StaffSchedule {
  id: string;
  name: string;
  avatarColor: string;
  shift: ShiftType;
  employmentType: string;
  startTime: string;
  endTime: string;
  breakNote?: string;
}

const MOCK_SCHEDULE: StaffSchedule[] = [
  { id: "1", name: "김정민", avatarColor: "#A78BFA", shift: "오픈", employmentType: "정규직", startTime: "08:00", endTime: "16:00", breakNote: "휴게 30분" },
  { id: "2", name: "정수민", avatarColor: "#A78BFA", shift: "미들", employmentType: "정규직", startTime: "12:00", endTime: "17:00" },
  { id: "3", name: "김수민", avatarColor: "#A78BFA", shift: "미들", employmentType: "정규직", startTime: "12:00", endTime: "18:00" },
  { id: "4", name: "오야지치", avatarColor: "#A78BFA", shift: "마감", employmentType: "정규직", startTime: "17:30", endTime: "22:00" },
  { id: "5", name: "미야오치", avatarColor: "#A78BFA", shift: "마감", employmentType: "정규직", startTime: "18:00", endTime: "22:00" },
];

const SHIFT_BADGE: Record<ShiftType, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

const IconOpen = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="4" stroke="#FFB300" strokeWidth="2" />
    <line x1="12" y1="2" x2="12" y2="5" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="12" y1="19" x2="12" y2="22" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="12" x2="5" y2="12" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="19" y1="12" x2="22" y2="12" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="4.22" y1="4.22" x2="6.34" y2="6.34" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="17.66" y1="17.66" x2="19.78" y2="19.78" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="19.78" y1="4.22" x2="17.66" y2="6.34" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
    <line x1="6.34" y1="17.66" x2="4.22" y2="19.78" stroke="#FFB300" strokeWidth="2" strokeLinecap="round" />
  </svg>
);
const IconMiddle = () => (
  <svg width="11" height="11" viewBox="0 0 22 14" fill="none" style={{ flexShrink: 0 }}>
    <path d="M1 13h20M11 1C6.03 1 2 5.03 2 10h18C20 5.03 15.97 1 11 1Z" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconClose = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke="#14C1FA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const typeStyle = {
  open:   { bg: '#FDF9DF', text: '#FFB300' },
  middle: { bg: '#ECFFF1', text: '#1EDC83' },
  close:  { bg: '#E8F9FF', text: '#14C1FA' },
};
const mockSchedule: Record<number, { open: number; middle: number; close: number }> = {};
for (let d = 1; d <= 31; d++) mockSchedule[d] = { open: 1, middle: 1, close: 1 };
mockSchedule[1] = { open: 2, middle: 4, close: 2 };



export default function DailyScheduleDelete({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [calYear, setCalYear] = useState(2025);
  const [calMonth, setCalMonth] = useState(9);
  const calDays = useMemo(() => getCalendarDays(calYear, calMonth), [calYear, calMonth]);
  const calWeeks = useMemo(() => { const w: typeof calDays[] = []; for (let i = 0; i < calDays.length; i += 7) w.push(calDays.slice(i, i + 7)); return w; }, [calDays]);
  const today = new Date();
  const isToday = (y: number, m: number, d: number) => today.getFullYear() === y && today.getMonth() === m && today.getDate() === d;
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const { toast } = useToast();

  const isStep1Valid = !!selectedDate;
  const isStep2Valid = selectedStaff.length > 0;

  const toggleStaff = (id: string) => {
    setSelectedStaff((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    if (step === 1 && isStep1Valid) setStep(2);
    else if (step === 2 && isStep2Valid) setStep(3);
  };

  const handleBack = () => {
    if (step === 3) setStep(2);
    else if (step === 2) setStep(1);
    else onClose();
  };

  const handleDelete = () => {
    setShowConfirm(false);
    toast({ description: "일정이 삭제되었어요", duration: 2000 });
    onClose();
  };

  const selectedStaffData = MOCK_SCHEDULE.filter((s) => selectedStaff.includes(s.id));

  const formatSelectedDate = (d: Date) =>
    `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`;

  return (
    <div className="fixed inset-0 z-[200] flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2">
        <button onClick={handleBack} className="pressable p-1">
          <ChevronLeft style={{ width: '24px', height: '24px', color: '#19191B' }} />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>직원 일정 삭제</h1>
      </div>

      {step === 1 && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            삭제할 근무 날짜를<br />선택해 주세요
          </h2>
          <div>
            <div className="flex items-center justify-between px-1 py-3">
              <button onClick={() => { const d = new Date(calYear, calMonth - 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronLeft className="h-5 w-5 text-foreground" /></button>
              <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{calYear}년 {calMonth + 1}월</span>
              <button onClick={() => { const d = new Date(calYear, calMonth + 1, 1); setCalYear(d.getFullYear()); setCalMonth(d.getMonth()); }} className="pressable p-1"><ChevronRight className="h-5 w-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-7">
              {DAY_LABELS.map((day, i) => (
                <div key={day} className="text-center pb-3" style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{day}</div>
              ))}
            </div>
            <div>
              {calWeeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 mb-1">
                  {week.map((d, di) => {
                    const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                    const isSelected = !d.isOutside && selectedDate && selectedDate.getFullYear() === d.year && selectedDate.getMonth() === d.month && selectedDate.getDate() === d.date;
                    const isSun = di === 0; const isSat = di === 6;
                    const dateColor = d.isOutside ? '#AAB4BF' : isSelected ? '#FFFFFF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                    return (
                      <button key={di} onClick={() => { if (!d.isOutside) setSelectedDate(new Date(d.year, d.month, d.date)); }} className="pressable flex flex-col items-center py-1.5 w-full" style={{ minHeight: '90px', borderRadius: '8px' }} disabled={d.isOutside}>
                        <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor, ...(isSelected ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '36px', width: '36px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.5 } : {}) }}>
                            {d.date}
                          </span>
                        </div>
                        {!d.isOutside && (() => {
                          const s = mockSchedule[d.date] ?? { open: 1, middle: 1, close: 1 };
                          return (
                            <div className="flex flex-col w-full px-0.5" style={{ gap: '2px' }}>
                              {[
                                { icon: <IconOpen />, count: s.open, bg: typeStyle.open.bg, text: typeStyle.open.text },
                                { icon: <IconMiddle />, count: s.middle, bg: typeStyle.middle.bg, text: typeStyle.middle.text },
                                { icon: <IconClose />, count: s.close, bg: typeStyle.close.bg, text: typeStyle.close.text },
                              ].map(({ icon, count, bg, text }, idx) => (
                                <div key={idx} style={{ backgroundColor: bg, borderRadius: '4px', padding: '0 4px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: text, lineHeight: 1 }}>{count}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })()}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {step === 2 && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '32px' }}>
            삭제할 근무 일정의<br />직원을 선택해 주세요
          </h2>

          <div className="flex items-center justify-between mb-4">
            <span style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E' }}>
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 근무직원
            </span>
            <span style={{ fontSize: '16px', fontWeight: 400, letterSpacing: '-0.02em', color: '#93989E' }}>총 {MOCK_SCHEDULE.length}명</span>
          </div>

          <div className="flex flex-col">
            {MOCK_SCHEDULE.map((s) => {
              const isSelected = selectedStaff.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => toggleStaff(s.id)}
                  className="flex items-center gap-3 py-3 px-3 -mx-3 rounded-xl" style={isSelected ? { backgroundColor: 'rgba(66,97,255,0.05)' } : {}}
                >
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
                    style={{ backgroundColor: s.avatarColor }}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${SHIFT_BADGE[s.shift]}`}>
                        {s.shift}
                      </span>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>
                        {s.employmentType}
                      </span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#9EA3AD' }}>
                      {s.startTime} - {s.endTime}{s.breakNote && ` (${s.breakNote})`}
                    </p>
                  </div>
                  
                </button>
              );
            })}
          </div>
        </div>
      )}

      {step === 3 && selectedDate && (
        <div className="flex-1 overflow-auto scrollbar-hide px-5">
          <h2 style={{ fontSize: '22px', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em', lineHeight: '1.4', marginTop: '16px', marginBottom: '24px' }}>
            해당 직원의 근무 일정을<br />삭제하시겠어요?
          </h2>

          <p style={{ fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#93989E', marginBottom: '12px' }}>선택한 일정</p>
          <div className="flex flex-col gap-3">
            {selectedStaffData.map((s) => (
              <div key={s.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ backgroundColor: '#FFFFFF', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white text-[16px] font-bold flex-shrink-0"
                  style={{ backgroundColor: s.avatarColor }}
                >
                  {s.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#19191B' }}>{s.name}</span>
                    <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${SHIFT_BADGE[s.shift]}`}>
                      {s.shift}
                    </span>
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: '#F0F0F0', color: '#70737B' }}>{s.employmentType}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#9EA3AD' }}>
                    {formatSelectedDate(selectedDate)}  |  {s.startTime} - {s.endTime}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom buttons */}
      <div style={{ padding: '16px 20px 32px' }}>
        {step === 3 ? (
          <div className="flex gap-3">
            <button
              onClick={handleBack}
              style={{ flex: 1, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', backgroundColor: '#DEEBFF', color: '#4261FF', border: 'none', cursor: 'pointer' }}
            >
              이전
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              style={{ flex: 1.5, height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', backgroundColor: '#4261FF', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
            >
              삭제하기
            </button>
          </div>
        ) : (
          <button
            onClick={handleNext}
            disabled={step === 1 ? !isStep1Valid : !isStep2Valid}
            style={{ width: '100%', height: '56px', borderRadius: '16px', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', border: 'none', cursor: 'pointer', backgroundColor: (step === 1 ? isStep1Valid : isStep2Valid) ? '#4261FF' : '#EAECEF', color: (step === 1 ? isStep1Valid : isStep2Valid) ? '#FFFFFF' : '#9EA3AD' }}
          >
            다음
          </button>
        )}
      </div>

      {/* Confirmation popup */}
      {showConfirm && selectedDate && createPortal(
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80" onClick={() => setShowConfirm(false)}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>직원 일정 삭제하기</h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '12px', lineHeight: '1.5' }}>
              아래 일정을 삭제하시겠어요?<br />삭제하면 복구할 수 없어요
            </p>
            <div className="text-left text-[13px] space-y-1.5 w-full mb-5 p-3 rounded-xl" style={{ backgroundColor: '#F7F8FA' }}>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>직원</span><span className="font-bold text-foreground">{selectedStaffData.map(s => s.name).join(', ')}</span></div>
              <div className="flex"><span style={{ color: '#9EA3AD', minWidth: '80px', flexShrink: 0 }}>일정</span><span className="text-foreground">{formatSelectedDate(selectedDate)} | {selectedStaffData[0]?.startTime} - {selectedStaffData[0]?.endTime}</span></div>
            </div>
            <div className="flex" style={{ gap: '8px', width: '100%' }}>
              <button
                onClick={() => setShowConfirm(false)}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}
              >
                삭제하기
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}