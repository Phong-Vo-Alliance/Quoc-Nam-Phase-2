# 13. Theo Dõi Team (Leader Dashboard)

> **Mục đích:** Mô tả tính năng Dashboard cho Leader để theo dõi hoạt động và công việc của team
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Dashboard "Theo Dõi Team" là tính năng dành riêng cho Leader, cho phép giám sát tổng quan hoạt động và công việc của team real-time.

**Mục đích chính:**
- Giám sát tất cả hội thoại trong nhóm quản lý
- Theo dõi công việc đang xử lý của team
- Xem tải công việc của từng thành viên
- Thống kê tiến độ công việc (TODO, DOING, VERIFY, FINISHED)
- Phát hiện kịp thời các vấn đề cần hỗ trợ

**Người dùng:**
- **Leader:** Có quyền truy cập Dashboard
- **Admin:** Có quyền truy cập Dashboard (xem toàn hệ thống)
- **Staff:** KHÔNG có quyền truy cập

---

## 🔐 Phân Quyền

### Leader
✅ **Được phép:**
- Xem Dashboard của nhóm mình quản lý
- Theo dõi tất cả hội thoại trong nhóm
- Xem công việc của tất cả thành viên
- Xem thống kê team
- Phân biệt hội thoại: Tham gia trực tiếp (👤) vs Chỉ theo dõi (👁️)

### Admin
✅ **Được phép:**
- Xem Dashboard toàn hệ thống
- Chuyển đổi giữa các nhóm/phòng ban
- Xem báo cáo tổng hợp

### Staff
❌ **KHÔNG được phép:**
- Không thấy menu "Theo Dõi Team"
- Chỉ xem được công việc của bản thân

---

## 📍 Vị Trí

### Desktop

```
┌────────────────────────────────────────────────┐
│  ▓▓▓▓▓▓▓▓▓  │  MAIN CONTENT    │  RIGHT PANEL │
│  ▓ SIDEBAR▓ │                  │              │
│  ▓         ▓│  Dashboard       │  Filters     │
│  ▓ 💬 Tin  ▓│  Leader          │  Stats       │
│  ▓ 📋 Việc ▓│                  │              │
│  ▓ 👤 Cá   ▓│                  │              │
│  ▓   nhân  ▓│                  │              │
│  ▓         ▓│                  │              │
│  ▓ ✨📊    ▓│                  │              │
│  ▓ Theo Dõi▓│                  │              │
│  ▓ Team    ▓│                  │              │
└────────────────────────────────────────────────┘
```

**Cách mở:**
- Click vào menu "📊 Theo Dõi Team" trong main sidebar
- Chỉ Leader/Admin mới thấy menu này

### Mobile

```
┌───────────────────────────────┐
│  💬    📋    👤   [📊]        │
│  Tin   Việc  Cá   Leader      │
│  Nhắn        Nhân Dashboard   │
└───────────────────────────────┘
```

**Cách mở:**
- Tap vào tab "Cá nhân" (👤)
- Trong profile → Tap "📊 Dashboard Leader" (chỉ Leader thấy)
- Hoặc thêm tab thứ 4 trong bottom nav (tùy thiết kế)

---

## 🎨 Giao Diện Dashboard

