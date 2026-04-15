import { MessageSquareOff } from "lucide-react";

type EmptyChatVariant = "default" | "no-groups" | "no-dms";

interface EmptyChatStateProps {
  /**
   * Mobile layout có UI đơn giản hơn (icon nhỏ hơn, text ngắn hơn)
   */
  isMobile?: boolean;
  /**
   * Context để hiển thị message phù hợp:
   * - "no-groups": user đang ở tab Nhóm nhưng chưa có nhóm nào
   * - "no-dms": user đang ở tab Cá nhân nhưng chưa có cuộc trò chuyện nào
   * - "default": có data nhưng chưa chọn conversation
   */
  variant?: EmptyChatVariant;
}

const COPY: Record<
  EmptyChatVariant,
  { title: string; description: string; mobileTitle: string }
> = {
  default: {
    title: "Chọn cuộc trò chuyện để bắt đầu",
    description:
      "Chọn một nhóm hoặc liên hệ từ danh sách bên trái để xem tin nhắn và bắt đầu trò chuyện",
    mobileTitle: "Chọn cuộc trò chuyện",
  },
  "no-groups": {
    title: "Chưa có nhóm chat nào",
    description:
      "Bạn chưa thuộc nhóm chat nào. Hãy liên hệ quản trị viên để được thêm vào nhóm.",
    mobileTitle: "Chưa có nhóm chat nào",
  },
  "no-dms": {
    title: "Chưa có cuộc trò chuyện nào",
    description:
      "Bạn chưa có cuộc trò chuyện cá nhân nào. Hãy bắt đầu nhắn tin với đồng nghiệp.",
    mobileTitle: "Chưa có cuộc trò chuyện",
  },
};

/**
 * Empty state hiển thị khi user chưa chọn conversation nào
 *
 * Desktop: Hiển thị icon lớn + text hướng dẫn chi tiết
 * Mobile: Hiển thị icon nhỏ + text ngắn gọn
 */
export function EmptyChatState({
  isMobile = false,
  variant = "default",
}: EmptyChatStateProps) {
  const copy = COPY[variant];

  if (isMobile) {
    return (
      <div
        className="flex h-full items-center justify-center bg-gray-50 p-6"
        data-testid="empty-conversation-state"
        data-variant={variant}
      >
        <div className="text-center space-y-3">
          <MessageSquareOff className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-base font-medium text-gray-700">
            {copy.mobileTitle}
          </h3>
          <p className="text-xs text-gray-500">
            {variant === "default"
              ? "Chạm vào danh sách để bắt đầu"
              : copy.description}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex h-full items-center justify-center bg-gray-50"
      data-testid="empty-conversation-state"
      data-variant={variant}
    >
      <div className="text-center space-y-4 px-6">
        <div className="flex justify-center">
          <MessageSquareOff className="w-16 h-16 text-gray-300" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-700">{copy.title}</h3>
          <p className="text-sm text-gray-500 max-w-md">{copy.description}</p>
        </div>
      </div>
    </div>
  );
}
