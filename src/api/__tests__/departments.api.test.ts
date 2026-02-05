/**
 * Departments API Client Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDepartmentMembers } from "../departments.api";
import { identityApiClient } from "../identityClient";

vi.mock("../identityClient");

describe("getDepartmentMembers", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch department members successfully", async () => {
    const mockMembers = [
      {
        id: "member-1",
        userId: "user-1",
        userFullName: "John Doe",
        userEmail: "john@example.com",
        isLeader: false,
        joinedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "member-2",
        userId: "user-2",
        userFullName: "Jane Smith",
        userEmail: "jane@example.com",
        isLeader: true,
        joinedAt: "2024-01-02T00:00:00Z",
      },
    ];

    vi.mocked(identityApiClient.get).mockResolvedValue({
      data: mockMembers,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await getDepartmentMembers("dept-123");

    expect(identityApiClient.get).toHaveBeenCalledWith(
      "/api/v1/departments/dept-123/members",
      { params: {} }
    );
    expect(result).toEqual(mockMembers);
  });

  it("should filter by isLeader when provided", async () => {
    const mockLeaders = [
      {
        id: "member-2",
        userId: "user-2",
        userFullName: "Jane Smith",
        userEmail: "jane@example.com",
        isLeader: true,
        joinedAt: "2024-01-02T00:00:00Z",
      },
    ];

    vi.mocked(identityApiClient.get).mockResolvedValue({
      data: mockLeaders,
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await getDepartmentMembers("dept-123", true);

    expect(identityApiClient.get).toHaveBeenCalledWith(
      "/api/v1/departments/dept-123/members",
      { params: { isLeader: true } }
    );
    expect(result).toEqual(mockLeaders);
  });

  it("should handle API errors", async () => {
    const error = new Error("Network error");
    vi.mocked(identityApiClient.get).mockRejectedValue(error);

    await expect(getDepartmentMembers("dept-123")).rejects.toThrow("Network error");
  });

  it("should handle empty member list", async () => {
    vi.mocked(identityApiClient.get).mockResolvedValue({
      data: [],
      status: 200,
      statusText: "OK",
      headers: {},
      config: {} as any,
    });

    const result = await getDepartmentMembers("dept-123");

    expect(result).toEqual([]);
  });
});
