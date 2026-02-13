/**
 * Example: How to set taskAccessToken after fetching from backend
 * 
 * This example shows how to fetch the task access token from your backend
 * after the user logs in, and set it for Task Hub connection.
 */

import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/api/client'; // Adjust import based on your API client

/**
 * Example API endpoint to get task access token
 * Replace this with your actual backend endpoint
 */
async function fetchTaskAccessToken(): Promise<string> {
  try {
    const response = await apiClient.get<{ token: string }>('/api/auth/task-token');
    return response.data.token;
  } catch (error) {
    console.error('Failed to fetch task access token:', error);
    throw error;
  }
}

/**
 * Example: Set task token after login
 * Call this after successful login
 */
export async function setupTaskAccess(): Promise<void> {
  try {
    console.log('[TaskAccess] Fetching task access token from backend...');
    
    // Fetch token from your backend API
    const taskAccessToken = await fetchTaskAccessToken();
    
    // Set it in auth store (also saves to localStorage)
    useAuthStore.getState().setTaskAccessToken(taskAccessToken);
    
    console.log('[TaskAccess] ✅ Task access token set successfully');
  } catch (error) {
    console.error('[TaskAccess] ❌ Failed to setup task access:', error);
    throw error;
  }
}

/**
 * Example: Usage in login flow
 * 
 * Option 1: Call after login mutation succeeds
 */
export function useLoginWithTaskAccess() {
  const loginMutation = useLogin({
    onSuccess: async (data) => {
      // Login successful, now get task token
      try {
        await setupTaskAccess();
        console.log('Login complete with task access');
      } catch (error) {
        console.warn('Login succeeded but task access setup failed:', error);
        // Handle error - maybe show a warning to user
      }
    },
  });

  return loginMutation;
}

/**
 * Example: Manual token update
 * Use this if you need to update the token at any time
 */
export function updateTaskAccessToken(newToken: string): void {
  useAuthStore.getState().setTaskAccessToken(newToken);
  console.log('Task access token updated');
}

/**
 * Example: Get current task token
 */
export function getCurrentTaskToken(): string | null {
  return useAuthStore.getState().taskAccessToken;
}

/**
 * Example: Check if task access is available
 */
export function hasTaskAccess(): boolean {
  const taskToken = useAuthStore.getState().taskAccessToken;
  return !!taskToken;
}
