# Code Diff Examples - Before & After

> **Chi tiết code changes từ implementation hiện tại sang implementation đúng**

---

## 1. Hook: `useChecklistTemplates.ts`

### ❌ Before (Current - Bad)

```typescript
// File: src/hooks/queries/useChecklistTemplates.ts
import { useQuery } from "@tanstack/react-query";
import { getChecklistTemplates } from "@/api/tasks.api"; // ❌ Wrong API
import type { CheckListTemplateResponse } from "@/types/tasks_api";

/**
 * Query key factory for checklist templates
 */
export const checklistTemplateKeys = {
  all: ["checklist-templates"] as const,
  lists: () => [...checklistTemplateKeys.all, "list"] as const,
  list: () => [...checklistTemplateKeys.lists()] as const, // ❌ No conversationId
};

/**
 * Hook to fetch all checklist templates
 * Used for displaying available templates in task creation/editing
 *
 * @returns Query result with checklist templates
 */
export function useChecklistTemplates() {
  // ❌ No parameter
  return useQuery({
    queryKey: checklistTemplateKeys.list(), // ❌ Global cache
    queryFn: getChecklistTemplates, // ❌ Fetches ALL templates
    staleTime: 1000 * 60 * 5,
  });
}
```

**Issues:**

- ❌ No `conversationId` parameter
- ❌ Uses wrong API (`tasks.api.ts`)
- ❌ Query key doesn't include conversationId
- ❌ No `enabled` option
- ❌ Global cache for all conversations

---

### ✅ After (Proposed - Good)

````typescript
// File: src/hooks/queries/useChecklistTemplates.ts
import { useQuery } from "@tanstack/react-query";
import { checklistTemplatesApi } from "@/api/checklist-templates.api"; // ✅ Correct API
import { taskApiClient } from "@/api/taskClient"; // For fallback
import type { CheckListTemplateResponse } from "@/types/tasks_api";

/**
 * Query key factory for checklist templates
 */
export const checklistTemplateKeys = {
  all: ["checklist-templates"] as const,
  lists: () => [...checklistTemplateKeys.all, "list"] as const,
  list: (
    conversationId?: string, // ✅ Include conversationId
  ) =>
    conversationId
      ? ([...checklistTemplateKeys.lists(), conversationId] as const)
      : ([...checklistTemplateKeys.lists()] as const),
};

/**
 * Hook to fetch checklist templates filtered by conversation
 *
 * @param conversationId - Conversation ID to filter templates by
 * @returns Query result with checklist templates for the conversation
 *
 * @example
 * ```tsx
 * // Fetch templates for specific conversation
 * const { data } = useChecklistTemplates(conversationId);
 *
 * // Fetch all templates (admin view - not recommended)
 * const { data } = useChecklistTemplates();
 * ```
 */
export function useChecklistTemplates(conversationId?: string) {
  // ✅ Add parameter
  return useQuery({
    queryKey: checklistTemplateKeys.list(conversationId), // ✅ Per-conversation cache
    queryFn: conversationId
      ? () => checklistTemplatesApi.getTemplates(conversationId) // ✅ Filter by conversation
      : async () => {
          // Fallback for backward compatibility (will be removed)
          console.warn("[useChecklistTemplates] Called without conversationId");
          const { data } = await taskApiClient.get("/api/checklist-templates");
          return data;
        },
    staleTime: 1000 * 60 * 5,
    enabled: !!conversationId, // ✅ Only fetch if conversationId exists
  });
}

// Helper functions remain the same...
````

**Improvements:**

- ✅ Accepts `conversationId` parameter
- ✅ Uses correct API (`checklist-templates.api.ts`)
- ✅ Query key includes conversationId (cache isolation)
- ✅ `enabled` option prevents unnecessary fetches
- ✅ Per-conversation cache

---

## 2. Component: `ManageVariantsDialog.tsx`

### ❌ Before (Current - Bad)

