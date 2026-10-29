import { reactive } from 'vue'
import { claimPopupTask } from '@/api/ads'
import { apiCode } from '@/api/client'
import type { SponsoredClaim } from '@/types'
import type { MonetagShow } from '@/composables/monetagPlayer'

/**
 * The state of the Monetag popup task. It lives here, not in the card, so that it survives the player leaving the Tasks screen while
 * the offer is being confirmed: the coins still arrive (and the message shows) wherever the player is in the app.
 */

const CLAIM_EVERY_MS = 3000
const CLAIM_FOR_MS = 90_000 // after the tap
const CLAIM_BACK_MS = 45_000 // after the player came back to the game
/** Monetag's postback needs a moment on top of the admin's wait: the countdown shows both */
const POSTBACK_MS = 2000

export const popupTask = reactive({
  show: null as MonetagShow | null, // Monetag's function for the zone, loaded ahead of the tap
  proof: '', // the proof the next tap will use
  busy: false, // the offer was opened: Monetag's postback is awaited and the coins are claimed
  tapAt: 0,
  totalMs: 0, // how long the confirmation takes at least
  now: Date.now(), // ticks while busy, for the countdown
})

/** what the screen does with the outcome (the card gives toasts and the balance update) */
export interface PopupHandlers {
  paid(r: SponsoredClaim): void
  failed(e: unknown): void
  timedOut(): void
}

let handlers: PopupHandlers | null = null
let run = 0 // only the newest claim loop goes on
let deadline = 0 // when the claim loop gives up
let ticker: ReturnType<typeof setInterval> | undefined

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

function stopTicker() {
  clearInterval(ticker)
  ticker = undefined
}

/** milliseconds left of the confirmation (0 = the time is over, the answer of Monetag is still awaited) */
export const popupLeftMs = () => (popupTask.busy ? Math.max(0, popupTask.tapAt + popupTask.totalMs - popupTask.now) : 0)
/** 0..1: how far the confirmation has come */
export const popupProgress = () => (popupTask.busy && popupTask.totalMs ? Math.min(1, (popupTask.now - popupTask.tapAt) / popupTask.totalMs) : 0)

/** The tap happened: start the countdown (`waitSeconds` is the admin's wait after Monetag's postback). */
export function popupStarted(waitSeconds: number) {
  popupTask.busy = true
  popupTask.tapAt = Date.now()
  popupTask.now = popupTask.tapAt
  popupTask.totalMs = waitSeconds * 1000 + POSTBACK_MS
  stopTicker()
  ticker = setInterval(() => (popupTask.now = Date.now()), 250)
}

/** Monetag reported a problem with the open (an error, or an unpaid event): only a late postback can still save it, so give up soon. */
export function popupSoon(ms: number) {
  // never before the countdown is over: the postback may have arrived long ago and the coins only wait for the admin's wait
  deadline = Math.min(deadline, Math.max(Date.now(), popupTask.tapAt + popupTask.totalMs) + ms)
}

/** The popup could not be opened (not from a tap): stop everything. */
export function popupAborted() {
  run++
  popupTask.busy = false
  stopTicker()
}

/** Asks for the coins until Monetag's postback has arrived (AD_NOT_COMPLETED), for at most `forMs`. */
export async function claimPopup(id: string, forMs: number, h: PopupHandlers) {
  handlers = h
  const mine = ++run
  deadline = Date.now() + forMs
  try {
    while (mine === run) {
      try {
        const r = await claimPopupTask(id)
        popupTask.proof = ''
        h.paid(r)
        return
      } catch (e) {
        if (apiCode(e) !== 'AD_NOT_COMPLETED') throw e
        if (Date.now() > deadline) {
          h.timedOut()
          return
        }
        await wait(CLAIM_EVERY_MS)
      }
    }
  } catch (e) {
    h.failed(e)
  } finally {
    if (mine === run) {
      popupTask.busy = false
      stopTicker()
    }
  }
}

/** the first tap: asks for the coins for a while */
export const claimAfterTap = (id: string, h: PopupHandlers) => claimPopup(id, CLAIM_FOR_MS, h)
/** the proof was already confirmed (the player left and came back): the coins only have to be claimed */
export const claimConfirmed = (id: string, h: PopupHandlers) => claimPopup(id, CLAIM_BACK_MS, h)

// the player comes back from the offer page (the phone may have paused the timers): look for the coins again for a while
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && popupTask.busy && popupTask.proof && handlers) void claimPopup(popupTask.proof, CLAIM_BACK_MS, handlers)
  })
}
