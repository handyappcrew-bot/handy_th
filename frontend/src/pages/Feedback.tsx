import { useState, useRef, useEffect } from "react";
import { ChevronLeft, X, ChevronRight, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { getFeedback, postFeedback } from "@/api/public";

// API 응답 원본 타입
type FeedbackRaw = {
  id: number;
  title: string;
  content: string;
  image: string[] | null;
  created_at: string;
  status: "pending" | "completed";
  answer?: string;
  answered_at?: string;
};

// 컴포넌트 내부 타입
interface FeedbackItem {
  id: number;
  title: string;
  content: string;
  images: string[];
  date: string;
  status: "접수" | "완료";
  reply?: string;
  replyDate?: string;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const mapFeedback = (raw: FeedbackRaw): FeedbackItem => ({
  id: raw.id,
  title: raw.title,
  content: raw.content,
  images: raw.image ?? [],
  date: formatDate(raw.created_at),
  status: raw.status === "pending" ? "접수" : "완료",
  reply: raw.answer,
  replyDate: raw.answered_at ? formatDate(raw.answered_at) : undefined,
});

const Feedback = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"submit" | "history">("submit");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [deleteTargetIndex, setDeleteTargetIndex] = useState<number | null>(null);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [feedbackLoading, setFeedbackLoading] = useState(true);
  const albumInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const isFormValid = title.trim().length > 0 && content.trim().length > 0;

  const member_id = 1; // TODO: JWT에서 꺼내오기

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const data: FeedbackRaw[] = await getFeedback();
        setFeedbackList(data.map(mapFeedback));
      } catch (err) {
        console.error(err);
      } finally {
        setFeedbackLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, 2 - images.length).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => setImages((prev) => prev.length >= 2 ? prev : [...prev, ev.target?.result as string]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
    setShowUploadSheet(false);
  };

  const handleDeleteImage = () => {
    if (deleteTargetIndex !== null) setImages((prev) => prev.filter((_, i) => i !== deleteTargetIndex));
    setDeleteTargetIndex(null);
    setShowDeleteDialog(false);
  };

  const handleSubmit = async () => {
    try {
      await postFeedback(member_id, title.trim(), content.trim(), images);
      setTitle(""); setContent(""); setImages([]);
      setShowSubmitDialog(false);
      // 목록 갱신
      const data: FeedbackRaw[] = await getFeedback();
      setFeedbackList(data.map(mapFeedback));
      setActiveTab("history");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto flex flex-col">
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="pressable p-1"><ChevronLeft className="w-6 h-6 text-foreground" /></button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>고객 건의함</h1>
      </div>

      <div className="flex px-5" style={{ gap: '36px', borderBottom: '1px solid #AAB4BF', backgroundColor: '#FFFFFF' }}>
        {(["submit", "history"] as const).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} className="pressable py-3 relative"
            style={{ fontSize: '16px', fontWeight: activeTab === tab ? 700 : 500, letterSpacing: '-0.02em', color: activeTab === tab ? '#4261FF' : '#AAB4BF' }}>
            {tab === "submit" ? "건의 접수" : "건의 내역"}
            {activeTab === tab && <div className="absolute bottom-0 left-0 w-full h-[3px] rounded-full" style={{ backgroundColor: '#4261FF' }} />}
          </button>
        ))}
      </div>

      {activeTab === "submit" ? (
        <div className="flex-1 flex flex-col px-5 pt-5 pb-8" style={{ backgroundColor: '#FFFFFF' }}>
          <div className="bg-muted rounded-xl px-5 py-4 text-center mb-6">
            <p className="text-sm text-muted-foreground">핸디에 바라는 내용이나</p>
            <p className="text-sm text-muted-foreground">서비스 개선 사항이 있다면 작성해주세요.</p>
          </div>
          <input type="text" maxLength={20} placeholder="제목을 입력해주세요 (최대 20자)" value={title} onChange={(e) => setTitle(e.target.value)}
            style={{ outline: 'none', boxShadow: 'none' }}
            className="w-full text-base font-semibold text-primary placeholder:text-primary/50 bg-transparent border-b-2 border-primary pb-3 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 mb-0" />
          <textarea maxLength={500} placeholder="내용을 입력해주세요. (최대 500자)" value={content} onChange={(e) => setContent(e.target.value)}
            style={{ outline: 'none', boxShadow: 'none' }}
            className="w-full flex-1 text-sm text-foreground placeholder:[color:#AAB4BF] bg-transparent pt-4 pb-3 outline-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 resize-none min-h-[120px]" />
          <div className="flex-1" />
          <div className="flex gap-3 mt-4 overflow-x-auto scrollbar-none">
            <button onClick={() => images.length < 2 && setShowUploadSheet(true)} disabled={images.length >= 2}
              className={`w-[100px] h-[100px] rounded-2xl flex flex-col items-center justify-center flex-shrink-0 transition-colors ${images.length >= 2 ? "bg-[hsl(0,0%,85%)]" : "bg-primary/10"}`}>
              <Camera className={`w-8 h-8 mb-1.5 ${images.length >= 2 ? "text-[hsl(0,0%,75%)]" : "text-primary"}`} strokeWidth={1.5} />
              <span className={`text-xs font-medium ${images.length >= 2 ? "text-[hsl(0,0%,75%)]" : "text-muted-foreground"}`}>{images.length} / 2</span>
            </button>
            {images.map((img, idx) => (
              <div key={idx} className="relative w-[100px] h-[100px] rounded-xl overflow-hidden flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
                <button onClick={() => { setDeleteTargetIndex(idx); setShowDeleteDialog(true); }}
                  className="pressable absolute top-2 right-2 w-6 h-6 rounded-full bg-foreground/60 flex items-center justify-center">
                  <X className="w-4 h-4 text-background" />
                </button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">* 건의 내용을 작성해주시면 고객센터에서 확인 후<br />답변해드립니다.</p>
          <button disabled={!isFormValid} onClick={() => setShowSubmitDialog(true)}
            className={`w-full py-4 rounded-xl text-base font-semibold mt-4 transition-colors ${isFormValid ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>건의하기</button>
        </div>
      ) : (
        <div className="flex-1 px-5 pt-4 pb-8" style={{ backgroundColor: '#FFFFFF' }}>
          <span className="inline-block bg-muted rounded-full px-4 py-1.5 text-sm font-medium text-foreground mb-4">총 {feedbackList.length}건</span>
          <div className="space-y-3">
            {feedbackList.map((item) => (
              <button key={item.id} onClick={() => navigate(`/feedback/${item.id}`, { state: item })} className="pressable w-full text-left bg-muted rounded-xl px-5 py-4 flex items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${item.status === "접수" ? "bg-primary/10 text-primary" : "bg-green-100 text-green-600"}`}>{item.status}</span>
                    <span className="text-xs text-muted-foreground">{item.date}</span>
                  </div>
                  <p className="text-sm font-medium text-foreground">{item.title}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
            {feedbackLoading ? (
              <div className="flex items-center justify-center py-20">
                <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #4261FF, #6b8cff)', animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite` }} />
                  ))}
                </div>
                <style>{`@keyframes navDotBounce { 0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; } 40% { transform: scale(1.1) translateY(-4px); opacity: 1; } }`}</style>
              </div>
            ) : feedbackList.length === 0 && (
              <div className="flex items-center justify-center py-20">
                <span style={{ fontSize: '14px', color: '#AAB4BF' }}>건의 내역이 없어요.</span>
              </div>
            )}
          </div>
        </div>
      )}

      <input ref={albumInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelect} />

      {showUploadSheet && createPortal(
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setShowUploadSheet(false)}>
          <div className="w-full max-w-[430px] rounded-t-[20px] bg-white animate-in slide-in-from-bottom" onClick={e => e.stopPropagation()}>
            <div style={{ paddingLeft: '20px', paddingRight: '20px' }}>
              <div className="flex items-center justify-between" style={{ paddingTop: '30px', paddingBottom: '20px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>사진 업로드하기</h2>
                <button className="pressable p-1" onClick={() => setShowUploadSheet(false)}>
                  <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
                </button>
              </div>
              <div className="flex flex-col" style={{ gap: '4px', paddingBottom: '20px' }}>
                {[{ label: '앨범에서 선택하기', onClick: () => albumInputRef.current?.click() }, { label: '카메라 촬영하기', onClick: () => cameraInputRef.current?.click() }].map(({ label, onClick }) => (
                  <button key={label} onClick={onClick} className="pressable"
                    style={{ width: '100%', height: '48px', borderRadius: '10px', display: 'flex', alignItems: 'center', paddingLeft: '4px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      <ConfirmDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog} title="사진 삭제"
        description={<>업로드하신 사진을 삭제하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setShowDeleteDialog(false), variant: "cancel" }, { label: "삭제하기", onClick: handleDeleteImage }]} />

      <ConfirmDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog} title="건의하기"
        description={<>건의를 등록하시겠어요?<br />등록 시 수정이 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setShowSubmitDialog(false), variant: "cancel" }, { label: "건의하기", onClick: handleSubmit }]} />
    </div>
  );
};

export default Feedback;