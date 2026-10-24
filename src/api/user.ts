import client from './client';
import type { User, AppInfo } from '@/types';

/** `signingIn`: the call is part of the sign-in itself, so it must not wait for the sign-in to finish. */
export function getMe(signingIn = false) {
  return client.get<{ user: User }>('/me', { skipAuthWait: signingIn }).then((r) => r.data.user);
}

export function updateSettings(data: { language?: string }) {
  return client.patch('/me/language', { language: data.language }).then((r) => r.data);
}

export function getAppInfo() {
  return client.get<AppInfo>('/app-info').then((r) => r.data);
}
