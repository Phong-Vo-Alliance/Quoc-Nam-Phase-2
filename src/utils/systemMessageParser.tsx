/**
 * System Message Parser - Utility to parse and highlight usernames in system messages
 *
 * Feature: Highlight usernames in system notification messages
 *
 * Supported patterns:
 * 1. "[Nội dung] đã được tiếp nhận bởi [user] lúc [time]"
 *    → Bold: Nội dung, Highlight: user
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
 *    → Bold: content, Highlight: username
 *
 * 10. "[username] đã đánh dấu mục [item-name]"
 *    → Highlight: username, Bold: item-name
 *
 * 11. "[username] đã bỏ đánh dấu mục [item-name]"
 *    → Highlight: username, Bold: item-name
 *
 * 12. "[assignee-name] đã chuyển trạng thái công việc [task-name] sang [status]"
 *    → Highlight: assignee-name, Bold: task-name, Status color: status
 *
 * 13. "Loại việc [oldName] thuộc nhóm [categoryName] đã đổi tên thành [newName]"
 *    → Bold: oldName, categoryName. Highlight (username style): newName
 * 13b. (Fallback) "Loại việc [oldName] đã đổi tên thành [newName]"
 *    → Bold: oldName, Bold: newName
 *
 * 17. "[name] đã bị xóa khỏi loại việc"
 *    → Danger highlight (red): name
 */

import React from "react";

export interface SystemMessagePart {
  type:
    | "text"
    | "actor-name"
    | "highlight"
    | "danger-highlight"
    | "time"
    | "task-name"
    | "item-name"
    | "status"
    | "content-name"; // For content in receive info messages
  content: string;
  statusType?:
    | "todo"
    | "need-to-verified"
    | "in-progress"
    | "completed"
    | "cancelled"; // For status highlighting
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
    /^(.+?)\s+đã được tiếp nhận bởi\s+(.+?)\s+lúc\s+(\d{1,2}:\d{2})$/;

  // Pattern 2: "Công việc [tên] đã được tạo bởi [creator] và giao cho [assignee]"
  // Note: uses 's' flag (dotAll) because task names can contain newlines
  const createTaskPattern =
    /^Công việc\s+([\s\S]+?)\s+đã được tạo bởi\s+(.+?)\s+và giao cho\s+(.+)$/;

  // Pattern 3: "Công việc [tên] đã được chuyển giao cho [user]"
  const transferTaskPattern =
    /^Công việc\s+([\s\S]+?)\s+đã được chuyển giao cho\s+(.+)$/;

  // Pattern 4: "[user] đã thêm [user2] vào nhóm"
  const addMemberPattern = /^(.+?)\s+đã thêm\s+(.+?)\s+vào nhóm$/;

  // Pattern 5: "[user] đã rời khỏi nhóm"
  const leaveMemberPattern = /^(.+?)\s+đã rời khỏi nhóm$/;

  // Pattern 6: "[user] đã xóa [user2] khỏi nhóm"
  const removeMemberPattern = /^(.+?)\s+đã xóa\s+(.+?)\s+khỏi nhóm$/;

  // Pattern 7: "Công việc [tên] đã được tạo và giao cho [user]" (without creator)
  const createTaskSimplePattern =
    /^Công việc\s+([\s\S]+?)\s+đã được tạo và giao cho\s+(.+)$/;

