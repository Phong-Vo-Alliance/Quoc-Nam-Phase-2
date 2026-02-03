# Codebase Summary

**Project:** Quoc Nam Web Portal
**Type:** Internal Chat & Task Management System
**Stack:** React 19, TypeScript, Vite, TanStack Query, Zustand, SignalR
**Scale:** ~16,798 files, ~398 TS/TSX files
**Last Updated:** 2026-01-29

---

## Architecture Overview

Multi-layered React application with real-time messaging, task management, and team monitoring capabilities. Built with modern patterns: feature-based organization, optimistic UI updates, and offline resilience.

### Technology Stack

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 19.1.1, TypeScript 5.9.3, Vite (Rolldown) |
| **State Management** | Zustand 5.0.9 (w/ persistence), TanStack Query 5.90.12 |
| **Real-Time** | SignalR (@microsoft/signalr 10.0.0) |
| **UI Components** | Radix UI, Tailwind CSS 3.4.18, Framer Motion 12.23 |
| **Forms** | React Hook Form 7.69 + Zod 3.25.76 |
| **Routing** | React Router DOM 7.11 |
| **HTTP Client** | Axios 1.13.2 |
| **Testing** | Vitest 4.0.16, Playwright 1.57, Testing Library, MSW 2.12 |

---

## Project Structure

```
src/
├── api/                    # API clients (chat, task, file, identity)
├── assets/                 # Static assets (images, icons)
├── components/             # Shared UI components
│   ├── auth/              # Login, identifier, password inputs
│   ├── chat/              # Message display, status indicators
│   ├── files/             # File management (grid/list, preview, search)
│   ├── shared/            # Cross-cutting (offline banner, image preview)
│   ├── sheet/             # Slide-out panels (task assign, transfers)
│   └── ui/                # Shadcn-style primitives (button, dialog, etc.)
├── config/                # Configuration (env, API, security)
├── features/              # Feature modules
│   └── portal/           # Main portal feature (83+ components)
│       ├── components/   # Portal-specific UI
│       ├── workspace/    # Chat interface (conversation list, messages)
│       ├── lead/         # Team monitoring views
│       └── utils/        # Portal utilities
├── hooks/                 # Custom hooks
│   ├── queries/          # TanStack Query hooks
│   ├── mutations/        # TanStack Query mutations
│   └── __tests__/        # Hook tests
├── lib/                   # Shared libraries
│   ├── auth/             # JWT, token storage, validation
│   ├── hooks/            # Generic hooks
│   └── validation/       # Zod schemas
├── pages/                 # Page components (Login, Portal)
├── providers/             # React context providers (SignalR)
├── routes/                # Routing configuration
├── stores/                # Zustand stores (auth, conversation, UI)
├── styles/                # Global styles
├── test/                  # Test utilities, mocks (MSW)
├── types/                 # TypeScript type definitions
└── utils/                 # Utility functions
    ├── security/         # DevTools, content, context menu protection
    └── __tests__/        # Utility tests

tests/
├── e2e/                   # Playwright E2E tests
│   ├── fixtures/         # Test fixtures (auth, data)
│   ├── helpers/          # Test helpers (auth, wait)
│   ├── locators/         # Centralized selectors
│   └── specs/            # Test specs (auth, chat, message)
├── integration/           # Integration tests
└── unit/                  # Unit tests

docs/                      # Documentation
plans/                     # Implementation plans
```

---

## Core Features

### 1. Authentication & Authorization
- **JWT-based** authentication with token expiry detection
- **Role system**: Admin, Leader, Staff
- **Token storage**: localStorage with auto-expiry checking (1-min interval)
- **Session management**: Full cleanup on logout (prevents data leakage)
- **Validation**: Zod schemas with Vietnamese error messages

**Key Files:**
- [src/lib/auth/jwt.ts](src/lib/auth/jwt.ts)
- [src/lib/auth/tokenStorage.ts](src/lib/auth/tokenStorage.ts)
- [src/stores/authStore.ts](src/stores/authStore.ts)

