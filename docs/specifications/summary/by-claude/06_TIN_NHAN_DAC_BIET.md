# 06. Tin Nhắn Đặc Biệt

> **Mục đích:** Mô tả các tính năng đặc biệt: Ghim (Pin), Đánh dấu (Star), và Trả lời (Reply)
>
> **Dành cho:** Team QC, Team Mobile, Product Manager
>
> **Phiên bản:** 2.0 (Unified)

---

## 📌 Tổng Quan

Hệ thống hỗ trợ 3 loại tương tác đặc biệt với tin nhắn:

1. **📌 Pin (Ghim)** - Leader ghim tin quan trọng cho cả nhóm
2. **⭐ Star (Đánh dấu)** - Cá nhân đánh dấu tin cho riêng mình
3. **↩️ Reply (Trả lời)** - Trả lời tin nhắn cụ thể

**Phân quyền:**
- Pin: Chỉ Leader mới có quyền
- Star: Tất cả (Staff, Leader, Admin)
- Reply: Tất cả (Staff, Leader, Admin)

---

## 📌 PHẦN 1: GHIM TIN NHẮN (PIN MESSAGE)

### Mục Đích

- **Leader** ghim tin nhắn quan trọng
- **Tất cả thành viên** đều thấy tin được ghim
- Dễ dàng truy cập thông tin quan trọng
- Giúp team không bỏ sót thông tin critical

**Ví dụ sử dụng:**
- Ghim thông báo quan trọng
- Ghim lịch làm việc
- Ghim checklist cần tuân thủ
- Ghim thông tin liên hệ khẩn cấp

---

### Cách Ghim Tin Nhắn

#### Desktop

```
[Leader hover vào tin nhắn]
         ↓
[Menu actions hiện ra]
[😊] [↩️] [📌] [⭐] [⋮]
         ↓
[Click icon 📌]
         ↓
[Tin nhắn được ghim]
         ↓
[Icon 📌 trên tin chuyển sang màu xanh/đỏ (active)]
         ↓
[Tin hiển thị trong khu vực "Tin đã ghim" ở top]
         ↓
[Tất cả thành viên thấy tin ghim]
```

#### Mobile

```
[Leader long-press tin nhắn]
         ↓
[Bottom sheet actions hiện]
┌───────────────────────────────┐
│  TÙY CHỌN               [✕]  │
├───────────────────────────────┤
│  😊  Thêm reaction            │
│  ↩️  Trả lời                  │
│  📌  Ghim tin nhắn            │ ← Chỉ Leader
│  ⭐  Đánh dấu                 │
│  📋  Tạo công việc            │
└───────────────────────────────┘
         ↓
[Tap "Ghim tin nhắn"]
         ↓
[Tin được ghim, bottom sheet đóng]
```

---

### Hiển Thị Tin Ghim

#### Khu Vực Tin Ghim (Pinned Messages Area)

```
┌─────────────────────────────────────────────┐
│  CHAT HEADER                                │
│  ← Nhóm Kho A                       ℹ️  ⋮  │
│  📍 Nhận hàng · Kiểm đếm                   │
├─────────────────────────────────────────────┤
│  📌 TIN NHẮN ĐÃ GHIM (2)          [Xem ▼] │
├─────────────────────────────────────────────┤
│  [Nội dung chat...]                         │
└─────────────────────────────────────────────┘
```

**Đặc điểm:**
- Nằm ngay dưới header, phía trên danh sách tin nhắn
- Hiển thị số lượng tin ghim: `(2)`
- Mặc định collapse (đóng), click "Xem ▼" để expand

---

#### Expand Danh Sách Tin Ghim

