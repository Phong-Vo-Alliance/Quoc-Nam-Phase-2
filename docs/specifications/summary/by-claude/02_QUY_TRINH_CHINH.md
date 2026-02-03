# 02. Quy Trình Chính

> **Mục đích:** Mô tả các luồng sử dụng end-to-end trong hệ thống
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0

---

## 📌 Giới Thiệu

Tài liệu này mô tả các quy trình sử dụng chính của hệ thống từ đầu đến cuối, giúp hiểu cách người dùng thực sự tương tác với hệ thống.

---

## 🔄 Quy Trình 1: Staff Nhận & Thực Hiện Công Việc

### Mô Tả
Staff đăng nhập, nhận công việc được giao từ Leader, thực hiện và báo cáo hoàn thành.

### Luồng Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: ĐĂNG NHẬP                                       │
└─────────────────────────────────────────────────────────┘
[Staff mở ứng dụng]
         ↓
[Màn hình đăng nhập hiển thị]
         ↓
[Nhập username: "minhanh"]
[Nhập password: "******"]
         ↓
[Click "Đăng nhập"]
         ↓
[Loading... Xác thực]
         ↓
    ✅ Thành công
         ↓
[Chuyển về trang chính "/"]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: XEM HỘI THOẠI MỚI                              │
└─────────────────────────────────────────────────────────┘
[Màn hình chính hiển thị]
         ↓
Desktop: Sidebar trái - Danh sách hội thoại
Mobile: Tab "Tin nhắn" - Danh sách hội thoại
         ↓
[Thấy badge đỏ 🔴3 ở "Nhóm Kho A"]
         ↓
[Click vào "Nhóm Kho A"]
         ↓
Desktop: Chat area bên phải load tin nhắn
Mobile: Chuyển sang màn chat full screen

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: ĐỌC TIN NHẮN                                   │
└─────────────────────────────────────────────────────────┘
[Danh sách tin nhắn hiển thị]
         ↓
[Scroll lên xem tin cũ hơn]
         ↓
[Đọc tin nhắn mới nhất từ Leader:]
"@minhanh Vui lòng kiểm tra 100 thùng hàng nhập kho sáng nay"
         ↓
[Badge 🔴3 biến mất → đã đọc]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: NHẬN THÔNG BÁO CÔNG VIỆC MỚI                   │
└─────────────────────────────────────────────────────────┘
[Thông báo hiện lên:]
Desktop: Toast góc phải
Mobile: Push notification
         ↓
"Bạn có công việc mới: Kiểm tra 100 thùng hàng"
         ↓
[Click vào tab "Công việc"]
Desktop: Right panel
Mobile: Bottom navigation → Tab Công việc

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: XEM CHI TIẾT CÔNG VIỆC                         │
└─────────────────────────────────────────────────────────┘
[Tab Công việc hiển thị]
         ↓
Section "CHƯA XỬ LÝ (1)"
┌────────────────────────────────────┐
│ 📦 Kiểm tra 100 thùng hàng  [TODO] │
│    ☐ 0/6 mục                       │
│    👤 Được giao bởi: Leader Hùng   │
│    🕒 5 phút trước                 │
└────────────────────────────────────┘
         ↓
[Click vào task để xem chi tiết]
         ↓
Desktop: Modal mở ra hoặc expand trong panel
Mobile: Chuyển sang màn chi tiết task full screen

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 6: BẮT ĐẦU LÀM VIỆC                               │
└─────────────────────────────────────────────────────────┘
[Chi tiết task hiển thị:]

Tin nhắn gốc:
  "Vui lòng kiểm tra 100 thùng hàng nhập kho sáng nay"
  [Xem tin nhắn gốc]

Người giao: 👤 Leader Hùng
Độ ưu tiên: 🔴 Cao

CHECKLIST (0/6 mục hoàn thành)
Progress: ░░░░░░░░░░░░ 0%

☐ 1. Kiểm tra số lượng thùng
☐ 2. Kiểm tra tình trạng bên ngoài
☐ 3. Mở thùng kiểm tra hàng bên trong
☐ 4. Đối chiếu với phiếu nhập kho
☐ 5. Chụp ảnh hàng hóa
☐ 6. Báo cáo kết quả

[Nút "Bắt đầu làm"]
         ↓
[Click "Bắt đầu làm"]
         ↓
[Trạng thái TODO → DOING]
[Badge chuyển từ xám → xanh]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 7: THỰC HIỆN CHECKLIST                            │
└─────────────────────────────────────────────────────────┘
[Staff đi kiểm tra thực tế]
         ↓
