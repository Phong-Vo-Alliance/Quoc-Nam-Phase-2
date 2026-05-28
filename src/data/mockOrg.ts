// src/data/mockOrg.ts
import type {
  User,
  Department,
  GroupChat,
  GroupMember,
  WorkType,
  ChecklistTemplateMap,
  ChecklistTemplateItem,
} from "@/features/portal/types";

const iso = (d = new Date()) => d.toISOString();

/* ===================== Users ===================== */
// Phòng "Kho Hàng": 1 leader + 3 staff
export const mockUsers: User[] = [
  {
    id: "u_thanh_truc",
    displayName: "Trương Thanh Trúc",
    email: "truc@example.com",    
    roles: ["leader"], // vai trò hệ thống
    departmentIds: ["dep_kho_hang"],
    primaryDepartmentId: "dep_kho_hang",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_thu_an",
    displayName: "Vũ Thu An",
    email: "an@example.com",    
    roles: ["staff"],
    departmentIds: ["dep_kho_hang"],
    primaryDepartmentId: "dep_kho_hang",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_diem_chi",
    displayName: "Lê Diễm Chi",
    email: "chi@example.com",    
    roles: ["staff"],
    departmentIds: ["dep_kho_hang"],
    primaryDepartmentId: "dep_kho_hang",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_le_binh",
    displayName: "Lệ Bình",
    email: "binh@example.com",    
    roles: ["staff"],
    departmentIds: ["dep_kho_hang"],
    primaryDepartmentId: "dep_kho_hang",
    active: true,
    createdAt: iso(),
  },

  // Phòng "Vận Hành": 2 nhân sự như yêu cầu
  {
    id: "u_huyen",
    displayName: "Tăng Thị Huyền",
    email: "huyen@example.com",
    roles: ["leader"], // giả định Huyền là leader phòng Vận Hành để auto-join group
    departmentIds: ["dep_van_hanh"],
    primaryDepartmentId: "dep_van_hanh",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_ngoc_vang",
    displayName: "Ngọc Vàng",
    email: "ngocvang@example.com",
    roles: ["staff"],
    departmentIds: ["dep_van_hanh"],
    primaryDepartmentId: "dep_van_hanh",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_kim_vui",
    displayName: "Huỳnh Kim Vui",
    email: "vui@example.com",
    roles: ["staff"],
    departmentIds: ["dep_van_hanh"],
    primaryDepartmentId: "dep_van_hanh",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_ngoc_han",
    displayName: "Lưu Ngọc Hân",
    email: "han@example.com",
    roles: ["staff"],
    departmentIds: ["dep_van_hanh"],
    primaryDepartmentId: "dep_van_hanh",
    active: true,
    createdAt: iso(),
  },

  // Phòng "Kho Hàng": bổ sung thêm
  {
    id: "u_thanh_thai",
    displayName: "Trương Thành Thái",
    email: "thai@example.com",
    roles: ["staff"],
    departmentIds: ["dep_kho_hang"],
    primaryDepartmentId: "dep_kho_hang",
    active: true,
    createdAt: iso(),
  },

  // Phòng "Điều hành"
  {
    id: "u_phuong_truc",
    displayName: "Phan Thị Phương Trúc",
    email: "truc@example.com",
    roles: ["staff"],
    departmentIds: ["dep_dieu_hanh"],
    primaryDepartmentId: "dep_dieu_hanh",
    active: true,
    createdAt: iso(),
  },
  {
    id: "u_tieu_my",
    displayName: "Nguyễn Tiểu My",
    email: "my@example.com",
    roles: ["staff"],
    departmentIds: ["dep_dieu_hanh"],
    primaryDepartmentId: "dep_dieu_hanh",
    active: true,
    createdAt: iso(),
  },
];

/* ===================== Departments ===================== */
export const mockDepartments: Department[] = [
  {
    id: "dep_kho_hang",
    name: "Kho Hàng",
    leaderId: "u_thanh_truc",
    memberIds: ["u_thanh_truc", "u_thu_an", "u_diem_chi", "u_le_binh", "u_thanh_thai"],
    createdAt: iso(),
  },
  {
    id: "dep_van_hanh",
    name: "Vận Hành",
    leaderId: "u_huyen",
    memberIds: ["u_huyen", "u_ngoc_vang", "u_kim_vui", "u_ngoc_han"],
    createdAt: iso(),
  },
  {
    id: "dep_dieu_hanh",
    name: "Điều hành",
    leaderId: "u_phuong_truc",
    memberIds: ["u_phuong_truc", "u_tieu_my"],
    createdAt: iso(),
  },
];

