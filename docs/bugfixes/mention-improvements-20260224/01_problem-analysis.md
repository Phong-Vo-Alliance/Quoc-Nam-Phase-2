# [BƯỚC 1] Problem Analysis - Mention Feature Issues

> **Document:** Problem Analysis  
> **Date:** 2026-02-24  
> **Status:** ✅ COMPLETED (Extended to 11 issues)

---

## 🚨 Problem Summary

Total **11 issues** identified and fixed in mention feature:

### Original Issues (1-5):

| #   | Problem                      | Severity | Component(s)        | Impact          | Status   |
| --- | ---------------------------- | -------- | ------------------- | --------------- | -------- |
| 1   | Self-mention visibility      | Medium   | MentionInput/Inline | UX confusion    | ✅ Fixed |
| 2   | Tab key not working          | Low      | MentionInput/Inline | UX annoyance    | ✅ Fixed |
| 3   | Text duplication on insert   | High     | MentionInput/Inline | Data corruption | ✅ Fixed |
| 4   | Multi-line paste @ detection | Medium   | MentionInput/Inline | UX limitation   | ✅ Fixed |
| 5   | Dropdown z-index conflict    | Medium   | MentionDropdown     | UI blocking     | ✅ Fixed |

### Extended Session Issues (6-11):

| #   | Problem                    | Severity | Component(s)       | Impact         | Status   |
| --- | -------------------------- | -------- | ------------------ | -------------- | -------- |
| 6   | Cursor lag when typing @   | High     | MentionInputInline | @ not detected | ✅ Fixed |
| 7   | Dropdown position overflow | Medium   | MentionInputInline | UI clipping    | ✅ Fixed |
| 8   | Input cleared before send  | High     | MentionInputInline | Data loss      | ✅ Fixed |
| 9   | Search query not replaced  | Medium   | MentionInputInline | Extra chars    | ✅ Fixed |
| 10  | Missing data-testid        | Low      | MentionInputInline | E2E testing    | ✅ Fixed |
| 11  | Mentions lose styling      | High     | MentionInputInline | Visual broken  | ✅ Fixed |

---

## 📋 Detailed Problem Analysis

### Problem 1: Self-mention visibility

**Issue:** Khi gõ @ thấy luôn cả tên của bản thân. Chỉ thấy người khác trong conversation thôi.

**Current Behavior:**

```typescript
// In MentionInput.tsx line ~125-135
const filteredMembers = React.useMemo(() => {
  if (!mentionSearchQuery) return members; // 🚨 Includes current user

  const query = mentionSearchQuery.toLowerCase();
  return members.filter((member) => {
    const fullName = (
      member.userInfo.fullName || member.userName
    ).toLowerCase();
    const identifier = (member.userInfo.identifier || "").toLowerCase();
    return fullName.includes(query) || identifier.includes(query);
  });
}, [members, mentionSearchQuery]);
```

**Expected Behavior:**

- Current user should be filtered out from mention dropdown
- Only show other conversation members

**Root Cause:**

- No filtering logic for current user ID
- Need to compare `member.userId` with current user ID from auth store

---

### Problem 2: Tab key support

**Issue:** Click tab để xác nhận chọn tương tự phím enter luôn.

**Current Behavior:**

```typescript
// In MentionInput.tsx line ~236-248
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown) return;

    if (e.key === "ArrowDown") {
      /* ... */
    } else if (e.key === "ArrowUp") {
      /* ... */
    } else if (e.key === "Enter") {
      /* ... */
    } else if (e.key === "Escape") {
      /* ... */
    }
    // 🚨 Missing Tab key handling
  },
  [
    /* ... */
  ],
);
```

**Expected Behavior:**

- Tab key should behave same as Enter key for mention selection
- Should prevent default Tab behavior when dropdown is open

**Root Cause:**

- Missing `e.key === "Tab"` condition in handleKeyDown

---

### Problem 3: Text duplication on insert

**Issue:** Khi đoạn text có text trước khi chọn @ sau khi chọn xong thấy nhảy ra nội dung bị sai.