[Kiểm tra số lượng thùng → OK]
[Click checkbox mục 1: ☐ → ☑]
         ↓
Progress: ▓▓░░░░░░░░░░ 17% (1/6)
         ↓
[Kiểm tra tình trạng bên ngoài → OK]
[Click checkbox mục 2: ☐ → ☑]
         ↓
Progress: ▓▓▓▓░░░░░░░░ 33% (2/6)
         ↓
[Mở thùng kiểm tra → OK]
[Click checkbox mục 3: ☐ → ☑]
         ↓
Progress: ▓▓▓▓▓▓░░░░░░ 50% (3/6)
         ↓
[Đối chiếu phiếu → OK]
[Click checkbox mục 4: ☐ → ☑]
         ↓
Progress: ▓▓▓▓▓▓▓▓░░░░ 67% (4/6)
         ↓
[Chụp ảnh hàng hóa]
[Click 📷 → Chọn camera → Chụp → Upload]
[Click checkbox mục 5: ☐ → ☑]
         ↓
Progress: ▓▓▓▓▓▓▓▓▓▓░░ 83% (5/6)
         ↓
[Gửi tin nhắn báo cáo trong chat:]
"Đã kiểm tra xong 100 thùng. Tất cả đều OK."
[Click checkbox mục 6: ☐ → ☑]
         ↓
Progress: ▓▓▓▓▓▓▓▓▓▓▓▓ 100% (6/6)

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 8: HOÀN THÀNH CÔNG VIỆC                           │
└─────────────────────────────────────────────────────────┘
[Tất cả checklist đã được check ✓]
         ↓
[Nút "Hoàn thành" sáng lên]
         ↓
[Click "Hoàn thành"]
         ↓
[Modal xác nhận hiển thị:]
"Bạn đã hoàn thành công việc này?"
[Hủy] [Xác nhận]
         ↓
[Click "Xác nhận"]
         ↓
[Trạng thái DOING → NEED_TO_VERIFIED]
[Badge chuyển từ xanh → vàng]
         ↓
[Leader nhận thông báo:]
"Minh Anh đã hoàn thành: Kiểm tra 100 thùng hàng"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 9: CHỜ LEADER DUYỆT                               │
└─────────────────────────────────────────────────────────┘
[Task chuyển sang section "CHỜ DUYỆT"]
         ↓
[Staff chờ Leader xem xét]
         ↓
... (5 phút sau)
         ↓
[Leader duyệt công việc]
         ↓
[Staff nhận thông báo:]
"Công việc 'Kiểm tra 100 thùng hàng' đã được duyệt ✓"
"Nhận xét: Làm tốt, tiếp tục phát huy!"
         ↓
[Trạng thái NEED_TO_VERIFIED → FINISHED]
[Badge chuyển vàng → xanh lá]
         ↓
[Task chuyển sang section "HOÀN THÀNH"]

