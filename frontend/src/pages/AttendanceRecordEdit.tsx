import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronDown, X, Check } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { requestWorkLogChange } from "@/api/employee";

type EditStep = "reason" | "detail";

interface ReasonOption {
  label: string;
  value: string;
}

const REASON_OPTIONS: ReasonOption[] = [
  { label: "출·퇴근 시간 변경", value: "time_change" },
  { label: "휴게 시간 추가/변경", value: "break_change" },
];

const UNREGISTERED_REASON_OPTIONS: ReasonOption[] = [
  { label: "근무 누락", value: "missing_work" },
];

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

/* ─── Time Picker Bottom Sheet ─── */
interface TimePickerSheetProps {
  open: boolean;
  title: string;
  value: string;
  onClose: () => void;
  onConfirm: (time: string) => void;
}

const TimePickerSheet = ({ open, title, value, onClose, onConfirm }: TimePickerSheetProps) => {
  const [selectedHour, setSelectedHour] = useState(value.split(":")[0]);
  const [selectedMinute, setSelectedMinute] = useState(value.split(":")[1]);
  const hourRef = useRef<HTMLDivElement>(null);
  const minuteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedHour(value.split(":")[0]);
      setSelectedMinute(value.split(":")[1]);
      setTimeout(() => {
        const hIdx = HOURS.indexOf(value.split(":")[0]);
        const mIdx = MINUTES.indexOf(value.split(":")[1]);
        hourRef.current?.scrollTo({ top: hIdx * 44 - 88, behavior: "auto" });
        minuteRef.current?.scrollTo({ top: mIdx * 44 - 88, behavior: "auto" });
      }, 50);
    }
  }, [open, value]);

  if (!open) return null;

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, items: string[], setter: (v: string) => void) => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / 44);
    const clamped = Math.max(0, Math.min(items.length - 1, idx));
    setter(items[clamped]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card px-6 pb-8 pt-6 shadow-xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 relative h-[220px]">
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[44px] bg-[hsl(var(--secondary))] rounded-xl pointer-events-none z-0" />

          <div
            ref={hourRef}
            className="relative z-10 h-[220px] w-[80px] overflow-y-auto snap-y snap-mandatory"
            style={{ scrollSnapType: "y mandatory" }}
            onScroll={() => handleScroll(hourRef, HOURS, setSelectedHour)}
          >
            <div className="h-[88px]" />
            {HOURS.map((h) => {
              const hIdx = HOURS.indexOf(h);
              const selIdx = HOURS.indexOf(selectedHour);
              const style = h === selectedHour
                ? "text-foreground font-bold"
                : hIdx > selIdx
                  ? "text-muted-foreground/40"
                  : "text-muted-foreground/40";
              return (
                <div
                  key={h}
                  className={`h-[44px] flex items-center justify-center text-[18px] font-semibold snap-center ${style}`}
                >
                  {h}
                </div>
              );
            })}
            <div className="h-[88px]" />
          </div>

          <span className="relative z-10 text-[20px] font-bold text-foreground">:</span>

          <div
            ref={minuteRef}
            className="relative z-10 h-[220px] w-[80px] overflow-y-auto snap-y snap-mandatory"
            style={{ scrollSnapType: "y mandatory" }}
            onScroll={() => handleScroll(minuteRef, MINUTES, setSelectedMinute)}
          >
            <div className="h-[88px]" />
            {MINUTES.map((m) => {
              const mIdx = MINUTES.indexOf(m);
              const selIdx = MINUTES.indexOf(selectedMinute);
              const style = m === selectedMinute
                ? "text-foreground font-bold"
                : mIdx > selIdx
                  ? "text-muted-foreground/40"
                  : "text-muted-foreground/40";
              return (
                <div
                  key={m}
                  className={`h-[44px] flex items-center justify-center text-[18px] font-semibold snap-center ${style}`}
                >
                  {m}
                </div>
              );
            })}
            <div className="h-[88px]" />
          </div>
        </div>

        <button
          onClick={() => onConfirm(`${selectedHour}:${selectedMinute}`)}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-primary text-primary-foreground mt-4"
        >
          확인
        </button>
      </div>
    </div>
  );
};

/* ─── Minute Picker Bottom Sheet ─── */
interface MinutePickerSheetProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (minutes: string) => void;
}

