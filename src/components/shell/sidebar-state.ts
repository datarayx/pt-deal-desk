"use client";

import { useSyncExternalStore } from "react";

// Desktop sidebar collapse state.
// Source of truth: the `data-sidebar-collapsed` attribute on <html>, restored from localStorage by
// the inline script in the root layout (sidebar-restore-script.ts) before first paint (no flash, and no cookies — reading cookies would make
// every page dynamic under Next 16 cacheComponents). CSS reads the attribute via the
// `sidebar-collapsed:` / `sidebar-expanded:` variants; React reads it through this store.

export const SIDEBAR_STORAGE_KEY = "ptdd.sidebar-collapsed";
export const SIDEBAR_ATTRIBUTE = "data-sidebar-collapsed";
const CHANGE_EVENT = "ptdd:sidebar-change";

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return document.documentElement.hasAttribute(SIDEBAR_ATTRIBUTE);
}

function getServerSnapshot() {
  return false;
}

export function setSidebarCollapsed(collapsed: boolean) {
  document.documentElement.toggleAttribute(SIDEBAR_ATTRIBUTE, collapsed);
  try {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "1" : "0");
  } catch {
    // Private mode / blocked storage: the state just won't persist.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function useSidebarCollapsed() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
