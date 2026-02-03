# 03. Danh Sách Hội Thoại

## Mô Tả Tính Năng

Tính năng danh sách hội thoại hiển thị tất cả các cuộc trò chuyện mà người dùng tham gia. Người dùng có thể tìm kiếm, lọc theo phân loại và chọn hội thoại để xem chi tiết.

---

## Vị Trí Trong Giao Diện

Danh sách hội thoại nằm ở **thanh bên trái (Left Sidebar)** của Portal. Trên mobile, sidebar này chuyển thành màn hình riêng hoặc drawer có thể vuốt ra.

---

## Cấu Trúc Sidebar

### Phần Đầu - Tabs Phân Loại
- Hiển thị các tab để lọc hội thoại theo loại
- Ví dụ: "Tất cả", "Đang hoạt động", "Đã lưu trữ"
- Tab đang chọn được highlight

### Phần Tìm Kiếm
- Ô tìm kiếm ở phía trên danh sách
- Tìm theo tên nhóm hoặc tên người
- Kết quả hiển thị ngay khi gõ (realtime filter)

### Phần Danh Sách Categories
- Các category (phân loại) được hiển thị dạng mục có thể mở rộng/thu gọn
- Mỗi category chứa nhiều conversations
- Hiển thị số tin chưa đọc bên cạnh category name

### Phần Danh Sách Conversations
- Mỗi item hiển thị:
  - Avatar hoặc ký tự đầu của tên nhóm
  - Tên nhóm/người
  - Tin nhắn cuối cùng (preview)
  - Thời gian tin nhắn cuối
  - Badge số tin chưa đọc (nếu có)
  - Indicator mention "@" (nếu được mention)

---

## Các Loại Hội Thoại

### Group Chat (Nhóm)
- Cuộc trò chuyện với nhiều người
- Thuộc về một phân loại (category) cụ thể
- Có thể có nhiều loại công việc (work types)
- Hiển thị số thành viên trong nhóm

### Direct Message (DM)
- Tin nhắn 1-1 giữa hai người
- Hiển thị trạng thái online/offline của người kia
- Không có work types

---

## Hành Vi Người Dùng

### Khi Mở Sidebar

**Lần đầu vào Portal:**
- Load danh sách categories và conversations từ server
- Hiển thị skeleton loading trong khi chờ
- Sau khi load xong, tự động chọn conversation được lưu lần trước (nếu có)

**Các lần sau:**
- Sử dụng cache để hiển thị nhanh
- Background refresh để cập nhật dữ liệu mới

### Khi Click Vào Conversation

- Highlight conversation đang chọn
- Load tin nhắn của conversation đó vào Main Content
- Đánh dấu đã đọc (xóa badge unread)
- Lưu selection để khôi phục khi reload

### Khi Nhận Tin Nhắn Mới

- Conversation nhận tin nhắn mới được đẩy lên đầu danh sách
- Tăng số badge unread (nếu không phải conversation đang xem)
- Cập nhật preview tin nhắn cuối
- Cập nhật thời gian

### Khi Tìm Kiếm

- Filter realtime khi người dùng gõ
- Tìm trong tên nhóm và tên thành viên
- Highlight text match (nếu có)
- Ô tìm kiếm trống → Hiển thị toàn bộ danh sách

---

## Chi Tiết Từng Thành Phần

### Conversation Item

Mỗi item trong danh sách chứa:

**Avatar:**
- Nhóm: Hiển thị 2 ký tự đầu của tên nhóm
- DM: Hiển thị avatar hoặc ký tự đầu tên người
- Background color ngẫu nhiên theo seed từ ID

**Tên:**
- Tên nhóm hoặc tên người (line 1)
- Giới hạn chiều dài, ellipsis nếu quá dài

**Preview tin nhắn:**
- Hiển thị dạng "Tên: nội dung..."
- Nếu là ảnh: "[hình ảnh]"
- Nếu là file: "[tài liệu]" hoặc tên file
- Giới hạn 1 dòng, ellipsis

**Thời gian:**
- Hiển thị dạng relative: "5 phút", "2 giờ", "Hôm qua"
- Cùng ngày: Hiển thị giờ (09:45)
- Khác ngày: Hiển thị ngày (25/01)

**Badge Unread:**
- Số tin chưa đọc (1, 2, 5, 10+)
- Nằm ở góc phải
- Màu đỏ/accent

**Mention Indicator:**
- Hiển thị "@" nếu có tin nhắn mention user
- Ưu tiên hiển thị hơn số unread

### Category Header

- Tên category
- Mũi tên mở rộng/thu gọn
- Số conversation trong category
- Có thể click để toggle expand/collapse

---

## Các Nút Chức Năng

### Nút Quick Message
- Nằm ở dưới sidebar hoặc trong header
- Mở dialog soạn tin nhanh
- Cho phép chọn người nhận và gửi tin ngay

### Nút Pinned Messages
- Mở danh sách tin nhắn đã ghim
- Hiển thị từ tất cả conversations

### Nút Todo List
- Mở danh sách công việc cần làm
- Hiển thị tasks được giao cho user

---

## [QC] Test Cases - Danh Sách Hội Thoại

| # | Kịch bản | Bước thực hiện | Kết quả mong đợi | Mức độ |
|---|----------|----------------|------------------|--------|
| 1 | Hiển thị danh sách | Đăng nhập vào Portal | Sidebar hiển thị danh sách conversations | 🔴 Cao |
| 2 | Chọn conversation | Click vào một conversation | Chat panel hiển thị tin nhắn | 🔴 Cao |
| 3 | Tìm kiếm | Gõ từ khóa vào ô tìm kiếm | Lọc ra các kết quả phù hợp | 🟠 TB |
| 4 | Nhận tin nhắn mới | User khác gửi tin | Badge unread tăng, conversation lên đầu | 🔴 Cao |
| 5 | Đánh dấu đã đọc | Click vào conversation có badge | Badge biến mất | 🔴 Cao |
| 6 | Expand/Collapse category | Click vào header category | Toggle hiển thị danh sách con | 🟢 Thấp |
| 7 | Lưu selection | Chọn conversation, refresh trang | Conversation vẫn được chọn | 🟠 TB |
| 8 | Empty state | User không có conversation nào | Hiển thị message "Chưa có hội thoại" | 🟢 Thấp |
| 9 | Loading state | Chờ load dữ liệu | Hiển thị skeleton placeholder | 🟢 Thấp |
| 10 | Error state | Mất kết nối khi load | Hiển thị thông báo lỗi và nút retry | 🟠 TB |

---

## [Mobile] Lưu Ý Implementation

### Layout
- Sidebar chuyển thành màn hình riêng (full screen)
- Dùng Tab Bar ở dưới để navigate giữa Chats, Tasks, Files, Profile
- Hoặc dùng Drawer có thể vuốt từ trái

### Pull to Refresh
- Kéo xuống để refresh danh sách
- Hiển thị loading indicator

### Swipe Actions
- Vuốt phải: Pin conversation
- Vuốt trái: Mute notifications hoặc Archive

### Navigation
- Click conversation → Push màn hình Chat Detail
- Có nút Back để quay về danh sách

---

**Xem tiếp:** [04-nhan-tin.md](./04-nhan-tin.md)
