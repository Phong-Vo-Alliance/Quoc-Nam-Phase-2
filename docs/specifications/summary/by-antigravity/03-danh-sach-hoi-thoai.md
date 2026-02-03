# 03. Danh Sách Hội Thoại

> **Đối tượng:** Team QC và Team Mobile  
> **Cập nhật:** 27/01/2026

---

## Mô Tả Tính Năng

Tính năng danh sách hội thoại hiển thị tất cả các cuộc trò chuyện mà người dùng tham gia. Người dùng có thể tìm kiếm, lọc theo phân loại và chọn hội thoại để xem chi tiết.

---

## Cách Truy Cập

- **Vị trí:** Thanh bên trái (Left Sidebar) của Portal
- **Mobile:** Tab "Chats" hoặc Drawer vuốt từ trái

---

## Cấu Trúc Sidebar

```
┌─────────────────────────────────────────┐
│  [Tabs] Tất cả | Nhóm | Cá nhân        │
├─────────────────────────────────────────┤
│  🔍 [    Tìm kiếm hội thoại...    ]    │
├─────────────────────────────────────────┤
│                                         │
│  ▼ VẬN HÀNH (5)              [3]       │
│  ┌─────────────────────────────────────┐│
│  │ 📦 Nhóm Kho A                    5m ││
│  │    Minh: Kiểm xong rồi         [2] ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ 📋 Nhóm Kho B                   10m ││
│  │    Huyền: Ok em check lại      [1] ││
│  └─────────────────────────────────────┘│
│                                         │
│  ▼ CSKH (3)                             │
│  ┌─────────────────────────────────────┐│
│  │ 📞 Team CSKH 1                   2h ││
│  │    Mai: Đã giải quyết xong         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ... (các hội thoại khác)               │
│                                         │
├─────────────────────────────────────────┤
│  [📌 Pinned] [📋 Todo] [✉️ Quick]      │
└─────────────────────────────────────────┘
```

---

## Chi Tiết Từng Thành Phần

### Tabs Phân Loại

| Tab | Chức năng |
|-----|-----------|
| Tất cả | Hiển thị tất cả hội thoại |
| Nhóm | Chỉ hiển thị Group Chat |
| Cá nhân | Chỉ hiển thị Direct Messages (DM) |

### Ô Tìm Kiếm

- **Vị trí:** Ngay dưới tabs
- **Hành vi:** Tìm theo tên nhóm hoặc tên người
- **Filter:** Kết quả hiển thị ngay khi gõ (realtime)

### Category Header

| Thành phần | Mô tả |
|------------|-------|
| Tên category | Ví dụ: "VẬN HÀNH" |
| Số hội thoại | Số trong ngoặc (5) |
| Badge unread | Tổng tin chưa đọc trong category |
| Mũi tên | Click để mở rộng/thu gọn |

### Conversation Item

| Thành phần | Mô tả | Ví dụ |
|------------|-------|-------|
| Avatar | 2 ký tự đầu tên nhóm, hoặc ảnh avatar | 📦 |
| Tên | Tên nhóm hoặc tên người | "Nhóm Kho A" |
| Preview tin | "Tên: nội dung..." | "Minh: Kiểm xong rồi" |
| Thời gian | Relative time | "5m", "2h", "Hôm qua" |
| Badge unread | Số tin chưa đọc | [2] |
| Mention "@" | Hiển thị nếu được mention | @ |

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
1. Load danh sách categories và conversations từ server
2. Hiển thị skeleton loading trong khi chờ
3. Sau khi load xong, tự động chọn conversation được lưu lần trước (nếu có)

**Các lần sau:**
1. Sử dụng cache để hiển thị nhanh
2. Background refresh để cập nhật dữ liệu mới

### Khi Click Vào Conversation

1. Highlight conversation đang chọn
2. Load tin nhắn của conversation vào Main Content
3. Đánh dấu đã đọc (xóa badge unread)
4. Lưu selection để khôi phục khi reload

### Khi Nhận Tin Nhắn Mới

| Tình huống | Hành vi |
|------------|---------|
| Đang xem conversation đó | Tin thêm vào cuối, không có badge |
| Không xem conversation đó | Badge unread tăng, đẩy lên đầu danh sách |
| Được mention | Hiển thị icon "@" |

### Khi Tìm Kiếm

1. Gõ từ khóa vào ô tìm kiếm
2. Danh sách filter realtime
3. Tìm trong tên nhóm và tên thành viên
4. Highlight text match (nếu có)
5. Ô trống → Hiển thị toàn bộ danh sách

---

## Trạng Thái Hiển Thị

### Conversation Item States

| Trạng thái | Mô tả | Visual |
|------------|-------|--------|
| Unread | Có tin chưa đọc | Bold text, có badge số |
| Selected | Đang xem | Background highlight |
| Online (DM) | Người kia đang online | Dot xanh trên avatar |
| Mention | Được mention trong nhóm | Icon "@" |

### Định Dạng Thời Gian

| Khoảng cách | Hiển thị |
|-------------|----------|
| Dưới 1 phút | "Vừa xong" |
| Dưới 1 giờ | "5 phút" |
| Dưới 24 giờ | "2 giờ" |
| Hôm qua | "Hôm qua" |
| Cùng tuần | "Thứ 5" |
| Khác tuần | "25/01" |

---

## Các Nút Chức Năng (Dưới Sidebar)

| Nút | Chức năng | Mô tả |
|-----|-----------|-------|
| 📌 Pinned | Mở danh sách tin ghim | Từ tất cả conversations |
| 📋 Todo | Mở danh sách tasks | Tasks được giao cho user |
| ✉️ Quick | Mở dialog nhắn nhanh | Soạn tin và chọn người nhận |

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
| 10 | Error state | Mất kết nối khi load | Hiển thị lỗi và nút retry | 🟠 TB |
| 11 | Tab filter | Click tab "Nhóm" | Chỉ hiển thị Group Chat | 🟠 TB |
| 12 | Mention indicator | User được mention trong nhóm | Icon "@" xuất hiện | 🟠 TB |

---

## [Mobile] Lưu Ý Implementation

### Layout

| Desktop | Mobile |
|---------|--------|
| Sidebar luôn visible | Tab "Chats" riêng (full screen) |
| Click → Load chat bên phải | Click → Push màn hình Chat Detail |

### Pull to Refresh
- Kéo xuống để refresh danh sách
- Hiển thị loading indicator

### Swipe Actions

| Hướng vuốt | Action |
|------------|--------|
| Vuốt phải | Pin conversation |
| Vuốt trái | Mute notifications hoặc Archive |

### Navigation

- Click conversation → Push màn hình Chat Detail
- Có nút Back để quay về danh sách

### Performance

- Dùng FlatList với virtualization
- Load thêm khi scroll gần cuối
- Cache ảnh avatar

---

**Xem tiếp:** [04-nhan-tin.md](./04-nhan-tin.md)
