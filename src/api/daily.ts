import client from './client';
import type { DailyComboStatus, ComboSubmitResult, ComboClaimResult, DailyActivityStatus, DailyClaimResult } from '@/types';

// === Daily combo ===
export function getDailyCombo() {
  return client.get<DailyComboStatus>('/daily/combo').then((r) => r.data);
}

/** `adViewId` is only needed for an extra attempt (after the free one of the day). */
export function submitDailyCombo(items: number[], adViewId?: string) {
  return client.post<ComboSubmitResult>('/daily/combo/submit', { items, adViewId }).then((r) => r.data);
}

/** Claim the reward of the best attempt; `double` needs the ad proof of the DOUBLE_COMBO placement. */
export function claimDailyCombo(double = false, adViewId?: string) {
  return client.post<ComboClaimResult>('/daily/combo/claim', { double, adViewId }).then((r) => r.data);
}

// === Daily streak ===
export function getDailyActivityStatus() {
  return client.get<DailyActivityStatus>('/daily/streak').then((r) => r.data);
}

export function claimDailyReward(double = false, adViewId?: string) {
  return client.post<DailyClaimResult>('/daily/streak/claim', { double, adViewId }).then((r) => r.data);
}
