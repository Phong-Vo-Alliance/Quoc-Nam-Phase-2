# [BƯỚC 1] Requirements - Leader Task Filter by Department

**Date:** 2026-02-12  
**Status:** ✅ APPROVED & IMPLEMENTED  
**Approved:** 2026-02-12 (MINH ĐÃ DUYỆT)  
**Implemented:** 2026-02-12

---

## 📋 Functional Requirements

### FR-1: Department-Based Task Visibility

**Current Behavior:**

- Leader có thể xem tất cả tasks trong conversation
- Dropdown "Nhân viên" (assigneeFilter) hiển thị tất cả members trong conversation

**Required Behavior:**

- Leader CHỈ xem tasks của:
  - ✅ Bản thân (own tasks)
  - ✅ Members cùng phòng ban VÀ có trong conversation
- Dropdown "Nhân viên" CHỈ hiển thị:
  - ✅ **"Tất cả"** - hiển thị tasks của **tất cả** filtered members (bản thân + cùng phòng ban trong conversation)
  - ✅ **Individual members** - mỗi member trong filtered list (để filter tasks của member đó)

**✨ Clarification:**

- "Tất cả" = Leader (bản thân) + Nhân viên cùng phòng ban có trong conversation
- Danh sách members trong dropdown bao gồm Leader và các members được filtered
- Không có option riêng "Bản thân" (leader đã nằm trong danh sách filtered members)
- Khi chọn "Tất cả" → hiển thị tasks của tất cả filtered members (bao gồm leader)
- Khi chọn member cụ thể → chỉ hiển thị tasks của member đó

### FR-2: Apply Filter to Assign Task Dropdown

**Scope:**

- Dropdown "Giao cho" khi tạo/reassign task
- Chỉ hiển thị members theo logic FR-1

**Components Affected:**

- (TBD - Cần tìm component "Giao Công Việc")

### FR-3: Reusable Filter Logic

**Requirements:**

- Tạo custom hook `useFilteredAssignees`
- Hook nhận inputs:
  - `conversationId: string`
  - `currentUserId: string` (optional - fallback to auth user)
- Hook return:
  - `filteredMembers: MinimalMember[]` (bản thân + department members in conversation)
  - `isLoading: boolean`
  - `isError: boolean`

---

## 🔍 Business Rules

### Rule 1: Department Member Detection

```
Filtered Members = (Department Members ∩ Conversation Members) ∪ {Current User}

Where:
- Department Members = GET /departments/{departmentId}/members
- Conversation Members = GET /conversations/{conversationId}/members
- Current User = Leader đang đăng nhập

Example:
- Department "CSKH" has: [Leader, User A, User B, User C]
- Conversation has: [Leader, User A, User D (from other dept)]
- Filtered Members = [Leader, User A]
  - User B, C: In department but NOT in conversation → excluded
  - User D: In conversation but NOT in department → excluded

"Tất cả" option shows tasks from: [Leader, User A]
```

**Edge Cases:**

1. ✅ **Leader không có department** → INVALID STATE:
   - Leader PHẢI thuộc một department để feature này hoạt động
   - Nếu `authUser.departmentId` = null/undefined → Show warning message
   - Fallback: Disable filtering, chỉ show tasks của chính leader (bản thân)
2. ❓ Nếu API `/departments/{id}/members` fail → fallback behavior?
3. ❓ Nếu API `/conversations/{id}/members` fail → fallback behavior?

### Rule 2: Department ID Source

✅ **EXISTING IMPLEMENTATION:**

Leader's department ID đã có trong `authUser` object:

```typescript
// From src/types/identity.ts
interface UserProfileResponse {
  id: string;
  email: string | null;
  departments?: UserDepartmentDto[] | null; // ✅ Already has departments
}

interface UserDepartmentDto {
  departmentId: string; // ✅ Department ID
  departmentName: string | null;
  isLeader: boolean;
}
```

**Implementation:**

- Get from: `authUser.departments[0].departmentId` (first department)
- Assumes: User có ít nhất 1 department
- Fallback: Nếu không có departments → show only self

### Rule 3: Caching Strategy

✅ **HUMAN DECISION: Option A - Cache 5 phút**

API calls nên cache như thế nào?

- [x] **Option A: Cache 5 phút (staleTime: 5 _ 60 _ 1000)** ✅ SELECTED
  - Department members: Cache reuse across all conversations (same dept)
  - Conversation members: Cache riêng per conversation, reuse khi quay lại
  - Performance tốt, acceptable staleness
- [ ] Option B: Cache 1 phút (staleTime: 60 \* 1000)
- [ ] Option C: No cache (always fresh)

---

## 🎨 UI Requirements

### No UI Changes Required

- ✅ Giữ nguyên dropdown "Nhân viên" trong ConversationDetailPanel
- ✅ Giữ nguyên dropdown "Giao cho" trong Assign Task dialog
- ✅ CHỈ thay đổi danh sách options được render

