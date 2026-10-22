import axios, { AxiosError } from 'axios';
import { useAuthStore } from '@/stores/auth';

/**
 * API calls are switched off in dev mode so the UI can be built without a backend.
 * Set VITE_USE_API=true (e.g. in .env.development.local) to talk to the real API.
 */
export const isApiDisabled = import.meta.env.DEV && import.meta.env.VITE_USE_API !== 'true';

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
  // In dev mode, fail fast without touching the network.
  ...(isApiDisabled && {
    adapter: (config) =>
      Promise.reject(new AxiosError('API is disabled in dev mode', 'ERR_API_DISABLED', config)),
  }),
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const auth = useAuthStore();
      auth.reAuth();
    }
    return Promise.reject(error);
  },
);

export default client;
