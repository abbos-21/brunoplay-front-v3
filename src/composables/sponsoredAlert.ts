import { computed, ref } from 'vue'
import { adsConfig } from '@/composables/useInterstitial'

/**
 * "Sponsored tasks are waiting": while the player may do a sponsored task, the Tasks tab shows the red "!" (and the card itself
 * carries one). Opening the Tasks screen puts the one on the tab away until the next launch. After a paid task both go away and
 * come back when the interval set in the admin panel (ads.task.interval_minutes) is over.
 */
const looked = ref(false) // the player has seen the sponsored card in this launch
const unavailable = ref(false) // Adsgram has no task for this player right now: nothing to announce

/** the player may do a sponsored task now (the interval since the last paid one is over) */
export const sponsoredAvailable = computed(() => {
  const task = adsConfig.value?.task
  return !!task?.enabled && task.available && !unavailable.value
})

/** the "!" on the Tasks tab */
export const sponsoredWaiting = computed(() => sponsoredAvailable.value && !looked.value)

export const markSponsoredSeen = () => {
  looked.value = true
}
/** a sponsored task was paid: when the interval is over the "!" comes back, even if the player has looked before */
export const markSponsoredPaid = () => {
  looked.value = false
}
export const markSponsoredUnavailable = () => {
  unavailable.value = true
}

/** For the simulator: forget what the player has seen, as at a fresh launch of the app. */
export function resetSponsoredAlert() {
  looked.value = false
  unavailable.value = false
}
