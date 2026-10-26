import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types';
import { apiMessage } from '@/composables/apiError';
import * as authApi from '@/api/auth';
import * as userApi from '@/api/user';
import { isApiDisabled } from '@/api/client';
import { getTelegramInitData, getTelegramStartParam, initTelegram } from '@/composables/useTelegram';
import { gate } from '@/composables/useAppGate';
import { markAuthReady } from '@/composables/authReady';

/** A network hiccup or a 5xx from the server: worth asking again. Anything else (401, 4xx) is a real answer. */
function isTransient(e: unknown): boolean {
  const status = (e as { response?: { status?: number } })?.response?.status;
  return status === undefined || status >= 500;
}

/** Runs `fn`, asking again a few times when the connection fails, so a brief outage does not break the start of the app. */
async function withRetry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await fn();
    } catch (e) {
      if (attempt >= tries || !isTransient(e)) throw e;
      await new Promise((r) => setTimeout(r, 700 * attempt));
    }
  }
}

export type AuthState = 'idle' | 'loading' | 'authenticated' | 'error';

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));
  const state = ref<AuthState>('idle');
  const error = ref<string | null>(null);

  const isAuthenticated = computed(() => state.value === 'authenticated');
  const isLoading = computed(() => state.value === 'loading');

  /**
   * Full initialization flow — call once at app startup.
   *
   * 1. Initialize Telegram WebApp SDK (ready + expand)
   * 2. If we have a stored token, try to validate it via GET /user/me
   * 3. If no token or validation fails, authenticate with Telegram initData
   * 4. If not inside Telegram, show an appropriate error
   */
  async function init(): Promise<void> {
    try {
      await signIn();
    } finally {
      markAuthReady();
    }
  }

  async function signIn(): Promise<void> {
    if (isApiDisabled) {
      console.info('[dev] API is disabled — skipping authentication (set VITE_USE_API=true to enable)');
      return;
    }

    state.value = 'loading';
    error.value = null;

    // Step 1: Initialize Telegram WebApp
    initTelegram();

    // Step 2: If we have a stored token, try to restore the session
    if (token.value) {
      try {
        user.value = await withRetry(() => userApi.getMe(true));
        // development: a saved login of another test player is dropped when VITE_DEV_TG_ID names a different one
        const devId = Number(import.meta.env.VITE_DEV_TG_ID);
        if (import.meta.env.DEV && devId > 0 && user.value.telegramId !== String(devId)) {
          throw { response: { status: 401 } };
        }
        state.value = 'authenticated';
        showBlocked();
        return;
      } catch (e) {
        if (isTransient(e)) {
          // the server could not be reached: keep the token, the player can try again
          state.value = 'error';
          error.value = apiMessage(e, 'Cannot reach the server');
          return;
        }
        // Token is invalid/expired — clear it and fall through to re-auth
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
      }
    }

    // Step 3: Authenticate with Telegram initData (a referral code travels inside it as start_param)
    const initData = getTelegramInitData();
    const devId = Number(import.meta.env.VITE_DEV_TG_ID);

    try {
      let res;
      if (initData) {
        res = await withRetry(() => authApi.authenticate(initData));
      } else if (import.meta.env.DEV && devId > 0) {
        // development only: sign in without Telegram (the backend needs DEV_AUTH=true)
        res = await authApi.authenticateDev(devId, getTelegramStartParam());
      } else {
        state.value = 'error';
        error.value = 'Please open this app from Telegram.';
        return;
      }
      token.value = res.token;
      user.value = res.user;
      localStorage.setItem('token', res.token);
      state.value = 'authenticated';
      showBlocked();
    } catch (e) {
      state.value = 'error';
      error.value = apiMessage(e, 'Authentication failed');
    }
  }

  /** A blocked account can still sign in; the app shows the blocked screen instead of the game. */
  function showBlocked() {
    if (user.value?.isBlocked) {
      gate.value = { kind: 'blocked', text: user.value.blockReason ?? '', until: '' };
    }
  }

  /** Re-authenticate (e.g. after 401); many failing requests share one attempt */
  let reauth: Promise<void> | null = null;
  function reAuth(): Promise<void> {
    if (!reauth) {
      token.value = null;
      user.value = null;
      localStorage.removeItem('token');
      reauth = init().finally(() => {
        reauth = null;
      });
    }
    return reauth;
  }

  /** Fetch fresh user data from the server */
  async function fetchUser(): Promise<void> {
    if (!token.value) return;
    try {
      user.value = await userApi.getMe();
    } catch {
      // If fetching user fails, don't wipe auth — the 401 interceptor handles that
    }
  }

  /** Merge partial updates into the user object */
  function updateUser(partial: Partial<User>): void {
    if (user.value) {
      Object.assign(user.value, partial);
    }
  }

  /** Full logout */
  function logout(): void {
    token.value = null;
    user.value = null;
    state.value = 'idle';
    error.value = null;
    localStorage.removeItem('token');
  }

  return {
    user,
    token,
    state,
    error,
    isAuthenticated,
    isLoading,
    init,
    reAuth,
    fetchUser,
    updateUser,
    logout,
  };
});
