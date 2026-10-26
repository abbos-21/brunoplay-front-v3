import client from './client';
import type { AuthResponse } from '@/types';

/** Sign in with the signed Telegram initData (a referral code travels inside it as start_param). */
export function authenticate(initData: string) {
  return client.post<AuthResponse>('/auth/telegram', { initData }).then((r) => r.data);
}

/** Development only: sign in without Telegram (the backend needs DEV_AUTH=true). */
export function authenticateDev(telegramId: number, startParam?: string) {
  return client
    .post<AuthResponse>('/auth/dev', { telegramId, firstName: import.meta.env.VITE_DEV_NAME || 'Dev', startParam: startParam || undefined })
    .then((r) => r.data);
}
