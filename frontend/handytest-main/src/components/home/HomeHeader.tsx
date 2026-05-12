import { setRoleLabel } from "@/utils/function";
import { ChevronDown, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HomeHeaderProps {
  storeName: string;
  roleLabel: string;
  hasNotifications?: boolean;
  onStoreClick: () => void;
  onMenuClick: () => void;
}

const HomeHeader = ({ storeName, roleLabel, hasNotifications = false, onStoreClick, onMenuClick }: HomeHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-between px-5 py-3 sticky top-0 z-10" style={{ backgroundColor: '#F4F5F8' }}>
      <button onClick={onStoreClick} className="pressable flex items-center gap-1">
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#292B2E' }}>{storeName}</span>
        <span style={{ width: '33px', height: '20px', borderRadius: '10px', backgroundColor: '#4261FF', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 600, letterSpacing: '-0.01em', color: '#FFFFFF', flexShrink: 0, marginLeft: '6px' }}>
          {setRoleLabel(roleLabel)}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/notifications")} className="pressable relative">
          <Bell className="h-5 w-5 text-foreground" />
          {hasNotifications && (
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
          )}
        </button>
        <button onClick={onMenuClick} className="pressable">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};

export default HomeHeader;
