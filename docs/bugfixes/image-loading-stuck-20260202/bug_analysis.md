# Bug Analysis: Image Loading Stuck on Conversation Switch

> **Reported:** 2026-02-02  
> **Component:** MessageImage (src/features/portal/workspace/MessageImage.tsx)  
> **Symptom:** Ảnh hiển thị OK lần đầu, nhưng khi chuyển conversation và quay lại thì loading hoài

---

## 🔍 ROOT CAUSE ANALYSIS

### Problem Description

**User Report:**

```
1. Lúc đầu load conversation → ảnh hiển thị OK ✅
2. Chuyển sang conversation khác
3. Quay lại conversation cũ → ảnh stuck ở loading state ❌
```

### Code Location

**File:** `src/features/portal/workspace/MessageImage.tsx`

**Critical Code Section (Lines 66-91):**

```tsx
// Fetch thumbnail when visible
useEffect(() => {
  if (!isVisible || imageUrl || error) return;
  //                  ^^^^^^^^ 🐛 VẤN ĐỀ Ở ĐÂY!

  const fetchThumbnail = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await getImageThumbnail(fileId, "large");
      const blobUrl = URL.createObjectURL(blob);
      setImageUrl(blobUrl);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to load image"));
    } finally {
      setIsLoading(false);
    }
  };

  fetchThumbnail();
}, [isVisible, fileId, imageUrl, error]);

// Cleanup: Revoke blob URL
useEffect(() => {
  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl); // 🐛 Cleanup xóa URL nhưng state không reset!
    }
  };
}, [imageUrl]);
```

---

## 🧪 Timeline of Events (What Happens)

### 📌 Conversation A - First Load (✅ Works)

```
Step 1: Component mounts
  - isVisible = false
  - imageUrl = null
  - error = null

Step 2: IntersectionObserver triggers
  - setIsVisible(true)

Step 3: Fetch useEffect runs
  - Condition: !isVisible || imageUrl || error
    → false || null || null = false → PASS ✅
  - Fetch image → setImageUrl("blob:http://...")
  - Render: <img src="blob:..." />
```

### 📌 Switch to Conversation B

```
Step 4: Component unmounts (conversation changed)
  - Cleanup useEffect runs:
    → URL.revokeObjectURL("blob:http://...")  // Blob revoked
    → imageUrl state STILL = "blob:http://..."  // ❌ State NOT reset!
```

### 📌 Switch back to Conversation A (❌ Stuck)

```
Step 5: Component re-mounts
  - isVisible = false (re-initialized)
  - imageUrl = null (re-initialized)  // ⚠️ Reset to null
  - error = null

Step 6: IntersectionObserver triggers
  - setIsVisible(true)

Step 7: Fetch useEffect runs
  - Condition: !isVisible || imageUrl || error
    → false || null || null = false → PASS ✅
  - Should fetch... NHƯNG:

Step 8: 🐛 RACE CONDITION
  - React Query cache có thể restore old imageUrl từ previous render
  - hoặc component state không được reset đúng cách
  - imageUrl = "blob:http://..." (old revoked URL)

  - Fetch useEffect condition:
    → !isVisible || imageUrl || error
    → false || "blob:http://..." || null = "blob:http://..."
    → BLOCKED! ❌ useEffect không chạy vì imageUrl !== null

Step 9: Render với revoked URL
  - imageUrl = "blob:http://..." (revoked, không valid)
  - Không show skeleton (vì imageUrl !== null)
  - Render <img src="blob:..." /> → Browser không load được (URL revoked)
  - Result: Ảnh không hiển thị, stuck ở loading state
```

---

## 🎯 Root Cause Summary

### Core Issue: **State Persistence After Cleanup**

Component cleanup (`URL.revokeObjectURL`) xóa blob URL nhưng **KHÔNG reset state `imageUrl`**.

Khi component re-mount (quay lại conversation), có 2 kịch bản:

#### Scenario A: React Query Cache Restore (Most Likely)

