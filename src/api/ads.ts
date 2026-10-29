import client from './client';
import type { AdPlacement, AdsConfig, AdView, BonusAdResult, BonusAdStatus, PopupProof, SponsoredClaim } from '@/types';

/** Opens an ad proof for an action; the server later confirms the view by Adsgram's own callback. */
export function requestAd(placement: AdPlacement) {
  return client.post<AdView>('/ads', { placement }).then((r) => r.data);
}

/** The ad could not be shown. After several failures in a row the server lets fishing go ahead (fallback). */
export function reportAdFailed(placement: AdPlacement, reason = '') {
  return client.post<{ fallback: boolean; ad: AdView | null }>('/ads/failed', { placement, reason: reason.slice(0, 300) }).then((r) => r.data);
}

export function getAdsConfig() {
  return client.get<AdsConfig>('/ads/config').then((r) => r.data);
}

/** Pays the coins for a sponsored task Adsgram has confirmed to the server (AD_NOT_COMPLETED until its call arrives). */
export function claimSponsoredTask() {
  return client.post<SponsoredClaim>('/ads/task/claim', {}).then((r) => r.data);
}

/** The proof for the next Monetag popup task: held before the tap (the browser only opens the popup inside a tap). */
export function preparePopupTask() {
  return client.post<PopupProof>('/ads/popup-task/prepare', {}).then((r) => r.data);
}

/** Pays the coins for a popup task Monetag has confirmed to the server (AD_NOT_COMPLETED until its postback arrives and the wait is over). */
export function claimPopupTask(adViewId: string) {
  return client.post<SponsoredClaim>('/ads/popup-task/claim', { adViewId }).then((r) => r.data);
}

/** One line in the server log per interstitial attempt ("shown" / "failed" and Adsgram's reason). Never throws. */
export function reportInterstitial(result: 'shown' | 'failed', detail: string) {
  return client.post('/ads/interstitial/report', { result, detail }).catch(() => undefined);
}

export function getBonusAd() {
  return client.get<BonusAdStatus>('/ads/bonus').then((r) => r.data);
}

export function claimBonusAd(adViewId: string) {
  return client.post<BonusAdResult>('/ads/bonus/claim', { adViewId }).then((r) => r.data);
}
