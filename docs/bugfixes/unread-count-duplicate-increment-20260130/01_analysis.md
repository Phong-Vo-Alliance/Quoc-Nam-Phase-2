# [BUG ANALYSIS] Unread Count - Duplicate Increment Issue

**Ngày:** 2026-01-30  
**Trạng thái:** ⏳ Phân tích hoàn tất - Chờ HUMAN approval để fix

---

## 📋 Vấn đề

### Hiện tượng

1. **Ở vùng category:** Khi có 1 tin nhắn mới đến → unread count bị cộng dồn nhiều lần (duplicate increment)
2. **Ở ChatHeader:** Chưa hiển thị unread count theo conversation selector tabs

### Mong muốn

- Khi tin nhắn đến conversation **không active** → unread count tăng lên đúng 1 lần
- Khi mở conversation đó → gọi API mark-read → unread count giảm về 0
- ChatHeader hiển thị unread count trong conversation selector tabs

---

## 🔍 Phân tích nguyên nhân (Root Cause Analysis)

### Nguyên nhân chính: **DUPLICATE EVENT HANDLING**

Hiện tại có **3 hooks** đều lắng nghe `MessageSent` event từ SignalR:

#### 1. `useCategoriesRealtime.ts` (Line 115-185)

```typescript
const handleMessageSent = (data: any) => {
  const { message } = data;
  // ... extract message data ...

  queryClient.setQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
    (oldData) => {
      // Update lastMessage + increment unreadCount
      const shouldIncrement = senderId !== currentUserId;
      const newUnreadCount = shouldIncrement
        ? (conv.unreadCount || 0) + 1  // ✅ INCREMENT 1
        : conv.unreadCount || 0;

      return {
        ...conv,
        lastMessage: {...},
        unreadCount: newUnreadCount,
      };
    }
  );
};

chatHub.onMessageSent(handleMessageSent); // ✅ LISTEN 1
```

**Chức năng:** Update category list với lastMessage + unreadCount

---

#### 2. `useConversationRealtime.ts` (Line 63-70)

```typescript
// ❌ REMOVED: handleMessageSent
// Reason: MESSAGE_SENT is now handled by useMessageRealtime to avoid duplicate processing
```

**Chức năng:** Hook này đã REMOVED handleMessageSent, chỉ xử lý MessageRead và ConversationUpdated

---

#### 3. `useMessageRealtime.ts` (Line 82-130)

```typescript
const handleMessageSent = useCallback(
  (data: MessageSentEvent | ChatMessage) => {
    const rawMessage = "message" in data ? data.message : data;

    // Only handle messages for this conversation
    if (message.conversationId !== conversationId) {
      return; // ⚠️ BỎ QUA tin nhắn của conversations khác
    }

    // Update messages cache for ACTIVE conversation only
    queryClient.setQueryData(messagesKeys.list(...), ...);
  },
  [conversationId, queryClient]
);

chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, handleMessageSent); // ✅ LISTEN 2
```

**Chức năng:** Update message list cho conversation **đang active**

---

### 🐛 LỖI Ở ĐÂU?

#### Vấn đề 1: Category unread count duplicate increment

**Flow hiện tại khi có MessageSent:**

```
MessageSent event từ SignalR
    │
    ├─► useCategoriesRealtime.handleMessageSent()
    │   └─► Update categoriesKeys.list()
    │       └─► Increment unreadCount + 1  ✅ OK
    │
    └─► useMessageRealtime.handleMessageSent()
        └─► if (conversationId !== activeConversationId) return;
            └─► Không làm gì với category cache ✅ OK
```

**NHƯNG VẤN ĐỀ:**

File `ChatMainContainer.tsx` line 303-316:

```typescript
// Merge unread count from groups (realtime) into category conversations
const categoryConversations = useMemo(() => {
  const conversations = selectedCategory?.conversations ?? [];
  return conversations.map((conv) => {
    const groupData = apiGroups.find((g) => g.id === conv.conversationId);
    return {
      ...conv,
      // ⚠️ OVERWRITE unread count từ groups API
      unreadCount: groupData?.unreadCount ?? conv.unreadCount ?? 0,
    };
  });
}, [activeCategoryId, categories, apiGroups, groupsQuery.dataUpdatedAt]);
```

**PROBLEM:**

1. `useCategoriesRealtime` cập nhật `categoriesKeys.list()` cache → unreadCount + 1 ✅
2. `useGroups` query fetch từ API trả về **stale data** (chưa có message mới)
3. `ChatMainContainer` merge data → **OVERWRITE** unreadCount từ `apiGroups` (stale)
4. Result: unreadCount bị reset về giá trị cũ

**TỆNH ĐẾT HƠN:**

- Nếu `useGroups` refetch sau khi `useCategoriesRealtime` update
- Server trả về unreadCount đã tăng (vì MessageSent event đã xử lý ở server)
- Frontend cũng đã increment (qua useCategoriesRealtime)
- → **DUPLICATE INCREMENT!**

---

#### Vấn đề 2: ChatHeader không hiển thị unread count

File `ChatHeader.tsx` line 196-202:

```typescript
const unread = (conv as any).unreadCount;
if (unread !== undefined && unread > 0) {
  return (
    <span className="...">
      {unread > 99 ? "99+" : unread}
    </span>
  );
}
```

**Code đúng nhưng data không có!**

