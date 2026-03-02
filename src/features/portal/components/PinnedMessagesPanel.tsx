import React from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Star, StarOff, Quote, ImageIcon, File, Loader2 } from "lucide-react";
import FileIcon from "@/components/files/FileIcon";
import MessageImage from "@/features/portal/workspace/MessageImage";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { PinnedMessage, FileAttachment } from "@/features/portal/types";
import { useStarredMessages } from "@/hooks/queries/useStarredMessages";
import { useUnstarMessage } from "@/hooks/mutations/useStarMessage";
import { useCategories } from "@/hooks/queries/useCategories"; // Fetch categories (contains conversations)
import {
  useDirectMessages,
  flattenDirectMessages,
} from "@/hooks/queries/useDirectMessages"; // Fetch DM conversations
import type { StarredMessageDto } from "@/types/pinned_and_starred";

/**
 * Format file size from bytes to human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Get file extension from filename or MIME type
 */

function getFileExtension(fileName?: string, contentType?: string): string {
  // Try to get from filename first
  if (fileName) {
    const match = fileName.match(/\.(\w+)$/);
    if (match) return `.${match[1].toLowerCase()}`;
  }

  // Fallback to MIME type mapping
  if (contentType) {
    const mimeMap: Record<string, string> = {
      "application/pdf": ".pdf",
      "application/msword": ".doc",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        ".docx",
      "application/vnd.ms-excel": ".xls",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        ".xlsx",
      "application/vnd.ms-powerpoint": ".ppt",
      "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        ".pptx",
    };
    return mimeMap[contentType] || "";
  }

  return "";
}

interface Props {
  onClose: () => void;
  /**
   * Handler when user clicks on a starred message.
   * Parent should implement scroll-to-message logic (similar to handleScrollToMessage in ChatMainContainer).
   * @param messageDto - StarredMessageDto to scroll to
   */
  onOpenChat: (messageDto: StarredMessageDto) => void;
  // [PHASE2-REMOVED] onUnpin prop removed - using useUnstarMessage mutation instead
  onPreview?: (file: FileAttachment) => void;
}

