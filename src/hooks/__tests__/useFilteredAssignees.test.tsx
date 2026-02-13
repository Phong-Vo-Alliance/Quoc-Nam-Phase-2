/**
 * Tests for useFilteredAssignees hook
 *
 * Tests the behavior of filtering assignees based on:
 * - Department members
 * - Conversation members
 * - Intersection logic
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFilteredAssignees } from "../useFilteredAssignees";
import type { DepartmentMemberDto } from "@/types/identity";
import type { ConversationMember } from "@/types/conversations";

// Mock hooks
vi.mock("@/hooks/queries/useDepartmentMembers");
vi.mock("@/hooks/queries/useConversationMembers");
vi.mock("@/stores/authStore");

import { useDepartmentMembers } from "@/hooks/queries/useDepartmentMembers";
import { useConversationMembers } from "@/hooks/queries/useConversationMembers";
import { useAuthStore } from "@/stores/authStore";

// Helper to create wrapper with QueryClient
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

// Mock data
const mockCurrentUser = {
  id: "user-leader-1",
  identifier: "leader@example.com",
  fullName: "Leader User",
  roles: ["Leader"],
  departments: [
    {
      departmentId: "dept-1",
      departmentName: "Sales",
      departmentCode: "SALES",
      isLeader: true,
      id: "user-dept-1",
      joinedAt: "2024-01-01T00:00:00Z",
    },
  ],
};

const mockDeptMembers: DepartmentMemberDto[] = [
  {
    id: "dept-member-1",
    userId: "user-leader-1",
    userFullName: "Leader User",
    userEmail: "leader@example.com",
    isLeader: true,
    joinedAt: "2024-01-01T00:00:00Z",
  },
  {
    id: "dept-member-2",
    userId: "user-member-1",
    userFullName: "Member 1",
    userEmail: "member1@example.com",
    isLeader: false,
    joinedAt: "2024-01-02T00:00:00Z",
  },
  {
    id: "dept-member-3",
    userId: "user-member-2",
    userFullName: "Member 2",
    userEmail: "member2@example.com",
    isLeader: false,
    joinedAt: "2024-01-03T00:00:00Z",
  },
];

const mockConvMembers: ConversationMember[] = [
  {
    userId: "user-leader-1",
    userName: "Leader User",
    role: "Leader",
    joinedAt: "2024-01-01T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-leader-1",
      userName: "Leader User",
      fullName: "Leader User",
      identifier: "leader@example.com",
      roles: "Leader",
      avatarUrl: null,
    },
  },
  {
    userId: "user-member-1",
    userName: "Member 1",
    role: "Member",
    joinedAt: "2024-01-02T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-member-1",
      userName: "Member 1",
      fullName: "Member 1",
      identifier: "member1@example.com",
      roles: "Member",
      avatarUrl: null,
    },
  },
  {
    userId: "user-other-1",
    userName: "Other User",
    role: "Member",
    joinedAt: "2024-01-04T00:00:00Z",
    isMuted: false,
    userInfo: {
      id: "user-other-1",
      userName: "Other User",
      fullName: "Other User",
      identifier: "other@example.com",
      roles: "Member",
      avatarUrl: null,
    },
  },
];

describe("useFilteredAssignees", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset console methods
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("should return intersection of department and conversation members", async () => {
    // Mock auth store
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    // Mock successful API responses
    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should include: Leader (user-leader-1) and Member 1 (user-member-1)
    // Should NOT include: Member 2 (not in conversation) or Other User (not in department)
    expect(result.current.filteredMembers).toHaveLength(2);
    expect(result.current.filteredMembers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "user-leader-1", name: "Leader User" }),
        expect.objectContaining({ id: "user-member-1", name: "Member 1" }),
      ]),
    );
  });

  it("should always include current user even if not in intersection", async () => {
    // Mock user NOT in conversation
    const userNotInConv = {
      ...mockCurrentUser,
      id: "user-leader-different",
    };

    vi.mocked(useAuthStore).mockReturnValue(userNotInConv);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should include current user at the beginning
    expect(result.current.filteredMembers[0]).toMatchObject({
      id: "user-leader-different",
      name: "Leader User",
      role: "Leader",
    });
  });

  it("should return only self if department API fails", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    // Department API error
    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show error
    expect(result.current.isError).toBe(true);

    // Should fallback to only self
    expect(result.current.filteredMembers).toHaveLength(1);
    expect(result.current.filteredMembers[0]).toMatchObject({
      id: "user-leader-1",
      name: "Leader User",
      role: "Leader",
    });

    // Should log error
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("API error"),
      expect.any(Object),
    );
  });

  it("should return only self if conversation API fails", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    } as any);

    // Conversation API error
    vi.mocked(useConversationMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show error
    expect(result.current.isError).toBe(true);

    // Should fallback to only self
    expect(result.current.filteredMembers).toHaveLength(1);
    expect(result.current.filteredMembers[0]).toMatchObject({
      id: "user-leader-1",
    });
  });

  it("should return only self if both APIs fail", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should show error
    expect(result.current.isError).toBe(true);

    // Should fallback to only self
    expect(result.current.filteredMembers).toHaveLength(1);
  });

  it("should handle loading states correctly", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    // Simulate loading state
    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.filteredMembers).toEqual([]);
  });

  it("should handle missing departmentId (no department assigned)", async () => {
    // User without department
    const userNoDept = {
      ...mockCurrentUser,
      departments: [],
    };

    vi.mocked(useAuthStore).mockReturnValue(userNoDept);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should return only self
    expect(result.current.filteredMembers).toHaveLength(1);
    expect(result.current.filteredMembers[0]).toMatchObject({
      id: "user-leader-1",
      role: "Leader",
    });

    // Should log warning
    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining("no departmentId"),
    );
  });

  it("should correctly transform DepartmentMemberDto to MinimalMember", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Check transformation
    const leader = result.current.filteredMembers.find(
      (m) => m.id === "user-leader-1",
    );
    expect(leader).toMatchObject({
      id: "user-leader-1",
      name: "Leader User",
      role: "Leader",
    });

    const member = result.current.filteredMembers.find(
      (m) => m.id === "user-member-1",
    );
    expect(member).toMatchObject({
      id: "user-member-1",
      name: "Member 1",
      role: "Member",
    });
  });

  it("should correctly transform ConversationMember to MinimalMember", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    vi.mocked(useDepartmentMembers).mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    } as any);

    vi.mocked(useConversationMembers).mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    } as any);

    const { result } = renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: true,
        }),
      { wrapper: createWrapper() },
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify transformation uses userName from ConversationMember
    const members = result.current.filteredMembers;
    expect(members).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "Leader User" }),
        expect.objectContaining({ name: "Member 1" }),
      ]),
    );
  });

  it("should respect enabled flag", async () => {
    vi.mocked(useAuthStore).mockReturnValue(mockCurrentUser);

    const deptHook = vi.fn().mockReturnValue({
      data: mockDeptMembers,
      isLoading: false,
      isError: false,
    });

    const convHook = vi.fn().mockReturnValue({
      data: mockConvMembers,
      isLoading: false,
      isError: false,
    });

    vi.mocked(useDepartmentMembers).mockImplementation(deptHook);
    vi.mocked(useConversationMembers).mockImplementation(convHook);

    renderHook(
      () =>
        useFilteredAssignees({
          conversationId: "conv-1",
          enabled: false,
        }),
      { wrapper: createWrapper() },
    );

    // Should pass enabled: false to both hooks
    expect(deptHook).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
    expect(convHook).toHaveBeenCalledWith(
      expect.objectContaining({ enabled: false }),
    );
  });
});
