import { ChevronRight, Info, Pencil, Plus } from "lucide-react";
import { useDragScroll } from "@/hooks/useDragScroll";
import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

interface ChecklistItem {
  id: string;
  text: string;
}

interface PersonTab {
  id: string;
  name: string;
  avatarColor: string;
  items: ChecklistItem[];
}

interface ChecklistCard {
  type: "오픈" | "미들" | "마감";
  totalPeople: number;
  timeRange: string;
  tabs: PersonTab[];
}

interface ChecklistSectionProps {
  cards: ChecklistCard[];
}

const typeHexMap: Record<string, string> = {
  "오픈": "#FFB300",
  "미들": "#1EDC83",
  "마감": "#14C1FA",
};

// 백그라운드 컬러 사용X. 아마 typeBgMap없을거임.
const typeBgMap: Record<string, string> = {
  "오픈": "#FDF9DF",
  "미들": "#ECFFF1",
  "마감": "#E8F9FF",
};

/* ── Bottom sheet: Register ── */
function ChecklistRegisterSheet({
  open,
  onOpenChange,
  isCommon,
  personName,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isCommon: boolean;
  personName?: string;
}) {
  const [text, setText] = useState("");
  const maxLen = 50;

  const handleClose = () => {
    setText("");
    onOpenChange(false);
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-lg rounded-t-3xl bg-card shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[16px] font-bold text-foreground">
            {isCommon ? "직원 체크리스트 등록" : "직원 체크리스트 등록"}
          </h3>
          <button className="pressable p-1" onClick={handleClose}>
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="px-5 pb-6">
          <div className="relative">
            <textarea
              className="w-full h-[140px] rounded-xl border border-border bg-card p-4 text-[14px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="등록하실 체크리스트를 입력해 주세요"
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= maxLen) setText(e.target.value);
              }}
              maxLength={maxLen}
            />
            <span className="absolute bottom-3 right-4 text-[12px] text-muted-foreground">
              {text.length}/{maxLen}
            </span>
          </div>
          <button
            onClick={handleClose}
            disabled={text.length === 0}
            className={`w-full mt-6 py-3.5 rounded-xl text-[15px] font-semibold transition-colors ${
              text.length > 0
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            등록하기
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ── Bottom sheet: Edit ── */
function ChecklistEditSheet({
  open,
  onOpenChange,
  isCommon,
  initialText,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  isCommon: boolean;
  initialText: string;
}) {
  const [text, setText] = useState(initialText);
  const maxLen = 50;

  useEffect(() => {
    if (open) setText(initialText);
  }, [open, initialText]);

  const handleClose = () => {
    onOpenChange(false);
  };

  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50" onClick={() => onOpenChange(false)}>
      <div className="w-full max-w-lg rounded-t-3xl bg-card shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h3 className="text-[16px] font-bold text-foreground">
            {isCommon ? "직원 체크리스트 수정" : "직원 체크리스트 수정"}
          </h3>
          <button className="pressable p-1" onClick={handleClose}>
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>
        <div className="px-5 pb-6">
          <div className="relative">
            <textarea
              className="w-full h-[140px] rounded-xl border border-border bg-card p-4 text-[14px] text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="체크리스트를 입력해 주세요"
              value={text}
              onChange={(e) => {
                if (e.target.value.length <= maxLen) setText(e.target.value);
              }}
              maxLength={maxLen}
            />
            <span className="absolute bottom-3 right-4 text-[12px] text-muted-foreground">
              {text.length}/{maxLen}
            </span>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={handleClose}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold border border-border text-destructive bg-card"
            >
              삭제하기
            </button>
            <button
              onClick={handleClose}
              className="flex-1 py-3.5 rounded-xl text-[15px] font-semibold bg-primary text-primary-foreground"
            >
              수정하기
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ChecklistCardView({ card }: { card: ChecklistCard }) {
  const [activeTab, setActiveTab] = useState(card.tabs[0]?.id || "");
  const tabScrollRef = useDragScroll();
  const listScrollRef = useDragScroll({ direction: "vertical" });
  const activeTabData = card.tabs.find((t) => t.id === activeTab);
  const isCommonTab = activeTabData?.name === "공통";

  const [registerOpen, setRegisterOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editText, setEditText] = useState("");

  const handleEdit = (text: string) => {
    setEditText(text);
    setEditOpen(true);
  };

  // total items including the add button
  const totalRows = (activeTabData?.items.length || 0) + 1;
  const needsScroll = totalRows > 3;
  return (
    <div className="flex-shrink-0 snap-start w-full">
      <div style={{ backgroundColor: '#FFFFFF', borderRadius: 'clamp(12px, 3.5vw, 16px)', padding: 'clamp(14px, 4.3vw, 16px)', boxShadow: '0 1px 6px 0 rgba(0,0,0,0.06)' }}>

        {/* Card header */}
        <div>
          <span style={{ fontSize: 'clamp(14px, 4.3vw, 16px)', fontWeight: 600, letterSpacing: '-0.02em' }}>
            <span style={{ color: typeHexMap[card.type] }}>[{card.type}]</span>
            {' '}
            <span style={{ color: '#19191B' }}>체크 리스트</span>
          </span>
          <p style={{ fontSize: 'clamp(12px, 3.7vw, 14px)', fontWeight: 400, color: '#9EA3AD', marginTop: '4px', letterSpacing: '-0.02em' }}>
            총 {card.totalPeople}명 | {card.timeRange}
          </p>
        </div>

        {/* People tabs */}
        <div
          ref={tabScrollRef}
          className="overflow-x-auto scrollbar-hide"
          style={{ display: 'flex', gap: '12px', margin: '12px 0', paddingRight: '4px' }}
        >
          {card.tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, gap: '4px', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#FFFFFF',
                  backgroundColor: tab.avatarColor,
                  border: isActive ? '2.5px solid #4261FF' : '2.5px solid transparent',
                  boxSizing: 'border-box' as const,
                }}>
                  {tab.name.length <= 2 ? tab.name : tab.name.slice(-2)}
                </div>
                <span style={{ fontSize: 'clamp(11px, 3.2vw, 12px)', fontWeight: isActive ? 600 : 400, color: isActive ? '#4261FF' : '#19191B', letterSpacing: '-0.02em' }}>
                  {tab.name}
                </span>
                {/* {isActive && (
                  <div style={{ width: '100%', height: '2px', backgroundColor: '#4261FF', borderRadius: '2px' }} />
                )} */}
              </button>
            );
          })}
        </div>

        {/* 구분선 + 선택 프로필 따라다니는 파란 라인 */}
        <div style={{ position: 'relative', height: '2px', backgroundColor: '#EBEBEB', marginBottom: '12px' }}>
          {card.tabs.map((tab, i) => {
            const isActive = tab.id === activeTab;
            if (!isActive) return null;
            const tabWidth = 52 + 12; // 프로필 width + gap
            return (
              <div
                key={tab.id}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: `${i * tabWidth}px`,
                  width: '52px',
                  height: '2px',
                  backgroundColor: '#4261FF',
                  borderRadius: '2px',
                  transition: 'left 0.2s ease',
                }}
              />
            );
          })}
        </div>

        {/* Checklist items */}
        <div
          ref={listScrollRef}
          className={needsScroll ? 'overflow-y-auto' : ''}
          style={{ minHeight: 'clamp(120px, 36vw, 144px)', maxHeight: 'clamp(120px, 36vw, 144px)', scrollbarWidth: 'thin' as const }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {activeTabData?.items.map((item) => (
              <div
                key={item.id}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(10px, 2.9vw, 12px) clamp(12px, 3.5vw, 14px)', borderRadius: '10px', border: '1px solid #EBEBEB', backgroundColor: '#FFFFFF' }}
              >
                <span style={{ fontSize: 'clamp(13px, 3.7vw, 14px)', color: '#19191B', letterSpacing: '-0.02em' }}>{item.text}</span>
                <button onClick={() => handleEdit(item.text)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                  <Pencil style={{ width: '15px', height: '15px', color: '#B0B3BB' }} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setRegisterOpen(true)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', padding: 'clamp(10px, 2.9vw, 12px)', borderRadius: '10px', border: '1.5px dashed #DBDCDF', background: 'none', cursor: 'pointer', fontSize: 'clamp(12px, 3.5vw, 13px)', color: '#9EA3AD', letterSpacing: '-0.02em', flexShrink: 0 }}
            >
              <Plus style={{ width: '14px', height: '14px' }} />
              추가하기
            </button>
          </div>
        </div>
      </div>

      {/* Register bottom sheet */}
      <ChecklistRegisterSheet
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        isCommon={isCommonTab}
        personName={activeTabData?.name}
      />

      {/* Edit bottom sheet */}
      <ChecklistEditSheet
        open={editOpen}
        onOpenChange={setEditOpen}
        isCommon={isCommonTab}
        initialText={editText}
      />
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

export default function ChecklistSection({ cards }: ChecklistSectionProps) {
  const outerScrollRef = useDragScroll({ snap: true });
  const [infoOpen, setInfoOpen] = useState(false);

  const activeIndex = useScrollIndex(outerScrollRef as React.RefObject<HTMLDivElement>, cards.length);

  return (
    <section>
      {/* Section header */}
      <div className="flex items-center justify-between px-5" style={{ marginBottom: '12px' }}>
        <div className="flex items-center gap-1">
          <h2 style={{ fontSize: 'clamp(18px, 5.3vw, 20px)', fontWeight: 700, color: '#19191B', letterSpacing: '-0.02em' }}>직원 체크 리스트</h2>
          <button onClick={() => setInfoOpen(true)}>
            <Info className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
        <div />
      </div>

      {/* Info dialog */}
      <Dialog open={infoOpen} onOpenChange={setInfoOpen}>
        <DialogContent className="max-w-[320px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[15px] font-bold flex items-center gap-1">
              <Info className="w-4 h-4 text-muted-foreground" />
              일정 체크리스트란?
            </DialogTitle>
          </DialogHeader>
          <div className="text-[14px] text-muted-foreground text-center leading-relaxed">
            직원이 출근 후 해야 할 업무를<br />
            안내하는 체크리스트예요
          </div>
          <div className="text-[14px] text-muted-foreground text-center leading-relaxed mt-2">
            <span className="text-primary font-semibold">[파트별]</span> 체크리스트는 한 번 등록하면<br />
            해당 파트 모두에게 매일 자동으로<br />
            노출돼요
          </div>
          <div className="text-[14px] text-muted-foreground text-center leading-relaxed mt-2">
            <span className="text-primary font-semibold">[직원별]</span> 체크리스트도 추가할 수 있으며,<br />
            파트별 체크리스트와 같이 확인할 수 있어요
          </div>
        </DialogContent>
      </Dialog>

      {/* Snap scroll cards */}
      <div
        ref={outerScrollRef}
        className="flex overflow-x-auto scrollbar-hide gap-2 px-5"
        style={{ scrollSnapType: "x mandatory", scrollPaddingLeft: '20px' }}
      >
        {cards.map((card, i) => (
          <ChecklistCardView key={i} card={card} />
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
