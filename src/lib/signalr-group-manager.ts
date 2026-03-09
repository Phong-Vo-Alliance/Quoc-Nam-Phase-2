import { chatHub } from "@/lib/signalr";

class SignalRGroupManager {
  private joinedGroups = new Set<string>();

  async syncGroups(desiredGroups: Set<string>): Promise<void> {
    const toJoin = new Set<string>();
    const toLeave = new Set<string>();

    for (const id of desiredGroups) {
      if (!this.joinedGroups.has(id)) {
        toJoin.add(id);
      }
    }

    for (const id of this.joinedGroups) {
      if (!desiredGroups.has(id)) {
        toLeave.add(id);
      }
    }

    const joinPromises = Array.from(toJoin).map(async (id) => {
      try {
        await chatHub.joinGroup(id);
        this.joinedGroups.add(id);
      } catch (error) {
        console.error(`[GroupManager] Failed to join ${id}:`, error);
        throw error;
      }
    });

    const leavePromises = Array.from(toLeave).map(async (id) => {
      try {
        await chatHub.leaveGroup(id);
      } catch (error) {
        console.error(`[GroupManager] Failed to leave ${id}:`, error);
      } finally {
        this.joinedGroups.delete(id);
      }
    });

    await Promise.allSettled([...joinPromises, ...leavePromises]);
  }

  async leaveAll(): Promise<void> {
    const promises = Array.from(this.joinedGroups).map(async (id) => {
      try {
        await chatHub.leaveGroup(id);
      } catch (error) {
        console.error(`[GroupManager] Failed to leave ${id}:`, error);
      }
    });

    await Promise.allSettled(promises);
    this.joinedGroups.clear();
  }

  reset(): void {
    this.joinedGroups.clear();
  }

  async joinOne(conversationId: string): Promise<void> {
    if (this.joinedGroups.has(conversationId)) return;

    await chatHub.joinGroup(conversationId);
    this.joinedGroups.add(conversationId);
  }

  isJoined(id: string): boolean {
    return this.joinedGroups.has(id);
  }

  getJoinedGroups(): Set<string> {
    return new Set(this.joinedGroups);
  }
}

export const groupManager = new SignalRGroupManager();
