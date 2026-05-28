import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { DemoUser, DownloadPermission, VendorAttachment, VendorMessageContentType } from "@/types/zalo";

// ─── Vendor Tag ───────────────────────────────────────────────────────────────

export interface VendorTag {
  id: string;
  name: string;
  color: string; // hex color
}

export const TAG_COLORS = [
  "#E53935", // red
  "#E91E9C", // pink
  "#F57C00", // orange
  "#FDD835", // yellow
  "#43A047", // green
  "#00BCD4", // teal
  "#1E88E5", // blue
  "#7B1FA2", // purple
] as const;

const DEFAULT_VENDOR_TAGS: VendorTag[] = [
  { id: "tag_001", name: "Nhà sản xuất", color: "#E53935" },
  { id: "tag_002", name: "Nhà phân phối", color: "#F57C00" },
  { id: "tag_003", name: "Nhà nhập khẩu", color: "#1E88E5" },
  { id: "tag_004", name: "Dịch vụ", color: "#43A047" },
  { id: "tag_005", name: "Thiết yếu", color: "#7B1FA2" },
];

export interface ForwardedMessage {
  id: string;
  originalMessageId: string;
  originalContent: string | null;
  originalContentType: VendorMessageContentType;
  originalAttachments: VendorAttachment[];
  vendorGroupId: string;
  vendorGroupName: string;
  forwardedByUserId: string;
  forwardedByName: string;
  forwardedAt: string;
  comment: string | null;
}

export type ZaloConnectionStatus = "connected" | "expired" | "disconnected";

export interface SyncReport {
  id: string;
  accountId: string;
  triggeredAt: string;
  totalMessages: number;
  totalImages: number;
  totalDocs: number;
  totalVideos: number;
  totalSizeMB: number;
  largeVideoCount: number; // videos > 300MB
}

// ─── Demo users (matches internal staff in mockOrg.ts) ───────────────────────

export const DEMO_USERS: DemoUser[] = [
  {
    id: "u_admin",
    displayName: "Diệp Nguyên",
    email: "admin@quocnam.com",
    avatarUrl: null,
    role: "ADMIN",
    department: "Admin",
  },
  {
    id: "u_huyen",
    displayName: "Tăng Thị Huyền",
    email: "huyen@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Vận Hành",
  },
  {
    id: "u_thu_an",
    displayName: "Vũ Thu An",
    email: "an@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Kho Hàng",
  },
  {
    id: "u_diem_chi",
    displayName: "Lê Diễm Chi",
    email: "chi@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Kho Hàng",
  },
  {
    id: "u_le_binh",
    displayName: "Lệ Bình",
    email: "binh@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Kho Hàng",
  },
  {
    id: "u_phuong_truc",
    displayName: "Phan Thị Phương Trúc",
    email: "truc@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Điều hành",
  },
  {
    id: "u_tieu_my",
    displayName: "Nguyễn Tiểu My",
    email: "my@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Điều hành",
  },
  {
    id: "u_kim_vui",
    displayName: "Huỳnh Kim Vui",
    email: "vui@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Vận Hành",
  },
  {
    id: "u_ngoc_han",
    displayName: "Lưu Ngọc Hân",
    email: "han@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Vận Hành",
  },
  {
    id: "u_thanh_thai",
    displayName: "Trương Thành Thái",
    email: "thai@quocnam.com",
    avatarUrl: null,
    role: "STAFF",
    department: "Kho Hàng",
  },
];

// ─── Default group memberships ────────────────────────────────────────────────
// groupId → staffId[] who can access this group

const DEFAULT_GROUP_MEMBERSHIPS: Record<string, string[]> = {
  vg_001: ["u_huyen", "u_thu_an"],
  vg_002: ["u_huyen", "u_diem_chi"],
  vg_003: ["u_thu_an", "u_diem_chi"],
  vg_004: ["u_diem_chi", "u_le_binh"],
  vg_005: ["u_huyen"],
};

// ─── Default Zalo account assignments ────────────────────────────────────────
// zaloAccountId → staffId[] who can represent this account

const DEFAULT_ZALO_ASSIGNMENTS: Record<string, string[]> = {
  za_001: ["u_huyen", "u_thu_an"],
  za_002: ["u_diem_chi", "u_le_binh"],
};

