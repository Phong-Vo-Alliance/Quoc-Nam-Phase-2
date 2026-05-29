import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Pencil,
  UserPlus,
  Trash2,
  X,
  Search,
  User,
  EyeOff,
  Eye,
  MoreHorizontal,
  Tag,
  Pin,
  Check,
  Settings2,
  ChevronDown as ChevronDownSm,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoConfigStore, DEMO_USERS } from "@/stores/demoConfigStore";
import { resolveGroupAccountIds, resolveActiveZaloAccountId } from "@/features/zalo-vendor/hooks/useVendorGroups";
import { RenameGroupModal } from "@/features/zalo-vendor/components/RenameGroupModal";
import { TagManagementModal } from "@/features/admin-demo/components/TagManagementModal";
import { Switch } from "@/components/ui/switch";
import vendorGroupsJson from "@/data/zalo/vendor-groups.json";
import zaloAccountsJson from "@/data/zalo/zalo-accounts.json";
import type { ZaloAccount } from "@/types/zalo";

const vendorGroups = vendorGroupsJson as { id: string; name: string; zaloGroupId: string; avatarUrl: string | null; zaloAccountIds: string[]; memberCount: number; lastMessage: unknown; unreadCount: number; isPinned: boolean; syncedAt: string; createdAt: string }[];
const zaloAccounts = zaloAccountsJson as ZaloAccount[];

// ─── Add Staff Dialog ──────────────────────────────────────────────────────────

interface AddStaffDialogProps {
  groupId: string;
  zaloAccountIds: string[];
  currentStaffIds: string[];
  onClose: () => void;
}

