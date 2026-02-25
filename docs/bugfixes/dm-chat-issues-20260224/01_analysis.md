# [BƯỚC 1] Analysis - DM Chat Issues

> **Module:** Chat - Direct Messages
> **Created:** 2026-02-24
> **Status:** ✅ COMPLETED

---

## ⚠️ Update 2026-02-24

**Issue 3 (ChatHeader DM name)** và **Issue 4 (UI consistency)** đã được giải quyết bằng cách chỉnh API backend để trả về tên DM đúng ngay từ đầu, thay vì format "DM: User1 <> User2".

- **Frontend đã loại bỏ** toàn bộ logic `getDisplayName()` và `getDMDisplayName()`
- Chỉ cần hiển thị `conversation.name` trực tiếp từ API

---

## 🔍 Root Cause Analysis

### Issue 1: Unread count không hiển thị khi nhận tin nhắn mới

**Triệu chứng:**

- Đang mở conversation DM khác
- Nhận được tin nhắn mới từ DM khác
- Unread badge KHÔNG hiển thị trên conversation list

**Root Cause:**

Luồng xử lý SignalR MESSAGE_SENT cho conversations:

```
┌─────────────────────────────────────────────────────────────────────┐
│  MESSAGE_SENT Event                                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  SignalRProvider.tsx (line 64-73)                                   │
│  └── Log event                                                      │
│  └── invalidateQueries(["messages", conversationId]) ❌ KHÔNG      │
│      update unread count cho conversations                          │
│                                                                     │
│  useCategoriesRealtime.ts (line 112-181)                           │
│  └── handleMessageSent()                                            │
│  └── setQueryData(categoriesKeys.list())                           │
│  └── ✅ Update lastMessage + unreadCount CHO CATEGORIES (GROUP)    │
│  └── ❌ KHÔNG update cho directs (DM)                              │
│                                                                     │
│  useMessageRealtime.ts (line 73-139)                                │
│  └── handleMessageSent()                                            │
│  └── setQueryData(messageKeys.conversation())                       │
│  └── ✅ Update messages cache                                       │
│  └── ❌ REMOVED: Categories/directs cache update (line 130-136)    │
│                                                                     │
│  useConversationRealtime.ts                                         │
│  └── ❌ MESSAGE_SENT handler REMOVED (line 70-72)                  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Kết luận:** Không có handler nào update unread count cho directs (DM) khi nhận MESSAGE_SENT.

**Solution:** Tạo `useDirectsRealtime.ts` hook hoặc mở rộng `useCategoriesRealtime.ts` để handle cả directs.

**Recommended Approach:** Tạo hook mới `useDirectsRealtime.ts` vì:

1. Separation of concerns - Categories và Directs là 2 data sources khác nhau
2. Tránh making useCategoriesRealtime quá phức tạp
3. Dễ test và maintain hơn
4. Có thể enable/disable riêng biệt

---

### Issue 2: LastMessage preview không cập nhật bên vùng sidebar

**Triệu chứng:**

- Nhận tin nhắn mới trong DM
- Sidebar vẫn hiển thị tin nhắn cũ
- Không thấy format: "[username]: Nội dung tin nhắn..."

**Root Cause:**

Tương tự Issue 1 - `useCategoriesRealtime` chỉ update categories cache, không update directs cache:

```typescript
// useCategoriesRealtime.ts - line 129-172
queryClient.setQueryData<CategoryWithUnread[]>(
  categoriesKeys.list(), // ✅ Chỉ update categories
  (oldData) => {
    // Update lastMessage cho categories
  },
);

// ❌ KHÔNG CÓ setQueryData cho conversationKeys.directs()
```

**Solution:** Thêm logic update `conversationKeys.directs()` cache với lastMessage mới.

---

### Issue 3: ChatHeader hiển thị "DM: User1 <> User2" thay vì chỉ tên người kia

**Triệu chứng:**

- ChatHeader hiển thị: "DM: Lữ Ngọc Vĩnh Thái <> Lê Ngọc Minh"
- Mong muốn: Chỉ hiển thị tên người kia (VD: "Lữ Ngọc Vĩnh Thái")

**Root Cause:**

File `ChatHeader.tsx` có 2 nơi xử lý display name:

```typescript
// ChatHeader.tsx - line 60-65
const getDisplayName = (name: string, type?: "GRP" | "DM") => {
  if (type === "DM") {
    return name.replace(/^DM:\s*/, "").split(" <> ")[0]; // ❌ Lấy người đầu tiên
  }
  return name;
};

