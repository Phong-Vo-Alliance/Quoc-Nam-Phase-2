import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// CSS for hiding scrollbar
const scrollContainerStyle: React.CSSProperties = {
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE and Edge
  WebkitOverflowScrolling: "touch", // iOS momentum scrolling
};

type LinearTab = {
  key: string;
  label: React.ReactNode;
  /** Số tin chưa đọc của tab — dùng để cộng dồn lên mũi tên khi tab bị ẩn */
  unread?: number;
};

const formatUnread = (count: number) => (count > 9 ? "9+" : String(count));

export const LinearTabs = ({
  tabs,
  active,
  onChange,
  textClass = "text-sm",
  noWrap = true,
}: {
  tabs: LinearTab[];
  active: string;
  onChange: (key: string) => void;
  textClass?: string;

  noWrap?: boolean;
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);
  const tabRefs = React.useRef<Map<string, HTMLButtonElement | null>>(
    new Map(),
  );
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const [hiddenUnread, setHiddenUnread] = React.useState<{
    left: number;
    right: number;
  }>({ left: 0, right: 0 });

  // Check scroll position + unread của các tab ngoài khung nhìn
  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);

    const cRect = container.getBoundingClientRect();
    let leftUnread = 0;
    let rightUnread = 0;
    // Coi tab là "ẩn" khi tâm của nó đã nằm ngoài khung — kể cả khi còn
    // thò ra vài pixel ở mép. Nếu đòi hỏi ẩn hoàn toàn, tab bị cắt gần hết
    // vẫn bị bỏ qua và badge trên mũi tên không hiện dù người dùng không
    // thấy tên tab đó.
    tabs.forEach((tab) => {
      const unread = tab.unread ?? 0;
      if (unread <= 0) return;
      const el = tabRefs.current.get(tab.key);
      if (!el) return;
      const tRect = el.getBoundingClientRect();
      const tabCenter = (tRect.left + tRect.right) / 2;
      if (tabCenter <= cRect.left) {
        leftUnread += unread;
      } else if (tabCenter >= cRect.right) {
        rightUnread += unread;
      }
    });
    setHiddenUnread((prev) =>
      prev.left === leftUnread && prev.right === rightUnread
        ? prev
        : { left: leftUnread, right: rightUnread },
    );
  }, [tabs]);

  // Scroll active tab into view
  React.useEffect(() => {
    if (activeTabRef.current && scrollContainerRef.current) {
      activeTabRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [active]);

  // Initial check and setup scroll listener
  React.useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScroll);
    window.addEventListener("resize", checkScroll);

    return () => {
      container.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, [checkScroll]);

  // Scroll handlers
  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({
      left: -200,
      behavior: "smooth",
    });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({
      left: 200,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      {/* Left scroll button */}
      {canScrollLeft && (
        <button
          onClick={scrollLeft}
          className="absolute -left-[36px] top-1/2 -translate-y-1/2 z-20 h-7 w-7 min-w-[28px] min-h-[28px] flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 shadow-md rounded-full transition-all opacity-60 hover:opacity-100"
          aria-label="Scroll left"
        >
          <ChevronLeft className="h-4 w-4 text-brand-600 shrink-0" />
          {hiddenUnread.left > 0 && (
            <span
              className="absolute -top-1 -left-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white shadow-sm"
              aria-label={`${hiddenUnread.left} tin chưa đọc ở các loại việc phía trái`}
            >
              {formatUnread(hiddenUnread.left)}
            </span>
          )}
        </button>
      )}

      {/* Right scroll button */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute -right-[36px] top-1/2 -translate-y-1/2 z-20 h-7 w-7 min-w-[28px] min-h-[28px] flex items-center justify-center bg-white hover:bg-gray-50 border border-gray-300 shadow-md rounded-full transition-all opacity-60 hover:opacity-100"
          aria-label="Scroll right"
        >
          <ChevronRight className="h-4 w-4 text-brand-600 shrink-0" />
          {hiddenUnread.right > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 inline-flex items-center justify-center rounded-full bg-rose-500 text-[10px] font-medium text-white shadow-sm"
              aria-label={`${hiddenUnread.right} tin chưa đọc ở các loại việc phía phải`}
            >
              {formatUnread(hiddenUnread.right)}
            </span>
          )}
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className="relative flex items-center gap-4 overflow-x-auto overflow-y-hidden select-none linear-tabs-scroll py-1 px-1"
        style={scrollContainerStyle}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <button
              key={tab.key}
              ref={(el) => {
                if (el) {
                  tabRefs.current.set(tab.key, el);
                } else {
                  tabRefs.current.delete(tab.key);
                }
                if (isActive) {
                  (
                    activeTabRef as { current: HTMLButtonElement | null }
                  ).current = el;
                }
              }}
              onClick={() => {
                onChange(tab.key);
              }}
              className={`
              relative px-3 py-2 select-none transition-all outline-none
              ${noWrap ? "text-nowrap" : ""}
              ${textClass}
              ${
                isActive
                  ? "text-brand-600 font-medium scale-[1.05]"
                  : "text-gray-600 opacity-75"
              }
              focus:outline-none focus:ring-0 focus-visible:ring-0
            `}
            >
              {tab.label}

              {isActive && (
                <motion.div
                  layoutId="linear-underline"
                  transition={{ type: "spring", stiffness: 300, damping: 26 }}
                  className="absolute left-0 right-0 -bottom-[1px] h-[2px] bg-brand-600 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
