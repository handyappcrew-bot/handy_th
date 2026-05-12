import { ChevronDown, Bell, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface HeaderProps {
  storeName: string;
  role: string;
  onAccountSelect: () => void;
  onMenuOpen: () => void;
}

export default function Header({ storeName, role, onAccountSelect, onMenuOpen }: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header
      className="flex items-center justify-between px-5 sticky top-0 z-10"
      style={{ backgroundColor: 'hsl(var(--background))', paddingTop: '12px', paddingBottom: '12px', minHeight: '52px' }}
    >
      <button onClick={onAccountSelect} className="pressable flex items-center gap-1">
        <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.01em', color: '#292B2E', lineHeight: '30px' }}>
          {storeName}
        </span>
        <span style={{
          width: '40px', height: '20px', borderRadius: '10px',
          backgroundColor: '#4261FF', display: 'inline-flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '11px', fontWeight: 600,
          letterSpacing: '-0.01em', color: '#FFFFFF', flexShrink: 0, marginLeft: '6px',
        }}>
          {role}
        </span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      <div className="flex items-center gap-4">
        <button onClick={() => navigate("/notifications")} className="pressable relative">
          <Bell className="h-5 w-5 text-foreground" />
          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
        </button>
        <button onClick={onMenuOpen} className="pressable">
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </header>
  );
}
