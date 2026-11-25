import { computed, ref } from 'vue'
import { adsConfig } from '@/composables/useInterstitial'
import { loadSdk } from '@/composables/useAds'

/**
 * "Sponsored tasks are waiting": while the player may do a sponsored task AND Adsgram really has one for them, the Tasks tab shows the
 * red "!" (and the card itself carries one). Adsgram tells whether it has a task only when its element is started, so at launch a
 * hidden element asks it (probeSponsored): the "!" waits for the answer and never shows for a task that is not there. Opening the Tasks screen puts the one on the tab away until the next launch. After a paid task both go away and
 * come back when the interval set in the admin panel (ads.task.interval_minutes) is over.
 */
const NONE_KEY = 'sponsored-none-until'
const NONE_FOR_MS = 30 * 60 * 1000 // after "no task" the next launches do not announce one for this long
function noneStillValid(): boolean {
  try {
    return Number(localStorage.getItem(NONE_KEY) ?? 0) > Date.now()
  } catch {
    return false
  }
}

const looked = ref(false) // the player has seen the sponsored card in this launch
const hasTask = ref(false) // Adsgram showed a real task to this player (the hidden check or the card on the Tasks screen)
const unavailable = ref(noneStillValid()) // Adsgram has no task for this player right now: nothing to announce

/** the player may do a sponsored task now (the interval since the last paid one is over) */
export const sponsoredAvailable = computed(() => {
  const task = adsConfig.value?.task
  return !!task?.enabled && task.available && !unavailable.value
})

/** the "!" on the Tasks tab */
export const sponsoredWaiting = computed(() => sponsoredAvailable.value && hasTask.value && !looked.value)

export const markSponsoredSeen = () => {
  looked.value = true
}
/** a sponsored task was paid: when the interval is over the "!" comes back, even if the player has looked before */
export const markSponsoredPaid = () => {
  looked.value = false
  hasTask.value = false // the next task is checked again when the interval is over
}
export const markSponsoredUnavailable = () => {
  unavailable.value = true
  hasTask.value = false
  try {
    localStorage.setItem(NONE_KEY, String(Date.now() + NONE_FOR_MS))
  } catch {
    // storage blocked: the answer is only kept for this launch
  }
}
/** Adsgram really showed a task: it is worth announcing again */
export const markSponsoredReal = () => {
  unavailable.value = false
  hasTask.value = true
  try {
    localStorage.removeItem(NONE_KEY)
  } catch {
    // ignore
  }
}

/** For the simulator: forget what the player has seen, as at a fresh launch of the app. */
export function resetSponsoredAlert() {
  looked.value = false
  hasTask.value = false
  probing = false
  unavailable.value = false
  try {
    localStorage.removeItem(NONE_KEY)
  } catch {
    // ignore
  }
}

const PROBE_MS = 2500 // the same wait as the card: a task that stayed up this long is a real one
let probing = false

/**
 * Asks Adsgram, without showing anything, whether it has a task for this player: an Adsgram element is started out of sight and
 * listened to. "No task" (or an error) means nothing is announced (and nothing for the next 30 minutes); a task that stays up for a
 * moment means the "!" may show. Runs only when the server says a task may be done now, and never twice at the same time.
 */
export async function probeSponsored(blockId: string): Promise<void> {
  if (probing || hasTask.value || unavailable.value || !sponsoredAvailable.value || !blockId) return
  probing = true
  let host: HTMLElement | undefined
  try {
    await loadSdk()
    host = document.createElement('div')
    host.setAttribute('aria-hidden', 'true')
    host.style.cssText = 'position:fixed;left:-9999px;top:0;width:340px;height:80px;overflow:hidden;pointer-events:none;opacity:0'
    const node = document.createElement('adsgram-task')
    node.setAttribute('data-block-id', blockId)
    const answer = new Promise<boolean>((resolve) => {
      for (const ev of ['onBannerNotFound', 'onError', 'onTooLongSession']) node.addEventListener(ev, () => resolve(false))
      setTimeout(() => resolve(true), PROBE_MS) // no "no task" signal in time: a real task
    })
    host.append(node)
    document.body.append(host)
    if (await answer) markSponsoredReal()
    else markSponsoredUnavailable()
  } catch {
    // Adsgram could not load: the card on the Tasks screen decides, nothing is announced
  } finally {
    host?.remove()
    probing = false
  }
}