export const PinnedMessagesPanel: React.FC<Props> = ({
  onClose,
  onOpenChat,
  // [PHASE2-REMOVED] onUnpin,
  onPreview,
}) => {
  // Fetch categories data (contains all conversations)
  const { data: categoriesData } = useCategories();

  // 🆕 Fetch DM conversations for starred message lookup
  const directMessagesQuery = useDirectMessages();
  const directConversations = React.useMemo(
    () => flattenDirectMessages(directMessagesQuery.data),
    [directMessagesQuery.data],
  );

  // Fetch ALL starred messages from API (không filter theo conversation)
  const {
    data: starredData,
    isLoading,
    isError,
    error,
    refetch,
  } = useStarredMessages({
    limit: 50, // Từ requirement decision #2
  });

  // Unstar message mutation
  const unstarMutation = useUnstarMessage({
    onSuccess: () => {
      // Cache will be automatically invalidated by the mutation
      // No need to manually refetch
    },
  });

  // Transform StarredMessageDto[] sang PinnedMessage[] format
  const messages = React.useMemo(() => {
    if (!starredData) return [];

    // 🆕 Sort by message sentAt (newest first) instead of starred time
    const sortedData = [...starredData].sort((a, b) => {
      const timeA = new Date(a.message.sentAt).getTime();
      const timeB = new Date(b.message.sentAt).getTime();
      return timeB - timeA; // Newest first
    });

    return sortedData.map((starred: StarredMessageDto): PinnedMessage => {
      const msg = starred.message;

      // 🆕 First check if it's a DM conversation
      const dmConversation = directConversations.find(
        (dm) => dm.id === msg.conversationId,
      );

      // Find category and conversation info by conversationId (for GRP)
      const category = categoriesData?.find((cat) =>
        cat.conversations?.some(
          (conv) => conv.conversationId === msg.conversationId,
        ),
      );
      const conversation = category?.conversations?.find(
        (conv) => conv.conversationId === msg.conversationId,
      );

      // Determine message type based on contentType
      let messageType: "text" | "image" | "file" = "text";
      if (msg.contentType === "IMG") messageType = "image";
      else if (msg.contentType === "FILE" || msg.contentType === "VID")
        messageType = "file";
      // SYS và TASK messages hiển thị dạng text

      // 🆕 DM: Show "Tin nhắn cá nhân với [name]" instead of Category • Conversation
      const isDM = !!dmConversation;
      const groupName = isDM
        ? `Tin nhắn cá nhân với ${dmConversation.name}`
        : category?.name || "[Category]";
      const workTypeName = isDM
        ? undefined // No workTypeName for DM
        : conversation?.conversationName || "[Conversation]";

      return {
        id: msg.id,
        sender: msg.senderFullName || msg.senderName || "Unknown",
        content: msg.content || "",
        time: msg.sentAt,
        type: messageType,
        groupName, // Category name or "Tin nhắn cá nhân với [name]"
        groupId: isDM ? undefined : category?.id, // Category ID (not for DM)
        workTypeName, // Conversation name (undefined for DM)
        workTypeId: isDM ? undefined : conversation?.conversationId, // Conversation ID (not for DM)
        chatId: msg.conversationId, // Add chatId for navigation
        fileInfo: msg.attachments?.[0]
          ? {
              id: msg.attachments[0].fileId || "",
              name: msg.attachments[0].fileName || "file",
              url: msg.attachments[0].fileId || "",
              type: msg.attachments[0].contentType?.startsWith("image/")
                ? "image"
                : "other",
              size: msg.attachments[0].fileSize?.toString(),
            }
          : undefined,
      };
    });
  }, [starredData, categoriesData, directConversations]);
  const grouped = React.useMemo(() => {
    const groups: Record<string, PinnedMessage[]> = {};
    messages.forEach((m: PinnedMessage) => {
      let dateObj = new Date(m.time);

      // Nếu không phải ngày hợp lệ → fallback về hôm nay
      if (isNaN(dateObj.getTime())) {
        dateObj = new Date();
      }

      // toISOString luôn an toàn
      const dateKey = dateObj.toISOString().split("T")[0];

      // group theo key này
      groups[dateKey] = groups[dateKey] ? [...groups[dateKey], m] : [m];
    });
    return groups;
  }, [messages]);

  const hasMessages = messages.length > 0;
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  return (
    <aside className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-y-auto min-h-0">
      <div className="border-b border-gray-200 p-3">
        <div className="mt-3 flex items-center gap-2">
          <Input placeholder="Tìm kiếm" className="h-9 text-sm" />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="font-medium">Tin Đánh Dấu (Tất cả)</div>
      </div>

      {/* Body */}
      <ScrollArea className="flex-1 py-3">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-16">
            <Loader2 className="h-8 w-8 text-brand-500 animate-spin mb-3" />
            <p className="text-sm">Đang tải tin đánh dấu...</p>
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-16">
            <p className="text-sm text-red-500 mb-3">Không thể tải tin nhắn</p>
            <p className="text-xs text-gray-400 mb-4">
              {error?.message || "Đã có lỗi xảy ra"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="gap-2"
            >
              ⟳ Thử lại
            </Button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && !hasMessages ? (
          <div className="flex flex-col items-center justify-center text-center text-gray-500 mt-16">
            <Star className="h-12 w-12 text-brand-400 mb-3" />
            <p className="text-sm max-w-[220px]">
              Đánh dấu tin nhắn để có thể tìm lại một cách nhanh chóng. Các tin
              nhắn được đánh dấu sẽ xuất hiện ở đây.
            </p>
          </div>
        ) : null}

        {/* Messages List */}
        {!isLoading && !isError && hasMessages ? (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, msgs]) => (
              <div key={date}>
                <p className="text-xs text-gray-500 font-medium mb-1 px-3">
                  {date === today
                    ? "Hôm nay"
                    : date === yesterday
                      ? "Hôm qua"
                      : new Date(date).toLocaleDateString("vi-VN")}
                </p>
                <div>
                  {msgs.map((msg) => {
                    // SAFE PARSE
                    const dt = new Date(msg.time);
                    const isValid = !isNaN(dt.getTime());
                    const displayDate = isValid
                      ? dt.toLocaleDateString("vi-VN")
                      : "";
                    const displayTime = isValid
                      ? dt.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "";

                    return (
                      <div
                        key={msg.id}
                        onClick={() => {
                          // Find the original StarredMessageDto from starredData
                          const originalStarred = starredData?.find(
                            (starred) => starred.messageId === msg.id,
                          );

                          if (originalStarred) {
                            // Pass the full StarredMessageDto to parent for handleScrollToMessage
                            onOpenChat(originalStarred);
                          } else {
                            console.warn(
                              "Could not find original StarredMessageDto for message:",
                              msg.id,
                            );
                          }

                          // 🐛 FIX (ui-improvements-20260205): Keep panel open
                          // User wants to be able to click multiple messages without panel closing
                          // onClose();
                        }}
                        className="group relative cursor-pointer border-b border-brand-200 hover:bg-brand-50 transition-all p-3 pr-8" // pr-8 để tránh icon tràn
                      >
                        {/* Star icon top-right */}
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
                                onClick={(e) => {
                                  e.stopPropagation(); // không kích hoạt onOpenChat
                                  // Call API to unstar message - pass conversationId to invalidate messages cache
                                  unstarMutation.mutate({
                                    messageId: msg.id,
                                    conversationId: msg.chatId,
                                  });
                                }}
                              >
                                <StarOff
                                  size={17}
                                  className="text-brand-500 hover:text-rose-500 cursor-pointer transition-colors"
                                />
                              </div>
                            </TooltipTrigger>
                            <TooltipContent
                              side="left"
                              className="bg-brand-600 text-white text-xs px-2 py-1 rounded"
                            >
                              Bỏ đánh dấu tin nhắn
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>

                        {/* Nội dung chính */}
                        <div className="text-sm text-gray-800">
                          <span className="font-medium">
                            {msg.sender}{" "}
                            <span className="text-xs text-gray-500">
                              {isValid ? `- ${displayTime} ${displayDate}` : ""}
                            </span>
                          </span>
                          {/* Tin nhắn có hình ảnh */}
                          {msg.fileInfo && msg.fileInfo.type === "image" && (
                            <div className="mt-2 max-w-[200px]">
                              <MessageImage
                                fileId={msg.fileInfo.url}
                                fileName={msg.fileInfo.name || "image"}
                                isInGrid={false}
                                forceLoad={false}
                                onPreviewClick={(fileId) => {
                                  if (onPreview && msg.fileInfo) {
                                    onPreview({
                                      id: msg.fileInfo.id,
                                      name: msg.fileInfo.name || "image",
                                      url: msg.fileInfo.url,
                                      type: msg.fileInfo.type,
                                      size: msg.fileInfo.size,
                                    });
                                  }
                                }}
                              />
                            </div>
                          )}

                          {/* Tin nhắn có file */}
                          {msg.fileInfo && msg.fileInfo.type !== "image" && (
                            <div
                              className={cn(
                                "mt-2 flex items-center gap-3 cursor-pointer hover:bg-gray-50 transition-colors rounded-md p-2 border border-gray-200 min-w-0 max-w-full",
                              )}
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                                if (onPreview && msg.fileInfo) {
                                  onPreview({
                                    id: msg.fileInfo.id,
                                    name: msg.fileInfo.name,
                                    url: msg.fileInfo.url,
                                    type: msg.fileInfo.type,
                                    size: msg.fileInfo.size,
                                  });
                                }
                              }}
                            >
                              {/* Icon container */}
                              <div className="bg-white rounded-lg p-2 shadow-sm flex-shrink-0">
                                <FileIcon
                                  contentType="application/octet-stream"
                                  size="sm"
                                />
                              </div>
                              <div className="flex-1 min-w-0 overflow-hidden">
                                <p className="text-xs font-medium truncate">
                                  {msg.fileInfo.name || "File"}
                                </p>
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 flex-wrap">
                                  {msg.fileInfo.size && (
                                    <span>
                                      {formatFileSize(
                                        parseInt(msg.fileInfo.size),
                                      )}
                                    </span>
                                  )}
                                  {getFileExtension(msg.fileInfo.name) && (
                                    <>
                                      {msg.fileInfo.size && <span>•</span>}
                                      <span className="font-medium uppercase">
                                        {getFileExtension(msg.fileInfo.name)}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Tin nhắn text thuần */}
                          {msg.type === "text" && (
                            <div className="mt-1 text-[13px] text-gray-700">
                              {msg.content?.slice(0, 100)}
                              {msg.content && msg.content.length > 100
                                ? "…"
                                : ""}
                            </div>
                          )}

                          <div className="mt-2 text-[11px] text-gray-500">
                            {msg.groupName}{" "}
                            {msg.workTypeName ? ` • ${msg.workTypeName}` : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </ScrollArea>
    </aside>
  );
};
