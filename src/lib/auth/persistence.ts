export const AUTH_PERSISTENCE_COOKIE = "ptdd-remember";
export const AUTH_PERSISTENCE_MAX_AGE = 400 * 24 * 60 * 60;
export const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000;
export const ABSOLUTE_SESSION_TIMEOUT_MS = 12 * 60 * 60 * 1000;

export function shouldPersistAuthSession(value: string | undefined, explicit?: boolean) {
  return explicit ?? value === "1";
}

export function isSupabaseAuthCookieName(name: string) {
  return name.includes("-auth-token");
}

export function sessionCookieOptions<T extends { maxAge?: number; expires?: Date }>(
  options: T,
  persist: boolean,
): T {
  if (persist) return options;
  const sessionOptions = { ...options };
  delete sessionOptions.maxAge;
  delete sessionOptions.expires;
  return sessionOptions;
}

