# [BƯỚC 1] Requirements - UI Enhancements

> **Feature:** Chat UI Enhancements Bundle  
> **Version:** 1.0.0  
> **Created:** 2026-02-25  
> **Status:** ✅ IMPLEMENTED

---

## 📋 Feature Requirements

### Feature 1: Paste Ảnh từ Clipboard

**User Story:**

> Là người dùng, tôi muốn paste ảnh từ clipboard (Ctrl+V) vào ô chat, để có thể gửi ảnh nhanh hơn mà không cần chọn file.

**Functional Requirements:**

| ID   | Requirement                                                                                  | Priority |
| ---- | -------------------------------------------------------------------------------------------- | -------- |
| F1.1 | Khi user paste (Ctrl+V) trong vùng chat input, hệ thống phải detect clipboard có image không | Must     |
| F1.2 | Nếu clipboard có image, thêm vào danh sách selectedFiles như khi upload                      | Must     |
| F1.3 | Hiển thị ảnh preview giống như upload file thông thường                                      | Must     |
| F1.4 | Tên file mặc định: `pasted-image-{timestamp}.png`                                            | Should   |
| F1.5 | Hỗ trợ các format: PNG, JPEG, GIF, WebP                                                      | Should   |

**Technical Notes:**

- Sử dụng `ClipboardEvent` và `clipboardData.items`
- Convert clipboard item sang `File` object
- Reuse existing file upload logic trong ChatMainContainer

---

### Feature 2: Reply Tin Nhắn Bản Thân → Hiển Thị "Bạn"

**User Story:**

> Là người dùng, khi tôi reply tin nhắn của chính mình, tôi muốn thấy "Bạn" thay vì tên đầy đủ để dễ nhận biết hơn.

**Functional Requirements:**

| ID   | Requirement                                                                         | Priority |
| ---- | ----------------------------------------------------------------------------------- | -------- |
| F2.1 | Nếu `quotedMessage.senderId === currentUser.id`, hiển thị "Bạn"                     | Must     |
| F2.2 | Nếu `quotedMessage.senderId !== currentUser.id`, hiển thị `senderName` như hiện tại | Must     |
| F2.3 | Áp dụng cho cả variant `input` và `message`                                         | Must     |

**Current Code Analysis:**

Trong `QuotedMessagePreview.tsx`, hiện đang hiển thị:

```tsx
<span data-testid="quoted-preview-sender-name">{quotedMessage.senderName}</span>
```

**Cần thay đổi:**

- Truyền thêm prop `currentUserId` hoặc lấy từ `useAuthStore`
- So sánh và hiển thị "Bạn" nếu match

**⚠️ Note:** Cần bổ sung `senderId` vào `QuotedMessageData` interface trong `replyStore.ts`

**📝 Implementation Status (2026-02-25):**

| Variant   | Status       | Note                                                                    |
| --------- | ------------ | ----------------------------------------------------------------------- |
| `input`   | ✅ Hoạt động | `replyStore` có `senderId` khi user reply → hiển thị "Bạn" đúng         |
| `message` | ⏳ Chờ API   | `QuotedMessageDto` từ API chưa có `senderId` → fallback về `senderName` |

> **API Request:** Cần Backend bổ sung `senderId` vào `QuotedMessageDto` response.

---

### Feature 3: Reply Tin Nhắn Ảnh → Hiển Thị "Hình ảnh"

**User Story:**

> Là người dùng, khi reply tin nhắn chứa ảnh, tôi muốn thấy text "Hình ảnh" bên cạnh thumbnail để biết rõ đó là ảnh.

**Functional Requirements:**

| ID   | Requirement                                                          | Priority |
| ---- | -------------------------------------------------------------------- | -------- |
| F3.1 | Khi `images.length > 0`, hiển thị text "Hình ảnh" bên cạnh thumbnail | Must     |
| F3.2 | Nếu có nhiều ảnh, hiển thị "Hình ảnh" (không phải "Hình ảnh x 3")    | Should   |
| F3.3 | Text "Hình ảnh" có style: text-xs, text-gray-500, italic             | Should   |

**UI Mockup:**

