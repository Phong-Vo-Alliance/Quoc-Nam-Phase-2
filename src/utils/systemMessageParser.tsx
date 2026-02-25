/**
 * System Message Parser - Utility to parse and highlight usernames in system messages
 *
 * Feature: Highlight usernames in system notification messages
 *
 * Supported patterns:
 * 1. "[Nội dung] đã được tiếp nhận bởi [user] lúc [time]"
 *    → Highlight: user
 *
 * 2. "Công việc [tên công việc] đã được tạo bởi [user-create] và giao cho [user]"
 *    → Highlight: user-create, user
 *
 * 3. "Công việc [tên công việc] đã được chuyển giao cho [user]"
 *    → Highlight: user
 *
 * 4. "[user] đã thêm [user2] vào nhóm"
 *    → Highlight: user, user2
 *
 * 5. "[user] đã rời khỏi nhóm"
 *    → Highlight: user
 *
 * 6. "[user] đã xóa [user2] khỏi nhóm"
 *    → Highlight: user, user2
 *
 * 7. "Công việc [tên công việc] đã được tạo và giao cho [user]"
 *    → Highlight: user
 *
 * 8. "[username] ([email]) đã được thêm vào nhóm"
 *    → Highlight: username (email)
 *
 * 9. "[content]" đã được tiếp nhận bởi [username] (without time)
 *    → Highlight: username
 */

import React from "react";

export interface SystemMessagePart {
  type: "text" | "highlight" | "time" | "task-name";
  content: string;
}

/**
 * Parse system message content and identify parts to highlight
 *
 * @param content - System message content string
 * @returns Array of parts with type information for rendering
 */
export function parseSystemMessageContent(
  content: string,
): SystemMessagePart[] {
  if (!content) return [];

  const parts: SystemMessagePart[] = [];

  // Pattern 1: "[Nội dung] đã được tiếp nhận bởi [user] lúc [time]"
  // Regex: captures content in quotes, "đã được tiếp nhận bởi", username, "lúc", time
  const receiveInfoPattern =
    /^(.+?)đã được tiếp nhận bởi\s+(.+?)\s+lúc\s+(\d{1,2}:\d{2})$/;

  // Pattern 2: "Công việc [tên] đã được tạo bởi [creator] và giao cho [assignee]"
  const createTaskPattern =
    /^Công việc\s+"(.+?)"\s+đã được tạo bởi\s+(.+?)\s+và giao cho\s+(.+)$/;

  // Pattern 3: "Công việc [tên] đã được chuyển giao cho [user]"
  const transferTaskPattern =
    /^Công việc\s+"(.+?)"\s+đã được chuyển giao cho\s+(.+)$/;

  // Pattern 4: "[user] đã thêm [user2] vào nhóm"
  const addMemberPattern = /^(.+?)\s+đã thêm\s+(.+?)\s+vào nhóm$/;

  // Pattern 5: "[user] đã rời khỏi nhóm"
  const leaveMemberPattern = /^(.+?)\s+đã rời khỏi nhóm$/;

  // Pattern 6: "[user] đã xóa [user2] khỏi nhóm"
  const removeMemberPattern = /^(.+?)\s+đã xóa\s+(.+?)\s+khỏi nhóm$/;

  // Pattern 7: "Công việc [tên] đã được tạo và giao cho [user]" (without creator)
  const createTaskSimplePattern =
    /^Công việc\s+"(.+?)"\s+đã được tạo và giao cho\s+(.+)$/;

  // Pattern 8: "[username] ([email]) đã được thêm vào nhóm"
  const addMemberWithEmailPattern =
    /^(.+?)\s+\(([^)]+)\)\s+đã được thêm vào nhóm$/;

  // Pattern 9: "[content]" đã được tiếp nhận bởi [username] (without time)
  const receiveInfoNoTimePattern = /^(.+?)đã được tiếp nhận bởi\s+(.+?)$/;

  let match: RegExpMatchArray | null;

  // Try Pattern 1: Receive Info
  if ((match = content.match(receiveInfoPattern))) {
    const [, contentDesc, username, time] = match;
    parts.push({ type: "text", content: contentDesc });
    parts.push({ type: "text", content: "đã được tiếp nhận bởi " });
    parts.push({ type: "highlight", content: username });
    parts.push({ type: "text", content: " lúc " });
    parts.push({ type: "time", content: time });
    return parts;
  }

  // Try Pattern 2: Create Task
  if ((match = content.match(createTaskPattern))) {
    const [, taskName, creator, assignee] = match;
    parts.push({ type: "text", content: 'Công việc "' });
    parts.push({ type: "task-name", content: taskName });
    parts.push({ type: "text", content: '" đã được tạo bởi ' });
    parts.push({ type: "highlight", content: creator });
    parts.push({ type: "text", content: " và giao cho " });
    parts.push({ type: "highlight", content: assignee });
    return parts;
  }

  // Try Pattern 3: Transfer Task
  if ((match = content.match(transferTaskPattern))) {
    const [, taskName, assignee] = match;
    parts.push({ type: "text", content: 'Công việc "' });
    parts.push({ type: "task-name", content: taskName });
    parts.push({ type: "text", content: '" đã được chuyển giao cho ' });
    parts.push({ type: "highlight", content: assignee });
    return parts;
  }

  // Try Pattern 4: Add Member
  if ((match = content.match(addMemberPattern))) {
    const [, adder, addedUser] = match;
    parts.push({ type: "highlight", content: adder });
    parts.push({ type: "text", content: " đã thêm " });
    parts.push({ type: "highlight", content: addedUser });
    parts.push({ type: "text", content: " vào nhóm" });
    return parts;
  }

  // Try Pattern 5: Leave Group
  if ((match = content.match(leaveMemberPattern))) {
    const [, user] = match;
    parts.push({ type: "highlight", content: user });
    parts.push({ type: "text", content: " đã rời khỏi nhóm" });
    return parts;
  }

  // Try Pattern 6: Remove Member
  if ((match = content.match(removeMemberPattern))) {
    const [, remover, removedUser] = match;
    parts.push({ type: "highlight", content: remover });
    parts.push({ type: "text", content: " đã xóa " });
    parts.push({ type: "highlight", content: removedUser });
    parts.push({ type: "text", content: " khỏi nhóm" });
    return parts;
  }

  // Try Pattern 7: Create Task Simple (without creator)
  if ((match = content.match(createTaskSimplePattern))) {
    const [, taskName, assignee] = match;
    parts.push({ type: "text", content: 'Công việc "' });
    parts.push({ type: "task-name", content: taskName });
    parts.push({ type: "text", content: '" đã được tạo và giao cho ' });
    parts.push({ type: "highlight", content: assignee });
    return parts;
  }

  // Try Pattern 8: Add Member with Email
  if ((match = content.match(addMemberWithEmailPattern))) {
    const [, username, email] = match;
    parts.push({ type: "highlight", content: `${username} (${email})` });
    parts.push({ type: "text", content: " đã được thêm vào nhóm" });
    return parts;
  }

  // Try Pattern 9: Receive Info without time
  // Note: This must be AFTER Pattern 1 (with time) to avoid matching incorrectly
  if ((match = content.match(receiveInfoNoTimePattern))) {
    const [, contentDesc, username] = match;
    parts.push({ type: "text", content: contentDesc });
    parts.push({ type: "text", content: "đã được tiếp nhận bởi " });
    parts.push({ type: "highlight", content: username.trim() });
    return parts;
  }

  // Fallback: No pattern matched, return as plain text
  return [{ type: "text", content }];
}

