import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  Trash2,
  Circle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import { toast } from "sonner";
import { useTodoItems, useDoneTodayItems } from "@/hooks/queries/useTodoItems";
import {
  useCreateTodoItem,
  useUpdateTodoItem,
  useToggleTodoItem,
  useDeleteTodoItem,
} from "@/hooks/mutations/useTodoItemMutations";
import type { TodoItem } from "@/types/todo";

export const TodoListManager: React.FC<{
  open: boolean;
  onOpenChange: (v: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { data: activeTodos = [], isLoading: isLoadingActive } = useTodoItems({
    enabled: open,
  });
  const { data: completedToday = [], isLoading: isLoadingDoneToday } =
    useDoneTodayItems({ enabled: open });

  const createMutation = useCreateTodoItem();
  const updateMutation = useUpdateTodoItem();
  const toggleMutation = useToggleTodoItem();
  const deleteMutation = useDeleteTodoItem();

  const isMutating =
    createMutation.isPending ||
    updateMutation.isPending ||
    toggleMutation.isPending ||
    deleteMutation.isPending;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTitleError, setNewTitleError] = useState<string>("");
  const [newDescriptionError, setNewDescriptionError] = useState<string>("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editTitleError, setEditTitleError] = useState<string>("");
  const [editDescriptionError, setEditDescriptionError] = useState<string>("");
  const [showCompleted, setShowCompleted] = useState(true);

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const newTitleRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

  // Validate title function
  const validateTitle = (value: string): string => {
    if (!value.trim()) {
      return "Tiêu đề không được để trống";
    }
    if (value.length > 500) {
      return "Tiêu đề không được vượt quá 500 ký tự";
    }
    return "";
  };

  // Validate description function (optional field, only check max length)
  const validateDescription = (value: string): string => {
    if (value.length > 1000) {
      return "Chi tiết không được vượt quá 1000 ký tự";
    }
    return "";
  };

  // Handle title change for new todo with validation
  const handleNewTitleChange = (value: string) => {
    setNewTitle(value);
    const error = validateTitle(value);
    setNewTitleError(error);
  };

  // Handle description change for new todo with validation
  const handleNewDescriptionChange = (value: string) => {
    setNewDescription(value);
    const error = validateDescription(value);
    setNewDescriptionError(error);
  };

  // Handle title change for edit todo with validation
  const handleEditTitleChange = (value: string) => {
    setEditTitle(value);
    const error = validateTitle(value);
    setEditTitleError(error);
  };

  // Handle description change for edit todo with validation
  const handleEditDescriptionChange = (value: string) => {
    setEditDescription(value);
    const error = validateDescription(value);
    setEditDescriptionError(error);
  };

  useEffect(() => {
    if (isAddingNew && newTitleRef.current) {
      newTitleRef.current.focus();
    }
  }, [isAddingNew]);

  useEffect(() => {
    if (editingId !== null && editTitleRef.current) {
      editTitleRef.current.focus();
    }
  }, [editingId]);

  const handleAddNew = () => {
    setIsAddingNew(true);
    setNewTitle("");
    setNewDescription("");
    setNewTitleError("");
    setNewDescriptionError("");
  };

  const handleSaveNew = () => {
    const title = newTitle.trim();
    if (!title || newTitleError || newDescriptionError) {
      setIsAddingNew(false);
      return;
    }

    createMutation.mutate(
      { title, description: newDescription.trim() || undefined },
      {
        onSuccess: () => {
          setIsAddingNew(false);
          setNewTitle("");
          setNewDescription("");
          setNewTitleError("");
          setNewDescriptionError("");
        },
        onError: () => {
          toast.error("Không thể thêm công việc. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleCancelNew = () => {
    setIsAddingNew(false);
    setNewTitle("");
    setNewDescription("");
    setNewTitleError("");
    setNewDescriptionError("");
  };

  const handleStartEdit = (todo: TodoItem) => {
    if (todo.isCompleted) return;
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
    setEditTitleError(""); // Clear error when editing existing todo
    setEditDescriptionError(""); // Clear description error too
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    const title = editTitle.trim();
    if (!title || editTitleError || editDescriptionError) return;

    updateMutation.mutate(
      {
        id: editingId,
        data: { title, description: editDescription.trim() || undefined },
      },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditTitle("");
          setEditDescription("");
          setEditTitleError("");
          setEditDescriptionError("");
        },
        onError: () => {
          toast.error("Không thể cập nhật công việc. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
    setEditDescription("");
    setEditTitleError("");
    setEditDescriptionError("");
  };

  const handleToggleComplete = (todo: TodoItem) => {
    const newIsDone = !todo.isCompleted;

    toggleMutation.mutate(
      { id: todo.id, isDone: newIsDone },
      {
        onError: () => {
          toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        },
      },
    );
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (!deleteTargetId) return;

    deleteMutation.mutate(deleteTargetId, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
      },
      onError: () => {
        toast.error("Không thể xóa công việc. Vui lòng thử lại.");
        setShowDeleteConfirm(false);
        setDeleteTargetId(null);
      },
    });
  };

  const isLoading = isLoadingActive || isLoadingDoneToday;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[600px] h-[80vh] flex flex-col [&>button]:hidden"
        data-testid="todo-manager-dialog"
      >
        <DialogHeader className="flex-row justify-between items-center space-y-0">
          <DialogTitle className="text-xl font-semibold">
            Danh sách việc cần làm
          </DialogTitle>
          <DialogClose
            className="rounded-sm opacity-70 ring-offset-background transition-all hover:opacity-100 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            data-testid="todo-dialog-close-button"
          >
            <X className="h-5 w-5" />
            <span className="sr-only">Close</span>
          </DialogClose>
        </DialogHeader>

        {/* Loading overlay when mutating */}
        {isMutating && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 rounded-lg"
            data-testid="todo-mutating-overlay"
          >
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}

        <div
          className={cn(
            "flex-1 flex flex-col overflow-hidden",
            isMutating && "pointer-events-none",
          )}
        >
          {isLoading ? (
            <div
              className="flex items-center justify-center py-8"
              data-testid="todo-loading-state"
            >
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <>
              {/* Sticky Add New Section */}
              <div className="flex-shrink-0 border-b pb-3 mb-2 bg-white">
                {!isAddingNew ? (
                  <Button
                    onClick={handleAddNew}
                    disabled={isMutating}
                    className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium hover:no-underline hover:bg-green-50 rounded-md px-2 py-1 transition-colors"
                    variant="link"
                    data-testid="todo-add-new-button"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm công việc mới</span>
                  </Button>
                ) : (
                  <div className="rounded-lg border-brand-200 bg-brand-50 p-3">
                    <div className="space-y-2">
                      <div>
                        <Input
                          ref={newTitleRef}
                          value={newTitle}
                          onChange={(e) => handleNewTitleChange(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Escape") handleCancelNew();
                          }}
                          placeholder="Tiêu đề"
                          className={cn(
                            "text-sm",
                            newTitleError &&
                              "border-red-500 focus-visible:ring-red-500",
                          )}
                          disabled={isMutating}
                          data-testid="todo-new-title-input"
                        />
                        {newTitleError ? (
                          <p
                            className="text-xs text-red-500 mt-1"
                            data-testid="todo-new-title-error"
                          >
                            {newTitleError}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-500 mt-1">
                            💡 Tối đa 500 ký tự ({newTitle.length}/500)
                          </p>
                        )}
                      </div>
                      <div>
                        <Textarea
                          value={newDescription}
                          onChange={(e) =>
                            handleNewDescriptionChange(e.target.value)
                          }
                          placeholder="Chi tiết (không bắt buộc)"
                          className={cn(
                            "text-sm h-20",
                            newDescriptionError &&
                              "border-red-500 focus-visible:ring-red-500",
                          )}
                          disabled={isMutating}
                          data-testid="todo-new-description-input"
                        />
                        {newDescriptionError && (
                          <p
                            className="text-xs text-red-500 mt-1"
                            data-testid="todo-new-description-error"
                          >
                            {newDescriptionError}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelNew}
                          disabled={isMutating}
                          data-testid="todo-new-cancel-button"
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNew}
                          disabled={
                            !newTitle.trim() ||
                            !!newTitleError ||
                            !!newDescriptionError ||
                            isMutating
                          }
                          data-testid="todo-new-save-button"
                        >
                          {isMutating && (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          )}
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Scrollable Active Todos */}
              <div className="flex-1 overflow-y-auto pr-2 scroll-smooth">
                <div className="space-y-2" data-testid="todo-active-list">
                  {activeTodos.length === 0 && !isAddingNew && (
                    <p
                      className="text-sm text-gray-400 italic py-4 text-center"
                      data-testid="todo-empty-state"
                    >
                      Chưa có công việc nào
                    </p>
                  )}

                  {activeTodos.map((todo) => {
                    const isEditing = editingId === todo.id;

                    return (
                      <div
                        key={todo.id}
                        className="group relative rounded-lg bg-white transition-[background-color,border-color] duration-200 ease-in-out hover:border-brand-200 hover:bg-brand-50"
                        data-testid={`todo-item-${todo.id}`}
                      >
                        <div className="flex py-2 px-1">
                          <IconButton
                            icon={<Circle className="h-5 w-5" />}
                            className="p-0 left-0 top-0 h-5 w-5 m-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                            title="Đánh dấu hoàn thành"
                            onClick={() => handleToggleComplete(todo)}
                            disabled={isMutating}
                            data-testid={`todo-complete-button-${todo.id}`}
                          />

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="space-y-2">
                                <div>
                                  <Input
                                    ref={editTitleRef}
                                    value={editTitle}
                                    onChange={(e) =>
                                      handleEditTitleChange(e.target.value)
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Escape")
                                        handleCancelEdit();
                                    }}
                                    placeholder="Tiêu đề"
                                    className={cn(
                                      "text-sm font-medium",
                                      editTitleError &&
                                        "border-red-500 focus-visible:ring-red-500",
                                    )}
                                    disabled={isMutating}
                                    data-testid={`todo-edit-title-input-${editingId}`}
                                  />
                                  {editTitleError ? (
                                    <p
                                      className="text-xs text-red-500 mt-1"
                                      data-testid={`todo-edit-title-error-${editingId}`}
                                    >
                                      {editTitleError}
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500 mt-1">
                                      💡 Tối đa 500 ký tự ({editTitle.length}
                                      /500)
                                    </p>
                                  )}
                                </div>
                                <div>
                                  <Textarea
                                    value={editDescription}
                                    onChange={(e) =>
                                      handleEditDescriptionChange(
                                        e.target.value,
                                      )
                                    }
                                    placeholder="Chi tiết (không bắt buộc)"
                                    className={cn(
                                      "text-sm h-16",
                                      editDescriptionError &&
                                        "border-red-500 focus-visible:ring-red-500",
                                    )}
                                    disabled={isMutating}
                                    data-testid={`todo-edit-description-input-${editingId}`}
                                  />
                                  {editDescriptionError && (
                                    <p
                                      className="text-xs text-red-500 mt-1"
                                      data-testid={`todo-edit-description-error-${editingId}`}
                                    >
                                      {editDescriptionError}
                                    </p>
                                  )}
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={isMutating}
                                    data-testid={`todo-edit-cancel-button-${editingId}`}
                                  >
                                    Hủy
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={handleSaveEdit}
                                    disabled={
                                      !editTitle.trim() ||
                                      !!editTitleError ||
                                      !!editDescriptionError ||
                                      isMutating
                                    }
                                    data-testid={`todo-edit-save-button-${editingId}`}
                                  >
                                    {isMutating && (
                                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                    )}
                                    Lưu
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div
                                onClick={() =>
                                  !isMutating && handleStartEdit(todo)
                                }
                                className={cn(
                                  "cursor-pointer",
                                  isMutating && "cursor-not-allowed opacity-50",
                                )}
                              >
                                <div
                                  className="text-sm font-medium text-gray-800 break-words"
                                  data-testid={`todo-title-${todo.id}`}
                                >
                                  {todo.title || "Chưa có tiêu đề"}
                                </div>
                                {todo.description && (
                                  <div
                                    className="text-sm text-gray-600 mt-1 break-words"
                                    data-testid={`todo-description-${todo.id}`}
                                  >
                                    {todo.description}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <IconButton
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            className="bg-transparent h-6 w-6 flex-shrink-0 opacity-0 border-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out hover:bg-transparent hover:border-0"
                            title="Xóa công việc"
                            onClick={() => handleDeleteClick(todo.id)}
                            disabled={isMutating}
                            data-testid={`todo-delete-button-${todo.id}`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sticky Completed Today Button */}
              {completedToday.length > 0 && (
                <div className="flex-shrink-0 border-t pt-3 pb-2 bg-white">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors"
                    data-testid="todo-completed-toggle-button"
                  >
                    <span>Đã hoàn thành hôm nay ({completedToday.length})</span>
                    {showCompleted ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}

              {/* Scrollable Completed Todos */}
              {completedToday.length > 0 && showCompleted && (
                <div className="flex-shrink-0 max-h-[30vh] overflow-y-auto pr-2 scroll-smooth">
                  <div className="space-y-2" data-testid="todo-completed-list">
                    {completedToday.map((todo) => (
                      <div
                        key={todo.id}
                        className="group relative rounded-lg bg-gray-50 transition-[background-color] duration-200 ease-in-out"
                        data-testid={`todo-completed-item-${todo.id}`}
                      >
                        <div className="flex gap-3 py-2 px-1">
                          <IconButton
                            icon={
                              <CheckCircle2 className="h-5 w-5 text-brand-600" />
                            }
                            className="p-0 left-0 top-0 h-5 w-5 m-1 text-brand-600"
                            title="Đã hoàn thành"
                            onClick={() => handleToggleComplete(todo)}
                            disabled={isMutating}
                            data-testid={`todo-completed-uncomplete-button-${todo.id}`}
                          />

                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-500 line-through break-words">
                              {todo.title || "Chưa có tiêu đề"}
                            </div>
                            {todo.description && (
                              <div className="text-sm text-gray-400 line-through mt-1 break-words">
                                {todo.description}
                              </div>
                            )}
                          </div>

                          <IconButton
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ease-in-out hover:bg-transparent hover:border-0"
                            title="Xóa công việc"
                            onClick={() => handleDeleteClick(todo.id)}
                            disabled={isMutating}
                            data-testid={`todo-completed-delete-button-${todo.id}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>

    {/* Delete Confirmation Dialog */}
    <ConfirmDialog
      open={showDeleteConfirm}
      onOpenChange={setShowDeleteConfirm}
      title="Xác nhận xóa"
      description="Bạn có chắc chắn muốn xóa công việc này?"
      confirmText="Xóa"
      cancelText="Hủy"
      variant="danger"
      onConfirm={handleConfirmDelete}
      isLoading={deleteMutation.isPending}
    />
    </>
  );
};