- React Query cache messages từ conversation cũ
- MessageBubbleSimple render với same message props
- React có thể restore component state từ fiber tree
- `imageUrl` = old revoked blob URL
- Fetch useEffect **BLOCKED** vì `imageUrl !== null`

#### Scenario B: Component State Not Reset

- Component unmount nhưng state không được reset về null
- Re-mount với stale imageUrl
- Fetch useEffect **BLOCKED**

### Evidence from Code

**Line 93-99: Cleanup không reset state**

```tsx
useEffect(() => {
  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl); // ✅ Revoke URL
      // ❌ MISSING: setImageUrl(null);
      // ❌ MISSING: setError(null);
      // ❌ MISSING: setIsLoading(false);
    }
  };
}, [imageUrl]);
```

**Line 66-91: Fetch blocked nếu imageUrl exists**

```tsx
useEffect(() => {
  if (!isVisible || imageUrl || error) return;
  //                  ^^^^^^^^ 🐛 Block nếu imageUrl !== null (dù đã revoked)

  // ... fetch code never runs nếu imageUrl đã có giá trị
}, [isVisible, fileId, imageUrl, error]);
```

---

## 🔧 WHY THIS HAPPENS

### React Query Cache Behavior

ChatMainContainer sử dụng React Query để cache messages:

```tsx
// ChatMainContainer.tsx Line 690-705
const messages = useMemo(() => {
  if (categoriesQuery.isLoading) return [];
  if (!messagesQuery.isSuccess) return [];
  return flattenMessages(messagesQuery.data);
}, [messagesQuery.data, messagesQuery.isSuccess, categoriesQuery.isLoading]);
```

**Khi switch conversation:**

1. messagesQuery.data **giữ cached data** từ conversation cũ
2. Component re-render với **same message objects** (same fileId)
3. React có thể **preserve component state** nếu key không thay đổi
4. MessageImage component **giữ old imageUrl** (revoked blob)

### Component Key Issue

**MessageBubbleSimple.tsx (Line ~1598):**

```tsx
{
  groupedMessages.map((groupedMsg) => {
    const message = groupedMsg.message;

    return (
      <MessageBubbleSimple
        key={message.id} // ✅ Key là message.id
        message={message}
        // ...
      />
    );
  });
}
```

**NHƯNG MessageImage không có key riêng!**

```tsx
// Inside MessageBubbleSimple
<MessageImage
  fileId={image.fileId}
  fileName={image.fileName || "Image"}
  // ❌ MISSING: key={image.fileId}
  // React có thể reuse component instance nếu position không đổi
/>
```

---

## 💡 SOLUTIONS - GIẢI THÍCH CHI TIẾT

### Option 1: Reset State on Cleanup ❌ (KHÔNG KHUYẾN NGHỊ)

**Ý tưởng:** Gọi setState trong cleanup function của useEffect

**File:** `src/features/portal/workspace/MessageImage.tsx`

**Code:**

```tsx
// BEFORE
useEffect(() => {
  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl); // Chỉ xóa blob URL
    }
  };
}, [imageUrl]);

// AFTER
useEffect(() => {
  return () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
      // 🆕 Cố gắng reset state trong cleanup
      setImageUrl(null);
      setError(null);
      setIsLoading(false);
    }
  };
}, [imageUrl]);
```

**Cách hoạt động:**

```
1. Component unmount (user chuyển conversation)
2. Cleanup function chạy:
   - Xóa blob URL ✅
   - Gọi setState để reset về null ❌
3. React warning: "Cannot update unmounted component"
```

**⚠️ TẠI SAO KHÔNG NÊN DÙNG:**

1. **React Anti-Pattern:**
   - Cleanup chạy SAU KHI component unmount
   - setState trên unmounted component = memory leak
   - React DevTools báo warning đỏ

2. **Không giải quyết root cause:**
   - Khi component re-mount, state vẫn có thể bị restore từ cache
   - setState trong cleanup không đảm bảo state mới mount = null

3. **Code smell:**
   - Cleanup để dọn dẹp resource (blob URL), không phải để thay đổi state
   - Vi phạm nguyên tắc single responsibility

**Kết luận:** ❌ Đừng dùng option này!

