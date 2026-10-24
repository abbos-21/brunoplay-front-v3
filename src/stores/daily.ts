import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DailyComboStatus, ComboSubmitResult, ComboClaimResult, DailyActivityStatus } from '@/types'
import * as dailyApi from '@/api/daily'
import { useAuthStore } from './auth'
import { withAd } from '@/composables/useAds'
import { useToast } from '@/composables/useToast'
import { t } from '@/i18n'
const { show } = useToast()

export const useDailyStore = defineStore('daily', () => {
  const comboStatus = ref<DailyComboStatus | null>(null)
  const lastComboResult = ref<ComboSubmitResult | null>(null)
  const activityStatus = ref<DailyActivityStatus | null>(null)
  const isLoading = ref(false)

  async function fetchCombo() {
    comboStatus.value = await dailyApi.getDailyCombo()
  }

  /**
   * Try the combo. The first attempt of the day is free; every extra one needs an ad (the server counts them).
   * The best attempt of the day is what counts, and it is paid when the player claims it.
   */
  async function submitCombo(items: number[]) {
    isLoading.value = true
    try {
      const extra = comboStatus.value?.alreadyAttempted === true
      const result = extra
        ? await withAd('COMBO_EXTRA', (id) => dailyApi.submitDailyCombo(items, id))
        : await dailyApi.submitDailyCombo(items)
      lastComboResult.value = result
      await fetchCombo()
      return result
    } finally {
      isLoading.value = false
    }
  }

  /** Claim the combo reward (once a day, before the day ends). `double` shows an ad and pays twice. */
  async function claimCombo(double = false): Promise<ComboClaimResult> {
    isLoading.value = true
    try {
      const result = double
        ? await withAd('DOUBLE_COMBO', (id) => dailyApi.claimDailyCombo(true, id))
        : await dailyApi.claimDailyCombo(false)
      useAuthStore().updateUser({ coins: result.newBalance })
      await fetchCombo()
      show(t('Successfully claimed {n} coins!', { n: result.reward }), 'success')
      return result
    } finally {
      isLoading.value = false
    }
  }

  async function fetchActivity() {
    activityStatus.value = await dailyApi.getDailyActivityStatus()
  }

  /** Claim today's streak reward; `double` shows an ad and pays twice. */
  async function claimDaily(double = false) {
    isLoading.value = true
    try {
      const result = double
        ? await withAd('DOUBLE_STREAK', (id) => dailyApi.claimDailyReward(true, id))
        : await dailyApi.claimDailyReward(false)
      useAuthStore().updateUser({ coins: result.newBalance })
      await fetchActivity()
      show(t('Successfully claimed {n} coins!', { n: result.reward }), 'success')
      return result
    } finally {
      isLoading.value = false
    }
  }

  return {
    comboStatus,
    lastComboResult,
    activityStatus,
    isLoading,
    fetchCombo,
    submitCombo,
    claimCombo,
    fetchActivity,
    claimDaily,
  }
})
