# [BƯỚC 2A] Wireframe: Hide Tasks Tab in Personal Chat

> **Feature:** Conditional tab visibility  
> **Status:** ✅ COMPLETED  
> **Created:** 2026-02-02

---

## 📐 Before & After Comparison

### BEFORE (Current - All conversations)

```
┌─────────────────────────────────────────┐
│  ConversationDetailPanel                │
├─────────────────────────────────────────┤
│  ┌─────────────┬─────────────┐          │
│  │ Thông Tin   │ Công Việc   │ ← 2 tabs │
│  └─────────────┴─────────────┘          │
│                                          │
│  [Content area]                          │
│                                          │
└─────────────────────────────────────────┘
```

### AFTER - Group Chat (type === "GRP")

```
┌─────────────────────────────────────────┐
│  ConversationDetailPanel                │
├─────────────────────────────────────────┤
│  ┌─────────────┬─────────────┐          │
│  │ Thông Tin   │ Công Việc   │ ← 2 tabs │
│  └─────────────┴─────────────┘          │
│                                          │
│  [Content area - no change]              │
│                                          │
└─────────────────────────────────────────┘
```

### AFTER - Personal Chat (type === "DM") ✨ NEW

```
┌─────────────────────────────────────────┐
│  ConversationDetailPanel                │
├─────────────────────────────────────────┤
│  ┌─────────────┐                        │
│  │ Thông Tin   │ ← 1 tab only           │
│  └─────────────┘                        │
│                                          │
│  [Content area - same as "Thông Tin"]   │
│                                          │
└─────────────────────────────────────────┘
```

---

## 🎨 Visual Specifications

### Tab Component (SegmentedTabs)

**No styling changes required** - Component remains the same

**Behavior changes:**

- Group chat: Render 2 tabs (info + order)
- Personal chat: Render 1 tab (info only)
- Tab width: Auto-adjust based on number of tabs

### Active Tab State

**Scenario 1: Switch from Group → Personal**

- If active tab = "order" → Auto-switch to "info"
- If active tab = "info" → Stay on "info"

**Scenario 2: Switch from Personal → Group**

- Active tab = "info" → Stay on "info"
- Previous state remembered? No (always default to "info")

---

## 📱 Responsive Design

**Desktop (≥1024px):**

- Tab height: 40px
- Tab width: Auto (equal distribution)
- Font size: 14px

**Mobile (<1024px):**

- Same behavior as desktop
- No additional responsive changes needed

---

## ♿ Accessibility

**No changes needed:**

- SegmentedTabs component already handles accessibility
- Tab navigation via keyboard still works
- ARIA labels preserved

---

## 🎬 Animation/Transition

**Decision:** No animation

**Rationale:**

- SegmentedTabs component doesn't support animation
- Simple conditional rendering is sufficient
- Instant tab appearance/disappearance is acceptable UX

---

## 🧪 Edge Cases

### Edge Case 1: No conversation selected

**Behavior:** Show both tabs (default state)

```tsx
const isDM = selectedConversation && isDirectConversation(selectedConversation);
// If selectedConversation is null → isDM is falsy → show both tabs
```

### Edge Case 2: Conversation type changes mid-session

**Behavior:** Tabs update immediately via useMemo dependency

**Example:**

```
User viewing Group A (2 tabs)
→ Clicks Personal Chat B (1 tab) ✅ Instant update
→ Clicks Group C (2 tabs) ✅ Instant update
```

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                             | Status       |
| ------------------------------------ | ------------ |
| Wireframe clear và đúng requirements | ✅ Confirmed |
| Edge cases được handle               | ✅ Confirmed |
| No visual regression expected        | ✅ Confirmed |
| **APPROVED để chuyển sang BƯỚC 4**   | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-02

> ✅ Wireframe approved - Proceeding to Implementation Plan (BƯỚC 4)
