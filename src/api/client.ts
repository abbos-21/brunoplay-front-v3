import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { applyGate } from '@/composables/useAppGate';
import { authReady } from '@/composables/authReady';

/**
 * API calls are switched off in dev mode so the UI can be built without a backend.
 * Set VITE_USE_API=true (e.g. in .env.development.local) to talk to the real API.
 */
export const isApiDisabled = import.meta.env.DEV && import.meta.env.VITE_USE_API !== 'true';

/** Sent with every request: the server can ask old apps to reload (426 UPGRADE_REQUIRED). */
export const APP_VERSION = import.meta.env.VITE_APP_VERSION ?? '0.0.0';

declare module 'axios' {
  interface AxiosRequestConfig {
    /** the sign-in itself must not wait for the sign-in to finish */
    skipAuthWait?: boolean;
  }
}

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: 15000,
  // In dev mode, fail fast without touching the network.
  ...(isApiDisabled && {
    adapter: (config) =>
      Promise.reject(new AxiosError('API is disabled in dev mode', 'ERR_API_DISABLED', config)),
  }),
});

const newKey = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

client.interceptors.request.use(async (config) => {
  // screens ask for data as soon as they open: wait for the sign-in to finish first
  if (!config.skipAuthWait && !String(config.url).startsWith('/auth') && config.url !== '/app-info') await authReady;
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-App-Version'] = APP_VERSION;
  // A repeat of the same key is answered with the stored result and never pays twice.
  // Callers that retry on purpose pass their own key.
  if (config.method && config.method.toLowerCase() !== 'get' && !config.headers['Idempotency-Key']) {
    config.headers['Idempotency-Key'] = newKey();
  }
  return config;
});

type ApiErrorBody = { error?: { code?: string; message?: string; params?: Record<string, unknown> } };

/** The machine readable code of an API error ('TANK_BELOW_MINIMUM', ...), or '' for anything else. */
export function apiCode(e: unknown): string {
  if (axios.isAxiosError(e)) return (e.response?.data as ApiErrorBody | undefined)?.error?.code ?? '';
  return '';
}

client.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error.response?.status;
    const code = (error.response?.data as ApiErrorBody | undefined)?.error?.code;
    // maintenance / forced reload / blocked account: the app shows a full screen
    if (applyGate(code, error.response?.data as ApiErrorBody | undefined)) return Promise.reject(error);
    if (status === 401 && error.config && !String(error.config.url).startsWith('/auth')) {
      const auth = useAuthStore();
      // while the first sign-in is running it handles its own 401 (an old stored token)
      if (auth.state !== 'loading') auth.reAuth();
    }
    return Promise.reject(error);
  },
);

export default client;
