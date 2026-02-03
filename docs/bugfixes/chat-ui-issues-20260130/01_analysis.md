# [BƯỚC 1] Bug Analysis - Chat UI Issues

**Date:** 2026-01-30  
**Status:** ✅ COMPLETED & IMPLEMENTED

---

## 🐛 BUG-001: Scroll-to-bottom button visibility inconsistent

### Problem Description

Button "cuộn xuống dưới" (scroll-to-bottom) lúc hiển thị lúc không khi user scroll lên.

### Expected Behavior

- Khi user scroll lên (cách bottom > threshold): Button hiển thị
- Khi user scroll xuống gần bottom (< threshold): Button ẩn
- Hiển thị ổn định, không blink/flicker

### Current Behavior

Button visibility không ổn định, có thể do:

- Logic detect scroll position không chính xác
- State update race condition
- Threshold calculation sai

### Root Cause Analysis

**Files to investigate:**

- `src/features/portal/components/chat/ChatMainContainer.tsx`
  - Kiểm tra scroll event handler
  - Kiểm tra state management cho `showScrollButton`
  - Kiểm tra threshold calculation

**Suspected causes:**

1. Scroll event throttle/debounce issue
2. Incorrect scroll position calculation (scrollTop vs scrollHeight vs clientHeight)
3. State update timing issue

### Proposed Fix

1. Review scroll detection logic trong ChatMainContainer
2. Ensure proper threshold calculation:
   ```typescript
   const threshold = 100; // pixels from bottom
   const isNearBottom = scrollHeight - scrollTop - clientHeight < threshold;
   ```
3. Add debounce/throttle to scroll event if needed
4. Ensure state updates are batched properly

---

## 🐛 BUG-002: Auto-scroll animation when changing conversation

### Problem Description

Khi click mở conversation khác, UI đang tự scroll từ trên xuống (có animation). Mong muốn: khi mở conversation UI phải đang ở vị trí của tin mới nhất (ở dưới cùng) không cần scroll animation.

### Expected Behavior

- Click vào conversation mới
- UI hiển thị **ngay lập tức** ở vị trí tin nhắn mới nhất (bottom)
- **KHÔNG có** smooth scroll animation từ top → bottom

### Current Behavior

- Click vào conversation mới
- UI bắt đầu từ **top position** (scroll position = 0)
- Có smooth scroll animation từ top → bottom
- User phải đợi animation hoàn tất
- **Root issue:** Initial scroll position là top, không phải bottom

### Root Cause Analysis

**Files to investigate:**

- `src/features/portal/workspace/ChatMain.tsx`
- `src/features/portal/components/chat/ChatMainContainer.tsx`

**Suspected causes:**

1. Initial scroll position của scroll container là `scrollTop = 0` (top)
2. `scrollToBottom()` được gọi SAU khi component render → visible scroll animation
3. `scrollToBottom()` function đang dùng `behavior: 'smooth'` thay vì `behavior: 'instant'`
4. Không có logic set initial scroll position = bottom TRƯỚC khi render messages

### Proposed Fix

**Strategy:** Đảm bảo UI **BẮT ĐẦU** từ bottom position, KHÔNG scroll từ top xuống.

**Option 1: useLayoutEffect to pre-set position (RECOMMENDED)**

```typescript
// In ChatMainContainer - BEFORE browser paint
useLayoutEffect(() => {
  if (conversationId && scrollAreaRef.current) {
    // Set scroll position to bottom IMMEDIATELY before render
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }
}, [conversationId]);
```

✅ **Ưu điểm:** Không có visible scroll, UI xuất hiện ngay tại bottom

**Option 2: Instant scroll in useEffect**

```typescript
// In ChatMainContainer or ChatMain
useEffect(() => {
  if (conversationId && scrollAreaRef.current) {
    // Scroll instantly to bottom when conversation changes
    scrollAreaRef.current.scrollTo({
      top: scrollAreaRef.current.scrollHeight,
      behavior: "instant", // ← No animation
    });
  }
}, [conversationId]);
```

⚠️ **Nhược điểm:** Vẫn có thể thấy flash/jump vì useEffect chạy AFTER paint

**Option 3: Reset scrollTop when clearing messages**

```typescript
// When changing conversation, reset scroll before fetching new messages
const handleConversationChange = (newConversationId: string) => {
  // Clear current messages first
  setMessages([]);
  // Reset scroll to bottom immediately
  if (scrollAreaRef.current) {
    scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
  }
  // Then load new conversation
  setConversationId(newConversationId);
};
```