```
┌─────────────────────────────────────────────┐
│  📌 TIN NHẮN ĐÃ GHIM (2)          [Ẩn ▲]  │
├─────────────────────────────────────────────┤
│                                             │
│  📌 [1/2]                                   │
│  👤 Leader Hùng - 27/01 10:30              │
│  ┌─────────────────────────────────────┐   │
│  │ Lưu ý: Hôm nay kiểm kỹ phần đáy    │   │
│  │ thùng hàng, nhiều khách phàn nàn... │   │
│  └─────────────────────────────────────┘   │
│  [Xem tin gốc] [Bỏ ghim]                   │
│                                             │
│  📌 [2/2]                                   │
│  👤 Minh Anh - 26/01 09:15                 │
│  ┌─────────────────────────────────────┐   │
│  │ Checklist kiểm hàng:                │   │
│  │ 1. Kiểm số lượng                     │   │
│  │ 2. Kiểm tình trạng bên ngoài...     │   │
│  └─────────────────────────────────────┘   │
│  [Xem tin gốc] [Bỏ ghim]                   │
│                                             │
├─────────────────────────────────────────────┤
│  [Nội dung chat...]                         │
└─────────────────────────────────────────────┘
```

**Chức năng:**
- Hiển thị tối đa 3 tin ghim gần nhất
- Nếu > 3 tin: Hiển thị 2 tin + "Xem thêm X tin khác"
- Click "Xem tin gốc" → Scroll đến tin nhắn gốc trong chat
- Click "Bỏ ghim" → Xác nhận → Bỏ ghim (chỉ Leader)

---

#### Tin Nhắn Được Ghim (Badge Trong Chat)

```
┌──────────────────────────────────────────────┐
│  👤 Leader Hùng                    10:30     │
│  📌 [Đã ghim]                                │ ← Badge ghim
│  ┌────────────────────────────────────────┐  │
│  │ Lưu ý: Hôm nay kiểm kỹ phần đáy thùng│  │
│  │ hàng, nhiều khách phàn nàn...         │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Badge "📌 Đã ghim" hiển thị ở trên bubble
- Background bubble có viền hoặc shadow khác biệt (optional)
- Icon 📌 trong menu actions chuyển sang active (màu xanh/đỏ)

---

### Bỏ Ghim Tin Nhắn

#### Cách 1: Từ Menu Actions

```
[Leader hover/long-press tin đã ghim]
         ↓
[Menu actions hiện]
[😊] [↩️] [📌✓] [⭐] [⋮]  ← Icon 📌 active
         ↓
[Click icon 📌]
         ↓
[Modal xác nhận:]
┌─────────────────────────────────────┐
│  BỎ GHIM TIN NHẮN          [✕]     │
├─────────────────────────────────────┤
│  Bạn có chắc muốn bỏ ghim tin này? │
│                                     │
│  [Hủy]           [Bỏ ghim]         │
└─────────────────────────────────────┘
         ↓
[Click "Bỏ ghim"]
         ↓
[Tin biến mất khỏi danh sách ghim]
         ↓
[Badge "Đã ghim" bị xóa khỏi tin]
         ↓
[Tất cả thành viên thấy tin đã bị bỏ ghim]
```

---

#### Cách 2: Từ Khu Vực Tin Ghim

```
[Mở danh sách tin ghim]
         ↓
[Click "Bỏ ghim" dưới tin cụ thể]
         ↓
[Xác nhận]
         ↓
[Tin bị xóa khỏi danh sách]
```

---

### Giới Hạn Số Lượng Ghim

**Quy tắc:**
- Tối đa **5 tin ghim** trên 1 hội thoại
- Khi ghim tin thứ 6:
  ```
  ┌─────────────────────────────────────┐
  │  THÔNG BÁO                 [✕]     │
  ├─────────────────────────────────────┤
  │  Bạn đã ghim tối đa 5 tin nhắn.    │
  │  Vui lòng bỏ ghim tin cũ để ghim   │
  │  tin mới.                           │
  │                                     │
  │  [Quản lý tin ghim]      [Đóng]    │
  └─────────────────────────────────────┘
  ```

---

### Quyền Hạn

| Vai trò | Ghim | Bỏ ghim | Xem |
|---------|------|---------|-----|
| **Staff** | ❌ Không | ❌ Không | ✅ Có |
| **Leader** | ✅ Có | ✅ Có (tin của bất kỳ ai) | ✅ Có |
| **Admin** | ✅ Có | ✅ Có | ✅ Có |

**Staff:**
- Không thấy icon 📌 trong menu actions
- Chỉ xem được tin ghim, không thao tác

---

## ⭐ PHẦN 2: ĐÁNH DÁU TIN NHẮN (STAR MESSAGE)

### Mục Đích

- **Cá nhân** đánh dấu tin nhắn quan trọng cho riêng mình
- **Chỉ mình** thấy, không ảnh hưởng đến người khác
- Dễ dàng tìm lại tin đã đánh dấu
- Tương tự "Bookmark" hoặc "Favorite"

**Ví dụ sử dụng:**
- Đánh dấu thông tin cần nhớ
- Đánh dấu công việc cần follow-up
- Đánh dấu file quan trọng
- Đánh dấu tin cần xem lại sau

---

### Cách Đánh Dấu

#### Desktop

```
[Hover vào tin nhắn]
         ↓