**Visual:**

```
Before (current):
┌─────────────────────────────┐
│ Nhân viên: [Dropdown ▼]    │
├─────────────────────────────┤
│ Tất cả                      │ ← Shows ALL conversation members
│ Nguyễn Văn A (dept: Sale)   │
│ Trần Thị B (dept: CSKH)     │
│ Lê Văn C (dept: CSKH)       │
│ ...                         │
└─────────────────────────────┘

After (required):
┌─────────────────────────────┐
│ Nhân viên: [Dropdown ▼]    │
├─────────────────────────────┤
│ Tất cả                      │ ← Shows tasks of ALL filtered members
│ Nguyễn Văn L (Leader)       │ ← Leader (bản thân) - always included
│ Trần Thị B (dept: CSKH)     │ ← Same dept as leader + in conversation
│ Lê Văn C (dept: CSKH)       │ ← Same dept as leader + in conversation
└─────────────────────────────┘

Note: Nguyễn Văn A (dept: Sale) KHÔNG hiển thị vì khác phòng ban
```

---

## 🔌 API Requirements

### API 1: Get Department Members ✅ ALREADY IMPLEMENTED

**Endpoint:** `GET /api/v1/departments/{departmentId}/members`

**Existing Implementation:**

- ✅ API Client: `src/api/departments.api.ts` - `getDepartmentMembers(departmentId, isLeader?)`
- ✅ Query Hook: `src/hooks/queries/useDepartmentMembers.ts`
- ✅ Type: `DepartmentMemberDto` in `src/types/identity.ts`
- ✅ Cache: 5 minutes staleTime (already configured)
- ✅ Used in: `AddMemberDialog.tsx`

**Response Type:**

```typescript
interface DepartmentMemberDto {
  id: string; // uuid
  userId: string; // uuid
  userFullName: string | null;
  userEmail: string | null;
  isLeader: boolean;
  joinedAt: string; // date-time
}
```

**Status:** ✅ READY - Will reuse existing implementation

### API 2: Get Conversation Members

**Endpoint:** `GET /conversations/{conversationId}/members`

**Existing Implementation:**

- ✅ API Client: `src/api/conversations.api.ts` - `getConversationMembers(conversationId)`
- ✅ Query Hook: `src/hooks/queries/useConversationMembers.ts`
- ✅ Type: `ConversationMember` in `src/types/conversations.ts`
- ✅ Cache: 5 minutes staleTime (already configured)
- ✅ Used in: Multiple components

**Response Type:**

```typescript
interface ConversationMember {
  userId: string;
  userName: string;
  role: string;
  joinedAt: string;
  isMuted: boolean;
  userInfo: ConversationMemberUserInfo;
}
```

**Status:** ✅ READY - Existing implementation reused

---

## 🚫 Non-Functional Requirements

### NFR-1: Performance

- API calls PHẢI được cached
- Không gọi lại API nếu conversationId không thay đổi
- Loading state KHÔNG block UI

### NFR-2: Error Handling

- ✅ Nếu API fail → console.error logged
- ✅ Nếu API fail → fallback to showing only self (leader)
- ✅ Edge cases handled: no department, API errors, loading states

### NFR-3: Backward Compatibility

- ✅ Staff mode KHÔNG bị ảnh hưởng
- ✅ Existing task filtering logic KHÔNG thay đổi
- ✅ All original functionality intact

---

## 📋 PENDING DECISIONS (Các quyết định chờ HUMAN)

| #   | Vấn đề                                 | Lựa chọn                                     | HUMAN Decision                                        |
| --- | -------------------------------------- | -------------------------------------------- | ----------------------------------------------------- |
| 1   | Department ID source                   | authUser.departments[0].departmentId         | ✅ **authUser.departments[0].departmentId**           |
| 2   | API `/departments/{id}/members` fail   | Show error + disable filter / Show only self | ✅ **Show only self**                                 |
| 3   | API `/conversations/{id}/members` fail | Show error + disable filter / Show only self | ✅ **Show only self**                                 |
| 4   | Cache stale time                       | 5 min / 1 min / no cache                     | ✅ **5 phút (already set in useDepartmentMembers)**   |
| 5   | Component "Giao Công Việc" location    | Cần HUMAN chỉ path hoặc AI tìm               | ✅ **TaskCard component (Giao cho dropdown in card)** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã review Requirements    | ✅ Đã review |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để tiếp tục**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

> ✅ **APPROVED - Implementation COMPLETED**

---

## 📊 IMPLEMENTATION STATUS

**Status:** ✅ COMPLETE  
**Files Created:** 2 (useFilteredAssignees hook + tests)  
**Files Modified:** 2 (ConversationDetailPanel.tsx, AssignTaskSheet.tsx)  
**Tests:** ✅ 10/10 PASSING (124ms)  
**TypeScript:** ✅ NO ERRORS

**See full implementation details:**  
[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)
