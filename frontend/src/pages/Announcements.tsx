import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { getNotice } from "@/api/public";

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

const DotBounce = () => (
  <div className="flex items-center justify-center py-20">
    <div style={{ display: 'flex', gap: '9px', alignItems: 'center' }}>
      {[0, 1, 2].map((i) => (
        <div key={i} style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'linear-gradient(135deg, #4261FF, #6b8cff)', animation: `navDotBounce 0.72s ease-in-out ${i * 0.12}s infinite` }} />
      ))}
    </div>
    <style>{`@keyframes navDotBounce { 0%, 80%, 100% { transform: scale(0.6) translateY(0); opacity: 0.3; } 40% { transform: scale(1.1) translateY(-4px); opacity: 1; } }`}</style>
  </div>
);

const Announcements = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getNotice();
        setNotices(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNotice();
  }, []);

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="pressable p-1">
          <ChevronLeft className="h-6 w-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>공지사항</h1>
      </div>
      <div className="border-b border-border" />

      {/* List */}
      <div style={{ backgroundColor: '#F7F7F8', minHeight: '100vh' }}>
        <div className="px-5 pt-4 pb-8 flex flex-col gap-3">
          {notices.map((notice) => (
            <button key={notice.id} onClick={() => navigate(`/announcements/${notice.id}`, { state: { notice } })}
              className="pressable w-full flex items-center justify-between rounded-2xl bg-white px-5 py-4"
              style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', textAlign: 'left' }}>
              <div className="flex-1 min-w-0 pr-3">
                <p style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }} className="truncate">{notice.title}</p>
                <p style={{ fontSize: '13px', fontWeight: 400, letterSpacing: '-0.02em', color: '#AAB4BF' }} className="mt-1">{formatDate(notice.created_at)}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: '#AAB4BF' }} />
            </button>
          ))}

          {loading ? <DotBounce /> : notices.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <span style={{ fontSize: '14px', color: '#AAB4BF' }}>공지사항이 없어요.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Announcements;
