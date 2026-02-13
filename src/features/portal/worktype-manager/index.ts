/**
 * WorkType Manager Feature
 *
 * This module provides a complete feature for managing work types (conversations)
 * including their checklist templates, variants, and member management.
 *
 * @module worktype-manager
 */

// Main dialog component
export { WorkTypeManagerDialog } from "./WorkTypeManagerDialog";

// Hook for state management (eliminates props drilling)
export { useWorkTypeManager } from "./hooks/useWorkTypeManager";

// Re-export commonly used components for external use
export { WorkTypeEditor } from "./components/WorkTypeEditor";
export { WorkTypeCard } from "./components/WorkTypeCard";
export { GroupSelector } from "./components/GroupSelector";

// Types (if needed externally)
// export type { ... } from './types';
