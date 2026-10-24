import client from './client';
import type { FishingStatus, CollectResult } from '@/types';

export function getFishingStatus() {
  return client.get<FishingStatus>('/fishing').then((r) => r.data);
}

export function startFishing(adViewId?: string) {
  return client.post<FishingStatus>('/fishing/start', { adViewId }).then((r) => r.data);
}

export function collectCoins(adViewId?: string) {
  return client.post<CollectResult>('/fishing/collect', { adViewId }).then((r) => r.data);
}