export interface RenderSystemMessageOptions {
  /**
   * Class for highlighted usernames
   * @default "font-semibold text-gray-900"
   */
  highlightClassName?: string;

  /**
   * Class for time
   * @default "text-gray-500"
   */
  timeClassName?: string;

  /**
   * Class for task names
   * @default "font-medium"
   */
  taskNameClassName?: string;
}

/**
 * Render system message content with highlighted parts
 *
 * @param content - System message content string
 * @param options - Styling options for different parts
 * @returns React elements with appropriate styling
 *
 * @example
 * renderSystemMessageWithHighlights('"Báo cáo" đã được tiếp nhận bởi Nguyễn Văn A lúc 14:30')
 * // Returns: <>"Báo cáo" đã được tiếp nhận bởi <strong>Nguyễn Văn A</strong> lúc <span>14:30</span></>
 */
export function renderSystemMessageWithHighlights(
  content: string,
  options: RenderSystemMessageOptions = {},
): React.ReactNode {
  const {
    highlightClassName = "font-semibold text-gray-900",
    timeClassName = "text-gray-500",
    taskNameClassName = "font-medium",
  } = options;

  const parts = parseSystemMessageContent(content);

  if (parts.length === 0) {
    return content;
  }

  // If only one part and it's text, return plain content
  if (parts.length === 1 && parts[0].type === "text") {
    return content;
  }

  return (
    <>
      {parts.map((part, index) => {
        switch (part.type) {
          case "highlight":
            return (
              <span key={index} className={highlightClassName}>
                {part.content}
              </span>
            );
          case "time":
            return (
              <span key={index} className={timeClassName}>
                {part.content}
              </span>
            );
          case "task-name":
            return (
              <span key={index} className={taskNameClassName}>
                {part.content}
              </span>
            );
          case "text":
          default:
            return <React.Fragment key={index}>{part.content}</React.Fragment>;
        }
      })}
    </>
  );
}

export default renderSystemMessageWithHighlights;
