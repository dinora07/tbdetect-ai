import { API_CONFIG } from './config';
import { ApiResponse } from '../../types';

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.data = data;
  }
}

async function doRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = endpoint.startsWith('http')
    ? endpoint
    : `${API_CONFIG.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = httpClient.getToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      httpClient.clearToken();
      window.dispatchEvent(new CustomEvent('tbdetect_unauthorized'));
      throw new ApiError('Session expired. Please sign in again.', 401);
    }

    if (response.status === 403) {
      throw new ApiError('Access forbidden. Insufficient permissions.', 403);
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      throw new ApiError(
        errorData?.message || `Request failed with HTTP status ${response.status}`,
        response.status,
        errorData
      );
    }

    const json = await response.json();
    if (json && typeof json === 'object' && 'data' in json) {
      return json as ApiResponse<T>;
    }
    return {
      success: true,
      data: json as T,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof ApiError) {
      throw err;
    }
    const error = err as Error;
    if (error.name === 'AbortError') {
      throw new ApiError('Network request timed out. Please check your connection.', 408);
    }
    throw new ApiError(error.message || 'Network communication failure', 500);
  }
}

export const httpClient = {
  getToken(): string | null {
    try {
      return localStorage.getItem(API_CONFIG.tokenKey);
    } catch {
      return null;
    }
  },

  setToken(token: string): void {
    try {
      localStorage.setItem(API_CONFIG.tokenKey, token);
    } catch {
      // Ignore storage errors
    }
  },

  clearToken(): void {
    try {
      localStorage.removeItem(API_CONFIG.tokenKey);
    } catch {
      // Ignore storage errors
    }
  },

  request: doRequest,

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await doRequest<T>(endpoint, { ...options, method: 'GET' });
    return res.data;
  },

  async post<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await doRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
    return res.data;
  },

  async put<T>(endpoint: string, body?: unknown, options?: RequestInit): Promise<T> {
    const isFormData = body instanceof FormData;
    const res = await doRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
    return res.data;
  },

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const res = await doRequest<T>(endpoint, { ...options, method: 'DELETE' });
    return res.data;
  },
};
