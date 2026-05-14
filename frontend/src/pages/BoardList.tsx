import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useIsPresent } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, Search, MessageSquare, Plus } from "lucide-react";
import { Post, fetchBoardList } from "@/api/board";
import { moveToHome } from "@/utils/function";

const categories = ["전체", "공지사항", "건의사항", "비품관리", "대타요청", "일반 게시글"];

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  "공지사항": { bg: '#E8F3FF', color: '#4261FF' },
  "건의사항": { bg: '#ECFFF1', color: '#1EDC83' },
  "비품관리": { bg: '#FDF9DF', color: '#FFB300' },
  "대타요청": { bg: '#FFEAE6', color: '#FF3D3D' },
  "일반 게시글": { bg: '#F7F7F8', color: '#AAB4BF' },
};

export default function BoardList() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [searchQuery, setSearchQuery] = useState("");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const filtered = useMemo(() => {
    return posts.filter((p) => {
      const categoryMatch = selectedCategory === "전체" || p.category === selectedCategory;
      const searchMatch = searchQuery === "" ||
        p.title.includes(searchQuery) ||
        p.content.includes(searchQuery);
      return categoryMatch && searchMatch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const notices = filtered.filter((p) => p.category === "공지사항");
  const others = filtered.filter((p) => p.category !== "공지사항");

  useEffect(() => {
    const getBoardList = async () => {
      const storeId = Number(localStorage.getItem("currentStoreId") ?? 0);
      if (!storeId) { setLoading(false); return; }
      try {
        const data = await fetchBoardList(storeId);
        setPosts(data);
      } catch (err) {
        console.log("화면 로드 실패:", err);
      } finally {
        setLoading(false);
      }
    }
    getBoardList();
  }, []);

  const [currentRole] = useState(() => localStorage.getItem("currentRole") ?? "employee");
  const isPresent = useIsPresent();

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#F7F7F8' }}>
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(moveToHome(currentRole))} className="pressable p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>게시판</h1>
      </div>

      <div className="px-5 pt-3 pb-24">
        <div className="relative mb-4">
          <input type="text" placeholder="게시글 검색" value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-border bg-white pl-4 pr-10 focus:outline-none focus:border-primary"
            style={{ height: '44px', fontSize: '14px', color: '#19191B', letterSpacing: '-0.02em' }} />
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button key={cat} onClick={() => setSelectedCategory(cat)}
                className="flex-shrink-0 rounded-full px-3 py-1.5"
                style={{ fontSize: '13px', fontWeight: 500, letterSpacing: '-0.02em', border: `1px solid ${isActive ? '#4261FF' : '#DBDCDF'}`, backgroundColor: isActive ? '#E8F3FF' : '#FFFFFF', color: isActive ? '#4261FF' : '#AAB4BF' }}>
                {cat}
              </button>
            );
          })}
        </div>

        {notices.length > 0 && (selectedCategory === "전체" || selectedCategory === "공지사항") && (
          <>
            <p style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', marginBottom: '12px' }}>공지사항</p>
            <div className="flex flex-col gap-3 mb-6">
              {notices.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          </>
        )}

        {others.length > 0 && (
          <>
            {selectedCategory === "전체" && (
              <p style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', marginBottom: '12px' }}>전체 게시글</p>
            )}
            <div className="flex flex-col gap-3">
              {others.map((post) => <PostCard key={post.id} post={post} />)}
            </div>
          </>
        )}

        {filtered.length === 0 && (
          <div className="flex items-center justify-center py-20">
            <span style={{ fontSize: '14px', color: '#AAB4BF' }}>게시글이 없어요.</span>
          </div>
        )}
      </div>

      {isPresent && createPortal(
        <div style={{ position: 'fixed', bottom: 'calc(74px + env(safe-area-inset-bottom) + 16px)', right: 'clamp(14px, 4vw, 20px)', zIndex: 50 }}>
          <button onClick={() => navigate("/board/write")}
            className="pressable"
            style={{ width: 'clamp(52px, 14.9vw, 56px)', height: 'clamp(52px, 14.9vw, 56px)', borderRadius: '50%', backgroundColor: '#4261FF', boxShadow: '2px 4px 16px rgba(66,97,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
            <Plus className="h-6 w-6 text-white" />
          </button>
        </div>,
        document.body
      )}

    </div>
  );
}

function PostCard({ post }: { post: Post }) {
  const navigate = useNavigate();
  const catStyle = CATEGORY_COLORS[post.category] || { bg: '#F7F7F8', color: '#AAB4BF' };

  return (
    <div className="rounded-2xl bg-white p-4 cursor-pointer" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}
      onClick={() => navigate(`/board/${post.id}`)}>
      <div className="flex items-start justify-between mb-2">
        <p style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>{post.title}</p>
        <span className="flex-shrink-0 ml-2 rounded-md px-2 py-0.5"
          style={{ fontSize: '12px', fontWeight: 500, letterSpacing: '-0.02em', backgroundColor: catStyle.bg, color: catStyle.color }}>
          {post.category}
        </span>
      </div>
      <p className="mb-3 line-clamp-2 whitespace-pre-line" style={{ fontSize: '13px', color: '#70737B', lineHeight: '1.5', letterSpacing: '-0.02em' }}>
        {post.content}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {post.role === 'owner' ? (
            <span className="rounded-full px-2 py-0.5" style={{ fontSize: '12px', color: '#70737B', backgroundColor: '#F7F7F8' }}>
              사장님
            </span>
          ) : (
            <>
              <span className="rounded-full px-2 py-0.5" style={{ fontSize: '12px', color: '#70737B', backgroundColor: '#F7F7F8' }}>
                {post.writer}
              </span>

              <span className="rounded-full px-2 py-0.5" style={{ fontSize: '12px', color: '#70737B', backgroundColor: '#F7F7F8' }}>
                알바생
              </span>
            </>
          )}
          <span style={{ fontSize: '12px', color: '#AAB4BF' }}>| {new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
        </div>
        <div className="flex items-center gap-1" style={{ color: '#AAB4BF' }}>
          <MessageSquare className="h-4 w-4" />
          <span style={{ fontSize: '12px' }}>{post.comments}</span>
        </div>
      </div>
    </div>
  );
}
