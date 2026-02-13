# PDF Preview API Fix

## 📋 Issue Summary

| Field             | Value                              |
| ----------------- | ---------------------------------- |
| **Issue ID**      | pdf-preview-api-fix-20260212       |
| **Reported Date** | 2026-02-12                         |
| **Priority**      | High                               |
| **Component**     | FilePreviewModal, PDF Preview Hook |

## 🐛 Problem Description

### Current Behavior:

1. When previewing a PDF file, the system calls **wrong API endpoints**
2. API is being called **2 times** (double fetch)

### Current API Calls (Wrong):

- `GET /api/Files/{fileId}/preview?page={pageNumber}` - for first page
- `GET /api/pdf/{fileId}/pages/{pageNumber}/render?page=...&dpi=...` - for subsequent pages

### Expected Behavior:

- Use single endpoint: `GET /api/Files/{id}/preview-page`
- Call API only **once per page**

## 📡 New API Specification

### Endpoint

```
GET /api/Files/{id}/preview-page
```

### Parameters

| Name | Location | Type          | Required | Description                      |
| ---- | -------- | ------------- | -------- | -------------------------------- |
| id   | path     | string (uuid) | Yes      | File ID                          |
| page | query    | integer       | No       | Page number (default: 1)         |
| dpi  | query    | integer       | No       | DPI for rendering (default: 300) |

### Response

| Status | Content-Type | Description                    |
| ------ | ------------ | ------------------------------ |
| 200    | image/png    | PNG image of the rendered page |

### Response Headers

| Header         | Type    | Description                  |
| -------------- | ------- | ---------------------------- |
| X-Total-Pages  | integer | Total number of pages in PDF |
| X-Current-Page | integer | Current page number          |

### Swagger Reference

https://vega-file-api-dev.allianceitsc.com/swagger/index.html

---

## 📋 IMPACT SUMMARY (Tóm tắt thay đổi)

### Files sẽ sửa đổi:

| File                         | Thay đổi                                                              |
| ---------------------------- | --------------------------------------------------------------------- |
| `src/api/filePreview.api.ts` | Cập nhật `getFilePreview()` và `renderPdfPage()` để dùng endpoint mới |
| `src/hooks/usePdfPreview.ts` | Có thể cần điều chỉnh nếu response format thay đổi                    |
| `src/types/filePreview.ts`   | Kiểm tra types có cần update không                                    |

### Files sẽ tạo mới:

- (không có)

### Files sẽ xoá:

- (không có)

### Dependencies sẽ thêm:

- (không có)

---

## ⏳ PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                                 | Lựa chọn          | HUMAN Decision |
| --- | ------------------------------------------------------ | ----------------- | -------------- |
| 1   | DPI mặc định khi gọi API                               | 150, 200, or 300? | ⬜ **200**     |
| 2   | Có cần xử lý first page khác với pages khác không?     | Có / Không        | ⬜ **Không**   |
| 3   | Xóa bỏ hoàn toàn function `renderPdfPage` hay giữ lại? | Xóa / Giữ         | ⬜ **Xóa**     |

> ⚠️ **AI KHÔNG ĐƯỢC thực thi code nếu có mục chưa được HUMAN điền**

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Impact Summary  | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để thực thi**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

> ⚠️ **CRITICAL: AI KHÔNG ĐƯỢC viết code nếu mục "APPROVED để thực thi" = ⬜ CHƯA APPROVED**
