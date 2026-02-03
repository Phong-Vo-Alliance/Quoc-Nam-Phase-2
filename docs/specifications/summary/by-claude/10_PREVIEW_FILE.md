# 10. Preview File

> **Mục đích:** Mô tả tính năng xem trước file (PDF, Excel, Word, Image) trong ứng dụng
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Tính năng Preview File cho phép người dùng xem nội dung file trực tiếp trong ứng dụng mà không cần tải về hoặc mở bằng ứng dụng khác.

**Các loại file hỗ trợ preview:**
- Hình ảnh (JPG, PNG, GIF, WEBP)
- PDF
- Excel (XLS, XLSX)
- Word (DOC, DOCX)

---

## 🖼️ Preview Hình Ảnh

### Mở Preview

```
[Click/Tap vào ảnh trong tin nhắn hoặc File Manager]
         ↓
Desktop: Modal preview mở giữa màn hình
Mobile: Full screen image viewer
         ↓
[Ảnh hiển thị với các controls]
```

### Giao Diện Desktop

```
┌─────────────────────────────────────────────────┐
│  ← IMAGE VIEWER                      [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│                                                 │
│              [        IMAGE         ]           │
│                                                 │
│                                                 │
│                                                 │
│  ────────────────────────────────────────────  │
│  Anh_kiem_kho.jpg                              │
│  👤 Minh Anh • 14:30 - 27/01/2026             │
│  2.3 MB • 1920x1080                            │
│                                                 │
│  [⟲ Xoay] [🔍+ Zoom] [🔍- Thu nhỏ]            │
│  [← Trước] [Sau →] [💾 Tải về]                │
└─────────────────────────────────────────────────┘
```

### Giao Diện Mobile

```
┌─────────────────────────────┐
│  [←] Ảnh (3/12)      [⋮]   │  ← Header
├─────────────────────────────┤
│                             │
│                             │
│                             │
│       [   IMAGE   ]         │
│                             │
│                             │
│                             │
├─────────────────────────────┤
│  Anh_kiem_kho.jpg          │  ← Footer
│  Minh Anh • 14:30          │
│  [💾 Tải về] [🔗 Chia sẻ]  │
└─────────────────────────────┘
```

---

## 🎨 Tính Năng Preview Ảnh

### Zoom In/Out

**Desktop:**
```
Cách 1: Click nút [🔍+] / [🔍-]
Cách 2: Scroll chuột (wheel up/down)
Cách 3: Ctrl + Scroll
Cách 4: Double click → Zoom to fit
```

**Mobile:**
```
Cách 1: Pinch to zoom (2 ngón tay)
Cách 2: Double tap → Zoom in
Cách 3: Double tap lần 2 → Zoom out
```

**Mức zoom:**
- Min: 50% (fit to screen)
- Max: 400% (4x)
- Step: 25% mỗi lần click

---

### Xoay Ảnh

```
[Click/Tap nút "⟲ Xoay"]
         ↓
[Ảnh xoay 90° theo chiều kim đồng hồ]
         ↓
[Click lại → Xoay thêm 90°]
```

**Góc xoay:**
- 0° (ban đầu)
- 90° (lần 1)
- 180° (lần 2)
- 270° (lần 3)
- 360° = 0° (lần 4, về lại ban đầu)

---

### Navigate Giữa Các Ảnh

```
[Đang xem ảnh thứ 3/12]
         ↓
Desktop:
  Click nút [← Trước]  → Ảnh trước (2/12)
  Click nút [Sau →]    → Ảnh sau (4/12)
  Hoặc: Nhấn phím ← →

Mobile:
  Swipe left  → Ảnh sau (4/12)
  Swipe right → Ảnh trước (2/12)
```

**Lưu ý:**
- Ảnh đầu tiên: Nút [← Trước] disable
- Ảnh cuối cùng: Nút [Sau →] disable
- Chỉ navigate trong cùng hội thoại

---

### Pan (Di Chuyển) Khi Zoom

