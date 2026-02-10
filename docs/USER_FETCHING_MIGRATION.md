# User Fetching Migration to Department Members

## Summary

Updated the user fetching system to use department members instead of the admin-only users API. Users are now fetched based on the current user's departments, with filtering by the currently selected category/workType.

## Changes Made

### 1. Type Definitions

**File: [src/types/identity.ts](src/types/identity.ts)**
- Added `UserDepartmentDto` interface for user department relationships
- Added `DepartmentMemberDto` interface for department member data
- Added `AuthMeResponse` interface for /api/auth/me endpoint response
- Updated `UserProfileResponse` to include optional `departments` field

**File: [src/types/auth.ts](src/types/auth.ts)**
- Updated `LoginApiUser` interface to include optional `departments` field
- Imported `UserDepartmentDto` from identity types

### 2. API Client Updates

**File: [src/api/departments.api.ts](src/api/departments.api.ts)** (NEW)
- Created new API client for department endpoints
- Implemented `getDepartmentMembers(departmentId, isLeader?)` function
- Returns array of `DepartmentMemberDto`

**File: [src/api/users.api.ts](src/api/users.api.ts)** (UPDATED)
- Changed from fetching `/api/v1/users` (admin-only) to department members
- Now fetches current user's departments from `getCurrentUser()`
- Filters departments by current category ID from `getSelectedCategory()`
- Uses first department if no category is selected
- Converts `DepartmentMemberDto` to `UserProfileResponse` format
- Implements client-side pagination
- Returns empty result gracefully on errors

### 3. User Authentication Updates

**File: [src/utils/getCurrentUser.ts](src/utils/getCurrentUser.ts)**
- Updated return type to include `departments?: UserDepartmentDto[]`
- Updated `getCurrentUserFromAPI()` to fetch departments from `/api/auth/me`
- Updated all user object creations to include departments field
- Caches departments in localStorage for offline access

**File: [src/stores/authStore.ts](src/stores/authStore.ts)**
- Updated `AuthUser` interface to include `departments?: UserDepartmentDto[]`
- Updated `loginSuccess` action to store departments from API response

### 4. Test Coverage

**File: [src/api/__tests__/departments.api.test.ts](src/api/__tests__/departments.api.test.ts)** (NEW)
- Tests for `getDepartmentMembers()` function
- Success case with member list
- Filtering by `isLeader` parameter
- Error handling
- Empty member list handling

**File: [src/api/__tests__/users.api.test.ts](src/api/__tests__/users.api.test.ts)** (NEW)
- Tests for updated `getUsers()` function
- Department member fetching
- Category-based department filtering
- Pagination logic
- Empty departments handling
- API error handling
- Full name parsing

## Data Flow

```
┌────────────────────────────────────────────────────────────┐
│ User Request (e.g., AddMemberDialog)                       │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ useUsers() hook → getUsers() API function                  │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ getCurrentUser() → Fetch departments from auth/me          │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ getSelectedCategory() → Get current category ID            │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ Filter departments → Find matching department              │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ getDepartmentMembers(departmentId) → Fetch members         │
└──────────────────┬─────────────────────────────────────────┘
                   │
                   v
┌────────────────────────────────────────────────────────────┐
│ Transform & Paginate → Return UserProfileResponse[]        │
└────────────────────────────────────────────────────────────┘
```

## API Endpoints Used

1. **GET /api/auth/me** - Fetch current user with departments
   - Response: `{ id, identifier, roles, departments: UserDepartmentDto[] }`

2. **GET /api/v1/departments/{id}/members** - Fetch department members
   - Query params: `isLeader?: boolean`
   - Response: `DepartmentMemberDto[]`

## Department Filtering Logic

1. User has multiple departments (from `/api/auth/me`)
2. Current category/workType ID is retrieved from localStorage
3. Department matching is done by:
   - `departmentCode === categoryId` OR
   - `departmentId === categoryId`
4. If no match found or no category selected, use the first department
5. Fetch members from the selected department

## Benefits

✅ **Security**: No longer requires Admin role to fetch users  
✅ **Scoped Access**: Users only see members from their departments  
✅ **Category Awareness**: Automatically filters by current category  
✅ **Graceful Degradation**: Returns empty list on errors instead of failing  
✅ **Type Safety**: Full TypeScript coverage with proper interfaces  
✅ **Test Coverage**: Comprehensive unit tests for all scenarios  

## Migration Notes

- **Backwards Compatible**: Existing components using `useUsers()` hook continue to work
- **No UI Changes**: Component interfaces remain unchanged
- **localStorage Keys**: Uses existing `"selected-category-id"` and `"current_user"` keys
- **Fallback Behavior**: Returns empty user list if no departments available

## Testing

Run tests with:
```bash
npm run test -- departments.api.test.ts users.api.test.ts
```

## Future Improvements

1. Add caching for department members to reduce API calls
2. Implement real-time updates when members join/leave departments
3. Add department switching UI for users with multiple departments
4. Consider adding department hierarchy support
