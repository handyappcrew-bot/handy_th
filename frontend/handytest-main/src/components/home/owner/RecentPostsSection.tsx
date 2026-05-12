import { ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Post {
  id: string;
  authorName: string;
  avatarColor: string;
  timeAgo: string;
  content: string;
}

interface RecentPostsSectionProps {
  posts: Post[];
}

export default function RecentPostsSection({ posts }: RecentPostsSectionProps) {
  const navigate = useNavigate();
  return (
    <section className="px-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h2 style={{ fontSize: 'clamp(18px, 5.3vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>최근 등록된 게시글</h2>
        <button onClick={() => navigate("/board")} className="flex items-center gap-0.5 text-[13px] text-muted-foreground">
          게시판
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {posts.map((post) => (
          <div
            key={post.id}
            onClick={() => navigate(`/board/${post.id}`)}
            style={{ display: 'flex', alignItems: 'center', gap: 'clamp(10px, 2.7vw, 12px)', padding: 'clamp(12px, 3.5vw, 14px) clamp(14px, 4vw, 16px)', backgroundColor: '#FFFFFF', borderRadius: '12px', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)', cursor: 'pointer' }}
          >
            <div
              style={{ width: 'clamp(40px, 11.7vw, 46px)', height: 'clamp(40px, 11.7vw, 46px)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 'clamp(12px, 3.5vw, 13px)', fontWeight: 600, color: '#FFFFFF', backgroundColor: post.avatarColor, flexShrink: 0 }}
            >
              {post.authorName.slice(-2)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span style={{ fontSize: 'clamp(13px, 3.7vw, 14px)', fontWeight: 600, color: '#19191B', letterSpacing: '-0.02em' }}>{post.authorName}</span>
                <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', color: '#9EA3AD', letterSpacing: '-0.02em', flexShrink: 0 }}>{post.timeAgo}</span>
              </div>
              <p style={{ fontSize: 'clamp(12px, 3.5vw, 13px)', color: '#70737B', letterSpacing: '-0.02em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{post.content}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
