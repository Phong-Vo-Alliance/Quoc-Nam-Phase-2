import React from "react";
import { Building2 } from "lucide-react";
import { useZaloAccountForGroup } from "../hooks/useVendorGroups";
import vendorGroupsRaw from "@/data/zalo/vendor-groups.json";
import type { VendorGroup } from "@/types/zalo";

const vendorGroups = vendorGroupsRaw as VendorGroup[];

interface VendorChatPlaceholderProps {
  groupId: string;
  groupName: string;
}

export const VendorChatPlaceholder: React.FC<VendorChatPlaceholderProps> = ({
  groupId,
  groupName,
}) => {
  const zaloAccount = useZaloAccountForGroup(groupId);
  const group = vendorGroups.find((g) => g.id === groupId);
  const memberCount = group?.memberCount ?? 0;

  return (
    <div className="flex h-full flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden">
      {/* Header — same structure as ChatMainContainer header */}
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-sm">
            {groupName
              .replace(/^NCC\s*[-–]\s*/i, "")
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0])
              .join("")
              .toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-900">
              {groupName.replace(/^NCC\s*[-–]\s*/i, "")}
            </div>
            <div className="text-xs text-gray-400">{memberCount} thành viên</div>
          </div>
        </div>
      </div>

      {/* Zalo identity bar */}
      {zaloAccount && (
        <div className="flex items-center gap-2 border-b border-blue-50 bg-blue-50 px-4 py-2 shrink-0">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
            Z
          </span>
          <span className="text-xs text-blue-700">
            Đang đại diện tài khoản:{" "}
            <span className="font-medium">{zaloAccount.displayName}</span>
          </span>
        </div>
      )}

      {/* Message area — loading skeleton */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-end gap-2 ${i % 3 === 2 ? "justify-end" : ""}`}
          >
            {i % 3 !== 2 && (
              <div className="h-7 w-7 shrink-0 rounded-full bg-gray-200 animate-pulse" />
            )}
            <div
              className={`rounded-2xl bg-gray-100 animate-pulse ${
                i % 3 === 2 ? "w-48 h-9" : i % 2 === 0 ? "w-56 h-9" : "w-36 h-6"
              }`}
            />
          </div>
        ))}

        {/* Center hint */}
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
            <Building2 className="h-7 w-7 text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">
              {groupName.replace(/^NCC\s*[-–]\s*/i, "")}
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Nhóm chat nhà cung cấp qua Zalo
            </p>
          </div>
        </div>
      </div>

      {/* Input area — disabled placeholder */}
      <div className="border-t border-gray-100 px-4 py-3 shrink-0">
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5">
          <span className="flex-1 text-sm text-gray-400 select-none">
            Nhập tin nhắn...
          </span>
        </div>
      </div>
    </div>
  );
};
