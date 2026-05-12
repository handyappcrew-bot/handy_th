import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";

type RequestType = "휴가 요청" | "일정 변경 요청";
type FilterType = "전체" | "휴가 요청" | "일정 변경 요청";
type ShiftType = "오픈" | "미들" | "마감";

interface ScheduleEntry {
  shift: ShiftType;
  date: string;
  dayLabel: string;
  time: string;
}

interface VacationRequest {
  type: "휴가 요청";
  id: string;
  staffName: string;
  staffGender: string;
  staffAge: number;
  staffEmploymentType: string;
  staffAvatarColor: string;
  dateRange: string;
  totalDays: number;
  entries: ScheduleEntry[];
  reason: string;
}

interface ChangeRequest {
  type: "일정 변경 요청";
  id: string;
  staffName: string;
  staffGender: string;
  staffAge: number;
  staffEmploymentType: string;
  staffAvatarColor: string;
  originalEntries: ScheduleEntry[];
  newEntries: ScheduleEntry[];
}

type ScheduleRequest = VacationRequest | ChangeRequest;

const SHIFT_BADGE: Record<ShiftType, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
};

export const MOCK_REQUESTS: ScheduleRequest[] = [
  {
    type: "휴가 요청",
    id: "vr1",
    staffName: "문자영",
    staffGender: "여",
    staffAge: 22,
    staffEmploymentType: "알바생",
    staffAvatarColor: "#C0392B",
    dateRange: "2026년 11월 15~18일",
    totalDays: 4,
    entries: [
      { shift: "오픈", date: "26.11.15", dayLabel: "일", time: "8:00 - 13:00" },
      { shift: "오픈", date: "26.11.16", dayLabel: "월", time: "8:00 - 13:00" },
      { shift: "미들", date: "26.11.29", dayLabel: "화", time: "8:00 - 13:00" },
      { shift: "마감", date: "26.11.29", dayLabel: "수", time: "17:00 - 22:00" },
    ],
    reason: "호주로 가족여행 가용..\n수민언니랑 일정 바꿨어용 승인해주세용",
  },
  {
    type: "일정 변경 요청",
    id: "cr1",
    staffName: "문자영",
    staffGender: "여",
    staffAge: 22,
    staffEmploymentType: "알바생",
    staffAvatarColor: "#C0392B",
    originalEntries: [
      { shift: "오픈", date: "26.11.15", dayLabel: "일", time: "8:00 - 13:00" },
    ],
    newEntries: [
      { shift: "오픈", date: "26.11.12", dayLabel: "목", time: "8:00 - 13:00" },
    ],
  },
];

