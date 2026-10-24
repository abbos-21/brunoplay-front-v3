import client from './client';
import type { AdPlacement, AdView, BonusAdResult, BonusAdStatus } from '@/types';

/** Opens an ad proof for an action; the server later confirms the view by Adsgram's own callback. */
export function requestAd(placement: AdPlacement) {
  return client.post<AdView>('/ads', { placement }).then((r) => r.data);
}

/** The ad could not be shown. After several failures in a row the server lets fishing go ahead (fallback). */
export function reportAdFailed(placement: AdPlacement) {
  return client.post<{ fallback: boolean; ad: AdView | null }>('/ads/failed', { placement }).then((r) => r.data);
}

export function getBonusAd() {
  return client.get<BonusAdStatus>('/ads/bonus').then((r) => r.data);
}

export function claimBonusAd(adViewId: string) {
  return client.post<BonusAdResult>('/ads/bonus/claim', { adViewId }).then((r) => r.data);
}
