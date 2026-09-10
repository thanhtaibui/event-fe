import type { PointerEvent } from "react";
import { useRef, useState } from "react";

import type { CategoryDto } from "../../../types/event/event";

type CategoryTabsProps = {
  activeCategory?: string;
  categories?: CategoryDto[];
  onCategoryChange?: (categoryId: string) => void;
};

export default function CategoryTabs({
  activeCategory = "all",
  categories = [],
  onCategoryChange = () => undefined,
}: CategoryTabsProps) {
  const tabsRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef({
    startX: 0,
    scrollLeft: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
    if (!tabsRef.current) return;
    dragRef.current = {
      startX: event.clientX,
      scrollLeft: tabsRef.current.scrollLeft,
      moved: false,
    };
    setIsDragging(true);
    tabsRef.current.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!isDragging || !tabsRef.current) return;
    const delta = event.clientX - dragRef.current.startX;
    if (Math.abs(delta) > 4) dragRef.current.moved = true;
    tabsRef.current.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const stopDragging = (event: PointerEvent<HTMLElement>) => {
    if (!tabsRef.current) return;
    setIsDragging(false);
    if (tabsRef.current.hasPointerCapture(event.pointerId)) {
      tabsRef.current.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <nav
      ref={tabsRef}
      className={`category-tabs${isDragging ? " category-tabs--dragging" : ""}`}
      aria-label="Event categories"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={stopDragging}
      onPointerCancel={stopDragging}
      onPointerLeave={(event) => {
        if (isDragging) stopDragging(event);
      }}
    >
      {[
        { id: "all", name: "All Categories" },
        ...categories,
      ].map((category) => (
        <button
          className={`category-tabs__pill${
            category.id === activeCategory ? " category-tabs__pill--active" : ""
          }`}
          key={category.id}
          type="button"
          aria-pressed={category.id === activeCategory}
          onClick={() => {
            if (dragRef.current.moved) {
              dragRef.current.moved = false;
              return;
            }
            onCategoryChange(category.id);
          }}
        >
          <span>{category.name}</span>
        </button>
      ))}
    </nav>
  );
}