function ShiftEntryRow({ entry }: { entry: ScheduleEntry }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${SHIFT_BADGE[entry.shift]}`} style={{ flexShrink: 0 }}>
        {entry.shift}
      </span>
      <span style={{ fontSize: "13px", color: "#70737B", letterSpacing: "-0.02em" }}>
        {entry.date} ({entry.dayLabel})
      </span>
      <span style={{ fontSize: "13px", color: "#AAB4BF" }}>|</span>
      <span style={{ fontSize: "13px", color: "#70737B", letterSpacing: "-0.02em" }}>{entry.time}</span>
    </div>
  );
}

export default function ScheduleChangeRequestTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ScheduleRequest[]>(MOCK_REQUESTS);
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");
  const [confirmPopup, setConfirmPopup] = useState<{
    open: boolean;
    type: "approve" | "reject";
    requestId: string;
  }>({ open: false, type: "approve", requestId: "" });

  const filteredRequests = activeFilter === "전체"
    ? requests
    : requests.filter((r) => r.type === activeFilter);

  useEffect(() => { onCountChange?.(requests.length); }, [requests.length]);

  const filterCounts = {
    "전체": requests.length,
    "휴가 요청": requests.filter((r) => r.type === "휴가 요청").length,
    "일정 변경 요청": requests.filter((r) => r.type === "일정 변경 요청").length,
  };

  const handleConfirm = () => {
    const isApprove = confirmPopup.type === "approve";
    setRequests((prev) => prev.filter((r) => r.id !== confirmPopup.requestId));
    toast({
      description: isApprove ? "일정 변경 요청이 수락 되었어요." : "일정 변경 요청이 거절 되었어요.",
      duration: 2000,
      variant: isApprove ? "default" : "destructive",
    });
    setConfirmPopup({ open: false, type: "approve", requestId: "" });
  };

  const targetRequest = requests.find((r) => r.id === confirmPopup.requestId);
  const popupTypeLabel = targetRequest?.type === "휴가 요청" ? "휴가 요청" : "일정 변경 요청";

  if (requests.length === 0) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "80px 0" }}>
        <p style={{ fontSize: "14px", color: "#9EA3AD" }}>일정 변경 요청 내역이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <div style={{ backgroundColor: "#F7F7F8", minHeight: "100vh" }}>

        {/* Filter chips */}
        <div className="flex px-5 py-3 overflow-x-auto" style={{ gap: "8px" }}>
          {([
            { key: "전체" as FilterType,          label: `전체 ${filterCounts["전체"]}` },
            { key: "휴가 요청" as FilterType,      label: `휴가 ${filterCounts["휴가 요청"]}` },
            { key: "일정 변경 요청" as FilterType, label: `일정 변경 ${filterCounts["일정 변경 요청"]}` },
          ]).map(({ key, label }) => {
            const isActive = activeFilter === key;
            return (
              <button key={key} onClick={() => setActiveFilter(key)} className="pressable"
                style={{
                  height: "28px", borderRadius: "9999px", padding: "0 14px",
                  whiteSpace: "nowrap", flexShrink: 0,
                  fontSize: "14px", fontWeight: 600, letterSpacing: "-0.02em",
                  backgroundColor: isActive ? "#E8F3FF" : "#FFFFFF",
                  color: isActive ? "#4261FF" : "#AAB4BF",
                  border: `1px solid ${isActive ? "#4261FF" : "#DBDCDF"}`,
                }}>
                {label}
              </button>
            );
          })}
        </div>

        {/* Request cards */}
        <div className="flex flex-col gap-4 px-5">
          {filteredRequests.map((req) => (
            <div key={req.id} className="rounded-2xl bg-white p-5" style={{ boxShadow: "2px 2px 12px rgba(0,0,0,0.06)" }}>

              {/* 타입 배지 */}
              <div className="flex items-center justify-between mb-4">
                <span style={{
                  display: "inline-flex", alignItems: "center",
                  height: "20px", borderRadius: "4px", padding: "0 8px",
                  fontSize: "11px", fontWeight: 500,
                  backgroundColor: "#E8F3FF", color: "#4261FF",
                }}>
                  {req.type}
                </span>
              </div>

              {/* 요청 직원 */}
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>요청 직원</p>
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: req.staffAvatarColor,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "15px", fontWeight: 700, color: "#FFFFFF",
                }}>
                  {req.staffName.charAt(0)}
                </div>
                <div>
                  <p style={{ fontSize: "15px", fontWeight: 600, color: "#19191B", letterSpacing: "-0.02em" }}>{req.staffName}</p>
                  <p style={{ fontSize: "12px", color: "#9EA3AD", marginTop: "2px" }}>
                    {req.staffGender} · {req.staffAge}세 · {req.staffEmploymentType}
                  </p>
                </div>
              </div>

              {req.type === "휴가 요청" && (
                <>
                  {/* 휴가 요청 일정 */}
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>휴가 요청 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: "#F0F7FF" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#4261FF", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                      {req.dateRange} <span style={{ color: "#4261FF" }}>(총 {req.totalDays}일)</span>
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {req.entries.map((entry, i) => (
                        <ShiftEntryRow key={i} entry={entry} />
                      ))}
                    </div>
                  </div>

                  {/* 휴가 요청 사유 */}
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "4px" }}>휴가 요청 사유</p>
                  <p style={{ fontSize: "13px", fontWeight: 400, color: "#70737B", letterSpacing: "-0.02em", whiteSpace: "pre-line", marginBottom: "16px" }}>{req.reason}</p>
                </>
              )}

              {req.type === "일정 변경 요청" && (
                <>
                  {/* 기존 일정 */}
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>기존 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: "#F7F7F8" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {req.originalEntries.map((entry, i) => (
                        <ShiftEntryRow key={i} entry={entry} />
                      ))}
                    </div>
                  </div>

                  {/* 변경 일정 */}
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>변경 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "#F0F7FF" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {req.newEntries.map((entry, i) => (
                        <ShiftEntryRow key={i} entry={entry} />
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* 승인/거절 버튼 */}
              <div style={{ height: "1px", backgroundColor: "#F0F0F0", margin: "0 -20px 12px" }} />
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setConfirmPopup({ open: true, type: "reject", requestId: req.id })}
                  style={{
                    flex: 1, height: "48px", borderRadius: "10px", border: "none", cursor: "pointer",
                    backgroundColor: "#DEEBFF", color: "#4261FF",
                    fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em",
                  }}>
                  거절하기
                </button>
                <button
                  onClick={() => setConfirmPopup({ open: true, type: "approve", requestId: req.id })}
                  style={{
                    flex: 1, height: "48px", borderRadius: "10px", border: "none", cursor: "pointer",
                    backgroundColor: "#4261FF", color: "#FFFFFF",
                    fontSize: "16px", fontWeight: 700, letterSpacing: "-0.02em",
                  }}>
                  승인하기
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Confirm popup */}
      {confirmPopup.open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={() => setConfirmPopup({ open: false, type: "approve", requestId: "" })}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: "320px", width: "calc(100% - 48px)", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "#19191B", textAlign: "center", marginBottom: "8px" }}>
              {confirmPopup.type === "approve" ? `${popupTypeLabel} 승인하기` : `${popupTypeLabel} 거절하기`}
            </h3>
            <p style={{ fontSize: "14px", fontWeight: 400, letterSpacing: "-0.02em", color: "#70737B", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" }}>
              {confirmPopup.type === "approve" ? `${popupTypeLabel}을 승인하시겠어요?` : `${popupTypeLabel}을 거절하시겠어요?`}
            </p>
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              <button onClick={() => setConfirmPopup({ open: false, type: "approve", requestId: "" })}
                className="pressable flex-1 font-semibold"
                style={{ height: "52px", backgroundColor: "#EBEBEB", color: "#70737B", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "16px" }}>
                취소
              </button>
              <button onClick={handleConfirm}
                className="pressable flex-1 font-semibold"
                style={{ height: "52px", backgroundColor: "#4261FF", color: "#FFFFFF", borderRadius: "12px", border: "none", cursor: "pointer", fontSize: "16px" }}>
                {confirmPopup.type === "approve" ? "승인하기" : "거절하기"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