// ─── Default download permissions ────────────────────────────────────────────
// groupId → staffId → permissions (all enabled by default)

const buildDefaultDownloadPermissions = (): Record<
  string,
  Record<string, DownloadPermission>
> => {
  const groups = Object.keys(DEFAULT_GROUP_MEMBERSHIPS);
  const result: Record<string, Record<string, DownloadPermission>> = {};
  for (const groupId of groups) {
    result[groupId] = {};
    for (const staffId of DEFAULT_GROUP_MEMBERSHIPS[groupId]) {
      result[groupId][staffId] = {
        canDownloadImages: true,
        canDownloadFiles: true,
        canDownloadVideos: true,
      };
    }
  }
  return result;
};

// ─── Store interface ──────────────────────────────────────────────────────────

interface DemoConfigState {
  // True when logged in via "Demo nhanh" — suppresses real API error dialogs
  isDemoSession: boolean;

  // Current simulated user (who is "logged in" for this demo session)
  currentUser: DemoUser;

  // groupId → staffId[] with access
  groupMemberships: Record<string, string[]>;

  // zaloAccountId → staffId[] who represent that account
  zaloAccountAssignments: Record<string, string[]>;

  // groupId → staffId → download permissions
  downloadPermissions: Record<string, Record<string, DownloadPermission>>;

  // groupId → watermark enabled
  watermarkEnabled: Record<string, boolean>;

  // zaloAccountId → connection status
  zaloConnectionStatus: Record<string, ZaloConnectionStatus>;

  // groupId → custom display name (overrides name from vendor-groups.json)
  groupDisplayNames: Record<string, string>;

  // accountId → sync reports (newest first)
  syncHistory: Record<string, SyncReport[]>;

  // groupId → phone number masking enabled (hidden from non-admin)
  phoneHidden: Record<string, boolean>;

  // groupIds that are pinned — ordered by most-recently-pinned first (index 0 = top)
  pinnedGroups: string[];

  // vendor tags (classification labels)
  vendorTags: VendorTag[];

  // groupId → tagIds[]
  groupTagIds: Record<string, string[]>;

  // forwarded messages (feature #11): staff forwards vendor message to admin DM
  forwardedMessages: ForwardedMessage[];

  // ─── Actions ───────────────────────────────────────────────────────────────

  setDemoSession: (v: boolean) => void;
  setCurrentUser: (user: DemoUser) => void;

  setGroupMembership: (groupId: string, staffIds: string[]) => void;
  addStaffToGroup: (groupId: string, staffId: string) => void;
  removeStaffFromGroup: (groupId: string, staffId: string) => void;

  setZaloAccountAssignment: (zaloAccountId: string, staffIds: string[]) => void;

  setDownloadPermission: (
    groupId: string,
    staffId: string,
    perm: Partial<DownloadPermission>,
  ) => void;

  toggleWatermark: (groupId: string) => void;
  setWatermark: (groupId: string, enabled: boolean) => void;

  togglePhoneHidden: (groupId: string) => void;

  setZaloConnectionStatus: (accountId: string, status: ZaloConnectionStatus) => void;
  setGroupDisplayName: (groupId: string, name: string) => void;
  addSyncReport: (accountId: string, report: SyncReport) => void;
  togglePinGroup: (groupId: string) => void;

  addVendorTag: (name: string, color: string) => void;
  updateVendorTag: (id: string, name: string, color: string) => void;
  deleteVendorTag: (id: string) => void;
  toggleGroupTag: (groupId: string, tagId: string) => void;
  reorderVendorTags: (fromIndex: number, toIndex: number) => void;

  addForwardedMessage: (msg: ForwardedMessage) => void;
  clearForwardedMessages: () => void;
  dismissForwardedMessage: (id: string) => void;

  // Convenience: check if current user can access a group
  canCurrentUserAccessGroup: (groupId: string) => boolean;

  // Convenience: get download permission for current user in a group
  getCurrentUserDownloadPermission: (groupId: string) => DownloadPermission;

  // Reset to defaults (useful for fresh demo session)
  resetToDefaults: () => void;
}

// ─── Store implementation ─────────────────────────────────────────────────────