/* ===================== Work Types ===================== */
export const wtNhanHang: WorkType = {
  id: "wt_nhan_hang",
  key: "nhan_hang",
  name: "Nhận hàng",
  icon: "PackageCheck",
  color: "#22C55E",

  checklistVariants: [
      {
        id: "nhanHang_kiemDem",
        name: "Kiểm đếm",
        isDefault: true,
      },
      {
        id: "nhanHang_luuTru",
        name: "Lưu trữ",
      },
      {
        id: "nhanHang_thanhToan",
        name: "Thanh toán",
      },
    ],
};
export const wtDoiTra: WorkType = {
  id: "wt_doi_tra",
  key: "doi_tra",
  name: "Đổi Trả",
  icon: "Undo2",
  color: "#0EA5E9",

  checklistVariants: [
      {
        id: "doiTra_xacNhan",
        name: "Xác nhận",
        isDefault: true,
      },
      {
        id: "doiTra_xuLy",
        name: "Xử lý",
      },
      {
        id: "doiTra_thanhToan",
        name: "Thanh toán",
      },
    ],
};
export const wtPhePham: WorkType = {
  id: "wt_phe_pham",
  key: "phe_pham",
  name: "Phế Phẩm",
  icon: "Trash2",
  color: "#F59E0B",
};
export const wtCanHang: WorkType = {
  id: "wt_can_hang",
  key: "can_hang",
  name: "Cân Hàng",
  icon: "Scale",
  color: "#A78BFA",

  checklistVariants: [
      {
        id: "canhang_xacNhan",
        name: "Xác nhận",
        isDefault: true,
      },
      {
        id: "canhang_nhapCan",
        name: "Nhập cân",
      },
      {
        id: "canhang_luuTru",
        name: "Lưu trữ",
      },
    ],
};

export const wtDonBocHang: WorkType = {
  id: "wt_don_boc_hang",
  key: "don_boc_hang",
  name: "Đơn Bốc Hàng",
  icon: "Scale",
  color: "#A78BFA",
};
export const wtLichBocHang: WorkType = {
  id: "wt_lich_boc_hang",
  key: "lich_boc_hang",
  name: "Lịch Bốc Hàng",
  icon: "Scale",
  color: "#A78BFA",
};

export const mockWorkTypesForGroup: WorkType[] = [
  wtNhanHang,
  wtDoiTra,
  wtPhePham,
  wtCanHang,
];

export const mockChecklistTemplatesByVariant: ChecklistTemplateMap = {
  // Nhận hàng
  wt_nhan_hang: {
    nhanHang_kiemDem: [
      { id: "tpl_nh_kd_1", label: "Kiểm đếm số lượng thực tế" },
      { id: "tpl_nh_kd_2", label: "Đối chiếu với phiếu nhập" },
    ],
    nhanHang_luuTru: [
      { id: "tpl_nh_lt_1", label: "Chuyển hàng vào khu vực lưu trữ" },
      { id: "tpl_nh_lt_2", label: "Cập nhật vị trí trên hệ thống" },
    ],
    nhanHang_thanhToan: [
      { id: "tpl_nh_tt_1", label: "Chuẩn bị chứng từ thanh toán" },
      { id: "tpl_nh_tt_2", label: "Xác nhận công nợ với kế toán" },
    ],
  },

  // Đổi trả
  wt_doi_tra: {
    doiTra_xacNhan: [
      { id: "tpl_dt_xn_1", label: "Xác nhận lý do đổi trả" },
      { id: "tpl_dt_xn_2", label: "Kiểm tra tình trạng hàng hóa" },
    ],
    doiTra_xuLy: [
      { id: "tpl_dt_xl_1", label: "Tạo phiếu đổi / hoàn" },
    ],
    doiTra_thanhToan: [
      { id: "tpl_dt_tt_1", label: "Hoàn tiền cho khách / NCC" },
    ],
  },

  // Các loại việc khác tạm thời để trống, có thể bổ sung sau
  wt_phe_pham: {},
  wt_can_hang: {},
  wt_don_boc_hang: {},
  wt_lich_boc_hang: {},
};


/* ===================== GroupChat ===================== */
const members: GroupMember[] = [
  // Leaders auto-join theo rule
  { userId: "u_huyen", role: "leader", isAutoJoined: true, joinedAt: iso() }, // leader Vận Hành
  { userId: "u_thanh_truc", role: "leader", isAutoJoined: true, joinedAt: iso() },  // leader Kho Hàng

  // Staff do leader add vào
  { userId: "u_ngoc_vang", role: "staff", isAutoJoined: false, joinedAt: iso(), addedById: "u_huyen" },
  { userId: "u_thu_an",        role: "staff", isAutoJoined: false, joinedAt: iso(), addedById: "u_thanh_truc"  },
];

export const mockGroup_VH_Kho: GroupChat = {
  id: "grp_vh_kho",
  name: "Vận hành - Kho Hàng",
  description: "Nhóm phối hợp giữa Vận Hành và Kho Hàng",
  departmentIds: ["dep_van_hanh", "dep_kho_hang"],
  members,
  workTypes: mockWorkTypesForGroup,
  defaultWorkTypeId: wtNhanHang.id,
  createdAt: iso(),
};

export const mockGroup_VH_TaiXe: GroupChat = {
  id: "grp_vh_taixe",
  name: "Vận hành - Tài xế tỉnh",
  description: "Nhóm phối hợp giữa Vận Hành và Tài xế tỉnh",
  departmentIds: ["dep_van_hanh", "dep_tai_xe"],
  members: [
    // Leaders auto-join theo rule
    { userId: "u_huyen", role: "leader", isAutoJoined: true, joinedAt: iso() }, // leader Vận Hành
    // Staff do leader add vào
    { userId: "u_ngoc_vang", role: "staff", isAutoJoined: false, joinedAt: iso(), addedById: "u_huyen" },
  ],
  workTypes: [wtDonBocHang, wtLichBocHang],
  defaultWorkTypeId: wtDonBocHang.id,
  createdAt: iso(),
};