### Desktop Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  SIDEBAR  │          DASHBOARD LEADER                │ FILTERS  │
│           │                                          │          │
│  💬 Tin   │  ┌────────────────────────────────────┐ │ Lọc:     │
│  📋 Việc  │  │  TỔNG QUAN TEAM                    │ │ ☐ Tất cả │
│  👤 Cá    │  │                                    │ │ ☑ Kho A  │
│    nhân   │  │  📊 12  🔔 8   ⏳ 5   ✅ 45       │ │ ☑ Kho B  │
│           │  │  Hội    Đang   Chờ    Hoàn        │ │ ☐ Kho C  │
│  ✨📊    │  │  thoại  xử lý  duyệt   thành      │ │          │
│  Theo Dõi │  │                                    │ │ ─────── │
│  Team     │  └────────────────────────────────────┘ │ Trạng    │
│           │                                          │ thái:    │
│           │  ┌────────────────────────────────────┐ │ ☑ TODO   │
│           │  │  HỘI THOẠI ĐANG HOẠT ĐỘNG         │ │ ☑ DOING  │
│           │  │  ┌──────────────────────────────┐ │ │ ☑ VERIFY │
│           │  │  │ 👤 Nhóm Kho A       🔴3      │ │ │ ☐ DONE   │
│           │  │  │ Tin mới: "Đã kiểm xong..."   │ │ │          │
│           │  │  │ 📋 2 công việc đang xử lý    │ │ └──────────┘
│           │  │  │ 👥 8 thành viên              │ │            │
│           │  │  │ [Xem chi tiết]               │ │            │
│           │  │  └──────────────────────────────┘ │            │
│           │  │                                    │            │
│           │  │  ┌──────────────────────────────┐ │            │
│           │  │  │ 👁️ Nhóm Kho B               │ │            │
│           │  │  │ Tin mới: "Cần kiểm tra..."   │ │            │
│           │  │  │ 📋 3 công việc đang xử lý    │ │            │
│           │  │  │ 👥 6 thành viên              │ │            │
│           │  │  │ [Theo dõi]                   │ │            │
│           │  │  └──────────────────────────────┘ │            │
│           │  └────────────────────────────────────┘            │
│           │                                                     │
│           │  ┌────────────────────────────────────┐            │
│           │  │  TẢI CÔNG VIỆC THÀNH VIÊN         │            │
│           │  │  ┌──────────────────────────────┐ │            │
│           │  │  │ 👤 Minh Anh                  │ │            │
│           │  │  │ 📋 3 công việc (2 DOING, 1 TODO) │          │
│           │  │  │ Progress: ▓▓▓▓▓░░░░░ 45%    │ │            │
│           │  │  │ [Xem chi tiết]               │ │            │
│           │  │  └──────────────────────────────┘ │            │
│           │  │                                    │            │
│           │  │  ┌──────────────────────────────┐ │            │
│           │  │  │ 👤 Huyền                     │ │            │
│           │  │  │ 📋 2 công việc (1 VERIFY, 1 DOING) │        │
│           │  │  │ Progress: ▓▓▓▓▓▓▓░░░ 70%    │ │            │
│           │  │  │ [Xem chi tiết]               │ │            │
│           │  │  └──────────────────────────────┘ │            │
│           │  └────────────────────────────────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile Layout

```
┌───────────────────────────────┐
│  ← Dashboard Leader      [⋮]  │
├───────────────────────────────┤
│  ┌────────┬────────┬────────┐ │
│  │ Tổng   │ Hội    │ Thành  │ │
│  │ Quan   │ Thoại  │ Viên   │ │
│  └────────┴────────┴────────┘ │
├───────────────────────────────┤
│                               │
│  📊 TỔNG QUAN TEAM            │
│  ┌──────────────────────────┐│
│  │ 📊 12 Hội thoại          ││
│  │ 🔔 8 Đang xử lý          ││
│  │ ⏳ 5 Chờ duyệt           ││
│  │ ✅ 45 Hoàn thành (tuần)  ││
│  └──────────────────────────┘│
│                               │
│  HỘI THOẠI HOẠT ĐỘNG          │
│  ┌──────────────────────────┐│
│  │ 👤 Nhóm Kho A       🔴3  ││
│  │ "Đã kiểm xong..."        ││
│  │ 📋 2 việc • 👥 8 người   ││
│  │ [Xem]                    ││
│  └──────────────────────────┘│
│                               │
│  ┌──────────────────────────┐│
│  │ 👁️ Nhóm Kho B            ││
│  │ "Cần kiểm tra..."        ││
│  │ 📋 3 việc • 👥 6 người   ││
│  │ [Theo dõi]               ││
│  └──────────────────────────┘│
│                               │
├───────────────────────────────┤
│  💬    📋    👤    📊         │
└───────────────────────────────┘
```

---

## 📊 Các Thành Phần Dashboard

### 1. Tổng Quan Team (Overview)

**Desktop:**
```
┌────────────────────────────────────────────────┐
│  TỔNG QUAN TEAM                                │
│                                                │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│  │ 📊   │  │ 🔔   │  │ ⏳   │  │ ✅   │      │
│  │  12  │  │  8   │  │  5   │  │  45  │      │
│  │ Hội  │  │ Đang │  │ Chờ  │  │ Hoàn │      │
│  │ thoại│  │ xử lý│  │ duyệt│  │ thành│      │
│  └──────┘  └──────┘  └──────┘  └──────┘      │
└────────────────────────────────────────────────┘
```