```
┌─────────────────────────────────────────────┐
│ ↳ Quote Reply                               │
│ ┌──────┬──────────────────────────────────┐ │
│ │ 🖼️   │ Hình ảnh                         │ │
│ │ IMG  │ [Nội dung text nếu có]           │ │
│ └──────┴──────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

---

### Feature 4: Badge Số Lượng Ảnh (+N) Căn Giữa

**User Story:**

> Là người dùng, tôi muốn badge hiển thị số ảnh thêm (+2, +3...) được căn giữa trên thumbnail để dễ nhìn hơn.

**Functional Requirements:**

| ID   | Requirement                                                        | Priority |
| ---- | ------------------------------------------------------------------ | -------- |
| F4.1 | Badge `+{images.length - 1}` phải căn giữa (center) trên thumbnail | Must     |
| F4.2 | Badge phải có background semi-transparent để dễ đọc                | Must     |

**Current Code:**

```tsx
{
  images.length > 1 && (
    <div className="absolute top-1 right-1 bg-black/60 text-white text-xs font-medium px-1.5 py-0.5 rounded">
      +{images.length - 1}
    </div>
  );
}
```

**Cần thay đổi:**

```tsx
{
  images.length > 1 && (
    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-xs font-medium rounded">
      +{images.length - 1}
    </div>
  );
}
```

---

### Feature 5: Clear Reply State Khi Chuyển Conversation

**User Story:**

> Là người dùng, khi tôi chuyển sang conversation khác, trạng thái reply (nếu có) phải được xóa để tránh gửi nhầm.

**Functional Requirements:**

| ID   | Requirement                                                       | Priority |
| ---- | ----------------------------------------------------------------- | -------- |
| F5.1 | Khi `selectedConversation` thay đổi, gọi `clearReply()`           | Must     |
| F5.2 | Không clear reply nếu conversation không thay đổi (chỉ re-render) | Should   |

**Implementation Options:**

**Option A: useEffect trong ChatMainContainer**

```tsx
useEffect(() => {
  clearReply();
}, [conversationId]);
```

**Option B: Gọi clearReply trong conversationStore.setSelectedConversation**

```tsx
setSelectedConversation: (conversation) => {
  // Clear reply state before changing conversation
  useReplyStore.getState().clearReply();

  set({ selectedConversation: conversation, ... });
}
```

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                    | Lựa chọn                                                                                            | HUMAN Decision                   |
| --- | ----------------------------------------- | --------------------------------------------------------------------------------------------------- | -------------------------------- |
| 1   | Paste image: Tên file default             | `pasted-image-{timestamp}.png` hoặc `clipboard-{timestamp}.png`?                                    | ✅ **clipboard-{timestamp}.png** |
| 2   | Paste image: Có validate file size không? | Có (max 10MB) hoặc Không?                                                                           | ✅ **Có (max 10MB)**             |
| 3   | Feature 2: Lấy currentUserId từ đâu?      | A. Props truyền vào B. useAuthStore() trong component                                               | ✅ **B. useAuthStore()**         |
| 4   | Feature 5: Clear reply ở đâu?             | **A.** useEffect trong ChatMainContainer (đơn giản) <br> **B.** Trong conversationStore (tập trung) | ✅ **A. useEffect**              |
| 5   | Badge +N: Style mới?                      | **A.** Overlay full + căn giữa dọc/ngang <br> **B.** Giữ góc, căn giữa text                         | ✅ **A. Overlay + center**       |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ tạo mới:

- (Không có file mới)

### Files sẽ sửa đổi:

| File                                                           | Changes                                                                                                            |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `src/features/portal/components/chat/QuotedMessagePreview.tsx` | - Feature 2: Thêm logic "Bạn" vs senderName<br>- Feature 3: Thêm text "Hình ảnh"<br>- Feature 4: Căn giữa badge +N |
| `src/stores/replyStore.ts`                                     | - Feature 2: Thêm `senderId` vào `QuotedMessageData` interface                                                     |
| `src/features/portal/components/chat/ChatMainContainer.tsx`    | - Feature 1: Thêm paste event handler<br>- Feature 5: useEffect clear reply on conversation change                 |

### Files sẽ xoá:

- (Không có)

### Dependencies sẽ thêm:

- (Không có)

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                        | Status       |
| ------------------------------- | ------------ |
| Đã review Impact Summary        | ✅ Đã review |
| Đã điền Pending Decisions       | ✅ Đã điền   |
| **APPROVED để tiếp tục BƯỚC 2** | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-25

> ✅ **ĐÃ APPROVED - AI được phép thực thi code**
