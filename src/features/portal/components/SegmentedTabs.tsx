import { motion } from "framer-motion";
import React from "react";

export const SegmentedTabs = ({
  tabs,
  active,
  onChange,
  noWrap = true,
  textClass = "text-sm",
}: {
  tabs: { key: string; label: React.ReactNode }[];
  active: string;
  onChange: (key: string) => void;
  noWrap?: boolean;
  textClass?: string;
}) => {
  const activeIndex = tabs.findIndex((t) => t.key === active);

  return (
    <div className="relative flex items-center gap-1 bg-gray-100 p-1 rounded-xl overflow-hidden">
      {tabs.map((tab) => {
        const isActive = tab.key === active;

        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            data-testid={`segmented-tab-${tab.key}`}
            className={`
              relative z-10 flex-1 px-3 py-1.5 rounded-lg transition-all select-none outline-none
              ${noWrap ? "text-nowrap" : ""}
              ${textClass}
              ${
                isActive
                  ? "text-white font-semibold bg-brand-500 scale-[1.06]"
                  : "text-gray-600 opacity-80"
              }
              focus:outline-none focus:ring-0 focus-visible:ring-0
            `}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
