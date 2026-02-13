# Task Access Token Setup - After Negotiation

## Overview

The `taskAccessToken` is now set **after** the Task Hub SignalR negotiation completes successfully, rather than during login. This ensures proper token handling and persistence.

## Flow

```
1. User logs in
   ↓
2. Login API returns accessToken (for Chat Hub)
   ↓
3. SignalRProvider connects Chat Hub with accessToken
   ↓
4. SignalRProvider connects Task Hub with taskAccessToken
   ↓
5. ✅ After Task Hub negotiation succeeds
   ↓
6. taskAccessToken is saved to localStorage
```

## How to Set Task Access Token

### Option 1: Provide During Login (Current)

If your backend returns `taskAccessToken` in the login response:

```typescript
// In useLogin.ts or login handler
loginSuccess(data.user, data.accessToken, data.taskAccessToken);
```

The token will be saved after Task Hub connection succeeds.

### Option 2: Fetch After Login (Recommended)

If you need to fetch the task token from a separate endpoint:

```typescript
// After login success
import { useAuthStore } from '@/stores/authStore';

// Login first
await login(credentials);

// Then fetch task token from backend
const response = await fetch('/api/auth/task-token', {
  headers: {
    Authorization: `Bearer ${accessToken}`
  }
});

const { taskAccessToken } = await response.json();

// Set it in auth store
useAuthStore.getState().setTaskAccessToken(taskAccessToken);
```

### Option 3: Set Manually After Connection

If you need to set the token after some other operation:

```typescript
import { useAuthStore } from '@/stores/authStore';

// Set task access token
useAuthStore.getState().setTaskAccessToken('your-task-token-here');
```

This will:
1. Save the token to localStorage (`"taskAccessToken"` key)
2. Update Zustand auth store state
3. Make it available for Task Hub reconnections

## Implementation Details

### Task Hub Connection

```typescript
// In SignalRProvider.tsx
await taskHub.start(taskAccessToken || undefined);
```

When `taskHub.start()` is called:
1. Uses provided `taskAccessToken` parameter
2. Falls back to `localStorage.getItem("taskAccessToken")`
3. After successful negotiation, saves token to localStorage
4. Token is persisted for reconnections

### Token Storage

The token is saved to localStorage after negotiation completes:

```typescript
// In signalr.ts - TaskHubConnection.start()
await this.connection.start();

// ✅ After successful negotiation
if (taskAccessToken) {
  localStorage.setItem("taskAccessToken", taskAccessToken);
  console.log("[TaskHub] Task access token saved after negotiation");
}
```

### Auth Store Method

```typescript
// New method in authStore
setTaskAccessToken: (token) => {
  setTaskAccessToken(token); // Save to localStorage
  set({ taskAccessToken: token }); // Update Zustand state
}
```

## Usage Examples

### Example 1: Backend Returns Task Token in Login Response

```typescript
// Backend response
{
  "user": { ... },
  "accessToken": "eyJhbGciOi...",
  "taskAccessToken": "eyJhbGciOi..."  // ← Task token included
}

// Frontend - useLogin.ts
loginSuccess(data.user, data.accessToken, data.taskAccessToken);
```

### Example 2: Fetch Task Token After Login

```typescript
// Step 1: Login
const { data } = await useLogin().mutateAsync(credentials);

// Step 2: Fetch task token
import { getTaskAccessToken } from '@/api/auth.api';
const taskToken = await getTaskAccessToken();

// Step 3: Set in store
useAuthStore.getState().setTaskAccessToken(taskToken);
```

Create the API function:

```typescript
// src/api/auth.api.ts
export async function getTaskAccessToken(): Promise<string> {
  const response = await apiClient.get<{ token: string }>('/api/auth/task-token');
  return response.data.token;
}
```

### Example 3: Set Token After Admin Approval

```typescript
// After user gets task permissions
function handleTaskPermissionGranted(taskToken: string) {
  useAuthStore.getState().setTaskAccessToken(taskToken);
  
  // Reconnect Task Hub with new token
  await taskHub.stop();
  await taskHub.start(taskToken);
}
```

## Token Persistence

The token is saved in two places:

1. **localStorage** - Key: `"taskAccessToken"`
   - Survives page refresh
   - Used on app reload
   - Cleared on logout

2. **Zustand State** - Property: `taskAccessToken`
   - In-memory state
   - Persisted via Zustand persist middleware
   - Part of `auth-storage` JSON object

## Cleanup on Logout

Both tokens are cleared:

```typescript
// In authStore.logout()
localStorage.clear();
clearAuthStorage(); // Removes both accessToken and taskAccessToken
removeAccessToken();
removeTaskAccessToken(); // New cleanup
```

## Debugging

Check token status:

```javascript
// In browser console

// Check localStorage
localStorage.getItem("taskAccessToken")

// Check Zustand store
JSON.parse(localStorage.getItem("auth-storage"))

// Check Task Hub connection
window.taskHub.getState() // Should return: 1 (Connected)
window.taskHub.isConnected() // Should return: true
```

## Benefits

✅ **Separation of Concerns**: Task token is independent from chat token  
✅ **Lazy Loading**: Token only set when needed  
✅ **Persistence**: Token survives page refresh  
✅ **Flexibility**: Multiple ways to set the token  
✅ **Security**: Token stored after successful negotiation  

## Migration from Old Implementation

If you were previously using `accessToken` for Task Hub:

**Before:**
```typescript
// Task Hub used accessToken
await taskHub.start(accessToken);
```

**After:**
```typescript
// Task Hub uses taskAccessToken
await taskHub.start(taskAccessToken);

// Set it via auth store method
useAuthStore.getState().setTaskAccessToken(taskToken);
```

## See Also

- [Task SignalR Implementation Summary](./TASK_SIGNALR_IMPLEMENTATION_SUMMARY.md)
- [SignalR Frontend Guide](./signalr-frontend-guide.md)
- [Auth Store Documentation](../../stores/authStore.ts)
