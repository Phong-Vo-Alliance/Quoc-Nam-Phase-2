/**
 * ConfirmedInfoTransferSheet
 * Sheet component for transferring confirmed information to another conversation and creating a task
 * Features:
 * - Select target category (Nhóm)
 * - Select target conversation within category
 * - Select assignee from conversation members (filtered by department)
 * - Send message and create task with the selected assignee
 * - Navigate to target conversation after success
 */

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Loader2,
  ArrowRight,
  Briefcase,
  Users,
  User,
  AlertCircle,
} from "lucide-react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCategories } from "@/hooks/queries/useCategories";
import { useCategoryConversations } from "@/hooks/queries/useCategoryConversations";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { sendMessage } from "@/api/messages.api";
import { useCreateTask } from "@/hooks/mutations/useCreateTask";
import { useLinkTaskToMessage } from "@/hooks/mutations/useLinkTaskToMessage";
import { useAuthStore } from "@/stores/authStore";
import { useConversationStore } from "@/stores/conversationStore";
import { taskKeys } from "@/hooks/queries/keys/taskKeys";
import { messageKeys } from "@/hooks/queries/keys/messageKeys";
import { informationConfirmedKeys } from "@/hooks/queries/keys/informationConfirmedKeys";
import { updateInformationConfirmed } from "@/api/information_confirmed.api";
import { toast } from "sonner";
import type { InformationConfirmedDto } from "@/types/information_confirmed";
import type { SendChatMessageRequest } from "@/types/messages";

interface Props {
  open: boolean;
  confirmedInfo?: InformationConfirmedDto;
  onClose: () => void;
  onConfirm: (payload: {
    confirmedInfoId: string;
    toCategoryId: string;
    toCategoryName: string;
    toConversationId: string;
    toConversationName: string;
    assignTo: string;
    messageContent: string;
  }) => void;
}

const DEFAULT_ERROR_MESSAGE = "Đã xảy ra lỗi. Vui lòng thử lại sau.";

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;
    return (
      data?.message || data?.detail || data?.title || DEFAULT_ERROR_MESSAGE
    );
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return DEFAULT_ERROR_MESSAGE;
}

function getTaskTitle(content?: string | null): string {
  if (!content) return "Task từ thông tin đã xác nhận";
  return content.substring(0, 100) + (content.length > 100 ? "..." : "");
}

