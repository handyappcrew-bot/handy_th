import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDragScroll } from "@/hooks/useDragScroll";

interface Notification {
  id: string;
  icon: "staff" | "board";
  title: string;
  description: string;
  count: number;
}

interface NotificationBarProps {
  notifications: Notification[];
  onNotificationClick?: (notification: Notification) => void;
}

const iconMap: Record<string, string> = {
  staff: "📌",
  board: "📋",
};

export default function NotificationBar({ notifications, onNotificationClick }: NotificationBarProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const dragRef = useDragScroll<HTMLDivElement>();

  const visible = notifications.filter((n) => !dismissed.has(n.id));
  if (visible.length === 0) return null;

  const handleDismiss = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDismissed((prev) => new Set(prev).add(id));
  };

  const handleClick = (n: Notification) => {
    setDismissed((prev) => new Set(prev).add(n.id));
    onNotificationClick?.(n);
  };

  return (
    <div ref={dragRef} className="flex gap-2 overflow-x-auto px-5 scrollbar-hide" style={{ paddingBottom: '8px' }}>
      {visible.map((n) => (
        <div
          key={n.id}
          onClick={() => handleClick(n)}
          className="pressable relative flex shrink-0 flex-col justify-between rounded-xl cursor-pointer"
          style={{ width: 155, height: 104, backgroundColor: 'hsl(var(--notice-card-bg))', padding: '12px' }}
        >
          <button
            onClick={(e) => handleDismiss(e, n.id)}
            className="pressable absolute right-2 top-2 p-1"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
          <div className="pr-5">
            <div className="flex items-center gap-1 mb-1">
              <span className="text-xs">{iconMap[n.icon]}</span>
              <span className="text-sm font-semibold" style={{ color: 'hsl(var(--role-badge))' }}>{n.title}</span>
            </div>
            <p className="text-sm font-medium text-foreground leading-snug">{n.description}</p>
          </div>
          <span className="text-xs text-muted-foreground" style={{ textAlign: 'right', paddingRight: 6 }}>+ {n.count}건</span>
        </div>
      ))}
    </div>
  );
}