import { MessageSquareOff } from "lucide-react";

interface EmptyChatStateProps {
  /**
   * Mobile layout có UI đơn giản hơn (icon nhỏ hơn, text ngắn hơn)
   */
  isMobile?: boolean;
}

/**
 * Empty state hiển thị khi user chưa chọn conversation nào
 *
 * Desktop: Hiển thị icon lớn + text hướng dẫn chi tiết
 * Mobile: Hiển thị icon nhỏ + text ngắn gọn
 */
export function EmptyChatState({ isMobile = false }: EmptyChatStateProps) {
  if (isMobile) {
    return (
      <div
        className="flex h-full items-center justify-center bg-gray-50 p-6"
        data-testid="empty-conversation-state"
      >
        <div className="text-center space-y-3">
          <MessageSquareOff className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-medium text-gray-700">
            Chọn cuộc trò chuyện
          </h3>
          <p className="text-xs text-gray-500">Chạm vào danh sách để bắt đầu</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full items-center justify-center bg-gray-50"
      data-testid="empty-conversation-state"
    >
      <div className="text-center space-y-4 px-6">
        <div className="flex justify-center">
          <MessageSquareOff className="w-16 h-16 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-700">
            Chọn cuộc trò chuyện để bắt đầu
          </h3>
          <p className="text-sm text-gray-500 max-w-md">
            Chọn một nhóm hoặc liên hệ từ danh sách bên trái để xem tin nhắn và
            bắt đầu trò chuyện
          </p>
        </div>
      </div>
    </div>
  );
}
