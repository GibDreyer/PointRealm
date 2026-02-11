import { api } from './client';
import type { AuthUser } from '@/lib/storage/auth';

export type AuthResponse = {
  accessToken: string;
  expiresAt: string;
  user: AuthUser;
};

export type RegisterPayload = {
  email: string;
  password: string;
  displayName?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type ProfilePayload = {
  displayName?: string | null;
  profileImageUrl?: string | null;
  profileEmoji?: string | null;
};

export const authApi = {
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload, { credentials: 'include' }),
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload, { credentials: 'include' }),
  refresh: () => api.post<AuthResponse>('/auth/refresh', {}, { credentials: 'include' }),
  logout: () => api.post<void>('/auth/logout', {}, { credentials: 'include' }),
  whoami: () => api.get<AuthUser>('/auth/whoami', { credentials: 'include' }),
  updateProfile: (payload: ProfilePayload) => api.put<AuthUser>('/auth/profile', payload, { credentials: 'include' }),
};