**Recommendation:** **Option 1 (useLayoutEffect)** vì:

- Chạy TRƯỚC khi browser paint
- Không có visible scroll animation
- UI xuất hiện ngay tại bottom position
- Tránh scroll lên/xuống hoàn toàn

---

## 🐛 BUG-003: Empty state not showing when switching tabs

### Problem Description

Chuyển tab từ **Nhóm** → **Cá nhân**: đoạn chat nhóm vẫn đang active. Mong muốn: hiển thị message "Chọn cuộc trò chuyện" (sử dụng `EmptyChatState` component đang có).

### Expected Behavior

Khi chuyển tab:

- Tab **Nhóm** → **Cá nhân** (hoặc ngược lại)
- Nếu **KHÔNG có conversation nào được chọn** trong tab mới
- Hiển thị `<EmptyChatState />` component

### Current Behavior

- Chuyển tab Nhóm → Cá nhân
- Conversation cũ (từ tab Nhóm) vẫn hiển thị
- Không có empty state

### Root Cause Analysis

**Files to investigate:**

- `src/features/portal/workspace/ChatMain.tsx`
- State management cho selected conversation

**Suspected causes:**

1. `selectedConversationId` state không được reset khi chuyển tab
2. Tab switch logic không clear conversation selection
3. Conditional rendering logic cho EmptyChatState missing

### Proposed Fix

**In ChatMain.tsx:**

```typescript
// Detect tab switch and reset conversation if not in new tab
useEffect(() => {
  if (activeTab === 'groups' && selectedConversation?.conversationType === 'DM') {
    // Switched to Groups tab but selected conversation is DM → clear selection
    setSelectedConversationId(undefined);
  } else if (activeTab === 'direct' && selectedConversation?.conversationType === 'GRP') {
    // Switched to Direct tab but selected conversation is Group → clear selection
    setSelectedConversationId(undefined);
  }
}, [activeTab, selectedConversation?.conversationType]);

// Render logic
if (!selectedConversationId) {
  return <EmptyChatState />;
}
```

**Alternative approach:**

- Maintain separate state for group vs DM selected conversation
- Switch between them when tab changes

---

## 🐛 BUG-004: DM header showing current user name instead of recipient

### Problem Description

Khi mở đoạn chat cá nhân (DM), tên của user ở header đang bị sai. Hiện tại đang hiển thị tên của user hiện tại (tôi) → Mong muốn phải hiển thị tên người nhận.

### Expected Behavior

**DM header phải hiển thị:**

- Tên người nhận (other participant)
- **KHÔNG phải** tên user hiện tại (current user)

### Current Behavior

Header hiển thị tên user hiện tại thay vì tên người nhận.

### Root Cause Analysis

**File:** `src/features/portal/components/chat/ChatHeader.tsx` (line 148)

**Current code:**

```typescript
// Line 148
const headerDisplayName = conversationCategory || displayName;
```

**Current flow:**

1. `conversationName` comes from API (e.g., "DM: User A <> User B")
2. `getDisplayName()` extracts first name: "User A"
3. BUT: không check xem "User A" có phải current user không

**Suspected cause:**

- `getDisplayName()` function chỉ extract first name từ DM format
- Không có logic để:
  1. Detect current user ID
  2. Filter out current user name
  3. Show only other participant name

### Proposed Fix

**Option 1: Fix in getDisplayName() function**

```typescript
const getDisplayName = (
  name: string,
  type?: "GRP" | "DM",
  currentUserId?: string, // ← ADD
  members?: ConversationMemberDto[], // ← ADD
) => {
  if (type === "DM" && members) {
    // Find the OTHER participant (not current user)
    const otherMember = members.find((m) => m.userId !== currentUserId);
    return otherMember?.displayName || name;
  }
  return name;
};
```

**Option 2: Filter in ChatHeader component**

```typescript
// In ChatHeader component
const getHeaderDisplayName = () => {
  if (conversationCategory) return conversationCategory;

  if (conversationType === "DM" && members.length > 0) {
    // Get current user ID from auth store
    const currentUserId = useAuthStore.getState().user?.id;
    // Find other participant
    const otherMember = members.find((m) => m.userId !== currentUserId);
    return otherMember?.displayName || displayName;
  }

  return displayName;
};

const headerDisplayName = getHeaderDisplayName();
```

**Recommendation:** Option 2 (filter in component) vì:

- Access to `members` data (already fetched via `useConversationMembers`)
- Access to `currentUserId` via `useAuthStore`
- Clearer logic separation

