import type { Task } from "@/features/portal/types";
import type { ChatMessage } from "@/types/messages";

/**
 * Helper: Get title for task log thread
 */
export function getTaskLogTitle(
  task?: Task,
  parentMessage?: ChatMessage,
): string {
  if (parentMessage?.content) {
    const raw = parentMessage.content.trim();
    return raw.length > 80 ? raw.slice(0, 77) + "…" : raw;
  }

  if (task?.title) return task.title;
  return "Nhật ký công việc";
}
