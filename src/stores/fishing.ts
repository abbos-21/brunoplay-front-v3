import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { FishingStatus } from '@/types';
import * as fishingApi from '@/api/fishing';
import { withAd } from '@/composables/useAds';
import { useAuthStore } from './auth';

/**
 * The tank. The server sends a snapshot (what was in the tank at `serverTime` and how fast it fills); the app animates
 * it locally with `liveTank` and asks for a fresh snapshot when the app opens, after each action, on focus and now and then.
 */
export const useFishingStore = defineStore('fishing', () => {
  const status = ref<FishingStatus | null>(null);
  const isLoading = ref(false);
  // client clock at the moment the snapshot arrived, and a ticking "now" that the live values depend on
  const receivedAt = ref(Date.now());
  const now = ref(Date.now());

  const isFishing = computed(() => status.value?.isFishing ?? false);
  const capacity = computed(() => status.value?.tankCapacity ?? 0);

  /** coins in the tank right now (the snapshot plus the time since it arrived) */
  const liveTank = computed(() => {
    const s = status.value;
    if (!s) return 0;
    if (!s.isFishing) return s.tankCoins;
    const elapsed = Math.max(0, (now.value - receivedAt.value) / 1000);
    let coins = s.tankCoins;
    const change = s.nextRateChange;
    if (change) {
      // the rate switches once (a booster starts or ends): seconds between the snapshot and the switch
      const untilChange = Math.max(0, (new Date(change.at).getTime() - new Date(s.serverTime).getTime()) / 1000);
      const before = Math.min(elapsed, untilChange);
      coins += before * s.effectiveMiningRate + (elapsed - before) * change.ratePerSecond;
    } else {
      coins += elapsed * s.effectiveMiningRate;
    }
    return Math.min(s.tankCapacity, coins);
  });

  const isComplete = computed(() => isFishing.value && capacity.value > 0 && liveTank.value >= capacity.value - 1e-9);
  const tankPercent = computed(() => (capacity.value > 0 ? Math.min(100, (liveTank.value / capacity.value) * 100) : 0));

  /** the least the tank must hold before the coins can be collected */
  const collectMin = computed(() => {
    const s = status.value;
    if (!s) return 0;
    return Math.max((s.tankCapacity * s.collectMinPercent) / 100, s.collectMinCoins);
  });
  const canCollect = computed(() => isFishing.value && liveTank.value >= collectMin.value && liveTank.value >= 1);

  function setStatus(s: FishingStatus) {
    status.value = s;
    receivedAt.value = Date.now();
    now.value = receivedAt.value;
  }

  let timer: ReturnType<typeof setInterval> | null = null;
  let refreshTimer: ReturnType<typeof setInterval> | null = null;
  let users = 0;

  /**
   * A fresh snapshot, then the balances (in this order: with Autocollect, reading the snapshot is what collects a full tank,
   * so the balance must be read after it).
   */
  async function refresh() {
    await fetchStatus();
    await useAuthStore().fetchUser();
  }

  function onVisible() {
    if (document.visibilityState === 'visible') refresh();
  }

  /** Start animating the tank (call from the Home screen; returns the stop function). */
  function startTicker(): () => void {
    users++;
    if (users === 1) {
      timer = setInterval(() => (now.value = Date.now()), 250);
      refreshTimer = setInterval(refresh, 30_000);
      document.addEventListener('visibilitychange', onVisible);
    }
    return () => {
      users = Math.max(0, users - 1);
      if (users === 0) {
        if (timer) clearInterval(timer);
        if (refreshTimer) clearInterval(refreshTimer);
        timer = refreshTimer = null;
        document.removeEventListener('visibilitychange', onVisible);
      }
    };
  }

  const autoCollect = computed(() => status.value?.autoCollect ?? false);

  // Autocollect: the moment the tank is full the server collects it and starts the next one. Ask for it right away so the coins
  // arrive in the balance (with the +N animation) and the tank starts over, instead of waiting for the next periodic refresh.
  let settling = false;
  async function settleAuto() {
    if (settling) return;
    settling = true;
    try {
      for (let attempt = 0; attempt < 6; attempt++) {
        await new Promise((r) => setTimeout(r, attempt === 0 ? 400 : 1500));
        await refresh();
        if (!(isComplete.value && autoCollect.value)) break;
      }
    } finally {
      settling = false;
    }
  }
  watch(
    () => isComplete.value && autoCollect.value,
    (full) => {
      if (full) void settleAuto();
    },
  );

  async function fetchStatus() {
    try {
      setStatus(await fishingApi.getFishingStatus());
    } catch {
      // ignore: the last snapshot keeps animating
    }
  }

  /** Start fishing (the player watches an ad first). */
  async function start() {
    isLoading.value = true;
    try {
      setStatus(await withAd('FISHING_START', (id) => fishingApi.startFishing(id)));
    } finally {
      isLoading.value = false;
    }
  }

  /** Collect the coins (an ad first). The session ends; starting again needs another ad. */
  async function collect() {
    isLoading.value = true;
    try {
      const result = await withAd('COLLECT', (id) => fishingApi.collectCoins(id));
      const auth = useAuthStore();
      auth.updateUser({ coins: result.newBalance });
      await fetchStatus();
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    status, isLoading, isFishing, isComplete, autoCollect, canCollect, collectMin, liveTank, tankPercent,
    fetchStatus, refresh, start, collect, startTicker,
  };
});
