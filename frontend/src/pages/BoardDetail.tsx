import { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, MessageSquare, Eye, MoreVertical, Send, CornerDownRight, Pencil, Trash2, MessageCircle, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialogComp from "@/components/ui/ConfirmDialog";
import { fetchBoardInfo, fetchBoardViewers, Comment, PostDetail, Viewer, addComment, deleteComment, deleteBoard } from "@/api/board";

const CURRENT_USER = localStorage.getItem("currentUserName") ?? "";
const CURRENT_EMPLOYEE_ID = Number(localStorage.getItem("currentEmployeeId") ?? 0);

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  "공지사항": { bg: '#E8F3FF', color: '#4261FF' },
  "건의사항": { bg: '#ECFFF1', color: '#1EDC83' },
  "비품관리": { bg: '#FDF9DF', color: '#FFB300' },
  "대타요청": { bg: '#FFEAE6', color: '#FF3D3D' },
  "일반 게시글": { bg: '#F7F7F8', color: '#AAB4BF' },
};

// --- Helper Components ---
function PopoverMenu({ open, onClose, children, anchorRef }: { open: boolean; onClose: () => void; children: React.ReactNode; anchorRef: React.RefObject<HTMLButtonElement> }) {
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node) && anchorRef.current && !anchorRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, onClose, anchorRef]);
  if (!open) return null;
  return (
    <div ref={menuRef} className="absolute right-0 top-full mt-1 bg-white rounded-xl border border-border z-50 overflow-hidden" style={{ minWidth: '140px', boxShadow: '2px 2px 12px rgba(0,0,0,0.12)' }}>
      {children}
    </div>
  );
}

