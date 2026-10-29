import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { FriendsStats, ReferralInfo, RewardTier } from '@/types';
import * as friendsApi from '@/api/friends';

const PAGE_SIZE = 20;

export const useFriendsStore = defineStore('friends', () => {
  const inviteLink = ref('');
  const botLink = ref('');
  const stats = ref<FriendsStats | null>(null);
  const friends = ref<ReferralInfo[]>([]);
  const rewardTiers = ref<RewardTier[]>([]);
  const friendsPage = ref(1);
  const total = ref(0);
  const topupPercent = ref(0);
  const friendsTotalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)));

  /** One call fills the whole page (numbers, the list of the page, reward tiers and the invite links). */
  async function fetchFriends(page = 1) {
    const data = await friendsApi.getFriends(page);
    stats.value = data.stats;
    friends.value = data.friends ?? [];
    rewardTiers.value = data.rewards ?? [];
    topupPercent.value = data.topupPercent ?? 0;
    inviteLink.value = data.links?.inviteLink ?? '';
    botLink.value = data.links?.botLink ?? '';
    friendsPage.value = data.page;
    total.value = data.total;
  }

  async function init() {
    await fetchFriends(1);
  }

  return { inviteLink, botLink, stats, friends, rewardTiers, topupPercent, friendsPage, friendsTotalPages, fetchFriends, init };
});
