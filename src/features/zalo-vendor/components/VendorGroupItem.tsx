import React from "react";
import { Pin, MoreHorizontal, Tag, Check, ChevronLeft } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatRelativeTime";
import { useDemoConfigStore } from "@/stores/demoConfigStore";
import type { VendorGroup, ZaloAccount } from "@/types/zalo";

interface VendorGroupItemProps {
  group: VendorGroup;
  zaloAccount: ZaloAccount | null;
  isSelected: boolean;
  onClick: () => void;
  isPinned?: boolean;
  onTogglePin?: () => void;
  onOpenTagManage?: () => void;
}

function getGroupInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getLastMessagePreview(group: VendorGroup): string {
  const msg = group.lastMessage;
  if (!msg) return "Chưa có tin nhắn";
  if (msg.isRecalled) return "Tin nhắn đã thu hồi";
  switch (msg.contentType) {
    case "IMG": return "[Hình ảnh]";
    case "FILE": return "[Tập tin]";
    case "VID": return "[Video]";
    default: return msg.content ?? "";
  }
}

// ─── More Menu (in-place navigation: main → tags) ─────────────────────────────

type MenuView = "main" | "tags";

function MoreMenu({
  groupId,
  isPinned,
  onTogglePin,
  onOpenTagManage,
}: {
  groupId: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenTagManage?: () => void;
}) {
  const { vendorTags, groupTagIds, toggleGroupTag } = useDemoConfigStore();
  const [open, setOpen] = React.useState(false);
  const [view, setView] = React.useState<MenuView>("main");
  const ref = React.useRef<HTMLDivElement>(null);

  const assigned = groupTagIds[groupId] ?? [];

  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setView("main");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOpen((v) => !v);
    setView("main");
  };

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={handleOpen}
        title="Thêm"
        className="flex h-6 w-6 items-center justify-center rounded transition-colors hover:bg-brand-100 text-gray-400 hover:text-gray-600"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-[200] mt-1 w-52 rounded-xl bg-white shadow-2xl border border-gray-100 overflow-hidden">
          {/* ── Main view ── */}
          {view === "main" && (
            <div className="py-2">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setView("tags"); }}
                className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50"
              >
                <Tag className="h-4 w-4 text-gray-500 shrink-0" />
                <span className="flex-1 text-left text-sm text-gray-700">Phân loại</span>
                {assigned.length > 0 && (
                  <span className="rounded-full bg-brand-100 px-1.5 text-[10px] font-bold text-brand-700">
                    {assigned.length}
                  </span>
                )}
                <span className="text-gray-400 text-xs">›</span>
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onTogglePin();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50"
              >
                <Pin
                  className={`h-4 w-4 shrink-0 ${isPinned ? "rotate-45 text-brand-500" : "text-gray-500"}`}
                />
                <span className="text-sm text-gray-700">
                  {isPinned ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
                </span>
              </button>
            </div>
          )}

          {/* ── Tags view ── */}
          {view === "tags" && (
            <div>
              {/* Header */}
              <div className="flex items-center gap-2 border-b border-gray-100 px-3 py-2.5">
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setView("main"); }}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm font-medium text-gray-700">Phân loại</span>
              </div>

              {/* Tag list */}
              <div className="max-h-56 overflow-y-auto py-1">
                {vendorTags.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-gray-400">Chưa có thẻ phân loại nào.</p>
                ) : (
                  vendorTags.map((tag) => {
                    const active = assigned.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); toggleGroupTag(groupId, tag.id); }}
                        className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50"
                      >
                        <span
                          className="h-4 w-4 shrink-0 rounded"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="flex-1 text-left text-sm text-gray-700">{tag.name}</span>
                        {active && <Check className="h-3.5 w-3.5 text-brand-600 shrink-0" />}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-100 py-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpen(false);
                    onOpenTagManage?.();
                  }}
                  className="flex w-full items-center px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
                >
                  Quản lý thẻ phân loại
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const VendorGroupItem: React.FC<VendorGroupItemProps> = ({
  group,
  zaloAccount,
  isSelected,
  onClick,
  isPinned,
  onTogglePin,
  onOpenTagManage,
}) => {
  const { groupDisplayNames, vendorTags, groupTagIds } = useDemoConfigStore();
  const [isHovered, setIsHovered] = React.useState(false);
  const effectivePinned = isPinned ?? group.isPinned;
  const displayName = (groupDisplayNames[group.id] || group.name).replace(/^NCC\s*[-–]\s*/i, "");
  const initials = getGroupInitials(displayName);
  const preview = getLastMessagePreview(group);
  const timeLabel = group.lastMessage ? formatRelativeTime(group.lastMessage.sentAt) : "";

  const assignedTagIds = groupTagIds[group.id] ?? [];
  const assignedTags = vendorTags.filter((t) => assignedTagIds.includes(t.id));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-brand-50 cursor-pointer ${
        isSelected ? "bg-brand-50 ring-1 ring-inset ring-brand-100" : ""
      }`}
      data-testid={`vendor-group-item-${group.id}`}
    >
      {/* Avatar */}
      <div className="relative shrink-0">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm select-none">
          {initials}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white ring-1 ring-white">
          Z
        </span>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span className="truncate text-sm font-medium text-gray-900">
            {displayName}
          </span>
          <div className="flex shrink-0 items-center gap-1">
            {isHovered ? (
              <MoreMenu
                groupId={group.id}
                isPinned={effectivePinned}
                onTogglePin={() => onTogglePin?.()}
                onOpenTagManage={onOpenTagManage}
              />
            ) : (
              <>
                {effectivePinned && (
                  <Pin className="h-3 w-3 rotate-45 text-brand-400" />
                )}
                {timeLabel && (
                  <span className="text-[11px] text-gray-400">{timeLabel}</span>
                )}
              </>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="truncate text-xs text-gray-500">{preview}</span>
          <div className="flex shrink-0 items-center gap-1">
            {group.unreadCount > 0 && (
              <span className="flex min-w-[18px] items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-semibold text-white">
                {group.unreadCount > 99 ? "99+" : group.unreadCount}
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        {assignedTags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {assignedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-block rounded-full px-1.5 py-0.5 text-[9px] font-medium text-white"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Zalo account indicator */}
        {zaloAccount && (
          <div className="mt-0.5 flex items-center gap-1">
            <span className="text-[10px] text-blue-500 truncate">
              via {zaloAccount.displayName}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
