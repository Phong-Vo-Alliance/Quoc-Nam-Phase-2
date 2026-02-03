# [BƯỚC 2A] Wireframe: Message Date Separators

> **Feature:** Date separators in chat messages  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Created:** 2026-02-02

---

## 📐 Component Specifications

### Component: MessageDateSeparator

**File:** `src/components/chat/MessageDateSeparator.tsx`

**Props:**

```tsx
interface MessageDateSeparatorProps {
  date: string; // Pre-formatted label: "Hôm nay", "Hôm qua", "Thứ Hai, 1/2/2026"
}
```

---

## 🎨 Visual Design

### Layout Structure

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                   Chat Container                    │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │         [ Date Separator ]                  │  │ ← Separator 1
│   └─────────────────────────────────────────────┘  │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │ 👤 User A                                   │  │
│   │ Message content...                          │  │
│   │                             09:30 ✓✓        │  │
│   └─────────────────────────────────────────────┘  │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │                                   User B 👤 │  │
│   │                          ...message content │  │
│   │                        ✓✓ 10:15             │  │
│   └─────────────────────────────────────────────┘  │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │         [ Date Separator ]                  │  │ ← Separator 2
│   └─────────────────────────────────────────────┘  │
│                                                     │
│   ┌─────────────────────────────────────────────┐  │
│   │ 👤 User A                                   │  │
│   │ New day message...                          │  │
│   │                             08:00 ✓✓        │  │
│   └─────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Separator Component Design

### Default State

```
     ┌───────────────────────────────────┐
     │                                   │
     │   ┌─────────────────────────┐    │
     │   │      Hôm nay            │    │ ← Centered pill
     │   └─────────────────────────┘    │
     │                                   │
     └───────────────────────────────────┘
          ↑                         ↑
       16px margin              16px margin
```

### Visual Specifications

**Container:**

- Width: `100%` (full width)
- Display: `flex`
- Justify: `center`
- Align: `center`
- Margin: `16px 0` (top/bottom)

**Pill/Badge:**

- Background: `bg-gray-100` (gray-100 per decision #2)
- Text color: `text-gray-500`
- Font size: `text-sm` (14px)
- Font weight: `font-medium`
- Padding: `px-4 py-1` (16px horizontal, 4px vertical)
- Border radius: `rounded-full`
- No border, no shadow

---

## 📏 Responsive Behavior

### Desktop (≥ 768px)

```
┌────────────────────────────────────────────────────┐
│                                                    │
│             ┌─────────────────┐                    │
│             │   Hôm nay       │                    │
│             └─────────────────┘                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

**Specs:**

- Pill centered horizontally
- Same margin: `16px 0`

---

### Mobile (< 768px)

```
┌─────────────────────────┐
│                         │
│   ┌───────────────┐     │
│   │  Hôm nay      │     │
│   └───────────────┘     │
│                         │
└─────────────────────────┘
```

**Specs:**

- Pill centered horizontally
- Same margin: `16px 0`
- Same padding/styling (responsive không thay đổi gì)

---

## 🎨 Date Label Examples

### Example 1: Today

```
┌────────────────────┐
│     Hôm nay        │
└────────────────────┘
```

### Example 2: Yesterday

```
┌────────────────────┐
│     Hôm qua        │
└────────────────────┘
```

### Example 3: Within Week (with weekday)

```
┌──────────────────────────────┐
│  Thứ Năm, 30/01/2026         │
└──────────────────────────────┘
```

### Example 4: Older (date only)

```
┌────────────────────┐
│    25/01/2026      │
└────────────────────┘
```

---

## 📐 Spacing & Layout

### Vertical Spacing

```
Message (last of previous day)
         ↓
      8px gap
         ↓
┌───────────────────┐
│  Date Separator   │ ← 16px margin top
└───────────────────┘
         ↓
      8px gap
         ↓
Message (first of new day)
```

**Total spacing:**

- Before separator: `8px` (from last message)
- Separator internal margin: `16px` top, `8px` bottom (asymmetric để gần messages của ngày mới hơn)
- After separator: `8px` (to first message of new day)

**Rationale:** Separator "belongs" to the new day messages, so spacing tighter below than above.

---

## 🎨 Color Palette

| Element    | Tailwind Class  | Hex Color | Usage           |
| ---------- | --------------- | --------- | --------------- |
| Background | `bg-gray-100`   | `#F3F4F6` | Pill background |
| Text       | `text-gray-500` | `#6B7280` | Date label      |

---

## ⚙️ Implementation Code

### Component Code

```tsx
interface MessageDateSeparatorProps {
  date: string;
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

### Usage in ChatMainContainer

```tsx
{
  groupedMessages.map((group, groupIndex) => (
    <React.Fragment key={groupIndex}>
      {/* Date Separator */}
      <MessageDateSeparator date={group.date} />

      {/* Messages of this day */}
      {group.messages.map((message) => (
        <MessageBubbleSimple key={message.id} message={message} />
      ))}
    </React.Fragment>
  ));
}
```

---

## 🔍 Edge Cases

### Edge Case 1: First Load (No Messages)

**Behavior:** No separators shown (empty chat)

### Edge Case 2: All Messages Same Day

**Behavior:** One separator at top ("Hôm nay" or date)

### Edge Case 3: Scroll to Load More

**Behavior:** New separator inserted if messages from different day loaded

### Edge Case 4: Real-time New Message

**Behavior:**

- If new message same day as last → No new separator
- If new message different day (midnight crossed) → New separator appears

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                        | Lựa chọn       | HUMAN Decision |
| --- | --------------------------------------------- | -------------- | -------------- |
| 1   | Sticky separator khi scroll?                  | Yes/No         | ⬜ **\_\_\_**  |
| 2   | Animation khi separator xuất hiện?            | Fade in / None | ⬜ **\_\_\_**  |
| 3   | Separator có clickable để jump to top of day? | Yes/No         | ⬜ **\_\_\_**  |

---

## 📋 IMPACT SUMMARY

### Component to Create:

- `src/components/chat/MessageDateSeparator.tsx` (~15 lines)

### Styling Changes:

- No CSS file needed (Tailwind only)
- No theme changes

### Accessibility:

- `aria-label` không cần (text visible)
- Semantic HTML (`<div>` + `<span>`)
- No interactive elements (unless decision #3 = Yes)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                           | Status           |
| ---------------------------------- | ---------------- |
| Đã review Visual Design            | ⬜ Chưa review   |
| Đã review Spacing Specs            | ⬜ Chưa review   |
| Đã review Responsive Design        | ⬜ Chưa review   |
| Đã review Color Palette            | ⬜ Chưa review   |
| Đã điền Pending Decisions          | ⬜ Chưa điền     |
| **APPROVED để chuyển sang BƯỚC 4** | ⬜ CHƯA APPROVED |

**HUMAN Signature:** [CHƯA DUYỆT]  
**Date:** **\_\_**

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tiếp tục BƯỚC 4 nếu mục này = ⬜ CHƯA APPROVED**
