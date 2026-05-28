import React from "react";
import type { ZaloAccount } from "@/types/zalo";

interface ZaloIdentityBarProps {
  zaloAccount: ZaloAccount;
}

export const ZaloIdentityBar: React.FC<ZaloIdentityBarProps> = ({ zaloAccount }) => (
  <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50 px-4 py-2 shrink-0">
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-500 text-[10px] font-bold text-white">
      Z
    </span>
    <span className="text-xs text-blue-700">
      Đang đại diện tài khoản:{" "}
      <span className="font-semibold">{zaloAccount.displayName}</span>
    </span>
  </div>
);
