# Pin and Star Messages - Phase 2

> **Feature:** Pin and Star Messages (Phase 2)  
> **Module:** Chat  
> **Version:** 2.0  
> **Status:** 📝 Requirements Analysis  
> **Created:** 2026-01-28

---

## 📋 Overview

Phase 2 của tính năng Pin and Star Messages tập trung vào:

- **Loại bỏ chức năng Pin** - Ẩn toàn bộ UI và logic liên quan đến pin messages
- **Tích hợp API Starred Messages** - Chuyển từ mock data sang real API
- **Loading States** - Thêm skeleton loading khi fetch data

## 🎯 Objectives

### Primary Goals

1. ✅ Ẩn/xoá toàn bộ code liên quan pin messages
2. ✅ Tích hợp API `GET /api/conversations/{conversationId}/starred-messages`
3. ✅ Hiển thị loading state khi gọi API

### Secondary Goals

- Giữ nguyên UI của starred messages panel
- Giữ nguyên user experience (UX) hiện tại
- Đảm bảo backward compatibility

## 📊 Current State (Phase 1)

- ✅ UI components cho PinnedMessagesPanel
- ✅ Mock data cho starred messages
- ✅ Basic interaction (star/unstar)

## 🚀 Phase 2 Changes

### 1. Remove Pin Feature

- Xoá/comment code liên quan pin trong `ChatMessagePanel.tsx`
- Ẩn pin icon trong message actions
- Giữ lại star icon và functionality

### 2. API Integration

- **Endpoint:** `GET /api/conversations/{conversationId}/starred-messages`
- **Response:** Array of `StarredMessageDto`
- **Params:** `limit`, `cursor` (pagination)

### 3. Loading States

- Skeleton loading trong `PinnedMessagesPanel`
- Loading spinner khi fetch
- Empty state khi chưa có starred messages

## 📁 Files Affected

### Will Modify

- `src/features/portal/components/PinnedMessagesPanel.tsx` - API integration + loading
- `src/features/portal/workspace/ChatMessagePanel.tsx` - Remove pin code
- `src/features/portal/workspace/WorkspaceView.tsx` - Remove pin props/state

### Will Create

- `src/api/starred-messages.api.ts` - API client
- `src/hooks/queries/useStarredMessages.ts` - React Query hook
- `src/types/starred-messages.ts` - TypeScript types

### Will Test

- `src/api/__tests__/starred-messages.api.test.ts`
- `src/hooks/queries/__tests__/useStarredMessages.test.ts`

## 🔗 Related Documentation

- API Contract: `docs/api/chat/starred-messages/contract.md`
- Swagger: https://vega-chat-api-dev.allianceitsc.com/swagger/index.html

## 📅 Timeline

| Phase | Description              | Duration | Status         |
| ----- | ------------------------ | -------- | -------------- |
| 0     | Requirements & Planning  | 0.5 day  | ⏳ In Progress |
| 1     | API Contract & Snapshots | 0.5 day  | ⏳ Pending     |
| 2     | Implementation           | 1 day    | ⏳ Pending     |
| 3     | Testing                  | 0.5 day  | ⏳ Pending     |
| 4     | Review & Deploy          | 0.5 day  | ⏳ Pending     |

**Total Estimate:** 3 days

---

## 📝 Next Steps

1. ✅ Review this README
2. ⏳ Create requirements document (01_requirements.md)
3. ⏳ Create API contract (docs/api/chat/starred-messages/contract.md)
4. ⏳ Create implementation plan (04_implementation-plan.md)
5. ⏳ HUMAN approval
6. ⏳ Start implementation