---

### Option 2: Reset State When fileId Changes ✅ (KHUYẾN NGHỊ)

**Ý tưởng:** Thêm useEffect riêng để reset state mỗi khi fileId thay đổi

**File:** `src/features/portal/workspace/MessageImage.tsx`

**Code:**

```tsx
// 🆕 Thêm useEffect MỚI (không sửa code cũ)
useEffect(() => {
  // Reset all state về initial values
  setImageUrl(null);
  setError(null);
  setIsLoading(false);
  setIsVisible(forceLoad); // Reset visibility (unless forceLoad)
}, [fileId, forceLoad]);
// ^^^^^^^^^^^^^^ Chạy mỗi khi fileId hoặc forceLoad thay đổi
```

**Vị trí đặt code:** Thêm vào sau các useEffect hiện tại, trước phần render

```tsx
export default function MessageImage({ fileId, ... }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(forceLoad);

  // useEffect 1: Setup IntersectionObserver
  useEffect(() => { ... }, [forceLoad]);

  // useEffect 2: Fetch thumbnail khi visible
  useEffect(() => { ... }, [isVisible, fileId, imageUrl, error]);

  // useEffect 3: Cleanup blob URL
  useEffect(() => { ... }, [imageUrl]);

  // 🆕 useEffect 4: Reset state on fileId change
  useEffect(() => {
    setImageUrl(null);
    setError(null);
    setIsLoading(false);
    setIsVisible(forceLoad);
  }, [fileId, forceLoad]);

  // ... render
}
```

**Cách hoạt động (Step-by-step):**

**Scenario: User ở Conversation A → switch sang B → quay lại A**

```
┌─────────────────────────────────────────────────────────────┐
│ CONVERSATION A - Lần đầu                                    │
└─────────────────────────────────────────────────────────────┘

Step 1: Component mount với fileId="abc123"
  → State: imageUrl=null, error=null, isLoading=false

Step 2: Fetch useEffect chạy → load ảnh
  → imageUrl = "blob:http://localhost/abc123"
  → Hiển thị ảnh OK ✅

┌─────────────────────────────────────────────────────────────┐
│ SWITCH to CONVERSATION B                                    │
└─────────────────────────────────────────────────────────────┘

Step 3: Component unmount
  → Cleanup chạy: URL.revokeObjectURL("blob:.../abc123")
  → imageUrl state vẫn = "blob:.../abc123" (revoked)

┌─────────────────────────────────────────────────────────────┐
│ SWITCH back to CONVERSATION A                               │
└─────────────────────────────────────────────────────────────┘

Step 4: Component re-mount với fileId="abc123"
  → State có thể = null (fresh) HOẶC "blob:..." (stale từ cache)

Step 5: 🆕 Reset useEffect chạy ĐBẦU TIÊN
  → fileId dependency triggered
  → setImageUrl(null)  ✅ Force reset về null
  → setError(null)
  → setIsLoading(false)

Step 6: Fetch useEffect chạy
  → Điều kiện: !isVisible || imageUrl || error
  → imageUrl = null (đã reset) ✅
  → PASS → Fetch lại ảnh
  → imageUrl = "blob:http://localhost/abc123-new"
  → Hiển thị ảnh OK ✅
```

**✅ TẠI SAO NÊN DÙNG:**

1. **Chạy đúng thời điểm:**
   - Chạy NGAY KHI component mount/update
   - Chạy TRƯỚC fetch useEffect (dependency tree order)
   - setState khi component còn mounted → không warning

2. **Đảm bảo fresh state:**
   - Force reset về null mỗi khi fileId thay đổi
   - Không phụ thuộc vào React cache behavior
   - Defensive programming - luôn reset trước khi fetch

3. **Clean code:**
   - Mỗi useEffect có single responsibility
   - Reset useEffect: "When fileId changes, reset state"
   - Fetch useEffect: "When visible, fetch image"
   - Không conflict với các useEffect khác

4. **Performance OK:**
   - Chỉ chạy khi fileId thay đổi (không phải mỗi render)
   - setState nhẹ (4 state updates)
   - Không force re-mount component