// ChatHeader.tsx - line 126-140 (headerDisplayName useMemo)
if (conversationType === "DM" && members.length > 0) {
  const currentUserId = useAuthStore.getState().user?.id;
  const otherMember = members.find((m) => m.userId !== currentUserId);
  if (otherMember?.userName) {
    return otherMember.userName; // ✅ Lấy tên người kia đúng
  }
}
// ❌ Fallback về displayName = getDisplayName() lấy người đầu tiên
```

**Problem Analysis:**

1. `getDisplayName()` (line 60-65) luôn lấy phần đầu tiên sau split `" <> "`
2. `headerDisplayName` useMemo (line 126-140) ưu tiên dùng members array
3. Tuy nhiên khi members chưa load hoặc không có `userName`, fallback về `displayName` SAI

**Solution:**

1. Fix `getDisplayName()` để truyền currentUserId và lọc đúng người kia
2. Hoặc sử dụng helper `getDMDisplayName()` từ `src/types/conversations.ts`

---

### Issue 4: UI conversation list ban đầu khác với UI thật sau khi tạo chat

**Triệu chứng:**

- Khi load danh sách conversation (initial render), UI hiển thị khác
- Sau khi tạo đoạn chat mới, UI hiển thị đúng
- Mong muốn: UI nhất quán

**Root Cause:**

Cần xác định chính xác sự khác biệt. Dựa trên code analysis:

```typescript
// ConversationListSidebar.tsx - line 302-356
// mergedContacts useMemo tạo ContactItem với:
const merged: ContactItem[] = [];

// 1. Add existing conversations (có lastMessage)
conversations.forEach((conv) => {
  merged.push({
    // ...
    hasConversation: true,
    conversation: conv, // ✅ Có conversation object
  });
});

// 2. Add department members without conversations
departmentMembers.forEach((member) => {
  merged.push({
    // ...
    hasConversation: false, // ❌ Không có conversation
    departmentMember: member,
  });
});
```

**Possible Issues:**

1. Department members hiển thị khác với conversations (không có lastMessage, avatar khác)
2. Avatar generation logic khác nhau giữa 2 loại

**HUMAN Decision Required:** Cần clarify chính xác sự khác biệt UI.

---

### Issue 5: Avatar lấy chữ cái đầu thay vì 2 chữ cái cuối

**Triệu chứng:**

- Avatar hiển thị: "L" (chữ đầu của "Lữ Ngọc...")
- Mong muốn: "NH" (2 chữ cuối - VD: "Ngoc Minh" -> "NM" hoặc "Minh" -> "MI")

**Root Cause:**

```typescript
// ConversationItem.tsx - line 64
<span className="text-sm font-semibold text-gray-700">
  {name.charAt(0).toUpperCase()} // ❌ Chỉ lấy chữ đầu tiên
</span>

// Avatar.tsx - line 17
return cleanName.charAt(0).toUpperCase(); // ❌ Tương tự
```

**HUMAN Decision Required:** Clarify "2 chữ cái cuối cùng":

- Option A: 2 ký tự cuối của tên đầy đủ (VD: "Lữ Ngọc Minh" → "NH")
- Option B: 2 chữ cái đầu của 2 từ cuối (VD: "Lữ Ngọc Minh" → "NM")
- Option C: 2 ký tự cuối của từ cuối cùng (VD: "Minh" → "NH")

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

| File                              | Description                                     |
| --------------------------------- | ----------------------------------------------- |
| `src/hooks/useDirectsRealtime.ts` | Hook xử lý realtime cho directs (DM) - Option A |

### Files sẽ sửa đổi:

| File                                                        | Thay đổi                                                             |
| ----------------------------------------------------------- | -------------------------------------------------------------------- |
| `src/hooks/useCategoriesRealtime.ts`                        | **Option B:** Thêm logic update directs cache (thay vì tạo hook mới) |
| `src/features/portal/components/chat/ChatHeader.tsx`        | Fix `getDisplayName()` để lấy đúng tên người kia                     |
| `src/features/portal/components/ConversationItem.tsx`       | Thay đổi avatar initials logic                                       |
| `src/features/portal/components/Avatar.tsx`                 | Thay đổi initials logic (nếu cần)                                    |
| `src/features/portal/workspace/ConversationListSidebar.tsx` | Có thể cần sửa để call realtime hook                                 |

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có)

---

## 🛡️ GROUP SAFETY ANALYSIS (Đảm bảo không ảnh hưởng GROUP)

### ✅ Cam kết: KHÔNG thay đổi logic GROUP

| Component                       | Cách tách biệt                                                     | Đảm bảo an toàn                       |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------------------- |
| **useDirectsRealtime.ts** (MỚI) | Hook hoàn toàn RIÊNG BIỆT, chỉ update `conversationKeys.directs()` | ✅ Không chạm `categoriesKeys.list()` |
| **useCategoriesRealtime.ts**    | **KHÔNG SỬA** - giữ nguyên 100%                                    | ✅ Không thay đổi gì                  |
| **ConversationItem.tsx**        | Thêm điều kiện `if (conversation.type === "DM")`                   | ✅ GROUP vẫn dùng logic cũ            |
| **ChatHeader.tsx**              | Logic đã có sẵn `if (type === "DM")` block                         | ✅ GROUP skip block này               |
| **Avatar.tsx**                  | Thêm tham số `isDM?: boolean` optional                             | ✅ Mặc định false → giữ logic cũ      |

### Code Isolation Patterns:

```typescript
// Pattern 1: useDirectsRealtime.ts - HOÀN TOÀN TÁCH BIỆT
// Chỉ update directs cache, KHÔNG chạm categories cache
queryClient.setQueryData(conversationKeys.directs(), ...); // ✅ Only DM
// KHÔNG CÓ: queryClient.setQueryData(categoriesKeys.list(), ...);

