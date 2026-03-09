import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

describe('uiStore', () => {
  beforeEach(() => {
    useUIStore.getState().resetUI();
  });

  describe('initialization - no circular dependency', () => {
    it('should initialize without accessing authStore (no ReferenceError)', () => {
      // This test verifies the fix for:
      // "Uncaught ReferenceError: Cannot access 'useAuthStore' before initialization"
      // The store must initialize with a safe default, not call getViewModeFromRoles()
      const state = useUIStore.getState();
      expect(state).toBeDefined();
      expect(state.viewMode).toBe('staff');
    });

    it('should have correct default initial state', () => {
      const state = useUIStore.getState();

      expect(state.viewMode).toBe('staff');
      expect(state.currentView).toBe('workspace');
      expect(state.showRightPanel).toBe(true);
      expect(state.rightPanelTab).toBe('info');
      expect(state.selectedGroupId).toBeNull();
      expect(state.selectedWorkTypeId).toBeNull();
      expect(state.selectedMessageId).toBeNull();
      expect(state.selectedTaskId).toBeNull();
      expect(state.isMobileView).toBe(false);
      expect(state.mobileMenuOpen).toBe(false);
      expect(state.openThreadMessageId).toBeNull();
      expect(state.activeModal).toBeNull();
    });
  });

  describe('viewMode actions', () => {
    it('should set viewMode to "lead"', () => {
      useUIStore.getState().setViewMode('lead');
      expect(useUIStore.getState().viewMode).toBe('lead');
    });

    it('should set viewMode to "staff"', () => {
      useUIStore.getState().setViewMode('lead');
      useUIStore.getState().setViewMode('staff');
      expect(useUIStore.getState().viewMode).toBe('staff');
    });
  });

  describe('currentView actions', () => {
    it('should set currentView', () => {
      useUIStore.getState().setCurrentView('lead');
      expect(useUIStore.getState().currentView).toBe('lead');
    });
  });

  describe('right panel actions', () => {
    it('should toggle right panel', () => {
      expect(useUIStore.getState().showRightPanel).toBe(true);
      useUIStore.getState().toggleRightPanel();
      expect(useUIStore.getState().showRightPanel).toBe(false);
      useUIStore.getState().toggleRightPanel();
      expect(useUIStore.getState().showRightPanel).toBe(true);
    });

    it('should set right panel tab', () => {
      useUIStore.getState().setRightPanelTab('task');
      expect(useUIStore.getState().rightPanelTab).toBe('task');
    });

    it('should set showRightPanel directly', () => {
      useUIStore.getState().setShowRightPanel(false);
      expect(useUIStore.getState().showRightPanel).toBe(false);
    });
  });

  describe('selection actions', () => {
    it('should set selected group', () => {
      useUIStore.getState().setSelectedGroup('group-1');
      expect(useUIStore.getState().selectedGroupId).toBe('group-1');
    });

    it('should set selected work type', () => {
      useUIStore.getState().setSelectedWorkType('wt-1');
      expect(useUIStore.getState().selectedWorkTypeId).toBe('wt-1');
    });

    it('should set selected message', () => {
      useUIStore.getState().setSelectedMessage('msg-1');
      expect(useUIStore.getState().selectedMessageId).toBe('msg-1');
    });

    it('should set selected task', () => {
      useUIStore.getState().setSelectedTask('task-1');
      expect(useUIStore.getState().selectedTaskId).toBe('task-1');
    });

    it('should clear selections with null', () => {
      useUIStore.getState().setSelectedGroup('group-1');
      useUIStore.getState().setSelectedGroup(null);
      expect(useUIStore.getState().selectedGroupId).toBeNull();
    });
  });

  describe('mobile actions', () => {
    it('should set mobile view', () => {
      useUIStore.getState().setIsMobileView(true);
      expect(useUIStore.getState().isMobileView).toBe(true);
    });

    it('should toggle mobile menu', () => {
      expect(useUIStore.getState().mobileMenuOpen).toBe(false);
      useUIStore.getState().toggleMobileMenu();
      expect(useUIStore.getState().mobileMenuOpen).toBe(true);
    });

    it('should set mobile menu open directly', () => {
      useUIStore.getState().setMobileMenuOpen(true);
      expect(useUIStore.getState().mobileMenuOpen).toBe(true);
    });
  });

  describe('modal actions', () => {
    it('should open modal', () => {
      useUIStore.getState().openModal('confirm-delete');
      expect(useUIStore.getState().activeModal).toBe('confirm-delete');
    });

    it('should close modal', () => {
      useUIStore.getState().openModal('confirm-delete');
      useUIStore.getState().closeModal();
      expect(useUIStore.getState().activeModal).toBeNull();
    });
  });

  describe('thread panel', () => {
    it('should set open thread message id', () => {
      useUIStore.getState().setOpenThreadMessageId('thread-1');
      expect(useUIStore.getState().openThreadMessageId).toBe('thread-1');
    });

    it('should clear thread message id with null', () => {
      useUIStore.getState().setOpenThreadMessageId('thread-1');
      useUIStore.getState().setOpenThreadMessageId(null);
      expect(useUIStore.getState().openThreadMessageId).toBeNull();
    });
  });

  describe('resetUI', () => {
    it('should reset all state to defaults', () => {
      // Modify multiple states
      useUIStore.getState().setViewMode('lead');
      useUIStore.getState().setCurrentView('lead');
      useUIStore.getState().setShowRightPanel(false);
      useUIStore.getState().setSelectedGroup('group-1');
      useUIStore.getState().setSelectedMessage('msg-1');
      useUIStore.getState().setIsMobileView(true);
      useUIStore.getState().openModal('test');
      useUIStore.getState().setOpenThreadMessageId('thread-1');

      // Reset
      useUIStore.getState().resetUI();

      const state = useUIStore.getState();
      expect(state.viewMode).toBe('staff');
      expect(state.currentView).toBe('workspace');
      expect(state.showRightPanel).toBe(true);
      expect(state.selectedGroupId).toBeNull();
      expect(state.selectedMessageId).toBeNull();
      expect(state.isMobileView).toBe(false);
      expect(state.activeModal).toBeNull();
      expect(state.openThreadMessageId).toBeNull();
    });

    it('should reset viewMode to "staff" (safe default, not from authStore)', () => {
      useUIStore.getState().setViewMode('lead');
      useUIStore.getState().resetUI();
      // After reset, viewMode should be the safe default 'staff'
      // NOT computed from authStore (which could cause circular dependency)
      expect(useUIStore.getState().viewMode).toBe('staff');
    });
  });
});
