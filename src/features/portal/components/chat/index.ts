/**
 * Chat Components - Modern chat UI components with grouping support
 *
 * This folder contains components specific to the chat feature:
 * - ChatMainContainer: Main container with API integration and real-time updates
 * - MessageBubbleSimple: Message bubble with Phase 4 grouping support
 * - SystemMessageBubble: System notification messages (contentType = "SYS")
 */

export { ChatMainContainer } from "./ChatMainContainer";
export { MessageBubbleSimple } from "./MessageBubbleSimple";
export type { MessageBubbleSimpleProps } from "./MessageBubbleSimple";
export { SystemMessageBubble } from "./SystemMessageBubble";
export type { SystemMessageBubbleProps } from "./SystemMessageBubble";
export { MentionInputInline } from "./MentionInputInline";
export type { MentionInputProps } from "./MentionInputInline";
