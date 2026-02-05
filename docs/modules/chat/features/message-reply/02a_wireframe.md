# [BƯỚC 2A] Wireframe - Message Reply Feature

> **Version:** 1.0.0  
> **Status:** ⏳ PENDING APPROVAL  
> **Last Updated:** 2026-02-03  
> **Prerequisites:** [01_requirements.md](./01_requirements.md) ✅ APPROVED

---

## 📐 Overview

Document này định nghĩa **UI/UX wireframes** cho tính năng Message Reply (Quote Reply). Bao gồm responsive designs cho Desktop, Tablet, Mobile.

**Note:** Đây là quote reply đơn giản, KHÔNG có reply count hoặc thread view.

---

## 🖥️ Desktop Design (≥1024px)

### D-1: Message Bubble - Normal State (No Hover)

```
┌───────────────────────────────────────────────────────────────┐
│ 👤 Nguyen Van A • 2:25 PM                                     │
│                                                                │
│ This is a normal message without any reply functionality      │
│ visible until user hovers over it.                            │
│                                                                │
└───────────────────────────────────────────────────────────────┘

Specifications:
- Background: White (#FFFFFF)
- Border: 1px solid #E5E7EB
- Border radius: 8px
- Padding: 12px 16px
- Sender name: Font size 14px, weight 500, color #374151
- Timestamp: Font size 12px, color #9CA3AF
- Content: Font size 14px, line-height 1.5, color #1F2937
```

### D-2: Message Bubble - Hover State (Reply Button in Existing Menu)

```
┌───────────────────────────────────────────────────────────────┐
│ 👤 Nguyen Van A • 2:25 PM                              [⤴️][⭐] │ ← Reply button (left) + Star button
│                                                                │
│ This is a normal message. When user hovers, existing action   │
│ menu appears with reply button added.                         │
│                                                                │
└───────────────────────────────────────────────────────────────┘

**Note:** MessageBubbleSimple đã có sẵn hover menu với star action.
Chỉ cần thêm Reply button vào BÊN TRÁI star button (minimize impact).

Reply Button Specifications:
- Position: Leftmost in action menu (before star button)
- Size: 32px × 32px (match existing star button)
- Icon: ⤴️ (curved arrow) - size 18px
- Background: Transparent → hover: #F3F4F6 (same as star button)
- Border radius: 6px
- Transition: Same as existing menu (fade in with menu)
- Cursor: pointer
```

### D-3: Reply Input State (Parent Preview Shown)

```
┌──────────────────────────────────────────────────────────────────┐
│ Chat Input Area                                                  │
├──────────────────────────────────────────────────────────────────┤
│ ╔══════════════════════════════════════════════════════════════╗ │
│ ║ Replying to Nguyen Van A                               [✕]  ║ │ ← Parent preview header
│ ║──────────────────────────────────────────────────────────────║ │
│ ║ This is the original message content that is being          ║ │ ← Parent content (max 2 lines)
│ ║ replied to. If content is too long it will be truncated...  ║ │
│ ╚══════════════════════════════════════════════════════════════╝ │
├──────────────────────────────────────────────────────────────────┤
│ Type your reply message here...                        [📎] [🎤]│ ← Input field
└──────────────────────────────────────────────────────────────────┘

Parent Preview Specifications:
- Background: #F9FAFB
- Border: 1px solid #E5E7EB, left border: 3px solid #38ae3c (brand accent)
- Border radius: 6px
- Padding: 8px 12px
- Max height: 60px (2 lines content)
- Header font: 12px, weight 500, color #6B7280
- Content font: 13px, color #4B5563
- Close button (✕): 20px × 20px, color #9CA3AF, hover: #EF4444
- Overflow: text-ellipsis
```

### D-4: Message with Quote (Reply Message Display)

```
┌───────────────────────────────────────────────────────────────┐
│ 👤 Tran Thi B • 2:30 PM                                       │
│                                                                │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 📧 Nguyen Van A • 2:25 PM                               ┃  │ ← Quoted message header
│ ┃─────────────────────────────────────────────────────────┃  │
│ ┃ This is the original message content that is being     ┃  │ ← Quoted content (max 3 lines)
│ ┃ replied to. User can click here to jump to original... ┃  │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│ This is my reply to that message.                             │ ← Actual reply content
│                                                                │
└───────────────────────────────────────────────────────────────┘

Quoted Message Box Specifications:
- Background: #e6f7e7 (brand-50, light green tint)
- Border: 1px solid #9fe4a4 (brand-200)
- Left border: 3px solid #38ae3c (brand-500)
- Border radius: 6px
- Padding: 8px 12px
- Margin bottom: 8px
- Header: Icon 📧 + sender name + timestamp
  - Font: 12px, weight 500, color #257229 (brand-700)
- Content: Font 13px, color #1c561f (brand-800), line-clamp: 3
- Cursor: pointer (entire box clickable)
- Hover: Background #c5efc7 (brand-100)
```

