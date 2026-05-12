import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
  memberName: string;
  employeeType: string;
}

const MAIN_MENU = [
  { label: "홈", path: "/" },
  { label: "출근관리", path: "/attendance" },
  { label: "일정확인", path: "/schedule" },
  { label: "급여관리", path: "/salary" },
  { label: "게시판", path: "/board" },
  { label: "마감보고", path: "/closing-report" },
];

const SUB_MENU = [
  { label: "내 정보", path: "/profile" },
  { label: "알림", path: "/notifications" },
  { label: "공지사항", path: "/announcements" },
  { label: "자주 묻는 질문", path: "/faq" },
  { label: "고객 건의함", path: "/feedback" },
];

const SideMenu = ({ open, onClose, memberName, employeeType }: SideMenuProps) => {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[75%] max-w-[300px] p-0 border-0 [&>button]:hidden overflow-y-auto" style={{ backgroundColor: '#FFFFFF' }}>
        <span style={{ position: 'absolute', width: '1px', height: '1px', padding: 0, margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', borderWidth: 0 }}>
          <SheetTitle>전체 메뉴</SheetTitle>
        </span>

        {/* Profile row + Close button */}
        <div className="flex items-start justify-between px-6 pt-10">
          <div className="flex items-center gap-3">
            <div className="h-[72px] w-[72px] flex-shrink-0 rounded-full bg-muted" />
            <div>
              <p className="text-[20px] font-bold text-foreground">{memberName}</p>
              <p className="text-[14px] text-muted-foreground">{employeeType}</p>
            </div>
          </div>
          <button onClick={onClose} className="mt-2">
            <X className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* Main menu */}
        <nav className="mt-8 px-6">
          {MAIN_MENU.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path)}
              className="pressable block w-full py-3.5 text-left text-[18px] font-bold text-foreground"
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Separator */}
        <div className="mx-6 my-6 h-px bg-border" />

        {/* Sub menu */}
        <nav className="px-6">
          {SUB_MENU.map((item) => (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.path)}
              className="pressable block w-full py-2.5 text-left text-[15px] text-muted-foreground"
            >
              {item.label}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
};

export default SideMenu;
