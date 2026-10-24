import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  SpinTierInfo, SpinResult, LiveWin, ChestState, ChestPickResult, RideInfo, RideRun, RideFinishResult,
  PlayerGift, Tournament,
} from '@/types';
import * as gamesApi from '@/api/games';
import * as tournamentsApi from '@/api/tournaments';
import { withAd } from '@/composables/useAds';
import { useAuthStore } from './auth';

export const useGamesStore = defineStore('games', () => {
  // Spin
  const spinTiers = ref<SpinTierInfo[]>([]);
  const spinLiveWins = ref<LiveWin[]>([]);
  const lastSpinResult = ref<SpinResult | null>(null);

  // Chest
  const chest = ref<ChestState | null>(null);

  // Ride
  const rideInfo = ref<RideInfo | null>(null);
  const activeRun = ref<RideRun | null>(null);

  // Gifts
  const gifts = ref<PlayerGift[]>([]);

  // Tournament
  const tournaments = ref<Tournament[]>([]);
  const activeTournament = ref<Tournament | null>(null);

  const isLoading = ref(false);

  // --- Spin ---
  async function fetchSpinTiers() {
    spinTiers.value = await gamesApi.getSpinTiers();
  }

  /** the latest big wins of everybody (page 1 of the winners list) */
  async function fetchSpinLiveWins() {
    spinLiveWins.value = (await gamesApi.getSpinWinners(1)).data ?? [];
  }

  async function playSpin(tier: string, count: number) {
    isLoading.value = true;
    try {
      const result = await gamesApi.playSpin(tier, count);
      lastSpinResult.value = result;
      const auth = useAuthStore();
      if (typeof result.stars === 'number') auth.updateUser({ starsBalance: result.stars });
      await auth.fetchUser();
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  // --- Chest: a round is paid once, then its chests are opened one by one (the prizes were drawn at payment) ---
  async function fetchChest() {
    chest.value = await gamesApi.getChest();
    return chest.value;
  }

  async function startChestRound() {
    isLoading.value = true;
    try {
      chest.value = await gamesApi.startChestRound();
      await useAuthStore().fetchUser();
      return chest.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function pickChest(slot: number): Promise<ChestPickResult> {
    const r = await gamesApi.pickChest(slot);
    if (r.finished) {
      chest.value = chest.value ? { ...chest.value, round: null } : chest.value;
      await useAuthStore().fetchUser();
    }
    return r;
  }

  // --- Ride ---
  async function fetchRideInfo() {
    rideInfo.value = await gamesApi.getRideInfo();
    return rideInfo.value;
  }

  /** Start a run: paid with stars, or (only when the stars ran out) with an ad. */
  async function startRide(useAd = false) {
    isLoading.value = true;
    try {
      activeRun.value = useAd
        ? await withAd('RIDE_FREE', (id) => gamesApi.startRide(id))
        : await gamesApi.startRide();
      await useAuthStore().fetchUser();
      return activeRun.value;
    } finally {
      isLoading.value = false;
    }
  }

  async function finishRide(coins: number, score: number): Promise<RideFinishResult> {
    if (!activeRun.value) throw new Error('No active session');
    isLoading.value = true;
    try {
      const result = await gamesApi.finishRide(activeRun.value.runId, coins, score);
      activeRun.value = null;
      useAuthStore().updateUser({ coins: result.newBalance, bestRideScore: result.bestScore });
      await fetchRideInfo().catch(() => {});
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  // --- Gifts ---
  async function fetchGifts() {
    gifts.value = await gamesApi.getGifts();
  }

  async function sellGift(id: number) {
    isLoading.value = true;
    try {
      const r = await gamesApi.sellGift(id);
      useAuthStore().updateUser({ starsBalance: r.newBalance });
      await fetchGifts();
      return r;
    } finally {
      isLoading.value = false;
    }
  }

  async function claimGift(id: number) {
    isLoading.value = true;
    try {
      const g = await gamesApi.claimGift(id);
      await fetchGifts();
      return g;
    } finally {
      isLoading.value = false;
    }
  }

  // --- Tournaments ---
  async function fetchTournaments() {
    tournaments.value = await tournamentsApi.getTournaments();
    // the banner shows the one running now, else the next one that is coming
    activeTournament.value =
      tournaments.value.find((t) => t.status === 'ACTIVE') ?? tournaments.value.find((t) => t.status === 'SCHEDULED') ?? null;
  }

  async function joinTournament(id: number) {
    isLoading.value = true;
    try {
      await tournamentsApi.joinTournament(id);
      await Promise.all([fetchTournaments(), useAuthStore().fetchUser()]);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    spinTiers, spinLiveWins, lastSpinResult,
    chest, rideInfo, activeRun, gifts, tournaments, activeTournament,
    isLoading,
    fetchSpinTiers, fetchSpinLiveWins, playSpin,
    fetchChest, startChestRound, pickChest,
    fetchRideInfo, startRide, finishRide,
    fetchGifts, sellGift, claimGift,
    fetchTournaments, joinTournament,
  };
});
