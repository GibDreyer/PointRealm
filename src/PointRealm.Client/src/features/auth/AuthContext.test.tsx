import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from './AuthContext';
import { setAuthSession, setAuthUser } from '@/lib/storage/auth';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import { ApiError } from '@/api/client';

const authApiMock = vi.hoisted(() => ({
  login: vi.fn(),
  logout: vi.fn(),
  whoami: vi.fn(),
  refresh: vi.fn(),
  register: vi.fn(),
  updateProfile: vi.fn(),
}));

vi.mock('@/api/auth', () => ({
  authApi: authApiMock,
}));

describe('AuthProvider refresh failure handling', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
    authApiMock.logout.mockResolvedValue(undefined);
  });

  it('clears local auth and records notice when refresh returns 401', async () => {
    setAuthSession({
      token: 'soon-expired-token',
      expiresAt: new Date(Date.now() + 30 * 1000).toISOString(),
      persist: true,
    });
    setAuthUser({ id: '1', email: 'user@example.com' }, { persist: true });

    authApiMock.refresh.mockRejectedValue(new ApiError(401, 'Unauthorized'));

    render(
      <AuthProvider>
        <div>child</div>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_SESSION)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.AUTH_USER)).toBeNull();
    });

    expect(sessionStorage.getItem(STORAGE_KEYS.AUTH_NOTICE)).toContain('session');
  });
});
