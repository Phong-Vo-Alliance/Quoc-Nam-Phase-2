# Phân Tích: Tại sao API gọi lại khi gửi/nhận tin nhắn và Unread Count biến mất

> **Created:** 2026-02-11
> **Status:** Analysis Complete
> **Related Bug:** Unread count xuất hiện rồi biến mất (flash effect)

---

## 📋 TÓM TẮT VẤN ĐỀ

Khi gửi hoặc nhận tin nhắn, các API sau bị gọi lại:

1. `GET /api/categories`
2. `GET /api/conversations`
3. `GET /api/conversations/{id}/members`

**Đây CHÍNH LÀ nguyên nhân khiến unread count xuất hiện rồi biến mất** (flash effect).

---

## 🔍 PHÂN TÍCH CHI TIẾT

### 1. Luồng hiện tại khi nhận tin nhắn

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SIGNALR MESSAGE_SENT EVENT                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│          SignalRProvider.tsx - Global Event Handler                  │
│                                                                      │
│  chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, (event) => {              │
│    queryClient.invalidateQueries({ queryKey: ["messages"] });       │
│    queryClient.invalidateQueries({ queryKey: ["categories"] });  ◄──┼── PROBLEM!
│    queryClient.invalidateQueries({ queryKey: ["conversations"] });◄─┼── PROBLEM!
│  });                                                                 │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              TanStack Query: Refetch triggered                       │
│                                                                      │
│  GET /api/categories  → Server returns data WITHOUT unreadCount     │
│  GET /api/conversations → Server returns data WITHOUT unreadCount   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              useCategories.ts - Transform Response                   │
│                                                                      │
│  // API KHÔNG trả về unreadCount, nên client tự thêm = 0            │
│  return data.map((category) => ({                                   │
│    ...category,                                                      │
│    conversations: category.conversations.map(conv => ({             │
│      ...conv,                                                        │
│      unreadCount: 0,  // ◄── LUÔN RESET VỀ 0!!!                     │
│    })),                                                              │
│  }));                                                                │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     UNREAD COUNT = 0 (biến mất)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2. Vị trí code gây ra vấn đề

#### 2.1. SignalRProvider.tsx (lines 53-61)

```typescript
// src/providers/SignalRProvider.tsx

// MessageSent
chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, (event: any) => {
  console.log("[SignalRProvider] MESSAGE_SENT event received:", event);
  const conversationId =
    event?.conversationId || event?.message?.conversationId;
  if (conversationId) {
    queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    queryClient.invalidateQueries({ queryKey: ["categories"] }); // ❌ GÂY REFETCH
    queryClient.invalidateQueries({ queryKey: ["conversations"] }); // ❌ GÂY REFETCH
  }
});

// MessageRead (lines 63-69)
chatHub.on(SIGNALR_EVENTS.MESSAGE_READ, (event: any) => {
  console.log("[SignalRProvider] MESSAGE_READ event received:", event);
  queryClient.invalidateQueries({ queryKey: ["categories"] }); // ❌ GÂY REFETCH
  queryClient.invalidateQueries({ queryKey: ["conversations"] }); // ❌ GÂY REFETCH
});
```

#### 2.2. useCategories.ts (lines 42-54)

```typescript
// src/hooks/queries/useCategories.ts

export function useCategories() {
  return useQuery<CategoryWithUnread[], Error>({
    queryKey: categoriesKeys.list(),
    queryFn: async () => {
      const data = await categoriesApi.getCategories();
      // Transform ONCE when fetching from API: Add unreadCount = 0
      return data.map((category) => ({
        ...category,
        conversations: category.conversations.map(
          (conv): ConversationWithUnread => ({
            ...conv,
            unreadCount: 0, // ❌ LUÔN RESET VỀ 0 SAU MỖI REFETCH
          }),
        ),
      }));
    },
    // ...
  });
}
```

### 3. Các hooks cố gắng update unreadCount locally (NHƯNG BỊ OVERWRITE)

#### 3.1. useCategoriesRealtime.ts

```typescript
// Cố gắng update unreadCount khi nhận MESSAGE_SENT
const handleMessageSent = (data: any) => {
  queryClient.setQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
    (oldData) => {
      // ... update unreadCount +1
      // ❌ SẼ BỊ OVERWRITE khi SignalRProvider gọi invalidateQueries
    },
  );
};
```

#### 3.2. useMessageRealtime.ts

```typescript
// Cũng cố gắng update unreadCount
queryClient.setQueryData(categoriesKeys.list(), updatedCategories);
// ❌ SẼ BỊ OVERWRITE khi SignalRProvider gọi invalidateQueries
```

### 4. Timeline của bug

```
T+0ms:    SignalR nhận MESSAGE_SENT event
T+1ms:    useCategoriesRealtime setQueryData → unreadCount = 1 (hiển thị)
T+2ms:    SignalRProvider invalidateQueries → trigger refetch
T+100ms:  API response arrives → unreadCount = 0 (biến mất)
```

**User nhìn thấy:** Unread count hiện lên 1 → flash → biến mất trong ~100ms

---

## 🎯 NGUYÊN NHÂN GỐC