[Menu actions hiện]
[😊] [↩️] [📌] [⭐] [⋮]
         ↓
[Click icon ⭐]
         ↓
[Tin nhắn được đánh dấu]
         ↓
[Icon ⭐ chuyển sang màu vàng (active)]
```

#### Mobile

```
[Long-press tin nhắn]
         ↓
[Bottom sheet hiện]
         ↓
[Tap "⭐ Đánh dấu"]
         ↓
[Tin được đánh dấu, bottom sheet đóng]
```

---

### Hiển Thị Tin Đã Đánh Dấu

#### Tin Nhắn Trong Chat

```
┌──────────────────────────────────────────────┐
│  👤 Minh Anh                       10:30     │
│  ⭐ [Đã đánh dấu]                            │ ← Badge cá nhân
│  ┌────────────────────────────────────────┐  │
│  │ Đã kiểm tra xong 100 thùng hàng...    │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Lưu ý:**
- Badge "⭐ Đã đánh dấu" chỉ mình thấy
- Người khác không thấy badge này

---

#### Danh Sách Tin Đã Đánh Dấu

**Desktop: Trong Right Panel**

```
┌─────────────────────────────────────────┐
│  RIGHT PANEL                            │
├─────────────────────────────────────────┤
│  [Tabs]                                 │
│  • Thông tin                            │
│  • Công việc                            │
│  • Files                                │
│  • ▶ Tin đánh dấu                       │
│  • Thành viên                           │
├─────────────────────────────────────────┤
│  TIN ĐÃ ĐÁNH DẤU (5)                   │
├─────────────────────────────────────────┤
│  ⭐ 27/01 10:30 - Minh Anh             │
│  "Đã kiểm tra xong 100 thùng..."       │
│  [Xem tin gốc] [Bỏ đánh dấu]           │
│                                         │
│  ⭐ 26/01 15:20 - Leader Hùng          │
│  "Lưu ý: Hôm nay kiểm kỹ..."          │
│  [Xem tin gốc] [Bỏ đánh dấu]           │
│                                         │
│  ⭐ 25/01 09:00 - Nam                  │
│  📄 Bao_cao_kho.xlsx (125 KB)         │
│  [Xem tin gốc] [Bỏ đánh dấu]           │
└─────────────────────────────────────────┘
```

---

**Mobile: Màn Hình Riêng**

```
Cách 1: Từ màn chat
[Tap icon ℹ️ ở header]
         ↓
[Màn Info hiển thị]
         ↓
[Scroll xuống → Tìm tab "Tin đánh dấu"]
         ↓
[Tap để xem danh sách]

Cách 2: Từ profile cá nhân
[Bottom Nav → Tab "Cá nhân"]
         ↓
[Tap "Tin đã đánh dấu"]
         ↓
[Màn danh sách full screen]
┌───────────────────────────┐
│  ← Tin Đã Đánh Dấu       │
├───────────────────────────┤
│  TẤT CẢ (23)    NHÓM (15) │ ← Tabs
├───────────────────────────┤
│  ⭐ Nhóm Kho A            │
│  27/01 10:30 - Minh Anh   │
│  "Đã kiểm tra xong..."    │
│  [Xem] [Bỏ đánh dấu]     │
│                           │
│  ⭐ Team CSKH 1           │
│  26/01 15:20 - Huyền      │
│  "Khách hàng hỏi về..."   │
│  [Xem] [Bỏ đánh dấu]     │
└───────────────────────────┘
```

**Tính năng:**
- Hiển thị tất cả tin đã đánh dấu từ mọi hội thoại
- Tab "Tất cả" vs "Nhóm" để lọc
- Click "Xem tin gốc" → Mở hội thoại, scroll đến tin
- Click "Bỏ đánh dấu" → Xóa khỏi danh sách