```
[Zoom in ảnh > 100%]
         ↓
Desktop: Click & drag để di chuyển
Mobile: Touch & drag để di chuyển
         ↓
[Ảnh di chuyển theo cử chỉ]
```

---

## 📄 Preview PDF

### Mở Preview

```
[Click/Tap vào file PDF]
         ↓
Desktop: Modal PDF viewer
Mobile: Full screen PDF viewer
         ↓
[PDF render từng trang]
```

### Giao Diện Desktop

```
┌─────────────────────────────────────────────────┐
│  ← PDF VIEWER                        [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [PDF Content Rendered Page 1]                 │
│                                                 │
│                                                 │
│                                                 │
│  ────────────────────────────────────────────  │
│  Bao_cao_kho.pdf                               │
│  👤 Minh Anh • 14:30 - 27/01/2026             │
│  2.3 MB • 5 trang                              │
│                                                 │
│  [← Trước] [Trang 1 ▼ /5] [Sau →]            │
│  [🔍+ Zoom] [🔍- Thu nhỏ] [💾 Tải về]        │
└─────────────────────────────────────────────────┘
```

### Giao Diện Mobile

```
┌─────────────────────────────┐
│  [←] Báo cáo (1/5)   [⋮]   │
├─────────────────────────────┤
│                             │
│   [ PDF Page 1 ]            │
│                             │
│                             │
│   Swipe up ↓                │
│   để xem trang tiếp         │
├─────────────────────────────┤
│  Bao_cao_kho.pdf           │
│  Trang 1/5                 │
│  [💾 Tải về]                │
└─────────────────────────────┘
```

---

## 📑 Tính Năng Preview PDF

### Navigate Trang

**Desktop:**
```
Cách 1: Click [← Trước] / [Sau →]
Cách 2: Nhấn phím ← / →
Cách 3: Click dropdown "Trang 1 ▼" → Chọn trang
Cách 4: Scroll chuột → Auto load trang tiếp
```

**Mobile:**
```
Cách 1: Swipe up → Trang tiếp
Cách 2: Swipe down → Trang trước
Cách 3: Scroll liên tục → Auto load
```

### Zoom PDF

**Desktop:**
```
Cách 1: Click [🔍+] / [🔍-]
Cách 2: Ctrl + Scroll
Cách 3: Dropdown zoom: [50% 75% 100% 125% 150% 200%]
```

**Mobile:**
```
Cách 1: Pinch to zoom
Cách 2: Double tap → Zoom in
```

**Mức zoom:**
- 50% (Thu nhỏ)
- 75%
- 100% (Mặc định)
- 125%
- 150%
- 200% (Phóng to tối đa)

### Tìm Kiếm Trong PDF (Optional)

```
[Click icon 🔍 Search]
         ↓
[Ô tìm kiếm xuất hiện]
         ↓
[Gõ từ khóa: "kiểm kho"]
         ↓
[Highlight từ khóa trong PDF]
         ↓
[Navigate qua các kết quả: 1/5, 2/5...]
```

---

## 📊 Preview Excel

### Mở Preview

```
[Click/Tap vào file Excel]
         ↓
Desktop: Modal Excel viewer
Mobile: Full screen Excel viewer
         ↓
[Hiển thị bảng sheet đầu tiên]
```

### Giao Diện Desktop

```
┌─────────────────────────────────────────────────┐
│  ← EXCEL VIEWER                      [✕] [↓]   │
├─────────────────────────────────────────────────┤
│  Sheet: [Báo Cáo Tháng 01 ▼]                  │
│  ┌──────────────────────────────────────────┐  │
│  │ STT│ Sản Phẩm │ Số Lượng │ Đơn Giá    │  │
│  ├────┼──────────┼──────────┼────────────┤  │
│  │  1 │ SP A     │   100    │   50,000   │  │
│  │  2 │ SP B     │   200    │   75,000   │  │
│  │  3 │ SP C     │   150    │   60,000   │  │
│  │  4 │ SP D     │   120    │   80,000   │  │
│  │  5 │ SP E     │   180    │   55,000   │  │
│  └──────────────────────────────────────────┘  │
│  Hiển thị 5/100 dòng                           │
│  [⬅️ Trang trước] [1/20] [Trang sau ➡️]       │
│  [💾 Tải về để xem đầy đủ]                    │
└─────────────────────────────────────────────────┘
```