**Kết luận:** ✅ **BEST SOLUTION** - Dùng option này!

---

### Option 3: Add Explicit Key to MessageImage ✅ (ALTERNATIVE)

**Ý tưởng:** Thêm `key` prop để React biết khi nào cần unmount và re-mount component hoàn toàn

**File:** `src/features/portal/components/chat/MessageBubbleSimple.tsx`

**Code:**

```tsx
// BEFORE - MessageImage không có key
<MessageImage
  fileId={image.fileId}
  fileName={image.fileName || "Image"}
  isInGrid={true}
  forceLoad={forceImageLoad}
  onPreviewClick={(fileId) => {
    if (onImageClick) {
      onImageClick(
        images.map((img) => ({
          fileId: img.fileId,
          fileName: img.fileName || "Image",
        })),
        index,
      );
    }
  }}
/>

// AFTER - Thêm key={image.fileId}
<MessageImage
  key={image.fileId}  // 🆕 Key = fileId
  fileId={image.fileId}
  fileName={image.fileName || "Image"}
  isInGrid={true}
  forceLoad={forceImageLoad}
  onPreviewClick={(fileId) => { ... }}
/>
```

**Cách hoạt động:**

**React Component Lifecycle với Key:**

```
WITHOUT KEY:
┌──────────────────────────────────────────────────────────────┐
│ Conversation A: Message với ảnh fileId="img-001"            │
│                                                              │
│ <MessageImage fileId="img-001" />                           │
│   → React tạo instance #1                                   │
│   → State: imageUrl="blob:...img-001"                       │
│                                                              │
│ User switch to Conversation B                               │
│   → React GIỮ instance #1 (cùng position trong tree)       │
│   → Props update: fileId="img-002"                          │
│   → State VẪN = "blob:...img-001" (stale) ❌                │
└──────────────────────────────────────────────────────────────┘

WITH KEY:
┌──────────────────────────────────────────────────────────────┐
│ Conversation A: Message với ảnh fileId="img-001"            │
│                                                              │
│ <MessageImage key="img-001" fileId="img-001" />             │
│   → React tạo instance #1 với key="img-001"                 │
│   → State: imageUrl="blob:...img-001"                       │
│                                                              │
│ User switch to Conversation B                               │
│                                                              │
│ <MessageImage key="img-002" fileId="img-002" />             │
│   → React thấy key khác: "img-001" → "img-002"              │
│   → UNMOUNT instance #1 (cleanup chạy)                      │
│   → MOUNT instance #2 MỚI HOÀN TOÀN                         │
│   → State: imageUrl=null (fresh) ✅                         │
└──────────────────────────────────────────────────────────────┘
```

**Chi tiết lifecycle:**

```
Step 1: Render MessageImage với key="img-001"
  → React: "Tạo component instance mới với identity = img-001"
  → State: imageUrl=null → fetch → imageUrl="blob:.../img-001"

Step 2: User chuyển conversation → Props change
  → Old: key="img-001", fileId="img-001"
  → New: key="img-002", fileId="img-002"

Step 3: React reconciliation
  → React: "Key thay đổi (img-001 → img-002)"
  → React: "Đây là component KHÁC, không phải update"
  → React: "Unmount instance cũ, mount instance mới"

Step 4: Unmount instance #1
  → Cleanup useEffect chạy:
    - URL.revokeObjectURL("blob:.../img-001") ✅
  → Component instance bị destroy
  → State bị xóa hoàn toàn

Step 5: Mount instance #2 (FRESH)
  → State khởi tạo: imageUrl=null, error=null
  → IntersectionObserver setup
  → Fetch image mới
  → Hiển thị OK ✅
```

**✅ TẠI SAO NÊN DÙNG:**

1. **Guarantee fresh mount:**
   - React ĐẢM BẢO unmount/mount khi key thay đổi
   - State 100% fresh (không phụ thuộc cache)
   - Cleanup chạy đầy đủ

