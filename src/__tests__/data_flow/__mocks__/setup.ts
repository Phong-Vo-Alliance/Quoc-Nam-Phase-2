import { vi } from "vitest";

// Layer 2: SignalR Hub Mocks
vi.mock("@/lib/signalr", () => ({
  chatHub: {
    onWithCleanup: vi.fn(() => vi.fn()),
    on: vi.fn(),
    off: vi.fn(),
    joinGroup: vi.fn(() => Promise.resolve()),
    leaveGroup: vi.fn(() => Promise.resolve()),
    sendTyping: vi.fn(),
    isConnected: vi.fn(() => true),
  },
  taskHub: {
    on: vi.fn(),
    off: vi.fn(),
    isConnected: vi.fn(() => true),
  },
  SIGNALR_EVENTS: {
    MESSAGE_SENT: "MessageSent",
    MESSAGE_READ: "MessageRead",
    CONVERSATION_CREATED: "ConversationCreated",
    CONVERSATION_UPDATED: "ConversationUpdated",
    MEMBER_ADDED: "MemberAdded",
    CATEGORY_DEPARTMENT_LINKED: "CategoryDepartmentLinked",
    USER_TYPING: "UserTyping",
    USER_STOPPED_TYPING: "UserStoppedTyping",
  },
}));

// Layer 3: Zustand Store Mocks
vi.mock("@/stores/authStore", () => ({
  useAuthStore: {
    getState: vi.fn(() => ({
      user: { id: "user-1" },
      setUser: vi.fn(),
    })),
  },
}));

vi.mock("@/stores/conversationStore", () => ({
  useConversationStore: {
    getState: vi.fn(() => ({
      selectedConversation: { id: "conv-1" },
    })),
  },
}));

vi.mock("@/stores/uiStore", () => ({
  useUIStore: {
    getState: vi.fn(() => ({
      openThreadMessageId: null,
    })),
  },
}));

vi.mock("@/stores/clientSystemMessagesStore", () => ({
  useClientSystemMessagesStore: {
    getState: vi.fn(() => ({
      addMessage: vi.fn(),
    })),
  },
}));

// Layer 4: API Call Mocks
vi.mock("@/api/conversations.api", () => ({
  getConversationMembers: vi.fn(() =>
    Promise.resolve([
      {
        userId: "user-2",
        userName: "member",
        role: "Member",
        joinedAt: "2026-01-01T00:00:00Z",
        isMuted: false,
        userInfo: {
          id: "user-2",
          userName: "member",
          fullName: "Member Name",
          identifier: "member",
          roles: "User",
          avatarUrl: null,
        },
      },
    ]),
  ),
}));

vi.mock("@/utils/getCurrentUser", () => ({
  getCurrentUser: vi.fn(() =>
    Promise.resolve({
      departments: [{ departmentId: "dept-1", departmentName: "Test Dept" }],
    }),
  ),
}));

// Layer 5: UI Side-Effect Mocks
vi.mock("sonner", () => ({
  toast: {
    info: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/signalr-group-manager", () => ({
  groupManager: {
    joinOne: vi.fn(() => Promise.resolve()),
    syncGroups: vi.fn(() => Promise.resolve()),
    reset: vi.fn(),
    leaveAll: vi.fn(() => Promise.resolve()),
    isJoined: vi.fn(() => false),
  },
}));
