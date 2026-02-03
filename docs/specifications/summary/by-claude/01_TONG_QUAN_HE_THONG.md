# 01. Tổng Quan Hệ Thống

> **Mục đích:** Giới thiệu toàn bộ hệ thống, kiến trúc, vai trò người dùng và layout
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Giới Thiệu Hệ Thống

**Quốc Nam Portal Internal Chat** là hệ thống chat nội bộ doanh nghiệp tích hợp quản lý công việc, được thiết kế đặc biệt cho:

### Mục Đích Chính
- **Giao tiếp nội bộ:** Trao đổi thông tin giữa các phòng ban và nhân viên
- **Quản lý công việc:** Tạo, phân công và theo dõi tiến độ công việc trực tiếp từ tin nhắn
- **Chia sẻ tài liệu:** Upload, xem và quản lý file trong các cuộc hội thoại
- **Theo dõi nhóm:** Leader giám sát hoạt động và công việc của team real-time

### Đặc Điểm Nổi Bật
✅ Tích hợp chat + task management
✅ Phân quyền rõ ràng theo vai trò
✅ Real-time messaging qua SignalR
✅ Hỗ trợ cả Desktop và Mobile
✅ Preview file (PDF, Excel, Word, Image)
✅ Template checklist cho công việc

---

## 👥 Vai Trò Người Dùng

Hệ thống có 3 vai trò chính với quyền hạn rõ ràng:

### 1. 👤 Staff (Nhân Viên)

**Vai trò:**
- Nhân viên cơ bản trong tổ chức
- Thực hiện công việc được giao
- Tham gia vào các hội thoại được phân công

**Quyền hạn:**
| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ Chỉ hội thoại được phân công |
| Gửi tin nhắn | ✅ Có |
| Ghim tin nhắn (Pin) | ❌ Không |
| Đánh dấu tin (Star) | ✅ Có (cá nhân) |
| Tạo công việc | ❌ Không |
| Nhận công việc | ✅ Có |
| Cập nhật công việc | ✅ Có |
| Upload file | ✅ Có |
| Thêm/xóa thành viên | ❌ Không |
| Chuyển nhóm | ❌ Không |

**Giao diện Staff:**
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (Chỉ hội  │  CHAT AREA      │  INFO PANEL  │
│  thoại được phân   │                 │              │
│  công)             │  - Tin nhắn     │  - Thông tin │
│                    │  - Gửi tin      │  - Công việc │
│  • Vận Hành        │  - Reply        │    của mình  │
│    - Nhóm Kho A    │                 │  - Files     │
│    - Nhóm Kho B    │                 │  - Thành viên│
│                    │                 │              │
│  • Khách Hàng      │                 │              │
│    - Team CSKH 1   │                 │              │
└─────────────────────────────────────────────────────┘
```

---

### 2. 👑 Leader (Trưởng Nhóm)

**Vai trò:**
- Quản lý nhóm/phòng ban
- Phân công và giám sát công việc
- Điều phối hoạt động của team

**Quyền hạn (Bao gồm TẤT CẢ quyền của Staff + thêm):**
| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ TẤT CẢ hội thoại trong nhóm quản lý |
| Ghim tin nhắn (Pin) | ✅ Có (cho cả nhóm) |
| Tạo công việc | ✅ Có |
| Phân công công việc | ✅ Có |
| Duyệt công việc | ✅ Có |
| Phân công lại task | ✅ Có |
| Thêm/xóa thành viên | ✅ Có |
| Promote thành admin nhóm | ✅ Có |
| Chuyển nhóm | ✅ Có |
| Nhận thông tin & chuyển giao | ✅ Có |
| Dashboard theo dõi team | ✅ Có |

**Giao diện Leader:**
```
┌─────────────────────────────────────────────────────┐
│  SIDEBAR (TẤT CẢ  │  CHAT AREA       │  INFO PANEL  │
│  hội thoại nhóm)  │                  │              │
│                   │  - Tin nhắn      │  - Thông tin │
│  • Vận Hành       │  - Ghim tin ✨   │  - Công việc │
│    - Kho A 👤     │  - Tạo task ✨   │    CẢ NHÓM  │
│    - Kho B 👁️    │  - Nhận info ✨  │  - Files     │
│    - Kho C 👁️    │                  │  - Thành viên│
│                   │                  │  - Quản lý TV│
│  [📊 Theo Dõi     │                  │              │
│   Team] ✨        │                  │              │
└─────────────────────────────────────────────────────┘