- `categoryConversations` prop được truyền vào từ `ChatMainContainer`
- Nhưng data đã bị OVERWRITE bởi `apiGroups` merge logic (line 303-316)
- Nếu `apiGroups` chưa refetch → unreadCount = 0 → badge không hiển thị

---

### 🎯 Root Causes Summary

| #   | Root Cause                                  | Impact                                      |
| --- | ------------------------------------------- | ------------------------------------------- |
| 1   | **Merge logic overwrite realtime updates**  | Category unreadCount bị reset về stale data |
| 2   | **useGroups API data conflicts with cache** | Duplicate increment khi refetch             |
| 3   | **No invalidation after mark-read**         | unreadCount không giảm sau khi mark-read    |
| 4   | **ChatHeader dùng data đã bị overwrite**    | Không hiển thị unread count                 |

---

## 🔧 Giải pháp đề xuất

### Solution 1: Remove merge logic, use SINGLE SOURCE OF TRUTH

**❌ XOÁ:** Merge logic ở `ChatMainContainer.tsx` line 303-316

**✅ DÙNG:** `categoriesKeys.list()` cache làm SINGLE SOURCE cho category conversations

**Lý do:**

- `useCategoriesRealtime` đã xử lý MessageSent + MessageRead
- Không cần merge từ `useGroups` API (gây conflict)
- Category API đã trả về đầy đủ conversations + unreadCount

---

### Solution 2: Fix mark-read flow

**Hiện tại:**

```
User clicks conversation
    │
    └─► onChatChange() → setSelectedConversation()
        └─► ??? (không có mark-read call)
```

**Cần thêm:**

```
User clicks conversation
    │
    └─► onChatChange()
        ├─► setSelectedConversation()
        └─► useMarkConversationAsRead.mutate()
            └─► API call: POST /conversations/{id}/mark-read
                └─► useCategoriesRealtime.handleMessageRead()
                    └─► Update categoriesKeys.list() → unreadCount = 0
```

---

### Solution 3: ChatHeader use correct data

**Hiện tại:** ChatHeader nhận data từ `categoryConversations` (đã bị overwrite)

**Sửa:** Pass data trực tiếp từ `categories` query (không qua merge)

---

## 📊 Impact Summary

### Files cần sửa:

1. `src/features/portal/components/chat/ChatMainContainer.tsx`
   - Xoá merge logic (line 303-316)
   - Thêm mark-read call khi onChatChange
   - Pass correct data to ChatHeader

2. `src/hooks/useCategoriesRealtime.ts`
   - Kiểm tra logic handleMessageSent (đã OK)
   - Kiểm tra logic handleMessageRead (đã OK)

3. `src/features/portal/components/chat/ChatHeader.tsx`
   - Verify unread count display logic (đã OK)

### Files KHÔNG cần sửa:

- ✅ `useConversationRealtime.ts` - Đã REMOVED handleMessageSent
- ✅ `useMessageRealtime.ts` - Chỉ xử lý active conversation
- ✅ `useMarkConversationAsRead.ts` - API call đúng
- ✅ `conversations.api.ts` - Endpoint đúng

---

## 🧪 Test Cases cần verify

### TC-1: Tin nhắn đến conversation không active

**Given:** User đang xem conversation A  
**When:** Tin nhắn mới đến conversation B  
**Then:**

- ✅ Category list: Conversation B unreadCount +1
- ✅ ChatHeader tabs: Conversation B badge hiển thị "1"
- ✅ KHÔNG có duplicate increment

### TC-2: Mark-read khi switch conversation

**Given:** Conversation B có unreadCount = 3  
**When:** User click vào conversation B  
**Then:**

- ✅ API call: POST /conversations/{B}/mark-read
- ✅ Category list: Conversation B unreadCount = 0
- ✅ ChatHeader tabs: Badge ẩn đi

### TC-3: Multiple messages received

**Given:** User đang xem conversation A  
**When:** 3 tin nhắn mới đến conversation B  
**Then:**

- ✅ unreadCount tăng từ 0 → 1 → 2 → 3 (tuần tự)
- ✅ KHÔNG có duplicate: 0 → 2 → 4 → 6

### TC-4: Current user send message

**Given:** User đang xem conversation A  
**When:** User gửi tin nhắn trong conversation A  
**Then:**

- ✅ Conversation A unreadCount KHÔNG tăng
- ✅ Other conversations không bị ảnh hưởng

---

## ⏳ PENDING DECISIONS

| #   | Vấn đề                          | Lựa chọn                                  | HUMAN Decision                   |
| --- | ------------------------------- | ----------------------------------------- | -------------------------------- |
| 1   | Có xoá `useGroups` query không? | Xoá hoàn toàn / Giữ lại nhưng không merge | ✅ **Giữ lại nhưng không merge** |
| 2   | Mark-read gọi ở đâu?            | ChatMainContainer / ConversationListItem  | ✅ **ChatMainContainer**         |
| 3   | Debounce mark-read?             | Có (500ms) / Không                        | ✅ **Không**                     |

**Gợi ý AI:**

1. **Giữ lại `useGroups`** nhưng KHÔNG merge vào categoryConversations
   - Lý do: Có thể cần cho features khác
2. **Mark-read ở ChatMainContainer** trong onChatChange
   - Lý do: Centralized control, dễ test
3. **KHÔNG debounce** mark-read
   - Lý do: User đã click → expect instant mark

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review analysis        | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để fix**       | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-01-30

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC code nếu mục "APPROVED để fix" = ⬜ CHƯA APPROVED**
