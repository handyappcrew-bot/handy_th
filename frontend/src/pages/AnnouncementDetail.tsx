import { useState, useEffect } from "react";
import { ChevronLeft, X } from "lucide-react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { getNoticeDetail } from "@/api/public";

type Notice = {
  id: number;
  title: string;
  content: string;
  image: string[] | null;
  created_at: string;
};

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
};

const AnnouncementDetail = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [notice, setNotice] = useState<Notice | null>(location.state?.notice ?? null);
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  useEffect(() => {
    if (notice) return; // location.state로 이미 있으면 스킵
    const fetch = async () => {
      try {
        const data = await getNoticeDetail(Number(id));
        setNotice(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetch();
  }, [id]);

  if (!notice) return null;

  return (
    <div className="min-h-screen flex flex-col max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>공지사항</h1>
      </div>
      <div className="border-b border-border" />

      {/* Content */}
      <div className="flex-1 px-5 py-6">
        <h2 style={{ fontSize: '18px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B', lineHeight: '1.5' }}>{notice.title}</h2>
        <p style={{ fontSize: '13px', color: '#AAB4BF', letterSpacing: '-0.02em' }} className="mt-1">{formatDate(notice.created_at)}</p>

        <div className="mt-6">
          <p style={{ fontSize: '15px', color: '#70737B', letterSpacing: '-0.02em', lineHeight: '1.7' }} className="whitespace-pre-line">{notice.content}</p>
        </div>

        {notice.image && notice.image.length > 0 && (
          <div className="flex gap-3 mt-6 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {notice.image.map((img, idx) => (
              <button key={idx} onClick={() => setLightboxPhoto(img)} className="flex-shrink-0">
                <img src={img} alt="" className="rounded-xl object-cover" style={{ width: '160px', height: '160px' }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 이미지 확대 라이트박스 */}
      {lightboxPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={() => setLightboxPhoto(null)}>
          <button className="absolute top-4 right-4 p-2" onClick={() => setLightboxPhoto(null)}>
            <X className="h-7 w-7 text-white" />
          </button>
          <img src={lightboxPhoto} alt="" className="rounded-xl object-contain" style={{ maxWidth: '90vw', maxHeight: '85vh' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
};

export default AnnouncementDetail;