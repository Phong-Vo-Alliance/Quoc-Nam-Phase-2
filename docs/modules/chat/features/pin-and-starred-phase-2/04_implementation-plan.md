# [BƯỚC 4] Implementation Plan - Pin and Star Phase 2

> **Document Status:** ⏳ PENDING HUMAN APPROVAL  
> **Version:** 1.0  
> **Created:** 2026-01-28

---

## 📋 Implementation Overview

Phase 2 implementation gồm 3 tasks chính:

1. **Task 1:** Remove Pin Feature
2. **Task 2:** Create API Layer (types, client, hooks)
3. **Task 3:** Integrate API vào UI Components

---

## 🎯 Task 1: Remove Pin Feature

### 1.1. Update ChatMessagePanel.tsx

**File:** `src/features/portal/workspace/ChatMessagePanel.tsx`

**Changes:**

```typescript
// BEFORE (Phase 1):
import { MapPin, Star } from "lucide-react";

const handlePinToggle = useCallback((msg: Message) => {
  onTogglePin(msg);
  setMessages(prev =>
    prev.map(m => m.id === msg.id ? { ...m, isPinned: !m.isPinned } : m)
  );
}, [onTogglePin, setMessages]);

// Message Actions
<MessageActions
  onPin={handlePinToggle}
  onStar={handleStarToggle}
  ...
/>

// AFTER (Phase 2):
// [PHASE2-REMOVED] import { MapPin } from "lucide-react";
import { Star } from "lucide-react";

// [PHASE2-REMOVED] handlePinToggle function
// const handlePinToggle = useCallback(...);

// Message Actions
<MessageActions
  // [PHASE2-REMOVED] onPin={handlePinToggle}
  onStar={handleStarToggle}
  ...
/>
```

**Affected Lines:** ~317-324, ~711

### 1.2. Update WorkspaceView.tsx

**File:** `src/features/portal/workspace/WorkspaceView.tsx`

**Changes:**

```typescript
// BEFORE:
interface WorkspaceViewProps {
  workspaceMode: "default" | "pinned";
  setWorkspaceMode: (v: "default" | "pinned") => void;
  pinnedMessages?: PinnedMessage[];
  onClosePinned?: () => void;
  onOpenPinnedMessage?: (pin: PinnedMessage) => void;
  onUnpinMessage: (id: string) => void;
  onShowPinnedToast: () => void;
  onTogglePin?: (msg: Message) => void;
  onToggleStar?: (msg: Message) => void;
  onOpenPinned?: () => void;
}

// AFTER:
interface WorkspaceViewProps {
  // [PHASE2-REMOVED] workspaceMode, pinnedMessages, onClosePinned, etc.
  onToggleStar?: (msg: Message) => void;
  // ... other props
}
```

**Affected Lines:** ~108-116, ~203-210

### 1.3. Update MessageBubbleSimple (if used)

**File:** Check if `MessageBubbleSimple.tsx` has pin icon

**Action:** Comment out pin-related code similar to above

---

## 🧪 data-testid Requirements (E2E Testing)

### ⚠️ CRITICAL: Mọi element quan trọng PHẢI có data-testid

**Pattern:** `[feature]-[element]-[action/identifier]`

### Required data-testid cho Starred Messages Panel

```typescript
// Container
<aside data-testid="starred-messages-panel">

// Search input
<Input data-testid="starred-messages-search-input" />

// Loading skeleton
<div data-testid="starred-messages-loading-skeleton">

// Error state
<div data-testid="starred-messages-error-state">
<Button data-testid="starred-messages-retry-button">Thử lại</Button>

// Empty state
<div data-testid="starred-messages-empty-state">

// Message list
<ScrollArea data-testid="starred-messages-list">

// Individual message item (dynamic id)
<div data-testid={`starred-message-item-${msg.id}`}>

// Unstar button
<div data-testid={`starred-message-unstar-${msg.id}`}>
  <StarOff />
</div>

// Message content
<div data-testid={`starred-message-content-${msg.id}`}>

// Date group header
<p data-testid="starred-messages-date-group">
```

### Required data-testid cho Message Actions (Chat)

```typescript
// Star button trong message bubble
<button data-testid={`message-star-button-${messageId}`}>
  <Star />
</button>

// [PHASE2-REMOVED] Pin button
// <button data-testid={`message-pin-button-${messageId}`}>
```

