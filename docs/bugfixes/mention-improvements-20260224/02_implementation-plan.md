# [BƯỚC 2] Implementation Plan - Mention Bug Fixes

> **Document:** Implementation Plan  
> **Date:** 2026-02-24  
> **Status:** ⏳ PENDING HUMAN APPROVAL

---

## 🎯 Implementation Strategy

**Approach:** Fix issues incrementally, one problem per commit for easy rollback if needed.

**Implementation Order:** High impact → Low impact

1. Problem 3: Text duplication (High impact)
2. Problem 1: Self-mention filtering (Medium impact)
3. Problem 4: Multi-line paste detection (Medium impact)
4. Problem 5: Dropdown z-index (Medium impact)
5. Problem 2: Tab key support (Low impact)

---

## 📋 Detailed Implementation Steps

### Step 1: Fix Text Duplication Issue (Problem 3)

**Target:** `MentionInput.tsx` & `MentionInputInline.tsx`

**Current Issue Location:**

```typescript
// Line ~175-190 in MentionInput.tsx
const handleMentionSelect = useCallback((member: ConversationMember) => {
  // 🚨 Incorrect position calculation
  const beforeMention = value.slice(0, mentionStartIndex);
  const afterMention = value.slice(inputRef.current?.selectionStart || 0);
  const newValue = `${beforeMention}${mentionText} ${afterMention}`;
}, []);
```

**Fix Implementation:**

```typescript
const handleMentionSelect = useCallback(
  (member: ConversationMember) => {
    if (mentionStartIndex === -1) return;

    const fullName = member.userInfo.fullName || member.userName;
    const mentionText = `@${fullName}`;

    // 🔧 FIX: Calculate proper end position of @ query
    const cursorPosition = inputRef.current?.selectionStart || 0;
    const beforeMention = value.slice(0, mentionStartIndex);

    // Find end of current mention search (after @)
    let mentionEndIndex = cursorPosition;
    const textAfterAt = value.slice(mentionStartIndex + 1);
    const spaceIndex = textAfterAt.search(/\s/);

    if (spaceIndex !== -1) {
      mentionEndIndex = mentionStartIndex + 1 + spaceIndex;
    } else {
      mentionEndIndex = cursorPosition;
    }

    const afterMention = value.slice(mentionEndIndex);
    const newValue = `${beforeMention}${mentionText} ${afterMention}`;

    onChange(newValue);

    // Update cursor position
    setTimeout(() => {
      if (inputRef.current) {
        const newCursorPos = mentionStartIndex + mentionText.length + 1;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  },
  [mentionStartIndex, value, onChange],
);
```

**Changes Required:**

- Update `MentionInput.tsx` lines ~175-210
- Update `MentionInputInline.tsx` similar logic (find exact lines)
- Add proper end position calculation for mention search area

---

### Step 2: Add Current User Filtering (Problem 1)

**Target:** `MentionInput.tsx` & `MentionInputInline.tsx`

**Dependencies:**

- Check if `useCurrentUser` hook exists or need to create
- Use auth store to get current user ID

**Implementation:**

```typescript
// Add import
import { useAuthStore } from "@/stores/authStore";

// Inside component
const { user: currentUser } = useAuthStore();

// Update filteredMembers
const filteredMembers = React.useMemo(() => {
  // Filter out current user first
  const otherMembers = members.filter(
    (member) => member.userId !== currentUser?.id,
  );

  if (!mentionSearchQuery) return otherMembers;

  const query = mentionSearchQuery.toLowerCase();
  return otherMembers.filter((member) => {
    const fullName = (
      member.userInfo.fullName || member.userName
    ).toLowerCase();
    const identifier = (member.userInfo.identifier || "").toLowerCase();
    return fullName.includes(query) || identifier.includes(query);
  });
}, [members, mentionSearchQuery, currentUser?.id]);
```

**Changes Required:**

