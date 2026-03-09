import React, { useState, useRef, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Circle, CheckCircle2, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
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
  const { data: activeTodos = [], isLoading: isLoadingActive } = useTodoItems({ enabled: open });
  const { data: completedToday = [], isLoading: isLoadingDoneToday } = useDoneTodayItems({ enabled: open });

  const createMutation = useCreateTodoItem();
  const updateMutation = useUpdateTodoItem();
  const toggleMutation = useToggleTodoItem();
  const deleteMutation = useDeleteTodoItem();

  const isToggling = toggleMutation.isPending;

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDetail, setEditDetail] = useState("");
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
    setNewDetail("");
  };

  const handleSaveNew = () => {
    const title = newTitle.trim();
    if (!title) {
      setIsAddingNew(false);
      return;
    }

    createMutation.mutate(
      { title, detail: newDetail.trim() || undefined },
      {
        onSuccess: () => {
          setIsAddingNew(false);
          setNewTitle("");
          setNewDetail("");
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
    setNewDetail("");
  };

  const handleStartEdit = (todo: TodoItem) => {
    if (todo.isCompleted) return;
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDetail(todo.detail || "");
  };

  const handleSaveEdit = () => {
    if (editingId === null) return;
    const title = editTitle.trim();
    if (!title) return;

    updateMutation.mutate(
      { id: editingId, data: { title, detail: editDetail.trim() || undefined } },
      {
        onSuccess: () => {
          setEditingId(null);
          setEditTitle("");
          setEditDetail("");
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
    setEditDetail("");
  };

  const handleToggleComplete = (id: string) => {
    toggleMutation.mutate(id, {
      onError: () => {
        toast.error("Không thể cập nhật trạng thái. Vui lòng thử lại.");
      },
    });
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
      <DialogContent className="max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Danh Sách Việc Cần Làm
          </DialogTitle>
        </DialogHeader>

        {/* Loading overlay when toggling */}
        {isToggling && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        )}

        <div className={cn("flex-1 overflow-y-auto pr-2", isToggling && "pointer-events-none")}>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <>
              {/* Add New */}
              <div className="mb-4">
                {!isAddingNew ? (
                  <Button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 text-brand-600 hover:text-brand-700 text-sm font-medium"
                    variant="link"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Thêm công việc mới</span>
                  </Button>
                ) : (
                  <div className="mb-3 rounded-lg border-brand-200 bg-brand-50 p-3">
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
                        disabled={createMutation.isPending}
                      />
                      <Textarea
                        value={newDetail}
                        onChange={(e) => setNewDetail(e.target.value)}
                        placeholder="Chi tiết"
                        className="text-sm h-20"
                        disabled={createMutation.isPending}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelNew}
                          disabled={createMutation.isPending}
                        >
                          Hủy
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNew}
                          disabled={!newTitle.trim() || createMutation.isPending}
                        >
                          {createMutation.isPending && (
                            <Loader2 className="h-3 w-3 animate-spin mr-1" />
                          )}
                          Lưu
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Todos */}
              <div className="space-y-2">
                {activeTodos.length === 0 && !isAddingNew && (
                  <p className="text-sm text-gray-400 italic py-4 text-center">
                    Chưa có công việc nào
                  </p>
                )}

                {activeTodos.map((todo) => {
                  const isEditing = editingId === todo.id;

                  return (
                    <div
                      key={todo.id}
                      className="group relative rounded-lg bg-white transition-all hover:border-brand-200 hover:bg-brand-50"
                    >
                      <div className="flex">
                        <IconButton
                          icon={<Circle className="h-5 w-5" />}
                          className="left-0 top-0 h-5 w-5 m-1 text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Đánh dấu hoàn thành"
                          onClick={() => handleToggleComplete(todo.id)}
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
                                disabled={updateMutation.isPending}
                              />
                              <Textarea
                                value={editDetail}
                                onChange={(e) => setEditDetail(e.target.value)}
                                placeholder="Chi tiết"
                                className="text-sm h-16"
                                disabled={updateMutation.isPending}
                              />
                              <div className="flex justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={handleCancelEdit}
                                  disabled={updateMutation.isPending}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  size="sm"
                                  onClick={handleSaveEdit}
                                  disabled={!editTitle.trim() || updateMutation.isPending}
                                >
                                  {updateMutation.isPending && (
                                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                                  )}
                                  Lưu
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div onClick={() => handleStartEdit(todo)} className="cursor-pointer">
                              <div className="text-sm font-medium text-gray-800 break-words">
                                {todo.title || "Chưa có tiêu đề"}
                              </div>
                              {todo.detail && (
                                <div className="text-sm text-gray-600 mt-1 break-words">
                                  {todo.detail}
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <IconButton
                          icon={<Trash2 className="h-3.5 w-3.5" />}
                          className="h-6 w-6 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                          title="Xóa công việc"
                          onClick={() => handleDelete(todo.id)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Completed Today Section */}
              {completedToday.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-brand-600 transition-colors mb-2"
                  >
                    <span>Đã hoàn thành hôm nay ({completedToday.length})</span>
                    {showCompleted ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>

                  {showCompleted && (
                    <div className="space-y-2 mt-3">
                      {completedToday.map((todo) => (
                        <div
                          key={todo.id}
                          className="group relative rounded-lg bg-gray-50 transition-all"
                        >
                          <div className="flex gap-3">
                            <IconButton
                              icon={<CheckCircle2 className="h-5 w-5 text-brand-600" />}
                              className="left-0 top-0 h-5 w-5 m-1 text-brand-600"
                              title="Đã hoàn thành"
                              onClick={() => handleToggleComplete(todo.id)}
                            />

                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-500 line-through break-words">
                                {todo.title || "Chưa có tiêu đề"}
                              </div>
                              {todo.detail && (
                                <div className="text-sm text-gray-400 line-through mt-1 break-words">
                                  {todo.detail}
                                </div>
                              )}
                            </div>

                            <IconButton
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
                              title="Xóa công việc"
                              onClick={() => handleDelete(todo.id)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
