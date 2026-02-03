# 05. Quản Lý Công Việc (Tasks)

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Hệ thống quản lý công việc cho phép:

- **Leader** tạo công việc từ tin nhắn
- **Leader** phân công cho nhân viên
- **Staff** nhận và thực hiện công việc
- **Leader** duyệt công việc hoàn thành
- Theo dõi tiến độ qua checklist
- Cập nhật trạng thái công việc

---

## 📍 Cách Truy Cập

### Desktop

```
Right Panel → Tab "Công việc"
```

### Mobile

**Cách 1:** Từ màn Chat

```
Màn Chat → Icon ℹ️ → Tab "Công việc"
```

**Cách 2:** Bottom Navigation

```
Tab "Công việc" 📋 → Danh sách công việc của mình
```

---

## 🔄 Vòng Đời Công Việc

```
┌─────────────────────────────────────────────┐
│              VÒNG ĐỜI TASK                  │
└─────────────────────────────────────────────┘

    ┌──────────┐
    │   TODO   │  ← Vừa được tạo
    │  (Xám)   │    Chờ nhân viên bắt đầu
    └────┬─────┘
         │ Nhân viên click "Bắt đầu làm"
         ▼
    ┌──────────┐
    │  DOING   │  ← Đang thực hiện
    │  (Xanh)  │    Check các mục checklist
    └────┬─────┘
         │ Nhân viên click "Hoàn thành"
         ▼
┌────────────────┐
│ NEED_TO_VERIFY │  ← Chờ duyệt
│    (Vàng)      │    Leader xem xét
└────────┬───────┘
         │ Leader click "Duyệt" ✅
         │ (hoặc "Từ chối" → về DOING)
         ▼
    ┌──────────┐
    │ FINISHED │  ← Hoàn thành
    │ (Xanh lá)│    Kết thúc công việc
    └──────────┘
```

### Bảng Trạng Thái

| Trạng thái         | Màu        | Ý nghĩa       | Ai thực hiện     |
| ------------------ | ---------- | ------------- | ---------------- |
| **TODO**           | 🔘 Xám     | Chưa bắt đầu  | Leader tạo       |
| **DOING**          | 🔵 Xanh    | Đang làm      | Staff bắt đầu    |
| **NEED_TO_VERIFY** | 🟡 Vàng    | Chờ duyệt     | Staff hoàn thành |
| **FINISHED**       | 🟢 Xanh lá | Đã hoàn thành | Leader duyệt     |

---

## 🎯 Tạo Công Việc (Leader Only)

### Quyền Hạn

| Vai trò    | Tạo công việc |
| ---------- | ------------- |
| **Staff**  | ❌ Không      |
| **Leader** | ✅ Có         |

### Cách Tạo Công Việc

**Desktop:**

```
Hover tin nhắn → Click icon "📋 Tạo công việc"
```

**Mobile:**

```
Long-press tin nhắn → Chọn "Tạo công việc"
```

### Luồng Tạo Công Việc

```
Bước 1: Leader đọc tin nhắn có thông tin cần xử lý
         ↓
Bước 2: Hover/Long-press tin nhắn → Click "Tạo công việc"
         ↓
Bước 3: Modal "Giao Công Việc" mở ra
         ↓
Bước 4: Điền thông tin:
         • Tiêu đề (auto-fill từ tin nhắn)
         • Người được giao
         • Loại công việc (work type)
         • Template checklist (nếu có)
         • Độ ưu tiên
         ↓
Bước 5: Click "Tạo"
         ↓
Bước 6: Công việc được tạo & liên kết với tin nhắn gốc
         ↓
Bước 7: Nhân viên nhận thông báo có công việc mới
```

### Giao Diện Modal Tạo Công Việc

```
┌─────────────────────────────────────────────────┐
│  GIAO CÔNG VIỆC                        [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh - 10:30                      │ │
│  │ "Đã kiểm tra xong 100 thùng..."         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Tiêu đề: *                                    │
│  ┌───────────────────────────────────────────┐ │
│  │ Kiểm tra 100 thùng hàng nhập kho         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người được giao: *                            │
│  ┌───────────────────────────────────────────┐ │
│  │ [🔍] Chọn nhân viên...            [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Loại công việc: *                             │
│  ┌───────────────────────────────────────────┐ │
│  │ Nhận hàng - Kiểm đếm              [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Template checklist:                           │
│  ┌───────────────────────────────────────────┐ │
│  │ Template Kiểm Kho                 [▼]   │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Độ ưu tiên:                                   │
│  ○ Thấp    ◉ Trung bình    ○ Cao             │
│                                                 │
│           [Hủy]              [Tạo Công Việc]  │
└─────────────────────────────────────────────────┘
```

