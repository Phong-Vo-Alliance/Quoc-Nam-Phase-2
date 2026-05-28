import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Building2,
  MessageSquare,
  Package,
  Users,
  Briefcase,
  FileText,
  Shield,
  ClipboardList,
  ActivitySquare,
  Settings,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Store,
  PanelLeftClose,
  PanelLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  isNew?: boolean;
  children: NavItem[];
}

type NavEntry = NavGroup | (NavItem & { isGroup: false });

const NAV_STRUCTURE: NavGroup[] = [
  {
    label: "Quản Lý Phòng Ban & Nhóm chat",
    icon: Building2,
    children: [
      { label: "Phòng ban", path: "/admin-demo/phong-ban", icon: Building2 },
      { label: "Nhóm chat", path: "/admin-demo/nhom-chat", icon: MessageSquare },
    ],
  },
  {
    label: "Quản Lý NCC",
    icon: Package,
    isNew: true,
    children: [
      { label: "Nhà Cung Cấp", path: "/admin-demo/nha-cung-cap", icon: Store },
      { label: "Nhóm NCC", path: "/admin-demo/nhom-ncc", icon: Users },
      { label: "Yêu Cầu Xem SĐT", path: "/admin-demo/yeu-cau-xem-sdt", icon: Shield },
    ],
  },
  {
    label: "Quản Lý Loại Việc",
    icon: Briefcase,
    children: [
      { label: "Loại việc", path: "/admin-demo/loai-viec", icon: Briefcase },
      { label: "Báo cáo", path: "/admin-demo/bao-cao-loai-viec", icon: FileText },
    ],
  },
  {
    label: "Quản Lý User & Phân Quyền",
    icon: Shield,
    children: [
      { label: "Danh sách user", path: "/admin-demo/users", icon: Users },
      { label: "Quản lý mật khẩu", path: "/admin-demo/mat-khau", icon: Shield },
      { label: "Quản lý thiết bị", path: "/admin-demo/thiet-bi", icon: Settings },
      { label: "Phân quyền", path: "/admin-demo/phan-quyen", icon: Shield },
    ],
  },
  {
    label: "Quản Lý Dạng Checklist",
    icon: ClipboardList,
    children: [
      { label: "Dạng checklist", path: "/admin-demo/dang-checklist", icon: ClipboardList },
      { label: "Báo cáo", path: "/admin-demo/bao-cao-checklist", icon: FileText },
    ],
  },
  {
    label: "Quản Lý Trạng Thái Công việc",
    icon: ActivitySquare,
    children: [
      { label: "Trạng thái công việc", path: "/admin-demo/trang-thai", icon: ActivitySquare },
    ],
  },
];

const BOTTOM_LINKS: NavItem[] = [
  { label: "Cài Đặt", path: "/admin-demo/cai-dat", icon: Settings },
  { label: "Nhật Ký", path: "/admin-demo/nhat-ky", icon: BookOpen },
];

function useInitialOpenGroups(location: { pathname: string }) {
  const initialOpen: Record<string, boolean> = {
    "Quản Lý Phòng Ban & Nhóm chat": true,
    "Quản Lý NCC": true,
  };
  NAV_STRUCTURE.forEach((g) => {
    if (g.children.some((c) => location.pathname.startsWith(c.path))) {
      initialOpen[g.label] = true;
    }
  });
  return initialOpen;
}

export function AdminDemoSidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => useInitialOpenGroups(location),
  );

  const toggleGroup = (label: string) =>
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <aside
      className={cn(
        "flex h-screen flex-col bg-brand-600 text-white transition-all duration-200",
        collapsed ? "w-16" : "w-60",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center px-4">
        {!collapsed && (
          <span className="text-base font-bold tracking-tight">
            Quốc Nam Admin
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2">
        {NAV_STRUCTURE.map((group) => {
          const isOpen = openGroups[group.label] ?? false;
          const GroupIcon = group.icon;

          return (
            <div key={group.label}>
              <button
                onClick={() => toggleGroup(group.label)}
                className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm font-medium text-white/90 hover:bg-white/10"
              >
                <GroupIcon className="h-4 w-4 shrink-0 text-white/70" />
                {!collapsed && (
                  <>
                    <span className="flex-1 leading-tight">{group.label}</span>
                    {group.isNew && (
                      <span className="rounded bg-green-400 px-1.5 py-0.5 text-[10px] font-bold text-green-900">
                        Mới
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronDown className="h-3.5 w-3.5 text-white/50" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-white/50" />
                    )}
                  </>
                )}
              </button>

              {!collapsed && isOpen && (
                <div className="ml-2">
                  {group.children.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <NavLink
                        key={item.path}
                        to={item.path}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-2 rounded-sm px-3 py-2 text-sm transition-colors",
                            isActive
                              ? "bg-brand-700 font-medium text-white"
                              : "text-white/75 hover:bg-white/10 hover:text-white",
                          )
                        }
                      >
                        <ItemIcon className="h-3.5 w-3.5 shrink-0" />
                        <span>{item.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* Bottom standalone links */}
        <div className="mt-2 border-t border-white/10 pt-2">
          {BOTTOM_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-3 py-2.5 text-sm transition-colors",
                    isActive
                      ? "bg-brand-700 font-medium text-white"
                      : "text-white/75 hover:bg-white/10 hover:text-white",
                  )
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="flex w-full items-center justify-center rounded p-2 text-white/60 hover:bg-white/10 hover:text-white"
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
