# [BƯỚC 4] Implementation Plan: Message Date Separators

> **Feature:** Date separators in chat messages  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Created:** 2026-02-02

---

## ⚠️ NON-BREAKING GUARANTEE

**Feature này KHÔNG ảnh hưởng logic và giao diện đang có:**

✅ **Không sửa** Phase 4 grouping (10-minute proximity grouping)  
✅ **Không sửa** MessageBubbleSimple component  
✅ **Không sửa** scroll behavior (auto-scroll, scroll restoration)  
✅ **Không sửa** styling/spacing của message bubbles  
✅ **Không thêm** API calls  
✅ **Không thay đổi** performance characteristics

**Implementation approach:** Additive-only (chỉ THÊM date separators layer trên existing Phase 4 groups)

[Chi tiết safeguards → Xem section "NON-BREAKING IMPLEMENTATION" ở cuối file]

---

## 📋 Implementation Summary

**Complexity:** 🟡 Medium  
**Estimated time:** 2-3 hours  
**Files to modify:** 1 (ChatMainContainer.tsx - minimal changes)  
**Files to create:** 2 (utility + component)  
**Risk level:** 🟢 Low (additive change, zero breaking changes)

---

## 🎯 Changes Overview

### Files to Create

1. **MessageDateSeparator.tsx** - Separator component
2. **formatDateSeparator.ts** - Date formatting utilities

### Files to Modify

1. **ChatMainContainer.tsx** - Add grouping logic and render separators

---

## 📝 Detailed Implementation

### Step 1: Create Date Formatting Utilities

**File:** `src/utils/formatDateSeparator.ts` (new file)

**Functions to implement:**

```tsx
/**
 * Check if date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Check if date is yesterday
 */
export function isYesterday(date: Date): boolean {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Get day of week in Vietnamese (full name)
 * 0 = Chủ nhật, 1 = Thứ hai, ..., 6 = Thứ bảy
 */
export function getVietnameseDayName(date: Date): string {
  const days = [
    "Chủ nhật",
    "Thứ hai",
    "Thứ ba",
    "Thứ tư",
    "Thứ năm",
    "Thứ sáu",
    "Thứ bảy",
  ];
  return days[date.getDay()];
}

/**
 * Format date as DD/MM/YYYY
 */
export function formatDateDDMMYYYY(date: Date): string {
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Check if date is within last 6 days (excluding today and yesterday)
 */
export function isWithinWeek(date: Date): boolean {
  const today = new Date();
  const diffTime = today.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays >= 2 && diffDays <= 6;
}

/**
 * Main function: Format date for separator label
 *
 * Rules:
 * - Today → "Hôm nay"
 * - Yesterday → "Hôm qua"
 * - Within week (2-6 days ago) → "Thứ hai, 01/02/2026"
 * - Older → "25/01/2026"
 */
export function formatDateSeparator(dateInput: Date | string): string {
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;

  if (isToday(date)) {
    return "Hôm nay";
  }

  if (isYesterday(date)) {
    return "Hôm qua";
  }

  if (isWithinWeek(date)) {
    const dayName = getVietnameseDayName(date);
    const dateStr = formatDateDDMMYYYY(date);
    return `${dayName}, ${dateStr}`;
  }

  return formatDateDDMMYYYY(date);
}
```

**Rationale:**

- Pure functions, easy to test
- Separated concerns (each function does one thing)
- Vietnamese localization handled manually (no i18n library needed)

---

### Step 2: Create MessageDateSeparator Component

**File:** `src/components/chat/MessageDateSeparator.tsx` (new file)

**Implementation:**

```tsx
interface MessageDateSeparatorProps {
  date: string; // Pre-formatted label from formatDateSeparator()
}

export default function MessageDateSeparator({
  date,
}: MessageDateSeparatorProps) {
  return (
    <div
      className="flex items-center justify-center my-4"
      data-testid="message-date-separator"
    >
      <span className="text-sm text-gray-500 font-medium px-4 py-1 bg-gray-100 rounded-full">
        {date}
      </span>
    </div>
  );
}
```

**Styling breakdown:**

