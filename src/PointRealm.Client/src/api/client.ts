

import { getClientId } from '../lib/storage/identity';
import { getAuthToken } from '../lib/storage/auth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

type ApiErrorData = Record<string, unknown> | null;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const getErrorMessage = (data: unknown): string | undefined => {
  if (!isRecord(data)) return undefined;
  
  // 1. Handle standard { message: "..." }
  if (typeof data.message === 'string') return data.message;
  
  // 2. Handle Identity errors: [{ code: "...", description: "..." }, ...]
  if (Array.isArray(data)) {
    const firstError = data[0];
    if (isRecord(firstError) && typeof firstError.description === 'string') {
      return firstError.description;
    }
  }

  // 3. Handle Validation problems: { errors: { field: ["error"] } }
  if (isRecord(data.errors)) {
    const firstField = Object.values(data.errors)[0];
    if (Array.isArray(firstField) && typeof firstField[0] === 'string') {
      return firstField[0];
    }
  }

  return undefined;
};

export class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: ApiErrorData) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Check for realm-specific token in session storage
  // Endpoints typically look like /realms/{code}/... or realms/{code}/...
  const realmMatch = endpoint.match(/(?:\/|^)(?:v1\/)?realms\/([^/]+)/);
  let authHeader = {};
  
  if (realmMatch && realmMatch[1]) {
    const code = realmMatch[1];
    const token = sessionStorage.getItem(`pointrealm:v1:realm:${code}:token`);
    if (token) {
      authHeader = { 'Authorization': `Bearer ${token}` };
    }
  }

  if (!('Authorization' in authHeader)) {
    const authToken = getAuthToken();
    if (authToken) {
      authHeader = { 'Authorization': `Bearer ${authToken}` };
    }
  }

  const headers = {
    'Content-Type': 'application/json',
    'X-PointRealm-ClientId': getClientId(),
    ...authHeader,
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData: ApiErrorData = null;
    
    try {
      const payload = await response.json();
      errorData = isRecord(payload) ? payload : null;
      errorMessage = getErrorMessage(payload) ?? response.statusText;
    } catch {
      errorMessage = response.statusText;
    }

    throw new ApiError(response.status, errorMessage, errorData);
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return {} as T;
  }

  try {
    return await response.json();
  } catch {
    return {} as T;
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'GET', ...options }),
  post: <T>(endpoint: string, body: unknown, options?: RequestInit) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(endpoint: string, body: unknown, options?: RequestInit) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: <T>(endpoint: string, body: unknown, options?: RequestInit) => request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};
