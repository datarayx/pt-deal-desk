import { describe, expect, it } from "vitest";

import {
  AUTH_PERSISTENCE_COOKIE,
  AUTH_PERSISTENCE_MAX_AGE,
  ABSOLUTE_SESSION_TIMEOUT_MS,
  INACTIVITY_TIMEOUT_MS,
  isSupabaseAuthCookieName,
  sessionCookieOptions,
  shouldPersistAuthSession,
} from "@/lib/auth/persistence";

describe("auth persistence", () => {
  it("uses a separate remember marker and keeps the timeout explicit", () => {
    expect(AUTH_PERSISTENCE_COOKIE).toBe("ptdd-remember");
    expect(AUTH_PERSISTENCE_MAX_AGE).toBe(400 * 24 * 60 * 60);
    expect(INACTIVITY_TIMEOUT_MS).toBe(60 * 60 * 1000);
    expect(ABSOLUTE_SESSION_TIMEOUT_MS).toBe(12 * 60 * 60 * 1000);
  });

  it("defaults to a session cookie unless the user opts in", () => {
    expect(shouldPersistAuthSession(undefined)).toBe(false);
    expect(shouldPersistAuthSession("1")).toBe(true);
    expect(shouldPersistAuthSession("1", false)).toBe(false);
    expect(shouldPersistAuthSession(undefined, true)).toBe(true);
  });

  it("removes max age and expiry for browser-session cookies", () => {
    const options = { path: "/", maxAge: 400, expires: new Date("2030-01-01") };
    expect(sessionCookieOptions(options, false)).toEqual({ path: "/" });
    expect(sessionCookieOptions(options, true)).toBe(options);
  });

  it("recognises Supabase auth cookie chunks for the one-time migration", () => {
    expect(isSupabaseAuthCookieName("sb-example-auth-token")).toBe(true);
    expect(isSupabaseAuthCookieName("sb-example-auth-token.0")).toBe(true);
    expect(isSupabaseAuthCookieName("ptdd-remember")).toBe(false);
  });
});

