# PDF Preview API Fix - Implementation Plan

## 📋 Overview

Cập nhật PDF preview để sử dụng endpoint mới `/api/Files/{id}/preview-page` thay vì 2 endpoints hiện tại.

---

## 🔄 Current Implementation Analysis

### Current Flow (Wrong):

```
Page 1:  getFilePreview() → GET /api/Files/{id}/preview?page=1
Page 2+: renderPdfPage()   → GET /api/pdf/{id}/pages/{pageNumber}/render?page=...&dpi=...
```

### Double Fetch Issue:

Khi mount FilePreviewModal:

1. `useFilePreview(fileId)` được gọi
2. `fetchFirstPage()` được trigger trong useEffect
3. Có thể có race condition hoặc StrictMode gây double call

---

## 🆕 New Implementation Plan

### Step 1: Update `filePreview.api.ts`

**Thay đổi `getFilePreview()` function:**

```typescript
// OLD
const response = await fileApiClient.get<Blob>(
  `/api/Files/${request.fileId}/preview?page=${pageNumber}`,
  { responseType: "blob" },
);

// NEW
const response = await fileApiClient.get<Blob>(
  `/api/Files/${request.fileId}/preview-page`,
  {
    params: {
      page: pageNumber,
      dpi: request.dpi || 300,
    },
    responseType: "blob",
  },
);
```

**Cập nhật hoặc xóa `renderPdfPage()` function:**

Option A: **Xóa hoàn toàn** - vì không cần 2 functions nữa
Option B: **Alias thành getFilePreview** - để backward compatibility

```typescript
// Option A: Remove renderPdfPage entirely

// Option B: Make renderPdfPage call getFilePreview
export async function renderPdfPage(
  request: PdfRenderRequest,
): Promise<PdfRenderResponse> {
  return getFilePreview({
    fileId: request.fileId,
    page: request.pageNumber,
    dpi: request.dpi,
  });
}
```

### Step 2: Update Types (if needed)

**`src/types/filePreview.ts`:**

```typescript
export interface FilePreviewRequest {
  fileId: string;
  page?: number; // Page number (default: 1)
  dpi?: number; // DPI for rendering (default: 300)
}
```

### Step 3: Update `usePdfPreview.ts`

**Trong `fetchPage()` function:**

```typescript
// OLD
const result = await renderPdfPage({
  fileId,
  pageNumber: pageNum,
  dpi: 300,
});

// NEW
const result = await getFilePreview({
  fileId,
  page: pageNum,
  dpi: 300,
});
```

### Step 4: Fix Double Fetch Issue

**Thêm ref để track nếu đã fetch:**

```typescript
const hasFetchedRef = useRef(false);

useEffect(() => {
  if (!fileId || hasFetchedRef.current) return;
  hasFetchedRef.current = true;
  fetchFirstPage();
}, [fileId, fetchFirstPage]);
```

**Hoặc dùng useEffect cleanup:**

```typescript
useEffect(() => {
  let cancelled = false;

  const doFetch = async () => {
    if (cancelled) return;
    await fetchFirstPage();
  };

  doFetch();

  return () => {
    cancelled = true;
  };
}, [fileId]);
```

---

## 📝 Code Changes Summary

| File                     | Function             | Change                                            |
| ------------------------ | -------------------- | ------------------------------------------------- |
| `filePreview.api.ts`     | `getFilePreview()`   | Change endpoint to `/api/Files/{id}/preview-page` |
| `filePreview.api.ts`     | `renderPdfPage()`    | Either remove or make it alias to getFilePreview  |
| `filePreview.ts` (types) | `FilePreviewRequest` | Add `dpi` parameter                               |
| `usePdfPreview.ts`       | `fetchPage()`        | Use getFilePreview instead of renderPdfPage       |
| `usePdfPreview.ts`       | `fetchFirstPage()`   | Add double-fetch prevention                       |

---

## 🧪 Testing Checklist

- [ ] Preview PDF file - first page loads correctly
- [ ] Navigate to page 2, 3, etc. - pages load correctly
- [ ] Check network tab - only 1 API call per page
- [ ] Check X-Total-Pages header is parsed correctly
- [ ] Page cache still works (going back to page 1 doesn't refetch)
- [ ] Error handling works (404, network error)

---

## ⏳ WAITING FOR HUMAN DECISIONS

Xem file `01_requirements.md` để điền các quyết định:

1. DPI mặc định
2. First page khác với pages khác?
3. Xóa hay giữ `renderPdfPage()`?
