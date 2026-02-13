# PDF Preview API Fix - Current Code Analysis

## 📂 Files Involved

### 1. `src/api/filePreview.api.ts`

**Current API Functions:**

```typescript
// Function 1: Get preview (page 1)
export async function getFilePreview(
  request: FilePreviewRequest,
): Promise<FilePreviewResponse> {
  const pageNumber = request.page || 1;
  const response = await fileApiClient.get<Blob>(
    `/api/Files/${request.fileId}/preview?page=${pageNumber}`, // ❌ WRONG ENDPOINT
    { responseType: "blob" },
  );
  // ...
}

// Function 2: Render specific page (page 2+)
export async function renderPdfPage(
  request: PdfRenderRequest,
): Promise<PdfRenderResponse> {
  const params = new URLSearchParams();
  params.append("page", request.pageNumber.toString());
  params.append("dpi", request.dpi?.toString() || "300");

  const response = await fileApiClient.get<Blob>(
    `/api/pdf/${request.fileId}/pages/${request.pageNumber}/render?${params.toString()}`, // ❌ WRONG ENDPOINT
    { responseType: "blob" },
  );
  // ...
}
```

**Issues:**

1. Two different endpoints for same functionality
2. `/api/Files/{id}/preview?page=` - không tồn tại trong swagger
3. `/api/pdf/{id}/pages/{pageNumber}/render` - tồn tại nhưng không phải endpoint chính

---

### 2. `src/hooks/usePdfPreview.ts`

**Double Fetch Analysis:**

```typescript
// Line 241-252
useEffect(() => {
  isMountedRef.current = true;

  if (fileId) {
    fetchFirstPage(); // Called every time fileId or fetchFirstPage changes
  }

  return () => {
    isMountedRef.current = false;
  };
}, [fileId, fetchFirstPage]); // ⚠️ fetchFirstPage in deps array
```

**Root Cause của Double Fetch:**

1. **React StrictMode**: Component mount 2 lần trong development mode
2. **fetchFirstPage trong dependency array**: Nếu `fetchFirstPage` reference thay đổi, useEffect chạy lại
3. **useCallback dependencies**: `fetchFirstPage` được wrap bằng `useCallback` với dependencies có thể thay đổi

```typescript
const fetchFirstPage = useCallback(async () => {
  // ...
}, [fileId, getCacheKey]); // getCacheKey cũng là useCallback

const getCacheKey = useCallback(
  (pageNum: number) => `${fileId}-${pageNum}`,
  [fileId],
);
```

**Circular dependency flow:**

1. `fileId` thay đổi
2. `getCacheKey` reference thay đổi (vì depends on fileId)
3. `fetchFirstPage` reference thay đổi (vì depends on getCacheKey)
4. useEffect trigger lại
5. Nhưng vì call đã xong và có cache → không gọi API lần 2

**Actual Double Fetch:**

- Có thể từ React StrictMode unmount/remount
- Hoặc từ parent component re-render

---

### 3. `src/types/filePreview.ts`

```typescript
export interface FilePreviewRequest {
  fileId: string;
  page?: number;
}

export interface PdfRenderRequest {
  fileId: string;
  pageNumber: number;
  dpi?: number;
}
```

**Issue:**

- Hai interfaces khác nhau cho cùng chức năng
- `PdfRenderRequest` có `dpi`, `FilePreviewRequest` không có

---

## 🕵️ Double Call Investigation

### Possible Causes:

| Cause                     | Likelihood | Solution                 |
| ------------------------- | ---------- | ------------------------ |
| React StrictMode          | High       | Normal, ignore in dev    |
| fetchFirstPage ref change | Medium     | Memoize properly         |
| Parent re-render          | Medium     | Check parent component   |
| Cache miss retry          | Low        | Check cache logic        |
| Interceptor duplicate     | Low        | Check axios interceptors |

### Verification Steps:

1. Check browser Network tab:
   - Filter by `preview` or `render`
   - See if calls are simultaneous or sequential
   - Check request timing difference

2. Add console.log in fetchFirstPage:

   ```typescript
   console.log("[PDF Preview] fetchFirstPage called, fileId:", fileId);
   ```

3. Check if it's StrictMode:
   - Remove StrictMode wrapper temporarily
   - If calls reduce to 1 → StrictMode is cause

---

## 🎯 Recommended Fix

### 1. Consolidate to Single API Endpoint

```typescript
// NEW: Single function for all pages
export async function getFilePreview(request: {
  fileId: string;
  page?: number;
  dpi?: number;
}): Promise<FilePreviewResponse> {
  const response = await fileApiClient.get<Blob>(
    `/api/Files/${request.fileId}/preview-page`,
    {
      params: {
        page: request.page || 1,
        dpi: request.dpi || 300,
      },
      responseType: "blob",
    },
  );
  // ...
}
```

### 2. Prevent Double Fetch in Hook

```typescript
// Add fetch tracking ref
const isFetchingRef = useRef(false);

const fetchFirstPage = useCallback(async () => {
  if (!fileId || isFetchingRef.current) return; // ← Prevent concurrent calls

  isFetchingRef.current = true;

  try {
    // ... existing code
  } finally {
    isFetchingRef.current = false;
  }
}, [fileId, getCacheKey]);
```

### 3. Remove fetchFirstPage from useEffect deps

```typescript
useEffect(() => {
  if (fileId) {
    fetchFirstPage();
  }
}, [fileId]); // ← Remove fetchFirstPage, add eslint-disable comment if needed
```