**Giải thích:**
- **Hội thoại:** Tổng số hội thoại trong nhóm quản lý
- **Đang xử lý:** Số công việc đang ở trạng thái DOING
- **Chờ duyệt:** Số công việc ở trạng thái NEED_TO_VERIFIED
- **Hoàn thành:** Số công việc hoàn thành trong tuần/tháng

---

### 2. Hội Thoại Đang Hoạt Động

**Card Hội Thoại:**
```
┌────────────────────────────────────────┐
│ 👤 Nhóm Kho A                    🔴3   │
│ 📍 Vận Hành                            │
│                                        │
│ Tin nhắn mới nhất:                     │
│ 👤 Minh Anh - 10:30                    │
│ "Đã kiểm xong 100 thùng hàng"          │
│                                        │
│ 📋 Công việc: 2 đang xử lý, 1 chờ duyệt│
│ 👥 Thành viên: 8 người                 │
│ 🕒 Hoạt động: 5 phút trước             │
│                                        │
│ [Xem chi tiết]  [Vào chat]            │
└────────────────────────────────────────┘
```

**Phân biệt:**
- **👤 Icon:** Hội thoại Leader tham gia trực tiếp (là thành viên)
- **👁️ Icon:** Hội thoại Leader chỉ theo dõi (không phải thành viên)

---

### 3. Tải Công Việc Thành Viên

**Card Thành Viên:**
```
┌────────────────────────────────────────┐
│ 👤 Minh Anh                    ● Online│
│ Staff • Vận Hành - Kho                 │
│                                        │
│ Công việc hiện tại:                    │
│ ┌────────────────────────────────────┐ │
│ │ [DOING] Kiểm tra 100 thùng    50%  │ │
│ │ [DOING] Xuất kho #123         30%  │ │
│ │ [TODO]  Nhập kho #456          0%  │ │
│ └────────────────────────────────────┘ │
│                                        │
│ Tổng tiến độ: ▓▓▓▓▓░░░░░ 45%          │
│                                        │
│ Thống kê tuần:                         │
│ • Hoàn thành: 8 công việc              │
│ • Trung bình: 2h/công việc             │
│                                        │
│ [Xem chi tiết]  [Giao thêm công việc]  │
└────────────────────────────────────────┘
```

**Màu sắc badge:**
- TODO: Xám
- DOING: Xanh
- NEED_TO_VERIFIED: Vàng
- FINISHED: Xanh lá

---

### 4. Thống Kê Công Việc

**Biểu Đồ Progress:**
```
┌────────────────────────────────────────┐
│  THỐNG KÊ CÔNG VIỆC                    │
│                                        │
│  Tuần này (20/01 - 27/01/2026)         │
│                                        │
│  TODO         ▓▓▓       15 (12%)       │
│  DOING        ▓▓▓▓▓     25 (20%)       │
│  VERIFY       ▓▓▓▓      20 (16%)       │
│  FINISHED     ▓▓▓▓▓▓▓▓▓ 65 (52%)       │
│                                        │
│  Tổng: 125 công việc                   │
│                                        │
│  [Xem chi tiết] [Xuất báo cáo]         │
└────────────────────────────────────────┘
```

---

## 🔍 Bộ Lọc & Tìm Kiếm

### Filters (Desktop Right Panel)

```
┌────────────────────────────────┐
│  BỘ LỌC                        │
├────────────────────────────────┤
│                                │
│  Nhóm:                         │
│  ☑ Nhóm Kho A                  │
│  ☑ Nhóm Kho B                  │
│  ☐ Nhóm Kho C                  │
│                                │
│  Trạng thái công việc:         │
│  ☑ TODO                        │
│  ☑ DOING                       │
│  ☑ NEED_TO_VERIFIED            │
│  ☐ FINISHED                    │
│                                │
│  Thành viên:                   │
│  ☐ Tất cả                      │
│  ☑ Có công việc đang xử lý     │
│  ☐ Không có công việc          │
│                                │
│  Khoảng thời gian:             │
│  ○ Hôm nay                     │
│  ● Tuần này                    │
│  ○ Tháng này                   │
│  ○ Tùy chỉnh                   │
│                                │
│  [Đặt lại]       [Áp dụng]    │
└────────────────────────────────┘
```

### Mobile Filter (Bottom Sheet)

