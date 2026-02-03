# Debug Guide: Image Loading Issue - Same Category Switch

> **Date:** 2026-02-02  
> **Issue:** Ảnh vẫn bị loading khi chuyển conversation trong cùng category  
> **Status:** 🔍 DEBUGGING

---

## 🐛 New Issue Report

**Tình huống:**

```
1. Active conversation: Group 3 (trong category X)
2. Ảnh load xong → hiển thị OK ✅
3. Chuyển sang Group 4 (CÙNG category X)
4. Quay lại Group 3
5. Ảnh bị loading lại ❌
```

**Điểm khác biệt với bug cũ:**

- Bug cũ: Switch sang conversation KHÁC category (ChatMainContainer có thể unmount)
- Bug mới: Switch TRONG CÙNG category (ChatMainContainer KHÔNG unmount)

---

## 🔍 Hypotheses

### Hypothesis 1: Reset useEffect không chạy

**Theory:**

- Khi switch conversation trong cùng category, ChatMainContainer không unmount
- Messages array thay đổi nhưng MessageImage instance được reuse
- Reset useEffect dependencies không trigger đúng cách

**Evidence cần kiểm tra:**

- Console log có show "Reset state for fileId" không?
- fileId prop có thực sự thay đổi không?

### Hypothesis 2: React Key Collision

**Theory:**

- Key={image.fileId} có thể bị trùng nếu:
  - Group 3 và Group 4 có cùng ảnh (same fileId)
  - React nghĩ là cùng component → không unmount/remount

**Evidence cần kiểm tra:**

- Group 3 và Group 4 có ảnh nào trùng fileId không?
- Console DevTools → React Components tree

### Hypothesis 3: Intersection Observer State

**Theory:**

- isVisible state không được reset về false
- Khi quay lại Group 3, isVisible = true nhưng imageUrl = null
- Fetch useEffect không chạy vì thiếu trigger

**Evidence cần kiểm tra:**

- Console log "Fetch blocked: not visible yet"?
- isVisible state value khi switch conversation

### Hypothesis 4: React Query Cache

**Theory:**

- messagesQuery.data có cached messages của Group 3
- Khi switch → Group 4 → back to Group 3, cache restore
- Messages objects giống hệt (same reference) → React không re-render

**Evidence cần kiểm tra:**

- React DevTools → Profiler
- Message object references có thay đổi không?

---

## 🧪 Debug Steps

### Step 1: Enable Debug Logs

**✅ DONE** - Debug logs đã được thêm vào MessageImage.tsx:

```tsx
// Reset useEffect
console.log("[MessageImage] Reset state for fileId:", fileId);

// Fetch useEffect
console.log("[MessageImage] Fetch blocked: ...", { reason });
console.log("[MessageImage] Fetching thumbnail for fileId:", fileId);
console.log("[MessageImage] Fetch success:", { fileId, blobUrl });
console.error("[MessageImage] Fetch error:", { fileId, err });
```

### Step 2: Reproduce Issue with Console Open

**Manual Test:**

```
1. Mở DevTools Console (F12)
2. Filter: [MessageImage]
3. Clear console
4. Load Group 3 → quan sát logs
5. Switch to Group 4 → quan sát logs
6. Switch back to Group 3 → quan sát logs
7. Screenshot console output
```

**Expected Logs (Normal Flow):**

```
[MessageImage] Reset state for fileId: img-group3-001
[MessageImage] Fetching thumbnail for fileId: img-group3-001
[MessageImage] Fetch success: { fileId: "img-group3-001", blobUrl: "blob:..." }

// Switch to Group 4
[MessageImage] Reset state for fileId: img-group4-001
[MessageImage] Fetching thumbnail for fileId: img-group4-001
[MessageImage] Fetch success: { fileId: "img-group4-001", blobUrl: "blob:..." }

// Switch back to Group 3
[MessageImage] Reset state for fileId: img-group3-001
[MessageImage] Fetching thumbnail for fileId: img-group3-001
[MessageImage] Fetch success: { fileId: "img-group3-001", blobUrl: "blob:..." }
```

**Abnormal Patterns to Watch:**

```
❌ Reset không chạy (không thấy "Reset state for fileId")
❌ Fetch blocked vì imageUrl exists (có thể do cleanup không chạy)
❌ Reset chạy nhưng isVisible = false (Intersection Observer issue)
❌ FileId không thay đổi (React key collision)
```

### Step 3: Inspect React Component Tree

**React DevTools:**

```
1. Mở React DevTools
2. Components tab
3. Find MessageImage components
4. Check Props:
   - fileId value
   - key value
5. Switch conversation → observe component mounting behavior
```

**What to look for:**

- ✅ Component unmounts/remounts with new key
- ❌ Component updates props without unmounting (BAD - key not working)

### Step 4: Check Message Object References

**Console test:**

```javascript
// In ChatMainContainer, temporarily add:
useEffect(() => {
  console.log("[ChatMain] Messages changed:", {
    conversationId,
    messageCount: messages.length,
    firstMessageId: messages[0]?.id,
    firstImageFileId: messages.find((m) =>
      m.attachments?.some((a) => a.contentType?.startsWith("image")),
    )?.attachments?.[0]?.fileId,
  });
}, [messages, conversationId]);
```

---

## 🔧 Potential Fixes (Based on Debug Results)

### Fix 1: Add conversationId to MessageImage key

