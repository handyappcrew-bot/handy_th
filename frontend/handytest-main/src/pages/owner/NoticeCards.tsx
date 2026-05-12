import { X } from "lucide-react";
import { useNavToast } from "@/hooks/use-nav-toast";

interface NoticeCard {
  id: string;
  type: "board" | "salary";
  title: string;
  description: string;
  extraCount: number;
}

interface NoticeCardsProps {
  notices: NoticeCard[];
  onDismiss: (id: string) => void;
}

const NoticeCards = ({ notices, onDismiss }: NoticeCardsProps) => {
  const { navigateTo } = useNavToast();
  if (notices.length === 0) return null;

  const handleClick = (notice: NoticeCard) => {
    if (notice.type === "board") navigateTo(`/board/${notice.id}`, "게시판으로 이동했어요");
    else if (notice.type === "salary") navigateTo("/salary/pay-stub/1", "급여 명세서로 이동했어요");
  };

  return (
    <div className="flex gap-2 overflow-x-auto px-5 pb-2 scrollbar-hide" style={{ scrollbarWidth: "none", msOverflowStyle: "none", WebkitOverflowScrolling: "touch" }}>
      {notices.map((notice) => (
        <div
          key={notice.id}
          onClick={() => handleClick(notice)}
          className="pressable relative flex shrink-0 flex-col justify-between rounded-xl bg-[hsl(var(--notice-card-bg))] p-3 cursor-pointer"
          style={{ width: 155, height: 104 }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDismiss(notice.id); }}
            className="pressable absolute right-2 top-2 p-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="pr-5">
            <div className="flex items-center gap-1 mb-1">
              {notice.type === "board" ? (
                <span className="text-xs">📌</span>
              ) : (
                <span className="text-xs">📁</span>
              )}
              <span className="text-sm font-semibold text-[hsl(var(--role-badge))]">
                {notice.title}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{notice.description}</p>
          </div>
          <span className="text-xs text-muted-foreground" style={{ textAlign: "right", paddingRight: 6 }}>+ {notice.extraCount}건</span>
        </div>
      ))}
    </div>
  );
};

export default NoticeCards;
