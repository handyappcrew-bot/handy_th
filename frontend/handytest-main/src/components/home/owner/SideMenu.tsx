import { X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

interface SideMenuProps {
  open: boolean;
  onClose: () => void;
}

const MENU_SECTIONS = [
  {
    label: "매장",
    items: [
      { name: "매장관리", path: "/store" },
      { name: "매출관리", path: "/sales" },
      { name: "직원관리", path: "/staff" },
      { name: "일정관리", path: "/schedule" },
    ],
  },
  {
    label: "직원",
    items: [
      { name: "급여관리", path: "/salary" },
      { name: "근태관리", path: "/attendance" },
    ],
  },
  {
    label: "커뮤니티",
    items: [
      { name: "게시판", path: "/board" },
    ],
  },
];

const BOTTOM_LINKS = [
  { name: "내 정보", path: "/profile" },
  { name: "공지사항", path: "/announcements" },
  { name: "자주 묻는 질문", path: "/faq" },
  { name: "고객 건의함", path: "/feedback" },
];

export default function SideMenu({ open, onClose }: SideMenuProps) {
  const navigate = useNavigate();

  const handleNavigate = (path: string) => {
    onClose();
    navigate(path);
  };

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent side="left" className="w-[75%] max-w-[300px] p-0 border-0 [&>button]:hidden" style={{ backgroundColor: '#FFFFFF' }}>
        <VisuallyHidden.Root>
          <SheetTitle>전체 메뉴</SheetTitle>
        </VisuallyHidden.Root>

        {/* Profile row + Close button */}
        <div className="flex items-start justify-between px-6 pt-10">
          <div className="flex items-center gap-3">
            <div className="w-[72px] h-[72px] flex-shrink-0 rounded-full bg-muted overflow-hidden">
              <img
                src="https://i.pravatar.cc/150?img=11"
                alt="프로필"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <p className="text-[20px] font-bold text-foreground">정수민</p>
              <p className="text-[14px] text-muted-foreground">정규직</p>
            </div>
          </div>
          <button onClick={onClose} className="mt-2">
            <X className="h-6 w-6 text-foreground" />
          </button>
        </div>

        {/* 홈 */}
        <div className="px-6 mt-8 mb-3">
          <button
            onClick={() => handleNavigate("/")}
            className="text-[18px] font-bold text-foreground"
          >
            홈
          </button>
        </div>

        <div className="mx-6 h-px bg-border" />

        {/* Menu sections */}
        {MENU_SECTIONS.map((section) => (
          <div key={section.label} className="px-6 pt-5">
            <p className="text-[12px] text-muted-foreground mb-3">{section.label}</p>
            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
              {section.items.map((item) => (
                <button
                  key={item.name}
                  onClick={() => handleNavigate(item.path)}
                  className="text-left text-[18px] font-bold text-foreground"
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="mx-6 my-6 h-px bg-border" />

        {/* Bottom links */}
        <nav className="px-6">
          {BOTTOM_LINKS.map((link) => (
            <button
              key={link.name}
              onClick={() => link.path && handleNavigate(link.path)}
              className="block w-full py-2.5 text-left text-[15px] text-muted-foreground"
            >
              {link.name}
            </button>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