### D-5: Scroll to Parent - Highlight Effect

```
When user clicks quoted message box → Chat scrolls to parent message

┌───────────────────────────────────────────────────────────────┐
│ ... (older messages)                                          │
├───────────────────────────────────────────────────────────────┤
│ ╔═══════════════════════════════════════════════════════════╗ │ ← Highlighted parent
│ ║ 👤 Nguyen Van A • 2:25 PM                                 ║ │
│ ║                                                            ║ │
│ ║ This is the original message content that is being        ║ │
│ ║ replied to. (This message is now highlighted)             ║ │
│ ║                                                            ║ │
│ ╚═══════════════════════════════════════════════════════════╝ │
├───────────────────────────────────────────────────────────────┤
│ ... (newer messages)                                          │
└───────────────────────────────────────────────────────────────┘

Highlight Effect Specifications:
- Background color: #FEF3C7 (yellow) OR #c5efc7 (brand-100 green) - DECISION #4
- Border: 2px solid #FBBF24 (yellow) OR #38ae3c (brand-500 green)
- Box shadow: 0 0 0 4px rgba(251, 191, 36, 0.2) OR rgba(56, 174, 60, 0.2)
- Animation: Fade in 200ms → hold 2s → fade out 500ms
- Scroll behavior: smooth, duration 500ms OR instant - DECISION #3
- Scroll position: Center parent message in viewport
```

---

## 📱 Tablet Design (768px - 1023px)

### T-1: Message Bubble Layout

```
┌─────────────────────────────────────────────┐
│ 👤 Nguyen Van A • 2:25 PM             [⤴️] │ ← Buttons slightly larger
│                                             │
│ Message content with adaptive padding      │
│ and font sizes for tablet screens.         │
│                                             │
└─────────────────────────────────────────────┘

Adjustments from Desktop:
- Reply button: 36px × 36px (larger for touch)
- Padding: 10px 14px (slightly reduced)
- Touch target minimum: 44px × 44px (iOS guideline)
```

### T-2: Reply Input State

```
┌─────────────────────────────────────────────┐
│ ╔═══════════════════════════════════════╗  │
│ ║ Replying to Nguyen Van A        [✕]  ║  │
│ ║───────────────────────────────────────║  │
│ ║ Original message content truncated... ║  │ ← Max 2 lines
│ ╚═══════════════════════════════════════╝  │
├─────────────────────────────────────────────┤
│ Type reply...                  [📎] [🎤]   │
└─────────────────────────────────────────────┘

- Parent preview: Same as desktop but full width
- Close button: 24px × 24px (larger for touch)
```

---

## 📱 Mobile Design (<768px)

### M-1: Message Bubble - Default State

```
┌───────────────────────────────┐
│ 👤 Nguyen Van A               │
│ 2:25 PM                       │
│                               │
│ Message content with mobile   │
│ optimized layout and sizing.  │
│                               │
└───────────────────────────────┘

Mobile Specifications:
- Width: 100% with 12px side margins
- Padding: 10px 12px
- Font sizes: Slightly smaller for mobile
- No hover state (touch device)
```

### M-2: Reply Action - Long Press Context Menu

```
┌───────────────────────────────┐
│ 👤 Nguyen Van A               │
│ 2:25 PM                       │
│                               │
│ [Long press this message]     │ ← User long-presses (500ms)
│                               │
└───────────────────────────────┘
         ↓
┌───────────────────────────────┐
│ ╔═══════════════════════════╗ │ ← Context menu appears
│ ║  ⤴️  Reply                ║ │
│ ║  📋 Copy                  ║ │
│ ║  ⭐ Star                  ║ │
│ ║  ✖️  Cancel               ║ │
│ ╚═══════════════════════════╝ │
└───────────────────────────────┘

Context Menu Specifications:
- Trigger: Long press 500ms OR swipe left gesture - DECISION #5
- Background: White with shadow
- Border radius: 12px
- Padding: 8px 0
- Item height: 48px (touch-friendly)
- Font: 16px, weight 500
- Position: Center of screen OR near message
```

### M-3: Reply Input State (Mobile)

