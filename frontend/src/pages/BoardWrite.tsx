import { useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronDown, X, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { addBoard, modifyBoard } from "@/api/board";

const BASE_CATEGORIES = ["건의사항", "비품관리", "대타요청", "일반 게시글"];
const OWNER_CATEGORIES = ["공지사항", ...BASE_CATEGORIES];

export default function BoardWrite() {
  const currentRole = localStorage.getItem("currentRole") ?? "employee";
  const currentStoreId = Number(localStorage.getItem("currentStoreId") ?? 0);
  const categoryOptions = currentRole === "owner" ? OWNER_CATEGORIES : BASE_CATEGORIES;
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editData = location.state as {
    edit?: boolean;
    post?: { id: number; category: string; title: string; content: string; photos: string[] }
  } | null;
  const isEdit = editData?.edit === true;

  const [category, setCategory] = useState(editData?.post?.category || "");
  const [title, setTitle] = useState(editData?.post?.title || "");
  const [content, setContent] = useState(editData?.post?.content || "");
  const [photos, setPhotos] = useState<string[]>(editData?.post?.photos || []);
  const [showCategorySheet, setShowCategorySheet] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [deletePhotoIdx, setDeletePhotoIdx] = useState<number>(-1);
  const [deletePhotoDialog, setDeletePhotoDialog] = useState(false);
  const [exitDialog, setExitDialog] = useState(false);
  const [registerDialog, setRegisterDialog] = useState(false);

  // 카테고리 + 제목 + 내용 모두 입력해야 활성화
  const canSubmit = category !== "" && title.trim() !== "" && content.trim() !== "";
  const maxPhotos = 5;

  const handlePhotoUpload = (fromCamera = false) => {
    setShowPhotoSheet(false);
    if (photos.length >= maxPhotos) return;

    if (fileInputRef.current) {
      fileInputRef.current.accept = "image/*";
      fileInputRef.current.capture = fromCamera ? "environment" : "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = maxPhotos - photos.length;
    const selected = files.slice(0, remaining);

    selected.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setPhotos(prev => [...prev, reader.result as string]); // base64
      };
      reader.readAsDataURL(file);
    });

    e.target.value = ""; // 같은 파일 재선택 가능하게
  };

  const handleDeletePhoto = () => {
    setPhotos(photos.filter((_, i) => i !== deletePhotoIdx));
    setDeletePhotoDialog(false);
    setDeletePhotoIdx(-1);
  };

  const handleRegister = async () => {
    setRegisterDialog(false);
    try {
      if (isEdit) {
        await modifyBoard(editData!.post!.id, category, title, content, photos);
      } else {
        await addBoard(currentStoreId || 1, category, title, content, photos);
      }
      toast({ description: isEdit ? "게시글이 수정되었어요" : "게시글이 등록되었어요", duration: 2000 });
      setTimeout(() => navigate(-1), 500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "등록에 실패했습니다.";
      toast({ description: msg, variant: "destructive", duration: 3000 });
    }
  };



  return (
    <div className="min-h-screen bg-white max-w-lg mx-auto flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 px-2 pt-4 pb-2 border-b border-border" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => { if (title.trim() || content.trim() || photos.length > 0) { setExitDialog(true); } else { navigate(-1); } }} className="pressable p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>
          {isEdit ? "게시글 수정" : "게시글 작성"}
        </h1>
      </div>

      <div className="flex-1 flex flex-col px-5 pt-4">
        {/* 카테고리 선택 */}
        <button onClick={() => setShowCategorySheet(true)}
          className="pressable w-full flex items-center justify-between rounded-xl border border-border px-4 mb-4"
          style={{ height: '48px' }}>
          <span style={{ fontSize: '15px', letterSpacing: '-0.02em', color: category ? '#19191B' : '#AAB4BF' }}>
            {category || "카테고리 선택하기"}
          </span>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </button>

        {/* 제목 */}
        <input type="text" placeholder="제목을 입력해주세요 (최대 20자)" maxLength={20}
          value={title} onChange={(e) => setTitle(e.target.value)}
          data-no-focus
          className="w-full border-b border-border pb-3 mb-3 bg-transparent focus:outline-none"
          style={{ fontSize: '16px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }} />

        {/* 내용 */}
        <textarea placeholder="내용을 입력하세요. (최대 1000자)" maxLength={1000}
          value={content} onChange={(e) => setContent(e.target.value)}
          data-no-focus
          className="flex-1 w-full bg-transparent focus:outline-none resize-none min-h-[200px]"
          style={{ fontSize: '14px', letterSpacing: '-0.02em', color: '#19191B' }} />
      </div>

      {/* 하단: 사진 + 등록 버튼 */}
      <div className="px-5 pb-6">
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ scrollbarWidth: 'none' }}>
          {/* 업로드 버튼 - 5장 초과 시 비활성화 */}
          <button
            onClick={() => photos.length < maxPhotos && setShowPhotoSheet(true)}
            disabled={photos.length >= maxPhotos}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 rounded-xl border border-border"
            style={{ width: '120px', height: '120px', opacity: photos.length >= maxPhotos ? 0.4 : 1 }}>
            <div className="flex items-center justify-center rounded-xl" style={{ width: '44px', height: '44px', backgroundColor: '#4261FF' }}>
              <Camera className="h-5 w-5 text-white" />
            </div>
            <span style={{ fontSize: '13px', color: '#AAB4BF' }}>{photos.length} / {maxPhotos}</span>

          </button>

          {/* 업로드된 사진들 */}
          {photos.map((photo, idx) => (
            <div key={idx} className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: '120px', height: '120px' }}>
              <img src={(photo.startsWith('/uploads') ? `http://localhost:8000${photo}` : photo)} alt="" className="w-full h-full object-cover" />
              <button onClick={() => { setDeletePhotoIdx(idx); setDeletePhotoDialog(true); }}
                className="pressable absolute top-1.5 right-1.5 flex items-center justify-center rounded-full"
                style={{ width: '24px', height: '24px', backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <X className="h-4 w-4 text-white" />
              </button>
            </div>
          ))}
        </div>

        <button onClick={() => canSubmit && setRegisterDialog(true)} disabled={!canSubmit}
          className="w-full rounded-2xl py-4 font-semibold"
          style={{ backgroundColor: canSubmit ? '#4261FF' : '#DBDCDF', color: '#FFFFFF', fontSize: '16px' }}>
          {isEdit ? "수정하기" : "등록하기"}
        </button>
      </div>

      {/* 숨겨진 파일 입력 */}
      <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />

      {/* 카테고리 바텀시트 */}
      {showCategorySheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setShowCategorySheet(false)}>
          <div className="w-full max-w-lg bg-white" style={{ borderRadius: '20px 20px 0 0' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-6 pb-2">
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>카테고리 선택하기</h2>
              <button className="pressable" onClick={() => setShowCategorySheet(false)}>
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="px-5 pb-8">
              {categoryOptions.map((opt) => (
                <button key={opt} onClick={() => { setCategory(opt); setShowCategorySheet(false); }}
                  className="pressable w-full flex items-center justify-between py-4 border-b border-border last:border-0"
                  style={{ fontSize: '16px', fontWeight: category === opt ? 700 : 400, letterSpacing: '-0.02em', color: category === opt ? '#4261FF' : '#19191B' }}>
                  <span>{opt}</span>
                  {category === opt && (
                    <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
                      <path d="M1.5 7L6.5 12L16.5 1.5" stroke="#4261FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 사진 업로드 바텀시트 */}
      {showPhotoSheet && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 touch-none sheet-overlay" onClick={() => setShowPhotoSheet(false)}>
          <div className="w-full max-w-lg bg-white" style={{ borderRadius: '20px 20px 0 0' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 pt-6 pb-2">
              <h2 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>사진 업로드하기</h2>
              <button className="pressable" onClick={() => setShowPhotoSheet(false)}>
                <X style={{ width: '20px', height: '20px', color: '#19191B' }} strokeWidth={2.5} />
              </button>
            </div>
            <div className="flex flex-col px-5 pb-8" style={{ gap: '4px' }}>
              <button onClick={() => handlePhotoUpload(false)}
                className="pressable w-full flex items-center rounded-xl px-4"
                style={{ height: '48px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                앨범에서 선택하기
              </button>
              <button onClick={() => handlePhotoUpload(true)}
                className="pressable w-full flex items-center rounded-xl px-4"
                style={{ height: '48px', fontSize: '16px', fontWeight: 500, letterSpacing: '-0.02em', color: '#19191B' }}>
                카메라 촬영하기
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={deletePhotoDialog} onOpenChange={setDeletePhotoDialog} title="사진 삭제"
        description={<>업로드하신 사진을 삭제하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setDeletePhotoDialog(false), variant: "cancel" }, { label: "삭제하기", onClick: handleDeletePhoto }]} />
      <ConfirmDialog open={exitDialog} onOpenChange={setExitDialog} title="게시글 삭제"
        description={<>작성 중인 게시글을 삭제하시겠어요?<br />삭제 시 복구가 불가해요</>}
        buttons={[{ label: "취소", onClick: () => setExitDialog(false), variant: "cancel" }, { label: "삭제하기", onClick: () => navigate(-1) }]} />
      <ConfirmDialog open={registerDialog} onOpenChange={setRegisterDialog}
        title={isEdit ? "게시글 수정" : "게시글 등록"}
        description={isEdit ? <>해당 게시글이 수정돼요.<br />계속하시겠어요?</> : <>해당 게시글이 게시판에 등록돼요.<br />계속하시겠어요?</>}
        buttons={[{ label: "취소", onClick: () => setRegisterDialog(false), variant: "cancel" }, { label: isEdit ? "수정하기" : "등록하기", onClick: handleRegister }]} />
    </div>
  );
}