import { STORAGE_KEYS } from './keys';

export type AuthUser = {
  id: string;
  email: string;
  displayName?: string | null;
  profileImageUrl?: string | null;
  profileEmoji?: string | null;
};

export function getAuthToken(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
      ?? localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string, options?: { persist?: boolean }): void {
  try {
    const persist = options?.persist ?? true;
    const targetStorage = persist ? localStorage : sessionStorage;
    const fallbackStorage = persist ? sessionStorage : localStorage;

    targetStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    fallbackStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to save auth token', error);
  }
}

export function clearAuthToken(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
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
