# 04. Nhắn Tin (Messaging)

## Mô Tả Tính Năng

Tính năng nhắn tin cho phép người dùng gửi và nhận tin nhắn theo thời gian thực. Hỗ trợ nhiều loại tin nhắn khác nhau và các thao tác như reply, pin, star.

---

## Vị Trí Trong Giao Diện

Khu vực chat nằm ở **vùng chính (Main Content)** của Portal, giữa sidebar trái và panel thông tin bên phải.

---

## Cấu Trúc Chat Panel

### Header Chat
- Avatar và tên nhóm/người
- Số thành viên hoặc trạng thái online
- Các nút action: thông tin, tìm kiếm trong chat

### Danh Sách Tin Nhắn
- Hiển thị tin nhắn từ mới nhất ở dưới, cũ nhất ở trên
- Scroll lên để load thêm tin nhắn cũ
- Có phân cách ngày theo từng ngày
- Tin nhắn của mình ở bên phải, người khác ở bên trái

### Input Area
- Ô nhập tin nhắn
- Nút đính kèm file/ảnh
- Nút gửi
- Khu vực preview reply (nếu đang reply)

---

## Các Loại Tin Nhắn

### Tin Nhắn Văn Bản (Text)
- Nội dung text thuần
- Có thể có mention (@username)
- Hỗ trợ emoji
- Hiển thị trong bubble message

### Tin Nhắn Hình Ảnh (Image)
- Hiển thị thumbnail ảnh trong chat
- Click để xem full size với zoom
- Hỗ trợ gửi nhiều ảnh một lần (tối đa 4 ảnh/tin nhắn)
- Caption đi kèm ảnh (nếu có)

### Tin Nhắn File (File)
- Hiển thị card với icon loại file
- Tên file và kích thước
- Click để preview hoặc download
- Hỗ trợ PDF, Excel, Word, và các loại khác

### Tin Nhắn Hệ Thống (System)
- Thông báo tự động từ hệ thống
- Ví dụ: "User A đã thêm User B vào nhóm"
- Hiển thị căn giữa, style khác biệt

---

## Hành Vi Gửi Tin Nhắn

### Gửi Tin Văn Bản

**Bước 1:** Nhập nội dung vào ô input

**Bước 2:** Nhấn nút Gửi hoặc phím Enter

**Bước 3:** Tin nhắn xuất hiện ngay trong danh sách
- Trạng thái "sending" ban đầu
- Chuyển "sent" khi server xác nhận
- Hiển thị thời gian gửi

### Gửi Ảnh

**Bước 1:** Click nút đính kèm → Chọn ảnh

**Bước 2:** Ảnh hiển thị preview trước khi gửi

**Bước 3:** (Tùy chọn) Thêm caption

**Bước 4:** Nhấn Gửi

**Bước 5:** Ảnh upload với progress bar
- Upload xong → Hiển thị trong chat

### Gửi File

**Bước 1:** Click nút đính kèm → Chọn file

**Bước 2:** File được validate (loại, kích thước)

**Bước 3:** Nhấn Gửi

**Bước 4:** File upload với progress bar

**Bước 5:** Hiển thị card file trong chat

---

## Hành Vi Nhận Tin Nhắn

### Realtime Updates
- Tin nhắn mới xuất hiện ngay khi gửi đến
- Không cần refresh trang
- Animation slide-in cho tin nhắn mới

### Đang Ở Trong Conversation
- Tin nhắn mới thêm vào cuối danh sách
- Auto scroll xuống (nếu đang ở cuối)
- Nếu đang scroll xem tin cũ → Hiển thị nút "Tin nhắn mới" để jump xuống

### Không Ở Trong Conversation
- Badge unread tăng ở sidebar
- Toast notification xuất hiện (nếu enabled)
- Sound notification (nếu enabled)

---

## Các Thao Tác Trên Tin Nhắn

Khi click chuột phải (desktop) hoặc long press (mobile) vào tin nhắn, hiển thị menu context:

### Reply (Trả lời)
- Ai cũng có thể reply
- Input area hiển thị quote tin nhắn gốc
- Tin nhắn mới link đến tin gốc
- Click vào quote → Scroll đến tin gốc

### Edit (Sửa)
- Chỉ chủ tin nhắn mới sửa được
- Mở input với nội dung cũ
- Lưu → Cập nhật tin nhắn
- Hiển thị "(đã chỉnh sửa)" bên cạnh

