import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { subDays, addDays, isToday, format } from "date-fns";
import { ko } from "date-fns/locale";
import { createPortal } from "react-dom";
import Header from "@/components/home/owner/Header";
import SideMenu from "@/components/home/SideMenu";
import AccountBottomSheet from "@/components/home/owner/AccountBottomSheet";
import AttendanceSection from "@/components/home/owner/AttendanceSection";
import BannerCarousel from "@/components/home/owner/BannerCarousel";
import ChecklistSection from "@/components/home/owner/ChecklistSection";
import SalesSection from "@/components/home/owner/SalesSection";
import RecentPostsSection from "@/components/home/owner/RecentPostsSection";
import StoreManagementSection from "@/components/home/owner/StoreManagementSection";
import HomeHeader from "@/components/home/HomeHeader";
import { getMe, getMyStores, getNotification, markNotificationRead } from "@/api/public";
import { getTodayAttendance } from "@/api/owner/attendance";
import AccountSelector, { type AccountType } from "@/components/home/AccountSelector";
import { NotificationItem, setRoleLabel } from "@/utils/function";
import NoticeCards from "@/components/home/NoticeCards";

const AVATAR_COLORS = [
  "#5C4033", "#C0392B", "#1ABC9C", "#2C3E50", "#8E44AD",
  "#E67E22", "#E91E63", "#FF9800", "#4261FF", "#D4A574",
  "#27AE60", "#2980B9",
];

function getAvatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

function toBadgeType(shift: string | null): "오픈" | "미들" | "마감" | "오픈,미들" {
  if (shift === "오픈" || shift === "미들" || shift === "마감" || shift === "오픈,미들") return shift;
  return "오픈";
}

interface AttendanceRecord {
  id: number;
  name: string;
  shift: string | null;
  status: "working" | "on_break" | "off_work" | "absent";
  clock_in: string | null;
  clock_out: string | null;
  work_start: string | null;
  work_end: string | null;
}

function buildAttendanceCards(records: AttendanceRecord[]) {
  const total = records.length;

  const toEmp = (r: AttendanceRecord, time: string | null, statusLabel: string) => ({
    id: String(r.id),
    name: r.name,
    time: time ?? "",
    status: statusLabel,
    badgeType: toBadgeType(r.shift),
    avatarColor: getAvatarColor(r.id),
    attendanceStatus: r.status === "absent"
      ? "absent" as const
      : r.clock_in && r.work_start && r.clock_in > r.work_start
        ? "late" as const
        : "normal" as const,
  });

  const working = records.filter(r => r.status === "working" || r.status === "on_break");
  const checkin = records.filter(r => r.status !== "absent");
  const checkout = records.filter(r => r.status === "off_work");
  const absent = records.filter(r => r.status === "absent");
  const lateCount = checkin.filter(r => r.clock_in && r.work_start && r.clock_in > r.work_start).length;

  return {
    cards: [
      { type: "working" as const, label: "근무중", description: "근무중이에요", count: working.length, totalCount: total, employees: working.map(r => toEmp(r, r.clock_in, "출근")) },
      { type: "checkin" as const, label: "출근", description: "출근 했어요", count: checkin.length, totalCount: total, employees: checkin.map(r => toEmp(r, r.clock_in, "출근")) },
      { type: "checkout" as const, label: "퇴근", description: "퇴근 했어요", count: checkout.length, totalCount: total, employees: checkout.map(r => toEmp(r, r.clock_out, "퇴근")) },
      { type: "absent" as const, label: "결근", description: "결근 했어요", count: absent.length, totalCount: total, employees: absent.map(r => toEmp(r, null, "결근")) },
    ],
    stats: { checkin: checkin.length, late: lateCount, checkout: checkout.length, absent: absent.length },
  };
}

