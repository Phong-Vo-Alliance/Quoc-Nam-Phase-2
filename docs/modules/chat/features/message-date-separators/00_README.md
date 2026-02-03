# [BƯỚC 0] Feature: Message Date Separators

> **Module:** Chat  
> **Feature:** Date separators between messages in chat  
> **Status:** 📝 Requirements phase (BƯỚC 1)  
> **Created:** 2026-02-02

---

## 📋 Overview

Hiển thị ngày gửi tin nhắn ở giữa chat khi có messages từ ngày khác nhau.

Ví dụ:

```
         1/2/2026
    [message 1]
    [message 2]
         Hôm nay
    [message 3]
```

## 🎯 Goals

- Group messages by date
- Display date separator centered between message groups
- Use "Hôm nay" for today's messages
- Use "Hôm qua" for yesterday's messages
- Use DD/MM/YYYY format for other dates

## 📁 Documents

| Step | File                      | Status          |
| ---- | ------------------------- | --------------- |
| 0    | 00_README.md              | ✅ Done         |
| 1    | 01_requirements.md        | ⏳ Pending      |
| 2A   | 02a_wireframe.md          | ⏳ Pending      |
| 2B   | 02b_flow.md               | ⏳ Pending      |
| 3    | 03_api-contract.md        | ❌ N/A (no API) |
| 4    | 04_implementation-plan.md | ⏳ Pending      |
| 5    | 05_progress.md            | ⏳ Pending      |
| 6    | 06_testing.md             | ⏳ Pending      |

## 🔗 Related

- Component: `ChatMainContainer.tsx`
- Related feature: Hide Tasks Tab (same session)
