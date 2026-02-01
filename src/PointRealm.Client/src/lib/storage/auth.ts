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
    return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  } catch (error) {
    console.error('Failed to save auth token', error);
  }
}

export function clearAuthToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  } catch (error) {
    console.error('Failed to clear auth token', error);
  }
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setAuthUser(user: AuthUser): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(user));
  } catch (error) {
    console.error('Failed to save auth user', error);
  }
}

export function clearAuthUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
  } catch (error) {
    console.error('Failed to clear auth user', error);
  }
}