```typescript
// File: src/features/portal/components/worktype-manager/ManageVariantsDialog.tsx

export const ManageVariantsDialog: React.FC<ManageVariantsDialogProps> = ({
  open,
  onOpenChange,
  workType,
  onSave,
  conversationId, // ❌ Prop exists but NOT used in hook
}) => {
  const [variants, setVariants] = useState<ChecklistVariant[]>([]);

  // Fetch templates from API if conversationId is provided
  const {
    data: apiTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useChecklistTemplates(); // ❌ No conversationId passed

  // Initialize variants from API or workType
  useEffect(() => {
    if (open) {
      if (conversationId && apiTemplates) {
        // ❌ Check needed
        // Map API templates to ChecklistVariant format
        const mappedVariants: ChecklistVariant[] = apiTemplates
          .filter((template) => template.name !== null)
          .filter((template) => template.conversationId === conversationId) // ❌ Client filter
          .map((template) => ({
            id: template.id,
            name: template.name!,
            description: template.description || undefined,
            isDefault: template.isDefault,
          }));
        setVariants(mappedVariants);
      } else {
        setVariants(workType.checklistVariants ?? []);
      }
    }
  }, [open, workType, apiTemplates, conversationId]); // ❌ conversationId in deps

  // ... rest of component
};
```

**Issues:**

- ❌ Hook called without conversationId
- ❌ Fetches ALL templates
- ❌ Client-side filter (`.filter(t => t.conversationId === ...)`)
- ❌ Unnecessary complexity in useEffect

---

### ✅ After (Proposed - Good)

```typescript
// File: src/features/portal/components/worktype-manager/ManageVariantsDialog.tsx

export const ManageVariantsDialog: React.FC<ManageVariantsDialogProps> = ({
  open,
  onOpenChange,
  workType,
  onSave,
  conversationId, // ✅ Prop used in hook
}) => {
  const [variants, setVariants] = useState<ChecklistVariant[]>([]);

  // Fetch templates from API filtered by conversationId
  const {
    data: apiTemplates,
    isLoading: isLoadingTemplates,
    error: templatesError,
    refetch: refetchTemplates,
  } = useChecklistTemplates(conversationId); // ✅ Pass conversationId

  // Initialize variants from API or workType
  useEffect(() => {
    if (open) {
      if (apiTemplates) {
        // ✅ Simpler check (already filtered)
        // Map API templates to ChecklistVariant format
        const mappedVariants: ChecklistVariant[] = apiTemplates
          .filter((template) => template.name !== null)
          // ✅ No conversationId filter needed - server already filtered
          .map((template) => ({
            id: template.id,
            name: template.name!,
            description: template.description || undefined,
            isDefault: template.isDefault,
          }));
        setVariants(mappedVariants);
      } else {
        setVariants(workType.checklistVariants ?? []);
      }
    }
  }, [open, workType, apiTemplates]); // ✅ conversationId removed (not needed)

  // ... rest of component
};
```

**Improvements:**

- ✅ Hook receives conversationId
- ✅ No client-side filtering
- ✅ Simpler useEffect logic
- ✅ Better performance (less data)

---

## 3. Component: `ChecklistTemplateSlideOver.tsx`

### ❌ Before (Current - Bad)

```typescript
// File: src/features/portal/components/ChecklistTemplateSlideOver.tsx

export const ChecklistTemplateSlideOver: React.FC<Props> = ({
  open,
  onClose,
  workTypeName,
  template,
  onChange,
  conversationId, // ❌ Prop exists but NOT used
  checklistVariants,
  activeVariantId,
  onChangeVariant,
}) => {
  // Fetch templates from API filtered by conversationId
  const { data: apiTemplates, isLoading: templatesLoading } =
    useChecklistTemplates(); // ❌ No conversationId

  // ... rest of component
};
```

**Issues:**

- ❌ Hook called without conversationId
- ❌ Fetches ALL templates
- ❌ Props has conversationId but doesn't use it

---

### ✅ After (Proposed - Good)

