import { getPhotoUrl } from "@/utils/function";
import { ChevronLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

const FeedbackDetail = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const item = location.state as {
    id: number;
    title: string;
    content: string;
    images: string[];
    date: string;
    status: "접수" | "완료";
    reply?: string;
    replyDate?: string;
  } | null;

  if (!item) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">데이터를 찾을 수 없습니다.</p>
      </div>
    );
  }

  console.log(item);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FFFFFF' }}>
      {/* Header */}
      <div className="flex items-center gap-2 px-2 pt-4 pb-2 sticky top-0 z-10" style={{ backgroundColor: '#FFFFFF' }}>
        <button onClick={() => navigate(-1)} className="p-1">
          <ChevronLeft className="w-6 h-6 text-foreground" />
        </button>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#19191B' }}>건의 내역 상세</h1>
      </div>


      {/* Status banner */}
      <div className="px-5 py-3">
        <p className="text-base font-semibold text-foreground">
          건의 내용이{" "}
          <span className={item.status === "접수" ? "text-primary" : "text-green-500"}>
            {item.status === "접수" ? "접수" : "답변 완료"}
          </span>
          되었어요
        </p>
      </div>

      <div className="border-b border-border" />

      {/* Feedback content */}
      <div className="px-5 py-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">건의 내용</h3>
        <div className="space-y-3">
          <div className="flex">
            <span className="text-sm text-muted-foreground w-16 flex-shrink-0">접수일</span>
            <span className="text-sm font-semibold text-foreground">{item.date}</span>
          </div>
          <div className="flex">
            <span className="text-sm text-muted-foreground w-16 flex-shrink-0">제목</span>
            <span className="text-sm font-medium text-foreground">{item.title}</span>
          </div>
          <div className="flex">
            <span className="text-sm text-muted-foreground w-16 flex-shrink-0">건의 내용</span>
            <span className="text-sm text-foreground flex-1">{item.content}</span>
          </div>
          {item.images && item.images.length > 0 && (
            <div className="flex">
              <span className="text-sm text-muted-foreground w-16 flex-shrink-0">이미지</span>
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((img, idx) => (
                  <img key={idx} src={getPhotoUrl(img)} alt="" className="w-36 h-36 rounded-lg object-cover flex-shrink-0" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Reply section (완료 status only) */}
      {item.status === "완료" && item.reply && (
        <>
          <div className="h-3 bg-muted" />
          <div className="px-5 py-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">답변내용</h3>
            <div className="space-y-3">
              <div className="flex">
                <span className="text-sm text-muted-foreground w-16 flex-shrink-0">답변일</span>
                <span className="text-sm font-semibold text-foreground">{item.replyDate}</span>
              </div>
              <div className="flex">
                <span className="text-sm text-muted-foreground w-16 flex-shrink-0">답변 내용</span>
                <span className="text-sm text-foreground flex-1">{item.reply}</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default FeedbackDetail;