Chú thích:
👤 = Tham gia trực tiếp (là thành viên)
👁️ = Chỉ theo dõi (Leader view)
✨ = Tính năng chỉ Leader mới có
```

---

### 3. 🔧 Admin (Quản Trị Viên)

**Vai trò:**
- Quyền cao nhất trong hệ thống
- Quản lý toàn bộ hệ thống
- Cấu hình và quản lý người dùng

**Quyền hạn (Bao gồm TẤT CẢ quyền của Leader + thêm):**
| Chức năng | Quyền |
|-----------|-------|
| Xem hội thoại | ✅ TẤT CẢ hội thoại hệ thống |
| Quản lý người dùng | ✅ Thêm, sửa, xóa, khóa user |
| Cấu hình hệ thống | ✅ Settings, categories, work types |
| Quản lý danh mục | ✅ Tạo, sửa, xóa categories |
| Quản lý nhóm | ✅ Tạo, sửa, xóa groups |
| Xem báo cáo | ✅ Báo cáo tổng quan toàn hệ thống |
| Cấu hình template | ✅ Tạo/sửa checklist templates |

---

## 🏗️ Kiến Trúc Hệ Thống

### Desktop Layout (3 Cột)

```
┌────────────────────────────────────────────────────────────────┐
│                      QUỐC NAM PORTAL - HEADER                  │
│            [Logo] Quốc Nam Portal         [User] [Settings]    │
├──────────┬─────────────────────────────────┬───────────────────┤
│          │                                 │                   │
│  MAIN    │         CHAT AREA               │   INFORMATION     │
│ SIDEBAR  │    (Khu vực chat chính)         │      PANEL        │
│  (~90px) │                                 │   (350-400px)     │
│          │  ┌─────────────────────────────┐│                   │
│  ┌─────┐ │  │ HEADER                      ││  ┌──────────────┐ │
│  │ 💬  │ │  │ ← Nhóm Kho A        ℹ️  ⋮  ││  │ [Tabs]       │ │
│  │ Tin │ │  │ 📍 Nhận hàng • Kiểm đếm     ││  │              │ │
│  └─────┘ │  └─────────────────────────────┘│  │ • Thông tin  │ │
│          │  ┌─────────────────────────────┐│  │ • Công việc  │ │
│  ┌─────┐ │  │ 📌 TIN GHIM (2)    [Xem ▼] ││  │ • Files      │ │
│  │ 📋  │ │  └─────────────────────────────┘│  │ • Thành viên │ │
│  │ Việc│ │                                 │  │              │ │
│  └─────┘ │  ┌─────────────────────────────┐│  └──────────────┘ │
│          │  │                             ││                   │
│  ┌─────┐ │  │    DANH SÁCH TIN NHẮN      ││  [Content hiển   │
│  │ 👤  │ │  │    (Scrollable area)        ││   thị tùy theo   │
│  │User │ │  │                             ││   tab được chọn] │
│  └─────┘ │  │  👤 Minh       10:30        ││                   │
│          │  │  ┌──────────────────────┐   ││                   │
│          │  │  │ Đã kiểm xong...      │   ││                   │
│          │  │  └──────────────────────┘   ││                   │
│          │  │                             ││                   │
│          │  │           You    10:31      ││                   │
│          │  │  ┌──────────────────────┐   ││                   │
│          │  │  │     OK, cảm ơn     ✓││   ││                   │
│          │  │  └──────────────────────┘   ││                   │
│          │  │                             ││                   │
│          │  └─────────────────────────────┘│                   │
│          │                                 │                   │
│          │  ●●● Minh đang nhập...          │                   │
│          │                                 │                   │
│          │  ┌─────────────────────────────┐│                   │
│          │  │ INPUT AREA                  ││                   │
│          │  │ 📎 😊 📷                    ││                   │
│          │  │ [Nhập tin nhắn...]      ➤  ││                   │
│          │  └─────────────────────────────┘│                   │
└──────────┴─────────────────────────────────┴───────────────────┘
  90px               flex-grow (~50%)            350-400px
