import { X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

type AttendanceStatus = "결근" | "근무전" | "근무중" | "미등록" | "지각" | "퇴근" | "근무완료" | "휴가" | "휴무" | "휴게중";

interface AttendanceDetail {
  year: number;
  month: number;
  date: number;
  dayOfWeek: string;
  status: AttendanceStatus;
  isClosed: boolean;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  overtimeMinutes: number;
  isLate?: boolean;
  lateMinutes?: number;
  shiftTypes?: ("오픈" | "미들" | "마감")[];
}

interface AttendanceDetailSheetProps {
  open: boolean;
  detail: AttendanceDetail | null;
  onClose: () => void;
  onRequestEdit?: (detail: AttendanceDetail) => void;
}

const STATUS_BADGE: Record<AttendanceStatus, { bg: string; color: string; label: string }> = {
  "결근":     { bg: '#FFEAE6', color: '#FF3D3D', label: '결근' },
  "근무전":   { bg: '#F7F7F8', color: '#AAB4BF', label: '근무전' },
  "근무중":   { bg: '#ECFFF1', color: '#1EDC83', label: '근무중' },
  "미등록":   { bg: '#F7F7F8', color: '#AAB4BF', label: '무일정' },
  "지각":     { bg: '#FFEEE2', color: '#FF862D', label: '지각' },
  "퇴근":     { bg: '#ECFFF1', color: '#1EDC83', label: '근무완료' },
  "근무완료": { bg: '#ECFFF1', color: '#1EDC83', label: '근무완료' },
  "휴가":     { bg: '#F7F7F8', color: '#AAB4BF', label: '휴가' },
  "휴무":     { bg: '#F7F7F8', color: '#AAB4BF', label: '휴무' },
  "휴게중":   { bg: '#FFEEE2', color: '#FF862D', label: '휴게중' },
};

const SHIFT_BADGE: Record<string, { bg: string; color: string }> = {
  "오픈": { bg: '#FDF9DF', color: '#FFB300' },
  "미들": { bg: '#ECFFF1', color: '#1EDC83' },
  "마감": { bg: '#E8F9FF', color: '#14C1FA' },
};

const badgeStyle = (bg: string, color: string) => ({
  display: 'inline-flex' as const, alignItems: 'center', justifyContent: 'center',
  height: '24px', borderRadius: '4px', padding: '0 8px',
  fontSize: '13px', fontWeight: 500, backgroundColor: bg, color,
  border: 'none' as const,
});

const AttendanceDetailSheet = ({ open, detail, onClose, onRequestEdit }: AttendanceDetailSheetProps) => {
  if (!detail) return null;

  const isLate = detail.isLate || detail.status === "지각";
  const isDisabled = detail.status === "근무중" || detail.status === "근무전" || detail.status === "휴게중" || (detail.status === "지각" && !detail.isClosed);
  const isBeforeWork = detail.status === "근무전" || (detail.status === "지각" && !detail.isClosed && detail.startTime === "00:00");
  const isNoRecord = detail.status === "결근" || detail.status === "휴가" || detail.status === "휴무" || detail.status === "미등록";
  const hideShiftTypes = detail.status === "결근" || detail.status === "휴가" || detail.status === "휴무";

  const startTimeHighlight = isLate && detail.startTime !== "00:00";
  const endTimeHighlight = detail.overtimeMinutes > 0;

  const startTimeColor = isLate ? "#FF862D" : isNoRecord ? "#AAB4BF" : "#19191B";
  const endTimeColor = isNoRecord ? "#AAB4BF" : endTimeHighlight ? "#7488FE" : "#AAB4BF";

  const badge = STATUS_BADGE[detail.status];

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-6 pt-6 border-0 bg-white [&>button]:hidden" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-[16px]">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
              {detail.year}년 {detail.month}월 {detail.date}일 ({detail.dayOfWeek})
            </h2>
            {!hideShiftTypes && detail.shiftTypes?.map((st) => (
              <span key={st} style={badgeStyle(SHIFT_BADGE[st].bg, SHIFT_BADGE[st].color)}>{st}</span>
            ))}
          </div>
          <div>
            <button onClick={onClose} className="pressable p-1">
              <X className="h-5 w-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* 콘텐츠 */}
        <div>
          {/* 상태 배지 */}
          <div className="flex items-center gap-2 mb-0 flex-wrap">
            {isLate && (
              <>
                <span style={badgeStyle('#FFEEE2', '#FF862D')}>지각</span>
                <span style={badgeStyle('#ECFFF1', '#1EDC83')}>근무완료</span>
              </>
            )}
            {!isLate && (detail.status === "근무완료" || detail.status === "퇴근") && (
              <>
                {detail.overtimeMinutes > 0 && (
                  <span style={badgeStyle('#E8F3FF', '#7488FE')}>연장</span>
                )}
                <span style={badgeStyle('#ECFFF1', '#1EDC83')}>근무완료</span>
              </>
            )}
            {!isLate && detail.status !== "근무완료" && detail.status !== "퇴근" && (
              <span style={badgeStyle(badge.bg, badge.color)}>{badge.label}</span>
            )}
          </div>

          {/* Large time display */}
          <div className="flex items-baseline gap-1 flex-wrap">
            <span style={{ fontSize: '32px', fontWeight: 700, color: startTimeColor }}>
              {detail.startTime}
            </span>
            <span style={{ fontSize: '32px', fontWeight: 700, color: '#AAB4BF', margin: '0 4px' }}>-</span>
            <span style={{ fontSize: '32px', fontWeight: 700, color: endTimeColor }}>
              {detail.endTime}
            </span>
            <span className="text-sm text-muted-foreground ml-1">(휴게 {detail.breakMinutes}분)</span>
          </div>

          {/* Divider */}
          <div className="border-t border-border my-4" />

          {/* Detail rows */}
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">출근</span>
              <div className="flex items-center gap-1.5">
                {isLate && detail.startTime !== "00:00" && detail.lateMinutes && detail.lateMinutes > 0 && (
                  <span style={{ fontSize: '12px', color: '#AAB4BF' }}>({detail.lateMinutes}분 지각)</span>
                )}
                <span className="text-sm font-medium" style={{ color: startTimeHighlight && !isNoRecord ? '#FF862D' : '#AAB4BF' }}>
                  {detail.startTime}
                </span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">퇴근</span>
              <span className="text-sm font-medium" style={{ color: endTimeHighlight && !isNoRecord ? '#7488FE' : '#AAB4BF' }}>
                {detail.endTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">추가근무</span>
              <span className="text-sm font-medium" style={{ color: detail.overtimeMinutes > 0 ? '#7488FE' : '#AAB4BF' }}>
                {detail.overtimeMinutes > 0 ? `+${detail.overtimeMinutes}m` : `${detail.overtimeMinutes}m`}
              </span>
            </div>
          </div>
        </div>

        {/* Action button — 항상 하단 고정 */}
        <div className="flex-shrink-0 mt-6">
          <button
            disabled={isDisabled || isBeforeWork}
            onClick={() => onRequestEdit && onRequestEdit(detail)}
            className="pressable w-full h-14 rounded-2xl text-lg font-semibold"
            style={{
              backgroundColor: isDisabled || isBeforeWork ? '#F7F7F8' : '#4261FF',
              color: isDisabled || isBeforeWork ? '#AAB4BF' : '#FFFFFF',
            }}
          >
            근무 기록 수정 요청하기
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export type { AttendanceDetail, AttendanceStatus };
export default AttendanceDetailSheet;