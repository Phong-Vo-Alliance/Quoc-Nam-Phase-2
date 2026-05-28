import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  FileText,
  UserIcon,
  UserPlus,
  X,
  Image,
  Pencil,
  ChevronDown,
  ImageOff,
  FileX,
  ArrowLeft,
  Download,
  Search,
  Settings2,
  EyeOff,
  Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { SegmentedTabs } from "@/features/portal/components/SegmentedTabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useVendorMessages, useVendorMembers } from "../hooks/useVendorMessages";
import { useZaloAccountForGroup } from "../hooks/useVendorGroups";
import { useVendorTasks, isToday } from "../hooks/useVendorTasks";
import { useDemoConfigStore, DEMO_USERS } from "@/stores/demoConfigStore";
import { RenameGroupModal } from "./RenameGroupModal";
import { VendorTaskCard } from "./VendorTaskCard";
import type { VendorMember, VendorGroup, VendorTask } from "@/types/zalo";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";
import vendorMembersRaw from "@/data/zalo/vendor-members.json";

const allGroups = vendorGroupsRaw as VendorGroup[];
const allMembersMap = vendorMembersRaw as Record<string, VendorMember[]>;

interface VendorRightPanelProps {
  groupId: string;
  onScrollToMessage?: (messageId: string) => void;
  onOpenTaskLog?: (taskId: string) => void;
  activeTab?: "info" | "tasks";
  onActiveTabChange?: (tab: "info" | "tasks") => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function getMemberRoleLabel(role: VendorMember["role"]): string {
  if (role === "ADMIN") return "Quản lý";
  if (role === "STAFF") return "Nhân viên";
  return "NCC";
}

function getMemberRoleBadgeClass(role: VendorMember["role"]): string {
  if (role === "ADMIN") return "bg-purple-100 text-purple-700";
  if (role === "STAFF") return "bg-blue-100 text-blue-700";
  return "bg-emerald-100 text-emerald-700";
}

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getGroupInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter((w) => w.length > 0);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

function getExtColor(ext: string): string {
  if (ext === "PDF") return "bg-red-500";
  if (ext === "XLSX" || ext === "XLS") return "bg-green-600";
  if (ext === "DOCX" || ext === "DOC") return "bg-blue-600";
  return "bg-gray-500";
}

// Strip "NCC - " / "NCC – " prefix for display
function stripNccPrefix(name: string): string {
  return name.replace(/^NCC\s*[-–]\s*/i, "");
}

/* ─── Completed tasks modal ─────────────────────────────────── */

interface CompletedModalProps {
  title: string;
  tasks: VendorTask[];
  onClose: () => void;
}

const CompletedModal: React.FC<CompletedModalProps> = ({ title, tasks, onClose }) => {
  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, VendorTask[]> = {};
    tasks.forEach((t) => {
      const key = new Date(t.updatedAt).toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const todayKey = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
      <div className="rounded-xl bg-white shadow-2xl w-full max-w-[520px] h-[80vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-brand-50 to-emerald-50">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-brand-600" />
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-sm text-gray-400">
              Chưa có công việc nào hoàn thành
            </div>
          ) : (
            <div className="space-y-5">
              {Object.entries(grouped).map(([dateKey, dateTasks]) => (
                <div key={dateKey}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold text-gray-600">
                      📅 {dateKey === todayKey ? `Hôm nay - ${dateKey}` : dateKey}
                    </span>
                    <span className="text-xs text-gray-400">({dateTasks.length})</span>
                  </div>
                  <div className="space-y-2 ml-4">
                    {dateTasks.map((t) => (
                      <div
                        key={t.id}
                        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 shadow-sm"
                      >
                        <p className="text-xs font-medium text-gray-700 leading-snug mb-1">
                          {t.title}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-gray-400">
                          <span>
                            Hoàn tất lúc{" "}
                            <span className="font-medium text-gray-600">
                              {new Date(t.updatedAt).toLocaleTimeString("vi-VN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </span>
                          <span className="font-medium text-gray-600">{t.assignToName}</span>
                        </div>
                        {t.checklist.length > 0 && (
                          <div className="mt-1 text-[10px] text-emerald-600">
                            ✓ {t.checklist.filter((c) => c.done).length}/{t.checklist.length} mục
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-gray-50 text-center">
          <button onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Info Section Card ──────────────────────────────────────── */

interface InfoSectionProps {
  title: string;
  count?: number;
  icon: React.ReactNode;
  action?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

const InfoSection: React.FC<InfoSectionProps> = ({
  title,
  count,
  icon,
  action,
  defaultOpen = true,
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2.5 hover:bg-gray-50/60 transition-colors cursor-pointer"
      >
        <span className="flex items-center gap-2 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-brand-50 text-brand-600">
            {icon}
          </span>
          <span className="text-sm font-semibold text-gray-900">{title}</span>
          {typeof count === "number" && count > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-[18px] px-1.5 rounded-full bg-brand-50 text-[10px] font-semibold text-brand-700 border border-brand-100">
              {count}
            </span>
          )}
        </span>
        <span className="flex items-center gap-1.5">
          {action && <span onClick={(e) => e.stopPropagation()}>{action}</span>}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-gray-400 transition-transform duration-200",
              !open && "-rotate-90"
            )}
          />
        </span>
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2 border-t border-gray-100">{children}</div>
      )}
    </div>
  );
};

/* ─── Member Manage Modal ───────────────────────────────────────── */

interface MemberManageModalProps {
  groupName: string;
  members: VendorMember[];
  potentialStaff: VendorMember[];
  onRemove: (memberId: string) => void;
  onToggleDownload: (memberId: string) => void;
  onAdd: (candidate: VendorMember) => void;
  onClose: () => void;
}

const MemberManageModal: React.FC<MemberManageModalProps> = ({
  groupName,
  members,
  potentialStaff,
  onRemove,
  onToggleDownload,
  onAdd,
  onClose,
}) => {
  const [view, setView] = useState<"list" | "add">("list");
  const [search, setSearch] = useState("");

  const filteredStaff = useMemo(
    () =>
      potentialStaff.filter((m) =>
        m.displayName.toLowerCase().includes(search.toLowerCase())
      ),
    [potentialStaff, search]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const staffMembers = members.filter((m) => m.role === "STAFF");
  const downloadCount = staffMembers.filter((m) => m.canDownload).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div
        className="rounded-2xl bg-white shadow-xl w-full max-w-sm flex flex-col overflow-hidden"
        style={{ height: "70vh" }}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b bg-gradient-to-r from-brand-50 to-blue-50">
          {view === "add" && (
            <button
              onClick={() => {
                setView("list");
                setSearch("");
              }}
              className="shrink-0 rounded-full p-1.5 hover:bg-white/60 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900">
              {view === "list" ? "Quản lý thành viên" : "Thêm nhân viên"}
            </h3>
            <p className="text-[10px] text-gray-400 truncate">{groupName}</p>
          </div>
          {view === "list" && (
            <button
              onClick={() => setView("add")}
              className="shrink-0 flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-brand-600 hover:bg-brand-50 transition-colors cursor-pointer"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Thêm
            </button>
          )}
          <button
            onClick={onClose}
            className="shrink-0 rounded-full p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Sliding content area */}
        <div className="flex-1 relative overflow-hidden">
          {/* View 1: Member list */}
          <div
            className="absolute inset-0 overflow-y-auto transition-transform duration-200 ease-in-out"
            style={{ transform: view === "list" ? "translateX(0)" : "translateX(-100%)" }}
          >
            {members.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                Chưa có thành viên nào
              </div>
            ) : (
              <ul className="divide-y divide-gray-50">
                {members.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/80 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold select-none",
                        member.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : member.role === "STAFF"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-emerald-100 text-emerald-700"
                      )}
                    >
                      {getInitials(member.displayName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {member.displayName}
                      </p>
                      <span
                        className={cn(
                          "inline-block rounded px-1.5 py-0.5 text-[9px] font-medium mt-0.5",
                          getMemberRoleBadgeClass(member.role)
                        )}
                      >
                        {getMemberRoleLabel(member.role)}
                      </span>
                    </div>
                    {member.role === "STAFF" && (
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => onToggleDownload(member.id)}
                          className={cn(
                            "rounded-md p-1.5 transition-all cursor-pointer",
                            member.canDownload
                              ? "text-brand-600 bg-brand-50 hover:bg-brand-100"
                              : "text-gray-300 hover:text-gray-500 hover:bg-gray-100"
                          )}
                          title={
                            member.canDownload
                              ? "Tắt quyền tải xuống"
                              : "Bật quyền tải xuống"
                          }
                        >
                          <Download className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onRemove(member.id)}
                          className="rounded-md p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all cursor-pointer"
                          title={`Xóa ${member.displayName}`}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* View 2: Add staff */}
          <div
            className="absolute inset-0 flex flex-col overflow-hidden transition-transform duration-200 ease-in-out"
            style={{ transform: view === "add" ? "translateX(0)" : "translateX(100%)" }}
          >
            <div className="shrink-0 px-4 py-2.5 border-b bg-white">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm nhân viên..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 pl-8 pr-3 py-1.5 text-sm outline-none focus:border-brand-400 transition-colors"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filteredStaff.length === 0 ? (
                <div className="py-12 text-center text-sm text-gray-400">
                  {search
                    ? "Không tìm thấy nhân viên nào."
                    : "Tất cả nhân viên đã trong nhóm."}
                </div>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {filteredStaff.map((m) => (
                    <li key={m.internalUserId ?? m.id}>
                      <button
                        onClick={() => onAdd(m)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-brand-50 transition-colors cursor-pointer"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[11px] font-semibold text-blue-700 select-none">
                          {getInitials(m.displayName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-800 truncate">
                            {m.displayName}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {m.email}
                          </p>
                        </div>
                        <UserPlus className="h-4 w-4 shrink-0 text-brand-400" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Footer stats */}
        <div className="shrink-0 px-4 py-2.5 border-t bg-gray-50 text-center">
          <p className="text-[11px] text-gray-400">
            {staffMembers.length} nhân viên nội bộ •{" "}
            {members.filter((m) => m.role === "VENDOR").length} NCC •{" "}
            <span className={downloadCount > 0 ? "text-brand-600 font-medium" : ""}>
              {downloadCount} có quyền tải xuống
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────── */

export const VendorRightPanel: React.FC<VendorRightPanelProps> = ({
  groupId,
  onScrollToMessage,
  onOpenTaskLog,
  activeTab: propActiveTab,
  onActiveTabChange,
}) => {
  const [tabState, setTabState] = useState<"info" | "tasks">(propActiveTab ?? "info");
  const activeTab = propActiveTab ?? tabState;
  const setActiveTab = (tab: "info" | "tasks") => {
    setTabState(tab);
    onActiveTabChange?.(tab);
  };
  const { data: allMessages } = useVendorMessages(groupId);
  const { data: initialMembers } = useVendorMembers(groupId);
  const zaloAccount = useZaloAccountForGroup(groupId);
  const currentUser = useDemoConfigStore((s) => s.currentUser);
  const groupDisplayNames = useDemoConfigStore((s) => s.groupDisplayNames);
  const addStaffToGroup = useDemoConfigStore((s) => s.addStaffToGroup);
  const removeStaffFromGroup = useDemoConfigStore((s) => s.removeStaffFromGroup);
  const setDownloadPermission = useDemoConfigStore((s) => s.setDownloadPermission);
  const zaloAccountAssignments = useDemoConfigStore((s) => s.zaloAccountAssignments);
  const phoneHidden = useDemoConfigStore((s) => s.phoneHidden);
  const togglePhoneHidden = useDemoConfigStore((s) => s.togglePhoneHidden);
  const isAdmin = currentUser.role === "ADMIN";
  const [showRenameModal, setShowRenameModal] = useState(false);

  const group = allGroups.find((g) => g.id === groupId);
  const displayName = stripNccPrefix(groupDisplayNames[groupId] || group?.name || groupId);

  const [members, setMembers] = useState<VendorMember[]>(initialMembers);
  const [showMemberModal, setShowMemberModal] = useState(false);

  // ─── Tasks tab state ────────────────────────────────────────
  const [taskMode, setTaskMode] = useState<"team" | "mine">("team");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [showTodo, setShowTodo] = useState(true);
  const [showInProgress, setShowInProgress] = useState(true);
  const [showDone, setShowDone] = useState(true);
  const [showMyTodo, setShowMyTodo] = useState(true);
  const [showMyInProgress, setShowMyInProgress] = useState(true);
  const [showMyDone, setShowMyDone] = useState(true);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showMyCompletedModal, setShowMyCompletedModal] = useState(false);

  const {
    groupTasks,
    myTasks,
    teamBuckets,
    myBuckets,
    onChangeStatus,
    onToggleChecklist,
  } = useVendorTasks(groupId);

  // Internal members only (no VENDOR) for assignee filter dropdown
  const internalMembers = useMemo(
    () => members.filter((m) => m.role !== "VENDOR"),
    [members]
  );

  // Staff only sees ADMIN + STAFF, admin sees everyone
  const visibleMembers = useMemo(
    () => (isAdmin ? members : members.filter((m) => m.role !== "VENDOR")),
    [isAdmin, members]
  );

  // Apply assignee filter to team buckets
  const filteredTeamBuckets = useMemo(() => {
    if (assigneeFilter === "all") return teamBuckets;
    const filter = (tasks: VendorTask[]) =>
      tasks.filter((t) => t.assignToId === assigneeFilter);
    return {
      todo: filter(teamBuckets.todo),
      inProgress: filter(teamBuckets.inProgress),
      doneToday: filter(teamBuckets.doneToday),
      doneAll: filter(teamBuckets.doneAll),
    };
  }, [teamBuckets, assigneeFilter]);

  // ─── Lifecycle ──────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    setMembers(initialMembers);
    setShowMemberModal(false);
    setActiveTab("info");
    setTaskMode("team");
    setAssigneeFilter("all");
  }, [groupId]); // intentionally omit initialMembers — we only want to reset on group switch, not on local member edits

  const potentialStaffMembers = useMemo(() => {
    const zaloAccountId = group?.zaloAccountId;
    if (!zaloAccountId) return [];

    const assignedStaffIds = new Set(zaloAccountAssignments[zaloAccountId] ?? []);
    const currentInternalIds = new Set(
      members.filter((m) => m.internalUserId).map((m) => m.internalUserId as string)
    );

    return DEMO_USERS
      .filter((u) => u.role === "STAFF" && assignedStaffIds.has(u.id) && !currentInternalIds.has(u.id))
      .map((u): VendorMember => ({
        id: `candidate_${u.id}`,
        role: "STAFF",
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
        zaloUserId: null,
        zaloDisplayName: null,
        internalUserId: u.id,
        email: u.email,
        canDownload: false,
      }));
  }, [members, groupId, group, zaloAccountAssignments]);

  const mediaAttachments = useMemo(
    () =>
      allMessages
        .filter(
          (m) =>
            (m.contentType === "IMG" || m.contentType === "VID") &&
            m.attachments.length > 0
        )
        .flatMap((m) =>
          m.attachments.map((att) => ({ ...att, isVideo: m.contentType === "VID" }))
        ),
    [allMessages]
  );

  const fileAttachments = useMemo(
    () =>
      allMessages
        .filter((m) => m.contentType === "FILE" && m.attachments.length > 0)
        .flatMap((m) => m.attachments),
    [allMessages]
  );

  const handleRemoveMember = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    if (member?.role === "STAFF" && member.internalUserId) {
      removeStaffFromGroup(groupId, member.internalUserId);
    }
  };

  const handleToggleDownload = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    setMembers((prev) =>
      prev.map((m) => (m.id === memberId ? { ...m, canDownload: !m.canDownload } : m))
    );
    if (member?.internalUserId) {
      const next = !member.canDownload;
      setDownloadPermission(groupId, member.internalUserId, {
        canDownloadImages: next,
        canDownloadFiles: next,
        canDownloadVideos: next,
      });
    }
  };

  const handleAddMember = (candidate: VendorMember) => {
    const newMember: VendorMember = {
      ...candidate,
      id: `${candidate.internalUserId}_in_${groupId}`,
      canDownload: false,
    };
    setMembers((prev) => [...prev, newMember]);
    if (candidate.internalUserId) {
      addStaffToGroup(groupId, candidate.internalUserId);
    }
  };

  // Stats
  const teamActiveCount =
    filteredTeamBuckets.todo.length + filteredTeamBuckets.inProgress.length;

  const myActiveCount = myBuckets.todo.length + myBuckets.inProgress.length;

  return (
    <div className="relative flex flex-col h-full">
      {/* Tab bar */}
      <div className="shrink-0 border-b border-gray-200 px-3 pt-3 pb-3">
        <SegmentedTabs
          tabs={[
            { key: "info", label: "Thông tin" },
            { key: "tasks", label: "Công việc" },
          ]}
          active={activeTab}
          onChange={(v) => setActiveTab(v as "info" | "tasks")}
          textClass="text-xs"
        />
      </div>

      {/* ─── Info Tab ─────────────────────────────────────────── */}
      {activeTab === "info" && (
        <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50/60 p-3 space-y-3 scrollbar-thin">
          {/* Group Identity Card — fixed header */}
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
            <div className="p-3.5">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm select-none">
                  {getGroupInitials(displayName)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1">
                    <h2 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 flex-1">
                      {displayName}
                    </h2>
                    {isAdmin && (
                      <button
                        onClick={() => setShowRenameModal(true)}
                        className="shrink-0 p-1 rounded-md hover:bg-brand-50 text-gray-400 hover:text-brand-600 transition-colors cursor-pointer"
                        title="Đặt tên gợi nhớ"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                  {zaloAccount && (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 rounded-md border border-blue-100 bg-blue-50 px-1.5 py-0.5 text-[10px] text-blue-700 max-w-full">
                      <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[8px] font-bold text-white">
                        Z
                      </span>
                      <span className="font-medium truncate">{zaloAccount.displayName}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Phone masking toggle — admin only */}
            {isAdmin && (
              <div className="border-t border-gray-100 px-3.5 py-2 flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer select-none">
                  {phoneHidden[groupId] ? (
                    <EyeOff className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  )}
                  <span>Ẩn số điện thoại</span>
                  {phoneHidden[groupId] && (
                    <span className="ml-1 inline-flex items-center rounded-full bg-orange-50 border border-orange-200 px-1.5 py-0.5 text-[9px] font-semibold text-orange-600">
                      Đang ẩn
                    </span>
                  )}
                </label>
                <Switch
                  checked={phoneHidden[groupId] ?? false}
                  onCheckedChange={() => togglePhoneHidden(groupId)}
                  aria-label="Ẩn số điện thoại"
                />
              </div>
            )}

            {/* Quick stats strip */}
            <div className="grid grid-cols-3 border-t border-gray-100 divide-x divide-gray-100 bg-gray-50/30">
              <div className="px-2 py-2 text-center">
                <div className="text-sm font-bold text-gray-900 tabular-nums">{mediaAttachments.length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Ảnh / Video</div>
              </div>
              <div className="px-2 py-2 text-center">
                <div className="text-sm font-bold text-gray-900 tabular-nums">{fileAttachments.length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Tài liệu</div>
              </div>
              <div className="px-2 py-2 text-center">
                <div className="text-sm font-bold text-gray-900 tabular-nums">{visibleMembers.length}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">Thành viên</div>
              </div>
            </div>
          </div>

          {/* Media Section */}
          <InfoSection
            title="Ảnh / Video"
            count={mediaAttachments.length}
            icon={<Image className="h-3.5 w-3.5" />}
          >
            {mediaAttachments.length === 0 ? (
              <div className="py-5 text-center">
                <ImageOff className="h-7 w-7 mx-auto text-gray-300" />
                <p className="mt-1.5 text-xs text-gray-400">Chưa có ảnh hoặc video nào.</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1.5">
                {mediaAttachments.map((att) =>
                  att.isVideo ? (
                    <div
                      key={att.id}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-800 flex items-center justify-center cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <span className="text-white text-xs font-bold opacity-60">VID</span>
                    </div>
                  ) : (
                    <div
                      key={att.id}
                      className="aspect-square rounded-lg overflow-hidden bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity"
                    >
                      <img
                        src={att.url}
                        alt={att.fileName}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </InfoSection>

          {/* Files Section */}
          <InfoSection
            title="Tài liệu"
            count={fileAttachments.length}
            icon={<FileText className="h-3.5 w-3.5" />}
          >
            {fileAttachments.length === 0 ? (
              <div className="py-5 text-center">
                <FileX className="h-7 w-7 mx-auto text-gray-300" />
                <p className="mt-1.5 text-xs text-gray-400">Chưa có tài liệu nào.</p>
              </div>
            ) : (
              <ul className="space-y-0.5">
                {fileAttachments.map((att) => {
                  const ext = att.fileName.split(".").pop()?.toUpperCase() ?? "FILE";
                  return (
                    <li
                      key={att.id}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white shadow-sm",
                          getExtColor(ext)
                        )}
                      >
                        {ext.slice(0, 4)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-gray-800">{att.fileName}</p>
                        <p className="text-[10px] text-gray-400 tabular-nums">{formatFileSize(att.fileSize)}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </InfoSection>

          {/* Members Section */}
          <InfoSection
            title="Thành viên"
            count={visibleMembers.length}
            icon={<Users className="h-3.5 w-3.5" />}
            action={
              isAdmin ? (
                <button
                  onClick={() => setShowMemberModal(true)}
                  className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-brand-600 hover:bg-brand-50 font-medium transition-colors cursor-pointer"
                  title="Quản lý thành viên"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span>Quản lý</span>
                </button>
              ) : undefined
            }
          >
            <ul className="space-y-0.5">
              {visibleMembers.map((member) => (
                <li
                  key={member.id}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold select-none",
                      member.role === "ADMIN"
                        ? "bg-purple-100 text-purple-700"
                        : member.role === "STAFF"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-emerald-100 text-emerald-700"
                    )}
                  >
                    {getInitials(member.displayName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-gray-800 leading-tight">
                      {member.displayName}
                    </p>
                    <span
                      className={cn(
                        "inline-block rounded px-1 py-0.5 text-[9px] font-medium mt-0.5",
                        getMemberRoleBadgeClass(member.role)
                      )}
                    >
                      {getMemberRoleLabel(member.role)}
                    </span>
                  </div>
                  {member.role === "STAFF" && member.canDownload && (
                    <Download className="h-3 w-3 shrink-0 text-brand-400" title="Có quyền tải xuống" />
                  )}
                </li>
              ))}
            </ul>
          </InfoSection>
        </div>
      )}

      {/* ─── Tasks Tab ────────────────────────────────────────── */}
      {activeTab === "tasks" && (
        <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 scrollbar-thin">
          {/* Toggle: Nhóm / Của tôi */}
          <ToggleGroup
            type="single"
            value={taskMode}
            onValueChange={(v) => { if (v) setTaskMode(v as "team" | "mine"); }}
            className="grid w-full grid-cols-2 gap-2"
          >
            <ToggleGroupItem
              value="team"
              className="
                flex items-center justify-center gap-2
                data-[state=on]:bg-brand-600 data-[state=on]:text-white
                data-[state=off]:bg-white data-[state=off]:text-gray-700
                border border-brand-200 rounded-lg px-3 py-2 text-sm font-medium transition-all
              "
            >
              <Users className="h-4 w-4" />
              Nhóm
            </ToggleGroupItem>
            <ToggleGroupItem
              value="mine"
              className="
                flex items-center justify-center gap-2
                data-[state=on]:bg-brand-600 data-[state=on]:text-white
                data-[state=off]:bg-white data-[state=off]:text-gray-700
                border border-brand-200 rounded-lg px-3 py-2 text-sm font-medium transition-all
              "
            >
              <UserIcon className="h-4 w-4" />
              Của tôi
              {myActiveCount > 0 && (
                <span className="ml-1 inline-flex min-w-[18px] h-[18px] items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-bold px-1">
                  {myActiveCount}
                </span>
              )}
            </ToggleGroupItem>
          </ToggleGroup>

          {/* ── TEAM MODE ── */}
          {taskMode === "team" && (
            <>
              {/* Header card */}
              <div className="rounded-xl border bg-white p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <Users className="h-4 w-4 text-brand-600" />
                  <span className="text-sm font-semibold">
                    Công Việc Nội Bộ –{" "}
                    <span className="text-brand-500">{displayName}</span>
                  </span>
                </div>

                {/* Assignee filter + template button */}
                <div className="flex items-center justify-between gap-2 mt-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs whitespace-nowrap text-gray-500">Nhân viên:</span>
                    <select
                      className="rounded-lg border border-brand-200 px-2 py-1 bg-white text-xs max-w-[160px] truncate outline-none focus:border-brand-500 transition-colors"
                      value={assigneeFilter}
                      onChange={(e) => setAssigneeFilter(e.target.value)}
                    >
                      <option value="all">Tất cả</option>
                      {internalMembers.map((m) => (
                        <option key={m.id} value={m.internalUserId ?? m.id}>
                          {m.displayName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-emerald-700 hover:bg-emerald-50 transition-colors flex-shrink-0"
                    title="Xem và chỉnh sửa checklist mặc định"
                  >
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-2 text-[11px] text-gray-400">
                  Đang xem{" "}
                  <span className="font-semibold text-gray-600">{teamActiveCount}</span>{" "}
                  công việc •{" "}
                  <span>{filteredTeamBuckets.todo.length} chưa xử lý</span> •{" "}
                  <span>{filteredTeamBuckets.inProgress.length} đang xử lý</span>
                </div>
              </div>

              {/* Task sections */}
              <div className="space-y-5">
                {/* Chưa xử lý */}
                <section>
                  <div
                    className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                    onClick={() => setShowTodo((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    <span>Chưa xử lý ({filteredTeamBuckets.todo.length}) {showTodo ? "▲" : "▼"}</span>
                  </div>
                  {showTodo && (
                    <div className="space-y-3">
                      {filteredTeamBuckets.todo.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-4">Không có công việc nào</p>
                      ) : (
                        filteredTeamBuckets.todo.map((t) => (
                          <VendorTaskCard
                            key={t.id}
                            task={t}
                            currentUserId={currentUser.id}
                            onChangeStatus={onChangeStatus}
                            onToggleChecklist={onToggleChecklist}
                            onOpenLog={onOpenTaskLog}
                            onScrollToSource={onScrollToMessage}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>

                {/* Đang xử lý */}
                <section>
                  <div
                    className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                    onClick={() => setShowInProgress((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    <span>Đang xử lý ({filteredTeamBuckets.inProgress.length}) {showInProgress ? "▲" : "▼"}</span>
                  </div>
                  {showInProgress && (
                    <div className="space-y-3">
                      {filteredTeamBuckets.inProgress.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-4">Không có công việc nào</p>
                      ) : (
                        filteredTeamBuckets.inProgress.map((t) => (
                          <VendorTaskCard
                            key={t.id}
                            task={t}
                            currentUserId={currentUser.id}
                            onChangeStatus={onChangeStatus}
                            onToggleChecklist={onToggleChecklist}
                            onOpenLog={onOpenTaskLog}
                            onScrollToSource={onScrollToMessage}
                          />
                        ))
                      )}
                    </div>
                  )}
                </section>

                {/* Hoàn thành hôm nay */}
                <section>
                  <div
                    className="mb-1 flex items-center gap-2 text-xs font-semibold text-gray-600 cursor-pointer select-none"
                    onClick={() => setShowDone((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    <span>
                      Hoàn thành ({filteredTeamBuckets.doneToday.length}) {showDone ? "▲" : "▼"}
                    </span>
                  </div>
                  {showDone && (
                    <div className="space-y-3">
                      {filteredTeamBuckets.doneToday.length === 0 ? (
                        <p className="text-xs text-gray-400 pl-4">Chưa có công việc hoàn thành hôm nay</p>
                      ) : (
                        filteredTeamBuckets.doneToday.map((t) => (
                          <VendorTaskCard
                            key={t.id}
                            task={t}
                            currentUserId={currentUser.id}
                            onChangeStatus={onChangeStatus}
                            onToggleChecklist={onToggleChecklist}
                            onOpenLog={onOpenTaskLog}
                            onScrollToSource={onScrollToMessage}
                          />
                        ))
                      )}
                    </div>
                  )}
                  <div className="mt-2 text-right">
                    <button
                      onClick={() => setShowCompletedModal(true)}
                      className="px-2 py-1 rounded-md text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                    >
                      Xem tất cả công việc đã hoàn thành
                    </button>
                  </div>
                </section>
              </div>
            </>
          )}

          {/* ── MINE MODE ── */}
          {taskMode === "mine" && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="rounded-xl border bg-gradient-to-r from-brand-50 via-emerald-50 to-cyan-50 p-4 shadow-sm">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <UserIcon className="h-5 w-5 text-brand-600" />
                  <span className="text-sm font-semibold text-gray-900">Công Việc Của Tôi</span>
                </div>
                <div className="text-center text-xs text-gray-600">
                  {myActiveCount > 0 ? (
                    <>
                      <span className="font-semibold text-brand-700">{myActiveCount}</span> công việc đang thực hiện •{" "}
                      <span>{myBuckets.todo.length} chưa xử lý</span> •{" "}
                      <span>{myBuckets.inProgress.length} đang xử lý</span>
                      {myBuckets.doneToday.length > 0 && (
                        <> • <span className="text-emerald-600">{myBuckets.doneToday.length} hoàn thành hôm nay</span></>
                      )}
                    </>
                  ) : (
                    <span className="text-emerald-600">✓ Đã hoàn thành hết công việc hôm nay</span>
                  )}
                </div>
              </div>

              {/* Empty state */}
              {myTasks.length === 0 && (
                <div className="rounded-xl border border-dashed bg-white/60 p-8 text-center">
                  <UserIcon className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 font-medium mb-1">Bạn chưa có công việc nào</p>
                  <p className="text-xs text-gray-400">Các công việc được giao sẽ xuất hiện ở đây</p>
                </div>
              )}

              {/* Chưa xử lý */}
              {myBuckets.todo.length > 0 && (
                <section>
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowMyTodo((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400" />
                    <span>Chưa xử lý ({myBuckets.todo.length})</span>
                    <span className="ml-1 text-gray-400">{showMyTodo ? "▲" : "▼"}</span>
                  </div>
                  {showMyTodo && (
                    <div className="space-y-3">
                      {myBuckets.todo.map((t) => (
                        <VendorTaskCard
                          key={t.id}
                          task={t}
                          currentUserId={currentUser.id}
                          onChangeStatus={onChangeStatus}
                          onToggleChecklist={onToggleChecklist}
                          onScrollToSource={onScrollToMessage}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Đang xử lý */}
              {myBuckets.inProgress.length > 0 && (
                <section>
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowMyInProgress((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-400" />
                    <span>Đang xử lý ({myBuckets.inProgress.length})</span>
                    <span className="ml-1 text-gray-400">{showMyInProgress ? "▲" : "▼"}</span>
                  </div>
                  {showMyInProgress && (
                    <div className="space-y-3">
                      {myBuckets.inProgress.map((t) => (
                        <VendorTaskCard
                          key={t.id}
                          task={t}
                          currentUserId={currentUser.id}
                          onChangeStatus={onChangeStatus}
                          onToggleChecklist={onToggleChecklist}
                          onScrollToSource={onScrollToMessage}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Hoàn thành hôm nay */}
              {myBuckets.doneToday.length > 0 && (
                <section>
                  <div
                    className="mb-2 flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer select-none hover:text-brand-700 transition-colors"
                    onClick={() => setShowMyDone((v) => !v)}
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    <span>Hoàn thành hôm nay ({myBuckets.doneToday.length})</span>
                    <span className="ml-1 text-gray-400">{showMyDone ? "▲" : "▼"}</span>
                  </div>
                  {showMyDone && (
                    <div className="space-y-3">
                      {myBuckets.doneToday.map((t) => (
                        <VendorTaskCard
                          key={t.id}
                          task={t}
                          currentUserId={currentUser.id}
                          onChangeStatus={onChangeStatus}
                          onToggleChecklist={onToggleChecklist}
                          onScrollToSource={onScrollToMessage}
                        />
                      ))}
                    </div>
                  )}
                </section>
              )}

              {/* Link to all completed */}
              {myBuckets.doneAll.length > 0 && (
                <div className="text-center pt-1">
                  <button
                    onClick={() => setShowMyCompletedModal(true)}
                    className="px-2 py-1 rounded-md text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors cursor-pointer"
                  >
                    Xem tất cả công việc đã hoàn thành ({myBuckets.doneAll.length}) →
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Member Manage Modal ──────────────────────────────── */}
      {showMemberModal && (
        <MemberManageModal
          groupName={displayName}
          members={members}
          potentialStaff={potentialStaffMembers}
          onRemove={handleRemoveMember}
          onToggleDownload={handleToggleDownload}
          onAdd={handleAddMember}
          onClose={() => setShowMemberModal(false)}
        />
      )}

      {showRenameModal && group && (
        <RenameGroupModal
          groupId={groupId}
          originalName={group.name}
          onClose={() => setShowRenameModal(false)}
        />
      )}

      {/* ─── Completed modals ─────────────────────────────────── */}
      {showCompletedModal && (
        <CompletedModal
          title={`Công Việc Đã Hoàn Thành – ${displayName}`}
          tasks={filteredTeamBuckets.doneAll}
          onClose={() => setShowCompletedModal(false)}
        />
      )}
      {showMyCompletedModal && (
        <CompletedModal
          title="Công Việc Đã Hoàn Thành (Của Tôi)"
          tasks={myBuckets.doneAll}
          onClose={() => setShowMyCompletedModal(false)}
        />
      )}
    </div>
  );
};
