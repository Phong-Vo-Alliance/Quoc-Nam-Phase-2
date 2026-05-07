import React from "react";
import { X } from "lucide-react";
import type { Task } from "@/features/portal/types";
import type { ThreadMember } from "../types";

interface ThreadHeaderProps {
  title: string;
  task?: Task;
  members: ThreadMember[];
  onClose: () => void;
}

export const ThreadHeader: React.FC<ThreadHeaderProps> = ({
  title,
  task,
  members,
  onClose,
}) => {
  return (
    <div className="px-4 pt-4 pb-3 border-b border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Nhật ký công việc
          </div>
          <div className="mt-0.5 text-sm font-semibold text-gray-900 truncate">
            {title}
          </div>
          {task && (
            <div className="mt-0.5 text-[11px] text-gray-500 flex flex-wrap gap-2">
              <span>
                Trạng thái:{" "}
                <span className="font-medium">{task.status.label}</span>
                <span>
                  {" "}
                  • Giao cho:{" "}
                  <span className="font-medium">
                    {members.find((m) => m.id === task.assignTo)?.name ??
                      "Không rõ"}
                  </span>
                </span>
              </span>
              {task.dueDate && (
                <span>
                  • Hạn xử lý:{" "}
                  {new Date(task.dueDate).toLocaleString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                    day: "2-digit",
                    month: "2-digit",
                  })}
                </span>
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="inline-flex items-center justify-center rounded-full p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
          data-testid="task-log-close-button"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
