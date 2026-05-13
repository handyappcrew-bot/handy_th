import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ChevronLeft, Edit2, X, Share2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { staffStore, deriveListFields, ShiftType } from "@/lib/staffStore";

type FilterType = "전체" | "오픈" | "미들" | "마감";

const SHIFT_STYLE: Record<ShiftType, { bg: string; text: string }> = {
  "오픈": { bg: '#FDF9DF', text: '#FFB300' },
  "미들": { bg: '#ECFFF1', text: '#1EDC83' },
  "마감": { bg: '#E8F9FF', text: '#14C1FA' },
};

interface JoinRequest {
  id: number;
  member_id: number;
  name: string;
  gender: string;
  birth: string;
  phone: string;
  avatarColor: string;
  requestedAt: string;
  bank?: string;
  account_name?: string;
  account_number?: string;
}

export default function StaffManagement() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = (searchParams.get("tab") as "관리" | "가입요청" | "초대") || "관리";
  const [activeTab, setActiveTab] = useState<"관리" | "가입요청" | "초대">(initialTab);
  const [activeFilter, setActiveFilter] = useState<FilterType>("전체");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [confirmPopup, setConfirmPopup] = useState<{ open: boolean; type: "accept" | "reject"; requestId: number }>({ open: false, type: "accept", requestId: 0 });
  const [focusedMemoId, setFocusedMemoId] = useState<string | null>(null);
  const [memoSheetOpen, setMemoSheetOpen] = useState(false);
  const [memoSheetStaffId, setMemoSheetStaffId] = useState<string | null>(null);
  const [memoInput, setMemoInput] = useState("");

  const [, forceUpdate] = useState(0);
  useEffect(() => {
    const storeId = Number(localStorage.getItem("currentStoreId") ?? 0);
    if (storeId) staffStore.loadFromApi(storeId);
    return staffStore.subscribe(() => forceUpdate(n => n + 1));
  }, []);

  const AVATAR_COLORS = ["#4261FF", "#FF6B6B", "#1EDC83", "#FF9F43", "#A29BFE", "#FD79A8"];
  const fetchJoinRequests = async () => {
    const storeId = Number(localStorage.getItem("currentStoreId") ?? 0);
    if (!storeId) return;
    try {
      const res = await fetch(`/api/owner/store/${storeId}/member-requests`, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setJoinRequests(data.map((r: any, i: number) => ({
        id: r.id,
        member_id: r.member_id,
        name: r.name,
        gender: r.gender === "male" ? "남자" : r.gender === "female" ? "여자" : r.gender ?? "",
        birth: r.birth ?? "",
        phone: r.phone ?? "",
        avatarColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
        requestedAt: r.created_at ? r.created_at.slice(0, 10) : "",
        bank: r.bank ?? "",
        account_name: r.account_name ?? "",
        account_number: r.account_number ?? "",
      })));
    } catch {}
  };

  useEffect(() => { fetchJoinRequests(); }, []);
  useEffect(() => { if (activeTab === "가입요청") fetchJoinRequests(); }, [activeTab]);

  const staffData = staffStore.getAll();

  const SHIFT_ORDER: Record<string, number> = { "오픈": 0, "미들": 1, "마감": 2 };
  const sortedStaff = [...staffData].sort((a, b) => {
    const aNew = a.isNew;
    const bNew = b.isNew;
    const aEmpty = !a.hireDate && !a.isNew;
    const bEmpty = !b.hireDate && !b.isNew;
    const aLeave = a.workStatus === "휴직";
    const bLeave = b.workStatus === "휴직";
    const aGhost = a.workStatus === "앱탈퇴";
    const bGhost = b.workStatus === "앱탈퇴";

    if (aNew && !bNew) return -1;
    if (!aNew && bNew) return 1;
    if (aGhost && !bGhost) return 1;
    if (!aGhost && bGhost) return -1;
    if (aEmpty && !bEmpty) return -1;
    if (!aEmpty && bEmpty) return 1;
    if (aLeave && !bLeave) return 1;
    if (!aLeave && bLeave) return -1;

    if (!aLeave && !bLeave) {
      const aShifts = deriveListFields(a).shifts;
      const bShifts = deriveListFields(b).shifts;
      const aMin = aShifts.length ? Math.min(...aShifts.map(s => SHIFT_ORDER[s] ?? 99)) : 99;
      const bMin = bShifts.length ? Math.min(...bShifts.map(s => SHIFT_ORDER[s] ?? 99)) : 99;
      if (aMin !== bMin) return aMin - bMin;
    }
    return a.name.localeCompare(b.name, "ko");
  });

  const filteredStaff = activeFilter === "전체"
    ? sortedStaff
    : sortedStaff.filter(s => deriveListFields(s).shifts.includes(activeFilter as ShiftType));

  const filterCounts = {
    "전체": staffData.filter(s => s.workStatus !== "앱탈퇴").length,
    "오픈": staffData.filter(s => s.workStatus !== "앱탈퇴" && deriveListFields(s).shifts.includes("오픈")).length,
    "미들": staffData.filter(s => s.workStatus !== "앱탈퇴" && deriveListFields(s).shifts.includes("미들")).length,
    "마감": staffData.filter(s => s.workStatus !== "앱탈퇴" && deriveListFields(s).shifts.includes("마감")).length,
  };
  const hasJoinRequests = joinRequests.length > 0;
  const { toast } = useToast();

  const handleInvite = async () => {
    const storeId = Number(localStorage.getItem("currentStoreId") ?? 0);

    let storeCode = "";
    let storeName = "";
    if (storeId) {
      try {
        const res = await fetch(`/api/owner/store/${storeId}`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          storeCode = String(data.code ?? "");
          storeName = data.name ?? "";
        }
      } catch {}
    }

    const shareText = storeCode
      ? `[핸디] ${storeName} 매장에 초대합니다!\n앱 가입 후 아래 매장 코드를 입력해주세요.\n\n매장 코드: ${storeCode}\n\n${window.location.origin}`
      : `사장님이 근무 관리 앱 핸디에 초대했어요. 아래 링크로 가입해주세요!\n\n${window.location.origin}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "핸디 직원 초대", text: shareText });
      } catch (e) {
        // 사용자 취소 무시
      }
    } else {
      try {
        await navigator.clipboard.writeText(shareText);
        toast({ description: "초대 링크가 클립보드에 복사되었어요.", duration: 2000 });
      } catch {
        toast({ description: "공유 기능을 지원하지 않는 환경이에요.", duration: 2000 });
      }
    }
  };

  const handleConfirm = async () => {
    const isAccept = confirmPopup.type === "accept";
    const req = joinRequests.find(r => r.id === confirmPopup.requestId);
    const storeId = Number(localStorage.getItem("currentStoreId") ?? 0);

    setConfirmPopup({ open: false, type: "accept", requestId: 0 });

    try {
      const res = await fetch(`/api/owner/store/${storeId}/member-requests/${confirmPopup.requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: isAccept ? "approved" : "rejected" }),
      });
      if (!res.ok) {
        toast({ description: "처리에 실패했습니다.", duration: 2000, variant: "destructive" });
        return;
      }
    } catch {
      toast({ description: "서버 통신 오류가 발생했습니다.", duration: 2000, variant: "destructive" });
      return;
    }

    setJoinRequests(prev => prev.filter(r => r.id !== confirmPopup.requestId));

    if (isAccept) {
      staffStore.loadFromApi(storeId);
      setTimeout(() => setActiveTab("관리"), 300);
    }

    toast({ description: isAccept ? "가입 요청을 승인했어요" : "가입 요청을 거절했어요", duration: 2000, variant: isAccept ? "default" : "destructive" });
  };

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#F7F7F8' }}>
      <div className="pb-24">
        {/* Header */}
        <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="flex items-center gap-2 px-2 pt-4 pb-2">
            <button onClick={() => navigate("/owner/home")} className="pressable p-1">
              <ChevronLeft className="h-6 w-6 text-foreground" />
            </button>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>직원 관리</h1>
          </div>
          <div className="flex border-b border-border px-5" style={{ gap: '24px' }}>
            {(["관리", "가입요청", "초대"] as const).map(tab => {
              const label = tab === "관리" ? "직원 관리" : tab === "가입요청" ? `가입요청 ${joinRequests.length}건` : "직원 초대하기";
              return (
                <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative whitespace-nowrap"
                  style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
                  {tab === "가입요청" && hasJoinRequests && <span className="inline-block w-1.5 h-1.5 rounded-full bg-destructive mr-1 mb-2" />}
                  {label}
                  {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {activeTab === "관리" && (
          <>
            <div className="flex px-5 py-3 overflow-x-auto" style={{ gap: '8px' }}>
              {(["전체", "오픈", "미들", "마감"] as FilterType[]).map(filter => {
                const isActive = activeFilter === filter;
                return (
                  <button key={filter} onClick={() => setActiveFilter(filter)} className="pressable"
                    style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: isActive ? '#E8F3FF' : '#FFFFFF', color: isActive ? '#4261FF' : '#AAB4BF', border: `1px solid ${isActive ? '#4261FF' : '#DBDCDF'}` }}>
                    {filter} {filterCounts[filter]}명
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col gap-3 px-5">
              {filteredStaff.map(staff => {
                const { workDays, shifts, salary } = deriveListFields(staff);
                const isNew = staff.isNew;
                const isGhost = staff.workStatus === "앱탈퇴";
                const isEmpty = !staff.hireDate && !isNew && !isGhost;
                const cardBorder = isNew
                  ? '2px solid #4261FF'
                  : isGhost ? '1.5px dashed #C8CDD6'
                  : isEmpty ? '1.5px dashed #DBDCDF' : 'none';
                const cardShadow = isNew
                  ? '0 0 0 4px rgba(66,97,255,0.12), 2px 2px 12px rgba(0,0,0,0.06)'
                  : isEmpty || isGhost ? 'none' : '2px 2px 12px rgba(0,0,0,0.06)';
                return (
                  <div key={staff.id}
                    onClick={e => { if ((e.target as HTMLElement).closest('[data-memo]')) return; navigate(`/owner/staff/${staff.id}`); }}
                    className="bg-card rounded-2xl text-left w-full active:scale-[0.98] transition-transform cursor-pointer"
                    style={{ padding: '16px', boxShadow: cardShadow, opacity: isGhost ? 0.6 : staff.workStatus === '휴직' ? 0.75 : 1, border: cardBorder, backgroundColor: isNew ? '#F5F7FF' : isGhost ? '#F7F8FA' : undefined }}>

                    <div style={{ display: 'flex', gap: '20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                        <div style={{ position: 'relative' }}>
                          <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: staff.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                            {staff.name.charAt(0)}
                          </div>
                          {staff.workStatus === '휴직' && (
                            <span style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#FF9800', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '1px 6px', whiteSpace: 'nowrap' }}>휴직</span>
                          )}
                          {isNew && (
                            <span style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#4261FF', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '1px 6px', whiteSpace: 'nowrap' }}>신규</span>
                          )}
                          {isEmpty && (
                            <span style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#9EA3AD', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '1px 6px', whiteSpace: 'nowrap' }}>미등록</span>
                          )}
                          {isGhost && (
                            <span style={{ position: 'absolute', bottom: '-4px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#70737B', color: '#FFFFFF', fontSize: '10px', fontWeight: 700, borderRadius: '999px', padding: '1px 6px', whiteSpace: 'nowrap' }}>앱탈퇴</span>
                          )}
                        </div>
                        <p style={{ fontSize: 'clamp(14px, 3.7vw, 16px)', fontWeight: 600, color: isNew ? '#4261FF' : isGhost ? '#70737B' : '#19191B', marginTop: '10px', textAlign: 'center' }}>{staff.name}</p>
                        {isEmpty ? (
                          <span style={{ display: 'inline-block', marginTop: '4px', backgroundColor: '#FFF3E0', color: '#FF8F00', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.01em' }}>정보 미등록</span>
                        ) : isNew ? (
                          <span style={{ display: 'inline-block', marginTop: '4px', backgroundColor: 'rgba(66,97,255,0.1)', color: '#4261FF', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.01em' }}>신규 직원</span>
                        ) : isGhost ? (
                          <span style={{ display: 'inline-block', marginTop: '4px', backgroundColor: '#EAECEF', color: '#70737B', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', fontWeight: 700, letterSpacing: '-0.01em' }}>앱 탈퇴</span>
                        ) : (
                          <p style={{ fontSize: 'clamp(11px, 3vw, 12px)', fontWeight: 500, color: '#9EA3AD', textAlign: 'center' }}>({staff.gender} · {staff.age}세 · {staff.employmentType})</p>
                        )}
                      </div>

                      <div style={{ flex: 1 }}>
                        {isGhost ? (
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '10px', paddingTop: '4px' }}>
                            <p style={{ fontSize: '13px', fontWeight: 600, color: '#70737B', margin: 0 }}>직원이 앱을 탈퇴했어요</p>
                            <p style={{ fontSize: '12px', color: '#9EA3AD', margin: 0, lineHeight: '1.6' }}>급여 지급 내역 등을 확인한 후<br />퇴사 처리를 완료해주세요</p>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px', paddingLeft: '10px', paddingRight: '10px', borderRadius: '6px', backgroundColor: '#EAECEF', width: 'fit-content' }}>
                              <span style={{ fontSize: '11px', fontWeight: 700, color: '#70737B' }}>퇴사 처리하기 →</span>
                            </div>
                          </div>
                        ) : (isEmpty || isNew) ? (
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%', gap: '8px', paddingTop: '4px' }}>
                            {isNew ? (
                              <>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#4261FF', margin: 0 }}>가입 요청이 수락된 신규 직원이에요</p>
                                <p style={{ fontSize: '12px', color: '#70737B', margin: 0, lineHeight: '1.5' }}>고용 형태 · 급여 · 근무일을<br />등록해야 급여 계산이 시작돼요</p>
                                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '28px', paddingLeft: '10px', paddingRight: '10px', borderRadius: '6px', backgroundColor: '#4261FF', width: 'fit-content' }}>
                                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#FFFFFF' }}>계약 정보 등록하기 →</span>
                                </div>
                              </>
                            ) : (
                              <>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#FF8F00', margin: 0 }}>계약 정보 등록이 필요해요</p>
                                <p style={{ fontSize: '13px', color: '#9EA3AD', margin: 0 }}>입사일 · 급여 · 근무일을 등록해주세요</p>
                              </>
                            )}
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                              {shifts.map(shift => (
                                <span key={shift} style={{ backgroundColor: SHIFT_STYLE[shift].bg, color: SHIFT_STYLE[shift].text, borderRadius: '4px', padding: '2px 8px', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em' }}>
                                  {shift}
                                </span>
                              ))}
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                                <span style={{ color: '#70737B', whiteSpace: 'nowrap', flexShrink: 0 }}>근무일</span>
                                <span style={{ color: '#19191B' }}>{workDays}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                                <span style={{ color: '#70737B', whiteSpace: 'nowrap', flexShrink: 0 }}>입사일</span>
                                <span style={{ color: '#19191B' }}>{staff.hireDate}</span>
                                <span style={{ color: '#4261FF', whiteSpace: 'nowrap' }}>(+{staff.hireDaysAgo}일)</span>
                              </div>
                              <div style={{ display: 'flex', gap: '6px', fontSize: '14px', fontWeight: 500 }}>
                                <span style={{ color: '#70737B', whiteSpace: 'nowrap', flexShrink: 0 }}>{salary.split(/\s+/)[0]}</span>
                                <span style={{ color: '#19191B', whiteSpace: 'nowrap' }}>{salary.split(/\s+/).slice(1).join(' ')}</span>
                                <span style={{ color: '#70737B', whiteSpace: 'nowrap' }}>급여일</span>
                                <span style={{ color: '#19191B', whiteSpace: 'nowrap' }}>{staff.payDay}</span>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Memo */}
                    <div
                      data-memo
                      onClick={e => { e.stopPropagation(); setMemoSheetStaffId(staff.id); setMemoInput(staff.memo); setMemoSheetOpen(true); }}
                      style={{ marginTop: '16px', backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: `1px solid ${focusedMemoId === staff.id ? '#4261FF' : '#DBDCDF'}`, cursor: 'pointer', transition: 'border-color 0.15s' }}
                      onMouseDown={() => setFocusedMemoId(staff.id)}
                      onMouseUp={() => setTimeout(() => setFocusedMemoId(null), 200)}
                      onMouseLeave={() => setFocusedMemoId(null)}
                    >
                      <span style={{ fontSize: 'clamp(12px, 3.5vw, 14px)', color: staff.memo ? '#19191B' : '#9EA3AD' }}>{staff.memo || '메모를 입력해주세요'}</span>
                      <Edit2 className="w-4 h-4 text-muted-foreground/50" />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {activeTab === "가입요청" && (
          <div style={{ padding: '12px 20px' }}>
            {joinRequests.length > 0 ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', height: '28px', borderRadius: '9999px', padding: '0 14px', fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: '#E8F3FF', color: '#4261FF', border: '1px solid #4261FF', marginBottom: '12px' }}>
                  전체 {joinRequests.length}명
                </span>
                <div className="flex flex-col gap-3">
                  {joinRequests.map(req => (
                    <div key={req.id} style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', paddingTop: '16px', paddingLeft: '16px', paddingRight: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: req.avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 700, color: '#FFFFFF', flexShrink: 0 }}>
                          {req.name.charAt(0)}
                        </div>
                        <div style={{ flex: 1, marginLeft: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '52px', height: '21px', backgroundColor: '#E8F3FF', borderRadius: '4px', fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#4261FF' }}>가입 요청</span>
                            <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#AAB4BF' }}>{req.requestedAt}</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', marginTop: '4px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: '#292B2E' }}>{req.name}</span>
                            <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', marginLeft: '8px' }}>{req.gender}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '12px', marginLeft: '16px', marginRight: '16px', height: '0.5px', backgroundColor: '#DBDCDF' }} />
                      <div style={{ paddingLeft: '16px', paddingRight: '16px', paddingTop: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#292B2E', width: '56px', flexShrink: 0 }}>생년월일</span>
                          <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', marginLeft: '20px' }}>{req.birth}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <span style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: '#292B2E', width: '56px', flexShrink: 0 }}>전화번호</span>
                          <span style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', marginLeft: '20px' }}>{req.phone}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', marginTop: '12px', marginLeft: '16px', marginRight: '16px', marginBottom: '16px', gap: '8px' }}>
                        <button onClick={() => setConfirmPopup({ open: true, type: "reject", requestId: req.id })}
                          style={{ flex: 1, height: '48px', backgroundColor: '#DEEBFF', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#4261FF', cursor: 'pointer' }}>
                          거절하기
                        </button>
                        <button onClick={() => setConfirmPopup({ open: true, type: "accept", requestId: req.id })}
                          style={{ flex: 1, height: '48px', backgroundColor: '#4261FF', borderRadius: '10px', border: 'none', fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#FFFFFF', cursor: 'pointer' }}>
                          승인하기
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center py-20">
                <p className="text-muted-foreground text-[14px]">가입 요청이 없습니다</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "초대" && (
          <div style={{ padding: '12px 20px' }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '2px 2px 16px rgba(0,0,0,0.06)' }}>
              <div style={{ width: '72px', height: '72px', borderRadius: '50%', backgroundColor: '#E8F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                <Share2 style={{ width: '32px', height: '32px', color: '#4261FF' }} />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', marginBottom: '8px', textAlign: 'center' }}>직원을 초대해보세요</h2>
              <p style={{ fontSize: '14px', color: '#70737B', textAlign: 'center', lineHeight: '1.6', marginBottom: '24px' }}>
                초대 링크를 공유하면 직원이 앱에서<br />가입 요청을 보낼 수 있어요
              </p>
              <button onClick={handleInvite}
                style={{ width: '100%', height: '52px', borderRadius: '14px', backgroundColor: '#4261FF', border: 'none', fontSize: '16px', fontWeight: 700, color: '#FFFFFF', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}>
                <Share2 style={{ width: '18px', height: '18px' }} />
                초대 링크 공유하기
              </button>
              <p style={{ fontSize: '12px', color: '#AAB4BF', textAlign: 'center', lineHeight: '1.5' }}>
                {'카카오톡, 문자, AirDrop 등\n다양한 방법으로 공유할 수 있어요'}
              </p>
            </div>

            <div style={{ marginTop: '16px', backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', boxShadow: '2px 2px 12px rgba(0,0,0,0.04)' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#19191B', marginBottom: '14px' }}>초대 방법 안내</h3>
              {[
                { step: '1', text: '초대 링크 공유하기 버튼을 눌러요' },
                { step: '2', text: '카카오톡 · 문자 등으로 직원에게 링크를 보내요' },
                { step: '3', text: '직원이 링크로 앱에 가입하면 가입요청 탭에 노출돼요' },
                { step: '4', text: '사장님이 승인하면 직원 관리가 시작돼요 🎉' },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: '#E8F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#4261FF' }}>{step}</span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.5', paddingTop: '2px' }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 메모 바텀시트 */}
      {memoSheetOpen && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setMemoSheetOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-card shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4">
              <h3 className="text-[17px] font-bold text-foreground">메모 입력하기</h3>
              <button className="pressable p-1" onClick={() => setMemoSheetOpen(false)}><X className="w-5 h-5 text-foreground" /></button>
            </div>
            <div className="px-5 pb-8">
              <div className="relative mb-3">
                <textarea value={memoInput} onChange={e => { if (e.target.value.length <= 50) setMemoInput(e.target.value); }}
                  placeholder="등록하실 메모를 입력해 주세요" rows={5} autoFocus
                  className="w-full text-[14px] text-foreground bg-transparent outline-none border border-border rounded-xl px-4 py-3 resize-none" />
                <span className="absolute bottom-4 right-4 text-[12px] text-muted-foreground">{memoInput.length}/50</span>
              </div>
              <button
                onClick={() => {
                  if (memoSheetStaffId) staffStore.update(memoSheetStaffId, { memo: memoInput });
                  setMemoSheetOpen(false);
                }}
                className="pressable w-full py-4 bg-primary text-primary-foreground rounded-2xl text-[16px] font-bold">
                입력완료
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 가입요청 팝업 */}
      {confirmPopup.open && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80" onClick={() => setConfirmPopup({ open: false, type: "accept", requestId: 0 })}>
          <div className="animate-in zoom-in-95" style={{ maxWidth: '320px', width: 'calc(100% - 48px)', backgroundColor: '#FFFFFF', borderRadius: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 16px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', textAlign: 'center', marginBottom: '8px' }}>
              {confirmPopup.type === "accept" ? "가입 요청 승인하기" : "가입 요청 거절하기"}
            </h3>
            <p style={{ fontSize: '14px', fontWeight: 400, letterSpacing: '-0.02em', color: '#70737B', textAlign: 'center', marginBottom: '20px', lineHeight: '1.5' }}>
              {confirmPopup.type === "accept" ? "가입요청을 승인하시겠어요?" : "가입요청을 거절하시겠어요?"}
            </p>
            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
              <button onClick={() => setConfirmPopup({ open: false, type: "accept", requestId: 0 })} className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#EBEBEB', color: '#70737B', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleConfirm} className="pressable flex-1 font-semibold"
                style={{ height: '52px', backgroundColor: '#4261FF', color: '#FFFFFF', borderRadius: '12px', fontSize: '16px', border: 'none', cursor: 'pointer' }}>
                {confirmPopup.type === "accept" ? "승인하기" : "거절하기"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}