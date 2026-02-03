# [BƯỚC 1] Requirements: Message Date Separators

> **Feature:** Date separators in chat messages  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Created:** 2026-02-02

---

## 📋 Functional Requirements

### FR-1: Date Grouping Logic

**Requirement:**  
Messages được group theo ngày gửi, hiển thị separator giữa các nhóm.

**Grouping rules:**

```
Messages:
  - 1/2/2026 09:00 → Group "1/2/2026"
  - 1/2/2026 15:00 → Group "1/2/2026"
  - 2/2/2026 08:00 → Group "Hôm nay" (nếu hôm nay là 2/2)
  - 2/2/2026 17:00 → Group "Hôm nay"
```

**Acceptance Criteria:**

- ✅ Messages cùng ngày (date part) thuộc same group
- ✅ Separator hiển thị TRƯỚC first message của mỗi group
- ✅ Messages hiển thị theo thứ tự cũ → mới (bottom = newest)

### FR-2: Date Label Format

**Requirement:**  
Label hiển thị dựa trên khoảng cách với hôm nay:

| Khoảng cách    | Label               | Ví dụ                 |
| -------------- | ------------------- | --------------------- |
| Hôm nay        | "Hôm nay"           | -                     |
| Hôm qua        | "Hôm qua"           | -                     |
| 2-6 ngày trước | "Thứ X, DD/MM/YYYY" | "Thứ Năm, 30/01/2026" |
| > 6 ngày       | "DD/MM/YYYY"        | "25/01/2026"          |

**Acceptance Criteria:**

- ✅ Hôm nay → "Hôm nay"
- ✅ Hôm qua → "Hôm qua"
- ✅ Trong tuần → "Thứ X, DD/MM/YYYY"
- ✅ Xa hơn → "DD/MM/YYYY"

### FR-3: Timezone Handling

**Requirement:**  
Sử dụng local timezone của user để group messages.

**Acceptance Criteria:**

- ✅ Message timestamp converted to local time
- ✅ "Hôm nay" based on local date, not server date

---

## 🎨 UI Requirements

### UI-1: Separator Design

**Visual specs:**

```
         ┌─────────────────┐
         │    1/2/2026     │  ← Centered, gray text
         └─────────────────┘
                ↓
    ┌─────────────────────────┐
    │ [Message content]       │
    └─────────────────────────┘
```

**Styling:**

- Text: gray-500, text-sm, font-medium
- Background: transparent hoặc subtle gray
- Position: centered
- Margin: 16px top, 8px bottom

### UI-2: Responsive Design

**Requirements:**

- Desktop: Full width centered
- Mobile: Full width centered
- Sticky behavior: NO (separator scrolls with messages)

---

## 🔧 Technical Requirements

### Tech-1: Message Grouping Algorithm

**File:** `src/features/portal/workspace/ChatMainContainer.tsx`

**Approach:**

```tsx
const groupedMessages = useMemo(() => {
  const groups: { date: string; messages: Message[] }[] = [];

  messages.forEach((msg) => {
    const msgDate = formatDateSeparator(msg.sentAt); // ✅ Field: sentAt (from API)
    const lastGroup = groups[groups.length - 1];

    if (lastGroup && lastGroup.date === msgDate) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: msgDate, messages: [msg] });
    }
  });

  return groups;
}, [messages]);
```

### Tech-2: Date Formatting Utility

**File:** `src/utils/date.ts` (new or existing)

**Functions needed:**

```tsx
// Convert timestamp to date separator label
formatDateSeparator(date: Date | string): string

// Check if date is today
isToday(date: Date): boolean

// Check if date is yesterday
isYesterday(date: Date): boolean

// Format with weekday (Thứ Hai, 1/2/2026)
formatWithWeekday(date: Date): string
```

### Tech-3: Component Structure

**New component:** `MessageDateSeparator.tsx`

```tsx
interface MessageDateSeparatorProps {
  date: string; // Already formatted label
}

export default function MessageDateSeparator({ date }: Props) {
  return (
    <div className="flex items-center justify-center my-4">
      <span className="text-sm text-gray-500 font-medium px-4 py-1 bg-gray-100 rounded-full">
        {date}
      </span>
    </div>
  );
}
```

---

## 🔒 Security Requirements

**No security implications** - UI only feature

---

## 📊 Performance Requirements

### Perf-1: Grouping Performance

**Requirements:**

- Grouping algorithm: O(n) complexity
- Use `useMemo` to avoid re-compute on every render
- Dependencies: `[messages]` only

### Perf-2: Date Formatting

**Requirements:**

- Cache formatted dates (same date = same label)
- Avoid calling `new Date()` multiple times for same timestamp

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                       | Lựa chọn                      | HUMAN Decision            |
| --- | ---------------------------- | ----------------------------- | ------------------------- |
| 1   | Sticky separator khi scroll? | Yes/No?                       | ⬜ **Yes**                |
| 2   | Separator background color?  | transparent, gray-100, white? | ⬜ **gray-100**           |
| 3   | Message API field name?      | sentAt ✅ (confirmed)         | ✅ **sentAt** (confirmed) |
| 4   | Format "Thứ Hai" hay "T2"?   | Full name or short?           | ⬜ **Full name**          |

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

- `src/components/chat/MessageDateSeparator.tsx` - Date separator component
- `src/utils/date.ts` (or add to existing) - Date formatting utilities

### Files sẽ sửa đổi:

- `src/features/portal/workspace/ChatMainContainer.tsx`
  - Add message grouping logic
  - Render MessageDateSeparator between groups

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có - use native Date API)

---

## 🧪 Testing Requirements Preview

**Unit tests needed:**

- `formatDateSeparator()` - All date format cases
- `isToday()`, `isYesterday()` - Edge cases (midnight boundary)
- Message grouping logic - Multiple days, same day, empty array

**Component tests needed:**

- MessageDateSeparator renders with correct text
- ChatMainContainer renders separators at correct positions

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                           | Status           |
| ---------------------------------- | ---------------- |
| Đã review Functional Requirements  | ⬜ Chưa review   |
| Đã review UI Requirements          | ⬜ Chưa review   |
| Đã review Technical Approach       | ⬜ Chưa review   |
| Đã điền Pending Decisions          | ⬜ Chưa điền     |
| **APPROVED để chuyển sang BƯỚC 2** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [CHƯA DUYỆT]  
**Date:** \***\*\_\_\_\*\***

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tiếp tục BƯỚC 2 nếu mục này = ⬜ CHƯA APPROVED**