### Delete (Xóa)
- Chỉ chủ tin nhắn mới xóa được
- Hiển thị confirm dialog
- Xóa mềm (soft delete) - tin nhắn ẩn đi
- Có thể hiện "Tin nhắn đã xóa"

### Pin (Ghim)
- Chỉ Leader/Admin mới pin được
- Tin nhắn được đánh dấu icon pin
- Xuất hiện trong danh sách Pinned Messages
- Unpin để bỏ ghim

### Star (Đánh dấu)
- Ai cũng có thể star
- Tin nhắn được đánh dấu icon star
- Xuất hiện trong danh sách Starred Messages
- Unstar để bỏ đánh dấu

### Create Task (Tạo task)
- Chỉ Leader/Admin mới thấy option này
- Mở modal tạo task với nội dung tin nhắn
- Task được link đến tin nhắn gốc

---

## Mention (@)

### Cách Mention
- Gõ "@" trong ô input
- Hiển thị dropdown danh sách thành viên
- Chọn người hoặc tiếp tục gõ để filter
- Người được mention sẽ nhận notification

### Hiển Thị
- Tên được mention highlight màu khác
- Clickable để xem profile

### Notification
- Người được mention nhận notification đặc biệt
- Badge mention "@" hiển thị ở sidebar

---

## Typing Indicator

### Khi Đang Gõ
- User khác thấy "Tên đang gõ..."
- Hiển thị ở dưới danh sách tin nhắn
- Animation dots (...)

### Timeout
- Sau 3-5 giây không gõ → Ẩn indicator
- Nhiều người gõ → Hiển thị "2 người đang gõ..."

---

## Load More (Pagination)

### Infinite Scroll
- Scroll lên đầu → Trigger load thêm tin cũ
- Loading spinner hiển thị ở đầu
- Mỗi lần load 50 tin nhắn
- Giữ vị trí scroll sau khi load xong

### End of Messages
- Khi đã load hết tin nhắn → Hiển thị "Đây là tin nhắn đầu tiên"

---

## [QC] Test Cases - Nhắn Tin

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Gửi tin văn bản | Nhập text, nhấn Gửi | Tin nhắn hiển thị ngay | 🔴 Cao |
| 2 | Gửi ảnh | Chọn ảnh, nhấn Gửi | Ảnh hiển thị với thumbnail | 🔴 Cao |
| 3 | Gửi file | Chọn PDF, nhấn Gửi | File card hiển thị | 🔴 Cao |
| 4 | Nhận tin realtime | User khác gửi tin | Tin xuất hiện không cần refresh | 🔴 Cao |
| 5 | Reply tin nhắn | Right-click → Reply | Tin mới có quote tin gốc | 🟠 TB |
| 6 | Edit tin nhắn | Right-click tin của mình → Edit | Nội dung được cập nhật | 🟠 TB |
| 7 | Delete tin nhắn | Right-click tin của mình → Delete | Tin nhắn bị ẩn/xóa | 🟠 TB |
| 8 | Pin tin nhắn (Leader) | Right-click → Pin | Icon pin xuất hiện | 🟠 TB |
| 9 | Star tin nhắn | Right-click → Star | Icon star xuất hiện | 🟢 Thấp |
| 10 | Mention user | Gõ @tên | User nhận notification đặc biệt | 🟠 TB |
| 11 | Scroll load more | Scroll lên đầu | Load thêm tin cũ | 🟠 TB |
| 12 | Typing indicator | Gõ tin nhắn | User khác thấy "đang gõ..." | 🟢 Thấp |
| 13 | Edit tin người khác | Right-click tin người khác | Không thấy option Edit | 🔴 Cao |
| 14 | Pin không có quyền | Staff right-click → tìm Pin | Không thấy option Pin | 🔴 Cao |

---

## [Mobile] Lưu Ý Implementation

### Keyboard Handling
- Khi keyboard mở → Chat slide lên
- Giữ input luôn visible
- Auto scroll khi nhận tin mới

### Long Press Menu
- Thay thế right-click bằng long press
- Hiển thị bottom sheet hoặc popover menu

### Image Picker
- Sử dụng native image picker
- Hỗ trợ chọn nhiều ảnh
- Compress ảnh trước khi upload

### File Upload
- Hỗ trợ document picker
- Giới hạn kích thước file
- Progress bar khi upload

### Push Notification
- Nhận notification khi app ở background
- Tap notification → Mở đúng conversation

---

**Xem tiếp:** [05-quan-ly-task.md](./05-quan-ly-task.md)