```
┌───────────────────────────────┐
│         ▬▬▬▬▬                 │
│  BỘ LỌC                [✕]   │
├───────────────────────────────┤
│                               │
│  Nhóm:                        │
│  ☑ Kho A  ☑ Kho B  ☐ Kho C   │
│                               │
│  Trạng thái:                  │
│  ☑ TODO  ☑ DOING  ☑ VERIFY   │
│                               │
│  Thời gian:                   │
│  ○ Hôm nay  ● Tuần  ○ Tháng  │
│                               │
│  [Đặt lại]        [Áp dụng]  │
└───────────────────────────────┘
```

---

## 🔄 Các Tính Năng Chính

### 1. Xem Chi Tiết Hội Thoại

```
[Click "Xem chi tiết" trên card hội thoại]
         ↓
Desktop: [Modal chi tiết hội thoại mở]
Mobile: [Navigate đến màn chi tiết full screen]
         ↓
[Hiển thị:]
  • Thông tin hội thoại
  • Danh sách thành viên
  • Công việc liên quan
  • Lịch sử hoạt động
         ↓
[Có nút "Vào chat" để vào hội thoại]
```

---

### 2. Vào Chat Trực Tiếp

```
[Click "Vào chat" trên card hội thoại]
         ↓
Desktop:
  [Chat area load hội thoại đó]
  [Right panel hiển thị info]
         ↓
Mobile:
  [Navigate đến màn chat full screen]
         ↓
[Có thể xem tin, gửi tin, tạo task như bình thường]
```

---

### 3. Xem Chi Tiết Thành Viên

```
[Click "Xem chi tiết" trên card thành viên]
         ↓
[Modal/Sheet chi tiết thành viên mở]
         ↓
[Hiển thị:]
  • Profile thành viên
  • Danh sách công việc đầy đủ
  • Lịch sử hoàn thành
  • Thống kê hiệu suất
         ↓
[Có nút "Giao công việc" để tạo task mới]
```

---

### 4. Giao Công Việc Trực Tiếp

```
[Click "Giao thêm công việc" trên card thành viên]
         ↓
[Modal/Sheet "Giao Công Việc" mở]
         ↓
[Người được giao đã được điền sẵn]
         ↓
[Leader chọn hội thoại nguồn]
         ↓
[Leader điền tiêu đề, chọn template, priority]
         ↓
[Click "Tạo"]
         ↓
[Task được tạo và gán cho thành viên]
         ↓
[Dashboard cập nhật real-time]
```

---

### 5. Duyệt Công Việc Nhanh

Từ Dashboard, Leader có thể duyệt công việc mà không cần vào hội thoại:

```
[Trong section "Chờ Duyệt"]
         ↓
[Danh sách công việc cần duyệt hiển thị]
┌────────────────────────────────────────┐
│ CHỜ DUYỆT (5)                          │
│ ┌────────────────────────────────────┐ │
│ │ ✅ Kiểm tra 100 thùng              │ │
│ │    👤 Minh Anh • 6/6 mục (100%)    │ │
│ │    🕒 10 phút trước                │ │
│ │    [Xem] [Duyệt] [Làm lại]        │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
         ↓
[Click "Duyệt"]
         ↓
[Modal xác nhận với ô nhận xét]
         ↓
[Nhập nhận xét (tùy chọn)]
         ↓
[Click "Duyệt" → Task chuyển FINISHED]
         ↓
[Staff nhận thông báo]
         ↓
[Dashboard cập nhật real-time]
```

---

## 📱 Khác Biệt Desktop vs Mobile

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Layout** | 3 cột: Sidebar - Main - Filters | 1 cột: Full screen với tabs |
| **Tổng quan** | Cards ngang hàng | Cards dọc stack |
| **Filters** | Right panel cố định | Bottom sheet khi cần |
| **Chi tiết** | Modal popup | Full screen navigate |
| **Hội thoại** | Card lớn với đầy đủ info | Card compact |
| **Thành viên** | Grid/List view | List view only |
| **Biểu đồ** | Charts lớn | Charts nhỏ hoặc simplified |
| **Actions** | Hover hiện buttons | Tap hiện, hoặc swipe |

---

## 🔔 Thông Báo Real-time

Dashboard cập nhật real-time khi:

