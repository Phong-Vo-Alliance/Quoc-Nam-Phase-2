import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// API integration imports
import { useQuickMessages } from "@/hooks/queries/useQuickMessages";
import { useCreateQuickMessage } from "@/hooks/mutations/useCreateQuickMessage";
import { useUpdateQuickMessage } from "@/hooks/mutations/useUpdateQuickMessage";
import { useDeleteQuickMessage } from "@/hooks/mutations/useDeleteQuickMessage";
import type { QuickMessage } from "@/types/quick-messages";

export const QuickMessageManager: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ open, onOpenChange }) => {
  // API hooks
  const { data: messages, isLoading, isError } = useQuickMessages();
  const { mutate: createMessage, isPending: isCreating } =
    useCreateQuickMessage();
  const { mutate: updateMessage, isPending: isUpdating } =
    useUpdateQuickMessage();
  const { mutate: deleteMessage, isPending: isDeleting } =
    useDeleteQuickMessage();

  // Local state
  const [editing, setEditing] = useState<QuickMessage | null>(null);
  const [key, setKey] = useState("");
  const [content, setContent] = useState("");
  const [keyError, setKeyError] = useState<string>("");
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [deletedId, setDeletedId] = useState<string | null>(null);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Loading state - prevent modal close when any operation is in progress
  const isAnyLoading = isCreating || isUpdating || isDeleting;

  // Validate key function
  const validateKey = (value: string): string => {
    if (!value) {
      return "Phím tắt không được để trống";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
      return "Chỉ cho phép chữ cái, số, gạch dưới (_) và gạch ngang (-)";
    }
    if (value.length > 50) {
      return "Phím tắt không được vượt quá 50 ký tự";
    }
    return "";
  };

  const resetForm = () => {
    setEditing(null);
    setKey("");
    setContent("");
    setKeyError("");
  };

  const handleSave = () => {
    if (!key || !content || keyError) return;

    if (editing) {
      // Update existing message
      updateMessage(
        {
          id: editing.id,
          payload: { key, content },
        },
        {
          onSuccess: (data) => {
            setHighlightedId(data.id);
            resetForm();
            // Reset highlight after animation
            setTimeout(() => setHighlightedId(null), 1500);
          },
        },
      );
    } else {
      // Create new message
      createMessage(
        { key, content },
        {
          onSuccess: (data) => {
            setHighlightedId(data.id);
            resetForm();
            // Reset highlight after animation
            setTimeout(() => setHighlightedId(null), 1500);
          },
        },
      );
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    if (!deleteTargetId) return;

    setDeletedId(deleteTargetId);

    deleteMessage(deleteTargetId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
        // Fade-out animation handled by CSS
        setTimeout(() => setDeletedId(null), 400);
      },
      onError: () => {
        // On error, don't remove the item
        setDeletedId(null);
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
      },
    });
  };

  const startEdit = (msg: QuickMessage) => {
    setEditing(msg);
    setKey(msg.key);
    setContent(msg.content);
    setKeyError(""); // Clear error when editing existing message
  };

  // Handle key change with validation
  const handleKeyChange = (value: string) => {
    setKey(value);
    const error = validateKey(value);
    setKeyError(error);
  };

  // Prevent closing modal when operations are in progress
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isAnyLoading) {
      // Don't allow closing
      return;
    }
    onOpenChange(newOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent
          className="max-w-[700px]"
          data-testid="quick-message-manager-modal"
          onPointerDownOutside={(e) => {
            // Prevent closing when clicking outside while loading
            if (isAnyLoading) {
              e.preventDefault();
            }
          }}
          onEscapeKeyDown={(e) => {
            // Prevent closing on escape while loading
            if (isAnyLoading) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Tin nhắn nhanh
            </DialogTitle>
            <p className="text-sm text-gray-500">
              Tạo phím tắt cho tin nhắn thường dùng. Gõ{" "}
              <span className="font-medium text-brand-600">/phimtat</span> trong
              chat để sử dụng.
            </p>
          </DialogHeader>

          {/* Danh sách tin nhắn */}
          <div className="rounded-lg border border-brand-200 bg-white p-4 shadow-sm">
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-1">
                Danh sách tin nhắn ({messages?.length || 0})
              </h4>
              <div className="border-b border-gray-200 mb-3" />
            </div>

            <div
              className="max-h-[240px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
              data-testid="quick-message-list"
            >
              {isLoading && (
                <div
                  className="flex items-center justify-center py-8"
                  data-testid="loading-skeleton"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
                  <span className="ml-2 text-sm text-gray-500">
                    Đang tải...
                  </span>
                </div>
              )}

              {isError && (
                <div
                  className="text-sm text-red-500 py-2"
                  data-testid="error-state"
                >
                  Không thể tải tin nhắn nhanh. Vui lòng thử lại.
                </div>
              )}

              {!isLoading && !isError && messages?.length === 0 && (
                <p
                  className="text-sm text-gray-400 italic py-2"
                  data-testid="empty-state"
                >
                  Chưa có tin nhắn nào.
                </p>
              )}

              {!isLoading &&
                !isError &&
                messages?.map((msg) => (
                  <div
                    key={msg.id}
                    data-testid={`quick-message-item-${msg.id}`}
                    className={cn(
                      "group relative mb-2 rounded-lg border border-transparent bg-gray-50 px-3 py-2 transition-all hover:border-brand-200 hover:bg-brand-50",
                      highlightedId === msg.id && "fade-highlight",
                      deletedId === msg.id && "fade-out",
                    )}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="inline-block text-xs font-medium text-brand-700 bg-brand-100 px-2 py-0.5 rounded-md w-fit mb-1">
                          /{msg.key}
                        </span>
                        <p className="text-sm text-gray-700 leading-snug">
                          {msg.content}
                        </p>
                      </div>

                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-3">
                        <Pencil
                          size={15}
                          className="cursor-pointer text-gray-500 hover:text-brand-600"
                          onClick={() => startEdit(msg)}
                          data-testid={`quick-message-edit-button-${msg.id}`}
                        />
                        <Trash2
                          size={15}
                          className="cursor-pointer text-gray-500 hover:text-rose-600"
                          onClick={() => handleDeleteClick(msg.id)}
                          data-testid={`quick-message-delete-button-${msg.id}`}
                        />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Form thêm/sửa */}
          <div className="mt-4 space-y-2">
            <div>
              <div className="relative">
                <span className="absolute left-3 inset-y-0 text-gray-400 font-medium pointer-events-none flex items-center">
                  /
                </span>
                <Input
                  value={key}
                  onChange={(e) => handleKeyChange(e.target.value)}
                  placeholder="Phím tắt (ví dụ: phimtat)"
                  className={cn(
                    "text-sm pl-9",
                    keyError && "border-red-500 focus-visible:ring-red-500",
                  )}
                  disabled={isAnyLoading}
                  data-testid="quick-message-keyword-input"
                />
              </div>
              {keyError ? (
                <p
                  className="text-xs text-red-500 mt-1"
                  data-testid="quick-message-key-error"
                >
                  {keyError}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  💡 Trong chat, gõ{" "}
                  <span className="font-medium text-brand-600">
                    /{key || "phimtat"}
                  </span>{" "}
                  để dùng phím tắt này
                </p>
              )}
            </div>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nội dung tin nhắn..."
              className="text-sm h-28"
              disabled={isAnyLoading}
              data-testid="quick-message-content-input"
            />
          </div>

          <DialogFooter className="mt-3 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isAnyLoading}
              data-testid="quick-message-cancel-button"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSave}
              disabled={!key || !content || !!keyError || isAnyLoading}
              data-testid={
                editing
                  ? "quick-message-save-button"
                  : "quick-message-create-button"
              }
            >
              {isAnyLoading && (
                <Loader2
                  className="mr-2 h-4 w-4 animate-spin"
                  data-testid="quick-message-loading-spinner"
                />
              )}
              {editing ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Xác nhận xóa"
        description="Bạn có chắc chắn muốn xóa tin nhắn nhanh này?"
        confirmText="Xóa"
        cancelText="Hủy"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </>
  );
};
