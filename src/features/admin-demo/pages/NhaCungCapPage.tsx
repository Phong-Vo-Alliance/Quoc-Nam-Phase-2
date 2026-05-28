import { useState, useRef, useEffect } from "react";
import {
  Plus,
  Wifi,
  WifiOff,
  AlertTriangle,
  QrCode,
  Users,
  RefreshCw,
  Unplug,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Loader2,
  Download,
  FileVideo,
  Filter,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDemoConfigStore, DEMO_USERS, type SyncReport, type ZaloConnectionStatus } from "@/stores/demoConfigStore";
import zaloAccounts from "@/data/zalo/zalo-accounts.json";
import vendorGroups from "@/data/zalo/vendor-groups.json";

// ─── Mock data: large files ────────────────────────────────────────────────────

const MOCK_LARGE_FILES = [
  { id: "f1", name: "Bao_gia_thiet_bi_Delta_2026.mp4", sizeMB: 620, groupId: "vg_004", groupName: "NCC - Thiết Bị Delta", accountId: "za_002", receivedAt: "2026-05-13T16:15:00Z" },
  { id: "f2", name: "Video_giao_hang_Phuong_Nam_14_05.mp4", sizeMB: 485, groupId: "vg_001", groupName: "NCC - Vận Chuyển Phương Nam", accountId: "za_001", receivedAt: "2026-05-14T09:30:00Z" },
  { id: "f3", name: "Kiem_tra_kho_tan_binh_thang_5.mp4", sizeMB: 312, groupId: "vg_002", groupName: "NCC - Kho Bãi Tân Bình", accountId: "za_001", receivedAt: "2026-05-12T14:20:00Z" },
  { id: "f4", name: "Quy_trinh_dong_goi_Thanh_Cong.mp4", sizeMB: 890, groupId: "vg_003", groupName: "NCC - Đóng Gói Thành Công", accountId: "za_002", receivedAt: "2026-05-10T10:00:00Z" },
  { id: "f5", name: "Training_nhan_vien_logistics_Q2.mp4", sizeMB: 1240, groupId: "vg_005", groupName: "NCC - Logistics Pro", accountId: "za_001", receivedAt: "2026-05-08T15:45:00Z" },
  { id: "f6", name: "Hop_dong_van_chuyen_thang_6.mp4", sizeMB: 380, groupId: "vg_001", groupName: "NCC - Vận Chuyển Phương Nam", accountId: "za_001", receivedAt: "2026-05-07T08:00:00Z" },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: ZaloConnectionStatus }) {
  if (status === "connected")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700 ring-1 ring-green-200">
        <Wifi className="h-3 w-3" /> Đang kết nối
      </span>
    );
  if (status === "expired")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
        <AlertTriangle className="h-3 w-3" /> Phiên hết hạn
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
      <WifiOff className="h-3 w-3" /> Đã ngắt kết nối
    </span>
  );
}

// ─── QR Modal ─────────────────────────────────────────────────────────────────

interface QRModalProps {
  accountName: string;
  onSuccess: () => void;
  onClose: () => void;
}