**If:** React không unmount vì key collision

**Solution:**

```tsx
// In MessageBubbleSimple.tsx
<MessageImage
  key={`${conversationId}-${image.fileId}`}  // 🆕 Composite key
  fileId={image.fileId}
  ...
/>
```

**Why:**

- Guarantees unique key per conversation
- Forces unmount when conversation changes
- Even if same fileId exists in multiple conversations

### Fix 2: Add conversationId to reset dependencies

**If:** Reset useEffect không trigger vì fileId giống nhau

**Solution:**

```tsx
// In MessageImage.tsx - pass conversationId as prop
export interface MessageImageProps {
  fileId: string;
  conversationId?: string;  // 🆕 Add this
  ...
}

// Reset useEffect
useEffect(() => {
  setImageUrl(null);
  setError(null);
  setIsLoading(false);
  setIsVisible(forceLoad);
}, [fileId, conversationId, forceLoad]);  // 🆕 Add conversationId dependency
```

### Fix 3: Force Intersection Observer reset

**If:** isVisible stuck at true

**Solution:**

```tsx
// In MessageImage.tsx
useEffect(() => {
  // Force reset visibility on fileId change
  setIsVisible(forceLoad);

  // Re-setup Intersection Observer
  // (current observer will auto-disconnect and reconnect)
}, [fileId]);
```

### Fix 4: Clear messagesQuery cache on conversation change

**If:** React Query cache causes stale references

**Solution:**

```tsx
// In ChatMainContainer.tsx
const messagesQuery = useMessages({
  conversationId,
  enabled: !!conversationId && categoriesQuery.isSuccess,
});

// Force refetch when conversation changes
useEffect(() => {
  if (conversationId) {
    messagesQuery.refetch();
  }
}, [conversationId]);
```

---

## � DEBUG RESULTS - ACTUAL ROOT CAUSE DISCOVERED

### Console Logs from User Testing:

```
[MessageImage] Reset state for fileId: 019c1c02-ae7b-779f-92c0-556fc87b4f8e
[MessageImage] Fetching thumbnail for fileId: 019bf7b1-72bf-75bd-affe-9534f8821292
[MessageImage] Fetch error: {fileId: '019bf7b1-72bf-75bd-affe-9534f8821292', err: AxiosError$1}
[MessageImage] Fetch blocked: error exists {fileId: '019bf7b1-72bf-75bd-affe-9534f8821292', error: AxiosError$1}
```

### Analysis:

1. **Reset IS working** ✅ - Shows reset executed for fileId `019c1c02`
2. **Fetch IS attempting** ✅ - Shows fetch called for fileId `019bf7b1`
3. **API call FAILED** ❌ - AxiosError occurred
4. **Error state BLOCKS retry** ❌ - "Fetch blocked: error exists"

### Root Cause Identified:

**Problem:** Fetch useEffect had this blocking condition:

```tsx
if (!isVisible || imageUrl || error) return;
```

With dependencies: `[isVisible, fileId, imageUrl, error]`

**Why it blocks:**

- When API fails → `error` state is set
- Error is IN dependencies → useEffect re-runs
- Re-run hits `if (error) return` → fetch blocked
- **Infinite loop:** Error exists → block → error still exists → block → ...

**Solution v1.2:**

- Remove `error` from blocking condition
- Remove `error` from dependencies
- Let error reset via fileId change in reset useEffect
- Add retry logging when error exists

```tsx
// NEW (v1.2):
if (!isVisible || imageUrl) return; // No error check here
if (error) console.log("Retrying fetch after previous error");
fetchThumbnail();
// Dependencies: [isVisible, fileId, imageUrl] - error removed
```

**Expected behavior after fix:**

- API fails → error set
- User switches conversation → fileId changes
- Reset useEffect clears error
- Fetch useEffect attempts retry
- If API still fails → new error set (but can retry again later)
- If API succeeds → image loads ✅

---

## 📋 Debug Checklist

**HUMAN: Please test and check these:**

- [x] **Step 1:** Open console, reproduce issue, capture logs ✅ DONE
- [x] **Step 2:** Check if "Reset state for fileId" appears in console ✅ YES
- [x] **Step 3:** Check if "Fetch blocked: imageUrl exists" appears ✅ YES (error, not imageUrl)
- [ ] **Step 4:** Test v1.2 fix - Images should recover after conversation switch
- [ ] **Step 5:** Verify console shows "Retrying fetch after previous error"
- [ ] **Step 6:** Confirm images no longer stuck in permanent loading
- [ ] **Step 7:** Remove debug logs after validation
- [ ] **Step 8:** Git commit all changes

---

## 📝 Next Actions

**After debug testing, HUMAN should report:**

1. **Console output:** Paste full console log from reproduction
2. **Observed behavior:** Which logs appeared/missing?
3. **React DevTools:** Did component unmount or just update props?
4. **FileId values:** Are they different or same?

**Then AI will:**

1. Analyze debug results
2. Identify root cause
3. Implement appropriate fix
4. Update documentation

---

## 🔗 Related Files

- MessageImage.tsx (debug logs added)
- MessageBubbleSimple.tsx (key props)
- ChatMainContainer.tsx (messages rendering)
- bug_analysis.md (original issue)

---

**Debug Session:** 2026-02-02  
**Reporter:** MINH  
**Debugger:** AI (GitHub Copilot)  
**Status:** ⏳ Awaiting debug test results