### 2. Real-Time Messaging (SignalR)
- **Auto-reconnect** with exponential backoff [0, 2s, 5s, 10s, 30s]
- **Fallback transports**: WebSockets → SSE → LongPolling
- **Events**: MessageSent, UserTyping, MessageRead, MessageUpdated, etc.
- **Cache synchronization**: Direct query cache updates (no full refetches)
- **Unread tracking**: Smart unread count management

**Key Files:**
- [src/lib/signalr.ts](src/lib/signalr.ts)
- [src/providers/SignalRProvider.tsx](src/providers/SignalRProvider.tsx)
- [src/hooks/useConversationRealtime.ts](src/hooks/useConversationRealtime.ts)

### 3. Chat Interface
- **Conversation types**: Groups, DMs, categories
- **Message features**: Text, images, files, pinning, starring
- **Optimistic UI**: Instant feedback with temp message tracking
- **Retry logic**: Exponential backoff for failed sends (max 3 retries)
- **Offline queue**: Failed messages saved to localStorage
- **Cursor pagination**: Load older messages with `beforeMessageId`

**Key Files:**
- [src/features/portal/workspace/ChatMain.tsx](src/features/portal/workspace/ChatMain.tsx) (47KB)
- [src/features/portal/components/chat/ChatMainContainer.tsx](src/features/portal/components/chat/ChatMainContainer.tsx) (1503 lines)
- [src/hooks/mutations/useSendMessage.ts](src/hooks/mutations/useSendMessage.ts)

### 4. Task Management
- **Task statuses**: todo, doing, need_to_verified, finished
- **Checklists**: Template-based with variants per work type
- **Assignments**: Assign to users with priority levels
- **Task logs**: Thread-based conversation per task
- **Linked tasks**: Relate tasks to messages
- **Permissions**: Fine-grained access control

**Key Files:**
- [src/features/portal/components/CreateTaskModal.tsx](src/features/portal/components/CreateTaskModal.tsx)
- [src/features/portal/workspace/ConversationDetailPanel.tsx](src/features/portal/workspace/ConversationDetailPanel.tsx) (114KB - largest)
- [src/features/portal/types.ts](src/features/portal/types.ts)

### 5. File Management
- **Upload/Download**: Multi-file support with progress tracking
- **Preview**: Excel, Word, PDF, images (with watermark support)
- **Search & Filter**: By name, date, size
- **View modes**: Grid (1-4 cols responsive) and List
- **Extraction**: Auto-extract files from message history
- **Pagination**: Server-side pagination

**Key Files:**
- [src/components/files/ViewAllFilesModal.tsx](src/components/files/ViewAllFilesModal.tsx)
- [src/features/portal/components/FileManager.tsx](src/features/portal/components/FileManager.tsx) (49KB)
- [src/features/portal/components/file-sheet/](src/features/portal/components/file-sheet/)

### 6. Team Monitoring (Leader View)
- **Active threads**: Monitor ongoing conversations
- **Thread status**: Track thread states
- **Member summary**: Team activity statistics
- **View switching**: Toggle between leader/staff modes

**Key Files:**
- [src/features/portal/lead/TeamMonitorView.tsx](src/features/portal/lead/TeamMonitorView.tsx)
- [src/features/portal/lead/ThreadTable.tsx](src/features/portal/lead/ThreadTable.tsx)

### 7. Work Type System
- **Work categories**: Configurable job types
- **Checklist templates**: Template-based task workflows
- **Variants**: Work type variations with specific checklists
- **User assignment**: Group-based user management

**Key Files:**
- [src/features/portal/components/worktype-manager/](src/features/portal/components/worktype-manager/)

### 8. Client-Side Security
- **DevTools protection**: Block F12, Ctrl+Shift+I, Ctrl+U
- **Context menu protection**: Block right-click inspect
- **Content protection**: Prevent copy/select in file previews
- **Whitelist bypass**: Admin users with DEV MODE indicator
- **Configurable**: Enable/disable via environment variables