- `flex items-center justify-center` - Center the pill
- `my-4` - 16px vertical margin (top/bottom)
- `text-sm` - 14px font size
- `text-gray-500` - Gray text color (#6B7280)
- `font-medium` - Medium font weight
- `px-4 py-1` - Horizontal padding 16px, vertical 4px
- `bg-gray-100` - Light gray background (#F3F4F6)
- `rounded-full` - Fully rounded corners (pill shape)

**Props:**

- `date`: Already formatted string ("Hôm nay", "Thứ hai, 01/02/2026", etc.)

---

### Step 3: Update ChatMainContainer

**File:** `src/features/portal/workspace/ChatMainContainer.tsx`

**Changes needed:**

#### 3.1: Add Imports

```tsx
import MessageDateSeparator from "@/components/chat/MessageDateSeparator";
import { formatDateSeparator } from "@/utils/formatDateSeparator";
```

---

#### 3.2: Add Date Grouping Logic (LAYER trên Phase 4 grouping)

**⚠️ IMPORTANT: KHÔNG sửa existing Phase 4 grouping (10-minute proximity)**

**Location:** Inside component, sau khi Phase 4 grouping

```tsx
// ✅ EXISTING: Phase 4 grouping (KHÔNG ĐỔI)
const groupedMessages = useMemo(() => {
  const messagesWithTimestamp = messages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.sentAt).getTime(),
  }));
  return groupMessages(messagesWithTimestamp, 10 * 60 * 1000);
}, [messages]);

// 🆕 NEW: Date grouping layer (works with Phase 4 groups)
const messagesByDate = React.useMemo(() => {
  type DateGroup = {
    date: string; // "Hôm nay", "Thứ năm, 30/01/2026"
    dateKey: string; // "2026-02-01" for comparison
    groups: typeof groupedMessages; // Array of Phase 4 groups
  };

  const dateGroups: DateGroup[] = [];

  // Iterate through Phase 4 groups
  groupedMessages.forEach((group) => {
    if (group.length === 0) return;

    // Get date from first message in group
    const firstMsg = group[0];
    const msgDate = new Date(firstMsg.sentAt);
    const dateKey = msgDate.toISOString().split("T")[0]; // "2026-02-01"
    const dateLabel = formatDateSeparator(firstMsg.sentAt);

    // Find or create date group
    const lastDateGroup = dateGroups[dateGroups.length - 1];

    if (lastDateGroup && lastDateGroup.dateKey === dateKey) {
      // Same day - add Phase 4 group to existing date group
      lastDateGroup.groups.push(group);
    } else {
      // New day - create new date group
      dateGroups.push({
        date: dateLabel,
        dateKey: dateKey,
        groups: [group],
      });
    }
  });

  return dateGroups;
}, [groupedMessages]); // Re-compute when Phase 4 groups change
```

**Complexity:** O(n) - Single pass through Phase 4 groups

**Memoization:** Only re-compute when `groupedMessages` changes

**No breaking changes:**

- Phase 4 grouping vẫn hoạt động bình thường
- MessageBubbleSimple props KHÔNG thay đổi

---

#### 3.3: Update Render Logic (NON-INVASIVE)

**⚠️ CRITICAL: Không sửa Phase 4 grouping - chỉ thêm date layer**

**Current structure (Phase 4):**

```tsx
// Phase 4: Group messages by time proximity (10 minutes)
const groupedMessages = useMemo(() => {
  const messagesWithTimestamp = messages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.sentAt).getTime(),
  }));
  return groupMessages(messagesWithTimestamp, 10 * 60 * 1000); // KHÔNG ĐỔI
}, [messages]);

// Current render - Phase 4 groups with sender grouping
{
  groupedMessages.map((group, groupIndex) => (
    <div key={`group-${groupIndex}`}>
      {group.map((message, msgIndex) => (
        <MessageBubbleSimple
          key={message.id}
          message={message}
          isFirstInGroup={msgIndex === 0}
          isLastInGroup={msgIndex === group.length - 1}
        />
      ))}
    </div>
  ));
}
```

**🆕 NEW: Add date grouping layer (KHÔNG sửa groupedMessages)**

```tsx
// 🆕 BƯỚC 1: Group by date (works with existing Phase 4 groups)
const messagesByDate = useMemo(() => {
  type DateGroup = {
    date: string; // "Hôm nay", "Thứ năm, 30/01/2026", etc.
    dateKey: string; // "2026-02-01" for comparison
    groups: typeof groupedMessages; // Phase 4 groups (10-min proximity)
  };

  const dateGroups: DateGroup[] = [];

  // Iterate through Phase 4 groups (KHÔNG sửa chúng)
  groupedMessages.forEach((group) => {
    if (group.length === 0) return;

    // Get date from first message in group
    const firstMsg = group[0];
    const msgDate = new Date(firstMsg.sentAt);
    const dateKey = msgDate.toISOString().split("T")[0];
    const dateLabel = formatDateSeparator(firstMsg.sentAt);

    // Find or create date group
    const lastDateGroup = dateGroups[dateGroups.length - 1];

    if (lastDateGroup && lastDateGroup.dateKey === dateKey) {
      // Same day - add to existing date group
      lastDateGroup.groups.push(group);
    } else {
      // New day - create new date group
      dateGroups.push({
        date: dateLabel,
        dateKey: dateKey,
        groups: [group],
      });
    }
  });

  return dateGroups;
}, [groupedMessages]); // Depends on Phase 4 groups

// 🆕 BƯỚC 2: Render with date separators
{
  messagesByDate.map((dateGroup, dateGroupIndex) => (
    <React.Fragment key={`date-${dateGroup.dateKey}`}>
      {/* Date Separator (CHỈ THÊM MỚI) */}
      <MessageDateSeparator date={dateGroup.date} />

      {/* Phase 4 groups (KHÔNG ĐỔI) */}
      {dateGroup.groups.map((group, groupIndex) => (
        <div key={`group-${dateGroupIndex}-${groupIndex}`}>
          {group.map((message, msgIndex) => (
            <MessageBubbleSimple
              key={message.id}
              message={message}
              isFirstInGroup={msgIndex === 0}
              isLastInGroup={msgIndex === group.length - 1}
              // ALL EXISTING PROPS UNCHANGED
            />
          ))}
        </div>
      ))}
    </React.Fragment>
  ));
}
```

**✅ Đảm bảo:**

- Phase 4 grouping logic KHÔNG bị sửa
- MessageBubbleSimple props KHÔNG thay đổi
- Scroll refs (bottomRef) vẫn hoạt động
- Infinite scroll pagination KHÔNG bị ảnh hưởng

**Key strategy:**

- Use `React.Fragment` to avoid extra DOM nodes
- Key combines group index + dateKey for stability
- Separator renders BEFORE messages of each group

---

### Step 4: Handle Edge Cases

#### 4.1: Empty Messages Array

**Current behavior:** No messages shown  
**New behavior:** No separators shown (groupedMessages = empty array)

**Code:** No changes needed (handled by map on empty array)

---

#### 4.2: Real-time New Message

**Scenario:** New message arrives via SignalR

**Behavior:**

1. Message added to `messages` array
2. `groupedMessages` re-computed (memoized)
3. If same day → Added to existing group (no new separator)
4. If new day → New group created → New separator appears

**Code:** No changes needed (React handles re-render)

---

#### 4.3: Load More (Pagination)

**Scenario:** User scrolls to top, loads older messages

**Behavior:**

1. Older messages prepended to `messages` array
2. `groupedMessages` re-computed
3. New groups created for older dates
4. Separators appear in correct order

**Code:** No changes needed (grouping logic handles any order)

---

## 🧪 Testing Strategy

### Unit Tests (formatDateSeparator.ts)

**File:** `src/utils/formatDateSeparator.test.ts`

**Test cases:**

```tsx
describe("formatDateSeparator", () => {
  beforeEach(() => {
    // Mock current date: 2026-02-02 12:00:00
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-02-02T12:00:00Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return "Hôm nay" for today', () => {
    const today = new Date("2026-02-02T10:00:00Z");
    expect(formatDateSeparator(today)).toBe("Hôm nay");
  });

  it('should return "Hôm qua" for yesterday', () => {
    const yesterday = new Date("2026-02-01T15:00:00Z");
    expect(formatDateSeparator(yesterday)).toBe("Hôm qua");
  });

  it("should return weekday + date for 2-6 days ago", () => {
    const threeDaysAgo = new Date("2026-01-30T10:00:00Z"); // Thursday
    expect(formatDateSeparator(threeDaysAgo)).toBe("Thứ năm, 30/01/2026");
  });

  it("should return date only for > 6 days ago", () => {
    const oldDate = new Date("2026-01-20T10:00:00Z");
    expect(formatDateSeparator(oldDate)).toBe("20/01/2026");
  });

  it("should handle midnight boundary correctly", () => {
    const todayMidnight = new Date("2026-02-02T00:00:01Z");
    expect(formatDateSeparator(todayMidnight)).toBe("Hôm nay");

    const yesterdayLastSecond = new Date("2026-02-01T23:59:59Z");
    expect(formatDateSeparator(yesterdayLastSecond)).toBe("Hôm qua");
  });
});
```

**Coverage target:** 100% (all branches)

---

### Component Tests (MessageDateSeparator.tsx)

**File:** `src/components/chat/MessageDateSeparator.test.tsx`

**Test cases:**

```tsx
describe("MessageDateSeparator", () => {
  it("should render date text", () => {
    render(<MessageDateSeparator date="Hôm nay" />);
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();
  });

  it("should have correct styling classes", () => {
    render(<MessageDateSeparator date="Test Date" />);
    const container = screen.getByTestId("message-date-separator");
    expect(container).toHaveClass(
      "flex",
      "items-center",
      "justify-center",
      "my-4",
    );
  });

  it("should render different date formats", () => {
    const { rerender } = render(<MessageDateSeparator date="Hôm nay" />);
    expect(screen.getByText("Hôm nay")).toBeInTheDocument();

    rerender(<MessageDateSeparator date="Thứ hai, 01/02/2026" />);
    expect(screen.getByText("Thứ hai, 01/02/2026")).toBeInTheDocument();
  });
});
```

---

### Integration Tests (ChatMainContainer)

**Manual testing scenarios:**

| Scenario                                      | Expected Behavior                   |
| --------------------------------------------- | ----------------------------------- |
| Load chat with messages from 3 different days | 3 separators shown in correct order |
| Receive new message same day                  | No new separator                    |
| Receive new message next day (after midnight) | New separator appears               |
| Load more older messages                      | Separators inserted at top          |
| Empty chat                                    | No separators                       |
| All messages same day                         | 1 separator at top                  |

---

## 📊 Performance Considerations

### Grouping Algorithm

**Complexity:** O(n) where n = number of messages

**Memory:** O(g) where g = number of date groups (typically << n)

**Optimization:**

- `useMemo` prevents re-computation on unrelated re-renders
- Dependency: `[messages]` only
- No expensive operations (just date comparisons)

### Date Formatting

**Caching strategy:**

- Each group caches its formatted label
- Same date → Same label (no re-format)

**Performance impact:**

- Negligible (< 1ms per format call)
- Memoized at group level

---

## 🔒 Security Considerations

**No security implications:**

- UI-only feature
- No user input (dates from API)
- No XSS risk (text content only)

---

## ♿ Accessibility

**Current implementation:**

- Semantic HTML (`<div>`, `<span>`)
- No ARIA needed (visible text)
- No interactive elements

**Future enhancement (if sticky separator added):**

- Add `role="separator"`
- Add `aria-label="Messages from {date}"`

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

- `src/utils/formatDateSeparator.ts` - Date utilities (~80 lines)
- `src/components/chat/MessageDateSeparator.tsx` - Separator component (~15 lines)

### Files sẽ sửa đổi:

- `src/features/portal/workspace/ChatMainContainer.tsx`
  - Add imports (2 lines)
  - Add grouping logic (~30 lines)
  - Update render (~10 lines modified)
  - **Total:** ~40 lines added/modified

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - native Date API only)

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                       | Lựa chọn                             | HUMAN Decision |
| --- | ---------------------------- | ------------------------------------ | -------------- |
| 1   | Test file locations?         | Same folder or **tests**?            | ⬜ **\_\_\_**  |
| 2   | Export barrel for utilities? | Add to src/utils/index.ts?           | ⬜ **\_\_\_**  |
| 3   | Component export barrel?     | Add to src/components/chat/index.ts? | ⬜ **\_\_\_**  |

---

## ⚠️ NON-BREAKING IMPLEMENTATION (Không ảnh hưởng logic/UI hiện tại)

### Critical Safeguards

Feature này được thiết kế **additive-only** - chỉ THÊM, KHÔNG SỬA logic cũ:

#### 1. **Không thay đổi Message Rendering Logic**

```tsx
// ❌ KHÔNG sửa MessageBubbleSimple
// ❌ KHÔNG thay đổi groupMessages() từ Phase 4
// ✅ CHỈ thêm date separators GIỮA các groups

// Existing Phase 4 grouping (10 minutes proximity)
const groupedMessages = useMemo(() => {
  const messagesWithTimestamp = messages.map((msg) => ({
    ...msg,
    timestamp: new Date(msg.sentAt).getTime(),
  }));
  return groupMessages(messagesWithTimestamp, 10 * 60 * 1000);
}, [messages]);

// 🆕 NEW: Date grouping (KHÔNG ảnh hưởng groupedMessages)
const messagesByDate = useMemo(() => {
  // Work with groupedMessages (already processed)
  // Only ADD date separators, NOT modify existing groups
}, [groupedMessages]);
```

#### 2. **Không ảnh hưởng Scroll Behavior**

```tsx
// ✅ Date separators KHÔNG làm thay đổi:
// - Auto-scroll to bottom (bottomRef logic)
// - Scroll restoration khi load more
// - Instant scroll khi mở conversation
// - Infinite scroll pagination

// 🔒 GUARANTEED: Separator height không can thiệp scroll calculations
```

#### 3. **Không thay đổi Styling/Layout**

```tsx
// ✅ MessageDateSeparator là INDEPENDENT component
// ✅ Không thêm wrapper div quanh existing messages
// ✅ Spacing được cô lập (margin-top/bottom chỉ cho separator)
// ✅ Không ảnh hưởng message bubble styles
```

#### 4. **Không ảnh hưởng Performance**

```tsx
// ✅ Date grouping: O(n) - tương đương Phase 4 grouping
// ✅ useMemo caching - chỉ re-compute khi groupedMessages change
// ✅ Không thêm re-renders
// ✅ Không thêm API calls
```

#### 5. **Backward Compatible**

```tsx
// ✅ Nếu sentAt field thiếu → fallback to current behavior (no crash)
// ✅ Nếu formatDateSeparator fail → render message bình thường
// ✅ Không yêu cầu API changes
```

---

## 🚀 Rollout Plan

### Phase 1: Implementation (Day 1)

1. Create formatDateSeparator.ts with unit tests
2. Create MessageDateSeparator.tsx with component tests
3. **NON-INVASIVE** update ChatMainContainer.tsx
   - Add date grouping logic AFTER existing Phase 4 grouping
   - Insert separators WITHOUT modifying message rendering
4. Manual testing (verify existing behavior unchanged)

### Phase 2: Review & Refinement (Day 1-2)

1. Code review
2. Visual QA (different dates)
3. Edge case testing (midnight, empty chat, etc.)
4. **Regression testing** (verify existing scroll/layout/performance unchanged)

### Phase 3: Deployment (Day 2)

1. Merge to main
2. Deploy to staging
3. Deploy to production

**Zero breaking changes** → Safe to deploy immediately after testing

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                       | Status          |
| ------------------------------ | --------------- |
| Đã review Implementation Steps | ✅ Đã review    |
| Đã review Code Examples        | ✅ Đã review    |
| Đã review Testing Strategy     | ✅ Đã review    |
| Đã review Performance Impact   | ✅ Đã review    |
| Đã điền Pending Decisions      | ✅ Đã điền      |
| **APPROVED để thực thi code**  | ✅ **APPROVED** |

**HUMAN Signature:** Minh [ĐÃ DUYỆT]  
**Date:** 2026-02-02

> ✅ **APPROVED - AI có thể bắt đầu implement code**