// Pattern 2: ConversationItem.tsx - CONDITIONAL
const getAvatarInitials = (name: string, type: "GRP" | "DM") => {
  if (type === "DM") {
    return getLastTwoInitials(name); // 🆕 Logic mới cho DM
  }
  return name.charAt(0).toUpperCase(); // ✅ Giữ nguyên cho GROUP
};

// Pattern 3: ChatHeader.tsx - ĐÃ CÓ SẴN CONDITIONAL
const getDisplayName = (name: string, type?: "GRP" | "DM") => {
  if (type === "DM") {
    // 🔧 Sửa logic bên trong block này
    return fixedDMLogic(name);
  }
  return name; // ✅ GROUP không bị ảnh hưởng
};
```

### Testing Matrix để verify:

| Test Case                           | DM Expected               | GROUP Expected                  | Verify         |
| ----------------------------------- | ------------------------- | ------------------------------- | -------------- |
| Receive message while on other conv | ✅ Show unread badge      | ✅ Show unread badge (existing) | Separate hooks |
| LastMessage preview update          | ✅ Update immediately     | ✅ Update (existing)            | Separate hooks |
| ChatHeader display                  | ✅ Only other person name | "Group Name" (unchanged)        | Type check     |
| Avatar initials                     | ✅ Last 2 chars           | First char (unchanged)          | Type check     |

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                           | Lựa chọn                                                                                                                                 | HUMAN Decision      |
| --- | ------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------- |
| 1   | Cách xử lý directs realtime                      | A) Tạo hook mới `useDirectsRealtime.ts` <br/> B) Mở rộng `useCategoriesRealtime.ts` (recommended)                                        | ⬜ \***\*\_\_\*\*** |
| 2   | Avatar initials cho DM                           | A) 2 ký tự cuối tên (VD: "Minh" → "NH") <br/> B) 2 chữ đầu của 2 từ cuối (VD: "Ngọc Minh" → "NM") <br/> C) Chữ đầu của từ cuối (VD: "M") | ⬜ \***\*\_\_\*\*** |
| 3   | UI conversation list: Sự khác biệt cụ thể là gì? | Cần HUMAN mô tả chi tiết                                                                                                                 | ⬜ \***\*\_\_\*\*** |
| 4   | Scope áp dụng avatar mới                         | A) Chỉ DM <br/> B) Cả DM và Group (cần confirm)                                                                                          | ⬜ \***\*\_\_\*\*** |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## 🧪 Testing Requirements (Initial)

| Scenario                                    | Expected Result                      |
| ------------------------------------------- | ------------------------------------ |
| Receive DM while viewing other conversation | Unread badge should appear           |
| Receive DM while viewing same conversation  | No unread badge increment            |
| DM message content preview                  | Should show "[sender]: [content]..." |
| ChatHeader for DM                           | Should only show other person's name |
| Avatar initials                             | Should show selected format          |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                                | Status                           |
| --------------------------------------- | -------------------------------- |
| Đã review Root Cause Analysis           | ✅ ĐÃ REVIEW                     |
| Đã review Impact Summary                | ✅ ĐÃ REVIEW                     |
| Đã điền Pending Decisions               | ✅ ĐÃ ĐIỀN (Auto: A, B, Skip, A) |
| **APPROVED để tạo Implementation Plan** | ✅ APPROVED                      |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-24

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC tạo Implementation Plan nếu mục "APPROVED để tạo Implementation Plan" = ⬜ CHƯA**
