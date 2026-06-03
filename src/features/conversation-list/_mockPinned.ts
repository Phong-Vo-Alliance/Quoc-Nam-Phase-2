/**
 * MOCKUP - Pinned conversations local store
 *
 * ⚠️ MOCKUP ONLY: state lưu trong localStorage, không có backend.
 * Khi wire-up backend, xoá file này và các vị trí gọi đến.
 *
 * Phạm vi:
 * - Ghim ở cấp Category (work type) cho tab Nhóm
 * - Ghim ở cấp DirectConversation cho tab DM
 * - Cùng dùng chung 1 Set ID (không trùng giữa category vs DM trong thực tế)
 *
 * 🔌 Bật/tắt mockup: đổi MOCKUP_PIN_ENABLED dưới đây. false = ẩn toàn bộ UI ghim.
 */

import React from "react";

export const MOCKUP_PIN_ENABLED = false;

const STORAGE_KEY = "__mock_pinned_conversations_v1";

type Listener = () => void;
const listeners = new Set<Listener>();

function readFromStorage(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return new Set(parsed);
  } catch {
    // ignore
  }
  return new Set();
}

function writeToStorage(set: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    // ignore
  }
}

let state: Set<string> = readFromStorage();

function emit() {
  listeners.forEach((l) => l());
}

export function isPinned(id: string): boolean {
  if (!MOCKUP_PIN_ENABLED) return false;
  return state.has(id);
}

export function togglePinned(id: string): void {
  if (!MOCKUP_PIN_ENABLED) return;
  const next = new Set(state);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  state = next;
  writeToStorage(state);
  emit();
}

export function getAllPinned(): Set<string> {
  if (!MOCKUP_PIN_ENABLED) return new Set();
  return state;
}

/**
 * Hook subscribe để component re-render khi pin thay đổi.
 */
export function usePinnedSet(): Set<string> {
  const subscribe = React.useCallback((cb: Listener) => {
    if (!MOCKUP_PIN_ENABLED) return () => {};
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }, []);
  const getSnapshot = React.useCallback(
    () => (MOCKUP_PIN_ENABLED ? state : EMPTY_SET),
    [],
  );
  return React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const EMPTY_SET: Set<string> = new Set();