---

## 🎯 Task 2: Create API Layer

### 2.1. TypeScript Types

**File:** `src/types/starred-messages.ts`

```typescript
// Based on Swagger spec
export interface StarredMessageDto {
  messageId: string;
  starredAt: string; // ISO 8601
  message: MessageDto;
}

export interface MessageDto {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string | null;
  senderIdentifier: string | null;
  senderFullName: string | null;
  senderRoles: string | null;
  parentMessageId: string | null;
  content: string | null;
  contentType: MessageContentType;
  sentAt: string;
  editedAt: string | null;
  linkedTaskId: string | null;
  reactions: ReactionDto[] | null;
  attachments: AttachmentDto[] | null;
  replyCount: number;
  isStarred: boolean;
  isPinned: boolean;
  threadPreview: MessageDto | null;
  parentMessagePreview: MessageParentPreviewDto | null;
  mentions: MessageMentionSummaryDto[] | null;
}

export type MessageContentType = "TXT" | "SYS" | "FILE" | "IMG" | "VID";

export interface AttachmentDto {
  id: string;
  fileId: string;
  fileName: string | null;
  fileSize: number;
  contentType: string | null;
  createdAt: string;
}

export interface ReactionDto {
  userId: string;
  emoji: string | null;
  createdAt: string;
}

// Params
export interface GetStarredMessagesParams {
  limit?: number;
  cursor?: string;
  conversationId?: string; // Optional: filter by conversation
}

// Response
export type GetStarredMessagesResponse = StarredMessageDto[];
```

**Estimated Time:** 30 minutes

### 2.2. API Client

**File:** `src/api/starred-messages.api.ts`

```typescript
import { client } from "./client";
import type {
  StarredMessageDto,
  GetStarredMessagesParams,
  GetStarredMessagesResponse,
} from "@/types/starred-messages";

/**
 * Get starred messages (all or filtered by conversation)
 * @param params - Query parameters (limit, cursor, conversationId)
 * @returns Array of starred messages
 */
export async function getStarredMessages(
  params?: GetStarredMessagesParams,
): Promise<GetStarredMessagesResponse> {
  const { data } = await client.get<GetStarredMessagesResponse>(
    `/starred-messages`,
    { params },
  );
  return data;
}

/**
 * Star a message
 * @param messageId - UUID of the message to star
 */
export async function starMessage(messageId: string): Promise<void> {
  await client.post(`/messages/${messageId}/star`);
}

/**
 * Unstar a message
 * @param messageId - UUID of the message to unstar
 */
export async function unstarMessage(messageId: string): Promise<void> {
  await client.delete(`/messages/${messageId}/star`);
}

/**
 * Star a message
 * @param messageId - UUID of the message to star
 */
export async function starMessage(messageId: string): Promise<void> {
  await client.post(`/messages/${messageId}/star`);
}

/**
 * Unstar a message
 * @param messageId - UUID of the message to unstar
 */
export async function unstarMessage(messageId: string): Promise<void> {
  await client.delete(`/messages/${messageId}/star`);
}
```

**Estimated Time:** 30 minutes

### 2.3. React Query Hook

**File:** `src/hooks/queries/useStarredMessages.ts`

```typescript
import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getStarredMessages,
  starMessage,
  unstarMessage,
} from "@/api/starred-messages.api";

// Query keys factory
export const starredMessagesKeys = {
  all: ["starred-messages"] as const,
  conversation: (conversationId?: string) =>
    conversationId
      ? ([...starredMessagesKeys.all, conversationId] as const)
      : starredMessagesKeys.all,
};

/**
 * Hook to fetch starred messages with infinite scroll
 * @param conversationId - Optional: filter by conversation (default: undefined = ALL)
 */
export function useStarredMessages(conversationId?: string, limit = 50) {
  return useInfiniteQuery({
    queryKey: starredMessagesKeys.conversation(conversationId),
    queryFn: ({ pageParam }) =>
      getStarredMessages({
        limit,
        cursor: pageParam,
        // conversationId: undefined → get ALL starred messages
        ...(conversationId && { conversationId }),
      }),
    getNextPageParam: (lastPage) => {
      // TODO: Confirm pagination logic with HUMAN
      // Option 1: API returns nextCursor
      // Option 2: Use last messageId as cursor
      return undefined; // Placeholder
    },
    staleTime: 1000 * 30, // 30 seconds
    enabled: !!conversationId,
  });
}

/**
 * Mutation to star a message
 */
export function useStarMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: starMessage,
    onSuccess: () => {
      // Invalidate all starred messages queries
      queryClient.invalidateQueries({
        queryKey: starredMessagesKeys.all,
      });
    },
  });
}

/**
 * Mutation to unstar a message
 */
export function useUnstarMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: unstarMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: starredMessagesKeys.all,
      });
    },
  });
}
```