const CHECKLIST_COMMON_AVATAR = "#A0AEC0";
const CHECKLIST_CARDS = [
  {
    type: "오픈" as const, totalPeople: 3, timeRange: "08:00 ~ 14:00",
    tabs: [
      { id: "common", name: "공통", avatarColor: CHECKLIST_COMMON_AVATAR, items: [{ id: "1", text: "테이블 청소" }, { id: "2", text: "와플베이스 만들기" }, { id: "3", text: "물류 정리" }] },
      { id: "kim", name: "김정민", avatarColor: "#5C4033", items: [{ id: "4", text: "손님한테 인사 잘하기" }, { id: "5", text: "퇴근할때 티비 끄기" }] },
      { id: "moon", name: "문자영", avatarColor: "#C0392B", items: [{ id: "6", text: "재고 확인" }] },
      { id: "jung", name: "정수민", avatarColor: "#1ABC9C", items: [{ id: "7", text: "음료 준비" }] },
    ],
  },
  {
    type: "미들" as const, totalPeople: 3, timeRange: "14:00 ~ 18:00",
    tabs: [
      { id: "common2", name: "공통", avatarColor: CHECKLIST_COMMON_AVATAR, items: [{ id: "8", text: "테이블 청소" }, { id: "9", text: "와플베이스 만들기" }, { id: "10", text: "물류 정리" }] },
      { id: "kim2", name: "김정민", avatarColor: "#5C4033", items: [{ id: "11", text: "매장 점검" }] },
      { id: "moon2", name: "문자영", avatarColor: "#C0392B", items: [{ id: "12", text: "시럽 리필" }] },
      { id: "jung2", name: "정수민", avatarColor: "#1ABC9C", items: [{ id: "13", text: "컵 정리" }] },
    ],
  },
  {
    type: "마감" as const, totalPeople: 3, timeRange: "18:00 ~ 22:00",
    tabs: [
      { id: "common3", name: "공통", avatarColor: CHECKLIST_COMMON_AVATAR, items: [{ id: "14", text: "테이블 청소" }, { id: "15", text: "와플베이스 만들기" }, { id: "16", text: "물류 정리" }] },
      { id: "kim3", name: "김정민", avatarColor: "#5C4033", items: [{ id: "17", text: "정산 확인" }] },
      { id: "moon3", name: "문자영", avatarColor: "#C0392B", items: [{ id: "18", text: "냉장고 정리" }] },
      { id: "jung3", name: "정수민", avatarColor: "#1ABC9C", items: [{ id: "19", text: "문 잠금 확인" }] },
    ],
  },
];

const POSTS = [
  { id: "1", authorName: "정수민", avatarColor: "#1ABC9C", timeAgo: "1시간 전", content: "11월 15일 08:00 ~ 15:00 대타 요청합니다 ㅜㅜ" },
  { id: "2", authorName: "김다현", avatarColor: "#E91E63", timeAgo: "9시간 전", content: "밤 베이스 발주 필요합니당" },
  { id: "3", authorName: "최지혁", avatarColor: "#FF9800", timeAgo: "9시간 전", content: "사다리 부러졌습니다..." },
];

