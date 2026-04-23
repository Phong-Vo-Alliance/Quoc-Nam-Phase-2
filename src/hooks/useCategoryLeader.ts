/**
 * Per-category leader permission hooks.
 *
 * Unlike `hasLeaderPermissions()` (global role check), these hooks determine
 * whether the current user has leader rights **for a specific chat group**
 * by looking up `category.departmentLeaders` from the /api/categories response.
 *
 * Rules:
 * - Admin role (global) always bypasses — admins have leader rights everywhere.
 * - Otherwise: user is a leader of the category iff their id is in
 *   `category.departmentLeaders[].id`.
 */

import { useMemo } from "react";
import { useCategories } from "@/hooks/queries/useCategories";
import { useAuthStore } from "@/stores/authStore";
import { hasRole } from "@/utils/roleUtils";
import type { CategoryWithUnread } from "@/types/categories";

function isUserLeaderOfCategory(
  category: CategoryWithUnread | undefined,
  userId: string | undefined,
): boolean {
  if (!category || !userId) return false;
  return !!category.departmentLeaders?.some(
    (l) => l.id === userId && l.isActive,
  );
}

/**
 * Check if the current user is a leader of the given category.
 * Admins always return true. Staff-only users always return false
 * (they can never be listed in departmentLeaders), which lets callers
 * skip every leader-gated API downstream.
 */
export function useIsLeaderInCategory(
  categoryId: string | null | undefined,
): boolean {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: categories } = useCategories();

  return useMemo(() => {
    if (hasRole("Admin")) return true;
    if (!categoryId || !categories) return false;
    const category = categories.find((c) => c.id === categoryId);
    return isUserLeaderOfCategory(category, currentUserId);
  }, [categoryId, categories, currentUserId]);
}

/**
 * Check if the current user is a leader of the category that owns
 * the given conversation. Admins always return true. Staff-only users
 * always return false (short-circuits every leader-gated API downstream).
 */
export function useIsLeaderInConversation(
  conversationId: string | null | undefined,
): boolean {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: categories } = useCategories();

  return useMemo(() => {
    if (hasRole("Admin")) return true;
    if (!conversationId || !categories) return false;
    const category = categories.find((c) =>
      c.conversations?.some((conv) => conv.conversationId === conversationId),
    );
    return isUserLeaderOfCategory(category, currentUserId);
  }, [conversationId, categories, currentUserId]);
}

/**
 * Strict per-conversation leader check — NO Admin bypass.
 * Returns true only when the current user's id appears in the category's
 * `departmentLeaders[]` for the conversation.
 *
 * Use this when the backend enforces `departmentLeaders` membership
 * regardless of system role (e.g. Task API's leader-only endpoints like
 * `/api/information-confirmed` and `/api/information-confirmed/all`),
 * where granting Admin the UI bypass would trigger a 403.
 */
export function useIsDepartmentLeaderInConversation(
  conversationId: string | null | undefined,
): boolean {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: categories } = useCategories();

  return useMemo(() => {
    if (!conversationId || !categories) return false;
    const category = categories.find((c) =>
      c.conversations?.some((conv) => conv.conversationId === conversationId),
    );
    return isUserLeaderOfCategory(category, currentUserId);
  }, [conversationId, categories, currentUserId]);
}

/**
 * Check if the current user is a leader of at least one category.
 * Admins always return true. Staff-only users always return false.
 * Returns false while categories data is still loading, which hides
 * leader-only UI until the check can be made authoritatively.
 */
export function useIsLeaderInAnyCategory(): boolean {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: categories } = useCategories();

  return useMemo(() => {
    if (hasRole("Admin")) return true;
    if (!categories || !currentUserId) return false;
    return categories.some((c) => isUserLeaderOfCategory(c, currentUserId));
  }, [categories, currentUserId]);
}

/**
 * Return the subset of categories where the current user is a leader.
 * Admins see every category. Staff-only users see an empty list.
 * Returns an empty array while categories data is still loading.
 */
export function useLedCategories(): CategoryWithUnread[] {
  const currentUserId = useAuthStore((s) => s.user?.id);
  const { data: categories } = useCategories();

  return useMemo(() => {
    if (!categories) return [];
    if (hasRole("Admin")) return categories;
    if (!currentUserId) return [];
    return categories.filter((c) =>
      isUserLeaderOfCategory(c, currentUserId),
    );
  }, [categories, currentUserId]);
}
