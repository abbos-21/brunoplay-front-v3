import { computed, ref } from 'vue'
import { adsConfig } from '@/composables/useInterstitial'

/**
 * "Sponsored tasks are waiting": while the player has sponsored tasks left today, the Tasks tab shows the red "!" (and the card itself
 * carries one). Opening the Tasks screen puts the one on the tab away until the next launch.
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

/** For the simulator: forget what the player has seen, as at a fresh launch of the app. */
export function resetSponsoredAlert() {
  looked.value = false
  unavailable.value = false
}
