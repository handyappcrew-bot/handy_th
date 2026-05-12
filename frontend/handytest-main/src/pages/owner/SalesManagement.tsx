import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

const MONTHLY_SALES: Record<number, { net: number; gross: number }> = {};
for (let d = 1; d <= 21; d++) {
  MONTHLY_SALES[d] = { net: 520000, gross: 698000 };
}

// 미확인 날짜 (실제로는 서버에서 받아올 데이터)
const INITIAL_UNREAD_DAYS = [3, 7, 12, 15, 19];

function getUnreadKey(year: number, month: number) {
  return `sales_unread_${year}_${month + 1}`;
}

function loadUnreadDays(year: number, month: number): Set<number> {
  try {
    const raw = localStorage.getItem(getUnreadKey(year, month));
    if (raw === null) return new Set(INITIAL_UNREAD_DAYS);
    return new Set(JSON.parse(raw) as number[]);
  } catch { return new Set(INITIAL_UNREAD_DAYS); }
}

function saveUnreadDays(year: number, month: number, days: Set<number>) {
  localStorage.setItem(getUnreadKey(year, month), JSON.stringify([...days]));
}

function formatSales(n: number) {
  if (n >= 10000) {
    const man = (n / 10000).toFixed(1).replace(/\.0$/, "");
    return `${man}만`;
  }
  return n.toLocaleString();
}

