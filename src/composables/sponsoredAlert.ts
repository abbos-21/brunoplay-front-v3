import { computed, ref } from 'vue'
import { t } from '@/i18n'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import { useToast } from '@/composables/useToast'

/**
 * "Sponsored tasks are waiting": while the player has sponsored tasks left today, the Tasks tab shows a badge and, once per launch of
 * the app, a toast says so. Opening the Tasks screen puts the badge away until the next launch.
 */
const looked = ref(false) // the player has seen the sponsored card in this launch
const unavailable = ref(false) // Adsgram has no task for this player right now: nothing to announce

/** how many sponsored tasks the player can still complete today */
export const sponsoredLeft = computed(() => {
  const task = adsConfig.value?.task
  return task?.enabled && !unavailable.value ? task.left : 0
})

/** the badge on the Tasks tab */
export const sponsoredWaiting = computed(() => sponsoredLeft.value > 0 && !looked.value)

export const markSponsoredSeen = () => {
  looked.value = true
}
export const markSponsoredUnavailable = () => {
  unavailable.value = true
}

let announced = false

/** For the simulator: forget what was announced, as at a fresh launch of the app. */
export function resetSponsoredAlert() {
  looked.value = false
  unavailable.value = false
  announced = false
}

/** At the start of the app: ask the server, and say once if sponsored tasks are waiting. */
export async function announceSponsored(): Promise<void> {
  const cfg = await fetchAdsConfig(true)
  if (announced || !cfg?.task.enabled || cfg.task.left <= 0) return
  announced = true
  useToast().show(t('Sponsored tasks: {n} left today. Open Tasks to get {coins} coins each.', { n: cfg.task.left, coins: cfg.task.coins.toLocaleString('en-US') }), 'info', 6000)
}
