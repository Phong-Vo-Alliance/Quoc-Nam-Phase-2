# 03. Danh Sách Hội Thoại

> **Dành cho:** Team QC  
> **Cập nhật:** 27/01/2026

---

## 📌 Tổng Quan

Danh sách hội thoại là nơi người dùng xem tất cả các nhóm chat và cuộc trò chuyện mà họ tham gia. Đây là điểm khởi đầu để truy cập vào các cuộc hội thoại.

---

## 📍 Cách Truy Cập

### Desktop

```
┌─────────────────────────────────────────────────┐
│  MAIN    │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │   RIGHT       │
│ SIDEBAR  │  ▓ DANH SÁCH ▓▓▓▓▓  │   PANEL       │
│          │  ▓ HỘI THOẠI ▓▓▓▓▓  │               │
│  - Nav   │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │               │
│  - User  │                     │               │
└─────────────────────────────────────────────────┘
```

**Vị trí:** Sidebar trái, rộng ~300-350px

### Mobile

```
┌───────────────────────────┐
│      HEADER               │
├───────────────────────────┤
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓ DANH SÁCH HỘI ▓▓▓▓▓  │
│  ▓▓ THOẠI (Full)  ▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
├───────────────────────────┤
│    BOTTOM NAVIGATION      │
│  [💬] [📋] [👤]          │
└───────────────────────────┘
```

**Vị trí:** Tab "Tin nhắn" trong Bottom Navigation → Toàn bộ màn hình

---

## 🎨 Giao Diện Danh Sách Hội Thoại

```
┌─────────────────────────────────────────────┐
│  DANH SÁCH HỘI THOẠI                       │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  🔍  Tìm kiếm...                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ┌────────┬────────┐                       │
│  │ Nhóm   │ Cá Nhân│                       │
│  └────────┴────────┘                       │
│                                             │
│  ▼ VẬN HÀNH (5)                            │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho A            10:30  🔴3 │   │
│  │    Đã kiểm xong 100 thùng...       │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Nhóm Kho B            09:15      │   │
│  │    OK, tiếp tục nhé                 │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ▼ KHÁCH HÀNG (3)                          │
│  ┌─────────────────────────────────────┐   │
│  │ 👥 Team CSKH 1           Yesterday  │   │
│  │    Khách hàng hỏi về...            │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 🗂️ Phân Loại Hội Thoại

### Tab "Nhóm"

| Đặc điểm           | Mô tả                                                  |
| ------------------ | ------------------------------------------------------ |
| **Nội dung**       | Các nhóm chat được tổ chức theo danh mục (categories)  |
| **Ví dụ danh mục** | Vận Hành, Khách Hàng, Kế Toán, Hành Chính...           |
| **Hiển thị**       | Có thể collapse/expand (thu gọn/mở rộng) từng danh mục |
| **Số lượng**       | Hiển thị số hội thoại trong ngoặc: `VẬN HÀNH (5)`      |

### Tab "Cá Nhân"

| Đặc điểm              | Mô tả                                                 |
| --------------------- | ----------------------------------------------------- |
| **Nội dung**          | Các cuộc trò chuyện 1-1 giữa người dùng và người khác |
| **Không có danh mục** | Sắp xếp theo thời gian tin nhắn mới nhất              |
| **Avatar**            | Hiển thị avatar của người đối thoại                   |
| **Trạng thái**        | Hiển thị online/offline của người đối thoại           |

---

## 📋 Thông Tin Hiển Thị Mỗi Hội Thoại

### Cấu Trúc Item

```
┌──────────────────────────────────────────────┐
│  [Avatar] Tên Hội Thoại       [Time]  [🔴3] │
│           Tin nhắn cuối cùng...              │
│           📍 Loại công việc hiện tại         │
└──────────────────────────────────────────────┘
```

### Chi Tiết Các Thành Phần

| Thành phần         | Mô tả                       | Ví dụ                        |
| ------------------ | --------------------------- | ---------------------------- |
| **Avatar**         | Icon nhóm hoặc ảnh đại diện | 👥, 👤                       |
| **Tên**            | Tên nhóm hoặc tên người     | "Nhóm Kho A"                 |
| **Thời gian**      | Thời gian tin nhắn cuối     | 10:30, Yesterday, 2 days ago |
| **Badge đỏ**       | Số tin nhắn chưa đọc        | 🔴3 (chỉ hiện khi có)        |
| **Preview**        | Nội dung rút gọn tin cuối   | "Đã kiểm xong 100 thùng..."  |
| **Loại công việc** | Work type đang active       | 📍 Nhận hàng                 |

---

## 🎨 Các Trạng Thái Hiển Thị

### Hội Thoại Được Chọn

```
┌──────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
│  ▓ [Avatar] Nhóm Kho A  10:30  🔴3        ▓ │
│  ▓         Đã kiểm xong...                ▓ │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
└──────────────────────────────────────────────┘
```

**Đặc điểm:** Background highlight màu xanh nhạt

### Hội Thoại Có Tin Chưa Đọc

| Đặc điểm      | Hiển thị                   |
| ------------- | -------------------------- |
| Badge         | 🔴 + số lượng (ví dụ: 🔴3) |
| Tên hội thoại | **In đậm (bold)**          |
| Preview       | **In đậm (bold)**          |

### Hội Thoại Đã Đọc

| Đặc điểm      | Hiển thị                   |
| ------------- | -------------------------- |
| Badge         | Không hiển thị             |
| Tên hội thoại | Font bình thường (regular) |
| Preview       | Font bình thường (regular) |

---

## 🔍 Tìm Kiếm Hội Thoại

### Giao Diện

```
┌─────────────────────────────────────────┐
│  🔍  Tìm kiếm hội thoại...              │
└─────────────────────────────────────────┘
```

### Chức Năng Tìm Kiếm

| Tiêu chí           | Mô tả                                         |
| ------------------ | --------------------------------------------- |
| **Tìm theo**       | Tên nhóm, tên người dùng                      |
| **Cách hoạt động** | Gõ → Lọc real-time → Hiển thị kết quả khớp    |
| **Highlight**      | Từ khóa được highlight trong kết quả (nếu có) |

**Ví dụ:**

```
Gõ: "kho"
→ Hiển thị:
  - Nhóm Kho A
  - Nhóm Kho B
  - Nhóm Kiểm Kho C
