interface Props {
  currentDate: Date;
  selectedDay?: Date | null;
  onSelectDay: (day: Date) => void;
}

// Schedule.tsx all 탭과 동일한 아이콘 컴포넌트
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
    <line x1="11" y1="1" x2="11" y2="0" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
    <line x1="3.5" y1="3.5" x2="2.5" y2="2.5" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
    <line x1="18.5" y1="3.5" x2="19.5" y2="2.5" stroke="#1EDC83" strokeWidth="2" strokeLinecap="round" />
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

// Mock schedule data: day -> {open, middle, close}
const mockSchedule: Record<number, { open: number; middle: number; close: number }> = {};
for (let d = 1; d <= 31; d++) {
  mockSchedule[d] = { open: 1, middle: 1, close: 1 };
}
mockSchedule[1] = { open: 2, middle: 4, close: 2 };
mockSchedule[2] = { open: 1, middle: 1, close: 1 };
mockSchedule[3] = { open: 1, middle: 1, close: 1 };
mockSchedule[4] = { open: 1, middle: 1, close: 1 };

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export default function ScheduleMonthlyView({ currentDate, selectedDay, onSelectDay }: Props) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();
  const isToday = (d: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
  const isSelected = (d: number) =>
    !!selectedDay && selectedDay.getFullYear() === year && selectedDay.getMonth() === month && selectedDay.getDate() === d;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  const cells: { day: number; isOutside: boolean }[] = [];
  for (let i = firstDayOfWeek - 1; i >= 0; i--) cells.push({ day: prevMonthDays - i, isOutside: true });
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, isOutside: false });
  const remaining = 7 - (cells.length % 7);
  if (remaining < 7) for (let i = 1; i <= remaining; i++) cells.push({ day: i, isOutside: true });

  const weeks: typeof cells[] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  const staffRows = (s: { open: number; middle: number; close: number }) => [
    { icon: <IconOpen />, count: s.open,   bg: typeStyle.open.bg,   text: typeStyle.open.text },
    { icon: <IconMiddle />, count: s.middle, bg: typeStyle.middle.bg, text: typeStyle.middle.text },
    { icon: <IconClose />, count: s.close,  bg: typeStyle.close.bg,  text: typeStyle.close.text },
  ];

  return (
    <div className="px-3">
      {/* Day headers */}
      <div className="grid grid-cols-7" style={{ marginBottom: '4px' }}>
        {DAY_LABELS.map((label, i) => (
          <div key={label} className="text-center pb-3"
            style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 mb-1">
          {week.map((cell, ci) => {
            const schedule = !cell.isOutside ? mockSchedule[cell.day] : null;
            const isTodayDate = !cell.isOutside && isToday(cell.day);
            const isSel = !cell.isOutside && isSelected(cell.day);
            const isSun = ci === 0;
            const isSat = ci === 6;
            const dateColor = cell.isOutside ? '#AAB4BF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';

            return (
              <button
                key={ci}
                onClick={() => { if (!cell.isOutside && schedule) onSelectDay(new Date(year, month, cell.day)); }}
                className="pressable flex flex-col items-center py-1.5 w-full"
                style={{ minHeight: '90px', borderRadius: '8px', backgroundColor: 'transparent' }}
                disabled={cell.isOutside}
              >
                <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                  <span style={{
                    fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor,
                    ...(isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '50%', minWidth: '28px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 } : {}),
                    ...(isSel && !isTodayDate ? { color: '#4261FF', fontWeight: 700 } : {}),
                  }}>
                    {cell.day}
                  </span>
                </div>
                {schedule && !cell.isOutside && (
                  <div className="flex flex-col w-full px-0.5" style={{ gap: '2px' }}>
                    {staffRows(schedule).map(({ icon, count, bg, text }, idx) => (
                      <div key={idx} style={{ backgroundColor: bg, borderRadius: '4px', padding: '0 4px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: text, lineHeight: 1 }}>{count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