```

**Đặc điểm Desktop:**
- 3 cột cố định, hiển thị đồng thời
- Sidebar trái: Navigation giữa các màn (Tin nhắn, Công việc, Profile)
- Chat area: Khu vực chat chính, chiếm phần lớn màn hình
- Right panel: Thông tin chi tiết, tabs (Info, Tasks, Files, Members)
- Hover để hiện menu actions
- Modal popup cho các form

---

### Mobile Layout (1 Cột)

```
┌─────────────────────────────┐
│   HEADER (Cố định top)      │
│  [←] Tên Màn Hình    [⋮]   │
├─────────────────────────────┤
│                             │
│                             │
│     CONTENT AREA            │
│     (Full width)            │
│     (Scrollable)            │
│                             │
│   Chuyển đổi giữa:          │
│   • Danh sách hội thoại     │
│   • Khung chat              │
│   • Chi tiết hội thoại      │
│   • Danh sách công việc     │
│   • Chi tiết công việc      │
│   • Profile                 │
│                             │
│                             │
├─────────────────────────────┤
│  BOTTOM NAVIGATION          │
│  (Cố định bottom)           │
│  [💬]    [📋]    [👤]      │
│  Tin     Công    Cá        │
│  Nhắn🔴3 Việc    Nhân      │
└─────────────────────────────┘
```

**Đặc điểm Mobile:**
- 1 cột, chuyển đổi màn hình full screen
- Bottom Navigation: 3 tabs chính (Tin nhắn, Công việc, Cá nhân)
- Nút Back ← để quay lại màn trước
- Bottom sheets thay vì modals
- Long-press để hiện menu
- Swipe gestures (trái/phải để reply/star)
- Pull-to-refresh

---

## 🎯 Các Tính Năng Chính

### 1. 🔐 Xác Thực & Phân Quyền
- Đăng nhập bằng username/password
- Tự động đăng nhập lại
- Phân quyền theo vai trò (Staff/Leader/Admin)
- Token authentication

**📄 Chi tiết:** [03_DANG_NHAP.md](./03_DANG_NHAP.md)

---

### 2. 💬 Giao Tiếp

#### Danh Sách Hội Thoại
- Phân loại theo danh mục (Vận Hành, Khách Hàng, Kế Toán...)
- Badge số tin chưa đọc
- Tìm kiếm hội thoại
- Real-time cập nhật

**📄 Chi tiết:** [04_DANH_SACH_HOI_THOAI.md](./04_DANH_SACH_HOI_THOAI.md)

#### Nhắn Tin
- Gửi tin nhắn văn bản, emoji
- Gửi hình ảnh và file
- Reply tin nhắn
- Typing indicator (ai đang gõ)
- Infinite scroll load tin cũ

**📄 Chi tiết:** [05_NHAN_TIN.md](./05_NHAN_TIN.md)

#### Tin Nhắn Đặc Biệt
- **Pin (Ghim):** Leader ghim tin quan trọng cho cả nhóm
- **Star (Đánh dấu):** Cá nhân đánh dấu tin cho riêng mình
- **Reply:** Trả lời tin nhắn cụ thể

**📄 Chi tiết:** [06_TIN_NHAN_DAC_BIET.md](./06_TIN_NHAN_DAC_BIET.md)

---

### 3. 📋 Quản Lý Công Việc

#### Vòng Đời Công Việc
```
┌──────────┐
│   TODO   │  Chưa xử lý (Màu xám)
│          │  • Vừa được tạo
└─────┬────┘
      │ Staff click "Bắt đầu làm"
      ▼