2. **Explicit intent:**
   - Code rõ ràng: "Đây là ảnh khác, cần component mới"
   - Dễ debug: React DevTools show unmount/mount
   - Không cần thêm useEffect phức tạp

3. **Defensive:**
   - Không quan tâm React internal optimization
   - Không bị ảnh hưởng bởi React Query cache
   - Works với mọi React version

**⚠️ TRADE-OFF:**

1. **Performance cost:**
   - Full unmount/mount = expensive hơn state update
   - Mất IntersectionObserver setup
   - Re-run tất cả useEffect

2. **Khi nào đáng lo:**
   - Nếu user scroll nhanh qua nhiều ảnh
   - Nếu có nhiều ảnh trong 1 message (10+ ảnh)
   - Nếu network chậm (re-fetch nhiều lần)

3. **Khi nào OK:**
   - Conversation switch không thường xuyên
   - Số ảnh trung bình (~3-5 ảnh/message)
   - User không scroll nhanh liên tục

**Kết luận:** ✅ **GOOD ALTERNATIVE** - Dùng khi muốn đơn giản, rõ ràng!

---

### 🤔 SO SÁNH CỤ THỂ: Option 2 vs Option 3

| Tiêu chí             | Option 2: Reset State | Option 3: Add Key | Ghi chú                                   |
| -------------------- | --------------------- | ----------------- | ----------------------------------------- |
| **Độ phức tạp code** | ⭐⭐ Medium           | ⭐ Simple         | Option 3 chỉ thêm 1 dòng                  |
| **Performance**      | ⭐⭐⭐ Good           | ⭐⭐ OK           | Option 2 chỉ update state, không re-mount |
| **Reliability**      | ⭐⭐ Good             | ⭐⭐⭐ Excellent  | Option 3 guarantee fresh mount            |
| **Dễ hiểu**          | ⭐⭐ Medium           | ⭐⭐⭐ Simple     | Option 3 concept đơn giản hơn             |
| **Maintainability**  | ⭐⭐ OK               | ⭐⭐⭐ Good       | Option 3 ít code hơn                      |
| **Testability**      | ⭐⭐⭐ Good           | ⭐⭐⭐ Good       | Cả 2 đều dễ test                          |

**Performance Benchmark (ước tính):**

```
Scenario: User switch conversation với 5 ảnh

Option 2 (Reset State):
┌──────────────────────────────────────────┐
│ Time: ~10ms                              │
│ - setState: 5x4 = 20 state updates       │
│ - No unmount/mount                       │
│ - IntersectionObserver preserved         │
└──────────────────────────────────────────┘

Option 3 (Key):
┌──────────────────────────────────────────┐
│ Time: ~50ms                              │
│ - Unmount: 5 components                  │
│ - Mount: 5 new components                │
│ - Setup IntersectionObserver: 5 times    │
│ - Run all useEffects: 5x4 = 20 times     │
└──────────────────────────────────────────┘

Kết luận: Option 2 nhanh hơn ~5x
Nhưng 50ms vẫn imperceptible cho user (<100ms)
```

**Khuyến nghị sử dụng:**

```
DÙNG OPTION 2 KHI:
✅ Quan tâm performance (nhiều ảnh, scroll nhanh)
✅ Muốn control state lifecycle chính xác
✅ Có nhiều component tương tự cần optimize

DÙNG OPTION 3 KHI:
✅ Ưu tiên code đơn giản, dễ hiểu
✅ Muốn reliability > performance
✅ Số lượng ảnh ít (~3-5 ảnh/message)
✅ Team ít kinh nghiệm React hooks

DÙNG CẢ 2 (DEFENSE IN DEPTH):
✅ Mission-critical feature (không được lỗi)
✅ Có bug tương tự trước đây
✅ Codebase lớn, nhiều dev maintain
```

---

## 📊 COMPARISON SUMMARY