**Estimated Time:** 45 minutes

---

## 🎯 Task 3: Integrate API into UI

### 3.1. Update PinnedMessagesPanel.tsx

**File:** `src/features/portal/components/PinnedMessagesPanel.tsx`

**Major Changes:**

```typescript
// BEFORE (mock data):
interface Props {
  messages: PinnedMessage[];
  onClose: () => void;
  onOpenChat: (msg: PinnedMessage) => void;
  onUnpin?: (id: string) => void;
}

export const PinnedMessagesPanel: React.FC<Props> = ({
  messages,
  onClose,
  onOpenChat,
  onUnpin,
}) => {
  // Use passed messages prop
  const hasMessages = messages.length > 0;
  // ...
}

// AFTER (with API):
interface Props {
  onClose: () => void;
  onOpenChat: (msg: TransformedMessage) => void;
}

export const PinnedMessagesPanel: React.FC<Props> = ({
  onClose,
  onOpenChat,
}) => {
  // Fetch ALL starred messages (không filter theo conversation)
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useStarredMessages(); // No conversationId = get ALL

  const { mutate: unstar } = useUnstarMessage();

  // Transform API data to UI format
  const messages = React.useMemo(() => {
    if (!data) return [];
    return data.pages.flatMap(page =>
      page.map(transformStarredMessage)
    );
  }, [data]);

  const hasMessages = messages.length > 0;

  // Loading state
  if (isLoading) {
    return <LoadingSkeleton />;
  }

  // Error state
  if (isError) {
    return (
      <ErrorState
        error={error}
        onRetry={() => refetch()}
      />
    );
  }

  // Empty state
  if (!hasMessages) {
    return (
      <aside
        data-testid="starred-messages-panel"
        className="rounded-2xl border border-gray-200 bg-white shadow-sm"
      >
        <div data-testid="starred-messages-empty-state" className="...">
          <Star className="h-12 w-12 text-brand-400" />
          <p>Đánh dấu tin nhắn để có thể tìm lại nhanh chóng...</p>
        </div>
      </aside>
    );
  }

  // Main render with ALL starred messages
  return (
    <aside
      data-testid="starred-messages-panel"
      className="rounded-2xl border border-gray-200 bg-white shadow-sm"
    >
      <div className="flex items-center justify-between px-3 py-2">
        <div className="font-medium">Tin Đánh Dấu (Tất cả)</div>
      </div>
      <Input
        data-testid="starred-messages-search-input"
        placeholder="Tìm kiếm"
      />
      <ScrollArea data-testid="starred-messages-list">
        {/* Render messages with data-testid */}
        {messages.map(msg => (
          <div
            key={msg.id}
            data-testid={`starred-message-item-${msg.id}`}
            onClick={() => onOpenChat(msg)}
          >
            <div
              data-testid={`starred-message-unstar-${msg.id}`}
              onClick={(e) => {
                e.stopPropagation();
                unstar({ messageId: msg.id });
              }}
            >
              <StarOff />
            </div>
            <div data-testid={`starred-message-content-${msg.id}`}>
              {msg.content}
            </div>
          </div>
        ))}
      </ScrollArea>
    </aside>
  );
}
```

### 3.2. Add Loading Skeleton

```typescript
function LoadingSkeleton() {
  return (
    <aside
      data-testid="starred-messages-loading-skeleton"
      className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-y-auto min-h-0"
    >
      <div className="border-b border-gray-200 p-3">
        <div className="mt-3 flex items-center gap-2">
          <Skeleton className="h-9 w-full" />
        </div>
      </div>

      <div className="flex items-center justify-between px-3 py-2">
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="py-3 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="px-3">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-24 w-full rounded-md" />
          </div>
        ))}
      </div>
    </aside>
  );
}
```

