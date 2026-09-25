import { ApiConfig, BackendIntegrationState } from '../../types';

// Safely extract environment variables
const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};

export const API_CONFIG: ApiConfig = {
  baseUrl: env.VITE_API_BASE_URL || '/api',
  useBackendApi: env.VITE_USE_BACKEND_API === 'true',
  timeoutMs: 15000,
  tokenKey: 'tbdetect_jwt_token',
};

/**
 * Checks backend health and returns connection metadata
 */
export async function checkBackendConnection(): Promise<BackendIntegrationState> {
  if (!API_CONFIG.useBackendApi) {
    return {
      isConnected: false,
      apiBaseUrl: API_CONFIG.baseUrl,
      authMode: 'SANDBOX_SESSION',
      lastPingTime: new Date().toISOString(),
      serverVersion: 'TBDetect Dev Engine v3.4 (Offline/Sandbox Mode)',
      databaseEngine: 'PostgreSQL Contract / In-Memory Reactive Cache',
    };
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${API_CONFIG.baseUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json().catch(() => ({}));
      return {
        isConnected: true,
        apiBaseUrl: API_CONFIG.baseUrl,
        authMode: 'JWT_BEARER',
        lastPingTime: new Date().toISOString(),
        serverVersion: data.version || 'Spring Boot 3.3.x / Java 21',
        databaseEngine: data.database || 'PostgreSQL 16 with pgvector',
      };
    }
  } catch {
    // Backend unreachable, fallback to sandbox
  }

  return {
    isConnected: false,
    apiBaseUrl: API_CONFIG.baseUrl,
    authMode: 'SANDBOX_SESSION',
    lastPingTime: new Date().toISOString(),
    serverVersion: 'Spring Boot REST Unreachable — Sandbox Fallback Active',
    databaseEngine: 'PostgreSQL Contract Ready',
  };
}
