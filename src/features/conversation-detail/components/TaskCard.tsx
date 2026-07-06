import React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useIsLeaderInConversation } from "@/hooks/useCategoryLeader";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  useAddCheckItem,
  useToggleCheckItem,
  useUpdateCheckItem,
  useDeleteCheckItem,
  useUpdateTaskStatus,
} from "@/hooks/mutations";
import { useSendMessage } from "@/hooks/mutations/useSendMessage";
import { useAuthStore } from "@/stores/authStore";
import type {
  Task,
  ChecklistItem,
  TaskLogMessage,
  ChecklistVariant,
} from "@/features/portal/types";
import type { StarredMessageDto } from "@/types/pinned_and_starred";
import type { MessageLike } from "@/features/portal/components/FileManagerPhase1A";
import {
  formatTime,
  truncateMessageTitle,
  abbreviateVietnameseName,
} from "../utils/formatters";
import type { MinimalMember, ViewMode } from "../types";

/* =============== Constants =============== */
const STATUS_LABELS_VI: Record<string, string> = {
  todo: "Chưa xử lý",
  doing: "Đang xử lý",
  need_to_verified: "Chờ duyệt",
  finished: "Hoàn thành",
};

/* =============== Helpers =============== */
const StatusBadge: React.FC<{ s: Task["status"] }> = ({ s }) => {
  const label = s.label || "Unknown";
  const color = s.color || "#gray";

  const styleMap: Record<string, string> = {
    todo: "bg-amber-200 text-brand-700 border-gray-200",
    doing: "bg-sky-50 text-sky-700 border-sky-200",
    need_to_verified: "bg-amber-50 text-amber-700 border-amber-200",
    finished: "bg-emerald-50 text-emerald-700 border-emerald-200",
  };

  const cls = styleMap[s.code] || "bg-gray-50 text-gray-700 border-gray-200";

  return (
    <span
      className={`
        inline-flex items-center
        rounded-md px-2 py-0.5 text-[10px] font-medium
        border border-gray-200 bg-gray-50 text-gray-600
        shadow-sm
        ${cls}
      `}
    >
      {label}
    </span>
  );
};

