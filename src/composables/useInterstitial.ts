import { ref } from 'vue'
import { getAdsConfig, reportInterstitial } from '@/api/ads'
import type { AdsConfig } from '@/types'
import { adBusy, loadSdk } from '@/composables/useAds'
import { markAd, msSinceLastAd, msSinceOpen } from '@/composables/adClock'

/**
 * Interstitial ads (Adsgram): a full-screen ad the player may close, shown in a natural pause (leaving a game).
 * Nothing is paid and the server keeps no state: the admin panel sets the block, the switch and the gap between ads
 * (ads.interstitial.*), and this file only asks "may I show one now?". Anything that goes wrong is silent, the game never waits for it.
 */

export const adsConfig = ref<AdsConfig | null>(null)
let fetchedAt = 0
let inflight: Promise<AdsConfig | null> | null = null
const REFRESH_MS = 60 * 1000 // a change in the admin panel reaches the players within a minute

/** The ads settings of the server (interstitial block and gap, the sponsored task). Cached for a few minutes. */
export function fetchAdsConfig(force = false): Promise<AdsConfig | null> {
  if (!force && adsConfig.value && Date.now() - fetchedAt < REFRESH_MS) return Promise.resolve(adsConfig.value)
  inflight ??= getAdsConfig()
    .then((c) => {
      adsConfig.value = c
      fetchedAt = Date.now()
      return c
    })
    .catch(() => adsConfig.value)
    .finally(() => {
      inflight = null
    })
  return inflight
}

/** For the simulator: forget the cached settings and any request still on its way. */
export function resetAdsConfig() {
  adsConfig.value = null
  fetchedAt = 0
  inflight = null
}

let showing = false
const silenced = new Set<string>()

/** Shows an interstitial when it is switched on, the first minutes have passed and the gap since the last ad is over. */
export async function maybeShowInterstitial(): Promise<boolean> {
  if (showing || adBusy.value || document.hidden) return false
  const cfg = (await fetchAdsConfig())?.interstitial
  if (!cfg?.enabled || !cfg.blockId) return false
  if (msSinceOpen() < cfg.firstAfterSeconds * 1000 || msSinceLastAd() < cfg.intervalSeconds * 1000) return false
  if (showing || adBusy.value) return false
  showing = true
  let outcome: 'shown' | 'failed' = 'shown'
  let detail = ''
  try {
    const sdk = await loadSdk()
    const ctrl = sdk.init({ blockId: cfg.blockId })
    if (!silenced.has(cfg.blockId)) {
      // Adsgram would pop up its own alert for "too many ads in a row", "session too long" and "no ad"; with a listener it stays quiet
      silenced.add(cfg.blockId)
      for (const ev of ['onNonStopShow', 'onTooLongSession', 'onBannerNotFound', 'onError']) ctrl.addEventListener?.(ev, () => {})
    }
    const res = await ctrl.show()
    detail = res?.description ?? ''
    return true
  } catch (e) {
    outcome = 'failed'
    detail = e instanceof Error ? e.message : JSON.stringify(e)
    return false // no ad, skipped or an error: all the same to the game
  } finally {
    showing = false
    markAd() // the gap starts now, also after a failure, so a missing ad is not asked for again and again
    void reportInterstitial(outcome, detail) // the owner sees in the server log why an ad did not appear
  }
}