const MinutePickerSheet = ({ open, value, onClose, onConfirm }: MinutePickerSheetProps) => {
  const minuteItems = Array.from({ length: 121 }, (_, i) => String(i));
  const [selected, setSelected] = useState(value || "0");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelected(value || "0");
      setTimeout(() => {
        const idx = parseInt(value || "0", 10);
        scrollRef.current?.scrollTo({ top: idx * 44 - 88, behavior: "auto" });
      }, 50);
    }
  }, [open, value]);

  if (!open) return null;

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / 44);
    const clamped = Math.max(0, Math.min(minuteItems.length - 1, idx));
    setSelected(minuteItems[clamped]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card px-6 pb-8 pt-6 shadow-xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">휴게 시간 선택</h2>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center justify-center gap-2 relative h-[220px]">
          <div className="absolute top-1/2 left-4 right-4 -translate-y-1/2 h-[44px] bg-[hsl(var(--secondary))] rounded-xl pointer-events-none z-0" />

          <div
            ref={scrollRef}
            className="relative z-10 h-[220px] w-[80px] overflow-y-auto snap-y snap-mandatory"
            style={{ scrollSnapType: "y mandatory" }}
            onScroll={handleScroll}
          >
            <div className="h-[88px]" />
            {minuteItems.map((m) => {
              const style = m === selected ? "text-foreground font-bold" : "text-muted-foreground/40";
              return (
                <div
                  key={m}
                  className={`h-[44px] flex items-center justify-center text-[18px] font-semibold snap-center ${style}`}
                >
                  {m}
                </div>
              );
            })}
            <div className="h-[88px]" />
          </div>
          <span className="relative z-10 text-[16px] font-bold text-foreground">분</span>
        </div>

        <button
          onClick={() => onConfirm(selected)}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-primary text-primary-foreground mt-4"
        >
          확인
        </button>
      </div>
    </div>
  );
};

/* ─── Reason Input Bottom Sheet ─── */
interface ReasonInputSheetProps {
  open: boolean;
  value: string;
  onClose: () => void;
  onConfirm: (text: string) => void;
}

