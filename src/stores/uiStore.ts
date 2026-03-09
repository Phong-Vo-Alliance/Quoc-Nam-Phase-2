import { create } from 'zustand';

export type ViewMode = 'lead' | 'staff';
export type CurrentView = 'workspace' | 'lead';
export type RightPanelTab = 'info' | 'task' | 'file';

interface UIState {
  // View states
  viewMode: ViewMode;
  currentView: CurrentView;
  showRightPanel: boolean;
  rightPanelTab: RightPanelTab;

  // Selected items
  selectedGroupId: string | null;
  selectedWorkTypeId: string | null;
  selectedMessageId: string | null;
  selectedTaskId: string | null;

  // Mobile states
  isMobileView: boolean;
  mobileMenuOpen: boolean;

  // Thread panel state (used by signalr-event-dispatcher outside React)
  openThreadMessageId: string | null;
  setOpenThreadMessageId: (id: string | null) => void;

  // Modal states
  activeModal: string | null;

  // Actions - View
  setViewMode: (mode: ViewMode) => void;
  setCurrentView: (view: CurrentView) => void;
  toggleRightPanel: () => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setShowRightPanel: (show: boolean) => void;

  // Actions - Selection
  setSelectedGroup: (id: string | null) => void;
  setSelectedWorkType: (id: string | null) => void;
  setSelectedMessage: (id: string | null) => void;
  setSelectedTask: (id: string | null) => void;

  // Actions - Mobile
  setIsMobileView: (isMobile: boolean) => void;
  toggleMobileMenu: () => void;
  setMobileMenuOpen: (open: boolean) => void;

  // Actions - Modal
  openModal: (modalId: string) => void;
  closeModal: () => void;

  // Reset
  resetUI: () => void;
}

const initialState = {
  viewMode: 'staff' as ViewMode, // Safe default; computed lazily via initializeViewMode()
  currentView: 'workspace' as CurrentView,
  showRightPanel: true,
  rightPanelTab: 'info' as RightPanelTab,
  selectedGroupId: null,
  selectedWorkTypeId: null,
  selectedMessageId: null,
  selectedTaskId: null,
  isMobileView: false,
  mobileMenuOpen: false,
  openThreadMessageId: null,
  activeModal: null,
};

export const useUIStore = create<UIState>()((set) => ({
  ...initialState,

  // View actions
  setViewMode: (mode) => set({ viewMode: mode }),

  setCurrentView: (view) => set({ currentView: view }),

  toggleRightPanel: () =>
    set((state) => ({ showRightPanel: !state.showRightPanel })),

  setRightPanelTab: (tab) => set({ rightPanelTab: tab }),

  setShowRightPanel: (show) => set({ showRightPanel: show }),

  // Selection actions
  setSelectedGroup: (id) => set({ selectedGroupId: id }),

  setSelectedWorkType: (id) => set({ selectedWorkTypeId: id }),

  setSelectedMessage: (id) => set({ selectedMessageId: id }),

  setSelectedTask: (id) => set({ selectedTaskId: id }),

  // Mobile actions
  setIsMobileView: (isMobile) => set({ isMobileView: isMobile }),

  toggleMobileMenu: () =>
    set((state) => ({ mobileMenuOpen: !state.mobileMenuOpen })),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),

  // Modal actions
  openModal: (modalId) => set({ activeModal: modalId }),

  closeModal: () => set({ activeModal: null }),

  // Thread panel
  setOpenThreadMessageId: (id) => set({ openThreadMessageId: id }),

  // Reset
  resetUI: () => set(initialState),
}));

/**
 * Initialize viewMode from user roles.
 * Must be called AFTER all stores are created (e.g., in App component mount)
 * to avoid circular dependency: uiStore -> roleUtils -> authStore -> signalr-event-dispatcher -> uiStore
 */
export async function initializeViewMode(): Promise<void> {
  // Dynamic import to break the circular dependency at module load time
  const { getViewModeFromRoles } = await import('@/utils/roleUtils');
  const viewMode = getViewModeFromRoles();
  useUIStore.setState({ viewMode });
}

export default useUIStore;
