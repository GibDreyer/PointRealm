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
};

export const authApi = {
  register: (payload: RegisterPayload) => api.post<AuthResponse>('/auth/register', payload),
  login: (payload: LoginPayload) => api.post<AuthResponse>('/auth/login', payload),
  logout: () => api.post<void>('/auth/logout', {}),
  whoami: () => api.get<AuthUser>('/auth/whoami'),
  updateProfile: (payload: ProfilePayload) => api.put<AuthUser>('/auth/profile', payload),
};
