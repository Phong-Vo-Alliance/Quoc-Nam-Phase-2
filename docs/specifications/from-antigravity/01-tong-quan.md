# 01. Tổng Quan Hệ Thống

## Giới Thiệu

**Quốc Nam Internal Chat Portal** là ứng dụng chat nội bộ doanh nghiệp phục vụ việc liên lạc giữa các phòng ban và quản lý công việc. Ứng dụng cho phép nhân viên trao đổi thông tin qua tin nhắn, tạo và theo dõi công việc (task), cũng như chia sẻ file một cách an toàn.

---

## Các Module Chính

### 1. Xác Thực (Authentication)
Quản lý việc đăng nhập, phân quyền và duy trì phiên làm việc của người dùng. Người dùng cần đăng nhập bằng tài khoản nội bộ để truy cập hệ thống.

### 2. Nhắn Tin (Messaging)
Cho phép gửi và nhận tin nhắn theo thời gian thực. Hỗ trợ tin nhắn văn bản, hình ảnh và file đính kèm. Tin nhắn được nhận tức thì mà không cần refresh trang.

### 3. Quản Lý Hội Thoại (Conversations)
Tổ chức các cuộc trò chuyện theo nhóm (group chat) hoặc tin nhắn trực tiếp (DM). Mỗi nhóm có thể thuộc về một phân loại (category) cụ thể.

### 4. Quản Lý Task (Task Management)
Cho phép tạo công việc từ tin nhắn trong chat. Task có quy trình trạng thái rõ ràng và checklist để theo dõi tiến độ.

### 5. Quản Lý File (File Management)
Hỗ trợ upload, preview và tổ chức file theo thư mục. File được bảo vệ bằng watermark và các biện pháp chống sao chép.

### 6. Bảo Mật (Security)
Các biện pháp bảo vệ nội dung khỏi bị sao chép trái phép, bao gồm chặn DevTools, chặn menu chuột phải, và watermark trên file.

---

## Cấu Trúc Giao Diện

Giao diện ứng dụng được chia thành các vùng chính:

**Thanh trên cùng (Top Bar)**
- Logo và tên ứng dụng
- Thông tin người dùng đang đăng nhập
- Nút đăng xuất

**Thanh bên trái (Left Sidebar)**
- Danh sách phân loại (categories)
- Danh sách hội thoại (conversations)
- Ô tìm kiếm hội thoại

**Vùng chính (Main Content)**
- Khu vực chat với danh sách tin nhắn
- Ô nhập tin nhắn và gửi file

**Thanh bên phải (Right Panel)**
- Thông tin chi tiết hội thoại
- Danh sách thành viên
- Các tab: Thông tin, Pinned, Media, Files, Tasks

---

## Vai Trò Người Dùng

Hệ thống phân quyền theo 3 vai trò chính:

### Admin (Quản trị viên)
- Có toàn quyền trong hệ thống
- Quản lý thành viên nhóm
- Thực hiện mọi thao tác trên task

### Leader (Trưởng nhóm)
- Tạo và giao task cho nhân viên
- Duyệt task (chuyển sang Finished)
- Reject task về trạng thái Doing
- Ghim (pin) tin nhắn quan trọng
- Xem tất cả task trong nhóm

### Staff (Nhân viên)
- Tham gia chat và gửi tin nhắn
- Xem và cập nhật task được giao cho mình
- Chuyển task sang trạng thái Doing hoặc Need Verify
- Không thể tự mark task là Finished

---

## Luồng Hoạt Động Chính

**Luồng 1: Đăng nhập vào hệ thống**
1. Người dùng mở ứng dụng
2. Hiển thị màn hình đăng nhập
3. Nhập username và password
4. Hệ thống xác thực và chuyển vào Portal

**Luồng 2: Gửi và nhận tin nhắn**
1. Chọn hội thoại từ sidebar
2. Xem lịch sử tin nhắn
3. Nhập và gửi tin nhắn mới
4. Tin nhắn hiển thị ngay lập tức

**Luồng 3: Tạo và xử lý Task**
1. Leader chọn tin nhắn và tạo task
2. Task được giao cho staff với trạng thái Todo
3. Staff chuyển sang Doing khi bắt đầu làm
4. Staff chuyển sang Need Verify khi hoàn thành
5. Leader duyệt và chuyển sang Finished

---

## [QC] Test Cases Tổng Quan

| # | Kịch bản | Kết quả mong đợi |
|---|----------|------------------|
| 1 | Đăng nhập thành công | Vào được Portal, thấy danh sách hội thoại |
| 2 | Gửi tin nhắn | Tin nhắn hiển thị ngay trong chat |
| 3 | Nhận tin nhắn từ người khác | Có notification và tin nhắn xuất hiện |
| 4 | Tạo task từ tin nhắn (Leader) | Task xuất hiện trong danh sách tasks |
| 5 | Cập nhật status task (Staff) | Status thay đổi đúng quy trình |
| 6 | Upload file | File hiển thị trong tin nhắn và thư mục file |

---

## [Mobile] Lưu Ý Cho Implementation

- Ứng dụng sử dụng kết nối real-time cho tin nhắn, cần duy trì connection khi app ở foreground
- Token xác thực cần được lưu an toàn trong SecureStore
- Cần xử lý reconnect khi mất kết nối mạng
- Layout responsive, sidebar trên mobile chuyển thành bottom tab hoặc drawer

---

**Xem tiếp:** [02-dang-nhap.md](./02-dang-nhap.md)
