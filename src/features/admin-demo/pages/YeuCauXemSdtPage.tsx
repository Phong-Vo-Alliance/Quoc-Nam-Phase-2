import { useMemo, useState } from "react";
import { Phone, CheckCircle2, XCircle, EyeOff, Clock, Users } from "lucide-react";
import { useVendorPhoneRevealStore, type PhoneRevealRequest } from "@/stores/vendorPhoneRevealStore";
import { usePhoneRevealActions } from "@/features/zalo-vendor/hooks/usePhoneRevealActions";
import { cn } from "@/lib/utils";

type FilterTab = "all" | "pending" | "approved" | "denied" | "revoked";

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_CONFIG: Record<
  PhoneRevealRequest["status"],
  { label: string; badgeClass: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Đang chờ",
    badgeClass: "bg-amber-100 text-amber-700 border border-amber-200",
    icon: <Clock className="h-3 w-3" />,
  },
  approved: {
    label: "Đã duyệt",
    badgeClass: "bg-emerald-100 text-emerald-700 border border-emerald-200",
    icon: <CheckCircle2 className="h-3 w-3" />,
  },
  denied: {
    label: "Đã từ chối",
    badgeClass: "bg-red-100 text-red-700 border border-red-200",
    icon: <XCircle className="h-3 w-3" />,
  },
  revoked: {
    label: "Đã thu hồi",
    badgeClass: "bg-orange-100 text-orange-700 border border-orange-200",
    icon: <EyeOff className="h-3 w-3" />,
  },
};

export function YeuCauXemSdtPage() {
  const requests = useVendorPhoneRevealStore((s) => s.requests);
  const { approveReveal, denyReveal, revokeReveal } = usePhoneRevealActions();
  const [filter, setFilter] = useState<FilterTab>("all");

  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter((r) => r.status === "pending").length,
      approved: requests.filter((r) => r.status === "approved").length,
      denied: requests.filter((r) => r.status === "denied").length,
      revoked: requests.filter((r) => r.status === "revoked").length,
    };
  }, [requests]);

  const filtered = useMemo(
    () => (filter === "all" ? requests : requests.filter((r) => r.status === filter)),
    [requests, filter],
  );

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "Tất cả" },
    { key: "pending", label: "Đang chờ" },
    { key: "approved", label: "Đã duyệt" },
    { key: "denied", label: "Đã từ chối" },
    { key: "revoked", label: "Đã thu hồi" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Phone className="h-5 w-5 text-brand-600" />
          Yêu Cầu Xem Số Điện Thoại
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Quản lý các yêu cầu xem số điện thoại bị ẩn trong các nhóm NCC
        </p>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              filter === tab.key
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
            type="button"
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  filter === tab.key
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-500",
                )}
              >
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Users className="h-10 w-10 mb-3 opacity-40" />
          <p className="text-sm">Không có yêu cầu nào</p>
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nhân viên
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Số điện thoại
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Nhóm NCC
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thời gian yêu cầu
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Trạng thái
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Admin xử lý
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thời gian xử lý
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((req) => {
                const statusCfg = STATUS_CONFIG[req.status];
                return (
                  <tr key={req.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{req.requestedByName}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-gray-800 bg-gray-100 px-2 py-0.5 rounded text-xs">
                        {req.phoneRaw}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{req.groupName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {formatDateTime(req.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                          statusCfg.badgeClass,
                        )}
                      >
                        {statusCfg.icon}
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {req.reviewedByAdminName ?? <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {req.reviewedAt ? (
                        formatDateTime(req.reviewedAt)
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {req.status === "pending" && (
                          <>
                            <button
                              onClick={() => denyReveal(req)}
                              className="px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-medium"
                              type="button"
                            >
                              Từ chối
                            </button>
                            <button
                              onClick={() => approveReveal(req)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition-colors text-xs font-medium"
                              type="button"
                            >
                              Duyệt
                            </button>
                          </>
                        )}
                        {req.status === "approved" && (
                          <button
                            onClick={() => revokeReveal(req)}
                            className="px-2.5 py-1 rounded-lg border border-orange-200 text-orange-600 hover:bg-orange-50 transition-colors text-xs font-medium"
                            type="button"
                          >
                            Thu hồi
                          </button>
                        )}
                        {(req.status === "denied" || req.status === "revoked") && (
                          <span className="text-xs text-gray-300 italic">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