  // Pattern 8: "[username] ([email]) đã được thêm vào nhóm"
  const addMemberWithEmailPattern =
    /^(.+?)\s+\(([^)]+)\)\s+đã được thêm vào nhóm$/;

  // Pattern 9: "[content] đã được tiếp nhận bởi [username]" (without time)
  const receiveInfoNoTimePattern = /^(.+?)\s+đã được tiếp nhận bởi\s+(.+?)$/;

  // Pattern 10: "[username] đã đánh dấu mục [item-name]" (with or without quotes)
  const markItemPattern = /^(.+?)\s+đã đánh dấu mục\s+(.+)$/;

  // Pattern 11: "[username] đã bỏ đánh dấu mục [item-name]" (with or without quotes)
  const unmarkItemPattern = /^(.+?)\s+đã bỏ đánh dấu mục\s+(.+)$/;

  // Pattern 12: "[assignee-name] đã chuyển trạng thái công việc [task-name] sang [status]"
  // Status mapping for color highlighting
  const statusMapping: Record<
    string,
    "todo" | "need-to-verified" | "in-progress" | "completed" | "cancelled"
  > = {
    "Chưa xử lý": "todo",
    "Chờ duyệt": "need-to-verified",
    "Đang xử lý": "in-progress",
    "Hoàn thành": "completed",
    "Đã hủy": "cancelled",
    // Legacy status names (for backward compatibility)
    "Chờ xử lý": "todo",
    "Chưa bắt đầu": "todo",
    "Đã xong": "completed",
  };

  const changeStatusPattern =
    /^(.+?)\s+đã chuyển trạng thái công việc\s+([\s\S]+?)\s+sang\s+(.+)$/;

  // Pattern 13: "Loại việc [oldName] thuộc nhóm [categoryName] đã đổi tên thành [newName]"
  const renameWorkTypeWithCategoryPattern =
    /^Loại việc\s+(.+?)\s+thuộc nhóm\s+(.+?)\s+đã đổi tên thành\s+(.+)$/;

  // Pattern 13b (fallback): "Loại việc [oldName] đã đổi tên thành [newName]"
  const renameWorkTypePattern = /^Loại việc\s+(.+?)\s+đã đổi tên thành\s+(.+)$/;

  // Pattern 17: "[name] đã bị xóa khỏi loại việc" (with or without quotes)
  const removedFromWorkTypePattern =
    /^["']?(.+?)["']?\s+đã bị xóa khỏi loại việc$/;

  // Pattern 14: "[leader] đã thêm mục [checklist-name] vào công việc [task-name]"
  const checklistItemAddedPattern =
    /^(.+?)\s+đã thêm mục\s+(.+?)\s+vào công việc\s+([\s\S]+)$/;

  // Pattern 15: "[leader] đã cập nhật mục [old-name] thành [new-name] vào công việc [task-name]"
  const checklistItemUpdatedPattern =
    /^(.+?)\s+đã cập nhật mục\s+(.+?)\s+thành\s+(.+?)\s+vào công việc\s+([\s\S]+)$/;

  // Pattern 16: "[leader] đã xóa mục [checklist-name]"
  const checklistItemDeletedPattern = /^(.+?)\s+đã xóa mục\s+(.+)$/;

  let match: RegExpMatchArray | null;

  // Try Pattern 1: Receive Info
  if ((match = content.match(receiveInfoPattern))) {
    const [, contentDesc, username, time] = match;
    // Remove surrounding quotes if present
    const cleanContent = contentDesc.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "content-name", content: cleanContent });
    parts.push({ type: "text", content: " đã được tiếp nhận bởi " });
    parts.push({ type: "highlight", content: username });
    parts.push({ type: "text", content: " lúc " });
    parts.push({ type: "time", content: time });
    return parts;
  }

  // Try Pattern 2: Create Task
  if ((match = content.match(createTaskPattern))) {
    const [, taskName, creator, assignee] = match;
    // Remove surrounding quotes if present
    const cleanTaskName = taskName.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "text", content: "Công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    parts.push({ type: "text", content: " đã được tạo bởi " });
    parts.push({ type: "highlight", content: creator });
    parts.push({ type: "text", content: " và giao cho " });
    parts.push({ type: "highlight", content: assignee });
    return parts;
  }

  // Try Pattern 3: Transfer Task
  if ((match = content.match(transferTaskPattern))) {
    const [, taskName, assignee] = match;
    // Remove surrounding quotes if present
    const cleanTaskName = taskName.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "text", content: "Công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    parts.push({ type: "text", content: " đã được chuyển giao cho " });
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
    // Remove surrounding quotes if present
    const cleanTaskName = taskName.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "text", content: "Công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    parts.push({ type: "text", content: " đã được tạo và giao cho " });
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
    // Remove surrounding quotes if present
    const cleanContent = contentDesc.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "content-name", content: cleanContent });
    parts.push({ type: "text", content: " đã được tiếp nhận bởi " });
    parts.push({ type: "highlight", content: username.trim() });
    return parts;
  }

  // Try Pattern 10: Mark Item
  if ((match = content.match(markItemPattern))) {
    const [, username, itemName] = match;
    // Remove surrounding quotes if present
    const cleanItemName = itemName.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "highlight", content: username });
    parts.push({ type: "text", content: " đã đánh dấu mục " });
    parts.push({ type: "item-name", content: cleanItemName });
    return parts;
  }

  // Try Pattern 11: Unmark Item
  if ((match = content.match(unmarkItemPattern))) {
    const [, username, itemName] = match;
    // Remove surrounding quotes if present
    const cleanItemName = itemName.trim().replace(/^["']|["']$/g, "");
    parts.push({ type: "highlight", content: username });
    parts.push({ type: "text", content: " đã bỏ đánh dấu mục " });
    parts.push({ type: "item-name", content: cleanItemName });
    return parts;
  }

  // Try Pattern 12: Change Status
  if ((match = content.match(changeStatusPattern))) {
    const [, assigneeName, taskName, status] = match;
    // Remove surrounding quotes if present
    const cleanTaskName = taskName.trim().replace(/^["']|["']$/g, "");
    // Clean status: remove quotes, trailing dots, and extra spaces
    const cleanStatus = status
      .trim()
      .replace(/^["']|["']$/g, "")
      .replace(/\.$/g, "")
      .trim();

    parts.push({ type: "highlight", content: assigneeName });
    parts.push({ type: "text", content: " đã chuyển trạng thái công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    parts.push({ type: "text", content: " sang " });

    // Determine status type for color coding
    const statusType = statusMapping[cleanStatus] || "todo";

    parts.push({ type: "status", content: cleanStatus, statusType });
    return parts;
  }

  // Try Pattern 13: Rename Work Type (with categoryName)
  if ((match = content.match(renameWorkTypeWithCategoryPattern))) {
    const [, oldName, categoryName, newName] = match;
    parts.push({ type: "text", content: "Loại việc " });
    parts.push({ type: "task-name", content: oldName.trim() });
    parts.push({ type: "text", content: " thuộc nhóm " });
    parts.push({ type: "task-name", content: categoryName.trim() });
    parts.push({ type: "text", content: " đã đổi tên thành " });
    parts.push({ type: "highlight", content: newName.trim() });
    return parts;
  }

  // Try Pattern 13b: Rename Work Type (fallback - old format without categoryName)
  if ((match = content.match(renameWorkTypePattern))) {
    const [, oldName, newName] = match;
    parts.push({ type: "text", content: "Loại việc " });
    parts.push({ type: "task-name", content: oldName.trim() });
    parts.push({ type: "text", content: " đã đổi tên thành " });
    parts.push({ type: "task-name", content: newName.trim() });
    return parts;
  }

  // Try Pattern 17: Removed from Work Type
  if ((match = content.match(removedFromWorkTypePattern))) {
    const [, name] = match;
    parts.push({ type: "danger-highlight", content: name.trim() });
    parts.push({ type: "text", content: " đã bị xóa khỏi loại việc" });
    return parts;
  }

  // Try Pattern 14: Checklist Item Added
  if ((match = content.match(checklistItemAddedPattern))) {
    const [, actorName, itemName, taskName] = match;
    const cleanItemName = itemName.trim().replace(/^\s*["']|["']\s*$/g, "");
    const cleanTaskName = taskName.trim().replace(/^\s*["']|["']\s*$/g, "");

    parts.push({ type: "actor-name", content: actorName.trim() });
    parts.push({ type: "text", content: " đã thêm mục " });
    parts.push({ type: "item-name", content: cleanItemName });
    parts.push({ type: "text", content: " vào công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    return parts;
  }

  // Try Pattern 15: Checklist Item Updated
  if ((match = content.match(checklistItemUpdatedPattern))) {
    const [, actorName, oldItemName, newItemName, taskName] = match;
    const cleanOldItemName = oldItemName
      .trim()
      .replace(/^\s*["']|["']\s*$/g, "");
    const cleanNewItemName = newItemName
      .trim()
      .replace(/^\s*["']|["']\s*$/g, "");
    const cleanTaskName = taskName.trim().replace(/^\s*["']|["']\s*$/g, "");

    parts.push({ type: "actor-name", content: actorName.trim() });
    parts.push({ type: "text", content: " đã cập nhật mục " });
    parts.push({ type: "task-name", content: cleanOldItemName });
    parts.push({ type: "text", content: " thành " });
    parts.push({ type: "item-name", content: cleanNewItemName });
    parts.push({ type: "text", content: " vào công việc " });
    parts.push({ type: "task-name", content: cleanTaskName });
    return parts;
  }

  // Try Pattern 16: Checklist Item Deleted
  if ((match = content.match(checklistItemDeletedPattern))) {
    const [, actorName, itemName] = match;
    const cleanItemName = itemName.trim().replace(/^\s*["']|["']\s*$/g, "");

    parts.push({ type: "actor-name", content: actorName.trim() });
    parts.push({ type: "text", content: " đã xóa mục " });
    parts.push({ type: "item-name", content: cleanItemName });
    return parts;
  }

  // Fallback: No pattern matched, return as plain text
  return [{ type: "text", content }];
}

export interface RenderSystemMessageOptions {
  /**
   * Class for actor names (e.g. leader name)
   * @default "font-semibold text-gray-900"
   */
  actorNameClassName?: string;

  /**
   * Class for highlighted usernames
   * @default "font-semibold text-gray-900"
   */
  highlightClassName?: string;

  /**
   * Class for danger-highlighted names (red)
   * @default "font-semibold text-red-600"
   */
  dangerHighlightClassName?: string;

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

  /**
   * Class for item names (starred items, etc.)
   * @default "font-bold text-gray-800"
   */
  itemNameClassName?: string;

  /**
   * Class for content names (received content)
   * @default "font-bold text-gray-800"
   */
  contentNameClassName?: string;

  /**
   * Classes for status by type
   * @default {
   *   todo: "font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded",
   *   "need-to-verified": "font-semibold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded",
   *   "in-progress": "font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded",
   *   completed: "font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded",
   *   cancelled: "font-semibold text-gray-600 bg-gray-100 px-1 rounded"
   * }
   */
  statusClassNames?: {
    todo?: string;
    "need-to-verified"?: string;
    "in-progress"?: string;
    completed?: string;
    cancelled?: string;
  };
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
    actorNameClassName = "font-semibold text-gray-900",
    highlightClassName = "font-semibold text-gray-900",
    dangerHighlightClassName = "font-semibold text-red-700 bg-red-100 px-1.5 py-0.5 rounded",
    timeClassName = "text-gray-500",
    taskNameClassName = "font-medium",
    itemNameClassName = "font-medium text-gray-800",
    contentNameClassName = "font-medium text-gray-800",
    statusClassNames = {
      todo: "font-semibold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded",
      "need-to-verified":
        "font-semibold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded",
      "in-progress":
        "font-semibold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded",
      completed:
        "font-semibold text-green-700 bg-green-100 px-1.5 py-0.5 rounded",
      cancelled: "font-semibold text-gray-600 bg-gray-100 px-1 rounded",
    },
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
          case "actor-name":
            return (
              <span key={index} className={actorNameClassName}>
                {part.content}
              </span>
            );
          case "highlight":
            return (
              <span key={index} className={highlightClassName}>
                {part.content}
              </span>
            );
          case "danger-highlight":
            return (
              <span key={index} className={dangerHighlightClassName}>
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
          case "item-name":
            return (
              <span key={index} className={itemNameClassName}>
                {part.content}
              </span>
            );
          case "content-name":
            return (
              <span key={index} className={contentNameClassName}>
                {part.content}
              </span>
            );
          case "status":
            const statusClass =
              part.statusType && statusClassNames[part.statusType]
                ? statusClassNames[part.statusType]
                : statusClassNames.todo;
            return (
              <span key={index} className={statusClass}>
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
