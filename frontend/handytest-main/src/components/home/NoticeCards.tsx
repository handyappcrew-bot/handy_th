import { getLink, NotificationItem } from "@/utils/function";
import { X } from "lucide-react";
import { useNavToast } from "@/hooks/use-nav-toast";
interface NoticeCardsProps {
  notices: NotificationItem[];
  onDismiss: (id: string) => void;
}

const NoticeCards = ({ notices, onDismiss }: NoticeCardsProps) => {
  const { navigateTo } = useNavToast();
  if (notices.length === 0) return null;

  console.log(notices);

  const handleClick = (notice: NotificationItem) => {
    console.log(notice);
    const link = getLink(notice.type, notice.message, notice.reference_id);
    console.log("link:", link);
    if (link) navigateTo(link, undefined, { showLoading: true, forceAll: true });
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
              {notice.type === "게시판" ? (
                <span className="text-xs">📌</span>
              ) : (
                <span className="text-xs">📁</span>
              )}
              <span className="text-sm font-semibold text-[hsl(var(--role-badge))]">
                {notice.type}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{notice.message}</p>
          </div>
          {/* <span className="text-xs text-muted-foreground" style={{ textAlign: "right", paddingRight: 6 }}>+ {notice.extraCount}건</span> */}
        </div>
      ))}
    </div>
  );
};

export default NoticeCards;
