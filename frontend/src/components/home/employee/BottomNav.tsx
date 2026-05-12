import { Home, Wallet, Clock, MessageSquare, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

type TabId = "home" | "salary" | "attendance" | "board" | "myinfo";

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "home", label: "홈", icon: Home },
  { id: "salary", label: "급여관리", icon: Wallet },
  { id: "attendance", label: "출근관리", icon: Clock },
  { id: "board", label: "게시판", icon: MessageSquare },
  { id: "myinfo", label: "내정보", icon: User },
];

const TAB_PATHS: Record<TabId, string> = {
  home: "/",
  salary: "/employee/salary",
  attendance: "/attendance",
  board: "/board",
  myinfo: "/employee/profile",
};

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card">
      <div className="mx-auto flex max-w-lg items-center justify-around pb-[env(safe-area-inset-bottom)]" style={{ height: '74px' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = pathname === TAB_PATHS[tab.id] || (tab.id !== "home" && pathname.startsWith(TAB_PATHS[tab.id]));
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isActive) return;
                if (tab.id === "home") {
                  navigate("/");
                } else if (tab.id === "salary") {
                  navigate("/employee/salary");
                } else if (tab.id === "attendance") {
                  navigate("/attendance");
                } else if (tab.id === "board") {
                  navigate("/board");
                } else if (tab.id === "myinfo") {
                  navigate("/employee/profile");
                } else {
                  onTabChange(tab.id);
                }
              }}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 ${!isActive ? "pressable" : ""}`}
            >
              <Icon
                className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] ${
                  isActive ? "font-semibold text-primary" : "text-muted-foreground"
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