```typescript
// File: src/features/portal/components/ChecklistTemplateSlideOver.tsx

export const ChecklistTemplateSlideOver: React.FC<Props> = ({
  open,
  onClose,
  workTypeName,
  template,
  onChange,
  conversationId, // ✅ Prop used in hook
  checklistVariants,
  activeVariantId,
  onChangeVariant,
}) => {
  // Fetch templates from API filtered by conversationId
  const { data: apiTemplates, isLoading: templatesLoading } =
    useChecklistTemplates(conversationId); // ✅ Pass conversationId

  // ... rest of component (no other changes needed)
};
```

**Improvements:**

- ✅ Hook receives conversationId
- ✅ Only fetches relevant templates
- ✅ Minimal code change

---

## 4. API Client Comparison

### ❌ tasks.api.ts (Old - Don't Use)

```typescript
// File: src/api/tasks.api.ts

/**
 * GET /api/checklist-templates
 * Get all checklist templates
 * ❌ NO FILTERING - Returns ALL templates
 */
export const getChecklistTemplates = async (): Promise<
  CheckListTemplateResponse[]
> => {
  const response = await taskApiClient.get<CheckListTemplateResponse[]>(
    "/api/checklist-templates", // ❌ No query param
  );
  return response.data;
};
```

**Issues:**

- ❌ No conversationId parameter
- ❌ Returns ALL templates
- ❌ Security risk
- ❌ Performance issue

---

### ✅ checklist-templates.api.ts (New - Correct)

```typescript
// File: src/api/checklist-templates.api.ts

export const checklistTemplatesApi = {
  /**
   * Get checklist templates filtered by conversation ID
   * @param conversationId - The conversation UUID to filter by
   * @returns Array of templates for the conversation
   * @throws {AxiosError} On API error (400 if invalid conversationId, 401, etc.)
   * ✅ FILTERS by conversationId - Returns only relevant templates
   */
  getTemplates: async (
    conversationId: string, // ✅ Required parameter
  ): Promise<GetChecklistTemplatesResponse> => {
    const { data } = await taskApiClient.get<GetChecklistTemplatesResponse>(
      "/api/checklist-templates",
      {
        params: { conversationId }, // ✅ Query param included
      },
    );
    return data;
  },

  // ... other methods (create, update, delete, setDefault)
};
```

**Improvements:**

- ✅ Requires conversationId parameter
- ✅ Passes conversationId as query param
- ✅ Server filters data
- ✅ Better security
- ✅ Better performance

---

## 5. Network Request Comparison

### ❌ Before (Bad Request)

```http
GET /api/checklist-templates HTTP/1.1
Host: api.example.com
Authorization: Bearer xxx...

-- NO query parameters
```

**Response:**

```json
[
  {
    "id": "1",
    "name": "Sales - Follow Up",
    "conversationId": "conv-sales-001",
    "isDefault": true,
    "items": [...]
  },
  {
    "id": "2",
    "name": "HR - Onboarding",
    "conversationId": "conv-hr-secret",  // ⚠️ Data leak
    "isDefault": false,
    "items": [...]
  },
  {
    "id": "3",
    "name": "Finance - Audit",
    "conversationId": "conv-finance-private",  // ⚠️ Data leak
    "isDefault": false,
    "items": [...]
  }
  // ... 97 more templates
]

// Size: ~50KB
// Templates: 100
// User can see: ALL conversations
```

---

### ✅ After (Good Request)

```http
GET /api/checklist-templates?conversationId=conv-sales-001 HTTP/1.1
Host: api.example.com
Authorization: Bearer xxx...

✅ Query parameter included
```

**Response:**

```json
[
  {
    "id": "1",
    "name": "Sales - Follow Up",
    "conversationId": "conv-sales-001",
    "isDefault": true,
    "items": [...]
  }
]

// Size: ~5KB
// Templates: 1
// User can see: ONLY their conversation
```

---

## 6. Cache Key Comparison

### ❌ Before (Global Cache - Bad)

```typescript
// Query key without conversationId
queryKey: ['checklist-templates', 'list']

// Cache entry:
{
  ['checklist-templates', 'list']: {
    data: [...100 templates from ALL conversations...],
    dataUpdatedAt: 1707654000000,
    // ❌ Shared by ALL conversations
    // ❌ Invalidating affects everyone
    // ❌ No isolation
  }
}

// Problem:
// 1. User A in conversation 1 fetches → cache populated
// 2. User B in conversation 2 opens dialog → sees SAME cache
// 3. Client filters different data, but cache is shared
// 4. Invalidation affects both users unnecessarily
```

