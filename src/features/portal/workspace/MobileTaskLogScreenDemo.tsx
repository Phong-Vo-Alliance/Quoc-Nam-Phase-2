import React, { useState } from "react";
import { MobileTaskLogScreen } from "./MobileTaskLogScreen";
import { getCurrentUserIdSync } from "@/utils/getCurrentUser";
import type { Task, Message, TaskLogMessage } from "../types";
import { Button } from "@/components/ui/button";

// Mock data for demonstration
const CURRENT_USER_ID = getCurrentUserIdSync();
const CURRENT_USER_NAME = CURRENT_USER_ID === "u_thanh_truc" ? "Thanh Trúc" : CURRENT_USER_ID.replace("u_", "").replace(/_/g, " ").split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

const mockTask: Task = {
  id: "task_001",
  groupId: "grp_vh_kho",
  workTypeId: "wt_nhan_hang",
  workTypeName: "Nhận hàng",
  messageId: "msg_123",
  title: "Kiểm tra biên bản nhận hàng đợt 2",
  assignTo: "u_thu_an",
  assignFrom: CURRENT_USER_ID,
  status: { id: "2", code: "doing", label: "Đang làm", level: 2, color: "#ffa500" },
  priority: { id: "1", code: "high", label: "Cao", level: 3, color: "#ff0000" },
  createdAt: "2025-11-12T12:12:00Z",
  updatedAt: "2025-11-12T14:30:00Z",
  checklist: [],
  history: [],
};

const mockSourceMessage: Message = {
  id: "msg_123",
  groupId: "grp_vh_kho",
  senderId: CURRENT_USER_ID,
  sender: CURRENT_USER_NAME,
  type: "text",
  content: "Kiểm tra biên bản nhận hàng đợt 2",
  time: "12:12",
  createdAt: "2025-11-12T12:12:00Z",
  taskId: "task_001",
};

const mockTaskLogMessages: TaskLogMessage[] = [
  {
    id: "log_001",
    taskId: "task_001",
    senderId: "u_thu_an",
    sender: "Thu An",
    type: "text",
    content: "Đã bắt đầu kiểm tra biên bản. Đang xem xét các mục trong danh sách.",
    time: "12:15",
    createdAt: "2025-11-12T12:15:00Z",
  },
  {
    id: "log_002",
    taskId: "task_001",
    senderId: CURRENT_USER_ID,
    sender: CURRENT_USER_NAME,
    type: "text",
    content: "Nhớ đối chiếu với số lượng thực tế nhé.",
    time: "12:20",
    createdAt: "2025-11-12T12:20:00Z",
  },
  {
    id: "log_003",
    taskId: "task_001",
    senderId: "u_thu_an",
    sender: "Thu An",
    type: "text",
    content: "Đã kiểm tra xong 80% biên bản. Có một vài mục cần xác nhận lại.",
    time: "13:45",
    createdAt: "2025-11-12T13:45:00Z",
  },
  {
    id: "log_004",
    taskId: "task_001",
    senderId: CURRENT_USER_ID,
    sender: CURRENT_USER_NAME,
    type: "text",
    content: "Các mục nào cần xác nhận? Cho mình biết để hỗ trợ.",
    time: "14:00",
    createdAt: "2025-11-12T14:00:00Z",
  },
  {
    id: "log_005",
    taskId: "task_001",
    senderId: "u_thu_an",
    sender: "Thu An",
    type: "text",
    content: "Mục số 15 và 23 trong danh sách có sự chênh lệch về số lượng. Cần kiểm tra lại kho.",
    time: "14:15",
    createdAt: "2025-11-12T14:15:00Z",
  },
];

const mockMembers = [
  { id: CURRENT_USER_ID, name: CURRENT_USER_NAME },
  { id: "u_thu_an", name: "Thu An" },
  { id: "u_diem_chi", name: "Diễm Chi" },
];

export const MobileTaskLogScreenDemo: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-gray-100">
      <Button
        onClick={() => setOpen(true)}
        className="bg-brand-600 text-white px-6 py-3 rounded-lg text-lg"
      >
        Mở Nhật Ký Công Việc (Mobile Demo)
      </Button>

      <MobileTaskLogScreen
        open={open}
        onBack={() => setOpen(false)}
        task={mockTask}
        sourceMessage={mockSourceMessage}
        messages={mockTaskLogMessages}
        currentUserId="u_diem_chi"
        members={mockMembers}
        onSend={(payload) => {
          // In a real app, this would add the message to the task log
        }}
      />
    </div>
  );
};
