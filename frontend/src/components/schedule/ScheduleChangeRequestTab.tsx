import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { createPortal } from "react-dom";

type FilterType = "전체" | "휴가 요청" | "일정 변경 요청";

interface ScheduleRequest {
  id: number;
  employee_name: string;
  type: "schedule_change" | "vacation";
  status: string;
  origin_date: string | null;
  origin_start: string | null;
  origin_end: string | null;
  desired_date: string;
  desired_start: string | null;
  desired_end: string | null;
  reason: string | null;
  created_at: string;
}

export const MOCK_REQUESTS: ScheduleRequest[] = [];

const typeLabel = (type: string) => type === "vacation" ? "휴가 요청" : "일정 변경 요청";

export default function ScheduleChangeRequestTab({ onCountChange }: { onCountChange?: (count: number) => void }) {
  const { toast } = useToast();
  const [requests, setRequests] = useState<ScheduleRequest[]>([]);
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");
  const [confirmPopup, setConfirmPopup] = useState<{
    open: boolean;
    type: "approve" | "reject";
    requestId: number;
  }>({ open: false, type: "approve", requestId: 0 });

  useEffect(() => {
    const storeId = localStorage.getItem("currentStoreId");
    if (!storeId) return;
    fetch(`/api/owner/store/${storeId}/schedule-requests`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : [])
      .then((data: ScheduleRequest[]) => setRequests(data))
      .catch(() => {});
  }, []);

  useEffect(() => { onCountChange?.(requests.length); }, [requests.length]);

  const filteredRequests = activeFilter === "전체"
    ? requests
    : requests.filter(r => typeLabel(r.type) === activeFilter);

  const filterCounts = {
    "전체": requests.length,
    "휴가 요청": requests.filter(r => r.type === "vacation").length,
    "일정 변경 요청": requests.filter(r => r.type === "schedule_change").length,
  };

  const handleConfirm = () => {
    const storeId = localStorage.getItem("currentStoreId");
    const isApprove = confirmPopup.type === "approve";
    fetch(`/api/owner/store/${storeId}/schedule-requests/${confirmPopup.requestId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status: isApprove ? 'approved' : 'rejected' }),
    }).then(() => {
      setRequests(prev => prev.filter(r => r.id !== confirmPopup.requestId));
      toast({
        description: isApprove ? "일정 변경 요청이 수락 되었어요." : "일정 변경 요청이 거절 되었어요.",
        duration: 2000,
        variant: isApprove ? "default" : "destructive",
      });
    }).catch(() => {
      toast({ description: "처리 중 오류가 발생했어요.", duration: 2000, variant: "destructive" });
    });
    setConfirmPopup({ open: false, type: "approve", requestId: 0 });
  };

  const targetRequest = requests.find(r => r.id === confirmPopup.requestId);

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
            { key: "전체" as FilterType, label: `전체 ${filterCounts["전체"]}` },
            { key: "휴가 요청" as FilterType, label: `휴가 ${filterCounts["휴가 요청"]}` },
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
                  {typeLabel(req.type)}
                </span>
              </div>

              {/* 요청 직원 */}
              <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>요청 직원</p>
              <div className="flex items-center gap-3 mb-4">
                <div style={{
                  width: "40px", height: "40px", borderRadius: "50%", flexShrink: 0,
                  backgroundColor: "#4261FF",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "15px", fontWeight: 700, color: "#FFFFFF",
                }}>
                  {req.employee_name?.charAt(0) ?? '?'}
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, color: "#19191B", letterSpacing: "-0.02em" }}>{req.employee_name}</p>
              </div>

              {req.type === "vacation" && (
                <>
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>휴가 요청 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: "#F0F7FF" }}>
                    <p style={{ fontSize: "13px", fontWeight: 500, color: "#4261FF", letterSpacing: "-0.02em" }}>
                      {req.desired_date?.replace(/-/g, '.')}
                      {req.desired_start && req.desired_end && ` (${req.desired_start} - ${req.desired_end})`}
                    </p>
                  </div>
                  {req.reason && (
                    <>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "4px" }}>휴가 요청 사유</p>
                      <p style={{ fontSize: "13px", color: "#70737B", letterSpacing: "-0.02em", whiteSpace: "pre-line", marginBottom: "16px" }}>{req.reason}</p>
                    </>
                  )}
                </>
              )}

              {req.type === "schedule_change" && (
                <>
                  {req.origin_date && (
                    <>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>기존 일정</p>
                      <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: "#F7F7F8" }}>
                        <p style={{ fontSize: "13px", color: "#70737B", letterSpacing: "-0.02em" }}>
                          {req.origin_date?.replace(/-/g, '.')}
                          {req.origin_start && req.origin_end && ` (${req.origin_start} - ${req.origin_end})`}
                        </p>
                      </div>
                    </>
                  )}
                  <p style={{ fontSize: "13px", fontWeight: 500, color: "#AAB4BF", letterSpacing: "-0.02em", marginBottom: "6px" }}>변경 일정</p>
                  <div className="rounded-xl px-4 py-3 mb-4" style={{ backgroundColor: "#F0F7FF" }}>
                    <p style={{ fontSize: "13px", color: "#4261FF", letterSpacing: "-0.02em" }}>
                      {req.desired_date?.replace(/-/g, '.')}
                      {req.desired_start && req.desired_end && ` (${req.desired_start} - ${req.desired_end})`}
                    </p>
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
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={() => setConfirmPopup({ open: false, type: "approve", requestId: 0 })}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: "320px", width: "calc(100% - 48px)", backgroundColor: "#FFFFFF", borderRadius: "20px", display: "flex", flexDirection: "column", alignItems: "center", padding: "28px 16px 16px" }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, letterSpacing: "-0.02em", color: "#19191B", textAlign: "center", marginBottom: "8px" }}>
              {confirmPopup.type === "approve" ? `${typeLabel(targetRequest?.type ?? 'schedule_change')} 승인하기` : `${typeLabel(targetRequest?.type ?? 'schedule_change')} 거절하기`}
            </h3>
            <p style={{ fontSize: "14px", letterSpacing: "-0.02em", color: "#70737B", textAlign: "center", marginBottom: "20px", lineHeight: "1.5" }}>
              {confirmPopup.type === "approve" ? "승인하시겠어요?" : "거절하시겠어요?"}
            </p>
            <div style={{ display: "flex", gap: "8px", width: "100%" }}>
              <button onClick={() => setConfirmPopup({ open: false, type: "approve", requestId: 0 })}
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
