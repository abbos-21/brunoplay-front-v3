import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { CardInfo, BoosterInfo, CardName, BoosterType, LevelInfo } from '@/types';
import * as shopApi from '@/api/shop';
import { setLevelReward } from '@/composables/useLevelUp';
import { useAuthStore } from './auth';
import { useFishingStore } from './fishing';

export const useShopStore = defineStore('shop', () => {
  const cards = ref<CardInfo[]>([]);
  const boosters = ref<BoosterInfo[]>([]);
  const levels = ref<LevelInfo[]>([]);
  const isLoading = ref(false);

  async function fetchCards() {
    cards.value = await shopApi.getCards();
  }

  async function fetchBoosters() {
    boosters.value = await shopApi.getBoosters();
  }

  async function fetchLevels() {
    levels.value = (await shopApi.getLevels()).levels;
  }

  async function upgradeCard(cardName: CardName) {
    isLoading.value = true;
    try {
      const result = await shopApi.upgradeCard(cardName);
      const auth = useAuthStore();
      // the server paid the level reward already; the balances in the answer are final
      if (result.levelUp) setLevelReward(result.rewardCoins, result.rewardStars);
      auth.updateUser({
        level: result.newUserLevel,
        coins: result.coins,
        starsBalance: result.stars,
        ...(cardName === 'MINING_RATE' ? { miningRateLevel: result.newLevel } : { coinCapacityLevel: result.newLevel }),
      });
      // a faster card changes the tank right away
      await Promise.all([fetchCards(), useFishingStore().fetchStatus()]);
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  async function purchaseBooster(type: BoosterType) {
    isLoading.value = true;
    try {
      const result = await shopApi.purchaseBooster(type);
      const auth = useAuthStore();
      await Promise.all([fetchBoosters(), auth.fetchUser(), useFishingStore().fetchStatus()]);
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  return { cards, boosters, levels, isLoading, fetchCards, fetchBoosters, fetchLevels, upgradeCard, purchaseBooster };
});
