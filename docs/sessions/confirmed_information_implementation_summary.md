# Confirmed Information Feature - Implementation Summary

**Date:** 2026-02-12
**Status:** Ready for final integration

## ✅ Completed Components

### 1. Type Definitions ✅
- `src/types/information_confirmed.ts`
  - InformationConfirmedDto
  - CreateInformationConfirmedRequest
  - InformationConfirmedPagedResponse
  - GetInformationConfirmedParams

### 2. API Client ✅
- `src/api/information_confirmed.api.ts`
  - `getInformationConfirmed()` - GET paginated list
  - `createInformationConfirmed()` - POST create new
  - `getInformationConfirmedById()` - GET by ID

### 3. Query Hooks ✅
- `src/hooks/queries/keys/informationConfirmedKeys.ts` - Query key factory
- `src/hooks/queries/useInformationConfirmed.ts` - Fetch confirmed info
- `src/hooks/queries/useCategoryConversations.ts` - NEW: Fetch conversations by category

### 4. Mutation Hooks ✅
- `src/hooks/mutations/useCreateInformationConfirmed.ts` - Create confirmed info

### 5. UI Components ✅
- `MessageBubbleSimple.tsx` - Added "Xác nhận" button with CheckCircle2 icon
- `src/components/sheet/ConfirmedInfoTransferSheet.tsx` - NEW: Transfer sheet for confirmed info

## 🔄 Remaining Integration Tasks

### Task 1: Update ChatMainContainer
**File:** `src/features/portal/components/chat/ChatMainContainer.tsx`

**Changes needed:**
1. Import hooks and component:
```typescript
import { useCreateInformationConfirmed } from "@/hooks/mutations/useCreateInformationConfirmed";
import { useConversationStore } from "@/stores";
import { sendMessage } from "@/api/messages.api";
```

2. Add state for confirmed info sheet:
```typescript
const [confirmedInfoSheet, setConfirmedInfoSheet] = useState<{
  open: boolean;
  confirmedInfo?: InformationConfirmedDto;
}>({ open: false });
```

3. Add mutation:
```typescript
const createConfirmedInfoMutation = useCreateInformationConfirmed({
  onSuccess: (data) => {
    toast.success("Đã xác nhận thông tin");
  },
});
```

4. Add handler:
```typescript
const handleConfirmInfo = useCallback(
  (messageId: string) => {
    const message = groupedMessages.find(
      (g) => g.message.id === messageId
    )?.message;
    if (!message) return;

    createConfirmedInfoMutation.mutate({
      conversationId,
      messageId,
      content: message.content || "",
      statusCode: "pending",
      confirmedBy: user?.id || "",
    });
  },
  [conversationId, groupedMessages, user?.id, createConfirmedInfoMutation]
);
```

5. Pass to MessageBubbleSimple:
```typescript
<MessageBubbleSimple
  // ...existing props
  onConfirmInfo={handleConfirmInfo}
/>
```

### Task 2: Update ConversationDetailPanel
**File:** `src/features/portal/workspace/ConversationDetailPanel.tsx`

**Changes needed:**
1. Import hooks and types:
```typescript
import { useInformationConfirmed } from "@/hooks/queries/useInformationConfirmed";
import type { InformationConfirmedDto } from "@/types/information_confirmed";
import { ConfirmedInfoTransferSheet } from "@/components/sheet/ConfirmedInfoTransferSheet";
import { sendMessage } from "@/api/messages.api";
import { useConversationStore } from "@/stores";
```

2. Fetch confirmed information:
```typescript
const { data: confirmedInfoData } = useInformationConfirmed(
  {
    conversationId: groupId,
    isFinished: false,
  },
  { enabled: !!groupId && hasLeaderPermissions() }
);

const confirmedInfos = confirmedInfoData?.data || [];
```

3. Transform to ReceivedInfo format:
```typescript
const transformedConfirmedInfos: ReceivedInfo[] = confirmedInfos.map((info) => ({
  id: info.id,
  messageId: info.messageId,
  groupId: info.conversationId,
  title: info.content?.substring(0, 60) || "Không có nội dung",
  sender: "Người xác nhận",
  createdAt: info.createdAt,
  status: info.isFinished ? "assigned" : "waiting",
}));
```

4. Add state for transfer sheet:
```typescript
const [confirmedInfoTransferSheet, setConfirmedInfoTransferSheet] = useState<{
  open: boolean;
  confirmedInfo?: InformationConfirmedDto;
}>({ open: false });
```