### Giao Diện Mobile

```
┌─────────────────────────────┐
│  [←] Excel          [⋮]    │
├─────────────────────────────┤
│  Sheet: Báo Cáo T01   [▼]  │
├─────────────────────────────┤
│  (Bảng cuộn ngang/dọc)     │
│  ┌───┬─────┬────┬─────┐    │
│  │STT│ SP  │ SL │ Giá │    │
│  ├───┼─────┼────┼─────┤    │
│  │ 1 │SP A │100 │50K  │    │
│  │ 2 │SP B │200 │75K  │    │
│  └───┴─────┴────┴─────┘    │
├─────────────────────────────┤
│  Dòng 1-5/100              │
│  [Tải về để xem đầy đủ]    │
└─────────────────────────────┘
```

---

## 📈 Tính Năng Preview Excel

### Chọn Sheet

```
[Click/Tap dropdown "Sheet"]
         ↓
[Danh sách sheet hiển thị:]
  • Báo Cáo Tháng 01
  • Thống Kê
  • Tổng Hợp
         ↓
[Chọn sheet khác]
         ↓
[Bảng load dữ liệu sheet mới]
```

### Pagination

**Giới hạn hiển thị:**
- Desktop: 20 dòng/trang
- Mobile: 10 dòng/trang

```
[Xem trang 1: dòng 1-20]
         ↓
[Click "Trang sau" ➡️]
         ↓
[Xem trang 2: dòng 21-40]
```

### Scroll Bảng

**Desktop:**
```
Cuộn ngang: Shift + Scroll
Cuộn dọc: Scroll thường
```

**Mobile:**
```
Swipe ngang: Xem cột ẩn bên phải
Swipe dọc: Xem dòng tiếp theo
```

### Lưu Ý

- Chỉ xem được, không edit
- Format có thể không giống 100% Excel gốc
- Công thức không tính toán, chỉ hiện kết quả
- Để xem đầy đủ → Tải file về

---

## 📝 Preview Word

### Mở Preview

```
[Click/Tap vào file Word]
         ↓
Desktop: Modal Word viewer
Mobile: Full screen Word viewer
         ↓
[Nội dung Word được render HTML]
```

### Giao Diện Desktop

```
┌─────────────────────────────────────────────────┐
│  ← WORD VIEWER                       [✕] [↓]   │
├─────────────────────────────────────────────────┤
│                                                 │
│  [Nội dung Word được render thành HTML]        │
│                                                 │
│  Tiêu đề: Hướng Dẫn Kiểm Kho                  │
│  ═══════════════════════════════════           │
│                                                 │
│  1. Chuẩn Bị                                   │
│  • Kiểm tra phiếu nhập kho                     │
│  • Chuẩn bị dụng cụ kiểm đếm                   │
│                                                 │
│  2. Thực Hiện                                  │
│  • Đếm số lượng thùng                          │
│  • Kiểm tra tình trạng bên ngoài               │
│  ...                                           │
│                                                 │
│  ────────────────────────────────────────────  │
│  Huong_dan_kiem_kho.docx                       │
│  👤 Leader Hùng • Hôm qua                      │
│  [💾 Tải về để xem chính xác]                 │
└─────────────────────────────────────────────────┘
```

### Giao Diện Mobile

```
┌─────────────────────────────┐
│  [←] Word Doc       [⋮]    │
├─────────────────────────────┤
│                             │
│  (Nội dung Word HTML)       │
│                             │
│  Tiêu đề: Hướng Dẫn        │
│  ═══════════════            │
│                             │
│  1. Chuẩn Bị               │
│  • Kiểm tra phiếu          │
│  • Chuẩn bị dụng cụ        │
│                             │
│  (Scroll để xem tiếp)       │
├─────────────────────────────┤
│  Huong_dan.docx            │
│  [💾 Tải về]                │
└─────────────────────────────┘
```

