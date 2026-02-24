import React from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Loader2,
} from "lucide-react";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import {
  useAddCheckItem,
  useToggleCheckItem,
  useUpdateCheckItem,
  useDeleteCheckItem,
  useUpdateTaskStatus,
} from "@/hooks/mutations";
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

  // Mutation hooks for API calls
  const addCheckItemMutation = useAddCheckItem();
  const toggleCheckItemMutation = useToggleCheckItem();
  const updateCheckItemMutation = useUpdateCheckItem();
  const deleteCheckItemMutation = useDeleteCheckItem();
  const updateStatusMutation = useUpdateTaskStatus();

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
  const canEditStructure = hasLeaderPermissions() && t.status.code === "todo";

  const permissions = t.permissions;

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
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-4 w-[300px] shadow-xl">
            <div className="text-sm font-semibold mb-2">
              {editingItem?.id === "new" ? "Thêm mục" : "Chỉnh sửa mục"}
            </div>

            <input
              className="w-full rounded border px-2 py-1 text-sm"
              value={newLabel}
              autoFocus
              onChange={(e) => setNewLabel(e.target.value)}
            />

            <div className="flex justify-end gap-2 mt-3">
              <button
                className="text-xs px-2 py-1 rounded bg-gray-100"
                onClick={() => setEditingItem(null)}
              >
                Huỷ
              </button>
              <button
                className="text-xs px-3 py-1 rounded bg-emerald-600 text-white"
                disabled={
                  addCheckItemMutation.isPending ||
                  updateCheckItemMutation.isPending ||
                  !newLabel.trim()
                }
                onClick={async () => {
                  if (!newLabel.trim()) return;

                  if (editingItem.id === "new") {
                    try {
                      await addCheckItemMutation.mutateAsync({
                        taskId: t.id,
                        content: newLabel.trim(),
                      });
                      setEditingItem(null);
                      setNewLabel("");
                      setOpen(true);
                    } catch (error) {
                      console.error("Failed to add checklist item:", error);
                    }
                  } else {
                    try {
                      await updateCheckItemMutation.mutateAsync({
                        taskId: t.id,
                        itemId: editingItem.id,
                        content: newLabel.trim(),
                      });
                      setEditingItem(null);
                      setNewLabel("");
                      setOpen(true);
                    } catch (error) {
                      console.error("Failed to update checklist item:", error);
                    }
                  }
                }}
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
                <span>Nhóm:</span>
                <span className="font-medium text-gray-700">
                  {displayLabel}
                </span>
              </span>

              {hasLeaderPermissions() && (
                <>
                  <span>•</span>
                  {t.status.code !== "need_to_verified" ? (
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
                      className="text-[11px] text-emerald-700 cursor-pointer hover:underline select-none"
                      onClick={() => {
                        setEditingItem({ id: "new", label: "", done: false });
                        setNewLabel("");
                        setOpen(true);
                      }}
                    >
                      + Thêm
                    </span>
                  )}
                </div>

                {open && (
                  <ul className="mt-2 space-y-1">
                    {sortedChecklist.map((c) => (
                      <li
                        key={c.id}
                        className="group flex items-center gap-2 text-[12px] leading-snug rounded-md px-2 py-1 hover:bg-gray-50 transition-all"
                      >
                        <button
                          type="button"
                          className={`
                            h-4 w-4 shrink-0 rounded-full
                            transition flex items-center justify-center
                            ${
                              c.done
                                ? "bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 cursor-pointer checklist-btn"
                                : "checklist-btn border-[1px] border-emerald-300 bg-white hover:shadow-[0_0_4px_rgba(16,185,129,0.35)]"
                            }
                          `}
                          disabled={toggleCheckItemMutation.isPending}
                          onClick={async () => {
                            try {
                              await toggleCheckItemMutation.mutateAsync({
                                taskId: t.id,
                                itemId: c.id,
                              });
                            } catch (error) {
                              console.error(
                                "Failed to toggle checklist item:",
                                error,
                              );
                            }
                          }}
                          title={
                            c.done ? "Nhấn để bỏ chọn" : "Nhấn để hoàn thành"
                          }
                        >
                          {c.done && <Check className="w-3 h-3" />}
                        </button>

                        <span
                          className={`
                            ${c.done ? "text-gray-400 line-through" : "text-gray-700"}
                            flex-1 cursor-pointer select-none
                            hover:text-emerald-600 transition-colors
                          `}
                          onClick={async () => {
                            if (toggleCheckItemMutation.isPending) return;
                            try {
                              await toggleCheckItemMutation.mutateAsync({
                                taskId: t.id,
                                itemId: c.id,
                              });
                            } catch (error) {
                              console.error(
                                "Failed to toggle checklist item:",
                                error,
                              );
                            }
                          }}
                          title={
                            c.done ? "Nhấn để bỏ chọn" : "Nhấn để hoàn thành"
                          }
                        >
                          {c.label}
                        </span>

                        {canEditStructure && (
                          <div className="flex gap-1 ml-auto opacity-0 group-hover:opacity-100 transition">
                            <Edit2
                              className="w-3.5 h-3.5 text-gray-500 cursor-pointer hover:text-emerald-600"
                              onClick={() => {
                                setEditingItem(c);
                                setNewLabel(c.label);
                              }}
                            />

                            {deleteCheckItemMutation.isPending ? (
                              <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin" />
                            ) : (
                              <Trash2
                                className="w-3.5 h-3.5 text-rose-500 cursor-pointer hover:text-rose-600"
                                onClick={async () => {
                                  if (!confirm(`Xóa mục "${c.label}"?`)) return;
                                  try {
                                    await deleteCheckItemMutation.mutateAsync({
                                      taskId: t.id,
                                      itemId: c.id,
                                    });
                                  } catch (error) {
                                    console.error(
                                      "Failed to delete checklist item:",
                                      error,
                                    );
                                  }
                                }}
                              />
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[11px] text-gray-400">
                  Không có checklist.
                </span>
                {canEditStructure && (
                  <span
                    className="text-[11px] text-emerald-700 cursor-pointer hover:underline select-none"
                    onClick={() => {
                      setEditingItem({ id: "new", label: "", done: false });
                      setNewLabel("");
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
                onClick={() => onOpenTaskLog?.(t.id)}
                className="px-2 py-1 rounded-md border text-[11px] border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                Nhật ký
              </button>

              {permissions?.canChangeToDoing && t.status.code === "todo" && (
                <button
                  disabled={updateStatusMutation.isPending}
                  onClick={async () => {
                    try {
                      await updateStatusMutation.mutateAsync({
                        taskId: t.id,
                        status: "doing",
                      });
                    } catch (error) {
                      console.error("Failed to update status:", error);
                    }
                  }}
                  className="rounded-md border px-2 py-0.5 text-[11px] hover:bg-emerald-50 disabled:opacity-50"
                >
                  {updateStatusMutation.isPending ? "..." : "Bắt đầu"}
                </button>
              )}

              {permissions?.canChangeToNeedVerify &&
                t.status.code === "doing" &&
                !permissions?.canChangeToFinished && (
                  <button
                    disabled={
                      updateStatusMutation.isPending ||
                      (t.checklist && t.checklist.some((c) => !c.done))
                    }
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({
                          taskId: t.id,
                          status: "need_to_verified",
                        });
                      } catch (error) {
                        console.error("Failed to update status:", error);
                      }
                    }}
                    className="rounded-md border px-2 py-1 text-[11px] min-w-[60px] text-center transition-all duration-200 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      t.checklist && t.checklist.some((c) => !c.done)
                        ? "Vui lòng hoàn thành tất cả checklist items trước"
                        : undefined
                    }
                  >
                    {updateStatusMutation.isPending ? "..." : "Hoàn tất"}
                  </button>
                )}

              {permissions?.canChangeToFinished &&
                (t.status.code === "doing" ||
                  t.status.code === "need_to_verified") && (
                  <button
                    disabled={
                      updateStatusMutation.isPending ||
                      (t.checklist && t.checklist.some((c) => !c.done))
                    }
                    onClick={async () => {
                      try {
                        await updateStatusMutation.mutateAsync({
                          taskId: t.id,
                          status: "finished",
                        });
                      } catch (error) {
                        console.error("Failed to update status:", error);
                      }
                    }}
                    className="rounded-md border px-2 py-1 text-[11px] min-w-[60px] text-center transition-all duration-200 hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      t.checklist && t.checklist.some((c) => !c.done)
                        ? "Vui lòng hoàn thành tất cả checklist trước"
                        : undefined
                    }
                  >
                    {updateStatusMutation.isPending ? "..." : "Hoàn tất"}
                  </button>
                )}
            </div>
          </div>
        </div>
      </div>

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