### 1. Công việc mới được tạo
```
[Task mới được tạo trong nhóm]
         ↓
[Dashboard cập nhật:]
  • Số "Đang xử lý" tăng
  • Card thành viên cập nhật số lượng task
  • Thông báo toast (nếu đang xem Dashboard)
```

### 2. Công việc thay đổi trạng thái
```
[Staff click "Bắt đầu làm" hoặc "Hoàn thành"]
         ↓
[Dashboard cập nhật real-time:]
  • TODO → DOING: Số "Đang xử lý" tăng
  • DOING → VERIFY: Số "Chờ duyệt" tăng, thông báo Leader
  • VERIFY → FINISHED: Số "Hoàn thành" tăng
```

### 3. Tin nhắn mới
```
[Có tin nhắn mới trong hội thoại]
         ↓
[Card hội thoại cập nhật:]
  • Badge unread tăng
  • Preview tin nhắn mới nhất
  • Thời gian cập nhật
```

### 4. Thành viên online/offline
```
[Thành viên thay đổi trạng thái]
         ↓
[Card thành viên cập nhật:]
  • ● Online → ○ Offline
  • Thời gian offline
```

---

## 🎯 Use Cases

### Use Case 1: Leader Theo Dõi Tiến Độ Buổi Sáng

**Tình huống:**
- Leader vào công ty sáng sớm
- Muốn xem overview công việc của team

**Quy trình:**
1. Đăng nhập → Vào Dashboard
2. Xem Tổng quan:
   - 3 công việc chờ duyệt từ hôm qua
   - 5 công việc đang xử lý
   - 2 công việc mới được tạo
3. Click vào "Chờ duyệt" → Duyệt các task đã hoàn thành
4. Xem tải công việc thành viên → Phân công thêm nếu cần

---

### Use Case 2: Phát Hiện Thành Viên Quá Tải

**Tình huống:**
- Một thành viên có quá nhiều công việc đang xử lý
- Leader cần can thiệp để cân bằng tải

**Quy trình:**
1. Vào Dashboard → Tab "Thành viên"
2. Thấy Minh Anh có 5 công việc DOING (nhiều nhất team)
3. Click "Xem chi tiết" → Xem danh sách task
4. Nhận thấy 2 task có thể giao lại cho người khác
5. Phân công lại task cho Huyền (đang có 1 task)
6. Dashboard cập nhật: Minh Anh 3 task, Huyền 3 task

---

### Use Case 3: Báo Cáo End-of-Week

**Tình huống:**
- Cuối tuần, Leader cần báo cáo cho quản lý cấp trên
- Cần thống kê số liệu hoàn thành

**Quy trình:**
1. Vào Dashboard
2. Bộ lọc: "Tuần này" (20/01 - 27/01)
3. Xem thống kê:
   - 65 công việc hoàn thành
   - 15 công việc đang xử lý
   - 5 công việc chờ duyệt
4. Click "Xuất báo cáo" → Export Excel/PDF
5. Gửi cho quản lý

---

## ✅ Checklist Kiểm Thử

### Truy Cập Dashboard

- [ ] **Leader login**
  - Thấy menu "📊 Theo Dõi Team" trong sidebar
  - Click vào → Dashboard hiển thị

- [ ] **Staff login**
  - KHÔNG thấy menu "Theo Dõi Team"

- [ ] **Admin login**
  - Thấy menu Dashboard
  - Có thể chuyển đổi giữa các nhóm/phòng ban

### Tổng Quan

- [ ] **Hiển thị số liệu đúng**
  - Số hội thoại = tổng hội thoại trong nhóm quản lý
  - Số đang xử lý = tổng task DOING
  - Số chờ duyệt = tổng task NEED_TO_VERIFIED
  - Số hoàn thành = tổng task FINISHED trong khoảng thời gian

- [ ] **Click vào từng số liệu**
  - Click "8 Đang xử lý" → Lọc hiển thị các task DOING
  - Click "5 Chờ duyệt" → Lọc hiển thị các task cần duyệt

### Hội Thoại

- [ ] **Hiển thị card hội thoại**
  - Tất cả hội thoại trong nhóm quản lý hiển thị
  - Phân biệt 👤 (tham gia) vs 👁️ (theo dõi)

- [ ] **Badge unread**
  - Hội thoại có tin chưa đọc → Badge 🔴3
  - Đọc hết tin → Badge biến mất

