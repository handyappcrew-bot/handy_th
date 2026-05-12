import { ChevronRight, ChevronLeft, ChevronDown, Info, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


interface Employee {
  id: string;
  name: string;
  time: string;
  status: string;
  badgeType: "오픈" | "미들" | "마감" | "오픈,미들";
  avatarColor: string;
  attendanceStatus?: "normal" | "late" | "absent";
}

interface AttendanceCard {
  type: "working" | "checkin" | "checkout" | "absent";
  label: string;
  description: string;
  count: number;
  totalCount: number;
  employees: Employee[];
}

interface AttendanceSectionProps {
  stats: { checkin: number; late: number; checkout: number; absent: number };
  cards: AttendanceCard[];
  date: string;
  hideDateSelector?: boolean;
}

const badgeColorMap: Record<string, string> = {
  "오픈": "bg-shift-open-bg text-shift-open",
  "미들": "bg-shift-middle-bg text-shift-middle",
  "마감": "bg-shift-close-bg text-shift-close",
  "오픈,미들": "bg-shift-open-bg text-shift-open",
};

const statusDotColor: Record<string, string> = {
  normal: "bg-status-green",
  late: "bg-status-orange",
  absent: "bg-status-red",
};

function EmployeeAvatar({ employee }: { employee: Employee }) {
  const dotColor = statusDotColor[employee.attendanceStatus || "normal"];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 'clamp(64px, 20vw, 76px)', textAlign: 'center' }}>
      <div style={{ position: 'relative' }}>
        {/* Badge above avatar */}
        <span
          className={badgeColorMap[employee.badgeType] || "bg-muted text-muted-foreground"}
          style={{
            display: 'inline-block',
            textAlign: 'center',
            padding: '2px 10px',
            borderRadius: '100px',
            fontSize: 'clamp(8px, 2.4vw, 9px)',
            fontWeight: 600,
            whiteSpace: 'nowrap' as const,
            marginBottom: '8px',
            letterSpacing: '-0.02em',
            maxWidth: '72px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            alignSelf: 'center',
          }}
        >
          {employee.badgeType}
        </span>
        {/* Avatar */}
        <div style={{ position: 'relative', marginBottom: '8px' }}>
          <div
            style={{
              width: 'clamp(44px, 13.9vw, 52px)',
              height: 'clamp(44px, 13.9vw, 52px)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 'clamp(13px, 4vw, 16px)',
              fontWeight: 600,
              color: '#FFFFFF',
              margin: '0 auto',
              backgroundColor: employee.avatarColor,
            }}
          >
            {employee.name.slice(-2)}
          </div>
          {/* Status dot */}
          <div className={dotColor} style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderRadius: '50%', border: '2px solid #FFFFFF' }} />
        </div>
      </div>
      <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: 500, color: '#19191B', letterSpacing: '-0.02em' }}>{employee.name}</span>
      <span style={{ fontSize: 'clamp(10px, 2.9vw, 11px)', color: '#9EA3AD', letterSpacing: '-0.02em', marginTop: '2px' }}>{employee.time} {employee.status}</span>
    </div>
  );
}

function AttendanceCardView({ card }: { card: AttendanceCard }) {
  const innerScrollRef = useDragScroll();

  return (
    <div className="flex-shrink-0 snap-start w-full">
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'clamp(12px, 3.5vw, 14px)', padding: 'clamp(14px, 4vw, 18px)', paddingRight: 0, paddingLeft: 0, boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)' }}>
        <div className="flex items-center justify-between mb-4" style={{ paddingRight: 'clamp(16px, 5.3vw, 20px)', paddingLeft: 'clamp(16px, 5.3vw, 20px)' }}>
          <div className="flex items-center gap-1">
            <span style={{ fontSize: 'clamp(13px, 4vw, 15px)', color: '#19191B', letterSpacing: '-0.02em' }}>
              현재 <strong style={{ fontWeight: 700, color: '#4261FF' }}>{card.count}명</strong>이 {card.description}
            </span>
          </div>
          <span style={{ fontSize: 'clamp(11px, 3.5vw, 13px)', color: '#9EA3AD', letterSpacing: '-0.02em' }}>총 {card.totalCount}명</span>
        </div>
        {/* 오른쪽 페이드 아웃 래퍼 */}
        <div style={{ position: 'relative' }}>
          <div
            ref={innerScrollRef}
            className="flex overflow-x-auto scrollbar-hide"
            style={{ gap: 'clamp(10px, 2.7vw, 12px)', paddingRight: 'clamp(14px, 4vw, 18px)', paddingLeft: 'clamp(14px, 4vw, 18px)' }}
          >
            {card.employees.map((emp) => (
              <EmployeeAvatar key={emp.id} employee={emp} />
            ))}
          </div>
          {/* 왼쪽 페이드 그라디언트 */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '48px',
            height: '100%',
            pointerEvents: 'none',
          }} />
          {/* 오른쪽 페이드 그라디언트 */}
          <div style={{
            position: 'absolute',
            top: 0,
            right: 0,
            width: '48px',
            height: '100%',
            pointerEvents: 'none',
          }} />
        </div>
      </div>
    </div>
  );
}