**Example:**

- Original: "dạ cậu anh @Kho hàng quốc nam đồ thịt tối nay về kho chế Huyền"
- User inserts @ after "cậu": "dạ cậu @"
- After selection: "dạ cậu dạ cậu @ anh @KHO HÀNG QUỐC NAM đồ thịt..."

**Current Behavior:**

```typescript
// In MentionInput.tsx line ~175-190
const handleMentionSelect = useCallback(
  (member: ConversationMember) => {
    if (mentionStartIndex === -1) return;

    const fullName = member.userInfo.fullName || member.userName;
    const mentionText = `@${fullName}`;

    // 🚨 Potential issue here with position calculation
    const beforeMention = value.slice(0, mentionStartIndex);
    const afterMention = value.slice(inputRef.current?.selectionStart || 0);

    const newValue = `${beforeMention}${mentionText} ${afterMention}`;
    onChange(newValue);
  },
  [
    /* ... */
  ],
);
```

**Root Cause:**

- Incorrect position calculation between `mentionStartIndex` and current cursor position
- Should use cursor position instead of `inputRef.current?.selectionStart` for afterMention
- Need to track mention end position properly

---

### Problem 4: Multi-line paste @ detection

**Issue:** Khi copy text vào ô Nhập tin nhắn (text có dấu xuống dòng) gõ @ không thấy dropdown mention hiện ra.

**Current Behavior:**

```typescript
// In MentionInput.tsx line ~137-165
const handleInputChange = useCallback(
  (newValue: string) => {
    onChange(newValue);

    if (!inputRef.current) return;
    const cursorPosition = inputRef.current.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
      // 🚨 May not handle newlines correctly
      if (lastAtIndex === 0 || /\s/.test(charBeforeAt)) {
        const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);
        if (!/\s/.test(searchQuery)) {
          /* show dropdown */
        }
      }
    }
  },
  [onChange],
);
```

**Root Cause:**

- Regex `/\s/` might not properly handle all whitespace including newlines after paste
- Need better detection of @ preceded by newline character `\n`

---

### Problem 5: Dropdown z-index conflict

**Issue:** Khi đóng ConversationDetailsPanel (bằng button chat-header-toggle-panel-button) thì dropdown bị che khuất.

**Current Behavior:**

```typescript
// In MentionDropdown.tsx line ~64-65
<div
  ref={dropdownRef}
  className="absolute z-50 w-80 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg bottom-0"
  style={position}
  data-testid="mention-dropdown"
>
```

**Root Cause:**

- z-index `z-50` might be lower than panel's z-index
- Position calculation doesn't account for layout changes when panel closes
- Need dynamic positioning based on available space

---

## 📊 Impact Assessment

| Problem | User Impact               | Frequency | Business Impact |
| ------- | ------------------------- | --------- | --------------- |
| #1      | Confusion, wrong tags     | High      | Low             |
| #2      | Workflow interruption     | Medium    | Low             |
| #3      | Data corruption/confusion | High      | Medium          |
| #4      | Feature inaccessible      | Medium    | Medium          |
| #5      | UI blocking               | Medium    | Low             |

---

## 🎯 Success Criteria

### Problem 1: Self-mention filtering

- ✅ Current user never appears in mention dropdown
- ✅ Filtering works for both MentionInput and MentionInputInline
- ✅ Empty state shows when only current user matches search

### Problem 2: Tab key support

- ✅ Tab key selects highlighted mention (same as Enter)
- ✅ Tab preventDefault when dropdown is open
- ✅ Normal tab behavior when dropdown closed

### Problem 3: Text insertion accuracy

- ✅ No text duplication when inserting mention mid-text
- ✅ Cursor positioned correctly after mention insertion
- ✅ Original text preserved exactly around mention

### Problem 4: Multi-line paste support

- ✅ @ detection works after pasting multi-line text
- ✅ Cursor position calculated correctly with newlines
- ✅ Dropdown appears when typing @ after any whitespace/newline

### Problem 5: Dropdown visibility

