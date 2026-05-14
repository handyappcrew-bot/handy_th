import { useEffect, useRef } from "react";

interface WheelPickerProps<T extends string | number> {
  items: T[];
  value: T;
  onChange: (v: T) => void;
  itemHeight?: number;
  visibleCount?: number;
  ariaLabel?: string;
  formatItem?: (v: T) => string;
}

/**
 * iOS 스타일 휠 피커. scroll-snap 으로 자연스러운 스냅 스크롤.
 * 중앙에 위치한 항목이 자동 선택됨.
 */
function WheelPicker<T extends string | number>({
  items,
  value,
  onChange,
  itemHeight = 40,
  visibleCount = 5,
  ariaLabel,
  formatItem,
}: WheelPickerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const padding = ((visibleCount - 1) / 2) * itemHeight;

  // 마운트 / value 외부 변경 시 해당 항목으로 스크롤
  useEffect(() => {
    const idx = items.indexOf(value);
    if (idx < 0 || !containerRef.current) return;
    containerRef.current.scrollTo({ top: idx * itemHeight, behavior: "auto" });
  }, [items, value, itemHeight]);

  const handleScroll = () => {
    if (scrollTimer.current) clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / itemHeight);
      const clamped = Math.max(0, Math.min(items.length - 1, idx));
      const next = items[clamped];
      if (next !== value) onChange(next);
    }, 120);
  };

  const display = (item: T) => (formatItem ? formatItem(item) : String(item));

  return (
    <div className="relative" style={{ height: visibleCount * itemHeight }} aria-label={ariaLabel}>
      {/* 중앙 강조 영역 */}
      <div
        className="pointer-events-none absolute inset-x-0 z-10"
        style={{
          top: padding,
          height: itemHeight,
          background: "rgba(66, 97, 255, 0.06)",
          borderTop: "1px solid hsl(var(--border))",
          borderBottom: "1px solid hsl(var(--border))",
        }}
      />
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="wheel-picker-scroll h-full overflow-y-auto"
        style={{
          scrollSnapType: "y mandatory",
          paddingTop: padding,
          paddingBottom: padding,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`.wheel-picker-scroll::-webkit-scrollbar { display: none; }`}</style>
        {items.map((item) => (
          <div
            key={String(item)}
            onClick={() => {
              const idx = items.indexOf(item);
              if (idx < 0 || !containerRef.current) return;
              containerRef.current.scrollTo({ top: idx * itemHeight, behavior: "smooth" });
            }}
            className={`pressable flex cursor-pointer items-center justify-center transition-colors ${
              item === value ? "text-foreground font-semibold text-[17px]" : "text-muted-foreground text-[15px]"
            }`}
            style={{ height: itemHeight, scrollSnapAlign: "center" }}
          >
            {display(item)}
          </div>
        ))}
      </div>
    </div>
  );
}

export default WheelPicker;