const ReasonInputSheet = ({ open, value, onClose, onConfirm }: ReasonInputSheetProps) => {
  const [text, setText] = useState(value);

  useEffect(() => {
    if (open) setText(value);
  }, [open, value]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-t-3xl bg-card px-6 pb-8 pt-6 shadow-xl animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground">변경 요청 사유 입력</h2>
          <button onClick={onClose} className="p-1">
            <X className="h-5 w-5 text-foreground" />
          </button>
        </div>

        <div className="relative mb-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, 50))}
            placeholder="변경 사유를 입력해 주세요"
            className="w-full border border-border rounded-xl px-4 py-3.5 text-[15px] text-foreground placeholder:text-muted-foreground resize-none h-[200px] focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
        <p className="text-right text-[13px] text-muted-foreground mb-6">{text.length}/50</p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 h-12 rounded-xl bg-[hsl(var(--secondary))] text-primary font-semibold text-[15px]"
          >
            취소
          </button>
          <button
            disabled={!text.trim()}
            onClick={() => onConfirm(text)}
            className={`flex-1 h-12 rounded-xl font-semibold text-[15px] ${text.trim()
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
          >
            입력하기
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Component ─── */
const AttendanceRecordEdit = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const detail = location.state?.detail;

  const isUnregistered = detail?.status === "미등록";
  const isMissingWorkFlow = detail?.status === "미등록" || detail?.status === "결근" || detail?.status === "휴무";

  const [step, setStep] = useState<EditStep>("reason");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [reasonSheetOpen, setReasonSheetOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [startTime, setStartTime] = useState(isUnregistered ? "" : (detail?.startTime || "07:50"));
  const [endTime, setEndTime] = useState(isUnregistered ? "" : (detail?.endTime || "13:10"));
  const [changeReason, setChangeReason] = useState("");

  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [timePickerTarget, setTimePickerTarget] = useState<"start" | "end">("start");

  const [breakMinutes, setBreakMinutes] = useState<string>(String(detail?.breakMinutes || 0));
  const [breakReason, setBreakReason] = useState("");

  const [minutePickerOpen, setMinutePickerOpen] = useState(false);

  const [reasonInputOpen, setReasonInputOpen] = useState(false);
  const [reasonInputTarget, setReasonInputTarget] = useState<"change" | "break" | "unregistered">("change");

  const reasonOptions = isMissingWorkFlow ? UNREGISTERED_REASON_OPTIONS : REASON_OPTIONS;
  const selectedReasonLabel = reasonOptions.find(r => r.value === selectedReason)?.label || "";

  const SHIFT_BADGE_STYLE: Record<string, { bg: string; color: string }> = {
    "오픈": { bg: '#FDF9DF', color: '#FFB300' },
    "미들": { bg: '#ECFFF1', color: '#1EDC83' },
    "마감": { bg: '#E8F9FF', color: '#14C1FA' },
  };

  const allShiftLabels: ("오픈" | "미들" | "마감")[] = detail?.shiftTypes ?? [];

  const STATUS_LABEL: Partial<Record<string, { bg: string; color: string; label: string }>> = {
    "휴무": { bg: '#FFE8E8', color: '#FF5959', label: '휴무' },
    "결근": { bg: '#FFEAE6', color: '#FF3D3D', label: '결근' },
    "휴가": { bg: '#F7F7F8', color: '#AAB4BF', label: '휴가' },
  };

  const ShiftBadges = () => {
    if (isUnregistered) {
      return <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: '#F7F7F8', color: '#AAB4BF' }}>무일정</span>;
    }
    const statusBadge = STATUS_LABEL[detail?.status ?? ""];
    if (statusBadge) {
      return <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: statusBadge.bg, color: statusBadge.color }}>{statusBadge.label}</span>;
    }
    if (allShiftLabels.length > 0) {
      return <>{allShiftLabels.map((st: string) => (
        <span key={st} className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: SHIFT_BADGE_STYLE[st]?.bg, color: SHIFT_BADGE_STYLE[st]?.color }}>{st}</span>
      ))}</>;
    }
    return null;
  };

  const formatAmPm = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    return h < 12 ? `오전 ${time}` : `오후 ${String(h > 12 ? h - 12 : h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  const handleNext = () => {
    if (step === "reason" && selectedReason) setStep("detail");
  };

  const handleSubmit = () => setConfirmOpen(true);

  const handleConfirm = async () => {
    setConfirmOpen(false);
    toast({ description: "수정 요청이 완료 되었어요", duration: 2000 });

    const dateStr = detail
      ? `${detail.year}-${String(detail.month).padStart(2, "0")}-${String(detail.date).padStart(2, "0")}`
      : "";

    try {
      await requestWorkLogChange({
        store_id: Number(localStorage.getItem("currentStoreId") ?? 1),
        type: isMissingWork ? "근무 누락" : isBreakChange ? "휴게 시간 변경" : "출·퇴근 시간 변경",
        date: dateStr,
        origin_start: isMissingWork ? undefined : detail?.startTime,
        origin_end: isMissingWork ? undefined : detail?.endTime,
        desired_start: startTime || "00:00",
        desired_end: endTime || "00:00",
        desired_break: isBreakChange || isMissingWork ? String(breakMinutes) : undefined,
        reason: changeReason || breakReason || "",
      });

      toast({ description: "수정 요청이 완료 되었어요", duration: 2000 });

      navigate("/attendance");

    } catch (e: any) {
      if (e.message?.startsWith("409")) {
        toast({ description: "이미 해당 날짜에 요청한 내역이 있어요.", variant: "destructive", duration: 2000 });
        navigate("/attendance");
      } else {
        toast({ description: "수정 요청에 실패했어요. 다시 시도해주세요", variant: "destructive", duration: 2000 });
      }
    }
  };

  const openTimePicker = (target: "start" | "end") => {
    setTimePickerTarget(target);
    setTimePickerOpen(true);
  };

  const handleTimeConfirm = (time: string) => {
    if (timePickerTarget === "start") setStartTime(time);
    else setEndTime(time);
    setTimePickerOpen(false);
  };

  const dateLabel = detail
    ? `${detail.year}.${String(detail.month).padStart(2, "0")}.${String(detail.date).padStart(2, "0")} (${detail.dayOfWeek})`
    : "2025.10.20 (월)";

  const isBreakChange = selectedReason === "break_change";
  const isMissingWork = selectedReason === "missing_work";

  const getCanSubmit = () => {
    if (isMissingWork) return !!startTime && !!endTime;
    if (isBreakChange) return breakMinutes !== "" && breakMinutes !== "0";
    return true;
  };
  const canSubmit = getCanSubmit();

  const openReasonInput = (target: "change" | "break" | "unregistered") => {
    setReasonInputTarget(target);
    setReasonInputOpen(true);
  };

  const handleReasonInputConfirm = (text: string) => {
    if (reasonInputTarget === "change") setChangeReason(text);
    else if (reasonInputTarget === "break") setBreakReason(text);
    else setChangeReason(text);
    setReasonInputOpen(false);
  };

  const currentReasonText = reasonInputTarget === "break" ? breakReason : changeReason;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => step === "detail" ? setStep("reason") : navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 className="text-lg font-bold text-foreground">{isMissingWorkFlow ? "근무 기록 수정" : "근무 기록 수정 요청"}</h1>
      </div>

      <div className="flex-1 px-5 pt-6 overflow-y-auto">
        {step === "reason" ? (
          <>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">근무 기록 수정 사유를</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-8">선택해 주세요</h2>

            <p className="text-sm text-muted-foreground mb-3">선택한 일정</p>
            <div className="bg-[hsl(var(--secondary))] rounded-xl px-4 py-3 flex items-center gap-2 mb-8 flex-wrap">
              <ShiftBadges />
              <span className="text-[15px] font-semibold text-foreground">{dateLabel}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              수정 요청 사유 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button
              onClick={() => setReasonSheetOpen(true)}
              className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 text-left"
            >
              <span className={`text-[15px] ${selectedReason ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                {selectedReason ? selectedReasonLabel : "수정 요청 사유 선택"}
              </span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>
          </>
        ) : isMissingWork ? (
          <>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">근무 기록 수정 사유를</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-8">선택해 주세요</h2>

            <p className="text-sm text-muted-foreground mb-3">선택한 일정</p>
            <div className="bg-[hsl(var(--secondary))] rounded-xl px-4 py-3 flex items-center gap-2 mb-8 flex-wrap">
              <ShiftBadges />
              <span className="text-[15px] font-semibold text-foreground">{dateLabel}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              출근 시간 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button onClick={() => openTimePicker("start")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-4 text-left">
              <span className={`text-[15px] ${startTime ? "text-foreground" : "text-muted-foreground"}`}>
                {startTime ? formatAmPm(startTime) : "출근 시간 선택"}
              </span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>

            <p className="text-sm text-muted-foreground mb-2">
              퇴근 시간 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button onClick={() => openTimePicker("end")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-4 text-left">
              <span className={`text-[15px] ${endTime ? "text-foreground" : "text-muted-foreground"}`}>
                {endTime ? formatAmPm(endTime) : "퇴근 시간 선택"}
              </span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>

            <p className="text-sm text-muted-foreground mb-2">휴게 시간</p>
            <button onClick={() => setMinutePickerOpen(true)} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-4 text-left">
              <span className="text-[15px] text-foreground">{breakMinutes}</span>
              <span className="text-[15px] text-muted-foreground">분</span>
            </button>

            <p className="text-sm text-muted-foreground mb-2">변경 요청 사유</p>
            <button onClick={() => openReasonInput("unregistered")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 text-left">
              <span className={`text-[15px] ${changeReason ? "text-foreground" : "text-muted-foreground"}`}>
                {changeReason || "변경 요청 사유 입력"}
              </span>
            </button>
            {changeReason && <p className="text-right text-[13px] text-muted-foreground mt-1">{changeReason.length}/100</p>}
          </>
        ) : isBreakChange ? (
          <>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">추가/변경할 휴게 시간을</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-8">선택해 주세요</h2>

            <p className="text-sm text-muted-foreground mb-3">선택한 일정</p>
            <div className="bg-[hsl(var(--secondary))] rounded-xl px-4 py-3 flex items-center gap-2 mb-8 flex-wrap">
              <ShiftBadges />
              <span className="text-[15px] font-semibold text-foreground">{dateLabel}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              등록 휴게 시간 변경 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button onClick={() => setMinutePickerOpen(true)} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-6 text-left">
              <span className="text-[15px] text-[hsl(var(--status-late))] font-medium">{breakMinutes}</span>
              <span className="text-[15px] text-muted-foreground">분</span>
            </button>

            <p className="text-sm text-muted-foreground mb-2">변경 요청 사유</p>
            <button onClick={() => openReasonInput("break")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 text-left">
              <span className={`text-[15px] ${breakReason ? "text-foreground" : "text-muted-foreground"}`}>
                {breakReason || "변경 요청 사유 입력"}
              </span>
            </button>
            {breakReason && <p className="text-right text-[13px] text-muted-foreground mt-1">{breakReason.length}/100</p>}
          </>
        ) : (
          <>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-1">변경할 시간을</h2>
            <h2 className="text-[22px] font-bold text-foreground leading-tight mb-8">선택해 주세요</h2>

            <p className="text-sm text-muted-foreground mb-3">선택한 일정</p>
            <div className="bg-[hsl(var(--secondary))] rounded-xl px-4 py-3 flex items-center gap-2 mb-8 flex-wrap">
              <ShiftBadges />
              <span className="text-[15px] font-semibold text-foreground">{dateLabel}</span>
            </div>

            <p className="text-sm text-muted-foreground mb-2">
              출근 시간 변경 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button onClick={() => openTimePicker("start")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-6 text-left">
              <span className="text-[15px] text-foreground">{formatAmPm(startTime)}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>

            <p className="text-sm text-muted-foreground mb-2">
              퇴근 시간 변경 <span className="text-[hsl(var(--destructive))]">*</span>
            </p>
            <button onClick={() => openTimePicker("end")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 mb-6 text-left">
              <span className="text-[15px] text-[hsl(var(--status-late))]">{formatAmPm(endTime)}</span>
              <ChevronDown className="h-5 w-5 text-muted-foreground" />
            </button>

            <p className="text-sm text-muted-foreground mb-2">변경 요청 사유</p>
            <button onClick={() => openReasonInput("change")} className="w-full flex items-center justify-between border border-border rounded-xl px-4 py-3.5 text-left">
              <span className={`text-[15px] ${changeReason ? "text-foreground" : "text-muted-foreground"}`}>
                {changeReason || "변경 요청 사유 입력"}
              </span>
            </button>
            {changeReason && <p className="text-right text-[13px] text-muted-foreground mt-1">{changeReason.length}/100</p>}
          </>
        )}
      </div>

      {/* Bottom button */}
      <div className="px-5 pb-8 pt-4">
        {step === "reason" ? (
          <button
            disabled={!selectedReason}
            onClick={handleNext}
            className={`w-full h-14 rounded-2xl text-lg font-semibold ${selectedReason ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            다음
          </button>
        ) : (
          <button
            disabled={!canSubmit}
            onClick={handleSubmit}
            className={`w-full h-14 rounded-2xl text-lg font-semibold ${canSubmit ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
          >
            수정 요청하기
          </button>
        )}
      </div>

      <TimePickerSheet
        open={timePickerOpen}
        title={timePickerTarget === "start" ? "출근 시간 선택" : "퇴근 시간 선택"}
        value={timePickerTarget === "start" ? (startTime || "08:00") : (endTime || "13:00")}
        onClose={() => setTimePickerOpen(false)}
        onConfirm={handleTimeConfirm}
      />

      <MinutePickerSheet
        open={minutePickerOpen}
        value={breakMinutes}
        onClose={() => setMinutePickerOpen(false)}
        onConfirm={(m) => { setBreakMinutes(m); setMinutePickerOpen(false); }}
      />

      <ReasonInputSheet
        open={reasonInputOpen}
        value={currentReasonText}
        onClose={() => setReasonInputOpen(false)}
        onConfirm={handleReasonInputConfirm}
      />

      {/* Reason selection bottom sheet */}
      {reasonSheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50" onClick={() => setReasonSheetOpen(false)}>
          <div
            className="w-full max-w-lg rounded-t-3xl bg-card px-6 pb-8 pt-6 shadow-xl animate-in slide-in-from-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">수정 요청 사유 선택</h2>
              <button onClick={() => setReasonSheetOpen(false)} className="p-1">
                <X className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <div className="space-y-2">
              {reasonOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => { setSelectedReason(option.value); setReasonSheetOpen(false); }}
                  className={`w-full text-left px-4 py-4 rounded-xl text-[15px] font-medium flex items-center justify-between ${selectedReason === option.value ? "bg-[hsl(var(--secondary))] text-primary" : "text-foreground"}`}
                >
                  <span>{option.label}</span>
                  {selectedReason === option.value && <Check className="h-5 w-5 text-primary" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Confirm dialog */}
      <ConfirmDialog open={confirmOpen} onOpenChange={setConfirmOpen} title="근무 기록 수정 요청하기"
        description={<>근무 기록 수정을 요청하시겠어요?<br />사장님이 확인 후 요청이 처리돼요</>}
        buttons={[{ label: "취소", onClick: () => setConfirmOpen(false), variant: "cancel" }, { label: "요청하기", onClick: handleConfirm }]} />
    </div>
  );
};

export default AttendanceRecordEdit;