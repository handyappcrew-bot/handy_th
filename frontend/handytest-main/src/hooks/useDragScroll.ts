import { useRef, useEffect } from "react";

interface UseDragScrollOptions {
  snap?: boolean;
  direction?: "horizontal" | "vertical";
}

export function useDragScroll<T extends HTMLElement = HTMLDivElement>(
  options: UseDragScrollOptions = {}
) {
  const { direction = "horizontal", snap = false } = options;
  const ref = useRef<T>(null);
  const isDragging = useRef(false);
  const startPos = useRef(0);
  const scrollPos = useRef(0);
  const hasMoved = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const isVertical = direction === "vertical";

    const snapToNearest = () => {
      const children = Array.from(el.children) as HTMLElement[];
      if (children.length === 0) return;

      const scrollLeft = el.scrollLeft;
      const containerLeft = el.getBoundingClientRect().left;
      const paddingLeft = parseFloat(getComputedStyle(el).paddingLeft) || 0;

      let closestChild: HTMLElement | null = null;
      let closestDist = Infinity;

      children.forEach((child) => {
        const childLeft = child.getBoundingClientRect().left - containerLeft - paddingLeft + scrollLeft;
        const dist = Math.abs(scrollLeft - childLeft);
        if (dist < closestDist) {
          closestDist = dist;
          closestChild = child;
        }
      });

      if (closestChild) {
        const targetLeft = (closestChild as HTMLElement).getBoundingClientRect().left - containerLeft - paddingLeft + scrollLeft;
        el.scrollTo({ left: targetLeft, behavior: "auto" });
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      // If event originated from a nested drag scroll, ignore it
      if ((e as any).__innerDragScroll) return;
      isDragging.current = true;
      hasMoved.current = false;
      startPos.current = isVertical
        ? e.pageY - el.offsetTop
        : e.pageX - el.offsetLeft;
      scrollPos.current = isVertical ? el.scrollTop : el.scrollLeft;
      el.style.cursor = "grabbing";
      el.style.userSelect = "none";
      el.style.scrollSnapType = "none";
      el.style.scrollBehavior = "auto";
      // Mark event so parent drag scroll ignores it
      (e as any).__innerDragScroll = true;
    };

    const onMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      el.style.cursor = "grab";
      el.style.removeProperty("user-select");

      if (snap || el.style.getPropertyValue("--snap")) {
        snapToNearest();
      }
      el.style.scrollSnapType = "";
      el.style.scrollBehavior = "";
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      e.preventDefault();
      hasMoved.current = true;
      const pos = isVertical
        ? e.pageY - el.offsetTop
        : e.pageX - el.offsetLeft;
      const walk = pos - startPos.current;
      if (isVertical) {
        el.scrollTop = scrollPos.current - walk;
      } else {
        el.scrollLeft = scrollPos.current - walk;
      }
    };

    // Handle touch snap end
    const onScrollEnd = () => {
      if (!isDragging.current && snap) {
        snapToNearest();
      }
    };

    el.style.cursor = "grab";
    el.addEventListener("mousedown", onMouseDown);
    el.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("mousemove", onMouseMove);

    return () => {
      el.removeEventListener("mousedown", onMouseDown);
      el.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, [direction, snap]);

  return ref;
}
