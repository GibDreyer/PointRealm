import { beforeEach, describe, expect, it } from 'vitest';
import {
  clearAuthState,
  getAuthSession,
  getAuthToken,
  setAuthSession,
} from './auth';

describe('auth storage hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('returns token when session metadata is valid', () => {
    setAuthSession({
      token: 'valid-token',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      persist: false,
    });

    expect(getAuthSession()?.token).toBe('valid-token');
    expect(getAuthToken()).toBe('valid-token');
  });

  it('clears state when session is expired', () => {
    setAuthSession({
      token: 'old-token',
      expiresAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      persist: true,
    });

    expect(getAuthSession()).toBeNull();
    expect(getAuthToken()).toBeNull();
    expect(localStorage.length).toBe(0);
    expect(sessionStorage.length).toBe(0);
  });

  it('clearAuthState removes all auth artifacts', () => {
    setAuthSession({
      token: 'token',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      persist: true,
    });

    clearAuthState();

    expect(getAuthSession()).toBeNull();
    expect(getAuthToken()).toBeNull();
  });
});
