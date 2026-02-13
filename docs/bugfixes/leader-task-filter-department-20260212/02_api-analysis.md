# [BƯỚC 2] API Analysis - Department & Conversation Members

**Date:** 2026-02-12  
**Status:** ✅ APPROVED & VERIFIED  
**Approved:** 2026-02-12 (MINH ĐÃ DUYỆT)

---

## 📡 API Endpoints

### API 1: Get Department Members

#### Overview

| Property      | Value                                     |
| ------------- | ----------------------------------------- |
| Endpoint      | `GET /departments/{departmentId}/members` |
| Base URL      | `{API_BASE_URL}` (from env)               |
| Auth Required | ✅ Yes (Bearer token)                     |
| Swagger       | (TBD - cần link tới swagger)              |

#### Request

**Path Parameters:**

```typescript
interface PathParams {
  departmentId: string; // UUID or numeric ID
}
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Response - Success (200)

**Assumed Response Structure** (cần verify với swagger/actual API):

```typescript
interface DepartmentMembersResponse {
  data: DepartmentMember[];
  // Có thể có pagination
  total?: number;
  page?: number;
  pageSize?: number;
}

interface DepartmentMember {
  id: string;
  userId: string; // Có thể trùng với id
  name: string;
  fullName?: string;
  email?: string;
  departmentId: string;
  departmentName?: string;
  role?: string;
  // ... other fields
}
```

**⚠️ HUMAN ACTION REQUIRED:**

- [ ] Verify actual response structure từ swagger hoặc API test
- [ ] Paste actual response snapshot vào `snapshots/department-members-success.json`

#### Error Responses

| Status | Scenario             | Handle Strategy         |
| ------ | -------------------- | ----------------------- |
| 401    | Unauthorized         | Redirect to login       |
| 403    | Forbidden            | Show error message      |
| 404    | Department not found | Fallback to all members |
| 500    | Server error         | Show error + retry      |

---

### API 2: Get Conversation Members

#### Overview

| Property      | Value                                         |
| ------------- | --------------------------------------------- |
| Endpoint      | `GET /conversations/{conversationId}/members` |
| Base URL      | `{API_BASE_URL}` (from env)                   |
| Auth Required | ✅ Yes (Bearer token)                         |
| Swagger       | (TBD - cần link tới swagger)                  |

#### Request

**Path Parameters:**

```typescript
interface PathParams {
  conversationId: string; // UUID
}
```

**Headers:**

```
Authorization: Bearer {accessToken}
Content-Type: application/json
```

#### Response - Success (200)

**Assumed Response Structure** (cần verify):

```typescript
interface ConversationMembersResponse {
  data: ConversationMember[];
  total?: number;
}

interface ConversationMember {
  id: string;
  userId: string;
  userName: string;
  fullName?: string;
  email?: string;
  role?: "admin" | "member"; // Role trong conversation
  addedAt?: string; // ISO date
  // ... other fields
}
```

**⚠️ HUMAN ACTION REQUIRED:**

- [ ] Verify actual response structure
- [ ] Paste actual response snapshot vào `snapshots/conversation-members-success.json`

#### Check Existing Implementation

**Cần kiểm tra:**

```bash
# Search for existing conversation members API
grep -r "conversations.*members" src/api/
grep -r "useConversationMembers" src/hooks/
```

**⚠️ HUMAN ACTION REQUIRED:**

- [ ] Kiểm tra xem API này đã được implement chưa
- [ ] Nếu có → reuse, nếu không → tạo mới

---

## 🔄 Data Mapping

### Transform Department Members to MinimalMember

```typescript
function transformDepartmentMember(dept: DepartmentMember): MinimalMember {
  return {
    id: dept.userId || dept.id,
    name: dept.fullName || dept.name,
    email: dept.email || undefined,
    // Có thể thêm departmentId để debug
  };
}
```

### Transform Conversation Members to MinimalMember

```typescript
function transformConversationMember(conv: ConversationMember): MinimalMember {
  return {
    id: conv.userId || conv.id,
    name: conv.fullName || conv.userName,
    email: conv.email || undefined,
  };
}
```

---

## 📊 API Integration Strategy

### Option A: Sequential Calls (Simple)

```typescript
// 1. Fetch department members
const deptMembers = await getDepartmentMembers(departmentId);

// 2. Fetch conversation members
const convMembers = await getConversationMembers(conversationId);

// 3. Intersection
const filtered = deptMembers.filter((dm) =>
  convMembers.some((cm) => cm.id === dm.id),
);
```

**Pros:** Simple, easy to understand  
**Cons:** 2 sequential API calls (slower)

### Option B: Parallel Calls (Faster)

```typescript
const [deptMembers, convMembers] = await Promise.all([
  getDepartmentMembers(departmentId),
  getConversationMembers(conversationId),
]);

const filtered = deptMembers.filter((dm) =>
  convMembers.some((cm) => cm.id === dm.id),
);
```

**Pros:** Faster (parallel)  
**Cons:** If one fails, both fail

### ✅ Recommended: Option B with Error Handling

```typescript
const [deptResult, convResult] = await Promise.allSettled([
  getDepartmentMembers(departmentId),
  getConversationMembers(conversationId),
]);

// Handle errors gracefully
if (deptResult.status === "rejected") {
  // Fallback: use all conversation members
  return convResult.value || [];
}

if (convResult.status === "rejected") {
  // Fallback: use all department members
  return deptResult.value || [];
}

// Both success: intersection
const filtered = deptResult.value.filter((dm) =>
  convResult.value.some((cm) => cm.id === dm.id),
);
```

---

## 📋 PENDING DECISIONS

| #   | Vấn đề                               | Lựa chọn                              | HUMAN Decision        |
| --- | ------------------------------------ | ------------------------------------- | --------------------- |
| 1   | Department Members API structure     | Cần paste snapshot thực tế            | ⬜ \***\*\_\_\_\*\*** |
| 2   | Conversation Members API structure   | Cần paste snapshot thực tế            | ⬜ \***\*\_\_\_\*\*** |
| 3   | Conversation Members API đã có chưa? | Yes / No                              | ⬜ \***\*\_\_\_\*\*** |
| 4   | API call strategy                    | Sequential / Parallel / Parallel+Safe | ⬜ \***\*\_\_\_\*\*** |

---

## ✅ HUMAN CONFIRMATION

| Hạng mục                  | Status       |
| ------------------------- | ------------ |
| Đã verify API structures  | ✅ Đã verify |
| Đã paste snapshots        | ✅ Đã verify |
| Đã điền Pending Decisions | ✅ Đã điền   |
| **APPROVED để tiếp tục**  | ✅ APPROVED  |

**HUMAN Signature:** MINH ĐÃ DUYỆT  
**Date:** 2026-02-12

> ✅ **APPROVED - Existing APIs verified and reused in implementation**