export const useDemoConfigStore = create<DemoConfigState>()(
  persist(
    (set, get) => ({
      isDemoSession: false,
      currentUser: DEMO_USERS[0], // Default: Admin
      groupMemberships: DEFAULT_GROUP_MEMBERSHIPS,
      zaloAccountAssignments: DEFAULT_ZALO_ASSIGNMENTS,
      downloadPermissions: buildDefaultDownloadPermissions(),
      watermarkEnabled: {
        vg_001: true,
        vg_002: true,
        vg_003: true,
        vg_004: true,
        vg_005: true,
      },
      zaloConnectionStatus: {
        za_001: "connected",
        za_002: "connected",
      },
      groupDisplayNames: {},
      syncHistory: {},
      phoneHidden: {},
      pinnedGroups: [],
      forwardedMessages: [],
      vendorTags: DEFAULT_VENDOR_TAGS,
      groupTagIds: {},

      setDemoSession: (v) => set({ isDemoSession: v }),
      setCurrentUser: (user) => set({ currentUser: user }),

      setGroupMembership: (groupId, staffIds) =>
        set((state) => ({
          groupMemberships: {
            ...state.groupMemberships,
            [groupId]: staffIds,
          },
        })),

      addStaffToGroup: (groupId, staffId) =>
        set((state) => {
          const current = state.groupMemberships[groupId] ?? [];
          if (current.includes(staffId)) return state;
          return {
            groupMemberships: {
              ...state.groupMemberships,
              [groupId]: [...current, staffId],
            },
          };
        }),

      removeStaffFromGroup: (groupId, staffId) =>
        set((state) => ({
          groupMemberships: {
            ...state.groupMemberships,
            [groupId]: (state.groupMemberships[groupId] ?? []).filter(
              (id) => id !== staffId,
            ),
          },
        })),

      setZaloAccountAssignment: (zaloAccountId, staffIds) =>
        set((state) => ({
          zaloAccountAssignments: {
            ...state.zaloAccountAssignments,
            [zaloAccountId]: staffIds,
          },
        })),

      setDownloadPermission: (groupId, staffId, perm) =>
        set((state) => ({
          downloadPermissions: {
            ...state.downloadPermissions,
            [groupId]: {
              ...(state.downloadPermissions[groupId] ?? {}),
              [staffId]: {
                ...(state.downloadPermissions[groupId]?.[staffId] ?? {
                  canDownloadImages: true,
                  canDownloadFiles: true,
                  canDownloadVideos: true,
                }),
                ...perm,
              },
            },
          },
        })),

      toggleWatermark: (groupId) =>
        set((state) => ({
          watermarkEnabled: {
            ...state.watermarkEnabled,
            [groupId]: !(state.watermarkEnabled[groupId] ?? true),
          },
        })),

      setWatermark: (groupId, enabled) =>
        set((state) => ({
          watermarkEnabled: {
            ...state.watermarkEnabled,
            [groupId]: enabled,
          },
        })),

      togglePhoneHidden: (groupId) =>
        set((state) => ({
          phoneHidden: {
            ...state.phoneHidden,
            [groupId]: !(state.phoneHidden[groupId] ?? false),
          },
        })),

      setZaloConnectionStatus: (accountId, status) =>
        set((state) => ({
          zaloConnectionStatus: {
            ...state.zaloConnectionStatus,
            [accountId]: status,
          },
        })),

      setGroupDisplayName: (groupId, name) =>
        set((state) => ({
          groupDisplayNames: {
            ...state.groupDisplayNames,
            [groupId]: name,
          },
        })),

      addSyncReport: (accountId, report) =>
        set((state) => ({
          syncHistory: {
            ...state.syncHistory,
            [accountId]: [report, ...(state.syncHistory[accountId] ?? [])].slice(0, 10),
          },
        })),

      togglePinGroup: (groupId) =>
        set((state) => {
          const pinned = state.pinnedGroups;
          if (pinned.includes(groupId)) {
            return { pinnedGroups: pinned.filter((id) => id !== groupId) };
          }
          return { pinnedGroups: [groupId, ...pinned] };
        }),

      addVendorTag: (name, color) =>
        set((state) => ({
          vendorTags: [
            ...state.vendorTags,
            { id: `tag_${Date.now()}`, name, color },
          ],
        })),

      updateVendorTag: (id, name, color) =>
        set((state) => ({
          vendorTags: state.vendorTags.map((t) =>
            t.id === id ? { ...t, name, color } : t,
          ),
        })),

      deleteVendorTag: (id) =>
        set((state) => ({
          vendorTags: state.vendorTags.filter((t) => t.id !== id),
          groupTagIds: Object.fromEntries(
            Object.entries(state.groupTagIds).map(([gId, tagIds]) => [
              gId,
              tagIds.filter((tid) => tid !== id),
            ]),
          ),
        })),

      toggleGroupTag: (groupId, tagId) =>
        set((state) => {
          const current = state.groupTagIds[groupId] ?? [];
          // single-select: deselect if same tag, otherwise replace
          const next = current[0] === tagId ? [] : [tagId];
          return { groupTagIds: { ...state.groupTagIds, [groupId]: next } };
        }),

      reorderVendorTags: (fromIndex, toIndex) =>
        set((state) => {
          const tags = [...state.vendorTags];
          const [moved] = tags.splice(fromIndex, 1);
          tags.splice(toIndex, 0, moved);
          return { vendorTags: tags };
        }),

      addForwardedMessage: (msg) =>
        set((state) => ({
          forwardedMessages: [msg, ...state.forwardedMessages],
        })),

      clearForwardedMessages: () => set({ forwardedMessages: [] }),

      dismissForwardedMessage: (id) =>
        set((state) => ({
          forwardedMessages: state.forwardedMessages.filter((m) => m.id !== id),
        })),

      canCurrentUserAccessGroup: (groupId) => {
        const { currentUser, groupMemberships } = get();
        if (currentUser.role === "ADMIN") return true;
        return (groupMemberships[groupId] ?? []).includes(currentUser.id);
      },

      getCurrentUserDownloadPermission: (groupId) => {
        const { currentUser, downloadPermissions } = get();
        if (currentUser.role === "ADMIN") {
          return {
            canDownloadImages: true,
            canDownloadFiles: true,
            canDownloadVideos: true,
          };
        }
        return (
          downloadPermissions[groupId]?.[currentUser.id] ?? {
            canDownloadImages: false,
            canDownloadFiles: false,
            canDownloadVideos: false,
          }
        );
      },

      resetToDefaults: () =>
        set({
          currentUser: DEMO_USERS[0],
          groupMemberships: DEFAULT_GROUP_MEMBERSHIPS,
          zaloAccountAssignments: DEFAULT_ZALO_ASSIGNMENTS,
          downloadPermissions: buildDefaultDownloadPermissions(),
          watermarkEnabled: {
            vg_001: true,
            vg_002: true,
            vg_003: true,
            vg_004: true,
            vg_005: true,
          },
          zaloConnectionStatus: { za_001: "connected", za_002: "connected" },
          groupDisplayNames: {},
          syncHistory: {},
          phoneHidden: {},
          pinnedGroups: [],
          forwardedMessages: [],
          vendorTags: DEFAULT_VENDOR_TAGS,
          groupTagIds: {},
        }),
    }),
    {
      name: "demo-config-storage",
      partialize: (state) => ({
        // NOTE: currentUser and isDemoSession are intentionally excluded from
        // localStorage so each browser window maintains its own independent session.
        // This enables multi-user demo with two windows (same Chrome profile).
        groupMemberships: state.groupMemberships,
        zaloAccountAssignments: state.zaloAccountAssignments,
        downloadPermissions: state.downloadPermissions,
        watermarkEnabled: state.watermarkEnabled,
        zaloConnectionStatus: state.zaloConnectionStatus,
        groupDisplayNames: state.groupDisplayNames,
        syncHistory: state.syncHistory,
        phoneHidden: state.phoneHidden,
        pinnedGroups: state.pinnedGroups,
        forwardedMessages: state.forwardedMessages,
        vendorTags: state.vendorTags,
        groupTagIds: state.groupTagIds,
      }),
    },
  ),
);

// Cross-tab sync: when another window (same Chrome profile) updates localStorage,
// re-hydrate so the group list updates immediately without a page refresh.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === "demo-config-storage") {
      useDemoConfigStore.persist.rehydrate();
    }
  });
}
