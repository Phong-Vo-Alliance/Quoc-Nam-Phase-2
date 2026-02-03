# 05. Quản Lý Task (Công Việc)

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng quản lý task cho phép tạo công việc từ tin nhắn trong chat và theo dõi tiến độ. Mỗi task có quy trình trạng thái rõ ràng, checklist để theo dõi các bước, và phân quyền theo vai trò.

---

## Cách Truy Cập

| Cách | Mô tả | Ai có quyền |
|------|-------|-------------|
| Right-click tin nhắn → "Tạo Task" | Tạo task mới | Leader/Admin |
| Tab "Tasks" trong Right Panel | Xem danh sách task của conversation | Tất cả |
| Lead View (Kanban) | Dashboard quản lý task | Leader/Admin |

---

## Khái Niệm Chính

| Khái niệm | Mô tả |
|-----------|-------|
| **Task** | Một đơn vị công việc được tạo từ tin nhắn |
| **Assignee** | Nhân viên được giao task |
| **Assigner** | Leader/Admin tạo và giao task |
| **Checklist** | Danh sách các bước cần hoàn thành |
| **WorkType** | Loại công việc (Nhận hàng, Đổi trả...) |

---

## Quy Trình Trạng Thái (Status Flow)

```
     ┌─────────────────────────────────────────────────────────┐
     │                                                         │
     ▼                                                         │
┌─────────┐      ┌─────────┐      ┌─────────────┐      ┌─────────────┐
│   TODO  │ ───► │  DOING  │ ───► │ NEED VERIFY │ ───► │  FINISHED   │
│ (Chưa   │      │ (Đang   │      │   (Chờ      │      │  (Hoàn      │
│  làm)   │      │  làm)   │      │   duyệt)    │      │  thành)     │
└─────────┘      └─────────┘      └─────────────┘      └─────────────┘
                      ▲                   │
                      │                   │
                      └───── REJECT ──────┘
                        (Bị từ chối)
```

### Chi Tiết Từng Trạng Thái

| Trạng thái | Màu sắc | Ý nghĩa | Người thực hiện chuyển |
|------------|---------|---------|------------------------|
| **Todo** | Xám/Trắng | Task mới, chờ bắt đầu | (Mặc định khi tạo) |
| **Doing** | Xanh dương | Đang thực hiện | Staff (từ Todo) |
| **Need Verify** | Vàng/Cam | Hoàn thành, chờ duyệt | Staff (từ Doing) |
| **Finished** | Xanh lá | Đã duyệt xong | Leader (từ Need Verify) |
| *(Reject)* | Đỏ | Bị từ chối, làm lại | Leader (về Doing) |

---

## Mức Độ Ưu Tiên (Priority)

| Mức độ | Màu sắc | Ý nghĩa |
|--------|---------|---------|
| Low (Thấp) | 🟢 Xanh lá | Công việc không gấp |
| Normal (Bình thường) | 🔵 Xanh dương | Công việc thông thường |
| High (Cao) | 🟠 Cam | Công việc quan trọng |
| Urgent (Khẩn cấp) | 🔴 Đỏ | Cần xử lý ngay |

---

## Phân Quyền Theo Vai Trò

### Admin và Leader

| Action | Mô tả |
|--------|-------|
| ✅ Tạo task | Right-click tin nhắn → Tạo Task |
| ✅ Giao task | Chọn assignee khi tạo |
| ✅ Xem tất cả task | Trong nhóm mình quản lý |
| ✅ Duyệt task | Chuyển Need Verify → Finished |
| ✅ Reject task | Chuyển Need Verify → Doing |
| ✅ Xóa task | Xóa task đã tạo |
| ✅ Reassign task | Giao lại cho người khác |

### Staff (Nhân viên)

| Action | Mô tả |
|--------|-------|
| ✅ Xem task được giao | Chỉ task của mình |
| ✅ Todo → Doing | Click "Bắt đầu" |
| ✅ Doing → Need Verify | Click "Gửi duyệt" |
| ✅ Cập nhật checklist | Toggle checkbox |
| ❌ Tạo task | KHÔNG có option |
| ❌ Mark Finished | KHÔNG có quyền |
| ❌ Xem task người khác | KHÔNG cho phép |

---

## Các Màn Hình Task

### 1. Task List (Trong Right Panel)

```
┌─────────────────────────────────────────┐
│  TASKS (5)                    [+]       │
├─────────────────────────────────────────┤
│  Filter: [Tất cả ▼]                     │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐│
│  │ 📋 Kiểm tra 100 thùng hàng         ││
│  │    👤 Minh Anh         🟡 DOING    ││
│  │    Progress: ▓▓▓▓░░░░ 50%          ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ 📋 Xuất kho đơn #123               ││
│  │    👤 Huyền            🟠 HIGH     ││
│  │    Progress: ▓░░░░░░░ 10%          ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 2. Task Detail Modal

```
┌─────────────────────────────────────────────────────┐
│  TASK DETAIL                              [✕]       │
├─────────────────────────────────────────────────────┤
│  📋 Kiểm tra 100 thùng hàng                         │
│  Status: 🟡 DOING                 Priority: 🟠 HIGH │
├─────────────────────────────────────────────────────┤
│  Người được giao: 👤 Minh Anh                       │
│  Deadline: 28/01/2026                               │
│  WorkType: Nhận hàng                                │
├─────────────────────────────────────────────────────┤
│  CHECKLIST (3/6)                                    │
│  Progress: ▓▓▓▓▓▓░░░░░░ 50%                         │
│  ☑ Đếm số lượng theo hóa đơn                        │
│  ☑ Kiểm tra tình trạng bao bì                       │
│  ☑ Chụp ảnh evidence                                │
│  ☐ Ký xác nhận                                      │
│  ☐ Cập nhật hệ thống                                │
│  ☐ Báo cáo Leader                                   │
│  [+ Thêm item]                                      │
├─────────────────────────────────────────────────────┤
│  ACTIONS                                            │
│  [Bắt đầu] [Gửi duyệt] [Duyệt] [Reject]            │
│  (Buttons hiển thị theo quyền và status)           │
├─────────────────────────────────────────────────────┤
│  TASK LOG                                           │
│  ┌─────────────────────────────────────────────────┐│
│  │ 10:30 - Minh đã check xong 50 thùng             ││
│  │ 10:15 - Minh bắt đầu task                       ││
│  │ 10:00 - Leader tạo task                         ││
│  └─────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