function AddStaffDialog({ groupId, zaloAccountIds, currentStaffIds, onClose }: AddStaffDialogProps) {
  const { addStaffToGroup, zaloAccountAssignments } = useDemoConfigStore();
  // Union of staff assigned to any linked account
  const eligibleIds = new Set(zaloAccountIds.flatMap((id) => zaloAccountAssignments[id] ?? []));
  const available = DEMO_USERS.filter(
    (u) => u.role === "STAFF" && eligibleIds.has(u.id) && !currentStaffIds.includes(u.id),
  );

  if (available.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-80 rounded-xl bg-white p-6 shadow-2xl text-center">
          <p className="text-sm text-gray-500">Tất cả nhân viên đã được thêm vào nhóm này.</p>
          <button
            onClick={onClose}
            className="mt-4 rounded-lg bg-gray-100 px-4 py-2 text-sm text-gray-600 hover:bg-gray-200"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[380px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-800">Thêm nhân viên vào nhóm</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-64 overflow-y-auto px-4 py-3">
          {available.map((u) => (
            <button
              key={u.id}
              onClick={() => {
                addStaffToGroup(groupId, u.id);
                onClose();
              }}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-green-50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                {u.displayName[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-800">{u.displayName}</p>
                <p className="text-xs text-gray-400">{u.department}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Tag Assignment Dropdown ───────────────────────────────────────────────────

function TagAssignmentDropdown({
  groupId,
  onOpenManage,
  onClose,
}: {
  groupId: string;
  onOpenManage: () => void;
  onClose: () => void;
}) {
  const { vendorTags, groupTagIds, toggleGroupTag } = useDemoConfigStore();
  const assigned = groupTagIds[groupId] ?? [];
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl bg-white shadow-2xl border border-gray-100 py-2"
    >
      {vendorTags.length === 0 ? (
        <p className="px-4 py-2 text-xs text-gray-400">Chưa có thẻ phân loại.</p>
      ) : (
        vendorTags.map((tag) => {
          const active = assigned.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleGroupTag(groupId, tag.id)}
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
      <div className="mt-1 border-t border-gray-100 pt-1">
        <button
          type="button"
          onClick={() => {
            onClose();
            onOpenManage();
          }}
          className="flex w-full items-center gap-2 px-4 py-2 text-sm text-brand-600 hover:bg-brand-50"
        >
          <Settings2 className="h-3.5 w-3.5" />
          Quản lý thẻ phân loại
        </button>
      </div>
    </div>
  );
}

// ─── Staff Account Override Select ─────────────────────────────────────────────
// Uses createPortal + position:fixed to escape overflow:hidden table containers.

function StaffAccountOverrideSelect({
  groupId,
  staffId,
  eligibleAccountIds,
}: {
  groupId: string;
  staffId: string;
  eligibleAccountIds: string[];
}) {
  const {
    groupStaffAccountOverride,
    groupZaloAccountIds,
    zaloAccountAssignments,
    setStaffAccountOverride,
    clearStaffAccountOverride,
  } = useDemoConfigStore();
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (buttonRef.current?.contains(e.target as Node)) return;
      if (dropdownRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleToggle = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const dropdownH = 160; // estimated height
      const top = spaceBelow >= dropdownH ? rect.bottom + 4 : rect.top - dropdownH - 4;
      setDropdownStyle({ position: "fixed", top, left: rect.left, zIndex: 9999 });
    }
    setOpen((v) => !v);
  };

  const activeId = resolveActiveZaloAccountId(
    groupId,
    staffId,
    groupZaloAccountIds,
    groupStaffAccountOverride,
    zaloAccountAssignments,
  );
  const hasOverride = !!(groupStaffAccountOverride[groupId]?.[staffId]);
  const activeAccount = zaloAccounts.find((a) => a.id === activeId);

  if (eligibleAccountIds.length <= 1) {
    return (
      <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
        {activeAccount?.displayName ?? "—"}
      </span>
    );
  }

  const dropdownEl = (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="w-48 rounded-xl bg-white shadow-2xl border border-gray-100 py-1"
    >
      {eligibleAccountIds.map((accountId) => {
        const account = zaloAccounts.find((a) => a.id === accountId);
        const isActive = accountId === activeId;
        return (
          <button
            key={accountId}
            type="button"
            onClick={() => {
              setStaffAccountOverride(groupId, staffId, accountId);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 hover:bg-gray-50"
          >
            <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white">
              Z
            </span>
            <span className="flex-1 text-left text-xs text-gray-700">
              {account?.displayName ?? accountId}
            </span>
            {isActive && <Check className="h-3 w-3 text-brand-600 shrink-0" />}
          </button>
        );
      })}
      {hasOverride && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            type="button"
            onClick={() => {
              clearStaffAccountOverride(groupId, staffId);
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
          >
            Về mặc định
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
          hasOverride
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : "bg-blue-50 text-blue-700",
        )}
      >
        {activeAccount?.displayName ?? "—"}
        <ChevronDownSm className="h-3 w-3" />
      </button>
      {open && createPortal(dropdownEl, document.body)}
    </>
  );
}

// ─── Row More Menu ─────────────────────────────────────────────────────────────

function RowMoreMenu({
  groupId,
  isPinned,
  onTogglePin,
  onOpenTagManage,
}: {
  groupId: string;
  isPinned: boolean;
  onTogglePin: () => void;
  onOpenTagManage: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [showTags, setShowTags] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setShowTags(false);
        }}
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
        title="Thêm"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && !showTags && (
        <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl bg-white shadow-2xl border border-gray-100 py-2">
          <button
            type="button"
            onClick={() => setShowTags(true)}
            className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50"
          >
            <Tag className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-700">Phân loại</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onTogglePin();
              setOpen(false);
            }}
            className="flex w-full items-center gap-2.5 px-4 py-2 hover:bg-gray-50"
          >
            <Pin className={cn("h-4 w-4", isPinned ? "text-brand-500 rotate-45" : "text-gray-500")} />
            <span className="text-sm text-gray-700">
              {isPinned ? "Bỏ ghim hội thoại" : "Ghim hội thoại"}
            </span>
          </button>
        </div>
      )}

      {open && showTags && (
        <TagAssignmentDropdown
          groupId={groupId}
          onOpenManage={() => {
            setOpen(false);
            onOpenTagManage();
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

type PhoneFilter = "all" | "hidden" | "visible";

export function NhomNCCPage() {
  const {
    groupMemberships,
    groupDisplayNames,
    removeStaffFromGroup,
    phoneHidden,
    togglePhoneHidden,
    pinnedGroups,
    togglePinGroup,
    vendorTags,
    groupTagIds,
    groupZaloAccountIds,
    groupStaffAccountOverride,
    zaloAccountAssignments,
  } = useDemoConfigStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [renameGroupId, setRenameGroupId] = useState<string | null>(null);
  const [addStaffModal, setAddStaffModal] = useState<string | null>(null);
  const [showTagManagement, setShowTagManagement] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [staffSearchQuery, setStaffSearchQuery] = useState("");
  const [accountFilter, setAccountFilter] = useState("all");
  const [phoneFilter, setPhoneFilter] = useState<PhoneFilter>("all");
  const [tagFilter, setTagFilter] = useState<string | null>(null); // null = tất cả
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [tabIndicator, setTabIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const el = tabRefs.current[phoneFilter];
    if (el) setTabIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [phoneFilter]);

  const matchedStaff = useMemo(() => {
    const q = staffSearchQuery.trim().toLowerCase();
    if (!q) return [];
    return DEMO_USERS.filter(
      (u) => u.role === "STAFF" && u.displayName.toLowerCase().includes(q),
    );
  }, [staffSearchQuery]);

  const matchedStaffIds = useMemo(
    () => new Set(matchedStaff.map((u) => u.id)),
    [matchedStaff],
  );

  const isStaffSearchActive = staffSearchQuery.trim().length > 0;

  const phoneCounts = useMemo(() => {
    const hidden = vendorGroups.filter((g) => phoneHidden[g.id] ?? false).length;
    return { hidden, visible: vendorGroups.length - hidden };
  }, [phoneHidden]);

  const filteredGroups = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return vendorGroups.filter((group) => {
      const displayName = (groupDisplayNames[group.id] || group.name)
        .replace(/^NCC\s*[-–]\s*/i, "")
        .toLowerCase();
      const originalName = group.name.replace(/^NCC\s*[-–]\s*/i, "").toLowerCase();
      const matchesSearch = !q || displayName.includes(q) || originalName.includes(q);
      const groupAccountIds = resolveGroupAccountIds(group.id, groupZaloAccountIds);
      const matchesAccount = accountFilter === "all" || groupAccountIds.includes(accountFilter);

      const staffIds = groupMemberships[group.id] ?? [];
      const matchesStaff =
        !isStaffSearchActive || staffIds.some((id) => matchedStaffIds.has(id));

      const isHidden = phoneHidden[group.id] ?? false;
      const matchesPhone =
        phoneFilter === "all" ||
        (phoneFilter === "hidden" && isHidden) ||
        (phoneFilter === "visible" && !isHidden);

      const assignedTags = groupTagIds[group.id] ?? [];
      const matchesTag = tagFilter === null || assignedTags.includes(tagFilter);

        return matchesSearch && matchesAccount && matchesStaff && matchesPhone && matchesTag;
    });
  }, [searchQuery, staffSearchQuery, accountFilter, phoneFilter, tagFilter, groupDisplayNames, groupMemberships, matchedStaffIds, isStaffSearchActive, phoneHidden, groupTagIds, groupZaloAccountIds]);

  const phoneFilterTabs: { key: PhoneFilter; label: string; count: number }[] = [
    { key: "all", label: "Tất cả", count: vendorGroups.length },
    { key: "hidden", label: "Đang ẩn SĐT", count: phoneCounts.hidden },
    { key: "visible", label: "Đang hiện SĐT", count: phoneCounts.visible },
  ];

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Nhóm NCC</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTagManagement(true)}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <Tag className="h-3.5 w-3.5" />
            Quản lý thẻ phân loại
          </button>
          <p className="text-sm text-gray-400">
            {vendorGroups.length} nhóm đã đồng bộ
            {phoneCounts.hidden > 0 && (
              <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-xs font-medium text-orange-600">
                <EyeOff className="h-3 w-3" />
                {phoneCounts.hidden} đang ẩn SĐT
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search + Filter bar */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhóm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          />
        </div>

        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên nhân viên..."
            value={staffSearchQuery}
            onChange={(e) => setStaffSearchQuery(e.target.value)}
            className={cn(
              "w-full rounded-lg border bg-white py-2 pl-9 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2",
              isStaffSearchActive
                ? "border-blue-300 focus:border-blue-400 focus:ring-blue-100"
                : "border-gray-200 focus:border-green-400 focus:ring-green-100",
            )}
          />
          {isStaffSearchActive && (
            <button
              onClick={() => setStaffSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <select
          value={accountFilter}
          onChange={(e) => setAccountFilter(e.target.value)}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
        >
          <option value="all">Tất cả tài khoản</option>
          {zaloAccounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.displayName}
            </option>
          ))}
        </select>
      </div>

      {/* Phone filter tab row */}
      <div className="relative mb-3 flex items-center gap-1 border-b border-gray-200">
        {phoneFilterTabs.map((tab) => (
          <button
            key={tab.key}
            ref={(el) => { tabRefs.current[tab.key] = el; }}
            type="button"
            onClick={() => setPhoneFilter(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-0 outline-none focus-visible:outline-none transition-colors duration-200",
              phoneFilter === tab.key
                ? tab.key === "hidden"
                  ? "text-orange-700"
                  : "text-brand-700"
                : "text-gray-400 hover:text-gray-600",
            )}
          >
            {tab.key === "hidden" && <EyeOff className="h-3.5 w-3.5" />}
            {tab.key === "visible" && <Eye className="h-3.5 w-3.5" />}
            {tab.label}
            {tab.count > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  phoneFilter === tab.key
                    ? tab.key === "hidden"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        ))}
        <span
          className={cn(
            "absolute bottom-0 h-0.5 transition-all duration-300 ease-in-out",
            phoneFilter === "hidden" ? "bg-orange-500" : "bg-brand-600",
          )}
          style={{ left: tabIndicator.left, width: tabIndicator.width }}
        />
      </div>

      {/* Tag filter chips */}
      {vendorTags.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTagFilter(null)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              tagFilter === null
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700",
            )}
          >
            Tất cả
          </button>
          {vendorTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag.id ? null : tag.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                tagFilter === tag.id
                  ? "border-transparent text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-gray-300",
              )}
              style={
                tagFilter === tag.id
                  ? { backgroundColor: tag.color, borderColor: tag.color }
                  : {}
              }
            >
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: tagFilter === tag.id ? "rgba(255,255,255,0.7)" : tag.color }}
              />
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Staff search result banner */}
      {isStaffSearchActive && (
        <div className="mb-3 flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-4 py-2.5">
          <User className="h-4 w-4 shrink-0 text-blue-500" />
          {matchedStaff.length === 0 ? (
            <span className="text-sm text-blue-600">
              Không tìm thấy nhân viên nào khớp với &quot;{staffSearchQuery}&quot;
            </span>
          ) : (
            <span className="text-sm text-blue-700">
              <span className="font-medium">
                {matchedStaff.map((u) => u.displayName).join(", ")}
              </span>
              {" "}đang ở trong{" "}
              <span className="font-medium">{filteredGroups.length} nhóm</span>
            </span>
          )}
          <button
            onClick={() => setStaffSearchQuery("")}
            className="ml-auto text-blue-400 hover:text-blue-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="w-8 px-3 py-3" />
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tên nhóm
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tên gốc Zalo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tài khoản
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                NV nội bộ
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ẩn SĐT
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length === 0 && (
              <tr>
                <td colSpan={7} className="py-10 text-center text-sm text-gray-400">
                  Không tìm thấy nhóm nào phù hợp.
                </td>
              </tr>
            )}
            {filteredGroups.map((group) => {
              const displayName = (groupDisplayNames[group.id] || group.name).replace(/^NCC\s*[-–]\s*/i, "");
              const hasRename = !!(groupDisplayNames[group.id]);
              const staffIds = groupMemberships[group.id] ?? [];
              const staffUsers = DEMO_USERS.filter((u) => staffIds.includes(u.id));
              const linkedAccountIds = resolveGroupAccountIds(group.id, groupZaloAccountIds);
              const linkedAccounts = linkedAccountIds
                .map((id) => zaloAccounts.find((a) => a.id === id))
                .filter((a): a is ZaloAccount => !!a);
              const isHidden = phoneHidden[group.id] ?? false;
              const isPinned = pinnedGroups.includes(group.id);
              const assignedTagIds = groupTagIds[group.id] ?? [];
              const assignedTags = vendorTags.filter((t) => assignedTagIds.includes(t.id));
              const isExpanded = expandedId === group.id || (isStaffSearchActive && matchedStaffIds.size > 0 && staffIds.some((id) => matchedStaffIds.has(id)));

              return (
                <>
                  <tr
                    key={group.id}
                    className={cn(
                      "border-b border-gray-100 last:border-0",
                      isExpanded && "bg-green-50/30",
                    )}
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={() => setExpandedId(isExpanded && expandedId === group.id ? null : group.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {isPinned && (
                          <Pin className="h-3 w-3 rotate-45 text-brand-400 shrink-0" />
                        )}
                        <span className="font-medium text-gray-800">{displayName}</span>
                        {hasRename && (
                          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] text-green-600">
                            Đã đổi tên
                          </span>
                        )}
                        {assignedTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{group.name.replace(/^NCC\s*[-–]\s*/i, "")}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1">
                        {linkedAccounts.slice(0, 2).map((acc) => (
                          <span key={acc.id} className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 whitespace-nowrap">
                            {acc.displayName}
                          </span>
                        ))}
                        {linkedAccounts.length > 2 && (
                          <span
                            title={linkedAccounts.slice(2).map((a) => a.displayName).join(", ")}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500 cursor-default"
                          >
                            +{linkedAccounts.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {staffIds.length}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {isHidden ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2 py-0.5 text-[10px] font-semibold text-orange-600">
                            <EyeOff className="h-3 w-3" />
                            Đang ẩn
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-2 py-0.5 text-[10px] font-medium text-gray-400">
                            <Eye className="h-3 w-3" />
                            Đang hiện
                          </span>
                        )}
                        <Switch
                          checked={isHidden}
                          onCheckedChange={() => togglePhoneHidden(group.id)}
                          aria-label={isHidden ? "Bỏ ẩn số điện thoại" : "Ẩn số điện thoại với NCC"}
                        />
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setRenameGroupId(group.id)}
                          className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50"
                          title="Đặt tên gợi nhớ"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setAddStaffModal(group.id)}
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <UserPlus className="h-3.5 w-3.5" /> Thêm NV
                        </button>
                        <RowMoreMenu
                          groupId={group.id}
                          isPinned={isPinned}
                          onTogglePin={() => togglePinGroup(group.id)}
                          onOpenTagManage={() => setShowTagManagement(true)}
                        />
                      </div>
                    </td>
                  </tr>

                  {isExpanded && (
                    <tr key={`${group.id}-expanded`}>
                      <td colSpan={7} className="bg-green-50/20 px-8 pb-4 pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                            Nhân viên nội bộ ({staffUsers.length})
                          </p>
                        </div>
                        {staffUsers.length === 0 ? (
                          <p className="text-xs text-gray-400">Chưa có nhân viên nào trong nhóm</p>
                        ) : (
                          <div className="overflow-hidden rounded-lg border border-gray-100 bg-white">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Thành viên</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Phòng ban</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Đại diện qua</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {staffUsers.map((u) => {
                                  const isHighlighted = matchedStaffIds.has(u.id);
                                  // Accounts this staff is eligible for in this group
                                  const eligibleAccountIds = linkedAccountIds.filter((id) =>
                                    (zaloAccountAssignments[id] ?? []).includes(u.id),
                                  );
                                  return (
                                    <tr
                                      key={u.id}
                                      className={cn(
                                        "border-t border-gray-50",
                                        isHighlighted && "bg-blue-50/60",
                                      )}
                                    >
                                      <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                          <div
                                            className={cn(
                                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                                              isHighlighted
                                                ? "bg-blue-100 text-blue-700 ring-2 ring-blue-300"
                                                : "bg-green-100 text-green-700",
                                            )}
                                          >
                                            {u.displayName[0]}
                                          </div>
                                          <span className={cn("text-gray-800", isHighlighted && "font-semibold text-blue-700")}>
                                            {u.displayName}
                                          </span>
                                          {isHighlighted && (
                                            <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-600">
                                              Kết quả
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                      <td className="px-3 py-2 text-gray-500">{u.department}</td>
                                      <td className="px-3 py-2">
                                        {eligibleAccountIds.length > 0 ? (
                                          <StaffAccountOverrideSelect
                                            groupId={group.id}
                                            staffId={u.id}
                                            eligibleAccountIds={eligibleAccountIds}
                                          />
                                        ) : (
                                          <span className="text-xs text-gray-400">—</span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 text-right">
                                        <button
                                          onClick={() => removeStaffFromGroup(group.id, u.id)}
                                          className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                          title="Xóa khỏi nhóm"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {renameGroupId && (() => {
        const g = vendorGroups.find((vg) => vg.id === renameGroupId);
        return g ? (
          <RenameGroupModal
            groupId={renameGroupId}
            originalName={g.name}
            onClose={() => setRenameGroupId(null)}
          />
        ) : null;
      })()}

      {addStaffModal && (() => {
        const g = vendorGroups.find((vg) => vg.id === addStaffModal);
        return g ? (
          <AddStaffDialog
            groupId={addStaffModal}
            zaloAccountIds={resolveGroupAccountIds(addStaffModal, groupZaloAccountIds)}
            currentStaffIds={groupMemberships[addStaffModal] ?? []}
            onClose={() => setAddStaffModal(null)}
          />
        ) : null;
      })()}

      {showTagManagement && (
        <TagManagementModal onClose={() => setShowTagManagement(false)} />
      )}
    </div>
  );
}
