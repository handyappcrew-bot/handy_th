import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, X, CalendarClock, Palmtree, Trash2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import BottomNav from "@/components/home/employee/BottomNav";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getMySchedule, getAllSchedule, getAllScheduleDetail, getScheduleChange, deleteScheduleChange } from "@/api/schedule";
import { getMyStores } from "@/api/public";

type TabType = "my" | "all" | "requests";
type RequestStatus = "대기중" | "승인" | "거절";
type ScheduleRequestType = "일정 변경 요청" | "휴가 요청";

interface ScheduleRequest {
  id: string;
  requestStatus: RequestStatus;
  requestType: ScheduleRequestType;
  requestedAt: number;
  date: string;
  original?: { date: string; startTime?: string; endTime?: string };
  desired?: { date: string; startTime?: string; endTime?: string };
  reason: string;
}

interface MyScheduleData {
  work_start: string | null;
  work_end: string | null;
  is_holiday: boolean;
  part_name: "오픈" | "미들" | "마감" | null;
}

type AllStaffSummary = Record<string, Record<string, number>>;

interface PartDetail {
  part_id: number;
  part_name: string;
  start_time: string;
  end_time: string;
  employees: { id: number; name: string }[];
}

const DAYS_KR = ["일", "월", "화", "수", "목", "금", "토"];

const typeStyle = {
  open: { bg: '#FDF9DF', text: '#FFB300' },
  middle: { bg: '#ECFFF1', text: '#1EDC83' },
  close: { bg: '#E8F9FF', text: '#14C1FA' },
  vacation: { bg: '#F7F7F8', text: '#AAB4BF' },
};

const getPartStyle = (partName?: "오픈" | "미들" | "마감" | null) => {
  if (partName === "오픈") return typeStyle.open;
  if (partName === "미들") return typeStyle.middle;
  if (partName === "마감") return typeStyle.close;
  return typeStyle.open;
};

const shiftTagStyle = {
  open: { bg: typeStyle.open.bg, text: typeStyle.open.text },
  middle: { bg: typeStyle.middle.bg, text: typeStyle.middle.text },
  close: { bg: typeStyle.close.bg, text: typeStyle.close.text },
};

const REQUEST_STATUS_STYLE: Record<RequestStatus, { bg: string; color: string }> = {
  "대기중": { bg: '#FDF9DF', color: '#FFB300' },
  "승인": { bg: '#ECFFF1', color: '#1EDC83' },
  "거절": { bg: '#FFEAE6', color: '#FF3D3D' },
};
const REQUEST_TYPE_STYLE = { bg: '#E8F3FF', color: '#4261FF' };

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

const badgeStyle = (bg: string, color: string) => ({
  display: 'inline-flex' as const, alignItems: 'center', justifyContent: 'center',
  height: '20px', borderRadius: '4px', padding: '0 8px',
  fontSize: '11px', fontWeight: 500, backgroundColor: bg, color,
});