---

## 📋 Checklist Template

### Mục Đích

- Định sẵn các bước cần làm cho từng loại công việc
- Đảm bảo không bỏ sót công đoạn
- Theo dõi tiến độ rõ ràng

### Ví Dụ Template

**Loại công việc: Nhận hàng - Kiểm đếm**

```
☐ 1. Kiểm tra số lượng thùng
☐ 2. Kiểm tra tình trạng bên ngoài
☐ 3. Mở thùng kiểm tra hàng bên trong
☐ 4. Đối chiếu với phiếu nhập kho
☐ 5. Chụp ảnh hàng hóa
☐ 6. Báo cáo kết quả
```

---

## 📍 Hiển Thị Danh Sách Công Việc

### Giao Diện

```
┌─────────────────────────────────────────────────┐
│  CÔNG VIỆC LIÊN KẾT                     [+ Tạo]│
├─────────────────────────────────────────────────┤
│                                                 │
│  ▼ ĐANG XỬ LÝ (2)                              │
│  ┌───────────────────────────────────────────┐ │
│  │ 📦 Kiểm tra 100 thùng hàng          [TODO]│ │
│  │    ✓ 3/6 mục                              │ │
│  │    👤 Minh Anh                            │ │
│  │    🕒 2 giờ trước                         │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ CHỜ DUYỆT (1)                               │
│  ┌───────────────────────────────────────────┐ │
│  │ ✅ Nhập kho buổi sáng     [NEED_VERIFY]  │ │
│  │    ✓ 6/6 mục                              │ │
│  │    👤 Nam                                 │ │
│  │    [Xem] [Duyệt]                          │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  ▼ HOÀN THÀNH (5)                              │
│  (Click để xem)                                │
└─────────────────────────────────────────────────┘
```

---

## 📝 Chi Tiết Công Việc

### Thẻ Công Việc (Task Card)

```
┌─────────────────────────────────────────────────┐
│  📦 Kiểm tra 100 thùng hàng         [TODO] [⋮] │
├─────────────────────────────────────────────────┤
│                                                 │
│  Tin nhắn gốc:                                 │
│  ┌───────────────────────────────────────────┐ │
│  │ 👤 Minh Anh - 10:30                      │ │
│  │ "Đã kiểm tra xong 100 thùng..."         │ │
│  │ [Xem tin nhắn gốc]                       │ │
│  └───────────────────────────────────────────┘ │
│                                                 │
│  Người giao: 👤 Leader Hùng                    │
│  Người làm: 👤 Minh Anh                        │
│  Độ ưu tiên: 🔴 Cao                            │
│  Tạo lúc: 10:35 - 27/01/2026                  │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  CHECKLIST (3/6 mục hoàn thành)                │
│  Progress: ▓▓▓▓▓░░░░░░░░ 50%                  │
│                                                 │
│  ☑ 1. Kiểm tra số lượng thùng                  │
│  ☑ 2. Kiểm tra tình trạng bên ngoài            │
│  ☑ 3. Mở thùng kiểm tra hàng bên trong         │
│  ☐ 4. Đối chiếu với phiếu nhập kho             │
│  ☐ 5. Chụp ảnh hàng hóa                        │
│  ☐ 6. Báo cáo kết quả                          │
│                                                 │
│  ─────────────────────────────────────────────  │
│                                                 │
│  [Bắt đầu làm]  [Nhận xét]  [Xem log]         │
└─────────────────────────────────────────────────┘
```

---

## 🔄 Cập Nhật Trạng Thái

### Staff: TODO → DOING

```
Bước 1: Staff mở task có trạng thái TODO
         ↓
Bước 2: Click "Bắt đầu làm"
         ↓
Bước 3: Trạng thái chuyển sang DOING
         ↓
Bước 4: Badge màu xanh hiển thị
         ↓
Bước 5: Bắt đầu check các mục checklist
```