### 3.3. Add Error State

```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}

function ErrorState({ error, onRetry }: ErrorStateProps) {
  return (
    <aside
      data-testid="starred-messages-error-state"
      className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6"
    >
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        <div className="text-rose-500">
          <AlertCircle className="h-12 w-12" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900 mb-1">
            Không thể tải tin nhắn đã đánh dấu
          </h3>
          <p
            data-testid="starred-messages-error-message"
            className="text-sm text-gray-500"
          >
            {error.message || "Đã xảy ra lỗi. Vui lòng thử lại."}
          </p>
        </div>
        <Button
          data-testid="starred-messages-retry-button"
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Thử lại
        </Button>
      </div>
    </aside>
  );
}
```

### 3.4. Data Transformation Helper

```typescript
function transformStarredMessage(dto: StarredMessageDto): TransformedMessage {
  const { message } = dto;

  return {
    id: message.id,
    sender: message.senderFullName || message.senderName || "Unknown",
    content: message.content || "",
    time: message.sentAt,
    groupName: "TODO: Get from MessageDto.conversationId lookup", // Cần map conversationId → conversation name
    workTypeName: undefined, // Need to confirm with HUMAN
    type: getMessageType(message.contentType),
    fileInfo: message.attachments?.[0]
      ? {
          url: `${API_BASE_URL}/files/${message.attachments[0].fileId}`,
          name: message.attachments[0].fileName || "file",
        }
      : undefined,
  };
}

function getMessageType(
  contentType: MessageContentType,
): "text" | "image" | "file" {
  switch (contentType) {
    case "IMG":
      return "image";
    case "FILE":
    case "VID":
      return "file";
    default:
      return "text";
  }
}
```

**Estimated Time:** 2 hours

---

## 📊 Implementation Timeline

| Task        | Subtask                               | Estimate     | Priority |
| ----------- | ------------------------------------- | ------------ | -------- |
| **Task 1**  | Remove Pin Feature                    |              |          |
| 1.1         | Update ChatMessagePanel               | 30 min       | HIGH     |
| 1.2         | Update WorkspaceView                  | 20 min       | HIGH     |
| 1.3         | Update other components               | 10 min       | MEDIUM   |
| **Task 2**  | Create API Layer                      |              |          |
| 2.1         | TypeScript Types                      | 30 min       | HIGH     |
| 2.2         | API Client                            | 30 min       | HIGH     |
| 2.3         | React Query Hook                      | 45 min       | HIGH     |
| **Task 3**  | Integrate API into UI                 |              |          |
| 3.1         | Update PinnedMessagesPanel            | 1 hour       | HIGH     |
| 3.2         | Add Loading Skeleton                  | 30 min       | MEDIUM   |
| 3.3         | Add Error State                       | 30 min       | MEDIUM   |
| 3.4         | Data Transformation                   | 30 min       | HIGH     |
| 3.5         | **Add data-testid to all components** | **30 min**   | **HIGH** |
| **Testing** | Unit Tests                            | 1.5 hours    | HIGH     |
|             | Integration Tests                     | 1 hour       | HIGH     |
|             | **E2E Tests (Playwright)**            | **1 hour**   | **HIGH** |
| **Total**   |                                       | **~8 hours** |          |

---

## 🧪 Testing Strategy

### Unit Tests

**File:** `src/api/__tests__/starred-messages.api.test.ts`

```typescript
describe("starred-messages.api", () => {
  describe("getStarredMessages", () => {
    it("should fetch starred messages successfully", async () => {
      // Mock axios response
      // Assert correct endpoint called
      // Assert correct params passed
    });

    it("should handle pagination with cursor", async () => {
      // Test cursor parameter
    });

    it("should throw error on 403", async () => {
      // Test error handling
    });
  });

  describe("starMessage", () => {
    it("should call POST /messages/{id}/star", async () => {
      // Test star API
    });
  });

  describe("unstarMessage", () => {
    it("should call DELETE /messages/{id}/star", async () => {
      // Test unstar API
    });
  });
});
```