const Schedule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<TabType>("my");
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [scheduleRequests, setScheduleRequests] = useState<ScheduleRequest[]>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"전체" | "일정 변경" | "휴가">("전체");

  const [storeId, setStoreId] = useState<number | null>(null);

  // 나의 일정
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [mySchedule, setMySchedule] = useState<Record<string, MyScheduleData>>({});

  // 전체 직원 - 캘린더 셀 summary
  const [allStaffSummary, setAllStaffSummary] = useState<AllStaffSummary>({});
  const [allSummaryLoading, setAllSummaryLoading] = useState(false);

  // 전체 직원 - 바텀시트 상세
  const [allStaffDetail, setAllStaffDetail] = useState<PartDetail[] | null>(null);
  const [allDetailLoading, setAllDetailLoading] = useState(false);

  // 변경 요청 내역
  const [requestsLoading, setRequestsLoading] = useState(false);

  const today = new Date();
  const isToday = (year: number, month: number, date: number) =>
    today.getFullYear() === year && today.getMonth() === month && today.getDate() === date;

  const calendarDays = getCalendarDays(currentYear, currentMonth);
  const weeks: typeof calendarDays[] = [];
  for (let i = 0; i < calendarDays.length; i += 7) weeks.push(calendarDays.slice(i, i + 7));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 (${DAYS_KR[d.getDay()]})`;
  };

  const formatTime = (timeStr: string | null) => timeStr ? timeStr.slice(0, 5) : undefined;

  // auth 초기화
  useEffect(() => {
    const init = async () => {
      try {
        const stores = await getMyStores();
        if (stores.length > 0) setStoreId(stores[0].store_id);
      } catch {
        navigate("/");
      }
    };
    init();
  }, []);

  // 나의 일정 API
  useEffect(() => {
    if (activeTab !== "my" || !storeId) return;
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      try {
        const data = await getMySchedule(storeId, currentYear, currentMonth + 1);
        setMySchedule(data);
      } catch (err) {
        console.error("일정 조회 실패:", err);
      } finally {
        setScheduleLoading(false);
      }
    };
    fetchSchedule();
  }, [currentYear, currentMonth, activeTab, storeId]);

  // 전체 직원 summary API
  useEffect(() => {
    if (activeTab !== "all" || !storeId) return;
    const fetchAll = async () => {
      setAllSummaryLoading(true);
      try {
        const data = await getAllSchedule(storeId, currentYear, currentMonth + 1);
        setAllStaffSummary(data);
      } catch (err) {
        console.error("전체 직원 summary 조회 실패:", err);
      } finally {
        setAllSummaryLoading(false);
      }
    };
    fetchAll();
  }, [currentYear, currentMonth, activeTab, storeId]);

  // 변경 요청 내역 API
  useEffect(() => {
    if (activeTab !== "requests" || !storeId) return;
    const fetchRequests = async () => {
      setRequestsLoading(true);
      try {
        const data = await getScheduleChange(storeId);  // employee_id 제거
        const mapped: ScheduleRequest[] = data.map((r: any, idx: number) => ({
          id: String(r.id),
          requestStatus: r.status === "pending" ? "대기중" : r.status === "approved" ? "승인" : "거절",
          requestType: r.type === "vacation" ? "휴가 요청" : "일정 변경 요청",
          requestedAt: data.length - idx,
          date: r.type === "vacation" ? formatDate(r.desired_date) : formatDate(r.origin_date ?? r.desired_date),
          original: r.origin_date ? {
            date: formatDate(r.origin_date),
            startTime: formatTime(r.origin_start),
            endTime: formatTime(r.origin_end),
          } : undefined,
          desired: {
            date: formatDate(r.desired_date),
            startTime: formatTime(r.desired_start),
            endTime: formatTime(r.desired_end),
          },
          reason: r.reason,
        }));
        setScheduleRequests(mapped);
      } catch (err) {
        console.error("변경 요청 조회 실패:", err);
      } finally {
        setRequestsLoading(false);
      }
    };
    fetchRequests();
  }, [activeTab, storeId]);

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentYear(currentYear - 1); setCurrentMonth(11); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentYear(currentYear + 1); setCurrentMonth(0); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleDateClick = async (year: number, month: number, date: number, isOutside: boolean) => {
    if (isOutside || !storeId) return;
    setSelectedDate(getDateKey(year, month, date));
    setBottomSheetOpen(true);

    if (activeTab === "all") {
      setAllStaffDetail(null);
      setAllDetailLoading(true);
      try {
        const data = await getAllScheduleDetail(storeId, year, month + 1, date);
        setAllStaffDetail(data);
      } catch (err) {
        console.error("전체 직원 상세 조회 실패:", err);
      } finally {
        setAllDetailLoading(false);
      }
    }
  };

  const selectedSchedule = selectedDate ? mySchedule[selectedDate] : null;
  const selectedHoliday = selectedSchedule?.is_holiday === true;
  const selectedVacation = false;

  const formatSelectedDate = () => {
    if (!selectedDate) return "";
    const parts = selectedDate.split("-").map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2]);
    return `${parts[0]}년 ${parts[1]}월 ${parts[2]}일 (${DAYS_KR[d.getDay()]})`;
  };

  const calcHours = (start: string, end: string) => {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return (eh * 60 + em - sh * 60 - sm) / 60;
  };

  const filteredRequests = scheduleRequests
    .filter(r => {
      if (filterTab === "전체") return true;
      if (filterTab === "일정 변경") return r.requestType === "일정 변경 요청";
      if (filterTab === "휴가") return r.requestType === "휴가 요청";
      return true;
    })
    .sort((a, b) => {
      if (a.requestStatus === "대기중" && b.requestStatus !== "대기중") return -1;
      if (a.requestStatus !== "대기중" && b.requestStatus === "대기중") return 1;
      return b.requestedAt - a.requestedAt;
    });

  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    try {
      await deleteScheduleChange(deleteTargetId);
      setScheduleRequests(prev => prev.filter(r => r.id !== deleteTargetId));
    } catch (err) {
      console.error("삭제 실패:", err);
    } finally {
      setDeleteTargetId(null);
    }
  };

  const TAB_LABELS: Record<TabType, string> = {
    my: "나의 일정",
    all: "전체 직원 일정",
    requests: "변경 요청 내역",
  };

  const showCalendar = activeTab === "my" || activeTab === "all";
  const isCalendarLoading = activeTab === "my" ? scheduleLoading : allSummaryLoading;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-white pb-20">
      {/* Header + Tabs */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="flex items-center gap-2 px-2 pt-4 pb-2">
          <button onClick={() => navigate("/employee/home")} className="p-1">
            <ChevronLeft className="h-6 w-6 text-foreground" />
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>일정 확인</h1>
        </div>
        <div className="flex border-b border-border px-5 overflow-x-auto" style={{ gap: '24px' }}>
          {(["my", "all", "requests"] as TabType[]).map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className="py-3 relative whitespace-nowrap flex-shrink-0"
              style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
              {TAB_LABELS[tab]}
              {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
            </button>
          ))}
        </div>
      </div>

      {/* 캘린더 */}
      {showCalendar && (
        <>
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
              <div key={day} className="text-center pb-3"
                style={{ fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>
                {day}
              </div>
            ))}
          </div>

          <div className="px-3">
            {isCalendarLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-[#AAB4BF]">로딩 중...</div>
            ) : (
              weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 mb-1">
                  {week.map((d, di) => {
                    const key = getDateKey(d.year, d.month, d.date);
                    const scheduleData = !d.isOutside ? mySchedule[key] : null;
                    const isHoliday = scheduleData?.is_holiday === true;
                    const isTodayDate = !d.isOutside && isToday(d.year, d.month, d.date);
                    const isSun = di === 0;
                    const isSat = di === 6;
                    const partStyle = scheduleData ? getPartStyle(scheduleData.part_name) : typeStyle.open;
                    const partSummary = !d.isOutside ? allStaffSummary[key] : null;
                    const dateColor = d.isOutside ? '#AAB4BF' : isTodayDate ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#70737B';

                    return (
                      <button key={di} onClick={() => handleDateClick(d.year, d.month, d.date, d.isOutside)}
                        className="flex flex-col items-center py-1.5 w-full" style={{ minHeight: '90px' }} disabled={d.isOutside}>
                        <div style={{ height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '14px', fontWeight: 500, letterSpacing: '-0.02em', color: dateColor,
                            ...(isTodayDate ? { backgroundColor: '#4261FF', borderRadius: '10px', minWidth: '40px', width: '40px', height: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : {})
                          }}>
                            {d.date}
                          </span>
                        </div>

                        {activeTab === "my" && !d.isOutside && (
                          <div className="flex flex-col items-center w-full px-0.5">
                            {scheduleData && !isHoliday && scheduleData.work_start && (
                              <div className="flex flex-col items-center justify-center w-full"
                                style={{ backgroundColor: partStyle.bg, borderRadius: '4px', minHeight: '36px', padding: '2px 0' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: partStyle.text, lineHeight: '1.3' }}>{scheduleData.work_start}</span>
                                <span style={{ fontSize: '10px', color: partStyle.text, lineHeight: '1' }}>-</span>
                                <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: partStyle.text, lineHeight: '1.3' }}>{scheduleData.work_end}</span>
                              </div>
                            )}
                            {isHoliday && (
                              <div className="flex items-center justify-center w-full"
                                style={{ backgroundColor: '#FFE8E8', borderRadius: '4px', minHeight: '17px', height: '17px' }}>
                                <span style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', color: '#FF5959' }}>휴무</span>
                              </div>
                            )}
                          </div>
                        )}

                        {activeTab === "all" && !d.isOutside && (
                          <div className="flex flex-col w-full px-0.5" style={{ gap: '2px' }}>
                            {[
                              { name: "오픈", icon: <IconOpen />, style: typeStyle.open },
                              { name: "미들", icon: <IconMiddle />, style: typeStyle.middle },
                              { name: "마감", icon: <IconClose />, style: typeStyle.close },
                            ].map(({ name, icon, style }) =>
                              partSummary?.[name] ? (
                                <div key={name} style={{ backgroundColor: style.bg, borderRadius: '4px', padding: '0 4px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                                  <span style={{ display: 'flex', alignItems: 'center' }}>{icon}</span>
                                  <span style={{ fontSize: '11px', fontWeight: 600, color: style.text, lineHeight: 1 }}>{partSummary[name]}</span>
                                </div>
                              ) : null
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* 변경 요청 내역 탭 */}
      {activeTab === "requests" && (
        <div className="pb-8" style={{ backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
          <div className="flex px-5 py-3 overflow-x-auto" style={{ gap: '8px' }}>
            {(["전체", "일정 변경", "휴가"] as const).map((f) => {
              const isActive = filterTab === f;
              const label = f === "전체" ? `전체 ${scheduleRequests.length}` : f;
              return (
                <button key={f} onClick={() => setFilterTab(f)}
                  style={{ height: '28px', borderRadius: '9999px', padding: '0 14px', whiteSpace: 'nowrap', flexShrink: 0, fontSize: '14px', fontWeight: 600, letterSpacing: '-0.02em', backgroundColor: isActive ? '#E8F3FF' : '#FFFFFF', color: isActive ? '#4261FF' : '#AAB4BF', border: `1px solid ${isActive ? '#4261FF' : '#DBDCDF'}` }}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4 px-5">
            {requestsLoading ? (
              <div className="flex items-center justify-center py-20 text-sm text-[#AAB4BF]">로딩 중...</div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex items-center justify-center py-20 text-sm text-[#AAB4BF]">요청 내역이 없어요.</div>
            ) : (
              filteredRequests.map((req) => {
                const statusStyle = REQUEST_STATUS_STYLE[req.requestStatus];
                const canDelete = req.requestStatus === "승인" || req.requestStatus === "거절";
                const isVacation = req.requestType === "휴가 요청";
                return (
                  <div key={req.id} className="rounded-2xl bg-white p-5" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <span style={badgeStyle(statusStyle.bg, statusStyle.color)}>{req.requestStatus}</span>
                        <span style={badgeStyle(REQUEST_TYPE_STYLE.bg, REQUEST_TYPE_STYLE.color)}>{req.requestType}</span>
                      </div>
                      {canDelete && (
                        <button onClick={() => setDeleteTargetId(req.id)} className="p-1">
                          <Trash2 className="h-[18px] w-[18px]" style={{ color: '#AAB4BF' }} />
                        </button>
                      )}
                    </div>

                    {!isVacation && req.original && (
                      <>
                        <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '6px' }}>기존 일정</p>
                        <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: '#F7F7F8' }}>
                          <p style={{ fontSize: '13px', color: '#70737B', letterSpacing: '-0.02em' }}>
                            {req.original.date}{req.original.startTime && ` | ${req.original.startTime} - ${req.original.endTime}`}
                          </p>
                        </div>
                      </>
                    )}

                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '6px' }}>
                      {isVacation ? "휴가 요청 일정" : "변경 일정"}
                    </p>
                    <div className="rounded-xl px-4 py-3 mb-3" style={{ backgroundColor: '#F0F7FF' }}>
                      <p style={{ fontSize: '13px', color: '#4261FF', letterSpacing: '-0.02em' }}>
                        {req.desired?.date}{req.desired?.startTime && ` | ${req.desired.startTime} - ${req.desired.endTime}`}
                      </p>
                    </div>

                    <p style={{ fontSize: '13px', fontWeight: 500, color: '#AAB4BF', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                      {isVacation ? "휴가 요청 사유" : "변경 요청 사유"}
                    </p>
                    <p style={{ fontSize: '13px', fontWeight: 400, color: '#70737B', letterSpacing: '-0.02em' }}>{req.reason}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <Sheet open={bottomSheetOpen} onOpenChange={setBottomSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-6 pb-8 pt-6 border-0 bg-white [&>button]:hidden">
          <div className="flex items-start justify-between mb-6">
            <h2 className="text-[22px] font-bold text-foreground">{formatSelectedDate()}</h2>
            <button onClick={() => setBottomSheetOpen(false)} className="mt-1">
              <X className="h-6 w-6 text-foreground" />
            </button>
          </div>

          {activeTab === "my" ? (
            <div>
              <div className="flex items-center gap-3">
                {selectedSchedule && !selectedHoliday && selectedSchedule.work_start ? (
                  <>
                    <span className="rounded-full px-3 py-1 text-[13px] font-medium whitespace-nowrap" style={{
                      backgroundColor: getPartStyle(selectedSchedule.part_name).bg,
                      color: getPartStyle(selectedSchedule.part_name).text,
                    }}>
                      {selectedSchedule.part_name ?? "근무"}
                    </span>
                    <span className="text-[15px] text-foreground">
                      {selectedSchedule.work_start} - {selectedSchedule.work_end} (총 {calcHours(selectedSchedule.work_start, selectedSchedule.work_end!)}시간)
                    </span>
                  </>
                ) : selectedVacation ? (
                  <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: '#F7F7F8', color: '#AAB4BF' }}>휴가</span>
                ) : selectedHoliday ? (
                  <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: '#FFE8E8', color: '#FF5959' }}>휴무</span>
                ) : (
                  <>
                    <span className="rounded-full px-3 py-1 text-[13px] font-medium" style={{ backgroundColor: typeStyle.open.bg, color: typeStyle.open.text }}>근무 일정</span>
                    <span className="text-[15px] text-muted-foreground">없음</span>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {allDetailLoading ? (
                <p className="text-sm text-[#AAB4BF]">로딩 중...</p>
              ) : allStaffDetail && allStaffDetail.length > 0 ? (
                allStaffDetail.map((part) => {
                  const style =
                    part.part_name === "오픈" ? shiftTagStyle.open :
                      part.part_name === "미들" ? shiftTagStyle.middle :
                        shiftTagStyle.close;
                  return (
                    <div key={part.part_id}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="rounded-full px-3 py-1 text-[13px] font-medium"
                          style={{ backgroundColor: style.bg, color: style.text }}>
                          {part.part_name}
                        </span>
                        <span className="text-[13px] text-muted-foreground">{part.employees.length}명</span>
                      </div>
                      <div className="pl-2">
                        <div className="flex items-start gap-3">
                          <span className="text-[14px] text-muted-foreground whitespace-nowrap">
                            {part.start_time} - {part.end_time}
                          </span>
                          <span className="text-[14px] font-medium text-foreground">
                            {part.employees.map(e => e.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-[#AAB4BF]">근무 일정이 없습니다.</p>
              )}
            </div>
          )}

          <div>
            <button onClick={() => setBottomSheetOpen(false)} className="mt-8 w-full rounded-2xl py-4 text-[16px] font-semibold text-white" style={{ backgroundColor: '#4261FF' }}>확인</button>
          </div>
        </SheetContent>
      </Sheet>

      {/* 삭제 확인 다이얼로그 */}
      <ConfirmDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }} title="변경 요청 내역 삭제"
        description={<>변경 요청 내역을 삭제 하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setDeleteTargetId(null), variant: "cancel" }, { label: "삭제하기", onClick: handleDeleteConfirm }]} />

      {/* FAB */}
      {fabOpen && <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setFabOpen(false)} />}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col items-end gap-3">
        {fabOpen && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-foreground rounded-lg px-3 py-1.5" style={{ backgroundColor: '#FFFFFF' }}>일정 변경 요청</span>
              <button onClick={() => { setFabOpen(false); navigate("/schedule/change-request"); }} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                <CalendarClock className="h-5 w-5 text-foreground" />
              </button>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[14px] font-medium text-foreground rounded-lg px-3 py-1.5" style={{ backgroundColor: '#FFFFFF' }}>휴가 요청</span>
              <button onClick={() => { setFabOpen(false); navigate("/schedule/vacation-request"); }} className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#FFFFFF' }}>
                <Palmtree className="h-5 w-5 text-foreground" />
              </button>
            </div>
          </>
        )}
        <button onClick={() => setFabOpen(!fabOpen)} className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center" style={{ backgroundColor: '#4261FF' }}>
          <X className={`h-6 w-6 text-white transition-transform ${fabOpen ? "rotate-0" : "rotate-45"}`} />
        </button>
      </div>

      {/* <BottomNav activeTab="home" onTabChange={() => { }} /> */}
    </div>
  );
};

export default Schedule;