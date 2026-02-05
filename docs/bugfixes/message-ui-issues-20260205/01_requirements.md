# [BƯỚC 1] Requirements - Message UI Issues Fix

> **Date:** 2026-02-05  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 🎯 Requirements Overview

Fix 3 UI bugs liên quan đến hiển thị tin nhắn:

1. **[REQ-1]** Tin nhắn hiển thị sau khi khôi phục kết nối mạng
2. **[REQ-2]** MessageBubbleSimple có max-width khi có nhiều ảnh
3. **[REQ-3]** Không hiển thị trùng loading states

---

## 📋 Detailed Requirements

### REQ-1: Network Reconnection - Message Display

**Priority:** 🔴 HIGH  
**Module:** Chat - Message Send

#### Functional Requirements

##### FR-1.1: Detect SignalR Reconnection

**Description:** Hệ thống phải detect được khi SignalR reconnect sau khi mất kết nối

**Acceptance Criteria:**

- [ ] Khi SignalR connection state chuyển từ "Disconnected" → "Connected", trigger reconnection handler
- [ ] Log reconnection event để debug
- [ ] Không trigger khi first-time connection

**Technical Notes:**

- SignalR Hub connection có `onreconnected()` callback
- File: `src/lib/signalr.ts`

---

##### FR-1.2: Refresh Messages After Reconnection

**Description:** Sau khi reconnect, tự động refetch messages để đồng bộ

**Acceptance Criteria:**

- [ ] Khi SignalR reconnect, invalidate messages query
- [ ] QueryClient refetch messages automatically
- [ ] Show subtle loading indicator (không làm gián đoạn UX)
- [ ] Preserve scroll position sau khi refetch

**Technical Notes:**

- Use `queryClient.invalidateQueries(['messages', conversationId])`
- Show toast: "Đã kết nối lại. Đồng bộ tin nhắn..."

---

##### FR-1.3: Handle Optimistic Update Conflicts

**Description:** Xử lý trường hợp optimistic message đã bị remove nhưng SignalR chưa push real message

**Acceptance Criteria:**

- [ ] Nếu message send success (API) nhưng không có trong cache sau 5s → refetch
- [ ] Không duplicate message nếu SignalR push sau đó
- [ ] User thấy message trong mọi trường hợp (optimistic hoặc real)

**Edge Cases:**

- SignalR reconnect ngay sau send → có thể duplicate (cần dedup)
- API success nhưng SignalR never push → timeout refetch
- Slow network → optimistic removed, real message chưa đến

---

### REQ-2: MessageBubbleSimple Max-Width

**Priority:** 🟡 MEDIUM  
**Module:** Chat - Message Display

#### Functional Requirements

##### FR-2.1: Constrain Image Size in Grid

**Description:** Giới hạn kích thước ảnh trong grid để message bubble không quá rộng

**Acceptance Criteria:**

- [ ] Mỗi ảnh trong grid: max 100x100px (width × height)
- [ ] Apply cho tất cả ảnh trong grid layout (2, 3, 4+ ảnh)
- [ ] Single image (1 ảnh): giữ nguyên kích thước hiện tại (không thay đổi)
- [ ] Maintain aspect ratio với `object-fit: cover`

**Current State:**

- Grid images không có size constraint
- Message có nhiều ảnh lớn → bubble rất rộng

**Rationale:**

- Giới hạn ở image level thay vì bubble level → simpler, more predictable
- 100x100px đủ lớn để preview, nhỏ gọn để fit nhiều ảnh

---

##### FR-2.2: Apply 100x100px Size to Grid Images

**Description:** Set fixed size cho grid images, giữ nguyên grid layout logic

**Acceptance Criteria:**

- [ ] CSS: `.grid-image { width: 100px; height: 100px; object-fit: cover; }`
- [ ] Apply khi có 2+ ảnh (grid mode)
- [ ] Không apply cho single image (1 ảnh) → giữ nguyên
- [x] Giữ nguyên grid layout structure ✅ **CONFIRMED by HUMAN**
- [x] Giữ nguyên click handler (gallery modal)

**Technical Notes:**

- Chỉ thêm CSS constraint cho image size
- Grid structure không thay đổi
- Single image tetains original behavior

**Implementation:**

```css
/* Trong MessageBubbleSimple */
.message-images-grid img {
  width: 100px;
  height: 100px;
  object-fit: cover;
}

/* Single image giữ nguyên */
.message-single-image img {
  max-width: 400px; /* existing behavior */
}
```

---

### REQ-3: Remove Duplicate Loading States

**Priority:** 🟢 LOW  
**Module:** Chat - Loading UX

#### Functional Requirements

##### FR-3.1: Synchronize Toast and Loading Indicator

**Description:** Khi hiển thị toast success, ẩn loading indicator

**Acceptance Criteria:**

- [ ] Toast "Đã tìm thấy tin nhắn!" xuất hiện → ẩn loading indicator
- [ ] Loading indicator chỉ hiển thị khi `isLoadingNewer === true`
- [ ] Sau khi scroll xong → `isLoadingNewer = false`

**Current Issue:**

- Line 762: `toast.info("Đang tải tin nhắn...")`
- Line 847: `toast.success("Đã tìm thấy tin nhắn!")`
- Line 1842: `<div>Đang tải tin nhắn mới hơn...</div>`
- Toast success hiển thị nhưng loading indicator vẫn còn

---

##### FR-3.2: Use Single Loading State Source

**Description:** Consolidate loading state thành 1 source of truth

**Acceptance Criteria:**

