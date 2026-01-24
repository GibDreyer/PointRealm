

import { getClientId } from '../lib/storage/identity';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

export class ApiError extends Error {
  constructor(public status: number, public message: string, public data?: any) {
    super(message);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'X-PointRealm-ClientId': getClientId(),
    ...options.headers,
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorMessage = 'An error occurred';
    let errorData = null;
    
    try {
      errorData = await response.json();
      errorMessage = errorData.message || response.statusText;
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
  post: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: <T>(endpoint: string, body: any, options?: RequestInit) => request<T>(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: <T>(endpoint: string, options?: RequestInit) => request<T>(endpoint, { method: 'DELETE', ...options }),
};
