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

const AVATAR_COLORS = ["#5C4033","#C0392B","#1ABC9C","#2C3E50","#8E44AD","#E67E22","#4261FF","#E74C3C","#27AE60","#F39C12"];
const getAvatarColor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

type AttendanceEmployee = { id: string; name: string; time: string; status: string; badgeType: "오픈" | "미들" | "마감" | "오픈,미들"; avatarColor: string; attendanceStatus: "normal" | "late" | "absent" };
type AttendanceCardType = { type: "working" | "checkin" | "checkout" | "absent"; label: string; description: string; count: number; totalCount: number; employees: AttendanceEmployee[] };

function buildAttendanceCards(data: any[]): AttendanceCardType[] {
  const total = data.length;
  const toEmp = (e: any): AttendanceEmployee => ({
    id: String(e.id),
    name: e.name,
    time: e.clock_in ?? "",
    status: e.status === "off_work" ? "퇴근" : "출근",
    badgeType: (e.shift as any) ?? "오픈",
    avatarColor: getAvatarColor(e.id),
    attendanceStatus: "normal",
  });
  const working = data.filter(e => e.status === "working" || e.status === "on_break");
  const checkin = data.filter(e => e.status === "working" || e.status === "on_break" || e.status === "off_work");
  const checkout = data.filter(e => e.status === "off_work");
  const absent = data.filter(e => e.status === "absent");
  return [
    { type: "working", label: "근무중", description: "현재 근무중이에요", count: working.length, totalCount: total, employees: working.map(toEmp) },
    { type: "checkin", label: "출근", description: "오늘 출근했어요", count: checkin.length, totalCount: total, employees: checkin.map(toEmp) },
    { type: "checkout", label: "퇴근", description: "퇴근했어요", count: checkout.length, totalCount: total, employees: checkout.map(toEmp) },
    { type: "absent", label: "결근", description: "출근하지 않았어요", count: absent.length, totalCount: total, employees: absent.map(toEmp) },
  ];
}



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
  const [attendanceCards, setAttendanceCards] = useState<AttendanceCardType[]>([]);

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
      const [notifications, todayAttendance] = await Promise.allSettled([
        getNotification(true, storeId),
        fetch(`/api/owner/store/${storeId}/attendance/today`, { credentials: 'include' }).then(r => r.ok ? r.json() : []),
      ]);

      if (notifications.status === 'fulfilled') setNotices(notifications.value);
      if (todayAttendance.status === 'fulfilled') setAttendanceCards(buildAttendanceCards(todayAttendance.value));
    };

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
              stats={{
                checkin: attendanceCards.find(c => c.type === "checkin")?.count ?? 0,
                late: 0,
                checkout: attendanceCards.find(c => c.type === "checkout")?.count ?? 0,
                absent: attendanceCards.find(c => c.type === "absent")?.count ?? 0,
              }}
              cards={attendanceCards}
              date={formatDate(selectedDate)}
              hideDateSelector
            />
            <div style={{ height: '20px' }} />
            <BannerCarousel />
            <div style={{ height: '20px' }} />
            <ChecklistSection cards={[]} />
            <div style={{ height: '20px' }} />
            <SalesSection date="11월 5일" totalSales={418000} salesAmount={418000} laborCost={185303} />
            <div style={{ height: '20px' }} />
            <RecentPostsSection posts={[]} />
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