🎉 Hoàn thành quy trình!
```

---

## 🔄 Quy Trình 2: Leader Tạo & Phân Công Công Việc

### Mô Tả
Leader đọc tin nhắn từ nhân viên hoặc báo cáo, tạo công việc từ tin nhắn đó và phân công cho nhân viên thực hiện.

### Luồng Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ BƯỚC 1: LEADER ĐĂNG NHẬP                               │
└─────────────────────────────────────────────────────────┘
[Leader đăng nhập với account Leader]
         ↓
[Thấy TẤT CẢ hội thoại trong nhóm quản lý]
Desktop: Sidebar hiển thị đầy đủ
Mobile: Tab Tin nhắn

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 2: VÀO HỘI THOẠI CẦN THEO DÕI                     │
└─────────────────────────────────────────────────────────┘
[Leader vào "Nhóm Kho A"]
         ↓
[Đọc tin nhắn từ nhân viên khác:]
"Vừa nhận 100 thùng hàng từ nhà cung cấp"
         ↓
[Leader nhận thấy cần kiểm tra hàng]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 3: TẠO CÔNG VIỆC TỪ TIN NHẮN                      │
└─────────────────────────────────────────────────────────┘
Desktop:
  [Hover vào tin nhắn]
           ↓
  [Menu actions hiện ra]
  [😊] [↩️] [📌] [📋 Tạo công việc] [⭐] [⋮]
           ↓
  [Click "📋 Tạo công việc"]

Mobile:
  [Long-press tin nhắn]
           ↓
  [Bottom sheet hiện ra]
           ↓
  [Tap "📋 Tạo công việc"]
           ↓

[Modal/Bottom sheet "Giao Công Việc" mở ra]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 4: ĐIỀN FORM GIAO CÔNG VIỆC                       │
└─────────────────────────────────────────────────────────┘
┌──────────────────────────────────────┐
│ GIAO CÔNG VIỆC              [✕]     │
├──────────────────────────────────────┤
│ Tin nhắn gốc:                        │
│ ┌──────────────────────────────────┐ │
│ │ "Vừa nhận 100 thùng hàng..."     │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Tiêu đề: *                           │
│ ┌──────────────────────────────────┐ │
│ │ Kiểm tra 100 thùng hàng          │ │ ← Auto-fill
│ └──────────────────────────────────┘ │
│                                      │
│ Người được giao: *                   │
│ ┌──────────────────────────────────┐ │
│ │ [🔍] Chọn nhân viên...    [▼]   │ │
│ └──────────────────────────────────┘ │
│   → Chọn: Minh Anh                   │
│                                      │
│ Loại công việc: *                    │
│ ┌──────────────────────────────────┐ │
│ │ Nhận hàng - Kiểm đếm      [▼]   │ │
│ └──────────────────────────────────┘ │
│                                      │
│ Template checklist:                  │
│ ┌──────────────────────────────────┐ │
│ │ Template Kiểm Kho         [▼]   │ │
│ └──────────────────────────────────┘ │
│   → Checklist tự động load 6 items   │
│                                      │
│ Độ ưu tiên:                          │
│ ○ Thấp  ○ Trung bình  ◉ Cao         │
│                                      │
│      [Hủy]         [Tạo Công Việc]  │
└──────────────────────────────────────┘
         ↓
[Click "Tạo Công Việc"]

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 5: CÔNG VIỆC ĐƯỢC TẠO                             │
└─────────────────────────────────────────────────────────┘
[Loading...]
         ↓
    ✅ Thành công
         ↓
[Modal đóng]
         ↓
[Tin nhắn gốc hiện có tag:]
┌────────────────────────────────────┐
│ "Vừa nhận 100 thùng hàng..."       │
│                                    │
│ ┌────────────────────────────────┐ │
│ │ 📋 CÔNG VIỆC:                  │ │
│ │ "Kiểm tra 100 thùng hàng"      │ │
│ │ 👤 Minh Anh • [TODO] • 0/6 mục │ │
│ │ [Xem chi tiết]                 │ │
│ └────────────────────────────────┘ │
└────────────────────────────────────┘
         ↓
[Minh Anh nhận thông báo:]
Desktop: Toast
Mobile: Push notification
"Bạn có công việc mới từ Leader Hùng"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 6: THEO DÕI TIẾN ĐỘ                               │
└─────────────────────────────────────────────────────────┘
[Leader mở tab "Công việc" trong right panel]
Desktop: Right panel → Tab Công việc
Mobile: Tab Công việc trong màn info
         ↓
Section "ĐANG XỬ LÝ"
┌────────────────────────────────────┐
│ 📦 Kiểm tra 100 thùng hàng  [TODO] │
│    ☐ 0/6 mục                       │
│    👤 Minh Anh                     │
│    🕒 Vừa xong                     │
└────────────────────────────────────┘
         ↓
... (Staff bắt đầu làm)
         ↓
[Task tự động cập nhật:]
[TODO] → [DOING]
Progress: 0/6 → 3/6 → 6/6
         ↓
... (Staff hoàn thành)
         ↓
[Leader nhận thông báo:]
"Minh Anh đã hoàn thành: Kiểm tra 100 thùng hàng"

┌─────────────────────────────────────────────────────────┐
│ BƯỚC 7: DUYỆT CÔNG VIỆC                                │
└─────────────────────────────────────────────────────────┘
[Leader vào tab Công việc]
         ↓
Section "CHỜ DUYỆT (1)"
┌────────────────────────────────────┐
│ ✅ Kiểm tra 100 thùng hàng         │
│    [NEED_TO_VERIFIED]              │
│    ✓ 6/6 mục (100%)                │
│    👤 Minh Anh                     │
│    🕒 5 phút trước                 │
│    [Xem] [Duyệt]                   │
└────────────────────────────────────┘
         ↓
[Click "Duyệt"]
         ↓
Desktop: Modal duyệt hiển thị
Mobile: Bottom sheet duyệt hiển thị

┌──────────────────────────────────────┐
│ DUYỆT CÔNG VIỆC              [✕]    │
├──────────────────────────────────────┤
│ Công việc: Kiểm tra 100 thùng hàng  │
│ Người làm: 👤 Minh Anh              │
│ Hoàn thành lúc: 14:30 - 27/01/2026  │
│                                      │
│ Checklist: ☑ 6/6 mục (100%)         │
│                                      │
│ Nhận xét (tùy chọn):                │
│ ┌──────────────────────────────────┐ │
│ │ Làm tốt, tiếp tục phát huy!      │ │
│ └──────────────────────────────────┘ │
│                                      │
│   [Yêu cầu làm lại]    [Duyệt ✓]   │
└──────────────────────────────────────┘
         ↓
[Nhập nhận xét: "Làm tốt, tiếp tục phát huy!"]
         ↓
[Click "Duyệt ✓"]
         ↓
[Trạng thái NEED_TO_VERIFIED → FINISHED]
         ↓
[Minh Anh nhận thông báo:]
"Công việc đã được duyệt ✓"
"Nhận xét: Làm tốt, tiếp tục phát huy!"

🎉 Quy trình hoàn thành!
```