function QRModal({ accountName, onSuccess, onClose }: QRModalProps) {
  const [phase, setPhase] = useState<"waiting" | "scanning" | "done">("waiting");

  const handleSimulate = () => {
    setPhase("scanning");
    setTimeout(() => {
      setPhase("done");
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[420px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-800">
            {accountName ? `Quét lại QR — ${accountName}` : "Liên kết tài khoản Zalo mới"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-6 py-6">
          <p className="mb-4 text-sm text-gray-500">
            Mở ứng dụng Zalo trên điện thoại, chọn <strong>Quét mã QR</strong> và hướng camera vào mã bên dưới.
          </p>
          <div className="flex flex-col items-center gap-4">
            {/* Simulated QR */}
            <div className="relative flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
              <QrCode className="h-32 w-32 text-gray-300" />
              {phase === "scanning" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-white/90">
                  <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                </div>
              )}
              {phase === "done" && (
                <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-green-50/95">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
              )}
            </div>
            {phase === "waiting" && (
              <p className="text-sm text-gray-400">Đang chờ quét mã QR...</p>
            )}
            {phase === "scanning" && (
              <p className="text-sm text-gray-500">Đã quét! Đang xác thực...</p>
            )}
            {phase === "done" && (
              <p className="text-sm font-medium text-green-600">Kết nối thành công!</p>
            )}
          </div>
          {/* Simulate button for demo */}
          {phase === "waiting" && (
            <p
              onClick={handleSimulate}
              className="mt-4 cursor-pointer text-center text-xs text-blue-500 underline hover:text-blue-700"
            >
              (Demo) Nhấn để giả lập quét QR thành công
            </p>
          )}
        </div>
        <div className="border-t border-gray-100 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Huỷ
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Assign Staff Modal ────────────────────────────────────────────────────────

interface AssignStaffModalProps {
  accountId: string;
  accountName: string;
  onClose: () => void;
}

function AssignStaffModal({ accountId, accountName, onClose }: AssignStaffModalProps) {
  const { zaloAccountAssignments, setZaloAccountAssignment } = useDemoConfigStore();
  const staffUsers = DEMO_USERS.filter((u) => u.role === "STAFF");
  const departments = Array.from(new Set(staffUsers.map((u) => u.department))).sort();
  const current = zaloAccountAssignments[accountId] ?? [];
  const [selected, setSelected] = useState<string[]>(current);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");

  const visible = staffUsers.filter((u) => {
    const q = search.trim().toLowerCase();
    return (
      (!q || u.displayName.toLowerCase().includes(q)) &&
      (deptFilter === "all" || u.department === deptFilter)
    );
  });

  const toggle = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const handleSave = () => {
    setZaloAccountAssignment(accountId, selected);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-[440px] rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="font-semibold text-gray-800">Gán nhân viên — {accountName}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search + filter */}
        <div className="flex gap-2 border-b border-gray-100 px-6 py-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm theo tên..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-sm text-gray-800 placeholder-gray-400 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
            />
          </div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 focus:border-green-400 focus:outline-none focus:ring-2 focus:ring-green-100"
          >
            <option value="all">Tất cả phòng</option>
            {departments.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="max-h-64 overflow-y-auto px-4 py-3">
          {visible.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">Không tìm thấy nhân viên nào</p>
          ) : (
            <div className="space-y-1">
              {visible.map((u) => {
                const isChecked = selected.includes(u.id);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggle(u.id)}
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-gray-50 text-left"
                  >
                    {/* circular checkbox */}
                    <span
                      className={cn(
                        "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                        isChecked
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 bg-white",
                      )}
                    >
                      {isChecked && (
                        <Check className="h-3 w-3 text-white" strokeWidth={3} />
                      )}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.displayName}</p>
                      <p className="text-xs text-gray-400">{u.department}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4">
          <span className="text-xs text-gray-400">
            {selected.length} nhân viên được chọn
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleSave}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            >
              Lưu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Tab 1: Liên kết tài khoản ────────────────────────────────────────────────

function LienKetTab() {
  const {
    zaloConnectionStatus,
    zaloAccountAssignments,
    setZaloConnectionStatus,
    setZaloAccountAssignment,
  } = useDemoConfigStore();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [qrModal, setQrModal] = useState<{ accountId: string; accountName: string } | null>(null);
  const [assignModal, setAssignModal] = useState<{ accountId: string; accountName: string } | null>(null);
  const [showNewQR, setShowNewQR] = useState(false);

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Tổng cộng {zaloAccounts.length} tài khoản đã liên kết
        </p>
        <button
          onClick={() => setShowNewQR(true)}
          className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Liên kết tài khoản mới
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tên tài khoản
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nhân viên được gán
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ngày kết nối
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody>
            {zaloAccounts.map((account) => {
              const status = zaloConnectionStatus[account.id] ?? "connected";
              const assignedIds = zaloAccountAssignments[account.id] ?? [];
              const assignedNames = DEMO_USERS.filter((u) => assignedIds.includes(u.id));
              const isExpanded = expandedId === account.id;

              return (
                <>
                  <tr
                    key={account.id}
                    className={cn(
                      "border-b border-gray-100 last:border-0",
                      isExpanded && "bg-green-50/30",
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : account.id)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                          Z
                        </div>
                        <span className="font-medium text-gray-800">{account.displayName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={status} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600">
                      {assignedIds.length} người
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(account.linkedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {status === "expired" && (
                          <button
                            onClick={() =>
                              setQrModal({ accountId: account.id, accountName: account.displayName })
                            }
                            className="flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                          >
                            <QrCode className="h-3.5 w-3.5" /> Quét lại QR
                          </button>
                        )}
                        <button
                          onClick={() =>
                            setAssignModal({ accountId: account.id, accountName: account.displayName })
                          }
                          className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
                        >
                          <Users className="h-3.5 w-3.5" /> Gán nhân viên
                        </button>
                        {status === "connected" && (
                          <button
                            onClick={() =>
                              setZaloConnectionStatus(account.id, "disconnected")
                            }
                            className="flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-50"
                          >
                            <Unplug className="h-3.5 w-3.5" /> Ngắt kết nối
                          </button>
                        )}
                        {status === "disconnected" && (
                          <button
                            onClick={() =>
                              setQrModal({ accountId: account.id, accountName: account.displayName })
                            }
                            className="flex items-center gap-1 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100"
                          >
                            <QrCode className="h-3.5 w-3.5" /> Kết nối lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${account.id}-expanded`} className="bg-green-50/20">
                      <td colSpan={5} className="px-8 pb-3 pt-1">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                          Nhân viên được gán ({assignedNames.length})
                        </p>
                        {assignedNames.length === 0 ? (
                          <p className="text-xs text-gray-400">Chưa gán nhân viên nào</p>
                        ) : (
                          <div className="flex flex-wrap gap-2">
                            {assignedNames.map((u) => (
                              <span
                                key={u.id}
                                className="inline-flex items-center gap-1.5 rounded-full bg-green-100 pl-3 pr-1.5 py-1 text-xs font-medium text-green-800"
                              >
                                {u.displayName} · {u.department}
                                <button
                                  onClick={() =>
                                    setZaloAccountAssignment(
                                      account.id,
                                      assignedIds.filter((id) => id !== u.id),
                                    )
                                  }
                                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-green-200 text-green-600 hover:text-green-800"
                                  title={`Xóa ${u.displayName}`}
                                >
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {(qrModal || showNewQR) && (
        <QRModal
          accountName={qrModal?.accountName ?? ""}
          onSuccess={() => {
            if (qrModal) setZaloConnectionStatus(qrModal.accountId, "connected");
          }}
          onClose={() => {
            setQrModal(null);
            setShowNewQR(false);
          }}
        />
      )}

      {/* Assign Staff Modal */}
      {assignModal && (
        <AssignStaffModal
          accountId={assignModal.accountId}
          accountName={assignModal.accountName}
          onClose={() => setAssignModal(null)}
        />
      )}
    </div>
  );
}

// ─── Tab 2: Đồng bộ dữ liệu ───────────────────────────────────────────────────

function DongBoTab() {
  const { syncHistory, addSyncReport } = useDemoConfigStore();
  const [syncing, setSyncing] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleSync = (accountId: string) => {
    setSyncing(accountId);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setSyncing(null);
          addSyncReport(accountId, {
            id: `sync_${Date.now()}`,
            accountId,
            triggeredAt: new Date().toISOString(),
            totalMessages: Math.floor(Math.random() * 800 + 200),
            totalImages: Math.floor(Math.random() * 120 + 30),
            totalDocs: Math.floor(Math.random() * 40 + 10),
            totalVideos: Math.floor(Math.random() * 20 + 5),
            totalSizeMB: Math.floor(Math.random() * 3000 + 500),
            largeVideoCount: Math.floor(Math.random() * 4),
          });
          return 0;
        }
        return p + 10;
      });
    }, 250);
  };

  return (
    <div className="space-y-4">
      {zaloAccounts.map((account) => {
        const isSyncing = syncing === account.id;
        const reports = syncHistory[account.id] ?? [];
        const latest = reports[0];

        return (
          <div key={account.id} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                  Z
                </div>
                <div>
                  <p className="font-medium text-gray-800">{account.displayName}</p>
                  <p className="text-xs text-gray-400">
                    {latest
                      ? `Đồng bộ lần cuối: ${formatDateTime(latest.triggeredAt)}`
                      : "Chưa đồng bộ"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleSync(account.id)}
                disabled={!!syncing}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isSyncing
                    ? "cursor-not-allowed bg-gray-100 text-gray-400"
                    : "bg-green-600 text-white hover:bg-green-700",
                )}
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                {isSyncing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
              </button>
            </div>

            {isSyncing && (
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-gray-400">
                  <span>Đang kéo dữ liệu...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-200"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {latest && !isSyncing && (
              <div className="mt-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-6">
                {[
                  { label: "Tin nhắn", value: latest.totalMessages.toLocaleString() },
                  { label: "Hình ảnh", value: latest.totalImages.toLocaleString() },
                  { label: "Tài liệu", value: latest.totalDocs.toLocaleString() },
                  { label: "Video", value: latest.totalVideos.toLocaleString() },
                  { label: "Dung lượng", value: `${(latest.totalSizeMB / 1024).toFixed(1)} GB` },
                  {
                    label: "File >300MB",
                    value: latest.largeVideoCount.toString(),
                    highlight: latest.largeVideoCount > 0,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <p
                      className={cn(
                        "text-lg font-bold",
                        stat.highlight ? "text-amber-600" : "text-gray-800",
                      )}
                    >
                      {stat.value}
                    </p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            )}

            {reports.length > 1 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                  Lịch sử đồng bộ ({reports.length - 1} lần trước)
                </summary>
                <div className="mt-2 overflow-hidden rounded-lg border border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-3 py-2 text-left text-gray-500">Thời gian</th>
                        <th className="px-3 py-2 text-right text-gray-500">Tin nhắn</th>
                        <th className="px-3 py-2 text-right text-gray-500">Dung lượng</th>
                        <th className="px-3 py-2 text-right text-gray-500">File lớn</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.slice(1).map((r) => (
                        <tr key={r.id} className="border-t border-gray-50">
                          <td className="px-3 py-2 text-gray-600">{formatDateTime(r.triggeredAt)}</td>
                          <td className="px-3 py-2 text-right text-gray-600">{r.totalMessages}</td>
                          <td className="px-3 py-2 text-right text-gray-600">
                            {(r.totalSizeMB / 1024).toFixed(1)} GB
                          </td>
                          <td className="px-3 py-2 text-right">
                            {r.largeVideoCount > 0 ? (
                              <span className="text-amber-600">{r.largeVideoCount}</span>
                            ) : (
                              <span className="text-gray-400">0</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Tab 3: Theo dõi file lớn ─────────────────────────────────────────────────

function FileLonTab() {
  const [filterGroup, setFilterGroup] = useState("all");
  const [filterAccount, setFilterAccount] = useState("all");

  const filtered = MOCK_LARGE_FILES.filter(
    (f) =>
      (filterGroup === "all" || f.groupId === filterGroup) &&
      (filterAccount === "all" || f.accountId === filterAccount),
  );

  const sizeBadge = (mb: number) => {
    if (mb > 500)
      return (
        <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
          {mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`}
        </span>
      );
    return (
      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
        {mb} MB
      </span>
    );
  };

  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <Filter className="h-4 w-4 text-gray-400" />
        <select
          value={filterGroup}
          onChange={(e) => setFilterGroup(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="all">Tất cả nhóm</option>
          {vendorGroups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
        <select
          value={filterAccount}
          onChange={(e) => setFilterAccount(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 focus:outline-none focus:ring-1 focus:ring-green-500"
        >
          <option value="all">Tất cả tài khoản</option>
          {zaloAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.displayName}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-gray-400">{filtered.length} file</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tên file
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Dung lượng
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nhóm chat
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Tài khoản Zalo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                Thời điểm nhận
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const account = zaloAccounts.find((a) => a.id === f.accountId);
              return (
                <tr key={f.id} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileVideo className="h-4 w-4 shrink-0 text-gray-400" />
                      <span className="max-w-[240px] truncate text-sm text-gray-800">{f.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">{sizeBadge(f.sizeMB)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{f.groupName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{account?.displayName}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{formatDateTime(f.receivedAt)}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="py-10 text-center text-sm text-gray-400">
                  Không có file nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const TABS = [
  { id: "lien-ket", label: "Liên kết tài khoản" },
  { id: "dong-bo", label: "Đồng bộ dữ liệu" },
  { id: "file-lon", label: "Theo dõi file lớn" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function NhaCungCapPage() {
  const [activeTab, setActiveTab] = useState<TabId>("lien-ket");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const idx = TABS.findIndex((t) => t.id === activeTab);
    const el = tabRefs.current[idx];
    if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeTab]);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Nhà Cung Cấp</h1>
      </div>

      {/* Tab bar */}
      <div className="relative mb-6 border-b border-gray-200">
        <div className="flex">
          {TABS.map((tab, i) => (
            <button
              key={tab.id}
              ref={(el) => { tabRefs.current[i] = el; }}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "border-0 bg-transparent px-4 py-2.5 text-sm outline-none ring-0 transition-colors focus:outline-none focus-visible:outline-none",
                activeTab === tab.id
                  ? "font-semibold text-green-600"
                  : "font-medium text-gray-400 hover:font-semibold hover:text-green-600",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {/* Sliding underline indicator */}
        <span
          className="absolute bottom-0 h-[2.5px] rounded-full bg-green-600 transition-all duration-200 ease-out"
          style={{ left: indicator.left, width: indicator.width }}
        />
      </div>

      {activeTab === "lien-ket" && <LienKetTab />}
      {activeTab === "dong-bo" && <DongBoTab />}
      {activeTab === "file-lon" && <FileLonTab />}
    </div>
  );
}