```
┌──────────────────────────────────────┐
│ ╔══════════════════════════════════╗ │
│ ║ ⤴️ Nguyen Van A           [✕]  ║ │ ← Compact header
│ ║ Original message text...        ║ │ ← 1-2 lines max
│ ╚══════════════════════════════════╝ │
├──────────────────────────────────────┤
│ Type reply...                   [🎤] │ ← Single line
└──────────────────────────────────────┘

Mobile Adjustments:
- Parent preview: Compact mode, max 2 lines
- Header: Icon + name only (no timestamp to save space)
- Close button: 32px × 32px
- Input: Focus triggers keyboard, full-width
```

### M-4: Message with Quote (Mobile)

```
┌──────────────────────────────┐
│ 👤 Tran Thi B                │
│ 2:30 PM                      │
│                              │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ 📧 Nguyen Van A        ┃  │
│ ┃ 2:25 PM                ┃  │
│ ┃────────────────────────┃  │
│ ┃ Original message...    ┃  │ ← Max 2 lines on mobile
│ ┗━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                              │
│ This is my reply.            │
│                              │
└──────────────────────────────┘

Mobile Quote Box:
- Full width minus margins
- Max 2 lines content (vs 3 on desktop)
- Slightly larger font for readability
- Tap to scroll (not click)
```

---

## 🎨 Color Palette

### Primary Colors (Brand)

| Element     | Color       | Hex       | Tailwind  | Usage                         |
| ----------- | ----------- | --------- | --------- | ----------------------------- |
| Brand Main  | Green       | `#38ae3c` | brand-500 | Quote accent, primary actions |
| Brand Hover | Dark Green  | `#2f9132` | brand-600 | Interactive hover states      |
| Brand Light | Light Green | `#c5efc7` | brand-100 | Quote hover, backgrounds      |
| Success     | Green       | `#10B981` | green-500 | (future use)                  |
| Warning     | Yellow      | `#F59E0B` | amber-500 | (future use)                  |
| Error       | Red         | `#EF4444` | red-500   | Close button hover, errors    |

### Neutral Colors

| Element        | Color    | Hex       | Usage           |
| -------------- | -------- | --------- | --------------- |
| Text Primary   | Gray 900 | `#1F2937` | Message content |
| Text Secondary | Gray 600 | `#4B5563` | Sender names    |
| Text Tertiary  | Gray 400 | `#9CA3AF` | Timestamps      |
| Background     | White    | `#FFFFFF` | Message bubbles |
| Background Alt | Gray 50  | `#F9FAFB` | Input preview   |
| Border         | Gray 200 | `#E5E7EB` | Borders         |

### Quote Colors (Brand Palette)

| Element             | Hex       | Tailwind  | Usage                   |
| ------------------- | --------- | --------- | ----------------------- |
| Quote Background    | `#e6f7e7` | brand-50  | Light green tint        |
| Quote Border        | `#9fe4a4` | brand-200 | Border color            |
| Quote Border Accent | `#38ae3c` | brand-500 | Left border (3px)       |
| Quote Text Header   | `#257229` | brand-700 | Sender name, dark green |
| Quote Text Content  | `#1c561f` | brand-800 | Message content         |
| Quote Hover         | `#c5efc7` | brand-100 | Hover background        |

### Highlight Colors (DECISION #4)

| Option      | Background | Border    | Tailwind          | Description                   |
| ----------- | ---------- | --------- | ----------------- | ----------------------------- |
| Yellow      | `#FEF3C7`  | `#FBBF24` | yellow-100 / -400 | Warm, attention-grabbing      |
| Brand Green | `#c5efc7`  | `#38ae3c` | brand-100 / -500  | Matches brand theme, cohesive |

---

## 📏 Spacing & Sizing

### Spacing Scale

```
4px  (xs)  - Tight spacing (icon padding)
8px  (sm)  - Small spacing (element gaps)
12px (md)  - Medium spacing (default padding)
16px (lg)  - Large spacing (section padding)
24px (xl)  - Extra large (major sections)
```

### Typography Scale

| Element         | Desktop    | Tablet     | Mobile     |
| --------------- | ---------- | ---------- | ---------- |
| Sender Name     | 14px / 500 | 14px / 500 | 13px / 500 |
| Timestamp       | 12px / 400 | 12px / 400 | 11px / 400 |
| Message Content | 14px / 400 | 14px / 400 | 14px / 400 |
| Quote Header    | 12px / 500 | 12px / 500 | 12px / 500 |
| Quote Content   | 13px / 400 | 13px / 400 | 13px / 400 |

### Component Sizes

