import React from "react";
import { ListTodo } from "lucide-react";
import { RightAccordion } from "@/features/portal/components";
import { Button } from "@/components/ui/button";
import type { ReceivedInfo } from "@/features/portal/types";
import { formatTime } from "../utils/formatters";

export const ReceivedInfoSection: React.FC<{
  items: ReceivedInfo[];
  onAssignInfo?: (info: ReceivedInfo) => void;
  onOpenGroupTransfer?: (info: ReceivedInfo) => void;
}> = ({ items, onAssignInfo, onOpenGroupTransfer }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="premium-accordion-wrapper">
      <RightAccordion
        icon={<ListTodo className="h-4 w-4 text-amber-500" />}
        title={
          <div className="flex items-center gap-2">
            <span>Thông tin đã tiếp nhận</span>

            {/* BADGE — số lượng "waiting" */}
            {items.filter((i) => i.status === "waiting").length > 0 && (
              <span
                className="inline-flex items-center justify-center text-[10px] px-2 py-0.5 
                         rounded-full bg-amber-100 text-amber-700 font-bold border border-amber-300"
              >
                {items.filter((i) => i.status === "waiting").length}
              </span>
            )}
          </div>
        }
      >
        <div className="space-y-3">
          {items.map((info) => {
            const isTransferred = info.status === "transferred";
            const isAssigned = info.status === "assigned";

            return (
              <div
                key={info.id}
                className="rounded-lg border px-3 py-2 shadow-sm hover:shadow-md transition bg-white"
              >
                <div className="font-medium text-sm truncate">{info.title}</div>

                <div className="text-xs text-gray-500 mt-0.5">
                  Từ: <span className="font-semibold">{info.sender}</span> •
                  Tiếp nhận lúc: {formatTime(info.createdAt)}
                </div>

                {/* Status */}
                {isTransferred && (
                  <div className="text-[11px] text-amber-700 mt-1">
                    ➜ Đã chuyển sang nhóm:{" "}
                    <span className="font-semibold">
                      {info.transferredToGroupName}
                    </span>
                    {info.transferredWorkTypeName && (
                      <>
                        {" "}
                        • Loại việc:{" "}
                        <span className="font-semibold">
                          {info.transferredWorkTypeName}
                        </span>
                      </>
                    )}
                  </div>
                )}

                {isAssigned && (
                  <div className="text-[11px] text-emerald-700 mt-1">
                    ✓ Đã giao task
                  </div>
                )}

                {/* Buttons */}
                {info.status === "waiting" && (
                  <div className="mt-2">
                    <Button
                      size="sm"
                      onClick={() => onOpenGroupTransfer?.(info)}
                    >
                      Giao việc
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </RightAccordion>
    </div>
  );
};