---

## 📄 Tính Năng Preview Word

### Format Hỗ Trợ

**✅ Hỗ trợ:**
- Heading (H1, H2, H3...)
- Bold, Italic, Underline
- Bullet list / Numbered list
- Text alignment (Left, Center, Right)
- Paragraph spacing
- Basic tables

**⚠️ Giới hạn:**
- Image trong Word: Có thể không hiện
- Font chữ: Có thể khác
- Layout phức tạp: Có thể sai
- Header/Footer: Không hiện
- Comments: Không hiện

### Scroll Dọc

```
Desktop: Scroll chuột để xem tiếp
Mobile: Swipe up để xem tiếp
```

### Lưu Ý

**Word preview chỉ mang tính tham khảo**
- Để xem chính xác 100% → Tải về và mở bằng MS Word
- Preview convert từ .docx → HTML
- Format có thể mất hoặc thay đổi

---

## 📱 Khác Biệt Desktop vs Mobile

### Giao Diện

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Container** | Modal popup (800x600px) | Full screen |
| **Close** | Click [✕] hoặc ESC | Nút [←] hoặc swipe down |
| **Toolbar** | Fixed bottom | Fixed bottom với scroll |
| **Background** | Overlay mờ | Solid background |

### Image Preview

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Zoom** | Scroll chuột / Ctrl+Scroll | Pinch to zoom |
| **Pan** | Click & drag | Touch & drag |
| **Xoay** | Click button | Tap button |
| **Navigate** | ← → buttons / Arrow keys | Swipe left/right |
| **Download** | Click [💾] → Downloads folder | Tap [💾] → Share sheet |

### PDF Preview

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Scroll trang** | Scroll chuột | Swipe up/down |
| **Zoom** | Ctrl+Scroll / Buttons | Pinch to zoom |
| **Jump to page** | Dropdown chọn trang | Scroll indicator |
| **Search** | Ctrl+F | Search icon → Bottom sheet |

### Excel Preview

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Scroll ngang** | Shift+Scroll | Swipe left/right |
| **Scroll dọc** | Scroll thường | Swipe up/down |
| **Chọn sheet** | Dropdown | Bottom sheet |
| **Pagination** | Buttons | Buttons (smaller) |

### Word Preview

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Scroll** | Scroll chuột | Swipe up/down |
| **Text size** | Fixed | Smaller để fit màn hình |
| **Layout** | Wide | Narrow (single column) |

---

## ✅ Checklist Kiểm Thử

### Preview Hình Ảnh

- [ ] **Mở preview**
  - Click/Tap ảnh → Preview mở
  - Desktop: Modal giữa màn hình
  - Mobile: Full screen

- [ ] **Hiển thị ảnh**
  - Ảnh load đúng và rõ nét
  - Thông tin: Tên, người upload, thời gian, size, resolution

- [ ] **Zoom in/out**
  - Desktop: Scroll chuột → Zoom
  - Mobile: Pinch → Zoom
  - Double click/tap → Zoom to fit
  - Mức zoom: 50% - 400%

- [ ] **Xoay ảnh**
  - Click/Tap "⟲ Xoay" → Xoay 90°
  - Xoay đúng chiều kim đồng hồ
  - Xoay 4 lần → Về lại 0°

- [ ] **Pan khi zoom**
  - Zoom > 100% → Click/Touch & drag
  - Ảnh di chuyển theo cử chỉ

- [ ] **Navigate**
  - Desktop: Click [← →] hoặc arrow keys
  - Mobile: Swipe left/right
  - Ảnh đầu: [←] disable
  - Ảnh cuối: [→] disable

- [ ] **Download**
  - Click/Tap "💾 Tải về" → File download
  - Desktop: Lưu vào Downloads
  - Mobile: Share sheet → Save

- [ ] **Close**
  - Desktop: Click [✕] hoặc ESC
  - Mobile: Tap [←] hoặc swipe down

