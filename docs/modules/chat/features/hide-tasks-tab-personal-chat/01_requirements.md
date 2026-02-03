# [BƯỚC 1] Requirements: Hide Tasks Tab in Personal Chat

> **Feature:** Conditional tab visibility  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Created:** 2026-02-02

---

## 📋 Functional Requirements

### FR-1: Tab Visibility Logic

**Requirement:**  
ConversationDetailPanel hiển thị tabs dựa trên loại conversation:

| Conversation Type   | Tabs hiển thị             |
| ------------------- | ------------------------- |
| Personal Chat (1-1) | "Thông tin" only          |
| Group Chat          | "Thông tin" + "Công việc" |

**Acceptance Criteria:**

- ✅ Personal chat → chỉ thấy tab "Thông tin"
- ✅ Group chat → thấy cả 2 tabs
- ✅ Switch giữa personal và group chat → tabs update đúng
- ✅ Default active tab: "Thông tin" (luôn có)

### FR-2: Conversation Type Detection

**Requirement:**  
Xác định conversation type từ `conversation.type` field.

**Logic:**

```typescript
import {
  isDirectConversation,
  isGroupConversation,
} from "@/types/conversations";

// Direct Message (1-1 chat)
if (conversation.type === "DM") {
  // Hide "Công việc" tab
}

// Group Chat
if (conversation.type === "GRP") {
  // Show both tabs
}
```

**Data source:**

- Store: `useConversationStore` → `selectedConversation?.type`
- Type guard: `isDirectConversation(conv)` từ `@/types/conversations`

**Acceptance Criteria:**

- ✅ Check `conversation.type === "DM"` để xác định personal chat
- ✅ Check `conversation.type === "GRP"` để xác định group chat
- ✅ Fallback: Nếu không có conversation → hiển thị cả 2 tabs (default)

---

## 🎨 UI Requirements

### UI-1: Tab Rendering

**Before (Group Chat):**

```
┌─────────────────────────────────┐
│ Thông tin │ Công việc           │ ← 2 tabs
├─────────────────────────────────┤
│ [Panel content]                 │
└─────────────────────────────────┘
```

**After (Personal Chat):**

```
┌─────────────────────────────────┐
│ Thông tin                       │ ← 1 tab only
├─────────────────────────────────┤
│ [Panel content]                 │
└─────────────────────────────────┘
```

### UI-2: No Visual Glitch

**Requirements:**

- ✅ No layout shift when switching conversation types
- ✅ Active tab state preserved if available in new conversation
- ✅ Fallback to "Thông tin" if active tab not available

---

## 🔧 Technical Requirements

### Tech-1: Component Changes

**File:** `src/features/portal/workspace/ConversationDetailPanel.tsx`

**Required info from conversation:**

- Conversation type or participant count

**Implementation approach:**

```tsx
import { useConversationStore } from "@/stores";
import { isDirectConversation } from "@/types/conversations";

const selectedConversation = useConversationStore(
  (s) => s.selectedConversation,
);
const isDM = selectedConversation && isDirectConversation(selectedConversation);

const tabs = useMemo(() => {
  const baseTabs = [{ key: "info", label: "Thông Tin" }];

  // Only add tasks tab for group chats (type === "GRP")
  if (!isDM) {
    baseTabs.push({ key: "order", label: "Công Việc" });
  }

  return baseTabs;
}, [isDM]);
```

### Tech-2: State Management

**Active tab logic:**

- If current active tab = "tasks" AND switching to personal → set active = "info"
- Otherwise preserve active tab

---

## 🔒 Security Requirements

**No security implications** - UI only feature

---

## 📊 Performance Requirements

**Perf-1: No Performance Impact**

- Conditional rendering có negligible overhead
- `useMemo` để avoid re-compute tabs

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                                        | Lựa chọn                       | HUMAN Decision                        |
| --- | --------------------------------------------- | ------------------------------ | ------------------------------------- |
| 1   | Có cần animation khi tab hide/show?           | Yes/No?                        | ⬜ **No** (simple conditional render) |
| 2   | Active tab fallback khi switch từ group → DM? | Auto switch to "info" or stay? | ⬜ **Auto switch to "info"**          |

> **Note:** Decision 1 đã điền sẵn "No" vì SegmentedTabs component không support animation. Bạn có thể thay đổi nếu muốn.

---

## 📋 IMPACT SUMMARY

### Files sẽ sửa đổi:

- `src/features/portal/workspace/ConversationDetailPanel.tsx`
  - Add conditional tab rendering logic
  - Update active tab fallback logic

### Files sẽ tạo mới:

- (không có)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                           | Status       |
| ---------------------------------- | ------------ |
| Đã review Functional Requirements  | ✅ Đã review |
| Đã review UI Requirements          | ✅ Đã review |
| Đã điền Pending Decisions          | ✅ Đã điền   |
| **APPROVED để chuyển sang BƯỚC 2** | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-02

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tiếp tục BƯỚC 2 nếu mục này = ⬜ CHƯA APPROVED**
