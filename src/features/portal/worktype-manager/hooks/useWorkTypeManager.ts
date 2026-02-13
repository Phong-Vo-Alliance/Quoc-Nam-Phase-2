import { useState } from "react";

/**
 * Custom hook to manage WorkTypeManager dialog state.
 *
 * This hook encapsulates the state management for WorkTypeManagerDialog,
 * eliminating the need for props drilling through multiple components.
 *
 * @example
 * ```tsx
 * const workTypeManager = useWorkTypeManager();
 *
 * // Open dialog
 * <button onClick={workTypeManager.open}>Quản lý loại việc</button>
 *
 * // Use with dialog
 * <WorkTypeManagerDialog
 *   open={workTypeManager.isOpen}
 *   onOpenChange={workTypeManager.close}
 * />
 * ```
 */
export function useWorkTypeManager() {
  const [isOpen, setIsOpen] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);
  const toggle = () => setIsOpen((prev) => !prev);

  return {
    isOpen,
    open,
    close,
    toggle,
    setIsOpen,
  };
}
