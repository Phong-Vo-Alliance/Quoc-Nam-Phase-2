// src/data/mockTasks.ts
import type { Task } from "@/features/portal/types";

const iso = (d = new Date()) => d.toISOString();

/**
 * Giả lập các user id:
 * - Leader: u_thanh_truc
 * - Staff : u_thu_an, u_diem_chi, u_le_binh
 * Nhóm: grp_vh_kho
 * WorkTypes: wt_nhan_hang | wt_doi_tra | wt_phe_pham | wt_can_hang
 */

export const mockTasks: Task[] = [
  {
    id: "task_001",
    title: "Kiểm tra biên bản nhận hàng đợt 2",
    description: "Xác nhận đủ hàng nhập kho ngày hôm nay.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0001",           // message id tham chiếu trong chat
    assigneeId: "u_thu_an",
    assignedById: "u_thanh_truc",          // leader giao
    status: "in_progress",
    checklist: [
      { id: "chk_001_1", label: "Đối chiếu số lượng hàng nhập", done: true },
      { id: "chk_001_2", label: "Chụp ảnh hàng hóa", done: false },
      { id: "chk_001_3", label: "Cập nhật vào hệ thống", done: false },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4h trước
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_002",
    title: "Lập danh sách đổi trả NCC",
    description: "Danh sách hàng đổi trả với nhà cung cấp CP.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0008",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_002_1", label: "Kiểm tra số lượng hàng lỗi", done: false },
      { id: "chk_002_2", label: "Chuẩn bị phiếu đổi trả", done: false },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // hôm qua
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // cách đây 20h
  },
  {
    id: "task_003",
    title: "Xác nhận phế phẩm tồn kho Q4",
    description: "Kiểm tra tình trạng các thùng hỏng.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0012",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_003_1", label: "Ghi nhận danh sách phế phẩm", done: true },
      { id: "chk_003_2", label: "Upload hình ảnh minh chứng", done: true },
      { id: "chk_003_3", label: "Chờ xác nhận Leader", done: false },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 ngày trước
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(), // cách đây 40h
  },
  {
    id: "task_004",
    title: "Cân hàng nhập cuối ngày",
    description: "Đảm bảo đủ trọng lượng hàng về trước 18h.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0003",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "awaiting_review",
    checklist: [
      { id: "chk_004_1", label: "Cập nhật trọng lượng từng kiện", done: true },
      { id: "chk_004_2", label: "Xác nhận báo cáo", done: true },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5' trước
  },
  {
    id: "task_005",
    title: "Theo dõi phiếu đổi trả NCC tuần 45",
    description: "Tổng hợp dữ liệu đổi trả và xác nhận với Leader.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0020",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "todo",
    checklist: [
      { id: "chk_005_1", label: "Thu thập biên bản lỗi", done: false },
      { id: "chk_005_2", label: "Làm việc với NCC", done: false },
      { id: "chk_005_3", label: "Gửi báo cáo cho Leader", done: false },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15' trước
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task_006",
    title: "Theo dõi phiếu đổi trả NCC",
    description: "Tổng hợp dữ liệu đổi trả và xác nhận với Leader.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_doi_tra",
    messageId: "msg_0022",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "todo",
    checklist: [
      { id: "chk_006_1", label: "Thu thập biên bản lỗi", done: false },
      { id: "chk_006_2", label: "Làm việc với NCC", done: false },
      { id: "chk_006_3", label: "Gửi báo cáo cho Leader", done: false },
    ],
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15' trước
    updatedAt: new Date().toISOString(),
  },

  // =========================
  // 2 task hoàn thành TRONG NGÀY HÔM NAY (wt_nhan_hang)
  // =========================
  {
    id: "task_007",
    title: "Nhận hàng lô PO-2025-003 (sáng)",
    description: "Lô hàng nhập buổi sáng, đã kiểm đủ số lượng và tình trạng.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0001", // tái sử dụng message nhận hàng
    assigneeId: "u_thu_an",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_007_1", label: "Kiểm đếm số lượng", done: true },
      { id: "chk_007_2", label: "Chụp ảnh biên bản", done: true },
    ],
    // 3 giờ trước
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    // 1 giờ trước
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
  },
  {
    id: "task_008",
    title: "Nhận hàng lô PO-2025-004 (chiều)",
    description: "Hàng nhập cuối ngày, đã xác nhận đủ chứng từ với NCC.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0003", // tham chiếu cân hàng / nhận hàng
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_008_1", label: "Đối chiếu phiếu nhập", done: true },
      { id: "chk_008_2", label: "Hoàn tất cập nhật hệ thống", done: true },
    ],
    // 6 giờ trước
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    // 2 giờ trước
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },

  // =========================
  // 3 task hoàn thành CÁC NGÀY TRƯỚC (wt_nhan_hang)
  // =========================
  {
    id: "task_009",
    title: "Nhận hàng tuần trước – PO-2025-090",
    description: "Lô hàng lớn nhập cho chương trình cuối tuần, đã hoàn tất.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0020",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_009_1", label: "Kiểm đếm và ghi nhận số lượng", done: true },
      { id: "chk_009_2", label: "Chụp ảnh pallet hàng", done: true },
    ],
    // 2 ngày trước
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    // 2 ngày trước + 2h
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 46).toISOString(),
  },
  {
    id: "task_010",
    title: "Nhập kho đơn lẻ đầu tuần",
    description: "Các đơn lẻ nhỏ từ NCC khác, đã nhập kho xong.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0008",
    assigneeId: "u_thu_an",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_010_1", label: "Kiểm tra tình trạng thùng", done: true },
    ],
    // 3 ngày trước
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    // 3 ngày trước + 1h
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 71).toISOString(),
  },
  {
    id: "task_011",
    title: "Nhập kho phế phẩm tái chế",
    description: "Nhập kho các kiện hàng chuyển sang khu phế phẩm.",
    groupId: "grp_vh_kho",
    workTypeId: "wt_nhan_hang",
    messageId: "msg_0012",
    assigneeId: "u_diem_chi",
    assignedById: "u_thanh_truc",
    status: "done",
    checklist: [
      { id: "chk_011_1", label: "Phân loại phế phẩm", done: true },
      { id: "chk_011_2", label: "Cập nhật vị trí kho", done: true },
    ],
    // 5 ngày trước
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    // 5 ngày trước + 3h
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 117).toISOString(),
  },
];