- [ ] **Preview tin nhắn**
  - Tin mới nhất hiển thị đúng
  - Thời gian hiển thị đúng

- [ ] **Số lượng công việc**
  - "2 đang xử lý, 1 chờ duyệt" → Đếm đúng

- [ ] **Click "Xem chi tiết"**
  - Desktop: Modal mở với info đầy đủ
  - Mobile: Navigate đến màn chi tiết

- [ ] **Click "Vào chat"**
  - Desktop: Chat area load hội thoại
  - Mobile: Navigate đến màn chat

### Thành Viên

- [ ] **Hiển thị danh sách thành viên**
  - Tất cả thành viên team hiển thị
  - Trạng thái online/offline đúng

- [ ] **Card thành viên**
  - Tên, avatar, vai trò hiển thị
  - Số lượng task hiển thị đúng
  - Progress bar tính đúng

- [ ] **Click "Xem chi tiết"**
  - Modal/Sheet chi tiết mở
  - Danh sách task đầy đủ

- [ ] **Click "Giao thêm công việc"**
  - Modal giao việc mở
  - Người được giao đã điền sẵn

### Chờ Duyệt

- [ ] **Section "Chờ duyệt"**
  - Tất cả task NEED_TO_VERIFIED hiển thị
  - Thông tin đầy đủ: Người làm, tiến độ, thời gian

- [ ] **Click "Duyệt"**
  - Modal xác nhận mở
  - Nhập nhận xét (tùy chọn)
  - Click "Duyệt" → Task chuyển FINISHED
  - Staff nhận thông báo

- [ ] **Click "Làm lại"**
  - Modal nhập lý do
  - Task chuyển về DOING
  - Staff nhận thông báo yêu cầu

### Bộ Lọc

- [ ] **Filter nhóm**
  - Check Kho A → Chỉ hiển thị hội thoại/task của Kho A
  - Uncheck → Không hiển thị

- [ ] **Filter trạng thái**
  - Check TODO → Hiển thị task TODO
  - Uncheck FINISHED → Ẩn task FINISHED

- [ ] **Filter thời gian**
  - "Hôm nay" → Chỉ hiển thị task/hoạt động hôm nay
  - "Tuần này" → Tuần hiện tại

- [ ] **Click "Đặt lại"**
  - Tất cả filters reset về mặc định

### Real-time

- [ ] **Task mới được tạo**
  - Dashboard cập nhật ngay
  - Số "Đang xử lý" tăng

- [ ] **Task thay đổi trạng thái**
  - Staff hoàn thành → Dashboard cập nhật
  - Số "Chờ duyệt" tăng, thông báo Leader

- [ ] **Tin nhắn mới**
  - Card hội thoại cập nhật preview
  - Badge unread tăng

- [ ] **Thành viên online/offline**
  - Card thành viên cập nhật trạng thái real-time

### Mobile

- [ ] **Bottom navigation**
  - Vào Dashboard từ tab "Cá nhân" hoặc tab riêng

- [ ] **Tabs trên mobile**
  - "Tổng Quan", "Hội Thoại", "Thành Viên" chuyển đổi mượt

- [ ] **Bottom sheet filter**
  - Tap icon lọc → Bottom sheet mở
  - Áp dụng filter → Sheet đóng, data update

- [ ] **Touch targets**
  - Tất cả buttons/cards đủ lớn (min 44pt)

### Performance

- [ ] **Load nhanh**
  - Dashboard load trong < 2s
  - Không bị lag khi scroll

- [ ] **Real-time không lag**
  - Cập nhật mượt, không giật
  - Không ảnh hưởng hiệu suất app

---

## 🔗 Liên Kết Tài Liệu

### Đọc Thêm

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Vai trò Leader
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền Leader
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md) - Quản lý công việc
- 📄 [11_THANH_VIEN_NHOM.md](./11_THANH_VIEN_NHOM.md) - Quản lý thành viên
- 📄 [12_CHUYEN_NHOM.md](./12_CHUYEN_NHOM.md) - Chuyển hội thoại
- 📄 [14_NHAN_CHUYEN_THONG_TIN.md](./14_NHAN_CHUYEN_THONG_TIN.md) - Nhận và chuyển thông tin
- 📄 [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md) - Cập nhật real-time
- 📄 [16_THONG_BAO.md](./16_THONG_BAO.md) - Hệ thống thông báo

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