| Component        | Desktop | Tablet  | Mobile  |
| ---------------- | ------- | ------- | ------- |
| Reply Button     | 32×32px | 36×36px | 44×44px |
| Close Button     | 20×20px | 24×24px | 32×32px |
| Icon Size        | 18px    | 20px    | 20px    |
| Min Touch Target | 32px    | 44px    | 44px    |

---

## 🔲 Component States

### Reply Button States

| State    | Appearance                          | Trigger              |
| -------- | ----------------------------------- | -------------------- |
| Hidden   | `opacity: 0`                        | Default (no hover)   |
| Visible  | `opacity: 1`                        | Parent message hover |
| Hover    | `background: #F3F4F6`               | Button hover         |
| Active   | `background: #E5E7EB`               | Button click         |
| Disabled | `opacity: 0.5, cursor: not-allowed` | System messages      |

### Quote Box States

| State       | Appearance                         | Trigger                       |
| ----------- | ---------------------------------- | ----------------------------- |
| Default     | Light green background (brand-50)  | Message has `parentMessageId` |
| Hover       | Darker green `#c5efc7` (brand-100) | Mouse hover (desktop/tablet)  |
| Active      | Pressed state (brief)              | Click/tap to scroll           |
| Highlighted | Yellow/green glow                  | After scroll to parent        |

### Input Preview States

| State       | Appearance                 | Trigger                    |
| ----------- | -------------------------- | -------------------------- |
| Collapsed   | Hidden                     | Default (no reply active)  |
| Expanded    | Visible with animation     | Reply button clicked       |
| Hover Close | Close button red `#EF4444` | Hover close button         |
| Closing     | Fade out 200ms             | Close button clicked / ESC |

---

## ⚠️ Edge Cases & Error States

### E-1: Parent Message Deleted

```
┌───────────────────────────────────────────────────────────────┐
│ 👤 Tran Thi B • 2:30 PM                                       │
│                                                                │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ ⚠️ [Message đã bị xóa]                                  ┃  │ ← Placeholder
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│ This is my reply to that deleted message.                     │
│                                                                │
└───────────────────────────────────────────────────────────────┘

Deleted Parent Specifications:
- Background: #FEF2F2 (light red)
- Border: #FCA5A5
- Icon: ⚠️
- Text: "[Message đã bị xóa]" - italic, color #991B1B
- Not clickable
```

### E-2: Parent Message Load Failed

```
┌───────────────────────────────────────────────────────────────┐
│ 👤 Tran Thi B • 2:30 PM                                       │
│                                                                │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │
│ ┃ ⚠️ [Không thể tải tin nhắn] [↻ Thử lại]              ┃  │ ← Error state
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
│                                                                │
│ This is my reply.                                             │
│                                                                │
└───────────────────────────────────────────────────────────────┘

Load Error Specifications:
- Background: #FFFBEB (light amber)
- Border: #FCD34D
- Icon: ⚠️
- Retry button: Clickable, color #D97706
```

### E-3: Scroll to Parent Failed (Not in History)

```
┌──────────────────────────────────────────────────────────┐
│ 🔔 Notification (Toast)                             [✕] │
│                                                          │
│ ⚠️ Tin nhắn gốc không còn trong lịch sử chat           │
│                                                          │
└──────────────────────────────────────────────────────────┘

Toast Notification:
- Position: Top center, 16px from top
- Background: #FEF2F2
- Border: 1px solid #FCA5A5
- Auto-dismiss: 3 seconds
- Close button: Manual dismiss
```

---

## 📋 PENDING DECISIONS (UI/UX)

| #   | Decision                  | Options                                    | Status | Impact                    |
| --- | ------------------------- | ------------------------------------------ | ------ | ------------------------- |
| 1   | Reply button icon         | ⮕️ (curved arrow) or 💬 (bubble)?           | ⬜     | Icon appearance           |
| 2   | Parent preview max height | 2 lines or 3 lines?                        | ⬜     | Input preview & quote box |
| 3   | Scroll animation          | Smooth 500ms or instant?                   | ⬜     | Scroll behavior           |
| 4   | Highlight color           | Yellow (#FEF3C7) or Brand Green (#c5efc7)? | ⬜     | Highlight effect          |
| 5   | Mobile reply trigger      | Long press 500ms or swipe left?            | ⬜     | Mobile interaction        |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Desktop designs | ✅ Đã review |
| Đã review Tablet designs  | ✅ Đã review |
| Đã review Mobile designs  | ✅ Đã review |
| Đã review Color palette   | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để tiếp tục**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-03

> ✅ **Approved - Tiếp tục implementation**

---

**Next Step:** Sau khi approve, chuyển sang [02b_flow.md](./02b_flow.md)
