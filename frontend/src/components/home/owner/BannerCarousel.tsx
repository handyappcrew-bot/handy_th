import { useRef } from "react";
import { useDragScroll } from "@/hooks/useDragScroll";

export default function BannerCarousel() {
  const dragRef = useDragScroll();

  return (
    <div className="px-5">
      <div
        ref={dragRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="flex-shrink-0 w-full" style={{ scrollSnapAlign: "start" }}>
          <div className="w-full h-[120px] rounded-2xl bg-gradient-to-r from-primary/80 to-primary flex items-center justify-center">
            <div className="text-primary-foreground text-center">
              <p className="text-[14px] font-bold">광고 배너 영역</p>
              <p className="text-[12px] opacity-80 mt-1">프로모션 및 이벤트</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