| Tiêu chí              | Option 1             | Option 2        | Option 3            | Winner   |
| --------------------- | -------------------- | --------------- | ------------------- | -------- |
| **Có React warning?** | ❌ Có                | ✅ Không        | ✅ Không            | 2 & 3    |
| **Performance**       | N/A                  | ⭐⭐⭐ Tốt nhất | ⭐⭐ Chấp nhận được | Option 2 |
| **Reliability**       | ❌ Không đảm bảo     | ⭐⭐ Tốt        | ⭐⭐⭐ Excellent    | Option 3 |
| **Code simplicity**   | ⭐⭐⭐ Đơn giản nhất | ⭐⭐ Medium     | ⭐⭐⭐ Đơn giản     | Option 3 |
| **Số lines code**     | +3 lines             | +6 lines        | +1 line             | Option 3 |
| **Dễ hiểu**           | ❌ Anti-pattern      | ⭐⭐ OK         | ⭐⭐⭐ Rõ ràng      | Option 3 |
| **Best practice**     | ❌ Vi phạm           | ✅ OK           | ✅ OK               | 2 & 3    |
| **Risk**              | 🔴 Cao               | 🟡 Thấp         | 🟢 Rất thấp         | Option 3 |

### 🏆 Khuyến nghị cuối cùng

**Cấu hình dự án này:**

- Số ảnh trung bình: 3-5 ảnh/message
- User không scroll liên tục (conversation-based chat)
- Team size: nhỏ - medium
- Priority: Reliability > Performance

**→ Dùng cả 2: Option 2 + Option 3 (Defense in Depth)**

**Lý do:**

1. **Option 3 (key):** Đảm bảo React LUÔN tạo component mới → reliability cao
2. **Option 2 (reset state):** Thêm layer bảo vệ phòng trường hợp edge case
3. **Cost nhỏ:** 50ms unmount/mount imperceptible cho user
4. **Future-proof:** Nếu có thay đổi React internal hoặc cache behavior

**Implementation order:**

```
Step 1: Thêm Option 3 (key) trước
  → Test → Nếu OK thì đủ rồi

Step 2: (Optional) Thêm Option 2 nếu muốn chắc chắn hơn
  → Defense in depth approach
```

**Nếu chỉ chọn 1:**

- Ưu tiên **đơn giản, reliable:** → **Option 3** (key)
- Ưu tiên **performance:** → **Option 2** (reset state)

---

## 🧪 TESTING SCENARIOS

### Test Case 1: Basic Switch

```
1. Open Conversation A với 3 ảnh
2. Đợi ảnh load xong
3. Switch sang Conversation B
4. Switch lại Conversation A
5. Expected: Ảnh load lại từ đầu (không stuck)
```

### Test Case 2: Rapid Switch

```
1. Open Conversation A
2. Ngay khi ảnh đang load → switch sang Conversation B
3. Switch lại Conversation A
4. Expected: Ảnh load lại clean (không bị stuck)
```

### Test Case 3: Multiple Images

```
1. Open Conversation với 10+ ảnh
2. Scroll xem hết ảnh
3. Switch sang conversation khác
4. Quay lại
5. Expected: Ảnh load lại đúng cách (lazy load work)
```

---

## 📝 NEXT STEPS

### Immediate Actions (This Bug Fix)

1. ✅ Create bug analysis document (this file)
2. ✅ Create implementation plan
3. ✅ Implement fixes (Option 2 + Option 3)
4. ⏳ Manual testing
5. ⏳ Git commit

### Future Improvements (Post-Fix)

- Consider caching blob URLs at higher level (ChatMainContainer)
- Use React Query to cache image blobs (avoid re-fetch)
- Implement progressive image loading (blur-up)

---

## 🔗 RELATED ISSUES

### Previous Similar Bug

**Bug:** Empty state shown while loading (2026-01-31)
**Root Cause:** React Query cache retention
**Solution:** Add staleness checks
**Doc:** `docs/bugfixes/empty-state-shown-while-loading-20260131/`

**Similarity:**

- Both caused by **React Query cache** + **state management**
- Both happen when **switching conversations**
- Both need **defensive state resets**

---

## 📌 IMPLEMENTATION STATUS

**Status:** ⚠️ **PARTIAL FIX - NEW ISSUE FOUND**

**Original Implementation:** ✅ Completed (2026-02-02)