---

## 🔄 Quy Trình 3: Gửi Tin Nhắn Có File Đính Kèm

### Mô Tả
Người dùng gửi tin nhắn kèm file (ảnh, PDF, Excel) trong hội thoại.

### Luồng Chi Tiết

```
┌─────────────────────────────────────────────────────────┐
│ DESKTOP: UPLOAD FILE                                    │
└─────────────────────────────────────────────────────────┘

Cách 1: Click Nút Đính Kèm
──────────────────────────
[Trong màn chat]
         ↓
[Click nút đính kèm 📎 trong ô nhập tin]
         ↓
[File picker mở ra]
         ↓
[Chọn file: "Bao_cao_kho.xlsx"]
         ↓
[File hiển thị preview trong ô nhập:]

┌────────────────────────────────────┐
│ FILE ĐANG GỬI:                     │
│ ┌──────┐                           │
│ │ 📊   │ Bao_cao_kho.xlsx          │
│ │ XLS  │ 456 KB               [x]  │
│ └──────┘                           │
│                                    │
│ [Nhập caption...]            [➤]  │
└────────────────────────────────────┘
         ↓
[Gõ caption: "Báo cáo kiểm kho tháng 1"]
         ↓
[Click nút gửi ➤]

Cách 2: Drag & Drop
───────────────────
[Kéo file từ Desktop]
         ↓
[Di chuyển chuột vào chat area]
         ↓
[Drop zone hiển thị:]
┌────────────────────────────────────┐
│                                    │
│        📎  Thả file vào đây        │
│                                    │
└────────────────────────────────────┘
         ↓
[Thả file (drop)]
         ↓
[File preview hiện ra giống Cách 1]

┌─────────────────────────────────────────────────────────┐
│ UPLOAD PROCESS                                          │
└─────────────────────────────────────────────────────────┘
[Click "Gửi" ➤]
         ↓
[Upload progress hiển thị:]
┌────────────────────────────────────┐
│ ĐANG UPLOAD FILE                   │
│                                    │
│ 📊 Bao_cao_kho.xlsx                │
│ ▓▓▓▓▓▓▓▓░░░░░░░░ 65%              │
│ 296 KB / 456 KB                    │
│                                    │
└────────────────────────────────────┘
         ↓
[Upload hoàn tất: 100%]
         ↓
[Tin nhắn gửi đi:]

┌────────────────────────────────────┐
│                       You  14:30   │
│ ┌──────────────────────────────┐   │
│ │ 📊  Bao_cao_kho.xlsx         │   │
│ │      456 KB                  │   │
│ │      [Xem] [Tải về]          │   │
│ │                              │   │
│ │ Báo cáo kiểm kho tháng 1    ✓│   │
│ └──────────────────────────────┘   │
└────────────────────────────────────┘
         ↓
[Người khác nhận tin nhắn real-time]

┌─────────────────────────────────────────────────────────┐
│ MOBILE: UPLOAD FILE                                     │
└─────────────────────────────────────────────────────────┘

[Trong màn chat mobile]
         ↓
[Tap icon camera 📷]
         ↓
[Action sheet hiển thị:]
┌────────────────────────────────────┐
│ CHỌN NGUỒN                    [✕]  │
├────────────────────────────────────┤
│ 📷  Chụp ảnh                       │
│ 🖼️  Chọn từ thư viện               │
│ 📎  Chọn file                      │
└────────────────────────────────────┘

Nếu chọn "Chụp ảnh":
───────────────────
[Tap "Chụp ảnh"]
         ↓
[Camera native mở ra]
         ↓
[Chụp ảnh]
         ↓
[Preview ảnh hiển thị:]
┌────────────────────────────────────┐
│  [Ảnh preview]                     │
│                                    │
│  [Chụp lại]         [Sử dụng ảnh] │
└────────────────────────────────────┘
         ↓
[Tap "Sử dụng ảnh"]
         ↓
[Ảnh xuất hiện trong ô nhập tin:]
┌────────────────────────────────────┐
│ ┌──────┐                           │
│ │ IMG  │ photo_20260127.jpg   [x]  │
│ └──────┘                           │
│ [Nhập caption...]            [➤]  │
└────────────────────────────────────┘

Nếu chọn "Chọn từ thư viện":
──────────────────────────
[Tap "Chọn từ thư viện"]
         ↓
[Gallery/Photos app mở ra]
         ↓
[Chọn ảnh (có thể chọn nhiều)]
         ↓
[Tap "Done" / "Xong"]
         ↓
[Ảnh hiển thị preview trong ô nhập]

┌─────────────────────────────────────────────────────────┐
│ XEM FILE ĐÃ GỬI                                        │
└─────────────────────────────────────────────────────────┘
[Người khác nhận tin nhắn có file]
         ↓
Desktop:
  [Click vào file]
           ↓
  [Modal preview mở ra full screen]
           ↓
  PDF: Hiển thị từng trang
  Excel: Hiển thị bảng
  Image: Hiển thị ảnh với zoom
  Word: Render HTML
           ↓
  [Có nút "Tải về" để download]

Mobile:
  [Tap vào file]
           ↓
  [Full screen preview]
           ↓
  [Pinch to zoom cho ảnh]
  [Swipe để xem trang PDF]
           ↓
  [Tap "Tải về" → Share sheet → Save]

🎉 Quy trình hoàn thành!
```

