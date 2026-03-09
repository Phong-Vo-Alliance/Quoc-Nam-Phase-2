import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("@/lib/signalr", () => ({
  chatHub: {
    joinGroup: vi.fn(() => Promise.resolve()),
    leaveGroup: vi.fn(() => Promise.resolve()),
  },
}));

import { groupManager } from "@/lib/signalr-group-manager";
import { chatHub } from "@/lib/signalr";

describe("signalr-group-manager", () => {
  beforeEach(() => {
    groupManager.reset();
    vi.clearAllMocks();
  });

  // ────────────────────────────────────────────────────────
  // §3.1 syncGroups
  // ────────────────────────────────────────────────────────

  describe("syncGroups", () => {
    it("joins all groups from empty state", async () => {
      await groupManager.syncGroups(new Set(["a", "b", "c"]));

      expect(chatHub.joinGroup).toHaveBeenCalledTimes(3);
      expect(groupManager.isJoined("a")).toBe(true);
      expect(groupManager.isJoined("b")).toBe(true);
      expect(groupManager.isJoined("c")).toBe(true);
    });

    it("only joins new groups", async () => {
      await groupManager.syncGroups(new Set(["a", "b"]));
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["a", "b", "c"]));

      expect(chatHub.joinGroup).toHaveBeenCalledTimes(1);
      expect(chatHub.joinGroup).toHaveBeenCalledWith("c");
    });

    it("leaves removed groups", async () => {
      await groupManager.syncGroups(new Set(["a", "b", "c"]));
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["a"]));

      expect(chatHub.leaveGroup).toHaveBeenCalledTimes(2);
      expect(groupManager.isJoined("b")).toBe(false);
      expect(groupManager.isJoined("c")).toBe(false);
    });

    it("handles mixed join and leave", async () => {
      await groupManager.syncGroups(new Set(["a", "b"]));
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["b", "c"]));

      expect(chatHub.leaveGroup).toHaveBeenCalledWith("a");
      expect(chatHub.joinGroup).toHaveBeenCalledWith("c");
    });

    it("makes no calls when set is unchanged", async () => {
      await groupManager.syncGroups(new Set(["a", "b"]));
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["a", "b"]));

      expect(chatHub.joinGroup).not.toHaveBeenCalled();
      expect(chatHub.leaveGroup).not.toHaveBeenCalled();
    });

    it("does not add failed group to joinedGroups", async () => {
      vi.mocked(chatHub.joinGroup).mockImplementation((id: string) => {
        if (id === "c") return Promise.reject(new Error("fail"));
        return Promise.resolve();
      });

      await groupManager.syncGroups(new Set(["a", "c"]));

      expect(groupManager.isJoined("a")).toBe(true);
      expect(groupManager.isJoined("c")).toBe(false);
    });

    it("leaves all groups when desired set is empty", async () => {
      await groupManager.syncGroups(new Set(["a", "b"]));
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set());

      expect(chatHub.leaveGroup).toHaveBeenCalledTimes(2);
      expect(groupManager.getJoinedGroups().size).toBe(0);
    });
  });

  // ────────────────────────────────────────────────────────
  // §3.2 leaveAll
  // ────────────────────────────────────────────────────────

  describe("leaveAll", () => {
    it("leaves all joined groups", async () => {
      vi.mocked(chatHub.joinGroup).mockResolvedValue(undefined);
      await groupManager.syncGroups(
        new Set(["a", "b", "c", "d", "e"]),
      );
      vi.clearAllMocks();

      await groupManager.leaveAll();

      expect(chatHub.leaveGroup).toHaveBeenCalledTimes(5);
      expect(groupManager.getJoinedGroups().size).toBe(0);
    });

    it("clears set even when some leaveGroup calls fail", async () => {
      await groupManager.syncGroups(new Set(["a", "b"]));
      vi.mocked(chatHub.leaveGroup).mockRejectedValueOnce(
        new Error("fail"),
      );

      await groupManager.leaveAll();

      expect(groupManager.getJoinedGroups().size).toBe(0);
    });

    it("handles empty set without crashing", async () => {
      await expect(groupManager.leaveAll()).resolves.not.toThrow();
      expect(chatHub.leaveGroup).not.toHaveBeenCalled();
    });
  });

  // ────────────────────────────────────────────────────────
  // §3.3 reset
  // ────────────────────────────────────────────────────────

  describe("reset", () => {
    it("clears client tracking without leaveGroup calls", async () => {
      await groupManager.syncGroups(
        new Set(Array.from({ length: 10 }, (_, i) => `g-${i}`)),
      );
      vi.clearAllMocks();

      groupManager.reset();

      expect(chatHub.leaveGroup).not.toHaveBeenCalled();
      expect(groupManager.getJoinedGroups().size).toBe(0);
    });

    it("re-joins all after reset", async () => {
      await groupManager.syncGroups(new Set(["a", "b", "c"]));
      groupManager.reset();
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["a", "b", "c"]));

      expect(chatHub.joinGroup).toHaveBeenCalledTimes(3);
    });

    it("is idempotent", () => {
      groupManager.reset();
      expect(() => groupManager.reset()).not.toThrow();
    });
  });

  // ────────────────────────────────────────────────────────
  // §3.4 joinOne
  // ────────────────────────────────────────────────────────

  describe("joinOne", () => {
    it("joins single new conversation", async () => {
      await groupManager.joinOne("new-conv");

      expect(chatHub.joinGroup).toHaveBeenCalledWith("new-conv");
      expect(groupManager.isJoined("new-conv")).toBe(true);
    });

    it("does not call joinGroup if already joined", async () => {
      await groupManager.joinOne("x");
      vi.clearAllMocks();

      await groupManager.joinOne("x");

      expect(chatHub.joinGroup).not.toHaveBeenCalled();
    });

    it("does not add to joinedGroups on failure", async () => {
      vi.mocked(chatHub.joinGroup).mockRejectedValueOnce(
        new Error("fail"),
      );

      await expect(groupManager.joinOne("fail-conv")).rejects.toThrow();
      expect(groupManager.isJoined("fail-conv")).toBe(false);
    });

    it("skips already joined group in subsequent syncGroups", async () => {
      await groupManager.joinOne("x");
      vi.clearAllMocks();

      await groupManager.syncGroups(new Set(["x", "y"]));

      expect(chatHub.joinGroup).toHaveBeenCalledTimes(1);
      expect(chatHub.joinGroup).toHaveBeenCalledWith("y");
    });
  });

  // ────────────────────────────────────────────────────────
  // §3.5 Reconnection
  // ────────────────────────────────────────────────────────

  describe("reconnection", () => {
    it("re-joins all groups after reset + syncGroups", async () => {
      await groupManager.syncGroups(
        new Set(Array.from({ length: 10 }, (_, i) => `g-${i}`)),
      );

      groupManager.reset();
      vi.clearAllMocks();

      await groupManager.syncGroups(
        new Set(Array.from({ length: 10 }, (_, i) => `g-${i}`)),
      );

      expect(chatHub.joinGroup).toHaveBeenCalledTimes(10);
    });
  });
});
