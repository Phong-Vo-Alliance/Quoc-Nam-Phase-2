# 01. Quản Lý Công Việc (Task)

> **Mục đích:** Mô tả tính năng tạo, giao và theo dõi công việc

---

## 1. Tổng Quan

### 1.1 Task là gì?

Task là công việc được tạo từ tin nhắn, cho phép:

- 👑 **Leader** tạo và giao cho Staff
- 👤 **Staff** nhận, thực hiện và báo cáo
- 👑 **Leader** duyệt khi hoàn thành

---

## 2. Trạng Thái Task

```
┌─────────────┐
│   TODO      │  Chưa làm (vừa tạo)
│   ⬜        │
└──────┬──────┘
       │ Staff bắt đầu làm
       ▼
┌─────────────┐
│   DOING     │  Đang làm
│   🟦        │
└──────┬──────┘
       │ Staff hoàn thành, gửi duyệt
       ▼
┌──────────────────┐
│ NEED_TO_VERIFIED │  Chờ duyệt
│   🟨             │
└──────┬───────────┘
       │ Leader duyệt OK
       ▼
┌─────────────┐
│  FINISHED   │  Đã hoàn thành
│   🟩        │
└─────────────┘
```

---

## 3. Tạo Task

### 3.1 Luồng Tạo

```
1. Hover tin nhắn trong chat
        │
        ▼
2. Click "Tạo công việc" (Leader only)
        │
        ▼
3. Mở form Giao việc
```

### 3.2 Form Giao Việc

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      GIAO CÔNG VIỆC                            [X]     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   Tiêu đề:                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ [Auto-fill từ nội dung tin nhắn]                                │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Giao cho:                                                             │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ [Dropdown: Chọn thành viên]                              ▼     │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Độ ưu tiên:                                                           │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ [Thấp / Bình thường / Cao / Khẩn cấp]                   ▼     │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Checklist mẫu:                                                        │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ [Dropdown: Chọn template checklist]                      ▼     │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│   Preview checklist:                                                    │
│   ┌─────────────────────────────────────────────────────────────────┐  │
│   │ ☐ Kiểm tra số lượng hàng                                       │  │
│   │ ☐ Đối chiếu với đơn hàng                                       │  │
│   │ ☐ Chụp ảnh xác nhận                                            │  │
│   └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│                                           [Hủy]     [Giao việc]         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Task Card

```
┌─────────────────────────────────────────────────────────────────────────┐
│  📋 Kiểm tra hàng nhập kho #123                        [Đang làm] 🔵  │
│  ─────────────────────────────────────────────────────────────────────  │
│  📍 Nhận hàng · Kiểm đếm                                               │
│  👤 Giao cho: Minh Anh                                                 │
│  ⏰ Tạo lúc: 09:45 - 27/01/2026                                        │
│                                                                         │
│  Tiến độ: 2/5 mục                                            40%       │
│  ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░                 │
│                                                                         │
│  [Expand ▼]                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Checklist

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CHECKLIST                                                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ✅ Kiểm tra số lượng hàng                              ✓ 09:30        │
│  ✅ Đối chiếu với đơn hàng                              ✓ 09:35        │
│  ☐ Chụp ảnh xác nhận                                                   │
│  ☐ Báo cáo kết quả                                                     │
│  ☐ Cập nhật hệ thống                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

• Click checkbox để toggle done/undone
• Chỉ assignee hoặc Leader mới check được
```

---

## 6. Task Flow Theo Vai Trò

### 6.1 👑 Leader Flow

```
1. Xem tin nhắn → Tạo task → Giao cho Staff
2. Theo dõi tiến độ trong tab "Công việc"
3. Khi Staff gửi duyệt:
   • [✓ Duyệt] → FINISHED
   • [✗ Từ chối] → DOING (yêu cầu làm lại)
```

### 6.2 👤 Staff Flow

```
1. Nhận task → Status: TODO
2. Bắt đầu làm → Status: DOING
3. Check từng mục checklist
4. Hoàn thành → Click "Gửi duyệt"
5. Chờ Leader duyệt → FINISHED
```

---

## 7. Hiển Thị Theo Vai Trò

### 7.1 Leader View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CÔNG VIỆC (12)                                        [Xem tất cả]    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Đang xử lý (3)                                                         │
│  • Task A - Minh                                       [Đang làm]      │
│  • Task B - Huyền                                      [Chờ duyệt]     │
│                                                                         │
│  Chờ duyệt (1)                                                          │
│  • Task C - An                                         [Chờ duyệt]     │
│    [✓ Duyệt]  [✗ Từ chối]                                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Staff View

```
┌─────────────────────────────────────────────────────────────────────────┐
│  CÔNG VIỆC CỦA TÔI (3)                                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Cần làm (2)                                                            │
│  • Kiểm tra hàng nhập                                  [Đang làm]      │
│  • Đối chiếu đơn #456                                  [Chưa làm]      │
│                                                                         │
│  Chờ duyệt (1)                                                          │
│  • Báo cáo tháng 1                                     [Chờ duyệt]     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 8. Priority (Độ Ưu Tiên)

| Level | Label       | Màu       |
| :---: | ----------- | --------- |
|   1   | Thấp        | 🟢 Green  |
|   2   | Bình thường | 🟡 Yellow |
|   3   | Cao         | 🟠 Orange |
|   4   | Khẩn cấp    | 🔴 Red    |

---

## 9. API Liên Quan

→ Chi tiết xem: [Task API](../../api/04_task_api.md)

---

## 10. Liên Kết Tài Liệu

- 🔗 [Hệ Thống Phân Quyền](../../03_he_thong_phan_quyen.md)
- 🔗 [Giao Diện Chat](../chat/01_giao_dien_chat.md)
- 🔗 [Task API](../../api/04_task_api.md)

---

_Cập nhật: 27/01/2026_
