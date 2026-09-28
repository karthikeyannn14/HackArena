/**
 * HackArena Modular REST API Client
 * 
 * Provides unified HTTP client integration with local Express backend
 * including JWT Bearer headers, error handling, and robust offline fallback.
 */

const API_BASE = (import.meta.env?.VITE_API_URL as string) || '/api';

export function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('devpulse_jwt_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function restFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errBody.message || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    // Log for debugging backend connection
    console.debug(`[HackArena REST API] ${endpoint} offline or unreachable, utilizing in-memory state:`, error);
    throw error;
  }
}