5. Add handlers:
```typescript
const handleConfirmedInfoAssign = (info: ReceivedInfo) => {
  // Find original confirmed info
  const confirmedInfo = confirmedInfos.find((ci) => ci.id === info.id);
  if (!confirmedInfo) return;

  // Open assign sheet with confirmed info data
  onAssignInfo?.({ ...info, messageId: confirmedInfo.messageId });
};

const handleConfirmedInfoTransfer = (info: ReceivedInfo) => {
  const confirmedInfo = confirmedInfos.find((ci) => ci.id === info.id);
  if (!confirmedInfo) return;

  setConfirmedInfoTransferSheet({
    open: true,
    confirmedInfo,
  });
};

const handleConfirmedInfoTransferConfirm = async (payload: {
  confirmedInfoId: string;
  toCategoryId: string;
  toCategoryName: string;
  toConversationId: string;
  toConversationName: string;
  assignTo: string;
  messageContent: string;
}) => {
  try {
    // Send message to target conversation
    await sendMessage({
      conversationId: payload.toConversationId,
      content: payload.messageContent,
      messageType: "TEX",
    });

    toast.success(`Đã chuyển thông tin sang ${payload.toConversationName}`);

    // Navigate to target conversation
    const conversationStore = useConversationStore.getState();
    conversationStore.selectConversation(payload.toConversationId);
    conversationStore.setActiveTab("categories", payload.toCategoryId);

    // Close sheet
    setConfirmedInfoTransferSheet({ open: false });
  } catch (error) {
    console.error("Failed to transfer confirmed info:", error);
    toast.error("Không thể chuyển thông tin");
  }
};
```

6. Add second ReceivedInfoSection for confirmed info:
```tsx
{/* Confirmed Information Section */}
{hasLeaderPermissions() && transformedConfirmedInfos.length > 0 && (
  <ReceivedInfoSection
    items={transformedConfirmedInfos}
    onAssignInfo={handleConfirmedInfoAssign}
    onOpenGroupTransfer={handleConfirmedInfoTransfer}
  />
)}

{/* Transfer Sheet */}
<ConfirmedInfoTransferSheet
  open={confirmedInfoTransferSheet.open}
  confirmedInfo={confirmedInfoTransferSheet.confirmedInfo}
  onClose={() => setConfirmedInfoTransferSheet({ open: false })}
  onConfirm={handleConfirmedInfoTransferConfirm}
/>
```

## API Endpoints Used

### InformationConfirmed API
- `GET /api/information-confirmed` - List confirmed info (with filters)
- `POST /api/information-confirmed` - Create new confirmed info
- `GET /api/information-confirmed/{id}` - Get by ID

### Categories API (existing)
- `GET /api/categories` - List all categories
- `GET /api/categories/{id}/conversations` - Get conversations in category

### Messages API (existing)
- `POST /api/messages` - Send message to conversation

## User Flow

1. **Leader hovers over message** → Sees "Xác nhận thông tin" button
2. **Click "Xác nhận"** → Creates InformationConfirmed record (status: pending)
3. **In Tasks tab of right panel** → Shows confirmed info in ReceivedInfoSection
4. **Two options:**
   - **Giao việc** → Opens AssignTaskSheet (existing flow)
   - **Chuyển nhóm** → Opens ConfirmedInfoTransferSheet
5. **In Transfer Sheet:**
   - Select target category (Nhóm đích)
   - Select target conversation
   - Assignee = current user (locked)
   - Click "Chuyển đi"
6. **System:**
   - Sends original message content to target conversation
   - Navigates to target conversation
   - Shows success toast

## Testing Checklist

- [ ] Button "Xác nhận" appears on message hover (leader only)
- [ ] Click button creates InformationConfirmed via API
- [ ] Confirmed info appears in ConversationDetailPanel Tasks tab
- [ ] "Giao việc" opens AssignTaskSheet with correct data
- [ ] "Chuyển nhóm" opens ConfirmedInfoTransferSheet
- [ ] Category dropdown loads categories
- [ ] Conversation dropdown loads conversations for selected category
- [ ] Submit creates message in target conversation
- [ ] Navigation switches to target conversation
- [ ] Toast notifications appear correctly

## Notes

- **Người phụ trách:** Currently locked to current user due to API limitations
  - TODO: Update when backend provides member selection API
- **Message content:** Original message content is preserved and sent to target
- **Status tracking:** isFinished flag tracks if info has been processed
- **Query invalidation:** Auto-refetches when new confirmed info created

## Files Created

1. `src/types/information_confirmed.ts`
2. `src/api/information_confirmed.api.ts`
3. `src/hooks/queries/keys/informationConfirmedKeys.ts`
4. `src/hooks/queries/useInformationConfirmed.ts`
5. `src/hooks/queries/useCategoryConversations.ts`
6. `src/hooks/mutations/useCreateInformationConfirmed.ts`
7. `src/components/sheet/ConfirmedInfoTransferSheet.tsx`

## Files Modified

1. `src/features/portal/components/chat/MessageBubbleSimple.tsx` - Added button
2. TO DO: `src/features/portal/components/chat/ChatMainContainer.tsx` - Add handler
3. TO DO: `src/features/portal/workspace/ConversationDetailPanel.tsx` - Add display & transfer logic
