/**
 * Users API Client Tests (Department-based)
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { getUsers } from "../users.api";
import * as departmentsApi from "../departments.api";
import * as getCurrentUserUtil from "@/utils/getCurrentUser";
import * as storageUtil from "@/utils/storage";

vi.mock("../departments.api");
vi.mock("@/utils/getCurrentUser");
vi.mock("@/utils/storage");

describe("getUsers (department-based)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch users from department members successfully", async () => {
    const mockCurrentUser = {
      id: "user-1",
      identifier: "test@example.com",
      roles: ["leader"],
      departments: [
        {
          id: "dept-member-1",
          departmentId: "dept-123",
          departmentName: "Engineering",
          departmentCode: "ENG",
          isLeader: true,
          joinedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    const mockMembers = [
      {
        id: "member-1",
        userId: "user-2",
        userFullName: "John Doe",
        userEmail: "john@example.com",
        isLeader: false,
        joinedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: "member-2",
        userId: "user-3",
        userFullName: "Jane Smith",
        userEmail: "jane@example.com",
        isLeader: true,
        joinedAt: "2024-01-02T00:00:00Z",
      },
    ];

    vi.mocked(getCurrentUserUtil.getCurrentUser).mockResolvedValue(mockCurrentUser);
    vi.mocked(storageUtil.getSelectedCategory).mockReturnValue(null);
    vi.mocked(departmentsApi.getDepartmentMembers).mockResolvedValue(mockMembers);

    const result = await getUsers({ page: 1, pageSize: 50 });

    expect(getCurrentUserUtil.getCurrentUser).toHaveBeenCalled();
    expect(departmentsApi.getDepartmentMembers).toHaveBeenCalledWith("dept-123");
    expect(result.items).toHaveLength(2);
    expect(result.totalCount).toBe(2);
    
    const items = result.items!;
    expect(items[0].id).toBe("user-2");
    expect(items[0].firstName).toBe("John");
    expect(items[0].lastName).toBe("Doe");
  });

  it("should filter department by current category", async () => {
    const mockCurrentUser = {
      id: "user-1",
      identifier: "test@example.com",
      roles: ["leader"],
      departments: [
        {
          id: "dept-member-1",
          departmentId: "dept-123",
          departmentName: "Engineering",
          departmentCode: "ENG",
          isLeader: true,
          joinedAt: "2024-01-01T00:00:00Z",
        },
        {
          id: "dept-member-2",
          departmentId: "dept-456",
          departmentName: "Marketing",
          departmentCode: "MKT",
          isLeader: false,
          joinedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    const mockMembers = [
      {
        id: "member-1",
        userId: "user-2",
        userFullName: "Marketing User",
        userEmail: "marketing@example.com",
        isLeader: false,
        joinedAt: "2024-01-01T00:00:00Z",
      },
    ];

    vi.mocked(getCurrentUserUtil.getCurrentUser).mockResolvedValue(mockCurrentUser);
    vi.mocked(storageUtil.getSelectedCategory).mockReturnValue("MKT");
    vi.mocked(departmentsApi.getDepartmentMembers).mockResolvedValue(mockMembers);

    const result = await getUsers();

    expect(departmentsApi.getDepartmentMembers).toHaveBeenCalledWith("dept-456");
    expect(result.items).toHaveLength(1);
    
    const items = result.items!;
    expect(items[0].firstName).toBe("Marketing");
  });

  it("should handle pagination correctly", async () => {
    const mockCurrentUser = {
      id: "user-1",
      identifier: "test@example.com",
      roles: ["leader"],
      departments: [
        {
          id: "dept-member-1",
          departmentId: "dept-123",
          departmentName: "Engineering",
          departmentCode: "ENG",
          isLeader: true,
          joinedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    const mockMembers = Array.from({ length: 25 }, (_, i) => ({
      id: `member-${i}`,
      userId: `user-${i}`,
      userFullName: `User ${i}`,
      userEmail: `user${i}@example.com`,
      isLeader: false,
      joinedAt: "2024-01-01T00:00:00Z",
    }));

    vi.mocked(getCurrentUserUtil.getCurrentUser).mockResolvedValue(mockCurrentUser);
    vi.mocked(storageUtil.getSelectedCategory).mockReturnValue(null);
    vi.mocked(departmentsApi.getDepartmentMembers).mockResolvedValue(mockMembers);

    const result = await getUsers({ page: 2, pageSize: 10 });

    expect(result.items).toHaveLength(10);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(10);
    expect(result.totalCount).toBe(25);
    expect(result.totalPages).toBe(3);
    
    const items = result.items!;
    expect(items[0].id).toBe("user-10");
  });

  it("should return empty result when user has no departments", async () => {
    const mockCurrentUser = {
      id: "user-1",
      identifier: "test@example.com",
      roles: ["leader"],
      departments: [],
    };

    vi.mocked(getCurrentUserUtil.getCurrentUser).mockResolvedValue(mockCurrentUser);

    const result = await getUsers();

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
    expect(departmentsApi.getDepartmentMembers).not.toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    vi.mocked(getCurrentUserUtil.getCurrentUser).mockRejectedValue(
      new Error("Auth error")
    );

    const result = await getUsers();

    expect(result.items).toEqual([]);
    expect(result.totalCount).toBe(0);
  });

  it("should parse full names correctly", async () => {
    const mockCurrentUser = {
      id: "user-1",
      identifier: "test@example.com",
      roles: ["leader"],
      departments: [
        {
          id: "dept-member-1",
          departmentId: "dept-123",
          departmentName: "Engineering",
          departmentCode: "ENG",
          isLeader: true,
          joinedAt: "2024-01-01T00:00:00Z",
        },
      ],
    };

    const mockMembers = [
      {
        id: "member-1",
        userId: "user-2",
        userFullName: "John William Doe Smith",
        userEmail: "john@example.com",
        isLeader: false,
        joinedAt: "2024-01-01T00:00:00Z",
      },
    ];

    vi.mocked(getCurrentUserUtil.getCurrentUser).mockResolvedValue(mockCurrentUser);
    vi.mocked(storageUtil.getSelectedCategory).mockReturnValue(null);
    vi.mocked(departmentsApi.getDepartmentMembers).mockResolvedValue(mockMembers);

    const result = await getUsers();

    const items = result.items!;
    expect(items[0].firstName).toBe("John");
    expect(items[0].lastName).toBe("William Doe Smith");
  });
});