**File:** `src/hooks/queries/__tests__/useStarredMessages.test.ts`

```typescript
describe("useStarredMessages", () => {
  it("should fetch starred messages on mount", async () => {
    // Test hook loading state
    // Test data population
  });

  it("should handle loading state", () => {
    // Assert isLoading = true initially
  });

  it("should handle error state", async () => {
    // Mock API error
    // Assert isError = true
  });

  it("should invalidate cache on star/unstar", async () => {
    // Test cache invalidation
  });
});
```

### Integration Tests

**File:** `src/features/portal/components/__tests__/PinnedMessagesPanel.integration.test.tsx`

```typescript
describe("PinnedMessagesPanel Integration", () => {
  it("should display loading skeleton initially", () => {
    // Render component
    // Assert skeleton visible
  });

  it("should display starred messages after loading", async () => {
    // Mock API response
    // Wait for data
    // Assert messages rendered
  });

  it("should display error state on API failure", async () => {
    // Mock API error
    // Assert error message shown
    // Assert retry button present
  });

  it("should refetch on retry button click", async () => {
    // Trigger error
    // Click retry
    // Assert refetch called
  });
});
```

**Estimated Testing Time:** 2 hours

### E2E Tests (Playwright)

**File:** `tests/chat/starred-messages.spec.ts`

```typescript
import { test, expect } from "@playwright/test";

test.describe("Starred Messages Panel", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/portal");
    // Login flow
  });

  test("should display loading skeleton initially", async ({ page }) => {
    // Open starred messages panel
    await page.click('[data-testid="open-starred-panel-button"]');

    // Assert skeleton visible
    await expect(
      page.locator('[data-testid="starred-messages-loading-skeleton"]'),
    ).toBeVisible();
  });

  test("should display starred messages after loading", async ({ page }) => {
    await page.click('[data-testid="open-starred-panel-button"]');

    // Wait for data loaded
    await page.waitForSelector('[data-testid="starred-messages-list"]');

    // Assert messages visible
    const messages = page.locator('[data-testid^="starred-message-item-"]');
    await expect(messages).toHaveCount(await messages.count());
  });

  test("should unstar message on click", async ({ page }) => {
    await page.click('[data-testid="open-starred-panel-button"]');
    await page.waitForSelector('[data-testid="starred-messages-list"]');

    // Get first message ID
    const firstMessage = page
      .locator('[data-testid^="starred-message-item-"]')
      .first();
    const messageId = await firstMessage.getAttribute("data-testid");
    const id = messageId?.replace("starred-message-item-", "");

    // Click unstar
    await page.click(`[data-testid="starred-message-unstar-${id}"]`);

    // Assert message removed from list
    await expect(firstMessage).not.toBeVisible();
  });

  test("should display error state on API failure", async ({ page }) => {
    // Mock API error
    await page.route("**/conversations/*/starred-messages", (route) => {
      route.abort("failed");
    });

    await page.click('[data-testid="open-starred-panel-button"]');

    // Assert error state visible
    await expect(
      page.locator('[data-testid="starred-messages-error-state"]'),
    ).toBeVisible();

    // Assert retry button present
    await expect(
      page.locator('[data-testid="starred-messages-retry-button"]'),
    ).toBeVisible();
  });

  test("should retry on error button click", async ({ page }) => {
    // Mock API error then success
    let callCount = 0;
    await page.route("**/conversations/*/starred-messages", (route) => {
      callCount++;
      if (callCount === 1) {
        route.abort("failed");
      } else {
        route.fulfill({ json: [] });
      }
    });

    await page.click('[data-testid="open-starred-panel-button"]');
    await page.waitForSelector('[data-testid="starred-messages-error-state"]');

    // Click retry
    await page.click('[data-testid="starred-messages-retry-button"]');

    // Assert success state (empty or list)
    await expect(
      page.locator('[data-testid="starred-messages-list"]'),
    ).toBeVisible();
  });

  test("should display empty state when no starred messages", async ({
    page,
  }) => {
    await page.route("**/conversations/*/starred-messages", (route) => {
      route.fulfill({ json: [] });
    });

    await page.click('[data-testid="open-starred-panel-button"]');

    await expect(
      page.locator('[data-testid="starred-messages-empty-state"]'),
    ).toBeVisible();
  });
});
```