---

## � BUG-005: Wrong tab active when reloading DM conversation

### Problem Description

Khi reload page với DM conversation đã được lưu, tab "Nhóm" active thay vì tab "Cá nhân".

### Expected Behavior

- Nếu saved conversation là DM → Tab "Cá nhân" active ngay từ đầu
- Nếu saved conversation là group → Tab "Nhóm" active
- Không có animation/transition giật từ tab này sang tab khác

### Current Behavior

- Page reload → Tab "Nhóm" hiển thị trước
- Sau đó nhảy sang tab "Cá nhân" → Gây khó chịu cho user

### Root Cause Analysis

**Files to investigate:**

- `src/features/portal/workspace/ConversationListSidebar.tsx`
  - Local `tab` state khởi tạo default = "categories"
  - Không đọc persisted conversation type từ localStorage khi init
  - Restore logic trong useEffect chạy sau khi component đã render

- `src/features/portal/workspace/WorkspaceView.tsx`
  - Parent `leftTab` state không được sync khi ConversationListSidebar restore conversation

**Suspected causes:**

1. `useState` initial value hardcoded = "categories"
2. Restore conversation logic chạy async trong useEffect (sau render)
3. Missing sync between ConversationListSidebar tab và parent leftTab

### Proposed Fix

1. **Tạo helper function `getInitialTab()`:**

   ```typescript
   const getInitialTab = (): "categories" | "contacts" => {
     try {
       const stored = localStorage.getItem("conversation-storage");
       if (stored) {
         const data = JSON.parse(stored);
         if (data?.state?.selectedConversation?.type === "dm") {
           return "contacts";
         }
       }
     } catch (error) {}
     return "categories";
   };
   ```

2. **Update useState initial value:**

   ```typescript
   const [tab, setTab] = useState<"categories" | "contacts">(getInitialTab());
   ```

3. **Add useEffect to sync parent tab on mount:**

   ```typescript
   React.useEffect(() => {
     const parentTab = tab === "categories" ? "messages" : "contacts";
     onTabChange?.(parentTab);
   }, []); // Only run on mount
   ```

4. **Add onTabChange prop to ConversationListSidebar:**
   - Pass `setLeftTab` from PortalWireframes → WorkspaceView → ConversationListSidebar
   - Call `onTabChange("contacts")` when restoring DM conversation

### Fix Status

✅ **FIXED** - Implemented getInitialTab helper and sync logic

---

## 🐛 BUG-006: UI jerking when tab switches on reload

### Problem Description

Ngay cả khi BUG-005 được fix, vẫn thấy UI flash/jerk nhẹ khi page reload với DM conversation.

### Expected Behavior

- Tab "Cá nhân" active ngay lập tức, không có transition/flash
- Smooth experience như user chưa bao giờ rời khỏi trang

### Current Behavior

- ConversationListSidebar khởi tạo với tab default
- useEffect chạy để sync parent tab
- Có thể thấy UI update (flash) khi parent re-render

### Root Cause Analysis

**Suspected causes:**

1. Local `tab` state đã được fix nhưng parent `leftTab` chưa sync kịp
2. useEffect chạy sau first render → cause re-render
3. Parent component re-render khi leftTab thay đổi

### Proposed Fix

**Already implemented in BUG-005 fix:**

- `getInitialTab()` ensures correct initial state
- Early useEffect sync prevents visible flash
- Both local and parent states initialized correctly from the start

### Fix Status

✅ **FIXED** - Resolved by BUG-005 implementation

---

## 🐛 BUG-007: Category not highlighted when restoring conversation

### Problem Description

Khi reload page với group conversation, category tương ứng không được highlighted trong sidebar.

### Expected Behavior

- Saved conversation ID: "conv-123"
- Belongs to category: "Category A"
- Category A được highlight (bg-brand-50 ring-1 ring-brand-100)
- Conversation active rõ ràng thuộc category nào

### Current Behavior

- Conversation được restore và hiển thị đúng
- Nhưng category trong sidebar không có highlight
- User không biết conversation đang ở category nào

### Root Cause Analysis

**Files to investigate:**

- `src/features/portal/workspace/ConversationListSidebar.tsx`
  - UI dùng `selectedCategoryId` prop để highlight
  - Prop này được pass từ parent: `selectedConversation?.categoryId`
  - Có race condition: restore conversation → call onSelectChat → update store → prop update → UI re-render
  - Timing issue: category list render trước khi prop được update

**Suspected causes:**