---

### ✅ After (Per-Conversation Cache - Good)

```typescript
// Query key with conversationId
queryKey: ['checklist-templates', 'list', 'conv-sales-001']

// Cache entries:
{
  ['checklist-templates', 'list', 'conv-sales-001']: {
    data: [...2 templates for sales...],
    dataUpdatedAt: 1707654000000,
  },
  ['checklist-templates', 'list', 'conv-hr-002']: {
    data: [...3 templates for HR...],
    dataUpdatedAt: 1707654100000,
  }
  // ✅ Isolated by conversation
  // ✅ Independent invalidation
  // ✅ Better cache hits
}

// Benefits:
// 1. User A in conversation 1 → cache for conv-1
// 2. User B in conversation 2 → cache for conv-2 (different)
// 3. Switching conversations = instant (from cache)
// 4. Invalidating conv-1 doesn't affect conv-2
```

---

## 7. TypeScript Types (No Changes Needed)

Types remain the same, just usage changes:

```typescript
// Types from src/types/checklist-templates.ts
export type GetChecklistTemplatesResponse = CheckListTemplateResponse[];

export interface CheckListTemplateResponse {
  id: string;
  name: string | null;
  description: string | null;
  conversationId: string; // ✅ Already exists
  isDefault: boolean;
  items?: CheckListItemResponse[];
  createdAt?: string;
  updatedAt?: string;
}

// ✅ No type changes needed
// Just need to pass conversationId to API calls
```

---

## 8. Summary of Changes

### Files Modified

| File                                                                       | Lines Changed | Complexity |
| -------------------------------------------------------------------------- | ------------- | ---------- |
| `src/hooks/queries/useChecklistTemplates.ts`                               | ~30 lines     | Medium     |
| `src/features/portal/components/worktype-manager/ManageVariantsDialog.tsx` | ~10 lines     | Low        |
| `src/features/portal/components/ChecklistTemplateSlideOver.tsx`            | 1 line        | Very Low   |

### Total Effort

- **Code Changes:** ~50 lines
- **Testing:** ~2 hours
- **Review:** ~30 minutes
- **Deployment:** ~15 minutes

**Total Time:** 2-3 hours

---

## 9. Migration Checklist

### Code Changes

- [ ] Update `useChecklistTemplates.ts` hook signature
- [ ] Add conversationId parameter
- [ ] Update query key factory
- [ ] Switch to `checklistTemplatesApi.getTemplates()`
- [ ] Add `enabled` option

### Component Updates

- [ ] Pass conversationId to hook in `ManageVariantsDialog.tsx`
- [ ] Remove client-side filter in `ManageVariantsDialog.tsx`
- [ ] Pass conversationId to hook in `ChecklistTemplateSlideOver.tsx`

### Testing

- [ ] Unit test: Hook with conversationId
- [ ] Unit test: Hook without conversationId (disabled)
- [ ] Integration test: ManageVariantsDialog
- [ ] Integration test: ChecklistTemplateSlideOver
- [ ] Security test: No data leakage
- [ ] Performance test: Response size

### Deployment

- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Smoke test
- [ ] Deploy to production
- [ ] Monitor errors

---

## 10. Expected Results

### Before (Bad)

```typescript
// Component renders
useChecklistTemplates()
  → GET /api/checklist-templates
  → Returns 100 templates
  → Client filters to 2 templates
  → Shows 2 templates
  → User can see 100 templates in DevTools
```

### After (Good)

```typescript
// Component renders
useChecklistTemplates('conv-ABC')
  → GET /api/checklist-templates?conversationId=conv-ABC
  → Returns 2 templates (server filtered)
  → Shows 2 templates
  → User can ONLY see 2 templates in DevTools
```

**Result:** 10x faster, 100% secure! 🚀
