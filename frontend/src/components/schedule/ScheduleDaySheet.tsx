import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  date: Date | null;
}

interface StaffTimeSlot { time: string; names: string[]; }
interface ShiftEntry { shift: "오픈" | "미들" | "마감"; slots: StaffTimeSlot[]; }

const mockEntries: ShiftEntry[] = [
  { shift: "오픈", slots: [{ time: "08:00 - 12:00", names: ["문자영", "문자일"] }] },
  { shift: "미들", slots: [{ time: "12:00 - 16:00", names: ["문자이", "문자삼"] }, { time: "15:00 - 19:00", names: ["문자민", "문자통"] }] },
  { shift: "마감", slots: [{ time: "18:00 - 22:00", names: ["문자사", "문자오"] }] },
];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

const SHIFT_STYLE: Record<string, { bg: string; color: string }> = {
  "오픈": { bg: "#FDF9DF", color: "#FFB300" },
  "미들": { bg: "#ECFFF1", color: "#1EDC83" },
  "마감": { bg: "#E8F9FF", color: "#14C1FA" },
};

export default function ScheduleDaySheet({ open, onClose, date }: Props) {
  if (!open || !date) return null;

  const dayStr = `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 (${DAY_NAMES[date.getDay()]})`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-t-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '24px 24px 16px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{dayStr}</h2>
            <p style={{ fontSize: '14px', color: '#70737B', marginTop: '4px' }}>근무 일정</p>
          </div>
          <button onClick={onClose} className="pressable p-1" style={{ marginTop: '2px' }}>
            <X style={{ width: '20px', height: '20px', color: '#19191B' }} />
          </button>
        </div>

        {/* Shift entries */}
        <div style={{ padding: '0 24px 8px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {mockEntries.map((entry, i) => {
            const style = SHIFT_STYLE[entry.shift] ?? { bg: "#F7F7F8", color: "#AAB4BF" };
            const totalCount = entry.slots.reduce((acc, s) => acc + s.names.length, 0);
            return (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', height: '22px',
                    borderRadius: '4px', padding: '0 8px',
                    fontSize: '13px', fontWeight: 500,
                    backgroundColor: style.bg, color: style.color,
                  }}>
                    {entry.shift}
                  </span>
                  <span style={{ fontSize: '13px', color: '#9EA3AD' }}>{totalCount}명</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', paddingLeft: '8px' }}>
                  {entry.slots.map((slot, si) => (
                    <div key={si} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                      <span style={{ fontSize: '14px', color: '#70737B', whiteSpace: 'nowrap', minWidth: '100px' }}>{slot.time}</span>
                      <span style={{ fontSize: '14px', fontWeight: 500, color: '#19191B' }}>{slot.names.join("  ")}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Confirm button */}
        <div style={{ padding: '16px 24px 32px' }}>
          <button
            onClick={onClose}
            className="pressable w-full rounded-2xl text-[16px] font-semibold"
            style={{ height: '56px', backgroundColor: '#4261FF', color: '#FFFFFF', border: 'none', cursor: 'pointer' }}
          >
            확인
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
