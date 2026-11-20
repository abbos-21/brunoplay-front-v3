import { defineStore } from 'pinia';
import { ref } from 'vue';
import type {
  SpinTierInfo, SpinResult, LiveWin, RouletteInfo, ChestState, ChestPickResult, RideInfo, RideRun, RideFinishResult,
  PlayerGift, Tournament, User,
} from '@/types';
import * as gamesApi from '@/api/games';
import * as tournamentsApi from '@/api/tournaments';
import * as userApi from '@/api/user';
import { withAd } from '@/composables/useAds';
import { useAuthStore } from './auth';

export const useGamesStore = defineStore('games', () => {
  // Spin
  const spinTiers = ref<SpinTierInfo[]>([]);
  const spinLiveWins = ref<LiveWin[]>([]);
  const rouletteLiveWins = ref<LiveWin[]>([]);
  const lastSpinResult = ref<SpinResult | null>(null);
  const roulette = ref<RouletteInfo | null>(null);

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

  // --- The balance is not a spoiler ---
  // The server has already paid the prize when the answer arrives, but the player must not see it before the reel / wheel / chest has
  // shown it. So the price is taken off the balance at once, and the real balance (the prize included) is kept back until the view calls
  // settleBalance() at the moment the prize is revealed.
  let held: Partial<User> | null = null;

  /** show the price as spent, keep the rest of the new balance back */
  function holdBalance(final: Partial<User>, spent: number) {
    const auth = useAuthStore();
    held = final;
    if (auth.user && spent > 0) auth.updateUser({ starsBalance: Math.max(0, auth.user.starsBalance - spent) });
  }

  /** the prize has been shown: now the balance may change (safe to call any time, also twice) */
  function settleBalance() {
    if (!held) return;
    useAuthStore().updateUser(held);
    held = null;
  }

  // --- Spin ---
  async function fetchSpinTiers() {
    spinTiers.value = await gamesApi.getSpinTiers();
  }

  /** the latest big wins of everybody (page 1 of the winners list) */
  // --- Roulette ---
  async function fetchRoulette() {
    roulette.value = await gamesApi.getRoulette();
    return roulette.value;
  }

  async function spinRoulette() {
    isLoading.value = true;
    try {
      const result = await gamesApi.spinRoulette();
      holdBalance({ starsBalance: result.stars, coins: result.coins }, result.spent);
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchSpinLiveWins() {
    spinLiveWins.value = (await gamesApi.getSpinWinners(1)).data ?? [];
  }

  /** the latest wins of the Roulette only */
  async function fetchRouletteLiveWins() {
    rouletteLiveWins.value = (await gamesApi.getSpinWinners(1, 'roulette')).data ?? [];
  }

  async function playSpin(tier: string, count: number) {
    isLoading.value = true;
    try {
      const result = await gamesApi.playSpin(tier, count);
      lastSpinResult.value = result;
      const auth = useAuthStore();
      const price = (spinTiers.value.find((x) => x.tier === tier)?.costStars ?? 0) * count;
      const spent = result.spent ?? price;
      try {
        // the whole new balance of the player (the prizes included), kept back until the wheel has stopped
        holdBalance(await userApi.getMe(), spent);
      } catch {
        if (typeof result.stars === 'number') holdBalance({ starsBalance: result.stars }, spent);
        else await auth.fetchUser();
      }
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
      // the prizes are paid now, but shown only when the chests have been opened (the view settles the balance then)
      try {
        holdBalance(await userApi.getMe(), 0);
      } catch {
        await useAuthStore().fetchUser();
      }
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
    spinTiers, spinLiveWins, rouletteLiveWins, lastSpinResult, roulette, settleBalance,
    chest, rideInfo, activeRun, gifts, tournaments, activeTournament,
    isLoading,
    fetchSpinTiers, fetchSpinLiveWins, fetchRouletteLiveWins, playSpin, fetchRoulette, spinRoulette,
    fetchChest, startChestRound, pickChest,
    fetchRideInfo, startRide, finishRide,
    fetchGifts, sellGift, claimGift,
    fetchTournaments, joinTournament,
  };
});
