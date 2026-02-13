# PDF Preview API Fix

> **Date:** 2026-02-12  
> **Status:** ⏳ PENDING HUMAN APPROVAL  
> **Priority:** High

## 🐛 Summary

PDF preview đang gọi sai API endpoint và gọi 2 lần khi mở file.

## 📁 Documentation

| File                                                     | Description                                     |
| -------------------------------------------------------- | ----------------------------------------------- |
| [01_requirements.md](./01_requirements.md)               | Issue description, API spec, pending decisions  |
| [02_implementation-plan.md](./02_implementation-plan.md) | Step-by-step implementation plan                |
| [03_code-analysis.md](./03_code-analysis.md)             | Current code analysis, root cause investigation |

## 🔗 API Reference

**New Endpoint:**

```
GET /api/Files/{id}/preview-page?page={n}&dpi={dpi}
```

**Swagger:** https://vega-file-api-dev.allianceitsc.com/swagger/index.html

## ⏳ Awaiting HUMAN Decisions

1. DPI mặc định: 150, 200, or 300?
2. First page logic khác với pages khác?
3. Xóa hay giữ `renderPdfPage()` function?

## ✅ Next Steps

1. HUMAN review `01_requirements.md`
2. HUMAN điền Pending Decisions
3. HUMAN tick APPROVED
4. AI implement changes
