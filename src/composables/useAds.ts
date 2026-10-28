import { ref } from 'vue'
import { requestAd, reportAdFailed } from '@/api/ads'
import { apiCode } from '@/api/client'
import type { AdPlacement, AdView } from '@/types'
import { t } from '@/i18n'
import { markAd } from '@/composables/adClock'

/**
 * Rewarded ads (Adsgram).
 *
 * The server hands out a proof (adViewId) for one action. The player watches the ad in the Adsgram SDK, Adsgram tells our
 * server it was watched (a server-to-server callback), and only then the server accepts the proof. The action is therefore
 * sent with the adViewId, and retried for a few seconds while the callback is still on its way.
 */

const SDK_URL = 'https://sad.adsgram.ai/js/sad.min.js'

interface AdsgramResult {
  done: boolean
  error: boolean
  description?: string
}
interface AdsgramController {
  show(): Promise<AdsgramResult>
  addEventListener?(event: string, cb: () => void): void
}
export interface AdsgramGlobal {
  init(opts: { blockId: string; debug?: boolean }): AdsgramController
}

/** Thrown when the player closed the ad before the end, or no ad could be shown. `message` is ready to show. */
export class AdError extends Error {
  constructor(
    message: string,
    public kind: 'skipped' | 'unavailable',
  ) {
    super(message)
  }
}

/** true while an ad is on screen (screens can dim their buttons) */
export const adBusy = ref(false)

let sdk: Promise<AdsgramGlobal> | null = null

export function loadSdk(): Promise<AdsgramGlobal> {
  const w = window as unknown as { Adsgram?: AdsgramGlobal }
  if (w.Adsgram) return Promise.resolve(w.Adsgram)
  if (!sdk) {
    sdk = new Promise<AdsgramGlobal>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SDK_URL
      s.async = true
      s.onload = () => (w.Adsgram ? resolve(w.Adsgram) : reject(new Error('Adsgram missing')))
      s.onerror = () => reject(new Error('Adsgram failed to load'))
      document.head.appendChild(s)
    }).catch((e) => {
      sdk = null // try again next time
      throw e
    })
  }
  return sdk
}

/** Shows the ad of a block. Resolves when it was watched to the end. */
async function playAd(blockId: string): Promise<void> {
  const g = await loadSdk()
  const ctrl = g.init({ blockId })
  let res: AdsgramResult
  try {
    res = await ctrl.show()
  } catch (e) {
    // Adsgram rejects with a result object when the ad was skipped or failed
    const r = e as Partial<AdsgramResult>
    if (r && r.error === false) throw new AdError(t('Watch the ad to the end to continue'), 'skipped')
    throw new Error(r?.description || 'Ad error')
  }
  if (!res.done) throw new AdError(t('Watch the ad to the end to continue'), 'skipped')
}

/**
 * Gets a usable proof for a placement: asks the server for one, shows the ad, and falls back to the server's
 * "ads are not loading" rule (only for fishing start/collect). Returns undefined when ads are not required at all.
 */
export async function showAd(placement: AdPlacement): Promise<string | undefined> {
  const view: AdView = await requestAd(placement)
  if (!view.required) return undefined // ads are switched off on the server: the action needs no proof
  if (view.skip) return view.adViewId // ads are off for this player: the proof is ready, no ad is shown
  adBusy.value = true
  try {
    await playAd(view.blockId)
    return view.adViewId
  } catch (e) {
    if (e instanceof AdError && e.kind === 'skipped') throw e
    // the SDK could not load or show an ad: tell the server (it may allow the action after a few failures in a row)
    try {
      const r = await reportAdFailed(placement)
      if (r.fallback && r.ad) return r.ad.adViewId
    } catch {
      // fall through to the error below
    }
    throw new AdError(t('No ad is available right now, try again in a moment'), 'unavailable')
  } finally {
    adBusy.value = false
    markAd() // an interstitial does not follow right after this ad
  }
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * Runs `action` after an ad. The action receives the proof (or undefined when no ad is required).
 * While Adsgram's callback has not reached the server yet the action answers AD_NOT_COMPLETED; that is retried briefly.
 */
export async function withAd<T>(placement: AdPlacement, action: (adViewId?: string) => Promise<T>): Promise<T> {
  const id = await showAd(placement)
  for (let attempt = 0; ; attempt++) {
    try {
      return await action(id)
    } catch (e) {
      if (id && apiCode(e) === 'AD_NOT_COMPLETED' && attempt < 12) {
        await wait(700)
        continue
      }
      throw e
    }
  }
}

export function useAds() {
  return { showAd, withAd, adBusy }
}
