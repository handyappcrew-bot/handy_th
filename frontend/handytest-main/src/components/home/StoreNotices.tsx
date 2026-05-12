import { ChevronRight, User } from "lucide-react";
import { useNavToast } from "@/hooks/use-nav-toast";

interface Notice {
  id: string;
  author: string;
  timeAgo: string;
  content: string;
}

interface StoreNoticesProps {
  notices: Notice[];
}

const StoreNotices = ({ notices }: StoreNoticesProps) => {
  const { navigateTo } = useNavToast();
  return (
    <div className="px-5">
      <div className="mb-3 flex items-end justify-between">
        <div>
          <p style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>새롭게 등록된</p>
          <p style={{ fontSize: 'clamp(17px, 4.5vw, 22px)', fontWeight: 700, letterSpacing: '-0.01em', color: '#1E1E1E' }}>
            <span style={{ color: '#4261FF' }}>매장 공지</span>가 있어요
          </p>
        </div>
        <button onClick={() => navigateTo("/board", "게시판으로 이동했어요", { showLoading: true, forceAll: true })} className="pressable flex items-center text-muted-foreground mb-0.5" style={{ fontSize: '14px' }}>
          더보기 <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex flex-col gap-3">
        {notices.map((notice) => (
          <div
            key={notice.id}
            className="pressable flex items-center gap-3 rounded-xl bg-card p-4 cursor-pointer"
            style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}
            onClick={() => navigateTo(`/board/${notice.id}`, "게시판으로 이동했어요", { showLoading: true, forceAll: true })}
          >
            <div className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full bg-muted">
              <User className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[hsl(var(--notice-author))]">{notice.author}</span>
                <span className="shrink-0 text-xs font-medium text-[hsl(var(--notice-time))]">{notice.timeAgo}</span>
              </div>
              <p className="mt-1 text-base font-medium text-[hsl(var(--notice-content))] overflow-hidden text-ellipsis whitespace-nowrap">{notice.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StoreNotices;