---

### Bỏ Đánh Dấu

```
[Hover/long-press tin đã đánh dấu]
         ↓
[Menu actions hiện]
[😊] [↩️] [⭐✓] [⋮]  ← Icon ⭐ active (màu vàng)
         ↓
[Click icon ⭐]
         ↓
[Tin bị bỏ đánh dấu ngay lập tức]
         ↓
[Badge "Đã đánh dấu" biến mất]
         ↓
[Tin biến mất khỏi danh sách "Tin đã đánh dấu"]
```

---

### Quyền Hạn

| Vai trò | Đánh dấu | Bỏ đánh dấu | Xem |
|---------|----------|-------------|-----|
| **Staff** | ✅ Có | ✅ Có (chỉ tin của mình đánh dấu) | ✅ Chỉ của mình |
| **Leader** | ✅ Có | ✅ Có | ✅ Chỉ của mình |
| **Admin** | ✅ Có | ✅ Có | ✅ Chỉ của mình |

**Lưu ý:**
- Star là **cá nhân**, không ai thấy được star của người khác
- Mỗi user có danh sách star riêng

---

## ↩️ PHẦN 3: TRẢ LỜI TIN NHẮN (REPLY MESSAGE)

### Mục Đích

- Trả lời tin nhắn cụ thể trong cuộc hội thoại
- Giữ context (ngữ cảnh) của cuộc trò chuyện
- Dễ dàng theo dõi thread thảo luận
- Tránh nhầm lẫn trong hội thoại đông người

**Ví dụ sử dụng:**
- Trả lời câu hỏi cụ thể
- Xác nhận công việc đã được giao
- Follow-up tin nhắn quan trọng
- Tham gia vào thread thảo luận

---

### Cách Reply

#### Desktop

```
[Hover vào tin nhắn muốn reply]
         ↓
[Menu actions hiện]
[😊] [↩️] [📌] [⭐] [⋮]
         ↓
[Click icon ↩️ Reply]
         ↓
[Khu vực input hiển thị preview tin được reply:]
┌─────────────────────────────────────────┐
│  ┌─ Trả lời Minh Anh ────────────────┐ │
│  │ Đã kiểm tra xong 100 thùng...     │ │
│  │                              [✕]  │ │ ← Click X để hủy
│  └───────────────────────────────────┘ │
│  [Nhập tin nhắn trả lời...]      [➤]  │
└─────────────────────────────────────────┘
         ↓
[Gõ tin nhắn trả lời]
         ↓
[Click Gửi hoặc Enter]
         ↓
[Tin reply được gửi]
```

---

#### Mobile

**Cách 1: Long-press**
```
[Long-press tin nhắn]
         ↓
[Bottom sheet hiện]
         ↓
[Tap "↩️ Trả lời"]
         ↓
[Input hiển thị preview tin reply]
         ↓
[Keyboard tự động hiện]
         ↓
[Gõ và gửi]
```

**Cách 2: Swipe (Optional)**
```
[Swipe tin nhắn sang phải →]
         ↓
[Tin nhắn trượt, icon ↩️ hiện]
         ↓
[Thả tay]
         ↓
[Input hiển thị preview tin reply]
```

---

### Hiển Thị Tin Reply

#### Tin Reply Trong Chat

```
┌──────────────────────────────────────────────┐
│  👤 Huyền                          10:35     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌─ Trả lời Minh Anh ────────────────┐│  │
│  │  │ Đã kiểm tra xong 100 thùng hàng...││  │
│  │  └───────────────────────────────────┘│  │
│  │                                        │  │
│  │  Em đã ghi nhận rồi ạ. Cảm ơn anh!   │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Khung quote ở trên (background #FAFAFA)
- Border-left màu xanh (hoặc màu avatar người được reply)
- Hiển thị tên người được reply
- Nội dung quote rút gọn (max 2 dòng, ~100 ký tự)
- Nếu quá dài: "Đã kiểm tra xong 100 thùng hàng nhập k..."

---

#### Click Vào Quote → Jump To Message

```
[Click vào khung quote]
         ↓
