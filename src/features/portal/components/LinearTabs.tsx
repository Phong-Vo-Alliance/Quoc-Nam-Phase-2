import React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// CSS for hiding scrollbar
const scrollContainerStyle: React.CSSProperties = {
  scrollbarWidth: "none", // Firefox
  msOverflowStyle: "none", // IE and Edge
  WebkitOverflowScrolling: "touch", // iOS momentum scrolling
};

export const LinearTabs = ({
  tabs,
  active,
  onChange,
  textClass = "text-sm",
  noWrap = true,
}: {
  tabs: { key: string; label: React.ReactNode }[];
  active: string;
  onChange: (key: string) => void;
  textClass?: string;

  noWrap?: boolean;
}) => {
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);
  const activeTabRef = React.useRef<HTMLButtonElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(false);

  // Check scroll position
  const checkScroll = React.useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
  }, []);

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
        </button>
      )}

      {/* Tabs container */}
      <div
        ref={scrollContainerRef}
        className="relative flex items-center gap-4 overflow-x-auto overflow-y-hidden select-none linear-tabs-scroll"
        style={scrollContainerStyle}
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;

          return (
            <button
              key={tab.key}
              ref={isActive ? activeTabRef : null}
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
