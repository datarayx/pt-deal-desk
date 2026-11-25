"use client";

import { useEffect, useRef } from "react";

import { signOutForInactivity } from "@/features/auth/actions";
import { ABSOLUTE_SESSION_TIMEOUT_MS, INACTIVITY_TIMEOUT_MS } from "@/lib/auth/persistence";

const ACTIVITY_EVENTS = ["pointerdown", "keydown", "scroll", "touchstart", "mousemove"] as const;

const SESSION_STARTED_AT = "ptdd-session-started-at";

/** Signs an authenticated app session out after 60 minutes idle or 12 hours absolute. */
export function InactivityGuard() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const absoluteTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivity = useRef(0);

  useEffect(() => {
    const resetTimer = () => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        void signOutForInactivity();
      }, INACTIVITY_TIMEOUT_MS);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastActivity.current < 1000) return;
      lastActivity.current = now;
      resetTimer();
    };

    resetTimer();
    const startedAt = Number(window.sessionStorage.getItem(SESSION_STARTED_AT)) || Date.now();
    window.sessionStorage.setItem(SESSION_STARTED_AT, String(startedAt));
    const remaining = Math.max(0, ABSOLUTE_SESSION_TIMEOUT_MS - (Date.now() - startedAt));
    absoluteTimer.current = setTimeout(() => {
      void signOutForInactivity();
    }, remaining);
    for (const event of ACTIVITY_EVENTS)
      window.addEventListener(event, onActivity, { passive: true });
    return () => {
      if (timer.current) clearTimeout(timer.current);
      if (absoluteTimer.current) clearTimeout(absoluteTimer.current);
      for (const event of ACTIVITY_EVENTS) window.removeEventListener(event, onActivity);
    };
  }, []);

  return null;
}

