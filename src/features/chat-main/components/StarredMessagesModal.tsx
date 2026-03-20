import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Star } from "lucide-react";
import type {
  PinnedMessageDto,
  StarredMessageDto,
} from "@/types/pinned_and_starred";

interface StarredMessagesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  starredMessages: StarredMessageDto[];
  conversationId: string;
  onScrollToMessage: (message: StarredMessageDto) => void;
  variant: "conversation" | "all";
  getConversationText?: (conversationId: string) => string;
}

export const StarredMessagesModal: React.FC<StarredMessagesModalProps> = ({
  open,
  onOpenChange,
  starredMessages,
  conversationId,
  onScrollToMessage,
  variant,
  getConversationText,
}) => {
  const isAll = variant === "all";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star
              className={`h-5 w-5 ${isAll ? "text-blue-600" : "text-amber-600"}`}
            />
            {isAll ? "Tất cả tin nhắn đã đánh dấu" : "Tin nhắn đã đánh dấu"}
          </DialogTitle>
          <DialogDescription>
            {isAll
              ? "Xem tất cả tin nhắn đã được đánh dấu từ mọi cuộc trò chuyện"
              : "Xem tất cả tin nhắn đã được đánh dấu trong cuộc trò chuyện này"}
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {starredMessages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Chưa có tin nhắn nào được đánh dấu
            </div>
          ) : (
            starredMessages.map((starred) => (
              <div
                key={starred.messageId}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition"
                onClick={() => {
                  if (isAll) {
                    const needsSwitchConversation =
                      starred.message.conversationId !== conversationId;
                    onScrollToMessage(starred);
                    if (needsSwitchConversation) {
                      onOpenChange(false);
                    }
                  } else {
                    onScrollToMessage(starred);
                  }
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-brand-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-brand-700">
                      {starred.message.senderName.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-gray-900">
                        {starred.message.senderName}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(starred.starredAt).toLocaleDateString(
                          "vi-VN",
                        )}
                      </span>
                    </div>
                    {isAll && getConversationText && (
                      <div className="text-xs text-blue-600 mb-1">
                        {getConversationText(starred.message.conversationId)}
                      </div>
                    )}
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {starred.message.content || "[File đính kèm]"}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
