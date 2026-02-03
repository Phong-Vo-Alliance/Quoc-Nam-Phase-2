# 05. Quản Lý Task

## Mô Tả Tính Năng

Tính năng quản lý task cho phép tạo công việc từ tin nhắn trong chat và theo dõi tiến độ. Mỗi task có quy trình trạng thái rõ ràng, checklist để theo dõi các bước, và phân quyền theo vai trò.

---

## Khái Niệm Chính

### Task (Công việc)
Một đơn vị công việc được tạo từ tin nhắn trong chat. Task chứa thông tin về người được giao, trạng thái, deadline và danh sách các bước cần làm.

### Assignee (Người được giao)
Nhân viên được Leader/Admin giao task. Người này có trách nhiệm thực hiện và cập nhật trạng thái task.

### Assigner (Người giao)
Leader hoặc Admin là người tạo và giao task cho nhân viên.

### Checklist
Danh sách các bước/công việc con cần hoàn thành trong task. Giúp theo dõi tiến độ chi tiết.

---

## Quy Trình Trạng Thái (Status Flow)

Task đi qua 4 trạng thái theo thứ tự:

### 1. Todo (Chưa xử lý)
- Trạng thái ban đầu khi task mới được tạo
- Task đang chờ nhân viên bắt đầu làm
- Hiển thị màu xám hoặc trắng

### 2. Doing (Đang xử lý)
- Nhân viên đã bắt đầu làm task này
- Chuyển từ Todo khi nhân viên nhấn "Bắt đầu"
- Hiển thị màu xanh dương

### 3. Need Verify (Chờ duyệt)
- Nhân viên đã hoàn thành và gửi cho Leader duyệt
- Chờ Leader kiểm tra và xác nhận
- Hiển thị màu vàng/cam

### 4. Finished (Hoàn thành)
- Leader đã duyệt task thành công
- Task kết thúc
- Hiển thị màu xanh lá

### Luồng Reject (Từ chối)
- Leader có thể reject task từ Need Verify về Doing
- Nhân viên cần sửa lại và submit lại
- Ghi nhận lý do reject trong lịch sử task

---

## Mức Độ Ưu Tiên (Priority)

Mỗi task có thể được gán một trong 4 mức ưu tiên:

| Mức độ | Màu sắc | Ý nghĩa |
|--------|---------|---------|
| Low (Thấp) | Xanh lá | Công việc không gấp |
| Normal (Bình thường) | Xanh dương | Công việc thông thường |
| High (Cao) | Cam | Công việc quan trọng |
| Urgent (Khẩn cấp) | Đỏ | Cần xử lý ngay |

---

## Phân Quyền Theo Vai Trò

### Admin và Leader có thể:
- Tạo task mới từ tin nhắn
- Giao task cho nhân viên
- Xem tất cả task trong nhóm
- Chuyển task sang Finished (duyệt)
- Reject task (chuyển về Doing)
- Xóa task
- Reassign task cho người khác

### Staff (Nhân viên) có thể:
- Xem task được giao cho mình
- Chuyển task từ Todo sang Doing
- Chuyển task từ Doing sang Need Verify
- Cập nhật checklist của task mình
- KHÔNG thể tự mark Finished
- KHÔNG thể xem task của người khác

---

## Các Màn Hình Task

### Task List (Trong Panel Phải)
- Tab "Tasks" trong Information Panel
- Hiển thị danh sách task liên kết với conversation hiện tại
- Có thể filter theo status

### Task Detail Modal
- Mở khi click vào task card
- Hiển thị đầy đủ thông tin:
  - Tiêu đề và mô tả
  - Người được giao (với avatar)
  - Trạng thái và priority
  - Deadline
  - Checklist với progress bar
  - Lịch sử thay đổi

### Kanban Board (Lead View)
- Màn hình riêng cho Leader/Admin
- 4 cột: Todo, Doing, Need Verify, Finished
- Drag-and-drop task giữa các cột
- Tổng quan tất cả task trong nhóm

### My Tasks (Staff View)
- Danh sách task được giao cho user hiện tại
- Filter và sort theo status, priority, deadline
- Quick actions để chuyển status

---

## Các Hành Động Trên Task

### Tạo Task Mới

**Bước 1:** Leader/Admin right-click vào tin nhắn

**Bước 2:** Chọn "Tạo Task"

**Bước 3:** Modal tạo task mở ra với:
- Tiêu đề (bắt buộc)
- Mô tả (tùy chọn)
- Người được giao (bắt buộc)
- Loại công việc (WorkType)
- Mức ưu tiên
- Deadline
- Checklist template

**Bước 4:** Nhấn "Tạo" 

**Bước 5:** Task xuất hiện trong danh sách với status Todo

### Cập Nhật Status

**Từ Todo → Doing:**
- Nhân viên click nút "Bắt đầu" hoặc drag card sang cột Doing
- Hệ thống ghi nhận thời gian bắt đầu

**Từ Doing → Need Verify:**
- Nhân viên hoàn thành công việc
- Click nút "Gửi duyệt" hoặc drag card sang cột Need Verify
- Leader nhận notification

**Từ Need Verify → Finished:**
- Leader kiểm tra công việc
- Click nút "Duyệt" hoặc drag card sang cột Finished
- Task đóng lại

**Reject (Need Verify → Doing):**
- Leader click nút "Reject"
- Nhập lý do reject (tùy chọn)
- Task chuyển về Doing
- Nhân viên nhận notification

### Cập Nhật Checklist

**Toggle item:**
- Click checkbox bên cạnh item
- Item được đánh dấu hoàn thành
- Progress bar cập nhật

**Thêm item:**
- Nhập tên item mới vào ô input
- Nhấn Enter hoặc nút thêm
- Item xuất hiện trong danh sách

**Xóa item:**
- Click nút xóa bên cạnh item
- Item bị xóa khỏi danh sách

---

## Task Log Thread

Mỗi task có một thread riêng để trao đổi:

- Giống như mini chat thread
- Nhân viên và Leader có thể gửi tin nhắn
- Upload evidence files
- Ghi nhận tự động các thay đổi status
- Lịch sử hoàn chỉnh của task

---

## [QC] Test Cases - Quản Lý Task

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Leader tạo task | Right-click tin nhắn → Tạo Task → Điền form | Task được tạo với status Todo | 🔴 Cao |
| 2 | Staff tạo task | Staff right-click tin nhắn | Không thấy option "Tạo Task" | 🔴 Cao |
| 3 | Todo → Doing | Staff click "Bắt đầu" | Status chuyển sang Doing | 🔴 Cao |
| 4 | Doing → Need Verify | Staff click "Gửi duyệt" | Status chuyển, Leader nhận notification | 🔴 Cao |
| 5 | Need Verify → Finished | Leader click "Duyệt" | Status chuyển sang Finished | 🔴 Cao |
| 6 | Leader reject | Leader click "Reject" | Status về Doing, Staff nhận notification | 🔴 Cao |
| 7 | Staff mark Finished | Staff thử chuyển sang Finished | Không được phép, không có option | 🔴 Cao |
| 8 | Toggle checklist | Click checkbox item | Item checked, progress cập nhật | 🟠 TB |
| 9 | Thêm checklist item | Nhập tên, nhấn thêm | Item mới xuất hiện | 🟠 TB |
| 10 | Xem task của người khác (Staff) | Staff vào Lead View | Không có quyền truy cập | 🔴 Cao |
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