| Vấn đề                                        | Mô tả                                                          |
| --------------------------------------------- | -------------------------------------------------------------- |
| **API không trả về unreadCount**              | `/api/categories` KHÔNG có field `unreadCount` trong response  |
| **Client-side tracking**                      | Frontend tự track `unreadCount` bằng cách khởi tạo = 0         |
| **Duplicate event handling**                  | SignalRProvider VÀ useCategoriesRealtime đều handle cùng event |
| **invalidateQueries overwrites setQueryData** | `invalidateQueries` trigger refetch, xóa mọi client-side state |

---

## 💡 GIẢI PHÁP ĐỀ XUẤT

### Option A: Backend trả về unreadCount (RECOMMENDED)

**Yêu cầu Backend:**

- `/api/categories` response thêm field `unreadCount` cho mỗi conversation
- Khi có MESSAGE_SENT, server broadcast unreadCount mới trong event

**Pros:**

- Single source of truth
- Không cần client-side tracking phức tạp

**Cons:**

- Cần thay đổi Backend

### Option B: Bỏ invalidateQueries trong SignalRProvider

```typescript
// BEFORE (hiện tại)
chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, (event: any) => {
  queryClient.invalidateQueries({ queryKey: ["categories"] });
  queryClient.invalidateQueries({ queryKey: ["conversations"] });
});

// AFTER (fix)
chatHub.on(SIGNALR_EVENTS.MESSAGE_SENT, (event: any) => {
  // ❌ BỎ invalidateQueries cho categories/conversations
  // ✅ Để useCategoriesRealtime và useMessageRealtime handle bằng setQueryData
});
```

**Pros:**

- Fix ngay không cần Backend thay đổi

**Cons:**

- Có thể miss updates nếu client-side logic có bug
- Vẫn phải xử lý edge cases (reconnect, multiple tabs, etc.)

### Option C: Merge data khi refetch (phức tạp)

```typescript
// useCategories.ts
queryFn: async () => {
  const data = await categoriesApi.getCategories();
  const existingData = queryClient.getQueryData<CategoryWithUnread[]>(
    categoriesKeys.list(),
  );

  // Merge: Keep existing unreadCount if no API value
  return data.map((category) => ({
    ...category,
    conversations: category.conversations.map((conv) => {
      const existing = existingData
        ?.find((c) => c.id === category.id)
        ?.conversations.find((c) => c.conversationId === conv.conversationId);
      return {
        ...conv,
        unreadCount: existing?.unreadCount ?? 0,
      };
    }),
  }));
};
```

**Pros:**

- Giữ được unreadCount qua các lần refetch

**Cons:**

- Có thể stale nếu user đã đọc ở device khác

---

## ⚡ QUICK FIX (Nên áp dụng ngay)

Trong [SignalRProvider.tsx](../src/providers/SignalRProvider.tsx):

```typescript
// ❌ REMOVE these lines from MESSAGE_SENT handler:
queryClient.invalidateQueries({ queryKey: ["categories"] });
queryClient.invalidateQueries({ queryKey: ["conversations"] });

// ❌ REMOVE these lines from MESSAGE_READ handler:
queryClient.invalidateQueries({ queryKey: ["categories"] });
queryClient.invalidateQueries({ queryKey: ["conversations"] });

// ✅ KEEP only this (for MESSAGE_SENT):
queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
```

**Lý do:**

- `useCategoriesRealtime` và `useMessageRealtime` đã handle cập nhật categories/conversations bằng `setQueryData` một cách optimistic
- `invalidateQueries` cho messages vẫn cần vì cần lấy message content mới nhất

---

## 📊 TESTING CHECKLIST

Sau khi fix, test các case:

| Test Case                     | Expected                                                     |
| ----------------------------- | ------------------------------------------------------------ |
| User A gửi tin → User B nhận  | Badge +1, không flash                                        |
| User B click vào conversation | Badge = 0                                                    |
| Refresh page                  | Badge giữ nguyên (nếu Backend support) hoặc = 0 (acceptable) |
| Reconnect SignalR             | Badge không bị reset                                         |
| Multiple tabs                 | Badge consistent                                             |

---

## 📁 FILES INVOLVED

| File                                                              | Role                              |
| ----------------------------------------------------------------- | --------------------------------- |
| [SignalRProvider.tsx](../src/providers/SignalRProvider.tsx)       | Gây invalidateQueries sai         |
| [useCategories.ts](../src/hooks/queries/useCategories.ts)         | Reset unreadCount = 0             |
| [useCategoriesRealtime.ts](../src/hooks/useCategoriesRealtime.ts) | Client-side update (bị overwrite) |
| [useMessageRealtime.ts](../src/hooks/useMessageRealtime.ts)       | Client-side update (bị overwrite) |
| [categories.api.ts](../src/api/categories.api.ts)                 | API client                        |
| [conversations.api.ts](../src/api/conversations.api.ts)           | API client                        |

---

## ✅ CONCLUSION

**Trả lời câu hỏi của bạn:**

1. **Tại sao API được gọi lại?**
   - Do `SignalRProvider` gọi `invalidateQueries` mỗi khi nhận SignalR event
   - Đây là design decision cũ để "sync" data nhưng gây side effect

2. **Đây có phải nguyên nhân unread count biến mất?**
   - **CÓ, CHÍNH XÁC!**
   - `invalidateQueries` → refetch → `unreadCount` bị reset về 0

3. **Tại sao `/api/conversations/{id}/members` cũng bị gọi?**
   - Do `useConversationMembers` hook có reference tới `conversationId` thay đổi
   - Không liên quan trực tiếp đến unread count bug