- [ ] `isLoadingNewer` state control cả toast và loading indicator
- [ ] Set `isLoadingNewer = true` khi bắt đầu load
- [ ] Set `isLoadingNewer = false` khi load xong (success hoặc error)
- [ ] Không duplicate toast notifications

**Proposed Flow:**

```
1. User clicks search result / scroll down to new messages
2. Set isLoadingNewer = true
3. Show loading indicator (line 1842)
4. Fetch newer messages
5. On success: Set isLoadingNewer = false → hide indicator
6. Show toast "Đã tìm thấy tin nhắn!" (optional, only on search)
7. Scroll to target message
```

---

## 🎨 UI/UX Requirements

### UX-1: Smooth Loading Transitions

**Description:** Loading states phải smooth, không flicker

**Acceptance Criteria:**

- [ ] Loading indicator fade-in/fade-out (300ms)
- [ ] Skeleton loading cho images trong grid (before load)
- [ ] No layout shift khi image load

---

### UX-2: Visual Feedback for Reconnection

**Description:** User biết được khi nào bị disconnect và reconnect

**Acceptance Criteria:**

- [ ] Toast subtle: "Đã mất kết nối. Đang kết nối lại..." (gray color)
- [ ] Toast success: "Đã kết nối lại!" (green, auto-dismiss 2s)
- [ ] Không show nếu disconnect < 3s (transient network)

---

### UX-3: Image Grid Visual Polish

**Description:** Image grid trông professional, như Messenger/Telegram

**Acceptance Criteria:**

- [ ] Gap giữa các ảnh: 4px
- [ ] Border radius: 12px cho grid container
- [ ] Hover effect: opacity 0.9 + scale 1.02
- [ ] "+N" badge có gradient background

---

## 🔒 Non-Functional Requirements

### NFR-1: Performance

**Requirement:** Image grid không làm chậm rendering

**Acceptance Criteria:**

- [ ] Use `loading="lazy"` cho images
- [ ] Virtualize images nếu > 10 ảnh trong conversation
- [ ] No jank khi scroll qua message có nhiều ảnh

---

### NFR-2: Accessibility

**Requirement:** Image grid accessible cho screen readers

**Acceptance Criteria:**

- [ ] `alt` text cho mỗi image
- [ ] Keyboard navigation cho image gallery
- [ ] ARIA labels cho "+N" badge

---

### NFR-3: Backward Compatibility

**Requirement:** Không break existing features

**Acceptance Criteria:**

- [ ] Existing image modal vẫn hoạt động
- [ ] Image download functionality preserved
- [ ] Pin/Star message không bị ảnh hưởng

---

## 📊 IMPACT SUMMARY

### Files sẽ tạo mới:

- (Không có - chỉ modify existing files)

### Files sẽ sửa đổi:

#### 1. `src/lib/signalr.ts` (REQ-1)

**Changes:**

- Thêm `onReconnected` handler
- Invalidate messages query khi reconnect
- Show reconnection toast

#### 2. `src/hooks/mutations/useSendMessage.ts` (REQ-1)

**Changes:**

- Thêm timeout check: Nếu message send success nhưng không trong cache sau 5s → refetch
- Handle edge case: optimistic removed, SignalR delayed

#### 3. `src/features/portal/components/chat/MessageBubbleSimple.tsx` (REQ-2)

**Changes:**

- Thêm CSS constraint cho grid images: `width: 100px; height: 100px; object-fit: cover;`
- Apply khi có 2+ ảnh (grid mode)
- **NO CHANGES** to single image behavior (1 ảnh)
- **NO CHANGES** to grid layout structure (đã OK)
- **NO CHANGES** to click handlers (đã OK)

#### 4. `src/features/portal/components/chat/ChatMainContainer.tsx` (REQ-3)

**Changes:**

- Consolidate `isLoadingNewer` state usage
- Remove duplicate toast (line 762)
- Sync loading indicator (line 1842) với `isLoadingNewer` state
- Đảm bảo set `isLoadingNewer = false` sau khi load xong

### Files sẽ xoá:

- (Không có)

### Dependencies sẽ thêm:

- (Không có - chỉ dùng existing libraries)

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                          | Lựa chọn                               | HUMAN Decision                           |
| --- | ----------------------------------------------- | -------------------------------------- | ---------------------------------------- |
| 1   | Reconnection toast message                      | "Đã kết nối lại!" vs "Mạng đã ổn định" | ✅ **Giữ nguyên (không thêm toast mới)** |
| 2   | Message refetch timeout                         | 5s vs 10s sau khi send success         | ✅ **3s**                                |
| 3   | Grid layout for 3 images                        | 2+1 vs 1+2 vs 3 horizontal             | ✅ **Giữ nguyên (grid hiện tại đã OK)**  |
| 4   | Max images in grid before "+N"                  | 4 vs 6 vs 9                            | ✅ **Giữ nguyên (grid hiện tại đã OK)**  |
| 5   | Remove "Đang tải tin nhắn..." toast completely? | Yes (keep only indicator) vs No        | ✅ **Yes (keep only indicator)**         |
| 6   | Desktop max-width cho message bubble            | 600px vs 700px vs 65%                  | ✅ **N/A (dùng image size 100x100px)**   |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status          |
| ------------------------- | --------------- |
| Đã review Impact Summary  | ✅ Đã review    |
| Đã điền Pending Decisions | ✅ Đã điền      |
| **APPROVED để thực thi**  | ✅ **APPROVED** |

**HUMAN Signature:** [ĐÃ DUYỆT]  
**Date:** 2026-02-05

> ✅ **Requirements đã được approve. AI có thể proceed với Implementation Plan.**

---

**Created:** 2026-02-05  
**Status:** ✅ APPROVED