┌──────────┐
│  DOING   │  Đang xử lý (Màu xanh)
│          │  • Đang thực hiện
└─────┬────┘  • Check checklist
      │ Staff click "Hoàn thành"
      ▼
┌────────────────┐
│ NEED_TO_VERIFY│  Chờ duyệt (Màu vàng)
│                │  • Đã làm xong
└────────┬───────┘  • Chờ Leader duyệt
         │ Leader duyệt
         ▼
    ┌──────────┐
    │ FINISHED │  Hoàn thành (Màu xanh lá)
    │          │  • Đã được duyệt
    └──────────┘
```

#### Tính Năng
- Leader tạo task từ tin nhắn
- Phân công cho nhân viên
- Checklist theo template
- Theo dõi tiến độ (X/Y mục hoàn thành)
- Leader duyệt hoặc yêu cầu làm lại

**📄 Chi tiết:** [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md)

---

### 4. 📁 Quản Lý File

#### Upload File
- Hỗ trợ: Hình ảnh (JPG, PNG), PDF, Word, Excel, PowerPoint
- Max size: 10 MB/file
- Upload batch (nhiều file cùng lúc)
- Drag & drop (Desktop)

#### Xem Trước File
- **Hình ảnh:** Zoom, xoay, navigate
- **PDF:** Xem từng trang, zoom
- **Excel:** Hiển thị bảng, xem sheets
- **Word:** Render HTML preview

#### Quản Lý
- File Manager trong right panel
- Lọc theo loại, người upload, ngày
- Sắp xếp theo tên, ngày, size
- Tìm kiếm file

**📄 Chi tiết:** [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md), [10_PREVIEW_FILE.md](./10_PREVIEW_FILE.md)

---

### 5. 👥 Thành Viên & Nhóm

#### Quản Lý Thành Viên
- Xem danh sách thành viên
- Trạng thái online/offline
- Thêm/xóa thành viên (Leader)
- Promote thành admin nhóm (Leader)
- Xem profile thành viên

#### Chuyển Nhóm
- Leader chuyển hội thoại sang nhóm khác
- Nhập lý do chuyển
- Leader nhóm mới nhận thông báo

**📄 Chi tiết:** [11_THANH_VIEN_NHOM.md](./11_THANH_VIEN_NHOM.md), [12_CHUYEN_NHOM.md](./12_CHUYEN_NHOM.md)

---

### 6. 📊 Theo Dõi Team (Leader)

#### Dashboard Leader
- Xem tất cả hội thoại nhóm quản lý
- Theo dõi công việc đang xử lý
- Xem tải công việc của từng thành viên
- Thống kê task (TODO, DOING, VERIFY, FINISHED)

#### Nhận & Chuyển Thông Tin
- "Nhận thông tin" từ tin nhắn
- Phân công xử lý cho nhân viên
- Chuyển giao giữa phòng ban
- Theo dõi trạng thái xử lý

**📄 Chi tiết:** [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md), [14_NHAN_CHUYEN_THONG_TIN.md](./14_NHAN_CHUYEN_THONG_TIN.md)

---

### 7. 🔔 Real-time & Thông Báo

#### Cập Nhật Real-time (SignalR)
- Nhận tin nhắn ngay lập tức
- Cập nhật badge số tin chưa đọc
- Hiển thị ai đang gõ
- Trạng thái tin nhắn (đã gửi/đã đọc)
- Thông báo công việc mới

#### Push Notification (Mobile)
- Thông báo khi app ở background
- Tap notification để mở app đúng màn hình
- Badge số trên app icon

**📄 Chi tiết:** [15_REALTIME_SIGNALR.md](./15_REALTIME_SIGNALR.md), [16_THONG_BAO.md](./16_THONG_BAO.md)

---

### 8. 📱 Tối Ưu Mobile

#### Mobile-specific Features
- Bottom navigation (3 tabs)
- Bottom sheets thay modals
- Long-press menu actions
- Swipe gestures (reply/star)
- Pull-to-refresh
- Camera integration
- Touch target size ≥ 44pt

**📄 Chi tiết:** [17_MOBILE.md](./17_MOBILE.md), [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md)

---

## 📊 So Sánh Desktop vs Mobile

| Khía Cạnh | Desktop | Mobile |
|-----------|---------|--------|
| **Layout** | 3 cột đồng thời | 1 cột, chuyển màn |
| **Navigation** | Sidebar cố định | Bottom navigation |
| **Menu** | Hover hiện menu | Long-press |
| **Modals** | Popup giữa màn | Bottom sheets |
| **Refresh** | Auto real-time | Pull-to-refresh |
| **Upload** | Drag & drop + Click | Camera + Gallery |
| **Preview** | Modal lớn | Full screen |
| **Gestures** | Hover, Click | Tap, Long-press, Swipe |
| **Back** | Không cần | Nút ← |

---

## 🔄 Luồng Sử Dụng Chính

### Luồng 1: Staff Nhận & Thực Hiện Công Việc

```
[Đăng nhập]
    ↓