export const ConfirmedInfoTransferSheet: React.FC<Props> = ({
  open,
  confirmedInfo,
  onClose,
}) => {
  const currentUser = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = React.useState("");
  const [selectedConversationId, setSelectedConversationId] =
    React.useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [inlineError, setInlineError] = React.useState<string | null>(null);
  const pendingMessageIdRef = React.useRef<string | null>(null);

  // Fetch categories
  const { data: categoriesData, isLoading: categoriesLoading } =
    useCategories();

  const categories = categoriesData || [];

  // Fetch conversations for selected category
  const { data: conversationsData, isLoading: conversationsLoading } =
    useCategoryConversations(selectedCategoryId, {
      enabled: !!selectedCategoryId && open,
    });

  const conversations = conversationsData || [];

  // Fetch members for selected conversation
  const {
    data: membersData,
    isLoading: membersLoading,
    isError: membersError,
  } = useConversationMembers({
    conversationId: selectedConversationId,
    enabled: !!selectedConversationId && open,
  });

  const members = membersData || [];

  // Filter members by department (including leader/self)
  // Use departmentId from UserDepartmentDto, not id (user-dept relationship ID)
  const currentUserDepartmentIds = React.useMemo(
    () => currentUser?.departments?.map((d) => d.departmentId) ?? [],
    [currentUser?.departments],
  );

  const filteredMembers = React.useMemo(() => {
    if (currentUserDepartmentIds.length === 0) return members;

    return members.filter((member) => {
      const memberDepartmentIds = member.departments?.map((d) => d.id) ?? [];
      return memberDepartmentIds.some((deptId) =>
        currentUserDepartmentIds.includes(deptId),
      );
    });
  }, [members, currentUserDepartmentIds]);

  // Mutations
  const sendMessageMutation = useMutation({
    mutationFn: (data: SendChatMessageRequest) => sendMessage(data),
  });

  // Link task to message mutation
  const linkTaskMutation = useLinkTaskToMessage({
    onSuccess: async () => {
      try {
        // Mark confirmed info as finished when task is successfully linked
        if (confirmedInfo?.id) {
          try {
            await updateInformationConfirmed(confirmedInfo.id, {
              isFinished: true,
            });
            queryClient.invalidateQueries({
              queryKey: informationConfirmedKeys.all,
            });
          } catch (error) {
            console.error(
              "Không thể cập nhật trạng thái thông tin đã xác nhận",
              error,
            );
          }
        }

        // Refresh linked tasks and messages — fire and forget (non-critical)
        if (selectedConversationId) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.linkedTasks(selectedConversationId),
          });
          queryClient.invalidateQueries({
            queryKey: messageKeys.conversation(selectedConversationId),
          });

          // Also refresh original conversation if different
          if (
            confirmedInfo?.conversationId &&
            confirmedInfo.conversationId !== selectedConversationId
          ) {
            queryClient.invalidateQueries({
              queryKey: messageKeys.conversation(confirmedInfo.conversationId),
            });
          }
        }

        const selectedAssignee = filteredMembers.find(
          (m) => m.userId === selectedAssigneeId,
        );

        toast.success(
          `Đã giao việc thành công cho ${selectedAssignee?.userInfo?.fullName || selectedAssignee?.userName}`,
        );

        // Send system message about task creation
        if (selectedConversationId) {
          try {
            const creatorName =
              currentUser?.fullName || currentUser?.identifier || "người dùng";
            const assigneeName =
              selectedAssignee?.userInfo?.fullName ||
              selectedAssignee?.userName ||
              "người dùng";

            const systemMessageData: SendChatMessageRequest = {
              conversationId: selectedConversationId,
              content: `Công việc "${getTaskTitle(confirmedInfo?.content)}" đã được tạo bởi ${creatorName} và giao cho ${assigneeName}`,
              messageType: "SYS",
            };
            await sendMessage(systemMessageData);
          } catch (error) {
            console.error("Failed to send system message:", error);
          }
        }
      } finally {
        setIsProcessing(false);
        onClose();
      }
    },
    onError: (error) => {
      if (selectedConversationId) {
        queryClient.invalidateQueries({
          queryKey: taskKeys.linkedTasks(selectedConversationId),
        });
      }
      const msg = `Công việc đã được tạo nhưng không thể liên kết với tin nhắn. ${getErrorMessage(error)}`;
      toast.error(msg);
      setIsProcessing(false);
      onClose();
    },
  });

  // Create task mutation
  const createTaskMutation = useCreateTask({
    onSuccess: async (createdTaskId) => {
      const messageId = pendingMessageIdRef.current;
      if (messageId && createdTaskId) {
        linkTaskMutation.mutate({
          messageId,
          taskId: createdTaskId,
        });
      } else {
        if (selectedConversationId) {
          queryClient.invalidateQueries({
            queryKey: taskKeys.linkedTasks(selectedConversationId),
          });
        }
        toast.success("Đã giao việc thành công");
        setInlineError(null);
        setIsProcessing(false);
        onClose();
      }
    },
    onError: (error) => {
      const apiMessage = getErrorMessage(error);
      const errorMessage =
        selectedConversationId !== confirmedInfo?.conversationId
          ? `Tin nhắn đã gửi nhưng không thể tạo công việc. ${apiMessage}`
          : apiMessage;
      toast.error(errorMessage);
      setInlineError(errorMessage);
      setIsProcessing(false);
    },
  });

  // Set default selections when sheet opens
  React.useEffect(() => {
    if (open && confirmedInfo) {
      const currentConversation =
        useConversationStore.getState().selectedConversation;

      setSelectedCategoryId(currentConversation?.categoryId || "");
      setSelectedConversationId(confirmedInfo.conversationId || "");
      setSelectedAssigneeId(currentUser?.id || "");
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    } else if (open) {
      setSelectedCategoryId("");
      setSelectedConversationId("");
      setSelectedAssigneeId("");
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    } else {
      setIsProcessing(false);
      setInlineError(null);
      pendingMessageIdRef.current = null;
    }
  }, [open, confirmedInfo, currentUser?.id]);

  // Clear conversation if it's not in the new conversations list when category changes
  React.useEffect(() => {
    if (selectedConversationId && conversations.length > 0) {
      const conversationExists = conversations.some(
        (c) => c.id === selectedConversationId,
      );
      if (!conversationExists) {
        setSelectedConversationId("");
        setSelectedAssigneeId("");
      }
    }
  }, [conversations, selectedConversationId]);

  // Clear assignee if it's not in the new members list when conversation changes
  React.useEffect(() => {
    if (membersLoading) return;

    if (selectedAssigneeId && filteredMembers.length > 0) {
      const assigneeExists = filteredMembers.some(
        (m) => m.userId === selectedAssigneeId,
      );
      if (!assigneeExists) {
        setSelectedAssigneeId("");
      }
    }
  }, [filteredMembers, selectedAssigneeId, membersLoading]);

  const handleSubmit = async () => {
    if (
      !confirmedInfo ||
      !selectedCategoryId ||
      !selectedConversationId ||
      !selectedAssigneeId
    ) {
      return;
    }

    const selectedCategory = categories.find(
      (c) => c.id === selectedCategoryId,
    );
    const selectedConversation = conversations.find(
      (c) => c.id === selectedConversationId,
    );
    const selectedAssignee = filteredMembers.find(
      (m) => m.userId === selectedAssigneeId,
    );

    if (!selectedCategory || !selectedConversation || !selectedAssignee) {
      return;
    }

    setIsProcessing(true);
    setInlineError(null);

    try {
      let messageId: string;

      const isNewConversation =
        selectedConversationId !== confirmedInfo.conversationId;

      if (isNewConversation) {
        const messageResponse = await sendMessageMutation.mutateAsync({
          conversationId: selectedConversationId,
          content: confirmedInfo.content || "",
          messageType: "TXT",
        });

        messageId = messageResponse.id;

        if (!messageId) {
          const msg =
            "Gửi tin nhắn thành công nhưng không nhận được ID tin nhắn";
          toast.error(msg);
          setInlineError(msg);
          setIsProcessing(false);
          return;
        }
      } else {
        messageId = confirmedInfo.messageId;
      }

      // Store messageId in ref for createTaskMutation callback
      pendingMessageIdRef.current = messageId;

      const taskTitle = getTaskTitle(confirmedInfo.content);

      await createTaskMutation.mutateAsync({
        title: taskTitle,
        description: confirmedInfo.content || "",
        priority: "low",
        assignTo: selectedAssigneeId,
        conversationId: selectedConversationId,
        messageId: messageId,
      });
    } catch (error) {
      const msg = sendMessageMutation.isError
        ? `Không thể gửi tin nhắn. ${getErrorMessage(error)}`
        : getErrorMessage(error);
      toast.error(msg);
      setInlineError(msg);
      setIsProcessing(false);
    }
  };

  const isSubmitting =
    isProcessing ||
    sendMessageMutation.isPending ||
    createTaskMutation.isPending ||
    linkTaskMutation.isPending;

  const isSubmitDisabled =
    !selectedCategoryId ||
    !selectedConversationId ||
    !selectedAssigneeId ||
    isSubmitting;

  return (
    <Sheet
      open={open}
      onOpenChange={() => {
        if (!isSubmitting) onClose();
      }}
    >
      <SheetContent side="right" className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Giao việc</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Display confirmed information */}
          <div>
            <Label className="text-sm text-gray-600">
              Nội dung đã xác nhận
            </Label>
            <div className="mt-1 p-3 rounded-md bg-gray-50 border text-sm max-h-40 overflow-y-auto break-words whitespace-pre-wrap">
              {confirmedInfo?.content || "Không có nội dung"}
            </div>
          </div>

          {/* Category Selection (Nhóm) */}
          <div>
            <Label className="text-sm text-gray-600 flex items-center gap-2">
              <Briefcase className="h-4 w-4" />
              Nhóm
            </Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={categoriesLoading || isSubmitting}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Chọn nhóm..." />
              </SelectTrigger>
              <SelectContent>
                {categoriesLoading ? (
                  <div className="flex items-center justify-center p-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="p-2 text-sm text-gray-500">
                    Không có nhóm nào
                  </div>
                ) : (
                  categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Conversation Selection */}
          {selectedCategoryId && (
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Loại việc
              </Label>
              {conversationsLoading ? (
                <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : conversations.length === 0 ? (
                <div className="mt-1 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
                  Không có loại việc nào trong nhóm này
                </div>
              ) : (
                <Select
                  value={selectedConversationId}
                  onValueChange={setSelectedConversationId}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn loại việc..." />
                  </SelectTrigger>
                  <SelectContent>
                    {conversations.map((conv) => (
                      <SelectItem key={conv.id} value={conv.id}>
                        {conv.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Assignee Selection */}
          {selectedConversationId && (
            <div>
              <Label className="text-sm text-gray-600 flex items-center gap-2">
                <User className="h-4 w-4" />
                Giao cho
              </Label>
              {membersLoading ? (
                <div className="mt-1 p-2 rounded-md bg-gray-100 border text-sm text-gray-700 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang tải danh sách...
                </div>
              ) : membersError ? (
                <div className="mt-1 p-2 rounded-md bg-red-50 border border-red-200 text-sm text-red-700">
                  ⚠️ Không thể tải danh sách thành viên
                </div>
              ) : filteredMembers.length === 0 ? (
                <div className="mt-1 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-sm text-gray-700">
                  Không có thành viên khả dụng
                </div>
              ) : (
                <Select
                  value={selectedAssigneeId}
                  onValueChange={setSelectedAssigneeId}
                  disabled={membersLoading || isSubmitting}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Chọn thành viên" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredMembers.map((member) => (
                      <SelectItem key={member.userId} value={member.userId}>
                        {member.userInfo?.fullName || member.userName}
                        {member.userId === currentUser?.id && " (Bạn)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}
        </div>

        {inlineError && (
          <div className="mt-4 p-3 rounded-md bg-red-50 border border-red-200 text-sm text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{inlineError}</span>
          </div>
        )}

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className="flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang giao việc...
              </>
            ) : (
              <>
                Giao việc <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
