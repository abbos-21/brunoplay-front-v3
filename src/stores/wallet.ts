import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { WithdrawalInfo, Withdrawal, TopupPacks, TopupOrder } from '@/types';
import * as walletApi from '@/api/wallet';
import { useAuthStore } from './auth';

export const useWalletStore = defineStore('wallet', () => {
  const withdrawalInfo = ref<WithdrawalInfo | null>(null);
  const withdrawals = ref<Withdrawal[]>([]);
  const withdrawalsPage = ref(1);
  const withdrawalsTotalPages = ref(1);
  const packs = ref<TopupPacks | null>(null);
  const isLoading = ref(false);

  // --- withdrawals ---
  async function fetchWithdrawalInfo() {
    withdrawalInfo.value = await walletApi.getWithdrawalInfo();
  }

  async function fetchWithdrawals(page = 1) {
    const data = await walletApi.getWithdrawalHistory(page);
    withdrawals.value = data.data ?? [];
    withdrawalsPage.value = data.page;
    withdrawalsTotalPages.value = data.totalPages;
  }

  async function createWithdrawal(address: string, amountCoins: number) {
    isLoading.value = true;
    try {
      const result = await walletApi.createWithdrawal(address, amountCoins);
      const auth = useAuthStore();
      await Promise.all([auth.fetchUser(), fetchWithdrawals(), fetchWithdrawalInfo()]);
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  /** Take a waiting request back: the coins return to the balance. */
  async function cancelWithdrawal(id: number) {
    isLoading.value = true;
    try {
      const result = await walletApi.cancelWithdrawal(id);
      await Promise.all([useAuthStore().fetchUser(), fetchWithdrawals(withdrawalsPage.value), fetchWithdrawalInfo()]);
      return result;
    } finally {
      isLoading.value = false;
    }
  }

  // --- stars top-up ---
  async function fetchPacks() {
    packs.value = await walletApi.getTopupPacks();
    return packs.value;
  }

  async function createTelegramInvoice(packStars: number): Promise<TopupOrder> {
    return walletApi.createTelegramInvoice(packStars);
  }

  async function createTonOrder(packStars: number): Promise<TopupOrder> {
    return walletApi.createTonOrder(packStars);
  }

  /**
   * Wait for the server to confirm a payment (Telegram and the TON network tell it asynchronously), then refresh the balance.
   * Resolves with the final order (PAID, EXPIRED, ...) or the last one seen when the time is up.
   */
  async function waitForOrder(id: string, timeoutMs = 120_000): Promise<TopupOrder> {
    const started = Date.now();
    let order = await walletApi.getTopupOrder(id);
    while (order.status === 'PENDING' && Date.now() - started < timeoutMs) {
      await new Promise((r) => setTimeout(r, 3000));
      order = await walletApi.getTopupOrder(id);
    }
    if (order.status === 'PAID') await useAuthStore().fetchUser();
    return order;
  }

  async function init() {
    await Promise.all([fetchWithdrawalInfo(), fetchWithdrawals()]);
  }

  return {
    withdrawalInfo, withdrawals, withdrawalsPage, withdrawalsTotalPages, packs, isLoading,
    fetchWithdrawalInfo, fetchWithdrawals, createWithdrawal, cancelWithdrawal,
    fetchPacks, createTelegramInvoice, createTonOrder, waitForOrder, init,
  };
});
