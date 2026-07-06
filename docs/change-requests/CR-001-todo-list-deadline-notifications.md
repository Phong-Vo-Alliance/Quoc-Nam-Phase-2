# CR-001 — Thêm thời gian & nhắc việc cho "Danh sách việc cần làm"

| Trường | Giá trị |
|--------|---------|
| **Mã CR** | CR-001 |
| **Tên chức năng** | Danh sách việc cần làm (Todo List) — Tools menu |
| **Loại thay đổi** | Mở rộng tính năng (Feature Enhancement) |
| **Trạng thái** | Phân tích — chờ BA & khách hàng phê duyệt |
| **Ngày tạo** | 2026-06-03 |
| **Phạm vi** | Web (Desktop) + Mobile (Responsive) |
| **Branch** | `feature/CR-001` |

---

## Mục lục

1. [Tóm tắt](#1-tóm-tắt)
2. [Yêu cầu từ khách hàng](#2-yêu-cầu-từ-khách-hàng)
3. [Câu hỏi đã được làm rõ](#3-câu-hỏi-đã-được-làm-rõ)
4. [Phân tích hiện trạng](#4-phân-tích-hiện-trạng)
5. [Đề xuất Data Model](#5-đề-xuất-data-model)
6. [Thiết kế UI/UX](#6-thiết-kế-uiux)
7. [Luồng xử lý chính](#7-luồng-xử-lý-chính)
8. [Bảng tổng hợp indicator theo tình huống](#8-bảng-tổng-hợp-indicator-theo-tình-huống)
9. [API Contract đề xuất](#9-api-contract-đề-xuất)
10. [SignalR Event đề xuất](#10-signalr-event-đề-xuất)
11. [Quy tắc & Logic nghiệp vụ](#11-quy-tắc--logic-nghiệp-vụ)
12. [Cross-platform — Desktop & Mobile](#12-cross-platform--desktop--mobile)
13. [Edge cases & xử lý đặc biệt](#13-edge-cases--xử-lý-đặc-biệt)
14. [Phân kỳ triển khai](#14-phân-kỳ-triển-khai)
15. [Open questions](#15-open-questions)

---

## 1. Tóm tắt

Chức năng **"Danh sách việc cần làm"** hiện chỉ hỗ trợ ghi chú tự do (title + description) mà không có thời gian/deadline. CR-001 mở rộng để:

- Cho phép user **đặt thời gian (deadline)** cho mỗi item.
- **Thông báo (notify) đúng giờ** đã đặt, hỗ trợ **action "Hoàn thành"** ngay trên thông báo.
- **Cảnh báo trực quan** (đỏ + animation) khi có việc quá hạn:
  - Trên icon Cờ lê (Tools) ngoài sidebar.
  - Trên item "Danh sách việc cần làm" trong submenu.
  - Trên từng dòng việc quá hạn trong dialog.
- Có **banner thông báo "đến hạn"** khi app vừa mở, tương tự thông báo tin nhắn mới.
- Hỗ trợ **chế độ Do Not Disturb (DND)** cho user không muốn bị làm phiền.
- Hỗ trợ **âm thanh** khi có thông báo.
- **Đồng bộ** trên cả Desktop (Web) và Mobile (Responsive).

> **Bản chất:** Đây là **self-reminder** (ghi chú cho chính mình) — không phải nhắc việc giữa các user. Không có concept "ai nhắc ai".

---

## 2. Yêu cầu từ khách hàng

| # | Yêu cầu |
|---|---------|
| R1 | Bổ sung khả năng đặt thời gian (deadline) cho mỗi công việc trong danh sách |
| R2 | Gửi thông báo rõ ràng đúng thời điểm đã được thiết lập cho công việc |
| R3 | Thông báo phải cho phép thao tác trực tiếp để đánh dấu hoàn thành công việc mà không cần mở chức năng |
| R4 | Các công việc đã quá hạn phải được làm nổi bật trực quan (highlight đỏ) trong danh sách |
| R5 | Hiển thị chấm tròn cảnh báo có animation trên icon Công cụ (cờ lê) ngoài sidebar, kèm chấm tròn tĩnh trên mục "Danh sách việc cần làm" trong submenu Công cụ |
| R6 | Đây là chức năng tự ghi chú nhắc việc cho bản thân (self-reminder) — không phải tính năng nhắc việc giữa các người dùng |
| R7 | Khi ứng dụng được mở, nếu có công việc đến hạn — hiển thị thông báo ở bên ngoài Công cụ tương tự cơ chế thông báo tin nhắn mới |
| R8 | Các công việc quá hạn được làm nổi bật bằng màu đỏ ngay trong dialog danh sách |
| R9 | Chức năng phải hoạt động đồng nhất trên cả nền tảng Mobile và Web |

---

## 3. Câu hỏi đã được làm rõ

| # | Câu hỏi | Trả lời từ khách hàng | Ảnh hưởng thiết kế |
|---|---------|------------------------|---------------------|
| Q1 | Cold-start banner — show mỗi lần mở app hay 1 lần/ngày? | **Show mỗi lần mở app**. Khách hàng không sợ phiền, cần biết còn việc chưa hoàn thành. | Bắn banner ngay sau khi app khởi động + có item overdue. Không dùng cờ "đã show hôm nay". |
| Q2 | Có cần Do Not Disturb mode khi user đang tập trung? | **Có cần DND mode** để hỗ trợ user không muốn bị làm phiền. | Thêm toggle DND. Khi bật DND, tắt toast/sound/browser notification — nhưng vẫn giữ chấm đỏ passive trên icon. |
| Q3 | Có cần sound khi toast bắn không? | **Có, nếu hỗ trợ được**. User tự tắt sound trên trình duyệt nếu thấy không cần. | Phát âm thanh nhẹ khi có thông báo. Tôn trọng DND. |
| Q4 | Số lượng tối đa item gom vào 1 toast — 3? 5? Hay gom hết? | **Luôn gom hết.** | Không giới hạn số lượng. Toast hiển thị tổng số (vd: "Bạn có 8 việc đến hạn"). |

---

## 4. Phân tích hiện trạng

### 4.1. Cấu trúc chức năng hiện tại

| Lớp | File / Vị trí |
|-----|----------------|
| Type definitions | `src/types/todo.ts` |
| API client | `src/api/todo.api.ts` |
| Query hooks | `src/hooks/queries/useTodoItems.ts` |
| Mutation hooks | `src/hooks/mutations/useTodoItemMutations.ts` |
| UI Desktop | `src/features/portal/components/TodoListManager.tsx` |
| UI Mobile | `src/features/portal/components/TodoListManagerMobile.tsx` |
| Sidebar (Tools popover) | `src/features/portal/components/MainSidebar.tsx` |

### 4.2. Data Model hiện tại

```typescript
interface TodoItem {
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 4.3. API endpoints hiện tại

| Method | Endpoint | Mục đích |
|--------|----------|----------|
| `GET` | `/api/todo-items?isDone=false` | Lấy việc chưa hoàn thành |
| `GET` | `/api/todo-items/done-today` | Lấy việc đã hoàn thành hôm nay |
| `POST` | `/api/todo-items` | Tạo mới |
| `PUT` | `/api/todo-items/{id}` | Cập nhật |
| `DELETE` | `/api/todo-items/{id}` | Xóa |

### 4.4. Các banner đang có trong khung chat chính

Khu vực đầu khung chat chính giữa **đã có 2 lớp banner** scoped theo conversation:

```
ChatHeader
├─ TaskBanner    (amber, status: chưa xử lý / đang làm — gắn với conversation)
├─ PinBar        (gray, tin nhắn ghim — gắn với conversation)
├─ OfflineBanner (đỏ, khi mất mạng)
└─ Message List
```

→ **Kết luận:** Todo notification là **global / per-user**, không thuộc context của conversation. **Không nên** chèn thêm banner thứ 3 vào header chat. Sẽ dùng kênh khác (xem mục 6.4).

---

## 5. Đề xuất Data Model

### 5.1. Thay đổi `TodoItem`

```typescript
interface TodoItem {
  // Field hiện tại — giữ nguyên
  id: string;
  title: string;
  description?: string;
  isCompleted: boolean;
  completedAt?: string;
  createdAt: string;
  updatedAt?: string;

  // ✨ Thêm mới
  dueAt?: string;          // ISO datetime, optional — thời điểm đến hạn
  remindedAt?: string;     // ISO datetime — đánh dấu đã noti, tránh noti lặp
  snoozedUntil?: string;   // ISO datetime — nếu user đã bấm "Hoãn"
}
```

### 5.2. Trạng thái dẫn xuất (computed ở frontend, không lưu DB)

| Trạng thái | Điều kiện | Visual |
|-----------|----------|--------|
| `none` | `!dueAt` | Không hiển thị thời gian |
| `upcoming` | `dueAt - now > 1h` | Xám / xanh nhạt |
| `dueSoon` | `0 < dueAt - now ≤ 1h` | Cam |
| `due` | `|dueAt - now| ≤ 1 phút` | Vàng / nền vàng nhạt |
| `overdue` | `dueAt < now` | **Đỏ — viền đỏ + nền đỏ nhạt** |

### 5.3. User preference (mới — phục vụ DND)

```typescript
interface UserNotificationPreference {
  todoDndEnabled: boolean;              // true = đang trong DND mode
  todoSoundEnabled: boolean;            // mặc định true
}
```

Lưu local (`localStorage`) hoặc đồng bộ qua API tùy quyết định backend. **Đề xuất:** đồng bộ qua API để DND áp dụng đa thiết bị.

---

## 6. Thiết kế UI/UX

### 6.1. Form thêm/sửa todo — thêm Time Picker

#### Desktop

```
┌───────────────────────────────────────┐
│ Tiêu đề * ......................... │
│ Mô tả ............................... │
│                                       │
│ ⏰ Đặt nhắc nhở   [Thêm ▼]            │  ← click để mở
│   ├─ Quick:                           │
│   │   [Sau 30p] [Hôm nay 17:00]       │
│   │   [Ngày mai 9:00]                 │
│   └─ Tùy chỉnh:                       │
│       📅 [Chọn ngày] 🕐 [HH:mm]       │
│                                       │
│ [Hủy]                       [Lưu]    │
└───────────────────────────────────────┘
```

#### Mobile

- Dùng native `<input type="datetime-local">` — UX tốt hơn picker tự build.
- Phía trên input vẫn có chip preset: `Sau 30p` / `Hôm nay 17:00` / `Ngày mai 9:00`.

#### Quy tắc

- `dueAt` là **trường tùy chọn** — nhiều note nhanh không cần deadline, không ép buộc.
- Cho phép đặt thời gian trong quá khứ (note ngược lại), kèm cảnh báo nhỏ.
- Khi user **sửa** `dueAt` → reset `remindedAt = null` để noti lại lần sau.

---

### 6.2. Hiển thị item trong list (visual states)

```
○ Gọi cho khách hàng A
  ⏰ Còn 2 giờ                                  ← upcoming (xám)

○ Gửi báo cáo tuần
  ⏰ Còn 15 phút                                ← dueSoon (cam)

○ Họp team             🔔                       ← due (vàng, nền vàng nhạt)
  ⏰ Đến hạn ngay bây giờ

⊗ Trả lời email khẩn                            ← OVERDUE
  ⚠ Quá hạn 3 giờ                               ← VIỀN ĐỎ, nền đỏ nhạt, chữ đỏ
```

#### Thứ tự sắp xếp (Active list)

1. **Overdue** — cũ nhất lên đầu (đỏ nhất)
2. **Due / Due soon**
3. **Upcoming** — gần nhất trước
4. **Không có deadline** — theo `createdAt`

#### Hiển thị thời gian

- **Mặc định:** dạng tương đối — "Còn 2 giờ", "Quá hạn 30 phút"
- **Hover (desktop) / Long press (mobile):** hiển thị tuyệt đối — "17:30 hôm nay", "08:00 25/06/2026"

---

### 6.3. Indicator ở Sidebar

**Quy tắc (đã cập nhật theo phản hồi):**
- **Mặc định không hiển thị** chấm đỏ.
- **Chỉ hiển thị** khi có **≥1 item đến hạn HOẶC quá hạn**.
- **Không hiển thị số đếm**, không hiển thị badge số.
- Chỉ là **chấm đỏ + pulse animation**.

#### Cấp độ chấm đỏ

| Vị trí | Khi nào hiện | Hiển thị |
|--------|--------------|----------|
| Icon Cờ lê 🔧 (sidebar) | Có ≥1 item due/overdue | Chấm đỏ + **pulse animation** |
| Item "Danh sách việc cần làm" trong popover Tools | Có ≥1 item due/overdue | Chấm đỏ tĩnh (không pulse) |

#### Vòng đời pulse animation

- **Bật pulse:** Khi có item mới vừa đến hạn (trong vòng 5 phút gần nhất) hoặc khi cold-start có item overdue.
- **Tắt pulse, giữ chấm tĩnh:** Khi user mở dialog Todo (đã thấy).
- **Tắt hoàn toàn:** Khi không còn item due/overdue (user đã done hoặc snooze hết).

```
Trạng thái        Wrench icon      Submenu item
─────────────────────────────────────────────
Không có due      🔧 (bình thường)   📋 (bình thường)
Có due/overdue    🔧🔴 (pulse)        📋🔴 (tĩnh)
User vừa mở       🔧🔴 (tĩnh)         📋🔴 (tĩnh)
Done/snooze hết   🔧 (bình thường)   📋 (bình thường)
```

---

### 6.4. Chiến lược Notification — 3 kênh phân tầng

#### 6.4.1. Vì sao KHÔNG đặt banner trong header chat

Header chat hiện đã có:

```
ChatHeader
├─ TaskBanner    (context: conversation/category)
├─ PinBar        (context: conversation)
└─ OfflineBanner
```

Nếu thêm "Todo Banner" vào đây sẽ gây:

1. **Mixing concerns** — TaskBanner/PinBar là per-conversation, TodoBanner là per-user → đặt cạnh nhau gây hiểu nhầm.
2. **Mỗi conversation đều thấy lặp** — không hợp lý cho thông tin cá nhân.
3. **Stack 3 banner** đẩy message area xuống — đặc biệt khó chịu trên mobile.

→ **Quyết định:** Dùng **kênh global** thay vì chèn banner vào header chat.

#### 6.4.2. Mô hình 3 kênh phân tầng

```
┌─────────────────────────────────────────────────────────────┐
│  Kênh 1 — PASSIVE (luôn hiện khi có)                        │
│  • Chấm đỏ + pulse trên 🔧 sidebar                          │
│  • Chấm đỏ trên submenu "Danh sách việc cần làm"            │
│  → Không xâm lấn, user tự để ý                              │
└─────────────────────────────────────────────────────────────┘
              ↓ (nâng cấp khi sự kiện xảy ra)
┌─────────────────────────────────────────────────────────────┐
│  Kênh 2 — ACTIVE (toast tại thời điểm đến hạn / cold-start)│
│  • Sonner toast top-center (đã có sẵn trong app)            │
│  • Có action button "Hoàn thành" / "Hoãn"                   │
│  • Browser Notification API song song nếu app không focus   │
│  • Sound nhẹ (có thể tắt qua DND)                           │
│  → Giống "tin nhắn mới" như khách hàng mô tả               │
└─────────────────────────────────────────────────────────────┘
              ↓ (xem chi tiết)
┌─────────────────────────────────────────────────────────────┐
│  Kênh 3 — ON DEMAND (mở dialog chính)                       │
│  • Click 🔧 → Tools popover → "Danh sách việc cần làm"      │
│  • Click toast → mở dialog                                  │
│  • Items overdue được scroll-into-view và highlight đỏ      │
└─────────────────────────────────────────────────────────────┘
```

#### 6.4.3. Kênh 2 — Sonner Toast (chính)

**Vì sao chọn Sonner:**
- Đã có sẵn trong `App.tsx` với position `top-center`, `richColors`.
- Auto-dismiss → không gây bí UI vĩnh viễn.
- Hỗ trợ custom action button → đáp ứng yêu cầu "action để done việc".
- Responsive đồng nhất Desktop + Mobile.
- Không thêm dependency.

##### Mock toast — Realtime "Đến hạn"

```
┌──────────────────────────────────────────┐
│ 🔔 Đến hạn: Gọi khách hàng A             │
│ Đến hạn ngay bây giờ                     │
│ [✓ Hoàn thành]  [⏰ Hoãn ▼]           ✕  │
└──────────────────────────────────────────┘
                     ↓ (click mở dropdown)
                ┌──────────────────────┐
                │ Hoãn 5 phút          │
                │ Hoãn 10 phút  (mặc định) │
                │ Hoãn 30 phút         │
                │ Hoãn 1 giờ           │
                │ ──────────────────── │
                │ 📅 Đặt giờ khác...   │  ← mở time picker
                └──────────────────────┘
   ▸ Auto-dismiss: 10s (sticky nếu là overdue thực sự)
   ▸ Click body toast → mở dialog Todo & scroll/focus item
   ▸ Click "Đặt giờ khác..." → mở mini time picker để chọn giờ mới hoàn toàn
```

> **Lưu ý quan trọng:** User có thể **đặt lại giờ nhắc hoàn toàn mới** ngay từ toast — không bị giới hạn ở mức "hoãn 10 phút cứng". Xem chi tiết ở [Flow D](#flow-d--user-hoãn-hoặc-đặt-lại-giờ-nhắc-mới).

##### Mock toast — Cold-start (mỗi lần mở app, có overdue/due)

```
┌──────────────────────────────────────────┐
│ ⚠ Bạn có 8 việc cần xử lý                │
│   (5 quá hạn, 3 đến hạn)                 │
│                    [Xem ngay →]      ✕   │
└──────────────────────────────────────────┘
   ▸ Show MỖI LẦN mở app (theo Q1)
   ▸ Luôn gom HẾT items (theo Q4)
   ▸ Auto-dismiss: 15s
```

#### 6.4.4. Quy tắc bắn toast (anti-spam)

| Tình huống | Hành vi |
|-----------|--------|
| 1 item vừa đến hạn (realtime) | 1 toast riêng, có action |
| Nhiều item đến hạn cùng lúc (gom theo cửa sổ 30s) | 1 toast tổng: "Có N việc đến hạn", không action (click → mở dialog) |
| Cold-start có overdue/due | 1 toast tổng hợp (theo Q1 — show mỗi lần) |
| Item đã noti trong session | Không bắn lại — track qua `Set<id>` trong memory |
| User đang mở dialog Todo | **Tắt toast** — đã thấy trong list rồi |
| User đang bật **DND mode** | **Không bắn toast, không sound, không browser noti** — chỉ giữ chấm đỏ passive |

#### 6.4.5. Kênh 2 bổ trợ — Browser Notification API

- Bắn song song với Sonner toast khi tab **không focus** (`document.visibilityState !== 'visible'`).
- Yêu cầu permission — tận dụng `NotificationPermissionBanner` đã có.
- **Phase 1:** Foreground notification, **không action button** (đơn giản).
- **Phase 2:** Service Worker + Push API, hỗ trợ action button kể cả khi tab đóng.

---

### 6.5. Do Not Disturb (DND) Mode

#### 6.5.1. UX

##### Toggle DND

- **Vị trí:** Header dialog Todo List (icon 🔕/🔔) + Settings.
- **Trạng thái:**
  - 🔔 (mặc định): Nhận đầy đủ thông báo.
  - 🔕 (DND on): Tắt toast/sound/browser noti.

##### Khi bật DND

```
DND ON:
  ❌ Sonner toast  → KHÔNG bắn
  ❌ Sound         → KHÔNG phát
  ❌ Browser noti  → KHÔNG bắn
  ✅ Chấm đỏ 🔧    → VẪN cập nhật (passive)
  ✅ Dialog        → VẪN hiển thị overdue đỏ bình thường
```

→ DND không che giấu thông tin — chỉ tắt **tiếng động** và **popup**. User vẫn biết qua chấm đỏ.

#### 6.5.2. Hiển thị trạng thái DND

```
┌─ Header Dialog ─────────────────────────┐
│ 📋 Danh sách việc cần làm        🔕 (DND)│  ← icon DND visible
└──────────────────────────────────────────┘
```

Tooltip khi hover: "Đang ở chế độ Không làm phiền — Bấm để tắt".

#### 6.5.3. Tùy chọn nâng cao (đề xuất Phase 2)

- **Auto DND theo lịch:** "Tắt thông báo từ 22:00 - 07:00".
- **DND theo thời gian ngắn:** Bật DND 1h / 4h / Đến cuối ngày → tự bật lại.

---

### 6.6. Sound notification

#### 6.6.1. Cơ chế

- Phát một âm thanh ngắn (~0.5s) khi:
  - Realtime: item đến hạn.
  - Cold-start: phát 1 lần (không lặp).
- Dùng `new Audio('/sounds/todo-due.mp3').play()`.
- File âm thanh: nhẹ nhàng, ngắn — không gây giật mình.

#### 6.6.2. Tôn trọng cấu hình

| Điều kiện | Có phát sound? |
|-----------|----------------|
| DND mode ON | Không |
| User đang mở dialog Todo | Không |
| Tab không focus + có permission browser | Có (qua browser noti) |
| Bình thường | Có |

#### 6.6.3. Toggle Sound (tùy chọn)

- Thêm icon 🔊/🔇 trong header dialog Todo (riêng với DND).
- Hoặc giữ đơn giản: user tự mute tab trình duyệt nếu không cần (theo phản hồi Q3).

---

## 7. Luồng xử lý chính

Section này được chia làm 2 phần:
- **7.1. Luồng nghiệp vụ** — mô tả trải nghiệm thực tế của người dùng, **không có thuật ngữ kỹ thuật**. Dành cho BA và khách hàng review.
- **7.2. Luồng kỹ thuật** — mô tả chi tiết tương tác giữa frontend / backend / API / SignalR. Dành cho đội phát triển.

---

### 7.1. Luồng nghiệp vụ — góc nhìn người dùng

#### A. Tạo công việc có thời gian nhắc

**Tình huống:** Người dùng muốn ghi nhớ một công việc cần làm vào thời điểm cụ thể (ví dụ: gọi khách hàng lúc 17:30).

**Trải nghiệm:**
1. Mở **Công cụ** (🔧) ở sidebar → chọn **"Danh sách việc cần làm"**
2. Nhấn nút **"+ Thêm công việc mới"**
3. Nhập tiêu đề (bắt buộc) và mô tả (tùy chọn)
4. Nhấn **"⏰ Đặt nhắc nhở"**, chọn một trong hai cách:
   - **Preset nhanh:** "Sau 30 phút", "Hôm nay 17:00", "Ngày mai 9:00"
   - **Tự chọn:** ngày & giờ cụ thể
5. Nhấn **"Lưu"**

**Kết quả:** Công việc xuất hiện trong danh sách, hiển thị thời gian còn lại đến hạn (ví dụ: "Còn 2 giờ"). Hệ thống sẽ tự động nhắc đúng thời điểm.

---

#### B. Đến giờ nhắc việc

**Tình huống:** Đã đến đúng thời điểm đã đặt cho một công việc.

**Người dùng thấy gì:**
1. 🔔 Một thông báo xuất hiện ở giữa-trên màn hình (tương tự thông báo tin nhắn mới):
   > **Đến hạn: [tên công việc]**
2. 🔊 Có âm thanh nhẹ phát ra (trừ khi đang ở chế độ Không làm phiền)
3. 🔴 Chấm đỏ với hiệu ứng nhấp nháy xuất hiện trên icon **Công cụ** ngoài sidebar
4. Nếu ứng dụng đang ở tab khác / cửa sổ khác → có thêm thông báo của trình duyệt (hệ điều hành)

**Trong thông báo có 2 nút:**
- ✓ **Hoàn thành** — đánh dấu xong ngay
- ⏰ **Hoãn ▼** — mở dropdown để chọn lùi giờ hoặc đặt lại giờ khác

**Người dùng có thể:**
- Bỏ qua → thông báo tự đóng sau 10 giây (chấm đỏ vẫn còn)
- Nhấn nút trong thông báo (xem luồng C, D bên dưới)
- Bấm vào nội dung thông báo → mở Danh sách việc cần làm để xem chi tiết

---

#### C. Hoàn thành việc ngay từ thông báo

**Tình huống:** Người dùng muốn đánh dấu việc đã xong ngay khi nhận thông báo, không cần mở chức năng.

**Trải nghiệm:**
1. Khi thông báo nhắc việc xuất hiện
2. Nhấn nút **"✓ Hoàn thành"** ngay trên thông báo
3. Thông báo tự đóng
4. Việc được tự động chuyển sang mục **"Đã hoàn thành hôm nay"**
5. Nếu đã xử lý hết các việc đến/quá hạn → chấm đỏ trên icon **Công cụ** tự tắt

---

#### D. Hoãn hoặc đặt lại giờ nhắc

**Tình huống:** Người dùng nhận được thông báo nhưng chưa thể xử lý việc ngay. Có 2 lựa chọn:

##### D.1. Hoãn nhanh — *"Tôi sẽ làm trong vài phút nữa"*

1. Trên thông báo nhắc việc, nhấn **"⏰ Hoãn ▼"**
2. Dropdown hiện ra với các tùy chọn: **5 phút / 10 phút / 30 phút / 1 giờ**
3. Chọn thời lượng muốn hoãn (ví dụ: "10 phút")
4. Thông báo đóng — hệ thống sẽ nhắc lại sau đúng thời lượng đã chọn

> **Lưu ý:** Công việc này vẫn được coi là "quá hạn" so với thời gian gốc đã đặt ban đầu.

##### D.2. Đặt lại giờ nhắc hoàn toàn — *"Tôi cần dời hẳn việc sang lúc khác"*

1. Trên thông báo, nhấn **"⏰ Hoãn ▼"** → chọn **"📅 Đặt giờ khác..."**
2. Một bộ chọn thời gian nhỏ hiện ra với:
   - **Preset nhanh:** "Sau 2 giờ", "Cuối giờ làm", "Ngày mai 9:00"
   - **Tự chọn:** ngày & giờ cụ thể
3. Chọn giờ mới → xác nhận
4. Thông báo đóng — việc được cập nhật thời gian mới

> **Kết quả:** Nếu giờ mới ở tương lai → việc **không còn được coi là quá hạn**. Hệ thống sẽ nhắc lại đầy đủ ở thời điểm mới.

---

#### E. Mở ứng dụng — kiểm tra việc còn dang dở

**Tình huống:** Người dùng vừa mở ứng dụng, có thể đã có việc quá hạn từ trước.

**Trải nghiệm:**
1. Ứng dụng vừa khởi động xong
2. Nếu có công việc quá hạn hoặc đang đến hạn — một thông báo tổng hợp xuất hiện ở giữa-trên màn hình:
   > **⚠ Bạn có 8 việc cần xử lý** (5 quá hạn, 3 đến hạn)
   > **[Xem ngay →]**
3. 🔊 Âm thanh nhẹ phát ra (nếu không bật Không làm phiền)
4. 🔴 Chấm đỏ nhấp nháy xuất hiện trên icon **Công cụ**

> **Quan trọng:** Thông báo này hiển thị **mỗi lần** mở ứng dụng (theo yêu cầu khách hàng) — đảm bảo người dùng không bỏ sót việc đã hẹn.

**Người dùng có thể:**
- Bấm **"Xem ngay →"** → mở thẳng Danh sách việc cần làm
- Bỏ qua → thông báo tự đóng sau 15 giây, nhưng chấm đỏ vẫn còn để nhắc

---

#### F. Mở danh sách để xem & xử lý

**Tình huống:** Người dùng muốn xem toàn bộ danh sách hoặc tương tác với một việc cụ thể.

**Trải nghiệm:**
1. Người dùng thấy chấm đỏ trên icon **Công cụ** → biết đang có việc cần chú ý
2. Bấm icon **Công cụ** (🔧) → popover hiện ra (mục "Danh sách việc cần làm" cũng có chấm đỏ)
3. Bấm **"Danh sách việc cần làm"**
4. Dialog mở ra với cấu trúc:
   - **Khu vực thêm mới** — phía trên
   - **Danh sách việc cần làm** — sắp xếp theo thứ tự ưu tiên:
     - 🔴 **Quá hạn** (đỏ — cũ nhất ở trên)
     - 🟡 **Đang đến hạn / sắp đến hạn**
     - ⚪ **Còn xa hạn**
     - ⚫ **Không có hạn**
   - ✅ **Đã hoàn thành hôm nay** — phần thu gọn ở dưới
5. Dialog tự cuộn xuống phần "Quá hạn" nếu có
6. Chấm đỏ nhấp nháy trên icon **Công cụ** chuyển sang chấm đỏ tĩnh (đã thấy)

---

#### G. Bật/tắt chế độ Không làm phiền (DND)

**Tình huống:** Người dùng đang trong cuộc họp / cần tập trung, không muốn bị làm phiền bởi thông báo.

**Trải nghiệm:**
1. Mở dialog **"Danh sách việc cần làm"**
2. Ở góc trên-phải dialog có icon chuông 🔔 (mặc định = bật thông báo)
3. Bấm vào icon → chuyển thành 🔕 (Không làm phiền)
4. Một thông báo xác nhận hiện ra: *"Đã bật chế độ Không làm phiền"*

**Khi chế độ Không làm phiền bật:**

| Kênh thông báo | Có hoạt động không? |
|----------------|----------------------|
| Thông báo popup | ❌ Tắt |
| Âm thanh | ❌ Tắt |
| Thông báo trình duyệt / hệ điều hành | ❌ Tắt |
| Chấm đỏ trên icon Công cụ | ✅ **Vẫn hiển thị** |
| Highlight đỏ trong dialog | ✅ **Vẫn hiển thị** |

> **Triết lý:** DND chỉ tắt **tiếng động và popup** — không tắt thông tin. Người dùng vẫn biết có việc cần xử lý qua chấm đỏ thầm lặng.

**Để tắt DND:** Bấm lại icon 🔕 → chuyển về 🔔.

**Đồng bộ đa thiết bị:** Trạng thái DND được lưu trên server — nếu bật trên mobile, web cũng sẽ ở trạng thái DND và ngược lại.

---

#### H. Sửa thông tin của một việc đã tạo

**Tình huống:** Người dùng muốn thay đổi tiêu đề, mô tả hoặc thời gian nhắc của một việc đã tạo trước đó (mà không cần đợi đến giờ nhắc).

**Trải nghiệm:**
1. Mở **Danh sách việc cần làm**
2. Bấm vào việc muốn sửa trong danh sách
3. Form chỉnh sửa hiện ra với thông tin hiện tại
4. Thay đổi nội dung tùy ý:
   - Tiêu đề / mô tả
   - Thời gian nhắc (giờ deadline)
   - Hoặc bỏ hoàn toàn thời gian nhắc nếu không cần nữa
5. Nhấn **"Lưu"**

**Kết quả:**
- Việc được cập nhật ngay
- Nếu đổi thời gian → hệ thống nhắc đúng thời điểm mới
- Nếu việc trước đó đã quá hạn nhưng giờ mới ở tương lai → không còn highlight đỏ
- Nếu xóa thời gian nhắc → việc trở thành ghi chú không hạn (không tự nhắc)

---

### 7.2. Luồng kỹ thuật — dành cho đội phát triển

#### Flow A — Tạo todo có deadline

```
[+ Thêm việc]
   ↓
Nhập title + (optional) description
   ↓
Bấm ⏰ Đặt nhắc nhở → chọn time (quick preset hoặc custom)
   ↓
POST /api/todo-items { title, description, dueAt }
   ↓
Backend:
  • Lưu DB
  • Schedule notification job (in-process scheduler hoặc message queue)
Frontend:
  • Schedule setTimeout cho session hiện tại
  • React Query invalidate → list refresh
```

#### Flow B — Đến giờ nhắc (app đang mở)

```
Timer fire (frontend) HOẶC SignalR push (backend)
   ↓
Kiểm tra:
  • DND OFF?
  • Item chưa done?
  • Item chưa noti (remindedAt null hoặc cũ)?
   ↓ (YES tất cả)
1. Bắn Sonner toast (top-center)
2. Phát sound (nếu không DND)
3. Bắn Browser Notification (nếu app không focus + có permission)
4. Cập nhật chấm đỏ + pulse trên 🔧
5. Nếu dialog đang mở → highlight item + scroll-into-view
6. Backend: cập nhật remindedAt = now (qua SignalR ack hoặc API call)
```

#### Flow C — User bấm "Hoàn thành" từ toast

```
Click action "Hoàn thành" trên toast
   ↓
PUT /api/todo-items/{id} { isDone: true }
   ↓
Toast đóng
React Query invalidate todoItems
Item rơi xuống section "Đã hoàn thành hôm nay"
Recompute → có thể tắt chấm đỏ trên 🔧
```

#### Flow D — User hoãn hoặc đặt lại giờ nhắc mới

User có **2 hướng** xử lý khi không muốn complete ngay:

##### D.1. Quick Snooze (preset)

```
Click [⏰ Hoãn ▼] → chọn preset (5p / 10p / 30p / 1h)
   ↓
PUT /api/todo-items/{id} { snoozedUntil: now + Xp }
   ↓
Toast đóng
Reschedule notification (frontend + backend)
Item VẪN trong list active (không đổi status done)
Item hiển thị: "Đã hoãn — sẽ nhắc lại lúc HH:mm"
```

> Phân biệt: `snoozedUntil` là **trì hoãn lần nhắc tiếp theo**, KHÔNG thay đổi `dueAt`. Item vẫn được coi là overdue so với deadline gốc.

##### D.2. Đặt lại giờ nhắc hoàn toàn (Reschedule)

```
Click [⏰ Hoãn ▼] → "📅 Đặt giờ khác..."
   ↓
Hiện mini time picker (overlay nhỏ ngay tại toast):
   • Quick: [Sau 2h] [Cuối giờ làm] [Ngày mai 9:00]
   • Custom: 📅 Date + 🕐 Time
   ↓
User chọn giờ mới & xác nhận
   ↓
PUT /api/todo-items/{id} { dueAt: newTime }
   ↓
Backend:
  • Update dueAt = newTime
  • RESET remindedAt = null (để được noti lại lần sau)
  • Cancel job cũ → schedule job mới
Frontend:
  • Toast đóng
  • Cancel setTimeout cũ → schedule mới
  • Item hiển thị deadline mới (không còn overdue nếu giờ mới ở tương lai)
```

> **Bản chất:** Trường hợp D.2 = giống Flow H (edit dueAt) nhưng truy cập **nhanh** từ chính toast nhắc, không cần mở dialog. UX này phù hợp khi user muốn dời hẳn deadline (vd: hoãn từ "hôm nay" sang "tuần sau").

##### D.3. Phân biệt Snooze vs Reschedule

| Khía cạnh | Snooze (D.1) | Reschedule (D.2) |
|----------|--------------|------------------|
| Field thay đổi | `snoozedUntil` | `dueAt` |
| `dueAt` gốc | Giữ nguyên | Bị ghi đè |
| Lịch sử overdue | Vẫn tính là overdue so với `dueAt` gốc | Reset — coi như deadline mới |
| Số lần được noti | Vẫn 1 lần (lần snooze tới) | Có thể noti lại đầy đủ ở `dueAt` mới |
| Khi nào dùng | "Tôi sẽ làm trong vài phút" | "Tôi cần dời hẳn việc này sang lúc khác" |
| Quick access từ toast | ✅ 1 click | ✅ 2 click qua "Đặt giờ khác..." |

#### Flow E — Cold-start (mở app mới)

```
App load
   ↓
Fetch todos (active + done-today)
   ↓
Tính: overdueCount + dueNowCount
   ↓
Nếu (overdueCount + dueNowCount) > 0:
  → Bắn 1 toast cold-start: "Bạn có N việc cần xử lý"
  → Bật chấm đỏ + pulse trên 🔧
  → (Nếu DND off) phát sound nhẹ
   ↓
Theo Q1: bắn MỖI LẦN mở app, không có flag "đã show hôm nay"
```

#### Flow F — User mở dialog

```
Click 🔧 → popover Tools
   ↓ (item "Danh sách việc cần làm" có chấm đỏ → nổi bật)
Click "Danh sách việc cần làm"
   ↓
Dialog mở:
  • Tự động scroll tới section overdue (nếu có)
  • Items overdue highlight đỏ
  • Section "Quá hạn" hiển thị badge số: "3 quá hạn"
   ↓
Pulse animation trên 🔧 → chuyển sang tĩnh (user đã thấy)
```

#### Flow G — User toggle DND

```
Click icon 🔔 trong header dialog
   ↓
Toggle: 🔔 ↔ 🔕
   ↓
PUT /api/user/preferences { todoDndEnabled: true/false }
   ↓
Lưu localStorage (đồng bộ ngay) + đồng bộ multi-device qua API
   ↓
Toast confirm: "Đã bật chế độ Không làm phiền"
```

#### Flow H — Edit item đã có deadline (từ dialog)

```
User mở dialog Todo → click vào item để edit → đổi dueAt
   ↓
PUT /api/todo-items/{id} { dueAt: newTime }
Backend:
  • Update dueAt
  • RESET remindedAt = null (để noti lại)
  • Reschedule job
Frontend:
  • Cancel setTimeout cũ
  • Schedule setTimeout mới
```

> Flow H tương đương về mặt logic với [Flow D.2](#d2-đặt-lại-giờ-nhắc-hoàn-toàn-reschedule) — khác biệt duy nhất là điểm truy cập (dialog vs toast). Backend xử lý y hệt nhau.

---

## 8. Bảng tổng hợp indicator theo tình huống

| Tình huống | Wrench 🔧 | Submenu item | Toast | Sound | Browser Noti | Trong dialog |
|------------|-----------|--------------|-------|-------|--------------|---------------|
| Item upcoming (chưa tới giờ) | — | — | — | — | — | Thời gian xám |
| Item due soon (< 1h) | — | — | — | — | — | Highlight cam |
| Item đến hạn (realtime) | 🔴 pulse | 🔴 | ✅ với action | ✅ | ✅ nếu app blur | Highlight vàng |
| Item overdue | 🔴 pulse | 🔴 | ✅ cold-start | ✅ cold-start | ✅ cold-start | **Viền đỏ + nền đỏ nhạt** |
| User mở dialog & đang xem | 🔴 tĩnh | 🔴 tĩnh | Đóng pending | — | — | — |
| User done / snooze hết | — | — | — | — | — | — |
| **DND mode ON** | 🔴 (vẫn cập nhật) | 🔴 (vẫn cập nhật) | ❌ | ❌ | ❌ | Hiển thị bình thường |

---

## 9. API Contract đề xuất

### 9.1. Cập nhật endpoint hiện có

#### `POST /api/todo-items`

**Request:**
```json
{
  "title": "Gọi khách hàng A",
  "description": "Hỏi về hợp đồng tháng 6",
  "dueAt": "2026-06-03T17:30:00.000Z"   // ← thêm mới, optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "title": "Gọi khách hàng A",
  "description": "Hỏi về hợp đồng tháng 6",
  "isDone": false,
  "dueAt": "2026-06-03T17:30:00.000Z",
  "remindedAt": null,
  "snoozedUntil": null,
  "createdAt": "2026-06-03T10:00:00.000Z"
}
```

#### `PUT /api/todo-items/{id}`

```json
{
  "title": "...",          // optional
  "description": "...",    // optional
  "isDone": true,          // optional
  "dueAt": "2026-...",     // ← thêm mới, optional
  "snoozedUntil": "..."    // ← thêm mới, optional (set bởi action Snooze)
}
```

> **Quy tắc backend:** Khi `dueAt` thay đổi → tự reset `remindedAt = null` & reschedule job.

### 9.2. Endpoint mới (đề xuất)

#### `GET /api/todo-items/pending-notifications`

Trả về danh sách items cần thông báo (overdue + due now + due soon trong X phút tới). Phục vụ:
- Cold-start banner.
- Frontend tính chấm đỏ ngay khi load.

```json
{
  "overdue": [ { "id": "...", "title": "...", "dueAt": "...", "overdueByMinutes": 180 } ],
  "dueNow":  [ { "id": "...", "title": "...", "dueAt": "..." } ],
  "dueSoon": [ { "id": "...", "title": "...", "dueAt": "...", "remainMinutes": 25 } ],
  "totalCount": 8
}
```

#### `PUT /api/user/preferences/todo`

```json
{
  "todoDndEnabled": true,
  "todoSoundEnabled": true
}
```

---

## 10. SignalR Event đề xuất

Tận dụng SignalR đã có trong stack.

### 10.1. Server → Client events

#### `TodoItemDue`

Backend chủ động push khi đến giờ một item:

```json
{
  "event": "TodoItemDue",
  "payload": {
    "id": "uuid",
    "title": "Gọi khách hàng A",
    "dueAt": "2026-06-03T17:30:00.000Z",
    "userId": "..."
  }
}
```

#### `TodoItemUpdated`

Khi user mark done / snooze / edit từ một device → push tới các device khác:

```json
{
  "event": "TodoItemUpdated",
  "payload": { "id": "uuid", "isDone": true, ... }
}
```

### 10.2. Logic frontend nhận event

```
On TodoItemDue:
  • Check DND
  • Bắn toast + sound + browser noti
  • Cập nhật chấm đỏ
  • React Query invalidate

On TodoItemUpdated:
  • React Query invalidate
  • Recompute chấm đỏ
  • Đóng pending toast nếu item này đã done từ device khác
```

---

## 11. Quy tắc & Logic nghiệp vụ

### 11.1. Quy tắc bắt buộc

| # | Quy tắc |
|---|---------|
| BR-01 | `dueAt` là **optional** — không ép user nhập |
| BR-02 | Khi `dueAt` thay đổi → reset `remindedAt = null` |
| BR-03 | Khi `isDone = true` → KHÔNG gửi notification, dù `dueAt` đến giờ |
| BR-04 | Khi `snoozedUntil > now` → tạm coi như chưa overdue, không noti cho tới khi `snoozedUntil` đến |
| BR-05 | Notification chỉ noti **1 lần / item** (trừ trường hợp snooze) — qua field `remindedAt` |
| BR-06 | Cold-start banner show **mỗi lần mở app** (theo Q1) |
| BR-07 | Toast gom tất cả items khi nhiều cái đến hạn cùng lúc (theo Q4) |
| BR-08 | DND mode tắt mọi popup/sound, **không tắt** chấm đỏ passive (theo Q2) |
| BR-09 | Pulse animation chỉ chạy khi có sự kiện mới — tắt khi user đã mở dialog |
| BR-10 | Sort active list: overdue → due/dueSoon → upcoming → không-deadline |
| BR-11 | Khi user **Snooze** (D.1) → chỉ update `snoozedUntil`, GIỮ NGUYÊN `dueAt` |
| BR-12 | Khi user **Reschedule** (D.2 / Flow H) → update `dueAt` mới + reset `remindedAt = null`, item được phép noti lại đầy đủ ở thời điểm mới |
| BR-13 | Toast nhắc việc cung cấp đủ 3 thao tác: **Hoàn thành** (1-click), **Snooze preset** (dropdown), **Reschedule** (mở mini time picker) |

### 11.2. Định nghĩa thời gian

| Khái niệm | Định nghĩa |
|-----------|-----------|
| `overdue` | `dueAt < now` AND `!isDone` AND `(snoozedUntil null OR snoozedUntil < now)` |
| `dueNow` | `|dueAt - now| ≤ 1 phút` |
| `dueSoon` | `0 < dueAt - now ≤ 1 giờ` |
| `upcoming` | `dueAt - now > 1 giờ` |

---

## 12. Cross-platform — Desktop & Mobile

### 12.1. Yêu cầu chung

Tất cả tính năng trên **đều phải có cả 2 platform** (theo R9). Bảng so sánh:

| Tính năng | Desktop | Mobile |
|-----------|---------|--------|
| Time picker | Radix popover + date/time input | Native `<input type="datetime-local">` |
| Quick presets | Chip buttons | Chip buttons (scroll horizontal) |
| Toast | Sonner top-center | Sonner top-center, full-width với `mx-4` |
| Sound | `Audio API` | `Audio API` (nhiều mobile auto-mute) |
| Browser Notification | Standard API | Standard API + PWA (Phase 2) |
| Chấm đỏ + pulse trên 🔧 | Sidebar trái | Bottom nav hoặc sidebar mobile |
| DND toggle | Icon trong header dialog | Icon trong header dialog (44px tap target) |
| Highlight đỏ overdue | Border + background | Border + background |
| Long press tooltip | (dùng hover) | Long press hiện thời gian tuyệt đối |

### 12.2. Khác biệt mobile cần lưu ý

- **Safe area:** Toast và banner cần `mt-safe-top` để tránh notch.
- **Tap target:** Mọi button (Hoàn thành / Hoãn / DND toggle) ≥ 44px.
- **Khi đang trong `TodoListManagerMobile` (full-screen):** Tắt toast (user đã ở trong context xem todo).
- **Native PWA push (Phase 2):** Cần Service Worker, VAPID key.

---

## 13. Edge cases & xử lý đặc biệt

| # | Tình huống | Xử lý |
|---|------------|-------|
| EC-01 | User đặt `dueAt` trong quá khứ khi tạo mới | Cho phép, kèm cảnh báo nhỏ "Thời gian này đã qua" |
| EC-02 | App offline khi đến hạn | Khi online lại → fetch `pending-notifications` → show banner "Đã có N việc quá hạn" |
| EC-03 | User mark done trước deadline | Cancel pending notification (frontend + backend) |
| EC-04 | User snooze nhiều lần liên tiếp | Cho phép — mỗi lần `snoozedUntil = now + 10p`. Item vẫn coi là overdue nếu `dueAt` gốc < now |
| EC-05 | User đổi múi giờ thiết bị | Backend lưu UTC; frontend format theo local time. Re-render khi detect timezone change |
| EC-06 | Item completed có dueAt | Trong "Đã hoàn thành hôm nay" hiển thị: "Hoàn thành sớm 1h" / "Trễ 30 phút" |
| EC-07 | Notification permission bị deny | Vẫn dùng Sonner toast (in-app). Hiện banner gợi ý bật lại 1 lần |
| EC-08 | App mở nhiều tab cùng lúc | SignalR phân phối event đến 1 tab; các tab khác nhận qua tab broadcast (BroadcastChannel API) — tránh bắn toast trùng |
| EC-09 | DND đang bật + có overdue mới phát sinh | Vẫn cập nhật chấm đỏ; KHÔNG bắn toast/sound |
| EC-10 | User clear dueAt (bỏ deadline) | Cancel pending notification; item chuyển về dạng không deadline |

---

## 14. Phân kỳ triển khai

### Phase 1 — MVP (Sprint 1) — đáp ứng đủ 9 yêu cầu R1-R9

| # | Hạng mục |
|---|----------|
| ✅ | Thêm field `dueAt`, `remindedAt`, `snoozedUntil` vào DB & API |
| ✅ | UI Time Picker (Desktop + Mobile) với quick presets |
| ✅ | Visual states: overdue đỏ, due cam/vàng, upcoming xám |
| ✅ | Sort list theo độ ưu tiên |
| ✅ | Chấm đỏ + pulse trên 🔧 sidebar (theo cập nhật: không số đếm) |
| ✅ | Chấm đỏ tĩnh trên submenu item |
| ✅ | Sonner toast realtime "đến hạn" với action button "Hoàn thành" / "Hoãn 10p" |
| ✅ | Sonner toast cold-start "Có N việc cần xử lý" — show mỗi lần mở app |
| ✅ | Browser Notification API (foreground, không action button) |
| ✅ | DND mode toggle + áp dụng cho mọi kênh active |
| ✅ | Sound notification + tôn trọng DND |
| ✅ | SignalR `TodoItemDue` + `TodoItemUpdated` |
| ✅ | Highlight đỏ overdue trong dialog (Desktop + Mobile) |
| ✅ | Scroll-into-view + focus item từ toast |
| ✅ | Đồng bộ DND multi-device qua user preference API |

### Phase 2 — Nâng cấp UX

- Service Worker + Web Push (action button kể cả khi tab đóng).
- Auto DND theo lịch (vd: 22:00-07:00).
- DND tạm thời (1h / 4h / cuối ngày).
- Pre-warn notification (vd: nhắc trước 10 phút).
- BroadcastChannel để chống bắn toast trùng giữa các tab.

### Phase 3 — Power user

- Recurring todo (lặp hàng ngày/tuần/tháng).
- Multiple reminders / 1 item (nhắc trước 1h + đúng giờ).
- Tag / group todos.
- Filter chips: All / Today / Overdue / This week.

---

## 15. Open questions

Cần khách hàng/BA xác nhận trước khi vào code:

| # | Câu hỏi | Tác động |
|---|---------|----------|
| OQ-01 | Có cần **pre-warn** (nhắc trước 10 phút khi đến hạn) hay chỉ nhắc đúng giờ? | Số lần noti / item |
| OQ-02 | Sound file cụ thể: nhẹ nhàng kiểu chime hay rõ ràng kiểu bell? | Asset thiết kế |
| OQ-03 | Khi đặt `dueAt` trong quá khứ — có cho phép không, hay block? | Validation rule |
| OQ-04 | Item completed có dueAt — hiển thị "sớm/trễ" có cần thiết hay bỏ qua? | UI đơn giản hay chi tiết |
| OQ-05 | Multi-tab — có cần ưu tiên không bắn toast trùng? (Phase 1 hay Phase 2) | BroadcastChannel implementation |
| OQ-06 | Service Worker Push (Phase 2) — bắt buộc hay nice-to-have? | Effort lớn, cần VAPID + backend |
| OQ-07 | DND có cần auto-bật theo lịch không (Phase 1 hay Phase 2)? | Settings UI complexity |
| OQ-08 | Preset snooze mặc định (5p/10p/30p/1h) — đủ chưa hay cần preset khác (vd: 2h, sáng mai)? | Cấu hình dropdown |

---

## Phụ lục — Tham chiếu code

| Tên | Đường dẫn |
|-----|-----------|
| Type definitions | [src/types/todo.ts](../../src/types/todo.ts) |
| API client | [src/api/todo.api.ts](../../src/api/todo.api.ts) |
| Query hooks | [src/hooks/queries/useTodoItems.ts](../../src/hooks/queries/useTodoItems.ts) |
| Mutation hooks | [src/hooks/mutations/useTodoItemMutations.ts](../../src/hooks/mutations/useTodoItemMutations.ts) |
| UI Desktop | [src/features/portal/components/TodoListManager.tsx](../../src/features/portal/components/TodoListManager.tsx) |
| UI Mobile | [src/features/portal/components/TodoListManagerMobile.tsx](../../src/features/portal/components/TodoListManagerMobile.tsx) |
| Sidebar (Tools popover) | [src/features/portal/components/MainSidebar.tsx](../../src/features/portal/components/MainSidebar.tsx) |
| Sonner Toaster setup | [src/App.tsx](../../src/App.tsx) |
| Notification permission UI | [src/components/NotificationPermissionBanner.tsx](../../src/components/NotificationPermissionBanner.tsx) |

---

**Tài liệu này đã bao trùm toàn bộ phạm vi CR-001. Vui lòng phê duyệt hoặc gửi feedback trước khi triển khai.**