1. `selectedCategoryId` prop phụ thuộc vào parent state update
2. Async flow: handleGroupSelect → onSelectChat → store update → prop update
3. UI render với old prop value trước khi update đến

### Proposed Fix

1. **Add internal state to track selected category:**

   ```typescript
   const [internalSelectedCategoryId, setInternalSelectedCategoryId] = useState<
     string | null
   >(null);
   ```

2. **Update handleGroupSelect to set internal state:**

   ```typescript
   if (categoryId) {
     saveSelectedCategory(categoryId);
     setInternalSelectedCategoryId(categoryId); // Immediate update
   }
   ```

3. **Update UI to check both internal state and prop:**
   ```typescript
   className={`... ${
     (internalSelectedCategoryId || selectedCategoryId) === category.id
       ? "bg-brand-50 ring-1 ring-brand-100"
       : ""
   }`}
   ```

### Fix Status

✅ **FIXED** - Added internal state for immediate category highlighting

---

## �📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- (không có - chỉ fix bugs trong files hiện có)

### Files sẽ sửa đổi:

#### 1. `src/features/portal/components/chat/ChatMainContainer.tsx`

**Changes:**

- **BUG-001:** Fix scroll button visibility logic
  - Review and fix scroll position detection
  - Add proper threshold calculation
  - Ensure stable state updates

- **BUG-002:** Change scroll behavior on conversation change
  - Change `behavior: 'smooth'` → `behavior: 'instant'`
  - Or use `useLayoutEffect` to pre-set scroll position

#### 2. `src/features/portal/workspace/ChatMain.tsx`

**Changes:**

- **BUG-003:** Add tab switch handling
  - Add `useEffect` to detect tab changes
  - Reset `selectedConversationId` when switching to tab without matching conversation
  - Add conditional render for `<EmptyChatState />`

#### 3. `src/features/portal/components/chat/ChatHeader.tsx`

**Changes:**

- **BUG-004:** Fix DM header display name
  - Import `useAuthStore` to get current user ID
  - Add logic to filter out current user from members
  - Display other participant's name for DM conversations

#### 4. `src/features/portal/workspace/ConversationListSidebar.tsx`

**Changes:**

- **BUG-005:** Add initial tab state based on persisted conversation
  - Add `getInitialTab()` helper function
  - Read from localStorage ("conversation-storage") to determine initial tab
  - Initialize `tab` state with correct value (no default "categories")

- **BUG-006:** Sync parent tab on mount
  - Add `onTabChange` prop to interface
  - Add useEffect to call `onTabChange` on mount
  - Map internal tab ("categories"/"contacts") to parent tab ("messages"/"contacts")
  - Call `onTabChange("contacts")` when restoring DM conversation

- **BUG-007:** Add internal state for category highlighting
  - Add `internalSelectedCategoryId` state
  - Update `handleGroupSelect` to set internal state immediately
  - Update UI render to check `internalSelectedCategoryId || selectedCategoryId`

#### 5. `src/features/portal/workspace/WorkspaceView.tsx`

**Changes:**

- **BUG-005:** Pass onTabChange prop
  - Destructure `leftTab` and `setLeftTab` from props
  - Pass `onTabChange={setLeftTab}` to ConversationListSidebar (both mobile and desktop)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng dependencies hiện có)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                        | Lựa chọn                                                             | HUMAN Decision             |
| --- | --------------------------------------------- | -------------------------------------------------------------------- | -------------------------- |
| 1   | BUG-002: Scroll behavior khi đổi conversation | (A) `behavior: 'instant'`<br>(B) `useLayoutEffect` pre-set position  | ✅ **B**                   |
| 2   | BUG-003: Empty state strategy                 | (A) Reset selection on tab switch<br>(B) Separate state for group/DM | ✅ **A**                   |
| 3   | BUG-001: Scroll button threshold              | Current: 100px<br>Suggestion: 150px or 200px?                        | ✅ **150px**               |
| 4   | Priority order                                | Fix tất cả cùng lúc hay theo thứ tự priority?                        | ✅ **Fix tất cả cùng lúc** |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                                | Status         |
| --------------------------------------- | -------------- |
| Đã review Bug Analysis                  | ✅ Đã review   |
| Đã điền Pending Decisions               | ✅ Đã điền     |
| Analysis chính xác                      | ✅ Đã xác nhận |
| **APPROVED để tạo Implementation Plan** | ✅ APPROVED    |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-01-30

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tạo Implementation Plan nếu mục "APPROVED để tạo Implementation Plan" = ⬜ CHƯA APPROVED**