- Option 2: Reset state useEffect ✅
- Option 3: Add key props ✅

**New Issue Reported:** ⚠️ Same Category Conversation Switch (2026-02-02)

**Tình huống mới:**

```
1. Group 3 (category X) → ảnh load OK ✅
2. Switch to Group 4 (CÙNG category X)
3. Back to Group 3 → ảnh stuck loading ❌
```

**Khác biệt:**

- Fix cũ: Cross-category switch (ChatMainContainer có thể unmount)
- Bug mới: **Same-category switch** (ChatMainContainer KHÔNG unmount)

**Debug Status:** 🔍 Investigation in progress

- Debug logs added to MessageImage.tsx
- See: [DEBUG_GUIDE.md](./DEBUG_GUIDE.md)

---

## 🔍 NEW INVESTIGATION (2026-02-02)

### Possible Root Causes

**Hypothesis 1: Reset useEffect không trigger**

- ChatMainContainer không unmount khi cùng category
- MessageImage props update nhưng dependencies không thay đổi
- fileId có thể giống nhau giữa 2 conversations

**Hypothesis 2: React Key Collision**

- key={image.fileId} không đủ unique
- Nếu Group 3 và Group 4 có cùng ảnh → same fileId
- React reuse component instance thay vì unmount/remount

**Hypothesis 3: Intersection Observer State**

- isVisible không reset về false
- Component thinks image is visible, doesn't fetch

**Hypothesis 4: React Query Cache**

- messagesQuery cache causes same object references
- React không re-render vì props không đổi

### Debug Actions Taken

**✅ Added Debug Logs:**

```tsx
// Reset useEffect
console.log("[MessageImage] Reset state for fileId:", fileId);

// Fetch useEffect
console.log("[MessageImage] Fetch blocked: ...", { reason });
console.log("[MessageImage] Fetching thumbnail for fileId:", fileId);
```

**⏳ Awaiting Test Results:**

- HUMAN needs to reproduce with console open
- Capture console logs
- Inspect React DevTools component tree

### Potential Fixes (Pending Debug Results)

**Fix Option A: Composite Key**

```tsx
key={`${conversationId}-${image.fileId}`}
```

**Fix Option B: Add conversationId Dependency**

```tsx
useEffect(() => {
  setImageUrl(null);
  // ...
}, [fileId, conversationId, forceLoad]);
```

**Fix Option C: Force Intersection Observer Reset**

```tsx
useEffect(() => {
  setIsVisible(forceLoad);
}, [fileId]);
```

---

## 📝 IMPLEMENTATION HISTORY

### v1.0 - Initial Fix (2026-02-02 AM)

**HUMAN Decision:** Option 2 + Option 3 (Both) - "chọn dùng option 2 và 3"  
**Implementation Date:** 2026-02-02

**Changes Made:**

1. ✅ **Option 2** - MessageImage.tsx:
   - Added reset state useEffect (6 lines)
   - Triggers on fileId or forceLoad change
   - Location: Line ~103-109

2. ✅ **Option 3** - MessageBubbleSimple.tsx:
   - Added `key={image.fileId}` to 5 MessageImage instances
   - Forces React to unmount/remount on key change

**Validation:**

- ✅ No TypeScript errors
- ✅ No ESLint warnings
- ⚠️ Manual testing found new edge case

### v1.1 - Debug Enhancement (2026-02-02 PM)

**Issue:** Same-category conversation switch still causes loading stuck

**Changes:**

- ✅ Added debug console.log statements
- ✅ Created DEBUG_GUIDE.md with test steps
- ⏳ Awaiting test results to determine next fix

**Next Steps:**

1. HUMAN tests with console open
2. Analyze console output
3. Identify which hypothesis is correct
4. Implement targeted fix (v1.2)

---

**Analysis Date:** 2026-02-02 AM  
**Implemented:** 2026-02-02 AM  
**Debug Enhanced:** 2026-02-02 PM  
**Analyst & Developer:** AI (GitHub Copilot)  
**Approved by:** MINH  
**Testing:** ⏳ PENDING DEBUG RESULTS
