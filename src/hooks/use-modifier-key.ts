"use client";

import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

function isApplePlatform() {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  const platform = nav.userAgentData?.platform ?? navigator.platform ?? "";
  return /mac|iphone|ipad|ipod/i.test(platform);
}

/** "⌘" on Apple devices, "Ctrl" elsewhere. Renders "Ctrl" on the server (most P&T users are on Windows). */
export function useModifierKey(): "⌘" | "Ctrl" {
  return useSyncExternalStore(
    noopSubscribe,
    () => (isApplePlatform() ? "⌘" : "Ctrl"),
    () => "Ctrl",
  );
}