---

## ✅ Checklist Kiểm Thử Quy Trình

### Quy Trình 1: Staff Nhận & Thực Hiện Công Việc
- [ ] Staff login thành công
- [ ] Thấy danh sách hội thoại được phân công
- [ ] Badge unread hiển thị đúng
- [ ] Vào hội thoại và đọc tin nhắn
- [ ] Badge biến mất sau khi đọc
- [ ] Nhận thông báo công việc mới
- [ ] Tab Công việc hiển thị task TODO
- [ ] Click "Bắt đầu làm" → TODO chuyển DOING
- [ ] Check từng mục checklist → Progress tăng dần
- [ ] Click "Hoàn thành" → DOING chuyển NEED_TO_VERIFIED
- [ ] Leader nhận thông báo cần duyệt
- [ ] Sau khi Leader duyệt → Staff nhận thông báo
- [ ] Task chuyển FINISHED

### Quy Trình 2: Leader Tạo & Phân Công
- [ ] Leader login thành công
- [ ] Thấy TẤT CẢ hội thoại nhóm quản lý
- [ ] Vào hội thoại và đọc tin nhắn
- [ ] Hover tin nhắn → Menu hiện icon "Tạo công việc"
- [ ] Click "Tạo công việc" → Modal mở
- [ ] Tiêu đề auto-fill từ nội dung tin
- [ ] Chọn được nhân viên
- [ ] Chọn loại công việc → Template load
- [ ] Click "Tạo" → Task được tạo
- [ ] Tin nhắn gốc hiển thị task card
- [ ] Staff nhận thông báo
- [ ] Leader theo dõi tiến độ real-time
- [ ] Nhận thông báo khi Staff hoàn thành
- [ ] Duyệt task → Staff nhận thông báo

### Quy Trình 3: Gửi File
- [ ] Desktop: Click 📎 → File picker mở
- [ ] Desktop: Chọn file → Preview hiển thị
- [ ] Desktop: Drag & drop file → Upload
- [ ] Mobile: Tap 📷 → Action sheet hiển thị
- [ ] Mobile: Chọn "Chụp ảnh" → Camera mở
- [ ] Mobile: Chụp → Preview → Confirm
- [ ] Mobile: Chọn từ gallery → Photos mở
- [ ] Upload progress hiển thị %
- [ ] Tin nhắn với file gửi thành công
- [ ] File card hiển thị đúng (icon, tên, size)
- [ ] Click/Tap file → Preview mở
- [ ] Preview hiển thị đúng theo loại file
- [ ] Tải về file thành công

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md)
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md)
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md)
- 📄 [07_QUAN_LY_CONG_VIEC.md](./07_QUAN_LY_CONG_VIEC.md)
- 📄 [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md)

---

**Phiên bản:** 2.0
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
