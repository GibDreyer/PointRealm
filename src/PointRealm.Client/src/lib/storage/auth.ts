import { STORAGE_KEYS } from './keys';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  profileEmoji?: string | null;
};

export type AuthSession = {
  token: string;
  expiresAt: string;
  persist: boolean;
};

const parseJson = <T>(raw: string | null): T | null => {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
};

const isExpired = (expiresAt: string): boolean => {
  const expiry = Date.parse(expiresAt);
  return Number.isNaN(expiry) || expiry <= Date.now();
};

function getRawSession(): AuthSession | null {
  try {
    return parseJson<AuthSession>(
      sessionStorage.getItem(STORAGE_KEYS.AUTH_SESSION)
      ?? localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)
    );
  } catch {
    return null;
  }
}

export function getAuthSession(): AuthSession | null {
  const session = getRawSession();
  if (!session) return null;

  if (isExpired(session.expiresAt)) {
    clearAuthState();
    return null;
  }

  return session;
}

export function getAuthToken(): string | null {
  const session = getAuthSession();
  if (session) return session.token;

  // Legacy fallback while users migrate from pre-session metadata versions.
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      ?? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthSession(session: AuthSession): void {
  try {
    const targetStorage = session.persist ? localStorage : sessionStorage;
    const fallbackStorage = session.persist ? sessionStorage : localStorage;

    const payload = JSON.stringify(session);
    targetStorage.setItem(STORAGE_KEYS.AUTH_SESSION, payload);
    targetStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, session.token);

    fallbackStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    fallbackStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to save auth session', error);
  }
}

export function setAuthToken(token: string, options?: { persist?: boolean; expiresAt?: string }): void {
  const session: AuthSession = {
    token,
    persist: options?.persist ?? true,
    expiresAt: options?.expiresAt ?? new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  setAuthSession(session);
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
    localStorage.removeItem(STORAGE_KEYS.AUTH_SESSION);
  } catch (error) {
    console.error('Failed to clear auth token', error);
  }
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.AUTH_USER)
      ?? localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser, options?: { persist?: boolean }): void {
  try {
    const persist = options?.persist ?? true;
    const targetStorage = persist ? localStorage : sessionStorage;
    const fallbackStorage = persist ? sessionStorage : localStorage;

    targetStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
    fallbackStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch (error) {
    console.error('Failed to save auth user', error);
  }
}

export function clearAuthUser(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_USER);
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch (error) {
    console.error('Failed to clear auth user', error);
  }
}

export function clearAuthState(): void {
  clearAuthToken();
  clearAuthUser();
}

export function setAuthNotice(message: string): void {
  try {
    sessionStorage.setItem(STORAGE_KEYS.AUTH_NOTICE, message);
  } catch {
    // no-op
  }
}

export function consumeAuthNotice(): string | null {
  try {
    const message = sessionStorage.getItem(STORAGE_KEYS.AUTH_NOTICE);
    if (message) {
      sessionStorage.removeItem(STORAGE_KEYS.AUTH_NOTICE);
    }
    return message;
  } catch {
    return null;
  }
}