### Staff: Check Checklist

```
Bước 1: Click vào checkbox ☐
         ↓
Bước 2: Checkbox thành ☑
         ↓
Bước 3: Progress bar cập nhật
         ↓
Bước 4: Percentage thay đổi
```

### Staff: DOING → NEED_TO_VERIFY

```
Bước 1: Staff hoàn thành checklist
         ↓
Bước 2: Click "Hoàn thành"
         ↓
Bước 3: Modal xác nhận: "Bạn đã hoàn thành?"
         ↓
Bước 4: Xác nhận
         ↓
Bước 5: Trạng thái → NEED_TO_VERIFY
         ↓
Bước 6: Leader nhận thông báo có task chờ duyệt
```

### Leader: Duyệt Task

```
Bước 1: Leader mở task có trạng thái NEED_TO_VERIFY
         ↓
Bước 2: Xem checklist đã hoàn thành
         ↓
Bước 3: Click "Duyệt" ✅
         ↓
Bước 4: Trạng thái → FINISHED
         ↓
Bước 5: Staff nhận thông báo task đã được duyệt
```

### Leader: Từ Chối Task

```
Bước 1: Leader mở task có trạng thái NEED_TO_VERIFY
         ↓
Bước 2: Xem checklist, thấy chưa đạt
         ↓
Bước 3: Click "Từ chối" ❌
         ↓
Bước 4: Nhập lý do từ chối
         ↓
Bước 5: Trạng thái → DOING
         ↓
Bước 6: Staff nhận thông báo task bị từ chối
```

---

## 👤 Phân Quyền Theo Vai Trò

### Staff

| Hành động                           | Được phép |
| ----------------------------------- | --------- |
| Xem task được giao cho mình         | ✅        |
| Bắt đầu làm (TODO → DOING)          | ✅        |
| Check/uncheck checklist             | ✅        |
| Hoàn thành (DOING → NEED_TO_VERIFY) | ✅        |
| Tạo task mới                        | ❌        |
| Duyệt task                          | ❌        |
| Phân công lại                       | ❌        |

### Leader

| Hành động                              | Được phép |
| -------------------------------------- | --------- |
| Tất cả quyền của Staff                 | ✅        |
| Tạo task từ tin nhắn                   | ✅        |
| Phân công cho nhân viên                | ✅        |
| Duyệt task (NEED_TO_VERIFY → FINISHED) | ✅        |
| Từ chối task (NEED_TO_VERIFY → DOING)  | ✅        |
| Phân công lại                          | ✅        |
| Xem tất cả task trong nhóm             | ✅        |

---

## ✅ Checklist Kiểm Thử

### Tạo Task (Leader)

- [ ] **Staff** - KHÔNG thấy nút "Tạo công việc" khi hover tin
- [ ] **Leader** - Thấy nút "Tạo công việc"
- [ ] **Tạo task** - Modal mở, tiêu đề auto-fill
- [ ] **Chọn người giao** - Dropdown hiện đúng danh sách
- [ ] **Submit** - Task được tạo, hiện trong danh sách

### Vòng Đời Task

- [ ] **TODO → DOING** - Staff click "Bắt đầu làm", trạng thái đổi
- [ ] **Check checklist** - Progress bar cập nhật đúng
- [ ] **DOING → NEED_TO_VERIFY** - Staff click "Hoàn thành"
- [ ] **NEED_TO_VERIFY → FINISHED** - Leader duyệt thành công
- [ ] **NEED_TO_VERIFY → DOING** - Leader từ chối, có lý do

### Thông Báo

- [ ] **Task mới** - Staff nhận notification
- [ ] **Task được duyệt** - Staff nhận notification
- [ ] **Task bị từ chối** - Staff nhận notification

### Liên Kết Tin Nhắn

- [ ] **Click "Xem tin gốc"** - Scroll đến tin nhắn gốc
- [ ] **Task card** - Hiện preview tin nhắn gốc

### Phân Quyền

- [ ] **Staff** - Chỉ thấy task của mình
- [ ] **Leader** - Thấy tất cả task nhóm

---

## 📖 Xem Tiếp

→ [06_THONG_TIN_NHAN.md](./06_THONG_TIN_NHAN.md) - Tính năng "Nhận thông tin" cho Leader
