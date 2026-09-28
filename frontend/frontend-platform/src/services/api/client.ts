/**
 * Centralized API Client Architecture
 * 
 * Provides unified HTTP integration against local Express + PostgreSQL judging engine
 * with JWT bearer authentication, standardized error translation, and mock state fallback.
 */

const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL as string) || '/api';
export const USE_MOCK_API = (import.meta.env?.VITE_USE_MOCK_API as string) !== 'false';

export function getAuthToken(): string | null {
  return localStorage.getItem('devpulse_jwt_token');
}

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem('devpulse_jwt_token', token);
  else localStorage.removeItem('devpulse_jwt_token');
}

export interface ApiError {
  status: number;
  message: string;
  details?: Record<string, string[]>;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      let userFriendlyMessage = errorData.message || res.statusText;

      if (res.status === 401) {
        userFriendlyMessage = 'Your session has expired. Please sign in again.';
      } else if (res.status === 403) {
        userFriendlyMessage = 'You do not have permission to perform this action.';
      } else if (res.status === 409) {
        userFriendlyMessage = errorData.message || 'The requested operation conflicts with the current backend state.';
      }

      const err: ApiError = {
        status: res.status,
        message: userFriendlyMessage,
        details: errorData.errors,
      };
      throw err;
    }

    const body = await res.json();
    // Unwrap backend envelope: { success: true, data: ... }
    // If the response has a 'data' field (judging engine convention), return it directly.
    // Otherwise fall through to return raw body (Member 1 auth/events/etc. responses).
    if (body && typeof body === 'object' && 'success' in body && 'data' in body) {
      return body.data as T;
    }
    return body as T;
  } catch (err: any) {
    if (err.status) throw err;
    throw {
      status: 0,
      message: 'Network communication failure. Verifying connectivity to backend service.',
    } as ApiError;
  }
}


