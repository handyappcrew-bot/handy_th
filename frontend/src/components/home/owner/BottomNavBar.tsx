import { Home, Clock, CalendarDays, FileText, User, TrendingUp, Wallet, Users, Store } from "lucide-react";
import { useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const NAV_ITEMS = [
  { path: "/owner/home", label: "홈", icon: Home },
  { path: "/owner/schedule", label: "일정관리", icon: CalendarDays },
  { path: "/owner/attendance", label: "근태관리", icon: Clock },
  { path: "/owner/sales", label: "매출관리", icon: TrendingUp },
  { path: "/owner/salary", label: "급여관리", icon: Wallet },
  { path: "/owner/staff", label: "직원관리", icon: Users },
  { path: "/owner/store", label: "매장관리", icon: Store },
  { path: "/board", label: "게시판", icon: FileText },
  { path: "/owner/profile", label: "내 정보", icon: User },
];

export default function BottomNavBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    startX.current = e.pageX - (navRef.current?.offsetLeft ?? 0);
    scrollLeft.current = navRef.current?.scrollLeft ?? 0;
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - (navRef.current?.offsetLeft ?? 0);
    navRef.current!.scrollLeft = scrollLeft.current - (x - startX.current);
  };
  const onMouseUp = () => { isDragging.current = false; };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      {/* 직원 BottomNav와 완전 동일한 구조 — 스크롤만 추가 */}
      <div
        ref={navRef}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        className="mx-auto flex max-w-lg items-center pb-[env(safe-area-inset-bottom)]"
        style={{ height: "74px", overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.path === "/"
              ? location.pathname === "/"
              : location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => { if (!isActive) navigate(item.path); }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 flex-shrink-0 ${!isActive ? "pressable" : ""}`}
              style={{ width: "20vw", maxWidth: "102px", minWidth: "72px" }}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${isActive ? "font-semibold text-primary" : "text-muted-foreground"
                  }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