```

---

## 🔄 Cập Nhật Real-time

### Khi Có Tin Nhắn Mới

```
Bước 1: Nhận tin nhắn mới từ SignalR
         ↓
Bước 2: Hội thoại đó nhảy lên đầu danh sách
         ↓
Bước 3: Badge unread +1
         ↓
Bước 4: Preview cập nhật = nội dung tin mới
```

### Khi Đọc Tin Nhắn

```
Bước 1: User vào hội thoại
         ↓
Bước 2: Tự động gọi API mark-as-read
         ↓
Bước 3: Badge unread = 0
         ↓
Bước 4: Tên và preview trở về font bình thường
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng           | Desktop                | Mobile                    |
| ------------------- | ---------------------- | ------------------------- |
| **Vị trí**          | Sidebar trái           | Toàn màn hình (Tab 1)     |
| **Chiều rộng**      | 300-350px              | 100%                      |
| **Click hội thoại** | Chat mở ở giữa         | Navigate sang màn Chat    |
| **Collapse/expand** | Click tiêu đề danh mục | Click tiêu đề danh mục    |
| **Pull-to-refresh** | Không có               | Có (kéo xuống để refresh) |

---

## 🎯 Hành Vi Khi Click Hội Thoại

### Desktop

```
Click hội thoại
         ↓
Chat Area (giữa màn) load tin nhắn của hội thoại đó
         ↓
Right Panel (bên phải) hiển thị thông tin chi tiết
         ↓
URL không thay đổi (hoặc thêm query param)
```

### Mobile

```
Click hội thoại
         ↓
Navigate sang màn Chat (full screen)
         ↓
Nút Back ← để quay về danh sách
```

---

## ⚠️ Lưu Ý Quan Trọng

### Khác Biệt Quyền Xem Giữa Staff và Leader

| Vai trò    | Hội thoại được thấy                 |
| ---------- | ----------------------------------- |
| **Staff**  | CHỈ hội thoại được phân công vào    |
| **Leader** | TẤT CẢ hội thoại trong nhóm quản lý |

---

## ✅ Checklist Kiểm Thử

### Danh Sách Hội Thoại

- [ ] **Hiển thị danh sách** - Các hội thoại load đúng
- [ ] **Phân loại theo category** - Nhóm đúng danh mục
- [ ] **Collapse/expand** - Click tiêu đề category → Thu gọn/mở rộng
- [ ] **Tab Nhóm/Cá Nhân** - Chuyển đổi đúng nội dung

### Thông Tin Hội Thoại

- [ ] **Avatar** - Hiển thị đúng
- [ ] **Tên** - Hiển thị đúng tên nhóm/người
- [ ] **Thời gian** - Hiển thị đúng (vừa rồi, hôm qua, ngày cụ thể)
- [ ] **Preview tin nhắn** - Hiển thị nội dung tin cuối cùng
- [ ] **Badge unread** - Hiển thị số tin chưa đọc

### Tìm Kiếm

- [ ] **Gõ từ khóa** - Lọc danh sách real-time
- [ ] **Không có kết quả** - Hiển thị "Không tìm thấy"
- [ ] **Xóa từ khóa** - Danh sách hiển thị lại đầy đủ

### Real-time

- [ ] **Tin nhắn mới** - Hội thoại nhảy lên đầu
- [ ] **Badge cập nhật** - Số tăng khi có tin mới
- [ ] **Đọc tin** - Badge về 0

### Click Hội Thoại

- [ ] **Desktop** - Chat load ở giữa, không navigate
- [ ] **Mobile** - Navigate sang màn Chat

### Phân Quyền

- [ ] **Staff** - Chỉ thấy hội thoại được phân công
- [ ] **Leader** - Thấy tất cả hội thoại nhóm

---

## 📖 Xem Tiếp

→ [04_NHAN_TIN.md](./04_NHAN_TIN.md) - Chi tiết về gửi và nhận tin nhắn
