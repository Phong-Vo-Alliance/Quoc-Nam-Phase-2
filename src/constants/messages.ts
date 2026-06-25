// Hằng số dùng chung cho hiển thị tin nhắn.

/**
 * Text placeholder khi một tin nhắn đã bị thu hồi và không có nội dung gốc để
 * hiển thị. Backend cũng dùng đúng chuỗi này làm `content` của lastMessage sau
 * khi thu hồi, nên dùng làm fallback ở client để khớp với kết quả sau khi reload.
 */
export const RECALLED_MESSAGE_TEXT = "Tin nhắn đã bị thu hồi";