[Kiểm tra: Tin gốc còn trong màn?]
         ↓
    ✅ Có (trong viewport hoặc đã load)
         ↓
         [Scroll smooth đến tin gốc]
         ↓
         [Highlight tin gốc trong 2s]
         ┌──────────────────────────────────────┐
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
         │  ▓ [Tin gốc được highlight]      ▓  │
         │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
         └──────────────────────────────────────┘

    ❌ Không (tin cũ chưa load)
         ↓
         [Gọi API load tin gốc]
         ↓
         [Loading...]
         ↓
         [Scroll đến tin gốc]
         ↓
         [Highlight]
```

---

#### Reply Tin Có File

```
┌──────────────────────────────────────────────┐
│  👤 Nam                            15:10     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌─ Trả lời Huyền ────────────────────┐│  │
│  │  │ 📄 Bao_cao_kho.xlsx (125 KB)      ││  │
│  │  └───────────────────────────────────┘│  │
│  │                                        │  │
│  │  File này đã được duyệt rồi nhé       │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

**Đặc điểm:**
- Hiển thị icon + tên file trong quote
- Click quote → Jump đến tin gốc có file

---

#### Reply Tin Đã Bị Xóa

```
┌──────────────────────────────────────────────┐
│  👤 Nam                            15:10     │
│  ┌────────────────────────────────────────┐  │
│  │  ┌─ Trả lời tin nhắn đã xóa ─────────┐│  │
│  │  │ [Tin nhắn này đã bị xóa]          ││  │
│  │  └───────────────────────────────────┘│  │
│  │                                        │  │
│  │  OK, đã hiểu rồi                      │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

---

### Hủy Reply

```
[Khi đang ở trạng thái reply (preview hiển thị)]
         ↓
Desktop:
  [Click icon [✕] ở góc phải preview]
  [Hoặc nhấn ESC]

Mobile:
  [Tap icon [✕] ở góc phải preview]
  [Hoặc swipe xuống preview để đóng]
         ↓
[Preview biến mất]
         ↓