[Vào màn hình chính]
    ↓
[Xem danh sách hội thoại → Có badge 🔴3]
    ↓
[Click vào hội thoại]
    ↓
[Đọc tin nhắn mới]
    ↓
[Nhận thông báo có công việc mới]
    ↓
[Mở tab Công việc trong right panel]
    ↓
[Xem chi tiết task]
    ↓
[Click "Bắt đầu làm" → TODO → DOING]
    ↓
[Thực hiện và check các mục trong checklist]
    ↓
[Check hết checklist → Click "Hoàn thành"]
    ↓
[DOING → NEED_TO_VERIFIED]
    ↓
[Leader duyệt → NEED_TO_VERIFIED → FINISHED]
    ↓
[Staff nhận thông báo đã được duyệt ✅]
```

---

### Luồng 2: Leader Tạo & Phân Công Công Việc

```
[Leader đăng nhập]
    ↓
[Vào hội thoại cần theo dõi]
    ↓
[Đọc tin nhắn có thông tin cần xử lý]
    ↓
[Hover tin nhắn → Click icon "📋 Tạo công việc"]
    ↓
[Modal "Giao Công Việc" mở ra]
    ↓
[Tiêu đề tự động điền từ nội dung tin]
    ↓
[Chọn nhân viên được giao]
    ↓
[Chọn loại công việc]
    ↓
[Chọn template checklist (nếu có)]
    ↓
[Chọn độ ưu tiên (Thấp/Trung/Cao)]
    ↓
[Click "Tạo"]
    ↓
[Công việc được tạo và liên kết với tin nhắn]
    ↓
[Nhân viên nhận thông báo công việc mới]
    ↓
[Leader theo dõi tiến độ trong tab Công việc]
    ↓
[Khi nhân viên hoàn thành → Leader nhận thông báo]
    ↓
[Leader xem chi tiết → Duyệt hoặc Yêu cầu làm lại]
```

---

### Luồng 3: Gửi Tin Nhắn Có File

```
[Trong màn hình chat]
    ↓
[Click nút đính kèm 📎]
    ↓
[Chọn file từ máy (hoặc kéo thả)]
    ↓
Desktop: [Drag file vào chat area]
Mobile: [Click 📷 → Chọn camera hoặc gallery]
    ↓
[File hiển thị preview trong ô nhập]
    ↓
[Gõ caption (tùy chọn)]
    ↓
[Click "Gửi" ➤]
    ↓
[File upload + tin nhắn gửi]
    ↓
[Người khác nhận tin nhắn có file đính kèm]
    ↓