/* =============== Main Component =============== */
export const TaskCard: React.FC<{
  t: Task;
  members: MinimalMember[];
  viewMode: ViewMode;
  isLeaderOwnTask?: boolean;
  groupName?: string;
  checklistVariants?: ChecklistVariant[];
  assigneeOptions?: MinimalMember[];
  conversationId?: string;
  workspaceId?: string;
  onChangeStatus?: (id: string, next: Task["status"]) => void;
  onReassign?: (id: string, assignTo: string) => void;
  onToggleChecklist?: (taskId: string, itemId: string, done: boolean) => void;
  onUpdateTaskChecklist?: (taskId: string, next: ChecklistItem[]) => void;
  taskLogs?: Record<string, TaskLogMessage[]>;
  onOpenTaskLog?: (taskId: string) => void;
  onClickTitle?: (messageDto: StarredMessageDto | null) => void;
  messages?: MessageLike[];
}> = ({
  t,
  members,
  viewMode,
  isLeaderOwnTask = false,
  groupName,
  checklistVariants,
  assigneeOptions,
  conversationId,
  workspaceId,
  onChangeStatus,
  onReassign,
  onToggleChecklist,
  onUpdateTaskChecklist,
  taskLogs,
  onOpenTaskLog,
  onClickTitle,
  messages = [],
}) => {
  const [open, setOpen] = React.useState(false);
  const assigneeName =
    members.find((m) => m.id === t.assignTo)?.name ?? t.assignTo;
  const [editingItem, setEditingItem] = React.useState<ChecklistItem | null>(
    null,
  );
  const [newLabel, setNewLabel] = React.useState("");
  const [newNote, setNewNote] = React.useState("");
  const [deleteItemTarget, setDeleteItemTarget] =
    React.useState<ChecklistItem | null>(null);
  const [expandedNoteIds, setExpandedNoteIds] = React.useState<Set<string>>(
    new Set(),
  );
  const [overflowingNoteIds, setOverflowingNoteIds] = React.useState<
    Set<string>
  >(new Set());
  const noteRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const overflowingNoteIdsRef = React.useRef(overflowingNoteIds);

  React.useEffect(() => {
    overflowingNoteIdsRef.current = overflowingNoteIds;
  }, [overflowingNoteIds]);

  const toggleNoteExpanded = React.useCallback((id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  // Guards against double-submit when Enter on input + Click on button fire in the same tick
  // (TanStack Query's isPending updates async via state, so it can't block synchronous double-fires)
  const isSubmittingItemRef = React.useRef(false);

  // Mutation hooks for API calls
  const addCheckItemMutation = useAddCheckItem();
  const toggleCheckItemMutation = useToggleCheckItem();
  const updateCheckItemMutation = useUpdateCheckItem();
  const deleteCheckItemMutation = useDeleteCheckItem();
  const updateStatusMutation = useUpdateTaskStatus();

  // Send system message on checklist toggle
  const sendMessageMutation = useSendMessage({
    workspaceId: workspaceId || "",
    conversationId: conversationId || "",
  });

  // Get current user's full name for system messages
  const currentUser = useAuthStore((s) => s.user);
  const currentUserFullName = currentUser?.fullName || "Unknown User";

  const total = t.checklist?.length ?? 0;
  const doneCount = t.checklist?.filter((c) => c.done).length ?? 0;
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  const displayLabel = groupName || "không xác định";
  const templateName = t.checklistTemplateId
    ? checklistVariants?.find((v) => v.id === t.checklistTemplateId)?.name
    : null;
  const progressText =
    t.progressText ??
    (total ? `${doneCount}/${total} mục` : "Không có checklist");

  const [editChecklist, setEditChecklist] = React.useState(false);
  const isLeaderOfGroup = useIsLeaderInConversation(conversationId);
  const canEditStructure = isLeaderOfGroup && t.status.code === "todo";

  // Inline note editing: staff at todo/doing OR leader at doing
  // Status need_to_verified / finished → read-only for both
  const canInlineEditNote =
    (t.status.code === "todo" || t.status.code === "doing") &&
    (!isLeaderOfGroup || t.status.code === "doing");

  const [inlineNoteEditingId, setInlineNoteEditingId] = React.useState<
    string | null
  >(null);
  const [inlineNoteValue, setInlineNoteValue] = React.useState("");
  const inlineNoteInputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const openInlineNoteEditor = React.useCallback(
    (item: ChecklistItem) => {
      if (!canInlineEditNote) return;
      setInlineNoteEditingId(item.id);
      setInlineNoteValue((item.note ?? "").slice(0, 500));
    },
    [canInlineEditNote],
  );

  const closeInlineNoteEditor = React.useCallback(() => {
    setInlineNoteEditingId(null);
    setInlineNoteValue("");
  }, []);

  const handleSaveInlineNote = async (item: ChecklistItem) => {
    if (updateCheckItemMutation.isPending) return;
    const trimmedNote = inlineNoteValue.trim().slice(0, 500);
    const noteValue = trimmedNote.length > 0 ? trimmedNote : null;
    const previousNote = (item.note ?? "").trim();
    if (noteValue === (previousNote.length > 0 ? previousNote : null)) {
      closeInlineNoteEditor();
      return;
    }

    try {
      await updateCheckItemMutation.mutateAsync({
        taskId: t.id,
        itemId: item.id,
        content: item.label,
        note: noteValue,
      });

      closeInlineNoteEditor();

      if (conversationId && t.messageId) {
        const action = previousNote.length === 0 ? "thêm" : "cập nhật";
        const messageContent = `${currentUserFullName} đã ${action} ghi chú cho mục "${item.label}"`;
        try {
          await sendMessageMutation.mutateAsync({
            conversationId,
            content: messageContent,
            messageType: "SYS",
            parentMessageId: t.messageId,
          });
        } catch (error) {
          // Silently fail - don't show error to user
        }
      }
    } catch (error) {
      console.error("Failed to update checklist note:", error);
      toast.error("Cập nhật ghi chú thất bại. Thử lại sau");
    }
  };

  React.useEffect(() => {
    if (!inlineNoteEditingId) return;
    const el = inlineNoteInputRef.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [inlineNoteEditingId]);

  React.useEffect(() => {
    const el = inlineNoteInputRef.current;
    if (!el || !inlineNoteEditingId) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [inlineNoteValue, inlineNoteEditingId]);

  const permissions = t.permissions;

  // Checklist can only be toggled when task is in "doing" status
  // Disabled when: todo (chưa bắt đầu), need_to_verified (chờ duyệt), finished (hoàn thành)
  const canToggleChecklist = t.status.code === "doing";

  // Get tooltip message for disabled checkbox based on status
  const getChecklistDisabledTooltip = () => {
    switch (t.status.code) {
      case "todo":
        return "Vui lòng bắt đầu task trước khi check";
      case "need_to_verified":
        return "Task đang chờ duyệt, không thể chỉnh sửa";
      case "finished":
        return "Task đã hoàn thành";
      default:
        return "Không thể chỉnh sửa checklist";
    }
  };

  // Helper: check if label is valid (contains at least one alphanumeric character)
  const isValidLabel = (text: string) => {
    const trimmed = text.trim();
    // Check if has at least one letter or number (not just special chars)
    return trimmed.length > 0 && /[\p{L}\p{N}]/u.test(trimmed);
  };

  // Handler: Submit checklist item (add new or update existing)
  // Single entry point used by both Enter-on-input and Click-on-Save-button
  // to prevent double API calls when both events fire in the same tick.
  const handleSubmitChecklistItem = async () => {
    if (!editingItem) return;
    if (!isValidLabel(newLabel)) return;
    if (isSubmittingItemRef.current) return;
    if (
      addCheckItemMutation.isPending ||
      updateCheckItemMutation.isPending
    ) {
      return;
    }

    isSubmittingItemRef.current = true;
    const trimmedLabel = newLabel.trim();
    const trimmedNote = newNote.trim().slice(0, 500);
    const noteValue = trimmedNote.length > 0 ? trimmedNote : null;
    const isNew = editingItem.id === "new";
    const previousLabel = editingItem.label;

    try {
      if (isNew) {
        await addCheckItemMutation.mutateAsync({
          taskId: t.id,
          content: trimmedLabel,
          note: noteValue,
        });
      } else {
        await updateCheckItemMutation.mutateAsync({
          taskId: t.id,
          itemId: editingItem.id,
          content: trimmedLabel,
          note: noteValue,
        });
      }

      setEditingItem(null);
      setNewLabel("");
      setNewNote("");
      setOpen(true);

      if (conversationId && t.messageId) {
        const messageContent = isNew
          ? `${currentUserFullName} đã thêm mục ${trimmedLabel} vào công việc ${t.title}`
          : `${currentUserFullName} đã cập nhật mục ${previousLabel} thành ${trimmedLabel} vào công việc ${t.title}`;
        try {
          await sendMessageMutation.mutateAsync({
            conversationId,
            content: messageContent,
            messageType: "SYS",
            parentMessageId: t.messageId,
          });
        } catch (error) {
          // Silently fail - don't show error to user
        }
      }
    } catch (error) {
      console.error(
        isNew
          ? "Failed to add checklist item:"
          : "Failed to update checklist item:",
        error,
      );
    } finally {
      isSubmittingItemRef.current = false;
    }
  };

  // Handler: Delete checklist item with toast and system message
  const handleDeleteChecklistItem = async () => {
    if (!deleteItemTarget) return;

    try {
      await deleteCheckItemMutation.mutateAsync({
        taskId: t.id,
        itemId: deleteItemTarget.id,
      });

      toast.success("Đã xóa mục");

      // Send system message about deleting checklist item
      if (conversationId && t.messageId) {
        try {
          await sendMessageMutation.mutateAsync({
            conversationId,
            content: `${currentUserFullName} đã xóa mục "${deleteItemTarget.label}"`,
            messageType: "SYS",
            parentMessageId: t.messageId,
          });
        } catch (error) {
          // Silently fail - don't show error to user
        }
      }
    } catch (error) {
      console.error("Failed to delete checklist item:", error);
      toast.error("Xóa mục thất bại. Thử lại sau");
    }

    setDeleteItemTarget(null);
  };

  // Detect which checklist note rows actually wrap to more than 1 line
  React.useEffect(() => {
    if (!t.checklist || t.checklist.length === 0) {
      setOverflowingNoteIds((prev) => (prev.size === 0 ? prev : new Set()));
      return;
    }

    const compute = () => {
      const next = new Set<string>();
      for (const item of t.checklist || []) {
        if (!item.note?.trim()) continue;
        if (expandedNoteIds.has(item.id)) {
          if (overflowingNoteIdsRef.current.has(item.id)) next.add(item.id);
          continue;
        }
        const el = noteRefs.current[item.id];
        if (el && el.scrollHeight > el.clientHeight + 1) {
          next.add(item.id);
        }
      }
      setOverflowingNoteIds((prev) => {
        if (prev.size === next.size) {
          let same = true;
          for (const id of next) {
            if (!prev.has(id)) {
              same = false;
              break;
            }
          }
          if (same) return prev;
        }
        return next;
      });
    };

    compute();

    const observers: ResizeObserver[] = [];
    if (typeof ResizeObserver !== "undefined") {
      for (const item of t.checklist || []) {
        const el = noteRefs.current[item.id];
        if (!el) continue;
        const ro = new ResizeObserver(() => compute());
        ro.observe(el);
        observers.push(ro);
      }
    }
    return () => {
      observers.forEach((o) => o.disconnect());
    };
  }, [t.checklist, expandedNoteIds, open]);

  // Sort checklist: unchecked first, then by order field from API
  const sortedChecklist = React.useMemo(() => {
    if (!t.checklist) return [];

    const sorted = [...t.checklist].sort((a, b) => {
      // Sort by done status first (unchecked items first)
      if (a.done !== b.done) {
        return a.done ? 1 : -1;
      }
      // Then sort by order field (ascending: smaller order first)
      const orderA = a.order ?? 999; // Put items without order at the end
      const orderB = b.order ?? 999;
      return orderA - orderB;
    });

    return sorted;
  }, [t.checklist]);

  return (
    <>
      {/* Checklist Edit Dialog */}
      {editingItem && (
        <div
          className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 !mt-0"
          data-testid="checklist-edit-dialog"
        >
          <div className="bg-white rounded-xl p-4 w-[300px] shadow-xl">
            <div className="text-sm font-semibold mb-2">
              {editingItem?.id === "new" ? "Thêm mục" : "Chỉnh sửa mục"}
            </div>

            <input
              data-testid="checklist-item-input"
              className="w-full rounded border px-2 py-1 text-sm"
              value={newLabel}
              autoFocus
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmitChecklistItem();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingItem(null);
                  setNewLabel("");
                  setNewNote("");
                }
              }}
            />

            <div className="mt-2 flex items-center justify-between text-[11px] font-medium text-gray-600">
              <span>Ghi chú (tuỳ chọn)</span>
              <span
                className={
                  newNote.length >= 500 ? "text-rose-500" : "text-gray-400"
                }
              >
                {newNote.length}/500
              </span>
            </div>
            <textarea
              data-testid="checklist-item-note-input"
              className="mt-1 w-full rounded border px-2 py-1 text-sm resize-none"
              rows={3}
              maxLength={500}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value.slice(0, 500))}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  e.preventDefault();
                  setEditingItem(null);
                  setNewLabel("");
                  setNewNote("");
                }
              }}
              placeholder="Thêm ghi chú cho mục này..."
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                data-testid="checklist-cancel-button"
                className="text-xs px-2 py-1 rounded bg-gray-100"
                onClick={() => {
                  setEditingItem(null);
                  setNewLabel("");
                  setNewNote("");
                }}
              >
                Huỷ
              </button>
              <button
                data-testid="checklist-save-button"
                type="button"
                className="text-xs px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  addCheckItemMutation.isPending ||
                  updateCheckItemMutation.isPending ||
                  !isValidLabel(newLabel)
                }
                onClick={handleSubmitChecklistItem}
              >
                {addCheckItemMutation.isPending ||
                updateCheckItemMutation.isPending
                  ? "Đang lưu..."
                  : "Lưu"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="
          relative
          rounded-xl
          bg-white/80
          border border-emerald-100
          p-4
          shadow-[0_2px_3px_rgba(15,23,42,0.10)]
          hover:shadow-[0_6px_8px_rgba(15,23,42,0.16)]
          transition-all
          duration-200
          hover:-translate-y-[1px]
        "
        data-testid={`task-item-${t.id}`}
      >
        {/* Floating status badge góc phải trên */}
        <div className="absolute -top-3 right-2" data-testid="task-status">
          <StatusBadge s={t.status} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="min-w-0 flex-1">
            {/* Title */}
            <div className="text-[13px] font-semibold leading-snug truncate">
              <a
                href={t.messageId ? `#msg-${t.messageId}` : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  if (!t.messageId) {
                    return;
                  }
                  const messageDto: StarredMessageDto = {
                    messageId: t.messageId,
                    starredAt: t.createdAt || new Date().toISOString(),
                    message: {
                      id: t.messageId,
                      conversationId: t.workTypeId || "",
                      senderId: "",
                      senderName: t.assignFrom || "Không xác định",
                      senderIdentifier: null,
                      senderFullName: t.assignFrom || null,
                      senderRoles: null,
                      parentMessageId: null,
                      quoteMessageId: null,
                      content: t.title || t.description || "",
                      contentType: "TXT",
                      sentAt: t.createdAt || new Date().toISOString(),
                      editedAt: null,
                      linkedTaskId: t.id,
                      reactions: [],
                      attachments: (t.attachments || []).map((att) => ({
                        id: att.id || "",
                        fileId: att.id || "",
                        fileName: att.fileName || null,
                        fileSize: att.fileSize || 0,
                        contentType: att.contentType || null,
                        createdAt: t.createdAt || new Date().toISOString(),
                      })),
                      replyCount: 0,
                      unreadReplyCount: 0,
                      isStarred: false,
                      isPinned: false,
                      threadPreview: null,
                      mentions: [],
                    },
                  };

                  onClickTitle?.(messageDto);
                }}
                className={`
                  block w-full text-left
                  text-[13px] font-semibold leading-snug
                  truncate
                  transition-colors duration-200
                  ${
                    t.messageId
                      ? `
                      text-gray-800 
                      hover:text-brand-600 
                      hover:underline 
                      hover:decoration-brand-500
                      hover:decoration-2
                      cursor-pointer
                      focus:outline-none 
                      focus:ring-2 
                      focus:ring-brand-500/20 
                      focus:ring-offset-1
                      rounded-sm
                    `
                      : "text-gray-400 cursor-not-allowed no-underline"
                  }
                `}
                title={
                  t.messageId
                    ? "📌 Nhấn để xem tin nhắn gốc"
                    : "⚠️ Không có tin nhắn nguồn"
                }
                aria-disabled={!t.messageId}
                data-testid="task-title"
              >
                {truncateMessageTitle(t.title || t.description || "")}
              </a>
            </div>

            {/* Meta: group name, assignee */}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
              <span
                className="inline-flex items-center gap-1"
                data-testid="task-group-name"
              >
                <span>Loại việc:</span>
                <span className="font-medium text-gray-700">
                  {displayLabel}
                </span>
              </span>

              {isLeaderOfGroup && (
                <>
                  <span>•</span>
                  {t.status.code !== "need_to_verified" &&
                  t.status.code !== "finished" ? (
                    <span
                      className="inline-flex items-center gap-1"
                      data-testid="task-assignee-select"
                    >
                      <span>Giao cho:</span>
                      <span className="font-medium text-gray-700">
                        <select
                          className="rounded-md border px-2 py-0.5 text-[11px] bg-white max-w-[180px] truncate"
                          value={t.assignTo}
                          onChange={(e) => onReassign?.(t.id, e.target.value)}
                          data-testid="task-assignee-dropdown"
                        >
                          {(assigneeOptions || members).map((m) => (
                            <option key={m.id} value={m.id}>
                              {abbreviateVietnameseName(m.name, 20)}
                            </option>
                          ))}
                        </select>
                      </span>
                    </span>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1"
                      data-testid="task-assignee-text"
                    >
                      <span>Giao cho:</span>
                      <span className="font-medium text-gray-700">
                        {
                          (assigneeOptions || members).find(
                            (m) => m.id === t.assignTo,
                          )?.name
                        }
                      </span>
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Progress bar */}
            {total > 0 && (
              <div className="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}

            {/* Checklist */}
            {t.checklist?.length ? (
              <div className="mt-2">
                <div className="flex items-center justify-between pr-1">
                  <div
                    data-testid="checklist-toggle-header"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 cursor-pointer hover:text-emerald-800 hover:underline select-none"
                    onClick={() => setOpen((v) => !v)}
                  >
                    {open ? (
                      <ChevronDown className="w-3 h-3" />
                    ) : (
                      <ChevronRight className="w-3 h-3" />
                    )}
                    Checklist ({doneCount}/{total})
                  </div>

                  {canEditStructure && (
                    <span
                      data-testid="checklist-add-button"
                      className="text-[11px] text-emerald-700 cursor-pointer hover:underline select-none"
                      onClick={() => {
                        setEditingItem({ id: "new", label: "", done: false });
                        setNewLabel("");
                        setNewNote("");
                        setOpen(true);
                      }}
                    >
                      + Thêm
                    </span>
                  )}
                </div>

                {open && (
                  <ul className="mt-2 space-y-1" data-testid="checklist-list">
                    {sortedChecklist.map((c) => {
                      const note = c.note?.trim();
                      const isNoteExpanded = expandedNoteIds.has(c.id);
                      const isOverflowing = overflowingNoteIds.has(c.id);
                      const showToggle =
                        !!note && (isOverflowing || isNoteExpanded);
                      return (
                      <li
                        key={c.id}
                        className="group flex items-start gap-2 text-[12px] leading-none rounded-md px-2 py-1.5 hover:bg-gray-50 transition-all"
                        data-testid={`checklist-item-${c.id}`}
                      >
                        <button
                          type="button"
                          data-testid={`checklist-toggle-${c.id}`}
                          className={`
                            h-4 w-4 shrink-0 rounded-full p-0
                            transition flex items-center justify-center
                            ${
                              !canToggleChecklist
                                ? c.done
                                  ? "bg-emerald-500 text-white cursor-not-allowed"
                                  : "border-[1px] border-gray-200 bg-gray-100 cursor-not-allowed opacity-70"
                                : c.done
                                  ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 cursor-pointer checklist-btn"
                                  : "checklist-btn border-[1px] border-emerald-300 bg-white hover:shadow-[0_0_4px_var(--brand-glow)]"
                            }
                          `}
                          disabled={
                            !canToggleChecklist ||
                            toggleCheckItemMutation.isPending ||
                            sendMessageMutation.isPending
                          }
                          onClick={async () => {
                            if (!canToggleChecklist) return;
                            try {
                              // Toggle the checklist item
                              await toggleCheckItemMutation.mutateAsync({
                                taskId: t.id,
                                itemId: c.id,
                              });

                              // Send system message about the toggle
                              const newDoneState = !c.done;
                              const action = newDoneState
                                ? "đánh dấu"
                                : "bỏ đánh dấu";
                              const messageContent = `${currentUserFullName} đã ${action} mục "${c.label}"`;

                              if (conversationId && t.messageId) {
                                try {
                                  await sendMessageMutation.mutateAsync({
                                    conversationId,
                                    content: messageContent,
                                    messageType: "SYS",
                                    parentMessageId: t.messageId,
                                  });
                                } catch (error) {
                                  console.error(
                                    "Failed to send system message:",
                                    error,
                                  );
                                  // Silently fail - don't show error to user
                                }
                              }
                            } catch (error) {
                              console.error(
                                "Failed to toggle checklist item:",
                                error,
                              );
                            }
                          }}
                          title={
                            !canToggleChecklist
                              ? getChecklistDisabledTooltip()
                              : c.done
                                ? "Nhấn để bỏ chọn"
                                : "Nhấn để hoàn thành"
                          }
                        >
                          {c.done && <Check className="w-3 h-3" />}
                        </button>

                        <div className="flex-1 min-w-0 flex flex-col gap-1">
                          <span
                            data-testid={`checklist-label-${c.id}`}
                            className={`
                              ${c.done ? "text-gray-400 line-through" : "text-gray-700"}
                              select-none transition-colors leading-none break-words
                              ${canToggleChecklist ? "cursor-pointer hover:text-emerald-600" : "cursor-not-allowed"}
                            `}
                            onClick={async () => {
                              if (
                                !canToggleChecklist ||
                                toggleCheckItemMutation.isPending ||
                                sendMessageMutation.isPending
                              )
                                return;
                              try {
                                // Toggle the checklist item
                                await toggleCheckItemMutation.mutateAsync({
                                  taskId: t.id,
                                  itemId: c.id,
                                });

                                // Send system message about the toggle
                                const newDoneState = !c.done;
                                const action = newDoneState
                                  ? "đánh dấu"
                                  : "bỏ đánh dấu";
                                const messageContent = `${currentUserFullName} đã ${action} mục "${c.label}"`;

                                if (conversationId && t.messageId) {
                                  try {
                                    await sendMessageMutation.mutateAsync({
                                      conversationId,
                                      content: messageContent,
                                      messageType: "SYS",
                                      parentMessageId: t.messageId,
                                    });
                                  } catch (error) {
                                    console.error(
                                      "Failed to send system message:",
                                      error,
                                    );
                                    // Silently fail - don't show error to user
                                  }
                                }
                              } catch (error) {
                                console.error(
                                  "Failed to toggle checklist item:",
                                  error,
                                );
                              }
                            }}
                            title={
                              !canToggleChecklist
                                ? getChecklistDisabledTooltip()
                                : c.done
                                  ? "Nhấn để bỏ chọn"
                                  : "Nhấn để hoàn thành"
                            }
                          >
                            {c.label}
                          </span>
                          {inlineNoteEditingId === c.id ? (
                            <div
                              data-testid={`checklist-note-edit-${c.id}`}
                              className="border-l-2 border-brand-400 pl-2"
                            >
                              <textarea
                                ref={inlineNoteInputRef}
                                data-testid={`checklist-note-input-${c.id}`}
                                className="w-full rounded border px-2 py-1 text-[11px] italic text-gray-700 resize-none overflow-hidden focus:outline-none focus:ring-1 focus:ring-brand-400"
                                rows={1}
                                maxLength={500}
                                value={inlineNoteValue}
                                onChange={(e) =>
                                  setInlineNoteValue(
                                    e.target.value.slice(0, 500),
                                  )
                                }
                                onInput={(e) => {
                                  const el = e.currentTarget;
                                  el.style.height = "auto";
                                  el.style.height = `${el.scrollHeight}px`;
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === "Escape") {
                                    e.preventDefault();
                                    closeInlineNoteEditor();
                                  } else if (
                                    e.key === "Enter" &&
                                    (e.metaKey || e.ctrlKey)
                                  ) {
                                    e.preventDefault();
                                    handleSaveInlineNote(c);
                                  }
                                }}
                                placeholder="Thêm ghi chú cho mục này..."
                              />
                              <div className="mt-1 flex items-center justify-between">
                                <span
                                  className={`text-[10px] ${
                                    inlineNoteValue.length >= 500
                                      ? "text-rose-500"
                                      : "text-gray-400"
                                  }`}
                                >
                                  {inlineNoteValue.length}/500
                                </span>
                                <div className="flex gap-1">
                                  <button
                                    type="button"
                                    data-testid={`checklist-note-cancel-${c.id}`}
                                    className="text-[11px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200"
                                    onClick={closeInlineNoteEditor}
                                    disabled={
                                      updateCheckItemMutation.isPending
                                    }
                                  >
                                    Huỷ
                                  </button>
                                  <button
                                    type="button"
                                    data-testid={`checklist-note-save-${c.id}`}
                                    className="text-[11px] px-2 py-0.5 rounded bg-emerald-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-emerald-700"
                                    onClick={() => handleSaveInlineNote(c)}
                                    disabled={
                                      updateCheckItemMutation.isPending
                                    }
                                  >
                                    {updateCheckItemMutation.isPending
                                      ? "Đang lưu..."
                                      : "Lưu"}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : note ? (
                            <div
                              data-testid={`checklist-note-${c.id}`}
                              className="border-l-2 border-brand-400 pl-2"
                            >
                              <div className="flex items-start gap-1">
                                <div
                                  ref={(el) => {
                                    noteRefs.current[c.id] = el;
                                  }}
                                  className={`flex-1 min-w-0 text-[11px] italic text-gray-500 leading-relaxed break-words ${
                                    isNoteExpanded
                                      ? "whitespace-pre-wrap"
                                      : "line-clamp-1"
                                  } ${
                                    canInlineEditNote
                                      ? "cursor-text hover:bg-brand-50/40 rounded-sm"
                                      : showToggle
                                        ? "cursor-pointer"
                                        : ""
                                  }`}
                                  onClick={
                                    canInlineEditNote
                                      ? () => openInlineNoteEditor(c)
                                      : showToggle
                                        ? () => toggleNoteExpanded(c.id)
                                        : undefined
                                  }
                                  role={
                                    canInlineEditNote || showToggle
                                      ? "button"
                                      : undefined
                                  }
                                  tabIndex={
                                    canInlineEditNote || showToggle
                                      ? 0
                                      : undefined
                                  }
                                  onKeyDown={
                                    canInlineEditNote
                                      ? (e) => {
                                          if (
                                            e.key === "Enter" ||
                                            e.key === " "
                                          ) {
                                            e.preventDefault();
                                            openInlineNoteEditor(c);
                                          }
                                        }
                                      : showToggle
                                        ? (e) => {
                                            if (
                                              e.key === "Enter" ||
                                              e.key === " "
                                            ) {
                                              e.preventDefault();
                                              toggleNoteExpanded(c.id);
                                            }
                                          }
                                        : undefined
                                  }
                                  aria-label={
                                    canInlineEditNote
                                      ? "Nhấn để chỉnh sửa ghi chú"
                                      : showToggle
                                        ? isNoteExpanded
                                          ? "Thu gọn ghi chú"
                                          : "Xem đầy đủ ghi chú"
                                        : undefined
                                  }
                                  title={
                                    canInlineEditNote
                                      ? "Nhấn để chỉnh sửa ghi chú"
                                      : showToggle
                                        ? isNoteExpanded
                                          ? "Nhấn để thu gọn"
                                          : "Nhấn để mở rộng"
                                        : undefined
                                  }
                                >
                                  {note}
                                </div>
                                {showToggle && (
                                  <button
                                    type="button"
                                    data-testid={`checklist-note-toggle-${c.id}`}
                                    className="flex-shrink-0 text-gray-400 hover:text-gray-600 border-0 bg-transparent p-0 cursor-pointer focus:outline-none"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleNoteExpanded(c.id);
                                    }}
                                    aria-expanded={isNoteExpanded}
                                    aria-label={
                                      isNoteExpanded
                                        ? "Thu gọn ghi chú"
                                        : "Xem đầy đủ ghi chú"
                                    }
                                    title={
                                      isNoteExpanded
                                        ? "Nhấn để thu gọn"
                                        : "Nhấn để mở rộng"
                                    }
                                  >
                                    {isNoteExpanded ? (
                                      <ChevronUp className="h-3.5 w-3.5" />
                                    ) : (
                                      <ChevronDown className="h-3.5 w-3.5" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : canInlineEditNote ? (
                            <button
                              type="button"
                              data-testid={`checklist-note-add-${c.id}`}
                              onClick={() => openInlineNoteEditor(c)}
                              className="self-start border-0 bg-transparent p-0 text-[11px] italic text-emerald-700 hover:text-emerald-800 hover:underline focus:outline-none"
                            >
                              + Thêm ghi chú
                            </button>
                          ) : null}
                        </div>

                        {canEditStructure && (
                          <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition items-center">
                            <Edit2
                              data-testid={`checklist-edit-${c.id}`}
                              className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-emerald-600"
                              onClick={() => {
                                setEditingItem(c);
                                setNewLabel(c.label);
                                setNewNote((c.note ?? "").slice(0, 500));
                              }}
                            />

                            {deleteCheckItemMutation.isPending &&
                            deleteItemTarget?.id === c.id ? (
                              <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                            ) : (
                              <Trash2
                                data-testid={`checklist-delete-${c.id}`}
                                className="w-3.5 h-3.5 text-rose-500 cursor-pointer hover:text-rose-600"
                                onClick={() => setDeleteItemTarget(c)}
                              />
                            )}
                          </div>
                        )}
                      </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <span
                  className="text-[11px] text-gray-400"
                  data-testid="no-checklist-text"
                >
                  Không có checklist.
                </span>
                {canEditStructure && (
                  <span
                    data-testid="checklist-add-button-empty"
                    className="text-[11px] text-emerald-700 cursor-pointer hover:underline select-none"
                    onClick={() => {
                      setEditingItem({ id: "new", label: "", done: false });
                      setNewLabel("");
                      setNewNote("");
                    }}
                  >
                    + Thêm
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <div className="text-[11px] text-gray-400 whitespace-nowrap">
              {t.createdAt && (
                <>
                  {new Date(t.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  {formatTime(t.createdAt)}
                </>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                data-testid="task-log-button"
                onClick={() => onOpenTaskLog?.(t.id)}
                className="inline-flex items-center justify-center px-2 h-[26px] rounded-md border text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Nhật ký
              </button>

              {permissions?.canChangeToDoing && t.status.code === "todo" && (
                <button
                  data-testid="task-start-button"
                  disabled={
                    updateStatusMutation.isPending ||
                    sendMessageMutation.isPending
                  }
                  onClick={async () => {
                    try {
                      await updateStatusMutation.mutateAsync({
                        taskId: t.id,
                        status: "doing",
                      });

                      // Send system message about status change
                      const newStatusLabel = STATUS_LABELS_VI["doing"];
                      const messageContent = `${currentUserFullName} đã chuyển trạng thái công việc ${t.title} sang ${newStatusLabel}.`;

                      if (conversationId && t.messageId) {
                        try {
                          await sendMessageMutation.mutateAsync({
                            conversationId,
                            content: messageContent,
                            messageType: "SYS",
                            parentMessageId: t.messageId,
                          });
                        } catch (error) {
                          // Silently fail - don't show error to user
                        }
                      }
                    } catch (error) {
                      console.error("Failed to update status:", error);
                    }
                  }}
                  className="inline-flex items-center justify-center rounded-md border px-2 h-[26px] text-[11px] min-w-[52px] hover:bg-emerald-50 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ||
                  sendMessageMutation.isPending ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    "Bắt đầu"
                  )}
                </button>
              )}

              {permissions?.canChangeToNeedVerify &&
                t.status.code === "doing" &&
                !permissions?.canChangeToFinished && (
                  <button
                    data-testid="task-complete-button"
                    disabled={
                      updateStatusMutation.isPending ||
                      sendMessageMutation.isPending ||
                      (t.checklist &&
                        t.checklist.length > 0 &&
                        t.checklist.some((c) => !c.done))
                    }
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({
                          taskId: t.id,
                          status: "need_to_verified",
                        });

                        // Send system message about status change
                        const newStatusLabel =
                          STATUS_LABELS_VI["need_to_verified"];
                        const messageContent = `${currentUserFullName} đã chuyển trạng thái công việc ${t.title} sang ${newStatusLabel}.`;

                        if (conversationId && t.messageId) {
                          try {
                            await sendMessageMutation.mutateAsync({
                              conversationId,
                              content: messageContent,
                              messageType: "SYS",
                              parentMessageId: t.messageId,
                            });
                          } catch (error) {
                            // Silently fail - don't show error to user
                          }
                        }
                      } catch (error) {
                        console.error("Failed to update status:", error);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md border px-2 h-[26px] text-[11px] min-w-[60px] transition-all duration-200 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      t.checklist &&
                      t.checklist.length > 0 &&
                      t.checklist.some((c) => !c.done)
                        ? "Vui lòng hoàn thành tất cả checklist items trước"
                        : undefined
                    }
                  >
                    {updateStatusMutation.isPending ||
                    sendMessageMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Chờ duyệt"
                    )}
                  </button>
                )}

              {(permissions?.canChangeToFinished ||
                (isLeaderOfGroup &&
                  t.status.code === "need_to_verified")) &&
                (t.status.code === "doing" ||
                  t.status.code === "need_to_verified") && (
                  <button
                    data-testid="task-finish-button"
                    disabled={
                      updateStatusMutation.isPending ||
                      sendMessageMutation.isPending ||
                      (t.checklist &&
                        t.checklist.length > 0 &&
                        t.checklist.some((c) => !c.done))
                    }
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({
                          taskId: t.id,
                          status: "finished",
                        });

                        // Send system message about status change
                        const newStatusLabel = STATUS_LABELS_VI["finished"];
                        const messageContent = `${currentUserFullName} đã chuyển trạng thái công việc ${t.title} sang ${newStatusLabel}.`;

                        if (conversationId && t.messageId) {
                          try {
                            await sendMessageMutation.mutateAsync({
                              conversationId,
                              content: messageContent,
                              messageType: "SYS",
                              parentMessageId: t.messageId,
                            });
                          } catch (error) {
                            // Silently fail - don't show error to user
                          }
                        }
                      } catch (error) {
                        console.error("Failed to update status:", error);
                      }
                    }}
                    className="inline-flex items-center justify-center rounded-md border px-2 h-[26px] text-[11px] min-w-[60px] transition-all duration-200 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      t.checklist &&
                      t.checklist.length > 0 &&
                      t.checklist.some((c) => !c.done)
                        ? "Vui lòng hoàn thành tất cả checklist trước"
                        : undefined
                    }
                  >
                    {updateStatusMutation.isPending ||
                    sendMessageMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      "Hoàn tất"
                    )}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Checklist Item Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteItemTarget}
        onOpenChange={(open) => !open && setDeleteItemTarget(null)}
        title="Xác nhận xóa"
        description={`Bạn có chắc chắn muốn xóa mục "${deleteItemTarget?.label}" không?`}
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleDeleteChecklistItem}
        isLoading={deleteCheckItemMutation.isPending}
      />

      <style>
        {`
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.96); }
          to   { opacity: 1; transform: scale(1); }
        }
        .animate-fade-in {
          animation: fade-in 0.18s ease-out;
        }
      `}
      </style>
    </>
  );
};