export default function Index() {
  const navigate = useNavigate();
  const location = useLocation();
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("1");
  const [activeMainTab, setActiveMainTab] = useState<"현황" | "관리">("현황");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [pickerMonth, setPickerMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  const [memberName, setMemberName] = useState<string>("");

  const handleDismissNotice = useCallback(async (id: string) => {
    await markNotificationRead(id);
    setNotices((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [accounts, setAccounts] = useState<AccountType[]>([]);
  const [authLoaded, setAuthLoaded] = useState(false);

  const [storeNotices, setStoreNotices] = useState<any[]>([]);
  const [notices, setNotices] = useState<NotificationItem[]>([]);
  const [attendanceCards, setAttendanceCards] = useState<ReturnType<typeof buildAttendanceCards>["cards"]>([]);
  const [attendanceStats, setAttendanceStats] = useState({ checkin: 0, late: 0, checkout: 0, absent: 0 });

  useEffect(() => {
    const initAuth = async () => {
      try {
        const [me, stores] = await Promise.all([getMe(), getMyStores()]);
        setMemberName(me.name);
        const mapped: AccountType[] = stores.map((s: any) => ({
          id: String(s.store_member_id),
          storeId: s.store_id,
          storeName: s.store_name,
          role: s.role,
          employeeType: s.employee_type ?? "",
        }));
        setAccounts(mapped);

        // 세션 유지 우선순위:
        //  1) 명시적 location.state.storeMemberId (다른 화면에서 의도적으로 넘긴 경우)
        //  2) localStorage.currentStoreMemberId (사용자가 마지막에 선택했던 매장)
        //  3) localStorage.currentStoreId 매칭 + owner role
        //  4) 첫 owner 매장
        const navStateId = location.state?.storeMemberId;
        const savedStoreMemberId = localStorage.getItem("currentStoreMemberId");
        const savedStoreId = localStorage.getItem("currentStoreId");

        const targetIdStr = navStateId != null ? String(navStateId) : savedStoreMemberId;
        let target = targetIdStr ? mapped.find(a => a.id === targetIdStr) : undefined;
        if (!target && savedStoreId) {
          target = mapped.find(
            a => String(a.storeId) === savedStoreId && a.role === "owner",
          );
        }
        const fallback = mapped.find(a => a.role === "owner") ?? mapped[0];
        const finalAccount = target ?? fallback ?? null;

        setSelectedAccount(finalAccount);
        localStorage.setItem("currentRole", finalAccount?.role ?? "owner");
        localStorage.setItem("currentStoreId", String(finalAccount?.storeId ?? ""));
        localStorage.setItem("currentStoreMemberId", String(finalAccount?.id ?? ""));
        localStorage.setItem("currentMemberId", String(me.id));
      } catch (err) {
        if (import.meta.env.PROD) {
          navigate("/");
        } else {
          // 로컬 개발: 백엔드 없이 화면 렌더링용 임시 계정
          const mockOwner: AccountType = { id: "1", storeId: 1, storeName: "테스트 매장", role: "owner", employeeType: "" };
          const mockEmployee: AccountType = { id: "2", storeId: 1, storeName: "테스트 매장", role: "employee", employeeType: "알바생" };
          setSelectedAccount(mockOwner);
          setAccounts([mockOwner, mockEmployee]);
          localStorage.setItem("currentRole", "owner");
          localStorage.setItem("currentStoreId", "1");
        }
      } finally {
        setAuthLoaded(true);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (!authLoaded || !selectedAccount) return;
    const storeId = selectedAccount.storeId;

    const fetchAll = async () => {
      const [notifications] = await Promise.allSettled([
        getNotification(true, storeId)
      ])

  if (notifications.status === 'fulfilled') setNotices(notifications.value);
}


fetchAll();

  }, [authLoaded, selectedAccount]);

  useEffect(() => {
    if (!authLoaded || !selectedAccount || activeMainTab !== "현황") return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    getTodayAttendance(selectedAccount.storeId, dateStr)
      .then(records => {
        const { cards, stats } = buildAttendanceCards(records);
        setAttendanceCards(cards);
        setAttendanceStats(stats);
      })
      .catch(() => {});
  }, [authLoaded, selectedAccount, selectedDate, activeMainTab]);

const formatDate = (d: Date) => {
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const dayName = format(d, "EEEE", { locale: ko }).charAt(0);
  return `${yy}.${mm}.${dd} (${dayName})`;
};

const handleAccountSelect = (account: AccountType) => {
  localStorage.setItem("currentRole", account.role);
  localStorage.setItem("currentStoreId", String(account.storeId));
  localStorage.setItem("currentStoreMemberId", account.id);
  if (account.role === "employee") {
    navigate("/employee/home");
  } else {
    setSelectedAccount(account);
    setBottomSheetOpen(false);
  }
};

if (!authLoaded || !selectedAccount) {
  return (
    <div className="min-h-screen max-w-lg mx-auto flex items-center justify-center">
      <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width: '10px', height: '10px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #4261FF, #6b8cff)',
            animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite`,
          }} />
        ))}
      </div>
      <style>{`
        @keyframes navDotBounce {
          0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; }
          40% { transform: scale(1.1) translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

return (
  <div className="max-w-lg mx-auto min-h-screen" style={{ backgroundColor: '#FFFFFF' }}>
    <div className="pb-24">

      {/* ── sticky 블록: 헤더 + 탭 통합 ── */}
      <div className="sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <HomeHeader
          storeName={selectedAccount.storeName}
          roleLabel={selectedAccount.role}
          hasNotifications={storeNotices.length > 0}
          onStoreClick={() => setBottomSheetOpen(true)}
          onMenuClick={() => setSideMenuOpen(true)}
          bgColor="#FFFFFF"
        />
        {/* 탭 */}
        <div className="flex" style={{ paddingLeft: '20px', gap: '20px' }}>
          {(["현황", "관리"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveMainTab(tab)}
              className="pressable"
              style={{
                paddingTop: '6px',
                paddingBottom: '10px',
                fontSize: '20px',
                fontWeight: 700,
                color: activeMainTab === tab ? '#19191B' : '#AAB4BF',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '-0.02em',
                whiteSpace: 'nowrap' as const,
              }}
            >
              매장 {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── 알림카드: 스크롤 시 사라짐 ── */}
      <NoticeCards notices={notices} onDismiss={handleDismissNotice} />

      {/* ── 날짜 선택: 스크롤 시 사라짐 ── */}
      {activeMainTab === "현황" && (
        <div className="flex items-center justify-between" style={{ paddingTop: '10px', paddingBottom: '10px', paddingLeft: '8px', paddingRight: '8px', backgroundColor: '#FFFFFF' }}>
          <button onClick={() => setSelectedDate(prev => subDays(prev, 1))} className="pressable" style={{ padding: '4px 8px' }}>
            <ChevronLeft className="w-[18px] h-[18px] text-muted-foreground" />
          </button>
          <button
            className="pressable flex items-center gap-1"
            style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }}
            onClick={() => { setPickerMonth(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)); setCalendarOpen(true); }}
          >
            {isToday(selectedDate) && <span style={{ color: '#4261FF' }}>[오늘]</span>}
            {formatDate(selectedDate)}
            <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
          </button>
          {calendarOpen && createPortal(
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setCalendarOpen(false)}>
              <div className="rounded-2xl p-5 w-[320px] shadow-lg" style={{ backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
                {/* 월 네비게이터 */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} className="pressable p-1">
                    <ChevronLeft style={{ width: '20px', height: '20px', color: '#19191B' }} />
                  </button>
                  <span style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>{pickerMonth.getFullYear()}년 {pickerMonth.getMonth() + 1}월</span>
                  <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} className="pressable p-1">
                    <ChevronRight style={{ width: '20px', height: '20px', color: '#19191B' }} />
                  </button>
                </div>
                {/* 요일 헤더 */}
                <div className="grid grid-cols-7 mb-2">
                  {['일','월','화','수','목','금','토'].map((d, i) => (
                    <div key={d} className="text-center py-1" style={{ fontSize: '13px', fontWeight: 500, color: i === 0 ? '#FF5959' : i === 6 ? '#5DB1FF' : '#70737B' }}>{d}</div>
                  ))}
                </div>
                {/* 날짜 그리드 */}
                {(() => {
                  const py = pickerMonth.getFullYear(), pm = pickerMonth.getMonth();
                  const firstDay = new Date(py, pm, 1).getDay();
                  const daysInMonth = new Date(py, pm + 1, 0).getDate();
                  const prevDays = new Date(py, pm, 0).getDate();
                  const cells: { y: number; m: number; d: number; outside: boolean }[] = [];
                  for (let i = firstDay - 1; i >= 0; i--) { const dt = new Date(py, pm - 1, prevDays - i); cells.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), outside: true }); }
                  for (let d = 1; d <= daysInMonth; d++) cells.push({ y: py, m: pm, d, outside: false });
                  const rem = 7 - (cells.length % 7); if (rem < 7) for (let i = 1; i <= rem; i++) { const dt = new Date(py, pm + 1, i); cells.push({ y: dt.getFullYear(), m: dt.getMonth(), d: dt.getDate(), outside: true }); }
                  const weeks: typeof cells[] = [];
                  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
                  const today = new Date();
                  return weeks.map((week, wi) => (
                    <div key={wi} className="grid grid-cols-7 mb-1">
                      {week.map((cell, di) => {
                        const isSel = !cell.outside && selectedDate.getFullYear() === cell.y && selectedDate.getMonth() === cell.m && selectedDate.getDate() === cell.d;
                        const isTodayCell = !cell.outside && today.getFullYear() === cell.y && today.getMonth() === cell.m && today.getDate() === cell.d;
                        const isSun = di === 0, isSat = di === 6;
                        const textColor = cell.outside ? '#AAB4BF' : isSel ? '#FFFFFF' : isTodayCell ? '#FFFFFF' : isSun ? '#FF5959' : isSat ? '#5DB1FF' : '#19191B';
                        return (
                          <button key={di} disabled={cell.outside}
                            className={cell.outside ? '' : 'pressable'}
                            onClick={() => { if (!cell.outside) { setSelectedDate(new Date(cell.y, cell.m, cell.d)); setCalendarOpen(false); } }}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '40px' }}
                          >
                            <span style={{ fontSize: '14px', fontWeight: 500, color: textColor, ...(isSel ? { backgroundColor: '#4261FF', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center' } : isTodayCell ? { backgroundColor: '#4261FF', borderRadius: '10px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.45 } : {}) }}>
                              {cell.d}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            </div>,
            document.body
          )}
          <button onClick={() => setSelectedDate(prev => addDays(prev, 1))} className="pressable" style={{ padding: '4px 8px' }}>
            <ChevronRight className="w-[18px] h-[18px] text-muted-foreground" />
          </button>
        </div>
      )}

      {/* ── 콘텐츠 ── */}
      <div style={{ backgroundColor: '#F7F7F8', borderTop: '1px solid #EBEBEB' }}>
        {activeMainTab === "현황" ? (
          <>
            <AttendanceSection
              stats={attendanceStats}
              cards={attendanceCards}
              date={format(selectedDate, 'yy.MM.dd')}
              hideDateSelector
            />
            <div style={{ height: '20px' }} />
            <BannerCarousel />
            <div style={{ height: '20px' }} />
            <ChecklistSection cards={CHECKLIST_CARDS} />
            <div style={{ height: '20px' }} />
            <SalesSection date="11월 5일" totalSales={418000} salesAmount={418000} laborCost={185303} />
            <div style={{ height: '20px' }} />
            <RecentPostsSection posts={POSTS} />
            <div style={{ height: '20px' }} />
          </>
        ) : (
          <>
            <div style={{ height: '20px' }} />
            <BannerCarousel />
            <div style={{ height: '20px' }} />
            <StoreManagementSection />
          </>
        )}
      </div>

    </div>

    <SideMenu
      open={sideMenuOpen}
      onClose={() => setSideMenuOpen(false)}
      memberName={memberName}
      employeeType={setRoleLabel(selectedAccount?.role ?? "")}
    />
    <AccountSelector
      open={bottomSheetOpen}
      accounts={accounts}
      selectedId={selectedAccount?.id ?? ""}
      onSelect={handleAccountSelect}
      onClose={() => setBottomSheetOpen(false)}
    />
  </div>
);
}