### Preview PDF

- [ ] **Mở preview**
  - Click/Tap PDF → Preview mở
  - Trang đầu tiên render đúng

- [ ] **Navigate trang**
  - Desktop: Click [← →] / Arrow keys
  - Mobile: Swipe up/down
  - Trang hiện tại: "Trang X/Y"

- [ ] **Jump to page**
  - Desktop: Click dropdown → Chọn trang
  - Jump chính xác đến trang đó

- [ ] **Zoom**
  - Desktop: Ctrl+Scroll / Buttons
  - Mobile: Pinch to zoom
  - Mức zoom: 50% - 200%

- [ ] **Scroll liên tục**
  - Scroll qua nhiều trang → Auto load
  - Không bị lag

- [ ] **Download**
  - Click/Tap "💾 Tải về" → PDF download

### Preview Excel

- [ ] **Mở preview**
  - Click/Tap Excel → Preview mở
  - Sheet đầu tiên hiển thị

- [ ] **Hiển thị bảng**
  - Dữ liệu hiển thị đúng
  - Format cơ bản giữ được (bold, số, tiền tệ)

- [ ] **Chọn sheet**
  - Click/Tap dropdown sheet
  - Danh sách sheet hiển thị
  - Chọn sheet khác → Load đúng

- [ ] **Pagination**
  - Desktop: 20 dòng/trang
  - Mobile: 10 dòng/trang
  - Click [→] → Trang tiếp

- [ ] **Scroll ngang**
  - Desktop: Shift+Scroll
  - Mobile: Swipe left/right
  - Xem cột ẩn bên phải

- [ ] **Download**
  - Message: "Tải về để xem đầy đủ"
  - Click/Tap → Download

### Preview Word

- [ ] **Mở preview**
  - Click/Tap Word → Preview mở
  - HTML render

- [ ] **Hiển thị nội dung**
  - Text hiển thị đúng
  - Heading, bold, italic, list render

- [ ] **Format**
  - Heading: Font lớn, bold
  - Bullet list: Có bullet
  - Numbered list: Có số
  - Tables: Hiển thị grid

- [ ] **Scroll**
  - Desktop: Scroll chuột
  - Mobile: Swipe up
  - Xem hết nội dung

- [ ] **Download**
  - Message: "Tải về để xem chính xác"
  - Click/Tap → Download

### Quyền Hạn

- [ ] **Tất cả user xem preview được**
  - Staff, Leader, Admin đều preview được
  - Không phân biệt quyền

- [ ] **Download tuỳ thuộc quyền chat**
  - User trong chat → Download được
  - User không trong chat → Không xem/download

### Mobile Gestures

- [ ] **Pinch to zoom (Image, PDF)**
  - 2 ngón tay pinch in → Zoom out
  - 2 ngón tay pinch out → Zoom in

- [ ] **Swipe to navigate (Image)**
  - Swipe left → Ảnh tiếp
  - Swipe right → Ảnh trước

- [ ] **Swipe to scroll (PDF, Word)**
  - Swipe up → Scroll xuống
  - Swipe down → Scroll lên

- [ ] **Swipe to close**
  - Swipe down từ top → Đóng preview

- [ ] **Double tap zoom**
  - Double tap → Zoom in
  - Double tap lại → Zoom out

### Performance

- [ ] **Load nhanh**
  - Ảnh < 2MB → Load < 1s
  - PDF < 5MB → Load < 2s
  - Excel < 2MB → Load < 2s

- [ ] **Smooth scroll**
  - Scroll PDF không lag
  - Scroll Excel không giật

- [ ] **Memory**
  - Preview nhiều file → Không crash
  - Đóng preview → Memory free

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [09_QUAN_LY_FILE.md](./09_QUAN_LY_FILE.md) - Quản lý file và upload
- 📄 [02_QUY_TRINH_CHINH.md](./02_QUY_TRINH_CHINH.md) - Quy trình gửi và xem file
- 📄 [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md) - So sánh trải nghiệm

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