**Key Files:**
- [src/utils/security/detectDevTools.ts](src/utils/security/detectDevTools.ts)
- [src/hooks/useSecurity.ts](src/hooks/useSecurity.ts)
- [src/config/security.config.ts](src/config/security.config.ts)

---

## State Management Architecture

### Zustand Stores (Global State)

| Store | Purpose | Persisted | Key State |
|-------|---------|-----------|-----------|
| **authStore** | Authentication | ✅ localStorage | Token, user, expiry, isAuthenticated |
| **conversationStore** | Selected conversation | ✅ localStorage | selectedConversationId, selectedCategoryId |
| **uiStore** | UI/View state | ❌ Memory | View mode, panel states, modal visibility |
| **createTaskStore** | Task creation modal | ❌ Memory | Modal visibility, message context |
| **viewFilesStore** | File browsing | ❌ Memory | Search, sort, pagination state |

**Key Files:**
- [src/stores/authStore.ts](src/stores/authStore.ts)
- [src/stores/conversationStore.ts](src/stores/conversationStore.ts)
- [src/stores/uiStore.ts](src/stores/uiStore.ts)

### TanStack Query (Server State)

**Configuration:**
- `staleTime`: 30s (data considered fresh)
- `gcTime`: 5 min (cache garbage collection)
- `retry`: 2 attempts for queries, 1 for mutations
- `refetchOnMount`: true
- `refetchOnWindowFocus`: false

**Query Patterns:**
- Query key factories for consistency
- Cursor-based infinite queries for messages
- Direct cache updates from SignalR events
- Optimistic updates for mutations

**Key Files:**
- [src/lib/queryClient.ts](src/lib/queryClient.ts)
- [src/hooks/queries/](src/hooks/queries/)
- [src/hooks/mutations/](src/hooks/mutations/)

---

## API Integration

### Multiple API Clients

| Client | Purpose | Base URL | Timeout | Retries |
|--------|---------|----------|---------|---------|
| **client.ts** | Chat API (main) | Chat API URL | 30s | 3 |
| **taskClient.ts** | Task API | Task API URL | 30s | 3 |
| **fileApiClient.ts** | File API | File API URL | 60s | 2 |
| **identityClient.ts** | Identity/User API | Identity URL | 15s | 2 |

**Common Features:**
- Bearer token auth via request interceptors
- 401 auto-redirect to login
- Environment-based URLs (dev/prod)
- Axios error handling

**Key Files:**
- [src/api/client.ts](src/api/client.ts)
- [src/api/taskClient.ts](src/api/taskClient.ts)
- [src/api/fileApiClient.ts](src/api/fileApiClient.ts)

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Components/UI                             │
└────────┬────────────────────────────────────────────────────┘
         │
    ┌────┴─────────────────────────────────────────┐
    │                                                │
    ▼                                                ▼
┌──────────────┐                          ┌──────────────────┐
│ Zustand      │                          │ TanStack Query   │
│ Stores       │                          │ (React Query)    │
│              │                          │                  │
│ - authStore  │                          │ - useMessages    │
│ - convStore  │                          │ - useGroups      │
│ - uiStore    │                          │ - useTasks       │
└──────────────┘                          └────────┬─────────┘
    │                                              │
    └──────────────────────┬──────────────────────┘
                           │
                    ▼──────────────┐
                    │ API Clients  │
                    │              │
                    │ - apiClient  │
                    │ - taskClient │
                    │ - fileClient │
                    └──────┬───────┘
                           │
         ┌─────────────────┼─────────────────┐
         │                 │                  │
         ▼                 ▼                  ▼
      Backend          SignalR          File Service
      REST API         Real-Time        (Vega Files)