function useScrollIndex(scrollRef: React.RefObject<HTMLDivElement>, itemCount: number) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || itemCount === 0) return;
    const scrollLeft = el.scrollLeft;
    const itemWidth = el.scrollWidth / itemCount;
    const index = Math.round(scrollLeft / itemWidth);
    setActiveIndex(Math.min(index, itemCount - 1));
  }, [scrollRef, itemCount]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  return activeIndex;
}

export default function AttendanceSection({ stats, cards, date, hideDateSelector }: AttendanceSectionProps) {
  const navigate = useNavigate();
  const outerScrollRef = useDragScroll({ snap: true });
  const [infoOpen, setInfoOpen] = useState(false);

  const activeIndex = useScrollIndex(outerScrollRef as React.RefObject<HTMLDivElement>, cards.length);

  

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between" style={{ padding: '0 clamp(16px, 5.3vw, 20px)', marginBottom: 'clamp(10px, 3.2vw, 12px)', marginTop: 'clamp(20px, 6.4vw, 24px)' }}>
        <div className="flex items-center gap-1">
          <h2 style={{ fontSize: 'clamp(17px, 5.3vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>근태 현황</h2>
          <button onClick={() => setInfoOpen(true)}>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <button onClick={() => navigate("/owner/attendance")} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: 'clamp(12px, 3.5vw, 13px)', color: '#9EA3AD', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.02em' }}>
          근태관리
          <ChevronRight style={{ width: '15px', height: '15px' }} />
        </button>
      </div>

      {/* Info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold flex items-center gap-1">
              <Info className="w-4 h-4 text-muted-foreground" />
              출퇴근 현황 확인
            </DialogTitle>
          </DialogHeader>
          <div className="text-[14px] text-muted-foreground text-center leading-relaxed">
            직원들의 출퇴근 현황을 한 눈에<br />
            확인할 수 있어요. 직원 프로필 사진<br />
            왼쪽 상단 아이콘 색상으로 상태를 구분해요
          </div>
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-status-green" />
              <span className="text-[13px] text-foreground">정상 출근</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-status-orange" />
              <span className="text-[13px] text-foreground">지각</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-status-blue" />
              <span className="text-[13px] text-foreground">퇴근</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-status-red" />
              <span className="text-[13px] text-foreground">결근</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>


      {/* Stats summary - two separate boxes */}
      <div style={{ display: 'flex', gap: '8px', padding: '0 20px', marginBottom: 'clamp(10px, 2.7vw, 12px)' }}>
        {/* 출근/지각 box */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 'clamp(12px, 3.5vw, 14px)', padding: 'clamp(12px, 3.5vw, 16px) 0', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 5.3vw, 24px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', border: '1.2px solid #10C97D', backgroundColor: '#E5F9EC', color: '#10C97D', letterSpacing: '-0.02em' }}>출근</span>
              <span style={{ fontSize: 'clamp(18px, 5.9vw, 22px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{stats.checkin}</span>
            </div>
            <div style={{ width: '1px', height: 'clamp(28px, 8.5vw, 36px)', backgroundColor: '#EBEBEB' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', border: '1.2px solid #FF862D', backgroundColor: '#FFEEE2', color: '#FF862D', letterSpacing: '-0.02em' }}>지각</span>
              <span style={{ fontSize: 'clamp(18px, 5.9vw, 22px)', fontWeight: 700, color: '#FF862D', letterSpacing: '-0.02em' }}>{stats.late}</span>
            </div>
          </div>
        </div>
        {/* 퇴근/결근 box */}
        <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: 'clamp(12px, 3.5vw, 14px)', padding: 'clamp(12px, 3.5vw, 16px) 0', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(16px, 5.3vw, 24px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', border: '1.2px solid #4261FF', backgroundColor: '#E8F3FF', color: '#4261FF', letterSpacing: '-0.02em' }}>퇴근</span>
              <span style={{ fontSize: 'clamp(18px, 5.9vw, 22px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>{stats.checkout}</span>
            </div>
            <div style={{ width: '1px', height: 'clamp(28px, 8.5vw, 36px)', backgroundColor: '#EBEBEB' }} />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', border: '1.2px solid #FF3D3D', backgroundColor: '#FFEAE6', color: '#FF3D3D', letterSpacing: '-0.02em' }}>결근</span>
              <span style={{ fontSize: 'clamp(18px, 5.9vw, 22px)', fontWeight: 700, color: '#FF3D3D', letterSpacing: '-0.02em' }}>{stats.absent}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Snap scroll cards */}
      <div
        ref={outerScrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-2 px-5"
        style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: '20px' }}
      >
        {cards.map((card, i) => (
          <AttendanceCardView key={i} card={card} />
        ))}
      </div>

      {/* Carousel dots */}
      <div className="flex justify-center gap-1.5 py-3">
        {cards.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${i === activeIndex ? "bg-primary" : "bg-border"}`}
          />
        ))}
      </div>
    </section>
  );
}