export default function SalesManagement() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date(2025, 9, 22));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [unreadDays, setUnreadDays] = useState<Set<number>>(() => loadUnreadDays(new Date(2025, 9, 22).getFullYear(), new Date(2025, 9, 22).getMonth()));
  
  const [monthPickerOpen, setMonthPickerOpen] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const [pickerYear, setPickerYear] = useState(year);

  const today = new Date();

  const prevMonth = () => {
    const newDate = new Date(year, month - 1, 1);
    setCurrentDate(newDate);
    setUnreadDays(loadUnreadDays(newDate.getFullYear(), newDate.getMonth()));
  };
  const nextMonth = () => {
    const newDate = new Date(year, month + 1, 1);
    setCurrentDate(newDate);
    setUnreadDays(loadUnreadDays(newDate.getFullYear(), newDate.getMonth()));
  };

  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; isOutside: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, isOutside: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, isOutside: false });
  }
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) {
    for (let i = 1; i <= remaining; i++) {
      cells.push({ day: i, isOutside: true });
    }
  }
  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  const handleDayClick = (day: number) => {
    const d = new Date(year, month, day);
    setSelectedDay(d);
    const next = new Set(unreadDays);
    next.delete(day);
    setUnreadDays(next);
    saveUnreadDays(year, month, next);
    const dateParam = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    navigate(`/owner/sales/daily?date=${dateParam}`);
  };

  const totalNetSales = 7457391;
  const totalGrossSales = 9320000;

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      <div className="pb-24">

        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate('/owner/home')} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>매출 관리</h1>
          </div>
          <div className="flex border-b border-border px-5" style={{ gap: '36px' }}>
            <button className="pressable py-3 relative whitespace-nowrap"
              style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF' }}>
              월간 매출
              <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />
            </button>
          </div>
        </div>

        {/* Summary card */}
        <div style={{ margin: '16px 20px 0', backgroundColor: '#F0F7FF', borderRadius: '16px', padding: '16px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '17px', borderRadius: '4px', padding: '0 8px', backgroundColor: '#D3DAFF', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#7488FE' }}>
            *{month + 1}/1 ~ {month + 1}/21 기준 매출 현황
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <p style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{month + 1}월 순매출</p>
            <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF' }}>{totalNetSales.toLocaleString()}원</span>
          </div>
          <div style={{ height: '0.5px', backgroundColor: '#DBDCDF', margin: '12px 0' }} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '14px', color: '#70737B' }}>총 매출</span>
            <span style={{ fontSize: '14px', color: '#70737B' }}>{totalGrossSales.toLocaleString()}원</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
            <button onClick={() => navigate(`/owner/sales/monthly?year=${year}&month=${month + 1}`)}
              style={{ display: 'flex', alignItems: 'center', gap: '2px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <span style={{ fontSize: '13px', color: '#4261FF', fontWeight: 500 }}>세부 내역 보기</span>
              <ChevronRight style={{ width: '14px', height: '14px', color: '#4261FF' }} />
            </button>
          </div>
        </div>

        {/* Calendar */}
        <div className="mt-4 bg-card pt-4 pb-2">
          <div className="w-full h-[12px]" style={{ backgroundColor: '#F7F7F8', marginBottom: '16px' }} />

          {/* Month navigation */}
          <div className="flex items-center justify-between px-5" style={{ marginBottom: '16px' }}>
            <div className="flex items-center gap-1">
              <button onClick={prevMonth} className="pressable p-1"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <button onClick={() => { setPickerYear(year); setMonthPickerOpen(true); }} className="flex items-center gap-1">
                <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{year}년 {month + 1}월</span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </button>
              <button onClick={nextMonth} className="pressable p-1"><ChevronRight className="w-5 h-5 text-foreground" /></button>
            </div>
          </div>

          {/* Day headers */}
          <div className="px-3">
            <div className="grid grid-cols-7 text-center mb-2">
              {DAY_LABELS.map((label, i) => (
                <span key={label} className={`text-[13px] font-medium ${i === 0 ? "text-destructive" : i === 6 ? "text-primary" : "text-muted-foreground"}`}>
                  {label}
                </span>
              ))}
            </div>

            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7 mb-1">
                {week.map((cell, ci) => {
                  const isFuture = !cell.isOutside && new Date(year, month, cell.day) > today;
                  const sales = !cell.isOutside && !isFuture ? MONTHLY_SALES[cell.day] : null;
                  const isTodayCell = isToday(cell.day) && !cell.isOutside;
                  const isSun = ci === 0; const isSat = ci === 6;
                  const dateColor = cell.isOutside ? '#AAB4BF' : isTodayCell ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';

                  return (
                    <div key={ci} className="flex flex-col items-center py-1.5" style={{ minHeight: '72px', position: 'relative' }}>
                      {!cell.isOutside && !isFuture && unreadDays.has(cell.day) && (
                        <div style={{ position: 'absolute', top: '2px', right: '2px', width: '5px', height: '5px', borderRadius: '50%', backgroundColor: '#FF3D3D', zIndex: 1 }} />
                      )}
                      <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                        <button
                          onClick={() => !cell.isOutside && !isFuture && handleDayClick(cell.day)}
                          className="pressable"
                          style={{
                            fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor,
                            ...(isTodayCell ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : { minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' })
                          }}>
                          {cell.day}
                        </button>
                      </div>
                      {sales && !cell.isOutside && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                          <button onClick={() => handleDayClick(cell.day)} className="pressable"
                            style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: '#EEF1FF', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {formatSales(sales.net)}
                          </button>
                          <button onClick={() => handleDayClick(cell.day)} className="pressable"
                            style={{ width: '40px', height: '17px', borderRadius: '4px', backgroundColor: '#F7F7F8', fontSize: '11px', fontWeight: 500, letterSpacing: '-0.02em', color: '#9EA3AD', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            {formatSales(sales.gross)}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 20px 4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#EEF1FF' }} />
              <span style={{ fontSize: '11px', color: '#4261FF', fontWeight: 500 }}>순매출</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '2px', backgroundColor: '#F7F7F8' }} />
              <span style={{ fontSize: '11px', color: '#9EA3AD', fontWeight: 500 }}>총매출</span>
            </div>
          </div>
        </div>
      </div>

      

      {/* Month Picker */}
      {monthPickerOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50" onClick={() => setMonthPickerOpen(false)}>
          <div className="relative rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <button onClick={() => setPickerYear(pickerYear - 1)} className="pressable p-1"><ChevronLeft className="w-5 h-5 text-foreground" /></button>
              <span style={{ fontSize: '18px', fontWeight: 700, color: '#19191B' }}>{pickerYear}년</span>
              <button onClick={() => setPickerYear(pickerYear + 1)} className="pressable p-1"><ChevronRight className="w-5 h-5 text-foreground" /></button>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }, (_, i) => {
                const isSelected = pickerYear === year && i === month;
                return (
                  <button key={i} onClick={() => { const nd = new Date(pickerYear, i, 1); setCurrentDate(nd); setUnreadDays(loadUnreadDays(pickerYear, i)); setMonthPickerOpen(false); }} className="pressable py-2.5 rounded-xl text-[14px] font-medium"
                    style={{ backgroundColor: isSelected ? '#4261FF' : '#F7F7F8', color: isSelected ? '#FFFFFF' : '#19191B' }}>
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
