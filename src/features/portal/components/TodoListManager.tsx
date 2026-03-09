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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [showCompleted, setShowCompleted] = useState(true);

  const newTitleRef = useRef<HTMLInputElement>(null);
  const editTitleRef = useRef<HTMLInputElement>(null);

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
  };

  const handleSaveNew = () => {
    const title = newTitle.trim();
    if (!title) {
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
  };

  const handleStartEdit = (todo: TodoItem) => {
    if (todo.isCompleted) return;
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || "");
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    const title = editTitle.trim();
    if (!title) return;

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

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onError: () => {
        toast.error("Không thể xóa công việc. Vui lòng thử lại.");
      },
    });
  };

  const isLoading = isLoadingActive || isLoadingDoneToday;

  return (
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
                      <Input
                        ref={newTitleRef}
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") handleCancelNew();
                        }}
                        placeholder="Tiêu đề"
                        className="text-sm"
                        disabled={isMutating}
                        data-testid="todo-new-title-input"
                      />
                      <Textarea
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                        placeholder="Chi tiết"
                        className="text-sm h-20"
                        disabled={isMutating}
                        data-testid="todo-new-description-input"
                      />
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
                          disabled={!newTitle.trim() || isMutating}
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
                                <Input
                                  ref={editTitleRef}
                                  value={editTitle}
                                  onChange={(e) => setEditTitle(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Escape") handleCancelEdit();
                                  }}
                                  placeholder="Tiêu đề"
                                  className="text-sm font-medium"
                                  disabled={isMutating}
                                  data-testid={`todo-edit-title-input-${editingId}`}
                                />
                                <Textarea
                                  value={editDescription}
                                  onChange={(e) =>
                                    setEditDescription(e.target.value)
                                  }
                                  placeholder="Chi tiết"
                                  className="text-sm h-16"
                                  disabled={isMutating}
                                  data-testid={`todo-edit-description-input-${editingId}`}
                                />
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
                                    disabled={!editTitle.trim() || isMutating}
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
                            onClick={() => handleDelete(todo.id)}
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
                            onClick={() => handleDelete(todo.id)}
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
  );
};