- Update `MentionInput.tsx` lines ~119-135
- Update `MentionInputInline.tsx` similar filteredMembers logic
- Add currentUser import and usage

---

### Step 3: Fix Multi-line Paste Detection (Problem 4)

**Target:** `MentionInput.tsx` & `MentionInputInline.tsx`

**Current Issue:**

```typescript
// Line ~152 in handleInputChange
if (lastAtIndex === 0 || /\s/.test(charBeforeAt)) {
  // 🚨 /\s/ may not catch all cases after paste
}
```

**Fix Implementation:**

```typescript
const handleInputChange = useCallback(
  (newValue: string) => {
    onChange(newValue);

    if (!inputRef.current) return;
    const cursorPosition = inputRef.current.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1) {
      const charBeforeAt = textBeforeCursor[lastAtIndex - 1];

      // 🔧 FIX: Improved whitespace detection including newlines
      const isValidAtPosition =
        lastAtIndex === 0 ||
        /[\s\n\r\t]/.test(charBeforeAt) ||
        charBeforeAt === undefined;

      if (isValidAtPosition) {
        const searchQuery = textBeforeCursor.slice(lastAtIndex + 1);

        // Check if query contains whitespace (means @ is not current)
        if (!/[\s\n\r\t]/.test(searchQuery)) {
          setShowMentionDropdown(true);
          setMentionSearchQuery(searchQuery);
          setMentionStartIndex(lastAtIndex);
          setSelectedMentionIndex(0);
          return;
        }
      }
    }

    setShowMentionDropdown(false);
  },
  [onChange],
);
```

**Changes Required:**

- Update `MentionInput.tsx` handleInputChange logic
- Update `MentionInputInline.tsx` similar logic
- Improve regex to handle `\n`, `\r`, `\t` characters

---

### Step 4: Fix Dropdown Z-Index (Problem 5)

**Target:** `MentionDropdown.tsx`

**Current Issue:**

```typescript
// Line ~64
className = "absolute z-50 w-80 max-h-60...";
```

**Fix Implementation:**

```typescript
// Update z-index and add better positioning
className =
  "absolute z-[200] w-80 max-h-60 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg";

// Add dynamic positioning logic
const [calculatedPosition, setCalculatedPosition] = useState(position);

useEffect(() => {
  if (!dropdownRef.current || !position) return;

  const dropdown = dropdownRef.current;
  const rect = dropdown.getBoundingClientRect();
  const viewportHeight = window.innerHeight;

  // Check if dropdown would be cut off at bottom
  if (rect.bottom > viewportHeight) {
    setCalculatedPosition({
      ...position,
      top: position.top - rect.height - 40, // Position above input
    });
  } else {
    setCalculatedPosition(position);
  }
}, [position]);
```

**Changes Required:**

- Update `MentionDropdown.tsx` z-index from `z-50` to `z-[200]`
- Add dynamic positioning logic
- Test with ConversationDetailsPanel open/close

---

### Step 5: Add Tab Key Support (Problem 2)

**Target:** `MentionInput.tsx` & `MentionInputInline.tsx`

**Current Issue:**

```typescript
// Missing Tab key in handleKeyDown
else if (e.key === "Enter") {
  e.preventDefault();
  // ...
}
// 🚨 No Tab key handling
```

**Fix Implementation:**

```typescript
const handleKeyDown = useCallback(
  (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showMentionDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedMentionIndex((prev) =>
        Math.min(prev + 1, filteredMembers.length - 1),
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedMentionIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === "Enter" || e.key === "Tab") {
      // 🔧 ADD Tab support
      e.preventDefault();
      if (filteredMembers[selectedMentionIndex]) {
        handleMentionSelect(filteredMembers[selectedMentionIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setShowMentionDropdown(false);
    }
  },
  [
    showMentionDropdown,
    filteredMembers,
    selectedMentionIndex,
    handleMentionSelect,
  ],
);
```

**Changes Required:**