```

---

## Testing Infrastructure

### Unit Tests (Vitest)
- **Framework**: Vitest 4.0.16 with jsdom
- **Pattern**: Module co-location in `__tests__/` folders
- **Coverage**: Components, hooks, utilities
- **Mocking**: MSW for API, vi.mock for dependencies

**Test Files:**
- [tests/unit/](tests/unit/)
- [src/**/__tests__/](src/)

### Integration Tests (Vitest)
- **Scope**: Full user flows with multiple components
- **Examples**: Login flow, message send flow
- **Mocking**: MSW for HTTP, store state verification

**Test Files:**
- [tests/integration/](tests/integration/)

### E2E Tests (Playwright)
- **Browser**: Chromium (Firefox/Webkit disabled on Windows)
- **Timeout**: 30s per test
- **Parallel**: Enabled (1 worker on CI)
- **Fixtures**: Auto-login as user/admin
- **Helpers**: Wait utilities, locators, auth helpers
- **Coverage**: Auth, chat, message sending, real-time updates

**Test Files:**
- [tests/e2e/](tests/e2e/)
- [playwright.config.ts](playwright.config.ts)

### Test Utilities
- **MSW Handlers**: [src/test/mocks/handlers.ts](src/test/mocks/handlers.ts)
- **Test Utils**: [src/test/test-utils.tsx](src/test/test-utils.tsx)
- **E2E Fixtures**: [tests/e2e/fixtures/](tests/e2e/fixtures/)
- **E2E Helpers**: [tests/e2e/helpers/](tests/e2e/helpers/)

---

## Error Handling & Resilience

### Error Classification
- **Network errors**: Offline detection via `navigator.onLine`
- **Timeout errors**: Custom timeout via AbortController
- **Auth errors**: 401 → redirect to login
- **File errors**: 413 (too large), 415 (unsupported type)
- **Server errors**: 5xx → generic error message

**Key File:** [src/utils/errorHandling.ts](src/utils/errorHandling.ts)

### Retry Logic
- **Message sends**: Exponential backoff [1s, 2s, 4s], max 3 retries
- **File uploads**: [500ms, 1s, 2s], max 4 retries
- **Configurable**: Custom `shouldRetry` predicate
- **UI feedback**: Retry counter display

**Key File:** [src/utils/retryLogic.ts](src/utils/retryLogic.ts)

### Offline Support
- **Draft messages**: Saved per conversation to localStorage
- **Failed message queue**: Max 50 messages with retry tracking
- **Scroll positions**: Persisted with 24-hour expiration
- **Session clearance**: Full cleanup on logout

**Key File:** [src/utils/storage.ts](src/utils/storage.ts)

---

## Component Patterns

### 1. Feature-Based Organization
Components grouped by feature (auth, chat, files, portal) rather than by type.

### 2. Barrel Exports
Each directory has `index.ts` for clean imports:
```typescript
export { LoginForm } from './LoginForm';
export { IdentifierInput } from './IdentifierInput';
```

### 3. Shadcn-Style UI Primitives
Radix UI primitives wrapped with Tailwind CSS and CVA variants:
```typescript
<Button variant="destructive" size="sm">Delete</Button>
```

### 4. Store Integration
Components consume Zustand stores via hooks:
```typescript
const { user } = useAuthStore();
```

### 5. Query Hooks
Data fetching via custom TanStack Query hooks:
```typescript
const { data: messages } = useMessages(conversationId);
```

### 6. Type Safety
All props defined with TypeScript interfaces, Zod for runtime validation.

### 7. Accessibility
- `data-testid` attributes for testing
- ARIA labels and semantic HTML
- Keyboard navigation support

---

## Key Architectural Decisions

### ✅ Strengths

1. **Real-Time Sync**: Sophisticated cache update strategy avoids full refetches
2. **Error Resilience**: Retry logic with backoff, failed message queuing
3. **Optimistic UI**: Instant feedback with temp message tracking
4. **Separation of Concerns**: Clear division between state, queries, and real-time
5. **Type Safety**: Comprehensive TypeScript coverage
6. **Testing**: Multi-layer testing with unit/integration/E2E
7. **Offline Support**: Draft messages and failed message queue
8. **Security**: Client-side protections with whitelist bypass

### ⚠️ Considerations

1. **SignalR Event Fragility**: Code handles both wrapped/unwrapped structures
2. **Polling Connection State**: 1s interval polling inefficient
3. **Unread Count Logic**: Complex with multiple conditions
4. **Query Key Consistency**: Keys scattered across files
5. **Token Storage**: localStorage (not httpOnly) - client-side only
6. **Client-Side Security**: Casual user protection only

---

## Component Statistics

| Category | Count | Notes |
|----------|-------|-------|
| **Total TS/TSX Files** | ~398 | Excluding tests, node_modules |
| **Portal Components** | 83 | Feature-specific |
| **UI Primitives** | 20+ | Shadcn-style |
| **Test Files** | 134 | Unit + Integration + E2E + in-source |
| **Largest Component** | 114KB | ConversationDetailPanel.tsx |
| **Longest Component** | 1503 lines | ChatMainContainer.tsx |

---

## Environment Configuration

### Development
- **Dev Server**: Vite with HMR
- **API URLs**: Development endpoints
- **Features**: SignalR enabled, debug logs, React Query DevTools
- **Security**: Protections configurable via `.env.development`

### Production
- **Build**: `vite build --mode production`
- **API URLs**: Production endpoints
- **Features**: React Query DevTools disabled
- **Security**: Protections enabled by default

**Config File:** [src/config/env.config.ts](src/config/env.config.ts)

---

## NPM Scripts

```json
"dev": "vite --mode development",
"build": "vite build --mode production",
"build:dev": "vite build --mode development",
"preview": "vite preview",
"test": "vitest",
"test:run": "vitest run",
"test:unit": "vitest run 'tests/**/unit/**'",
"test:integration": "vitest run 'tests/**/integration/**'",
"test:e2e": "playwright test",
"test:e2e:ui": "playwright test --ui"
```

---

## Key Dependencies

### Production
- **React**: 19.1.1
- **TypeScript**: 5.9.3
- **React Router DOM**: 7.11.0
- **TanStack Query**: 5.90.12
- **Zustand**: 5.0.9
- **Axios**: 1.13.2
- **SignalR**: 10.0.0
- **React Hook Form**: 7.69.0
- **Zod**: 3.25.76
- **Radix UI**: Multiple packages
- **Tailwind CSS**: 3.4.18
- **Framer Motion**: 12.23.24

### Development
- **Vite**: Rolldown 7.1.14 (via override)
- **Vitest**: 4.0.16
- **Playwright**: 1.57.0
- **Testing Library**: React 16.3.1
- **MSW**: 2.12.4

---

## Entry Points

| Entry | File | Description |
|-------|------|-------------|
| **HTML** | [index.html](index.html) | Root HTML template |
| **Main** | [src/main.tsx](src/main.tsx) | React app bootstrap |
| **App** | [src/App.tsx](src/App.tsx) | App component with providers |
| **Router** | [src/routes/AppRouter.tsx](src/routes/AppRouter.tsx) | Route definitions |
| **Portal** | [src/features/portal/PortalWireframes.tsx](src/features/portal/PortalWireframes.tsx) | Main portal orchestrator (48KB) |

---

## Vietnamese Localization

All UI text predominantly in Vietnamese:
- Error messages
- Form validation
- Toast notifications
- Button labels
- Status indicators

---

## Documentation References

- **README**: [README.md](README.md) - Security features & setup
- **E2E Quick Start**: [tests/e2e/QUICK_START.md](tests/e2e/QUICK_START.md)
- **E2E Cheat Sheet**: [tests/e2e/CHEAT_SHEET.md](tests/e2e/CHEAT_SHEET.md)
- **Real-Time Architecture**: [src/features/portal/REALTIME_ARCHITECTURE.md](src/features/portal/REALTIME_ARCHITECTURE.md)
- **Test Specs**: [tests/e2e/test-specs/](tests/e2e/test-specs/)

---

## Related Documents

- [Project Overview PDR](project-overview-pdr.md)
- [Code Standards](code-standards.md)
- [System Architecture](system-architecture.md)
- [Design Guidelines](design-guidelines.md)
- [Deployment Guide](deployment-guide.md)

---

*Last updated: 2026-01-29 by Claude Code Agent*