- ✅ Dropdown always visible above other UI elements
- ✅ Auto-repositioning when layout changes
- ✅ No overlap with panels or other components

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- `src/hooks/queries/useCurrentUser.ts` - Get current user for filtering
- `src/features/portal/components/chat/__tests__/MentionInput.test.tsx` - Test coverage
- `src/features/portal/components/chat/__tests__/MentionDropdown.test.tsx` - Test coverage

### Files sẽ sửa đổi:

- `src/features/portal/components/chat/MentionInput.tsx`
  - Add current user filtering in filteredMembers
  - Add Tab key handling in handleKeyDown
  - Fix text insertion logic in handleMentionSelect
  - Improve @ detection for multi-line text
- `src/features/portal/components/chat/MentionInputInline.tsx`
  - Apply same fixes as MentionInput
  - Handle inline mention positioning conflicts
- `src/features/portal/components/chat/MentionDropdown.tsx`
  - Increase z-index to prevent overlap
  - Add dynamic positioning logic

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng existing dependencies)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                    | Lựa chọn                   | HUMAN Decision      |
| --- | ------------------------- | -------------------------- | ------------------- |
| 1   | Z-index cho dropdown      | z-[100], z-[200], z-[999]? | ✅ **z-[100]**      |
| 2   | Current user detection    | useAuthStore vs hook?      | ✅ **useAuthStore** |
| 3   | Dropdown reposition delay | 0ms, 100ms, 200ms?         | ✅ **0ms**          |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** [MINH ĐÃ DUYỆT]  
**Date:** 2026-02-24

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để thực thi" = ⬜ CHƯA APPROVED**

---

## 📋 Extended Session Problems (6-11)

### Problem 6: Cursor lag when typing @

**Issue:** Khi gõ `@` ở cuối text, cursor position chưa cập nhật kịp nên không detect được.

**Root Cause:** `getCursorPosition()` trả về vị trí cũ khi text đã có `@` ở cuối.

**Fix:** Thêm fallback check `text.endsWith("@") && cursorPos >= text.length - 1`.

---

### Problem 7: Dropdown position overflow

**Issue:** Dropdown bị clip bởi parent container khi dùng `position: absolute`.

**Fix:**

- Đổi sang `position: fixed` với z-[9999]
- Tính toán position dùng `getBoundingClientRect()` trực tiếp
- Thêm viewport constraint `Math.min/max` để giữ dropdown trong màn hình

---

### Problem 8: Input cleared before send success

**Issue:** Input bị clear ngay khi nhấn Enter, dù API send có thể fail.

**Fix:**

- Xóa `onChange("")`, `setMentions([])`, `innerHTML = ""` khỏi `handleKeyDown`
- Parent component clear via `value=""` prop sau khi send thành công
- Thêm `useEffect` sync mentions state khi parent clear value

---

### Problem 9: Search query text not replaced

**Issue:** Gõ `@T` chọn user, chỉ replace `@`, còn thừa chữ `T`.

**Fix:** Sửa slice từ `mentionStartIndex + 1` thành `mentionStartIndex + 1 + mentionSearchQuery.length`.

---

### Problem 10: Missing data-testid for e2e

**Issue:** Không có data-testid để Playwright test.

**Fix:**

- `data-testid="mention-input"` trên contentEditable
- `data-testid="mention-dropdown-container"` trên dropdown wrapper
- Đã có: `mention-dropdown`, `mention-item-{userId}`

---

### Problem 11: Existing mentions lose styling

**Issue:** Khi thêm mention mới, các mention cũ mất màu xanh vì `innerHTML = newHTML` replace toàn bộ.

**Root Cause:** Code dùng `getTextContent()` (plain text) rồi tạo HTML mới, mất hết `<span>` của mention cũ.

**Fix:** Rewrite `handleMentionSelect()` dùng Range API:

- Walk qua text nodes với `TreeWalker`
- Tìm exact text node chứa `@query`
- Dùng `Range.deleteContents()` + `Range.insertNode()` chỉ replace phần đó
- Các mention `<span>` cũ được giữ nguyên