[Input về trạng thái bình thường]
```

---

### Quyền Hạn

| Vai trò | Reply |
|---------|-------|
| **Staff** | ✅ Có |
| **Leader** | ✅ Có |
| **Admin** | ✅ Có |

**Tất cả người dùng đều có thể reply tin nhắn.**

---

## 📱 Khác Biệt Desktop vs Mobile

### Pin (Ghim)

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Ghim tin** | Hover → Click 📌 | Long-press → Tap "Ghim" |
| **Xem tin ghim** | Click "Xem ▼" → Expand in-place | Tap "Xem" → Bottom sheet / Màn riêng |
| **Bỏ ghim** | Click 📌 active → Confirm modal | Long-press → Tap "Bỏ ghim" → Confirm |
| **Jump to message** | Click "Xem tin gốc" → Scroll smooth | Tap "Xem tin gốc" → Scroll |

---

### Star (Đánh dấu)

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Đánh dấu** | Hover → Click ⭐ | Long-press → Tap "Đánh dấu" |
| **Xem danh sách** | Right Panel → Tab "Tin đánh dấu" | Profile → "Tin đã đánh dấu" → Màn riêng |
| **Bỏ đánh dấu** | Click ⭐ active | Long-press → Tap "Bỏ đánh dấu" |
| **Filter** | Dropdown trong panel | Tabs "Tất cả" / "Nhóm" |

---

### Reply (Trả lời)

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| **Reply** | Hover → Click ↩️ | Long-press → Tap "Trả lời" / Swipe phải |
| **Preview quote** | Hiển thị trên input | Hiển thị trên input |
| **Hủy reply** | Click [✕] hoặc ESC | Tap [✕] hoặc swipe xuống preview |
| **Jump to message** | Click quote → Scroll smooth | Tap quote → Scroll |
| **Highlight** | Background highlight 2s | Background highlight 2s |

---

## ✅ Checklist Kiểm Thử

### Pin (Ghim) - Chỉ Leader

- [ ] **Ghim tin nhắn**
  - Leader: Hover → Click 📌 → Tin được ghim
  - Staff: KHÔNG thấy icon 📌
  - Admin: Thấy và ghim được

- [ ] **Hiển thị tin ghim**
  - Khu vực "Tin đã ghim" hiển thị ở top
  - Số lượng tin ghim đúng: `(2)`
  - Click "Xem ▼" → Danh sách expand

- [ ] **Xem tin gốc**
  - Click "Xem tin gốc" → Scroll đến tin trong chat
  - Tin được highlight 2s

- [ ] **Bỏ ghim**
  - Click 📌 active → Xác nhận → Tin bị bỏ ghim
  - Biến mất khỏi danh sách ghim
  - Tất cả thành viên thấy tin đã bị bỏ ghim

- [ ] **Giới hạn số lượng**
  - Ghim tin thứ 6 → Hiển thị thông báo giới hạn
  - Bắt buộc bỏ ghim tin cũ trước

---

### Star (Đánh dấu) - Tất cả

- [ ] **Đánh dấu tin**
  - Hover/Long-press → Click ⭐ → Tin được đánh dấu
  - Icon ⭐ chuyển màu vàng (active)
  - Badge "Đã đánh dấu" chỉ mình thấy

- [ ] **Xem danh sách tin đã đánh dấu**
  - Desktop: Right Panel → Tab "Tin đánh dấu"
  - Mobile: Profile → "Tin đã đánh dấu"
  - Danh sách hiển thị đúng

- [ ] **Bỏ đánh dấu**
  - Click ⭐ active → Tin bị bỏ đánh dấu ngay
  - Biến mất khỏi danh sách

- [ ] **Cá nhân hóa**
  - User A đánh dấu → User B KHÔNG thấy
  - Mỗi user có danh sách star riêng

---

### Reply (Trả lời) - Tất cả

- [ ] **Reply tin nhắn**
  - Desktop: Hover → Click ↩️ → Preview hiện trong input
  - Mobile: Long-press → Tap "Trả lời" / Swipe phải → Preview hiện
  - Quote hiển thị đúng tên và nội dung

- [ ] **Gửi tin reply**
  - Gõ tin → Gửi → Tin reply hiển thị với quote ở trên
  - Border-left màu xanh
  - Nội dung quote rút gọn nếu quá dài

- [ ] **Jump to message**
  - Click quote → Scroll smooth đến tin gốc
  - Tin gốc highlight 2s
  - Nếu tin cũ chưa load → Load rồi scroll

- [ ] **Reply tin có file**
  - Quote hiển thị icon + tên file
  - Click quote → Jump đến tin gốc

- [ ] **Reply tin đã xóa**
  - Quote hiển thị "[Tin nhắn này đã bị xóa]"
  - Click quote → Không jump (hoặc thông báo)

- [ ] **Hủy reply**
  - Desktop: Click [✕] hoặc ESC → Preview biến mất
  - Mobile: Tap [✕] hoặc swipe xuống → Preview biến mất

---

### Mobile Specific

- [ ] **Long-press actions**
  - Long-press → Bottom sheet hiện đầy đủ actions
  - Tap action → Hoạt động đúng

- [ ] **Swipe to reply**
  - Swipe phải → Icon ↩️ hiện → Thả tay → Reply mode
  - Smooth animation

- [ ] **Bottom sheets**
  - Tin ghim: Tap "Xem" → Bottom sheet danh sách
  - Tin đánh dấu: Từ profile → Màn riêng full screen

---

## 🔗 Liên Kết Tài Liệu

- 📄 [01_TONG_QUAN_HE_THONG.md](./01_TONG_QUAN_HE_THONG.md) - Tổng quan hệ thống
- 📄 [03_DANG_NHAP.md](./03_DANG_NHAP.md) - Phân quyền Staff/Leader/Admin
- 📄 [05_NHAN_TIN.md](./05_NHAN_TIN.md) - Gửi và nhận tin nhắn
- 📄 [13_THEO_DOI_TEAM.md](./13_THEO_DOI_TEAM.md) - Tính năng Leader
- 📄 [18_DESKTOP_VS_MOBILE.md](./18_DESKTOP_VS_MOBILE.md) - So sánh Desktop và Mobile

---

**Phiên bản:** 2.0 (Unified)
**Ngày cập nhật:** 27/01/2026
**Trạng thái:** ✅ Hoàn thành