- Update `MentionInput.tsx` handleKeyDown logic
- Update `MentionInputInline.tsx` similar logic
- Add `|| e.key === "Tab"` to Enter condition

---

## 🧪 Testing Strategy Per Step

### Step 1: Text Duplication Tests

```typescript
describe("Text duplication fix", () => {
  test("inserting mention mid-text preserves original content", () => {
    // Setup: "dạ cậu anh đồ thịt"
    // Action: Insert @ after "cậu", select mention
    // Expected: "dạ cậu @Tên User anh đồ thịt" (no duplication)
  });

  test("cursor positioned correctly after mention insertion", () => {
    // Verify cursor is after mention + space
  });
});
```

### Step 2: Current User Filter Tests

```typescript
describe("Current user filtering", () => {
  test("current user never appears in mention dropdown", () => {
    // Mock currentUser.id = "123"
    // Mock members including user 123
    // Expect filteredMembers to exclude 123
  });

  test("search query filters but still excludes current user", () => {
    // Test search matches current user name but still excluded
  });
});
```

### Step 3: Multi-line Paste Tests

```typescript
describe("Multi-line paste detection", () => {
  test("@ detected after newline character", () => {
    // Paste "line1\nline2" then type @
    // Expect dropdown to show
  });

  test("@ detected after carriage return", () => {
    // Test \r character
  });
});
```

### Step 4: Z-Index Tests

```typescript
describe("Dropdown visibility", () => {
  test("dropdown visible when panel is closed", async () => {
    // Test ConversationDetailsPanel toggle
    // Verify dropdown z-index higher than panel
  });
});
```

### Step 5: Tab Key Tests

```typescript
describe("Tab key support", () => {
  test("tab key selects mention like enter", () => {
    // Type @, use ArrowDown, press Tab
    // Expect mention selected
  });

  test("tab prevented when dropdown open", () => {
    // Verify preventDefault called when dropdown visible
  });
});
```

---

## 🔄 Rollback Strategy

Each step is independent, so rollback can be per-commit:

| Step | Rollback Impact                                  | Risk Level |
| ---- | ------------------------------------------------ | ---------- |
| 1    | Text insertion reverts to current buggy behavior | Low        |
| 2    | Current user shows in dropdown again             | Low        |
| 3    | Multi-line paste @ detection fails               | Low        |
| 4    | Dropdown may overlap with panels                 | Low        |
| 5    | Tab key does normal behavior                     | None       |

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- `src/features/portal/components/chat/__tests__/MentionInput.test.tsx` - Comprehensive test coverage
- `src/features/portal/components/chat/__tests__/MentionInputInline.test.tsx` - Inline component tests
- `src/features/portal/components/chat/__tests__/MentionDropdown.test.tsx` - Dropdown component tests

### Files sẽ sửa đổi:

- `src/features/portal/components/chat/MentionInput.tsx`
  - Lines ~119-135: Add current user filtering
  - Lines ~137-165: Improve @ detection for multi-line paste
  - Lines ~175-210: Fix text insertion duplication logic
  - Lines ~236-248: Add Tab key support
- `src/features/portal/components/chat/MentionInputInline.tsx`
  - Apply equivalent fixes to inline version
  - Update filteredMembers logic for current user filtering
  - Update keyboard handling for Tab support
- `src/features/portal/components/chat/MentionDropdown.tsx`
  - Line ~64: Update z-index from `z-50` to `z-[200]`
  - Add dynamic positioning logic to prevent overlap

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - sử dụng existing `useAuthStore`)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                 | Lựa chọn                   | HUMAN Decision              |
| --- | ---------------------- | -------------------------- | --------------------------- |
| 1   | Z-index cho dropdown   | z-[100], z-[200], z-[999]? | ✅ **z-[100]**              |
| 2   | Current user ID source | useAuthStore.user.id?      | ✅ **useAuthStore.user.id** |
| 3   | Implementation order   | Thứ tự như trên OK?        | ✅ **OK như trên**          |

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