**Estimated E2E Testing Time:** 1 hour

---

## ⚠️ Known Risks & Mitigation

| Risk                                        | Impact | Mitigation                            |
| ------------------------------------------- | ------ | ------------------------------------- |
| Pagination logic unclear                    | HIGH   | Confirm with HUMAN trước khi code     |
| Conversation name không có trong MessageDto | MEDIUM | Cần API bổ sung hoặc workaround       |
| workTypeName mapping                        | MEDIUM | Xác nhận với HUMAN metadata structure |
| Snapshot chưa có                            | HIGH   | HUMAN cung cấp hoặc test credentials  |

---

## 📋 Pre-Implementation Checklist

- [ ] Requirements document approved
- [ ] API contract approved
- [ ] Snapshots available (or test credentials provided)
- [ ] Pending decisions resolved by HUMAN
- [ ] Test plan approved
- [ ] **data-testid requirements understood và sẽ được implement**
- [ ] **E2E test scenarios reviewed**

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                   | Lựa chọn                                 | HUMAN Decision            |
| --- | ------------------------ | ---------------------------------------- | ------------------------- |
| 1   | Pagination nextCursor    | API trả về hay dùng messageId cuối?      | ⬜ **\*\***\_\_\_**\*\*** |
| 2   | Conversation name source | Có trong MessageDto? Hay call riêng API? | ⬜ **\*\***\_\_\_**\*\*** |
| 3   | workTypeName mapping     | Lấy từ đâu trong response?               | ⬜ **\*\***\_\_\_**\*\*** |
| 4   | Skeleton items count     | Hiển thị 3, 5, hay 10 items?             | ⬜ **\*\***\_\_\_**\*\*** |
| 5   | Component rename         | Keep `PinnedMessagesPanel` hay đổi tên?  | ⬜ **\*\***\_\_\_**\*\*** |

---

## 📋 IMPACT SUMMARY

### Files sẽ tạo mới:

- `src/types/starred-messages.ts` - Type definitions từ Swagger
- `src/api/starred-messages.api.ts` - API client functions
- `src/hooks/queries/useStarredMessages.ts` - React Query hooks
- `src/api/__tests__/starred-messages.api.test.ts` - Unit tests
- `src/hooks/queries/__tests__/useStarredMessages.test.ts` - Hook tests
- `src/features/portal/components/__tests__/PinnedMessagesPanel.integration.test.tsx` - Integration tests
- **`tests/chat/starred-messages.spec.ts` - E2E tests với Playwright**

### Files sẽ sửa đổi:

- `src/features/portal/components/PinnedMessagesPanel.tsx` (~174 lines)
  - Đổi props từ `messages` → xoá (component tự fetch data)
  - Thay mock data bằng `useStarredMessages()` hook
  - Hiển thị ALL starred messages từ mọi conversations
  - Thêm LoadingSkeleton component (inline)
  - Thêm ErrorState component (inline)
  - Thêm transformStarredMessage helper
  - Update unstar handler để call API
- `src/features/portal/workspace/ChatMessagePanel.tsx` (~870 lines)
  - Comment/xoá import MapPin icon (line ~19)
  - Comment/xoá handlePinToggle function (lines ~317-324)
  - Comment/xoá onPin prop trong MessageActions (line ~711)
- `src/features/portal/workspace/WorkspaceView.tsx` (~400 lines)
  - Xoá pinnedMessages, onClosePinned, onOpenPinnedMessage props (lines ~110-112)
  - Xoá workspaceMode, setWorkspaceMode props (lines ~108-109)
  - Giữ lại onToggleStar prop
  - PinnedMessagesPanel không cần truyền conversationId nữa (component tự fetch ALL)

### Dependencies sẽ thêm:

- (Không có - đã có `@tanstack/react-query`, `axios`)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                      | Status        |
| ----------------------------- | ------------- |
| Đã review Implementation Plan | ✅ Đã review  |
| Đã điền Pending Decisions     | ✅ Đã điền    |
| Đã approve testing strategy   | ✅ Đã approve |
| **APPROVED để thực thi**      | ✅ APPROVED   |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-01-28

> ✅ **AI ĐÃ ĐƯỢC PHÉP bắt đầu coding**
