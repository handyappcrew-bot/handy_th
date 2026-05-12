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

const Announcements = () => {
  const navigate = useNavigate();
  const [notices, setNotices] = useState<Notice[]>([]);

  useEffect(() => {
    const fetchNotice = async () => {
      try {
        const data = await getNotice();
        setNotices(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchNotice();
  }, []);

  return (
    <div className="min-h-screen max-w-lg mx-auto" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1">
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
              className="w-full flex items-center justify-between rounded-2xl bg-white px-5 py-4"
              style={{ boxShadow: '2px 2px 12px rgba(0,0,0,0.06)', textAlign: 'left' }}>
              <div className="flex-1 min-w-0 pr-3">
                <p style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em', color: '#19191B' }} className="truncate">{notice.title}</p>
                <p style={{ fontSize: '13px', fontWeight: 400, letterSpacing: '-0.02em', color: '#AAB4BF' }} className="mt-1">{formatDate(notice.created_at)}</p>
              </div>
              <ChevronRight className="h-5 w-5 flex-shrink-0" style={{ color: '#AAB4BF' }} />
            </button>
          ))}

          {notices.length === 0 && (
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
