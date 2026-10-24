import client from './client';
import type {
  SpinTierInfo, SpinResult, LiveWin,
  ChestState, ChestPickResult,
  RideInfo, RideRun, RideFinishResult,
  PlayerGift, PaginatedResponse,
} from '@/types';

// === Spin ===
export function getSpinTiers() {
  return client.get<{ tiers: SpinTierInfo[] }>('/spin/tiers').then((r) => r.data.tiers);
}

export function playSpin(tier: string, count: number) {
  return client.post<SpinResult>('/spin', { tier, count }).then((r) => r.data);
}

export function getSpinWinners(page = 1) {
  return client.get<PaginatedResponse<LiveWin>>('/spin/winners', { params: { page } }).then((r) => r.data);
}

// === Chest ===
export function getChest() {
  return client.get<ChestState>('/chest').then((r) => r.data);
}

/** Pays the round once (the prizes are drawn on the server at this moment). */
export function startChestRound() {
  return client.post<ChestState>('/chest/round').then((r) => r.data);
}

export function pickChest(slot: number) {
  return client.post<ChestPickResult>('/chest/pick', { slot }).then((r) => r.data);
}

// === Ride ===
export function getRideInfo() {
  return client.get<RideInfo>('/ride/me').then((r) => r.data);
}

export function startRide(adViewId?: string) {
  return client.post<RideRun>('/ride/start', { adViewId }).then((r) => r.data);
}

export function finishRide(runId: number, coins: number, score: number) {
  return client.post<RideFinishResult>('/ride/finish', { runId, coins, score }).then((r) => r.data);
}

// === Gifts ===
export function getGifts() {
  return client.get<{ gifts: PlayerGift[] | null }>('/gifts').then((r) => r.data.gifts ?? []);
}

export function sellGift(id: number) {
  return client.post<{ stars: number; newBalance: number }>(`/gifts/${id}/sell`).then((r) => r.data);
}

export function claimGift(id: number) {
  return client.post<PlayerGift>(`/gifts/${id}/claim`).then((r) => r.data);
}