### 3. Lead View (Kanban Board)

```
┌────────────────────────────────────────────────────────────────┐
│  LEAD VIEW - QUẢN LÝ CÔNG VIỆC                                 │
├────────────┬────────────┬────────────────┬────────────────────┤
│    TODO    │   DOING    │  NEED VERIFY   │     FINISHED       │
│    (3)     │    (5)     │      (2)       │        (8)         │
├────────────┼────────────┼────────────────┼────────────────────┤
│ ┌────────┐ │ ┌────────┐ │  ┌──────────┐  │  ┌──────────────┐  │
│ │Task A  │ │ │Task D  │ │  │Task G    │  │  │Task I        │  │
│ │Minh    │ │ │Huyền   │ │  │Nam       │  │  │Completed!    │  │
│ └────────┘ │ └────────┘ │  └──────────┘  │  └──────────────┘  │
│ ┌────────┐ │ ┌────────┐ │  ┌──────────┐  │  ┌──────────────┐  │
│ │Task B  │ │ │Task E  │ │  │Task H    │  │  │Task J        │  │
│ │An      │ │ │Minh    │ │  │Huyền     │  │  │Completed!    │  │
│ └────────┘ │ └────────┘ │  └──────────┘  │  └──────────────┘  │
│ ┌────────┐ │            │                │                    │
│ │Task C  │ │            │                │                    │
│ │Mai     │ │            │                │                    │
│ └────────┘ │            │                │                    │
│            │            │                │                    │
│  ← Drag-drop giữa các cột để đổi status →                     │
└────────────────────────────────────────────────────────────────┘
```

---

## Tạo Task Mới (Chi Tiết)

### Luồng Tạo Task

1. Leader/Admin right-click vào tin nhắn
2. Chọn "Tạo Task" từ menu
3. Modal tạo task mở ra
4. Điền thông tin:
   - **Title** (bắt buộc): Tiêu đề task
   - **Description**: Mô tả chi tiết
   - **Assignee** (bắt buộc): Người được giao
   - **WorkType**: Loại công việc
   - **Priority**: Mức ưu tiên
   - **Deadline**: Ngày hạn
   - **Checklist**: Từ template hoặc tự tạo
5. Nhấn "Tạo"
6. Task xuất hiện trong danh sách với status Todo

---

## Cập Nhật Status

| Chuyển đổi | Ai thực hiện | Cách thực hiện |
|------------|--------------|----------------|
| Todo → Doing | Staff | Click "Bắt đầu" hoặc drag sang cột Doing |
| Doing → Need Verify | Staff | Click "Gửi duyệt" |
| Need Verify → Finished | Leader | Click "Duyệt" |
| Need Verify → Doing | Leader | Click "Reject" + nhập lý do |

---

## [QC] Test Cases - Quản Lý Task

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Leader tạo task | Right-click tin → Tạo Task → Điền form | Task được tạo với status Todo | 🔴 Cao |
| 2 | Staff tạo task | Staff right-click tin nhắn | KHÔNG thấy option "Tạo Task" | 🔴 Cao |
| 3 | Todo → Doing | Staff click "Bắt đầu" | Status chuyển sang Doing | 🔴 Cao |
| 4 | Doing → Need Verify | Staff click "Gửi duyệt" | Status chuyển, Leader nhận notification | 🔴 Cao |
| 5 | Need Verify → Finished | Leader click "Duyệt" | Status chuyển sang Finished | 🔴 Cao |
| 6 | Leader reject | Leader click "Reject" | Status về Doing, Staff nhận notification | 🔴 Cao |
| 7 | Staff mark Finished | Staff thử chuyển sang Finished | KHÔNG có option | 🔴 Cao |
| 8 | Toggle checklist | Click checkbox item | Item checked, progress cập nhật | 🟠 TB |
| 9 | Thêm checklist item | Nhập tên, nhấn thêm | Item mới xuất hiện | 🟠 TB |
| 10 | Staff xem task người khác | Staff vào Lead View | KHÔNG có quyền truy cập | 🔴 Cao |
| 11 | Drag-drop Kanban | Leader drag card sang cột khác | Status thay đổi tương ứng | 🟠 TB |
| 12 | Filter task | Chọn filter theo status | Chỉ hiển thị task đúng filter | 🟢 Thấp |

---

## [Mobile] Lưu Ý Implementation

### Task List Screen
- Danh sách task dạng list hoặc cards
- Swipe để xem actions nhanh
- Pull to refresh

### Task Detail Screen
- Full screen modal
- Sticky header với title và status
- Scrollable content

### Status Changes
- Bottom sheet để chọn status mới
- Confirmation dialog cho actions quan trọng

### Checklist Interaction
- Toggle với haptic feedback
- Swipe to delete item

### Notifications
- Push notification khi được giao task mới
- Notification khi task được approve/reject

---

**Xem tiếp:** [06-quan-ly-file.md](./06-quan-ly-file.md)