[Click file để xem trước hoặc tải về]
```

---

## 🔐 Ma Trận Phân Quyền

| Chức Năng | Staff | Leader | Admin |
|-----------|:-----:|:------:|:-----:|
| **Xem hội thoại được phân công** | ✅ | ✅ | ✅ |
| **Xem TẤT CẢ hội thoại nhóm** | ❌ | ✅ | ✅ |
| **Xem TẤT CẢ hội thoại hệ thống** | ❌ | ❌ | ✅ |
| **Gửi tin nhắn** | ✅ | ✅ | ✅ |
| **Ghim tin nhắn (Pin)** | ❌ | ✅ | ✅ |
| **Đánh dấu tin (Star)** | ✅ | ✅ | ✅ |
| **Reply tin nhắn** | ✅ | ✅ | ✅ |
| **Upload file** | ✅ | ✅ | ✅ |
| **Xóa file của mình** | ✅ | ✅ | ✅ |
| **Xóa file người khác** | ❌ | ✅ | ✅ |
| **Tạo công việc** | ❌ | ✅ | ✅ |
| **Nhận công việc** | ✅ | ✅ | ✅ |
| **Cập nhật tiến độ** | ✅ | ✅ | ✅ |
| **Phân công lại task** | ❌ | ✅ | ✅ |
| **Duyệt công việc** | ❌ | ✅ | ✅ |
| **Xem task của người khác** | ❌ | ✅ | ✅ |
| **Thêm/xóa thành viên** | ❌ | ✅ | ✅ |
| **Promote admin nhóm** | ❌ | ✅ | ✅ |
| **Chuyển nhóm** | ❌ | ✅ | ✅ |
| **Nhận thông tin & chuyển giao** | ❌ | ✅ | ✅ |
| **Dashboard theo dõi team** | ❌ | ✅ | ✅ |
| **Quản lý người dùng** | ❌ | ❌ | ✅ |
| **Cấu hình hệ thống** | ❌ | ❌ | ✅ |
| **Quản lý danh mục/nhóm** | ❌ | ❌ | ✅ |

---

## 📊 Trạng Thái Trong Hệ Thống

### Trạng Thái Tin Nhắn
- **⏳ Đang gửi:** Spinner quay
- **✓ Đã gửi:** 1 dấu tích xám
- **✓✓ Đã đọc:** 2 dấu tích xanh
- **⚠️ Lỗi:** Icon cảnh báo + nút "Gửi lại"

### Trạng Thái Công Việc
- **TODO:** Chưa xử lý (Badge màu xám)
- **DOING:** Đang xử lý (Badge màu xanh)
- **NEED_TO_VERIFIED:** Chờ duyệt (Badge màu vàng)
- **FINISHED:** Hoàn thành (Badge màu xanh lá)

### Trạng Thái Thành Viên
- **● Online:** Chấm xanh, text "Online"
- **○ Offline:** Chấm xám, text "Offline 2 giờ trước"
- **●●● Đang nhập:** Hiển thị trong khung chat

---

## ✅ Checklist Kiểm Thử Tổng Quát

### Login & Authentication
- [ ] Đăng nhập Staff → Chỉ thấy hội thoại được phân công
- [ ] Đăng nhập Leader → Thấy tất cả hội thoại nhóm quản lý
- [ ] Đăng nhập Admin → Thấy tất cả hội thoại hệ thống
- [ ] Token hết hạn → Tự động về màn đăng nhập

### Layout
- [ ] Desktop: 3 cột hiển thị đúng (Sidebar - Chat - Right Panel)
- [ ] Mobile: Bottom navigation 3 tabs hoạt động
- [ ] Responsive: Xoay ngang/dọc → Layout adapt đúng

### Permissions
- [ ] Staff không thấy nút "Tạo công việc"
- [ ] Staff không thấy nút "Ghim tin nhắn"
- [ ] Leader thấy đầy đủ các nút quản lý
- [ ] Admin có quyền cao nhất

### Real-time
- [ ] Tin nhắn mới hiển thị ngay không cần refresh
- [ ] Badge số tin chưa đọc cập nhật real-time
- [ ] Typing indicator hiển thị khi người khác gõ
- [ ] Trạng thái online/offline cập nhật đúng

---

## 🔗 Liên Kết Tài Liệu

### Đọc Tiếp
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Các luồng end-to-end chi tiết
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Xác thực và phân quyền
- 📄 [19_HUONG_DAN_QC.md](./19_HUONG_DAN_QC.md) - Hướng dẫn sử dụng tài liệu cho QC
- 📄 [20_CHECKLIST_TONG_HOP.md](./20_CHECKLIST_TONG_HOP.md) - Tổng hợp test cases

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
