import React from "react";
import { hasLeaderPermissions } from "@/utils/roleUtils";
import {
  MessageSquareText,
  Users,
  Monitor,
  Wrench,
  LogOut,
  Zap,
  Star,
  AlarmClock,
  ListTodo,
  User as UserIcon,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import QuocnamLogo from "@/assets/Quocnam_logo.png";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { QuickMessageManager } from "./QuickMessageManager";
import { TodoListManager } from "./TodoListManager";

interface MainSidebarProps {
  activeView: "workspace" | "lead";
  onSelect: (view: "workspace" | "lead" | "pinned" | "logout") => void;
  workspaceMode?: "default" | "pinned";
  viewMode?: "lead" | "staff";
  currentUserName?: string;

  pendingTasks?: {
    id: string;
    title: string;
    workTypeName?: string;
    pendingUntil?: string;
  }[];
  showPinnedToast: boolean;

  onOpenWorkTypeManager?: () => void;
}

export const MainSidebar: React.FC<MainSidebarProps> = ({
  activeView,
  onSelect,
  workspaceMode,
  viewMode,
  pendingTasks: initialPending = [],
  showPinnedToast,
  currentUserName = "",
  onOpenWorkTypeManager,
}) => {
  const [openTools, setOpenTools] = React.useState(false);
  const [openQuickMsg, setOpenQuickMsg] = React.useState(false);
  const [openTodoList, setOpenTodoList] = React.useState(false);
  const [openPending, setOpenPending] = React.useState(false);
  const [pendingTasks, setPendingTasks] = React.useState<typeof initialPending>(
    initialPending ?? [],
  );

  const [openDateModal, setOpenDateModal] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<string | null>(null);
  const [newDate, setNewDate] = React.useState<Date | undefined>(undefined);

  // NEW: Profile popover open state
  const [openProfile, setOpenProfile] = React.useState(false);

  const isShowPhasedFeatures = false;

  // Helper màu nền cho từng trạng thái ngày
  const getTaskBg = (dateStr?: string) => {
    if (!dateStr) return "bg-gray-50 border-gray-200";
    const d = new Date(dateStr);
    const today = new Date();
    const isSameDay = d.toDateString() === today.toDateString();
    const isPast = d < today;
    if (isPast) return "bg-red-50 border-red-200"; // trễ hạn
    if (isSameDay) return "bg-amber-50 border-amber-200"; // hôm nay
    return "bg-gray-50 border-gray-200"; // chưa tới ngày
  };

  // Helper text trạng thái ngày
  const getStatusText = (dateStr?: string) => {
    if (!dateStr) return "Chờ xử lý";
    const d = new Date(dateStr);
    const today = new Date();
    const isSameDay = d.toDateString() === today.toDateString();
    const isPast = d < today;
    if (isPast) return "Trễ hạn";
    if (isSameDay) return "Bắt đầu hôm nay";
    return "Chờ tới ngày";
  };

  const handleOpenDateModal = (taskId: string) => {
    setSelectedTask(taskId);
    const task = pendingTasks.find((t) => t.id === taskId);
    setNewDate(task?.pendingUntil ? new Date(task.pendingUntil) : new Date());
    setOpenDateModal(true);
  };

  // 🆕 Lưu ngày mới
  const handleSaveDate = () => {
    if (!newDate || !selectedTask) return;
    const updated = pendingTasks.map((t) =>
      t.id === selectedTask ? { ...t, pendingUntil: newDate.toISOString() } : t,
    );
    setPendingTasks(updated);
    setOpenDateModal(false);
    setSelectedTask(null);
  };

  // 🧠 Không cho chọn ngày quá khứ
  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const initials = React.useMemo(() => {
    const parts = (currentUserName || "")
      .trim()
      .split(/\s+/)
      .filter((p) => p && p !== "-" && p !== "–"); // Filter out dashes
    if (parts.length === 0) return "U";
    const chars = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
    return chars.join("");
  }, [currentUserName]);

  return (
    <aside className="flex flex-col items-center justify-between w-16 h-screen bg-brand-600 text-white shadow-lg">
      {/* Logo */}
      <div className="flex flex-col items-center mt-4">
        <img
          src={QuocnamLogo}
          alt="Quốc Nam Logo"
          className="h-10 w-10 rounded-full border border-white/30 shadow-sm"
        />

        {/* Icon section */}
        <div className="mt-6 flex flex-col items-center gap-5">
          {/* Workspace */}
          <button
            title="Tin nhắn"
            onClick={() => onSelect("workspace")}
            data-testid="sidebar-messages-button"
            className={cn(
              "p-2 rounded-lg transition-colors",
              activeView === "workspace" && workspaceMode !== "pinned"
                ? "bg-white/20 text-white"
                : "bg-brand-600 text-white/90 hover:text-white hover:bg-white/10",
            )}
          >
            <MessageSquareText className="h-6 w-6" />
          </button>

          {/* Team Monitor (phase next) */}
          {/* {hasLeaderPermissions() && (
            <button
              title="Team Monitor – Lead"
              onClick={() => onSelect("lead")}
              className={cn(
                "p-2 rounded-lg transition-colors",
                activeView === "lead"
                  ? "bg-white/20 text-white"
                  : "bg-brand-600 text-white/90 hover:text-white hover:bg-white/10"
              )}
            >
              <Monitor className="h-6 w-6" />
            </button>
          )} */}
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col items-center gap-5 mb-4">
        {isShowPhasedFeatures && (
          <>
            {/* Pending Tasks Popover */}
            {/* ... unchanged ... */}
          </>
        )}

        {/* Tools Popover */}
        <Popover open={openTools} onOpenChange={setOpenTools}>
          <PopoverTrigger asChild>
            <button
              title="Công cụ"
              onClick={() => setOpenTools(!openTools)}
              data-testid="sidebar-tools-button"
              className={cn(
                "p-2 rounded-lg transition-colors",
                openTools
                  ? "bg-white/20 text-white"
                  : "bg-brand-600 text-white/90 hover:text-white hover:bg-white/10",
              )}
            >
              <Wrench className="h-6 w-6" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="right"
            className="w-56 rounded-xl border border-gray-200 shadow-lg p-3"
            data-testid="sidebar-tools-popover"
          >
            <h4 className="px-2 pb-2 text-sm font-semibold text-gray-700 border-b border-gray-100">
              Công cụ
            </h4>
            <div className="grid grid-cols-2 gap-3 mt-3">
              {/* Tin nhắn nhanh */}
              <div
                className="flex flex-col items-center text-center text-gray-500 hover:text-brand-700 cursor-pointer"
                data-testid="tools-quick-message-button"
                onClick={() => {
                  setOpenTools(false);
                  setOpenQuickMsg(true);
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 mb-1">
                  <Zap className="h-5 w-5 text-brand-600" />
                </div>
                <span className="text-xs font-medium">Tin nhắn nhanh</span>
              </div>

              {/* Tin đánh dấu */}
              <div
                className="flex flex-col items-center text-center text-gray-500 hover:text-brand-700 cursor-pointer"
                data-testid="tools-pinned-messages-button"
                onClick={() => {
                  setOpenTools(false);
                  onSelect("pinned");
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 mb-1">
                  <Star className="h-5 w-5 text-brand-600" />
                </div>
                <span className="text-xs font-medium">Tin đánh dấu</span>
              </div>

              {/* Danh sách việc cần làm */}
              <div
                className="flex flex-col items-center text-center text-gray-500 hover:text-brand-700 cursor-pointer"
                data-testid="tools-todo-list-button"
                onClick={() => {
                  setOpenTools(false);
                  setOpenTodoList(true);
                }}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 mb-1">
                  <ListTodo className="h-5 w-5 text-brand-600" />
                </div>
                <span className="text-xs font-medium">
                  Danh sách việc cần làm
                </span>
              </div>

              {/* Quản lý loại việc (Leader only) */}
              {hasLeaderPermissions() && (
                <div
                  className="flex flex-col items-center text-center text-gray-500 hover:text-brand-700 cursor-pointer"
                  data-testid="tools-worktype-manager-button"
                  onClick={() => {
                    setOpenTools(false);
                    onOpenWorkTypeManager?.();
                  }}
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 mb-1">
                    <Settings className="h-5 w-5 text-brand-600" />
                  </div>
                  <span className="text-xs font-medium">Quản lý loại việc</span>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* NEW: User avatar with Popover */}
        <Popover open={openProfile} onOpenChange={setOpenProfile}>
          <PopoverTrigger asChild>
            <button
              title={currentUserName ? currentUserName : "Tài khoản"}
              onClick={() => setOpenProfile(!openProfile)}
              data-testid="sidebar-profile-button"
              className="group relative h-10 w-10 rounded-full bg-white/10 ring-1 ring-white/20 flex items-center justify-center text-white font-semibold select-none transition hover:bg-white/20"
            >
              <span className="text-sm tracking-wide">{initials}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            side="right"
            className="w-56 rounded-xl border border-gray-200 shadow-xl p-2 backdrop-blur bg-white"
            data-testid="sidebar-profile-popover"
          >
            <div className="px-2 py-2">
              <div className="text-sm font-semibold text-gray-800">
                Xin chào {currentUserName}
              </div>
            </div>

            <div className="mt-1">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  hasLeaderPermissions()
                    ? "bg-brand-100 text-brand-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {hasLeaderPermissions() ? "🎖️ Trưởng nhóm" : "👤 Nhân viên"}
              </span>
            </div>

            <div className="mt-1">
              <button
                onClick={() => {
                  setOpenProfile(false);
                  onSelect("logout");
                }}
                data-testid="profile-logout-button"
                className="w-full flex items-center gap-2 px-2 py-2 text-sm rounded-md hover:bg-brand-50 text-gray-700"
              >
                <LogOut className="h-4 w-4 text-gray-600" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <QuickMessageManager open={openQuickMsg} onOpenChange={setOpenQuickMsg} />
      <TodoListManager open={openTodoList} onOpenChange={setOpenTodoList} />

      {/* Modal chọn ngày */}
      <Dialog open={openDateModal} onOpenChange={setOpenDateModal}>
        <DialogContent className="max-w-sm flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-4">
            <DialogTitle>Chọn ngày bắt đầu dự kiến</DialogTitle>
          </DialogHeader>
          <div>
            <Calendar
              mode="single"
              selected={newDate}
              onSelect={setNewDate}
              disabled={isDateDisabled}
              className="mx-auto"
            />
          </div>
          <DialogFooter className="px-6 py-4 border-t bg-gray-50 mt-auto flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setOpenDateModal(false)}
              className="w-24"
            >
              Hủy
            </Button>
            <Button
              onClick={handleSaveDate}
              disabled={!newDate}
              className="bg-brand-600 hover:bg-brand-700 text-white w-28"
            >
              Lưu thay đổi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
};