function CommentItem({ comment, menuOpen, onToggleMenu, onCloseMenu, onReply, onDelete }: {
  comment: Comment; menuOpen: boolean; onToggleMenu: () => void; onCloseMenu: () => void; onReply?: () => void; onDelete: () => void;
}) {
  const moreRef = useRef<HTMLButtonElement>(null!);

  // 날짜 가공 (ISO -> MM.DD HH:mm)
  const displayTime = useMemo(() => {
    if (!comment.created_at) return "";
    const d = new Date(comment.created_at);
    const now = new Date();

    const isToday =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

    if (isToday) {
      const diffMin = Math.floor((now.getTime() - d.getTime()) / 1000 / 60);
      if (diffMin < 1) return "방금 전";
      if (diffMin < 60) return `${diffMin}분 전`;
      return `${Math.floor(diffMin / 60)}시간 전`;
    }

    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }, [comment.created_at]);

  const roleLabel = comment.role === 'owner' ? '사장님' : '알바생';

  return (
    <div className="flex items-start gap-3 py-3">
      <div className="flex items-center justify-center rounded-full bg-muted flex-shrink-0" style={{ width: '40px', height: '40px', fontSize: '18px' }}>👤</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#19191B' }}>{comment.writer}</span>
            <span className="rounded-full px-2 py-0.5" style={{ fontSize: '11px', backgroundColor: '#E8F3FF', color: '#4261FF' }}>{roleLabel}</span>
          </div>
          <div className="flex items-center gap-1.5 relative">
            <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{displayTime}</span>
            <button ref={moreRef} onClick={onToggleMenu}><MoreVertical className="h-4 w-4 text-muted-foreground" /></button>
            <PopoverMenu open={menuOpen} onClose={onCloseMenu} anchorRef={moreRef}>
              {onReply && (
                <button onClick={onReply} className="flex items-center justify-between w-full px-4 py-3 border-b border-border" style={{ fontSize: '14px', color: '#19191B' }}>
                  <span>답글달기</span><MessageCircle className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
              {comment.isMyComment && (
                <button onClick={onDelete} className="flex items-center justify-between w-full px-4 py-3" style={{ fontSize: '14px', color: '#19191B' }}>
                  <span>삭제하기</span><Trash2 className="h-4 w-4 text-muted-foreground" />
                </button>
              )}
            </PopoverMenu>
          </div>
        </div>
        <p className="mt-1 cursor-pointer" style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.5' }} onClick={() => onReply?.()}>{comment.content}</p>
      </div>
    </div>
  );
}

// --- Main Component ---
export default function BoardDetail() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const postId = Number(id);

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [replyTo, setReplyTo] = useState<Comment | null>(null);

  const [showPostMenu, setShowPostMenu] = useState(false);
  const postMenuRef = useRef<HTMLButtonElement>(null!);
  const [deletePostDialog, setDeletePostDialog] = useState(false);
  const [commentMenuId, setCommentMenuId] = useState<number | null>(null);
  const [selectedComment, setSelectedComment] = useState<Comment | null>(null);
  const [deleteCommentDialog, setDeleteCommentDialog] = useState(false);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  const [viewersLoading, setViewersLoading] = useState(false);

  const currentRole = localStorage.getItem("currentRole") ?? "employee";
  const isOwner = currentRole === "owner";

  const handleOpenViewers = async () => {
    if (!isOwner) return;
    setViewersOpen(true);
    setViewersLoading(true);
    try {
      const data = await fetchBoardViewers(postId);
      setViewers(data);
    } catch {
      setViewers([]);
    } finally {
      setViewersLoading(false);
    }
  };

  const buildComments = (rawComments: any[]) => {
    const allComments: Comment[] = rawComments.map((c: any) => ({
      ...c,
      id: Number(c.id),
      parent_id: c.parent_id != null ? Number(c.parent_id) : null,
      isMyComment: c.writer === CURRENT_USER,
      replies: [],
    }));
    const commentMap: Record<string, Comment> = {};
    allComments.forEach(c => { commentMap[String(c.id)] = c; });
    const rootComments: Comment[] = [];
    allComments.forEach(c => {
      if (c.parent_id != null && commentMap[String(c.parent_id)]) {
        commentMap[String(c.parent_id)].replies!.push(c);
      } else {
        rootComments.push(c);
      }
    });
    return rootComments;
  };

  useEffect(() => {
    const getBoardDetail = async () => {
      try {
        setLoading(true);
        const data = await fetchBoardInfo(postId);
        setPost(data);
        console.log(data.photos);
        setComments(buildComments(data.comments));
      } catch (err) {
        console.error("로딩 에러:", err);
        toast({ description: "데이터를 처리하는 중 오류가 발생했습니다.", variant: "destructive", duration: 2000 });
      } finally {
        setLoading(false);
      }
    };
    if (postId) getBoardDetail();
  }, [postId]);

  const displayDate = useMemo(() => {
    if (!post?.created_at) return "";
    return post.created_at.split('T')[0].replace(/-/g, '.');
  }, [post]);

  const isMyPost = post?.writer === CURRENT_USER;
  const catStyle = post ? (CATEGORY_COLORS[post.category] || { bg: '#F7F7F8', color: '#AAB4BF' }) : { bg: '#F7F7F8', color: '#AAB4BF' };

  const handleSendComment = async () => {
    if (!commentText.trim() || isSending) return;  // ← isSending 체크
    setIsSending(true);
    try {
      await addComment(postId, commentText, replyTo?.id ?? null);
      toast({ description: "댓글이 등록되었습니다.", duration: 2000 });
      setCommentText("");
      setReplyTo(null);
      const data = await fetchBoardInfo(postId);
      setPost(data);
      setComments(buildComments(data.comments));
    } catch {
      toast({ description: "댓글 등록에 실패했습니다.", variant: "destructive", duration: 2000 });
    } finally {
      setIsSending(false);  // ← 완료 후 해제
    }
  };

  const handleDeletePost = async () => {
    try {
      await deleteBoard(postId);
      setDeletePostDialog(false);
      toast({ description: "게시글이 삭제되었어요", duration: 2000 });
      navigate(-1);
    } catch {
      toast({ description: "게시글 삭제에 실패했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  const handleDeleteComment = async () => {
    if (!selectedComment) return;
    try {
      await deleteComment(selectedComment.id);
      toast({ description: "댓글이 삭제되었어요", duration: 2000 });
      setDeleteCommentDialog(false);
      setSelectedComment(null);

      const data = await fetchBoardInfo(postId);
      setPost(data);
      setComments(buildComments(data.comments));
    } catch {
      toast({ description: "댓글 삭제에 실패했습니다.", variant: "destructive", duration: 2000 });
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-white">로딩 중...</div>;
  if (!post) return <div className="min-h-screen flex items-center justify-center bg-white">게시글을 찾을 수 없습니다.</div>;

  return (
    <div className="min-h-screen max-w-lg mx-auto flex flex-col" style={{ backgroundColor: '#F7F7F8' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1"><ChevronLeft className="h-6 w-6 text-foreground" /></button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: '#19191B' }}>게시판</h1>
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        {/* 게시글 본문 */}
        <div className="mx-4 mt-4 mb-3 rounded-2xl bg-white p-4" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
          <span className="inline-block rounded-md px-2 py-0.5 mb-4" style={{ fontSize: '12px', fontWeight: 500, backgroundColor: catStyle.bg, color: catStyle.color }}>{post.category}</span>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center rounded-full bg-muted" style={{ width: '44px', height: '44px', fontSize: '20px' }}>👤</div>
              <div>
                <div className="flex items-center gap-1 mb-0.5">
                  {post.role === 'owner' ? (
                    <span className="rounded-full px-2 py-0.5" style={{ fontSize: '12px', color: '#70737B', backgroundColor: '#F7F7F8' }}>
                      사장님
                    </span>
                  ) : (
                    <>
                      <span style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }}>{post.writer}</span>
                      <span className="rounded-full px-2 py-0.5" style={{ fontSize: '12px', color: '#70737B', backgroundColor: '#F7F7F8' }}>
                        알바생
                      </span>
                    </>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{displayDate}</span>
              </div>
            </div>
            {isMyPost && (
              <div className="relative">
                <button ref={postMenuRef} onClick={() => setShowPostMenu(!showPostMenu)} className="p-1">
                  <MoreVertical className="h-5 w-5 text-muted-foreground" />
                </button>
                <PopoverMenu open={showPostMenu} onClose={() => setShowPostMenu(false)} anchorRef={postMenuRef}>
                  <button onClick={() => { setShowPostMenu(false); navigate("/board/write", { state: { edit: true, post } }); }}
                    className="flex items-center justify-between w-full px-4 py-3 border-b border-border text-sm text-[#19191B]">
                    <span>수정하기</span><Pencil className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <button onClick={() => { setShowPostMenu(false); setDeletePostDialog(true); }}
                    className="flex items-center justify-between w-full px-4 py-3 text-sm text-[#19191B]">
                    <span>삭제하기</span><Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </PopoverMenu>
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#19191B', marginBottom: '12px' }}>{post.title}</h2>
          <p className="whitespace-pre-line mb-4" style={{ fontSize: '14px', color: '#70737B', lineHeight: '1.6' }}>{post.content}</p>

          {post.photos && post.photos.length > 0 && (
            <div className="flex gap-2 overflow-x-auto mb-4 no-scrollbar">
              {post.photos.map((photo, idx) => (
                <img key={idx} src={photo.startsWith('/uploads') ? `http://localhost:8000${photo}` : photo} alt="" className="flex-shrink-0 rounded-xl object-cover cursor-pointer"
                  style={{ width: '180px', height: '220px' }} onClick={() => setLightboxPhoto(photo.startsWith('/uploads') ? `http://localhost:8000${photo}` : photo)} />
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-[#AAB4BF]">
            <div className="flex items-center gap-1.5">
              <MessageSquare className="h-4 w-4" />
              <span style={{ fontSize: '13px' }}>{post.comment_count}</span>
            </div>
            <button
              onClick={handleOpenViewers}
              className={`flex items-center gap-1.5 ${isOwner ? "cursor-pointer active:opacity-70" : "cursor-default"}`}
            >
              <Eye className="h-4 w-4" />
              <span style={{ fontSize: '13px' }}>{post.view_count ?? 0}</span>
            </button>
          </div>
        </div>

        {/* 댓글 영역 */}
        <div className="mx-4 rounded-2xl bg-white p-4" style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)' }}>
          <p style={{ fontSize: '16px', fontWeight: 700, color: '#19191B', marginBottom: '16px' }}>댓글 {post.comment_count}</p>
          {comments.length === 0 ? (
            <div className="flex items-center justify-center py-10 text-sm text-[#AAB4BF]">등록된 댓글이 없어요.</div>
          ) : (
            <div className="space-y-1">
              {comments.map((comment) => (
                <div key={comment.id}>
                  {/* 최상위 댓글 */}
                  <CommentItem
                    comment={comment}
                    menuOpen={commentMenuId === comment.id}
                    onToggleMenu={() => setCommentMenuId(commentMenuId === comment.id ? null : comment.id)}
                    onCloseMenu={() => setCommentMenuId(null)}
                    onReply={() => { setCommentMenuId(null); setReplyTo(comment); }}
                    onDelete={() => {
                      setSelectedComment(comment);
                      setDeleteCommentDialog(true);
                    }}
                  />

                  {/* 대댓글 리스트: 부모 댓글의 replies에 담긴 것만 렌더링 */}
                  {comment.replies && comment.replies.length > 0 && comment.replies.map((reply) => (
                    <div key={reply.id} className="pl-6 flex items-start gap-2 bg-gray-50/50 rounded-lg">
                      <CornerDownRight className="h-4 w-4 text-muted-foreground mt-3 flex-shrink-0" />
                      <div className="flex-1">
                        <CommentItem
                          comment={reply}
                          menuOpen={commentMenuId === reply.id}
                          onToggleMenu={() => setCommentMenuId(commentMenuId === reply.id ? null : reply.id)}
                          onCloseMenu={() => setCommentMenuId(null)}
                          onDelete={() => {
                            setSelectedComment(reply);
                            setDeleteCommentDialog(true);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer (Input) */}
      <div className="sticky bottom-0 border-t border-border px-5 py-3 bg-white">
        {replyTo && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[13px] text-[#4261FF] font-medium">{replyTo.writer}님에게 답글 작성 중</span>
            <button onClick={() => setReplyTo(null)}><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input type="text" placeholder={replyTo ? "답글 입력하기" : "댓글 입력하기"}
            value={commentText} onChange={(e) => setCommentText(e.target.value)}
            className="flex-1 rounded-xl border border-border px-4 text-sm h-[44px] focus:outline-none focus:border-primary" />
          <button onClick={handleSendComment} className="flex items-center justify-center w-11 h-11">
            <Send className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* 조회인원 바텀시트 */}
      {viewersOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => setViewersOpen(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#19191B' }}>
                조회 인원 {viewersLoading ? "" : `${viewers.length}명`}
              </h3>
              <button onClick={() => setViewersOpen(false)} className="p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
            <div className="px-5 pb-8 max-h-[60vh] overflow-y-auto">
              {viewersLoading ? (
                <div className="flex justify-center py-10 text-sm text-[#AAB4BF]">불러오는 중...</div>
              ) : viewers.length === 0 ? (
                <div className="flex justify-center py-10 text-sm text-[#AAB4BF]">아직 읽은 직원이 없어요</div>
              ) : (
                viewers.map((v, i) => {
                  const roleLabel = v.role === "owner" ? "사장님" : v.role === "part_time" ? "알바생" : "정규직";
                  const roleStyle = v.role === "owner"
                    ? { bg: '#FDF9DF', color: '#FFB300' }
                    : v.role === "part_time"
                    ? { bg: '#E8F3FF', color: '#4261FF' }
                    : { bg: '#ECFFF1', color: '#1EDC83' };
                  const timeStr = v.viewed_at ? (() => {
                    const d = new Date(v.viewed_at);
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const hh = String(d.getHours()).padStart(2, '0');
                    const min = String(d.getMinutes()).padStart(2, '0');
                    return `${mm}.${dd} ${hh}:${min}`;
                  })() : "";
                  return (
                    <div key={i} className="flex items-center justify-between py-4 border-b border-border last:border-0">
                      <div className="flex items-center gap-2">
                        <span style={{ fontSize: '15px', fontWeight: 600, color: '#19191B' }}>{v.name}</span>
                        <span className="rounded-full px-2 py-0.5" style={{ fontSize: '11px', fontWeight: 500, backgroundColor: roleStyle.bg, color: roleStyle.color }}>
                          {roleLabel}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#AAB4BF' }}>{timeStr} 읽음</span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex justify-center pb-4">
              <div className="w-10 h-1 rounded-full bg-border" />
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <ConfirmDialogComp open={deletePostDialog} onOpenChange={setDeletePostDialog} title="게시글 삭제"
        description={<>해당 게시글을 삭제하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setDeletePostDialog(false), variant: "cancel" }, { label: "삭제하기", onClick: handleDeletePost }]} />

      <ConfirmDialogComp open={deleteCommentDialog} onOpenChange={setDeleteCommentDialog} title="댓글 삭제"
        description="댓글을 삭제하시겠어요?"
        buttons={[{ label: "취소", onClick: () => setDeleteCommentDialog(false), variant: "cancel" }, { label: "삭제하기", onClick: handleDeleteComment }]} />

      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxPhoto(null)}>

          <button className="pressable absolute top-4 right-4 p-2" onClick={() => setLightboxPhoto(null)}>
            <X className="h-7 w-7 text-white" />
          </button>
          <img src={lightboxPhoto} alt="" className="max-w-[90vw] max-h-[85vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}