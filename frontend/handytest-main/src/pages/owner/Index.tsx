import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { subDays, addDays, isToday, format } from "date-fns";
import { ko } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
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
import AccountSelector, { type AccountType } from "@/components/home/AccountSelector";
import { NotificationItem, setRoleLabel } from "@/utils/function";
import NoticeCards from "@/components/home/NoticeCards";

const ATTENDANCE_CARDS = [
  {
    type: "working" as const, label: "근무중", description: "근무중이에요", count: 6, totalCount: 12,
    employees: [
      { id: "1", name: "김정민", time: "08:55", status: "출근", badgeType: "오픈" as const, avatarColor: "#5C4033", attendanceStatus: "normal" as const },
      { id: "2", name: "문자영", time: "08:57", status: "출근", badgeType: "오픈" as const, avatarColor: "#C0392B", attendanceStatus: "normal" as const },
      { id: "3", name: "정수민", time: "09:03", status: "출근", badgeType: "오픈,미들" as const, avatarColor: "#1ABC9C", attendanceStatus: "late" as const },
      { id: "4", name: "임찬홍", time: "14:52", status: "출근", badgeType: "미들" as const, avatarColor: "#2C3E50", attendanceStatus: "normal" as const },
      { id: "5", name: "박서준", time: "15:00", status: "출근", badgeType: "미들" as const, avatarColor: "#8E44AD", attendanceStatus: "normal" as const },
      { id: "6", name: "이하늘", time: "15:10", status: "출근", badgeType: "마감" as const, avatarColor: "#E67E22", attendanceStatus: "normal" as const },
    ],
  },
  {
    type: "checkin" as const, label: "출근", description: "출근 했어요", count: 6, totalCount: 12,
    employees: [
      { id: "1", name: "김정민", time: "08:55", status: "출근", badgeType: "오픈" as const, avatarColor: "#5C4033", attendanceStatus: "normal" as const },
      { id: "2", name: "문자영", time: "08:57", status: "출근", badgeType: "오픈" as const, avatarColor: "#C0392B", attendanceStatus: "normal" as const },
      { id: "3", name: "정수민", time: "09:03", status: "출근", badgeType: "오픈,미들" as const, avatarColor: "#1ABC9C", attendanceStatus: "late" as const },
      { id: "4", name: "임찬홍", time: "14:52", status: "출근", badgeType: "미들" as const, avatarColor: "#2C3E50", attendanceStatus: "normal" as const },
      { id: "5", name: "박서준", time: "15:00", status: "출근", badgeType: "미들" as const, avatarColor: "#8E44AD", attendanceStatus: "normal" as const },
      { id: "6", name: "이하늘", time: "15:10", status: "출근", badgeType: "마감" as const, avatarColor: "#E67E22", attendanceStatus: "normal" as const },
    ],
  },
  {
    type: "checkout" as const, label: "퇴근", description: "퇴근 했어요", count: 2, totalCount: 12,
    employees: [
      { id: "1", name: "김정민", time: "08:55", status: "출근", badgeType: "오픈" as const, avatarColor: "#5C4033", attendanceStatus: "normal" as const },
      { id: "2", name: "문자영", time: "08:57", status: "출근", badgeType: "오픈" as const, avatarColor: "#C0392B", attendanceStatus: "normal" as const },
    ],
  },
  {
    type: "absent" as const, label: "결근", description: "결근 했어요", count: 1, totalCount: 12,
    employees: [
      { id: "7", name: "최서현", time: "", status: "결근", badgeType: "미들" as const, avatarColor: "#D4A574", attendanceStatus: "absent" as const },
    ],
  },
];

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

        const targetId = location.state?.storeMemberId;
        const target = targetId
          ? mapped.find(a => a.id === String(targetId))
          : mapped.find(a => a.role === "owner");
        const finalAccount = target ?? mapped[0] ?? null;
        setSelectedAccount(finalAccount);
        localStorage.setItem("currentRole", finalAccount?.role ?? "owner");
        localStorage.setItem("currentStoreId", String(finalAccount?.storeId ?? ""));
      } catch (err) {
        navigate("/");
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
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <button className="pressable flex items-center gap-1" style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }}>
                {isToday(selectedDate) && <span style={{ color: '#4261FF' }}>[오늘]</span>}
                {formatDate(selectedDate)}
                <ChevronDown className="w-[18px] h-[18px] text-muted-foreground" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => { if (d) { setSelectedDate(d); setCalendarOpen(false); } }}
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
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
              stats={{ checkin: 7, late: 1, checkout: 2, absent: 0 }}
              cards={ATTENDANCE_CARDS}
              date="26.11.06 (목)"
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