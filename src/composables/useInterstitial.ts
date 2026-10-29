import { ref } from 'vue'
import { getAdsConfig, reportInterstitial } from '@/api/ads'
import type { AdProviderRef, AdsConfig } from '@/types'
import { adBusy, loadSdk } from '@/composables/useAds'
import { markAd, msSinceLastAd, msSinceOpen } from '@/composables/adClock'
import { playMonetag } from '@/composables/monetagPlayer'

/**
 * Interstitial ads (Adsgram, Monetag: every provider switched on in the admin panel shows one, in the panel's priority order): a full-screen ad the player may close, shown in a natural pause (leaving a game).
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
      scheduleTaskReturn(c)
      return c
    })
    .catch(() => adsConfig.value)
    .finally(() => {
      inflight = null
    })
  return inflight
}

let returnTimer: ReturnType<typeof setTimeout> | undefined

/** While the interval between sponsored tasks runs, ask the server again the moment it ends: the card and the "!" come back by themselves. */
function scheduleTaskReturn(c: AdsConfig) {
  clearTimeout(returnTimer)
  if (!c.task.enabled || c.task.available || c.task.nextInSeconds <= 0) return
  returnTimer = setTimeout(() => void fetchAdsConfig(true), Math.min(c.task.nextInSeconds * 1000 + 1000, 2 ** 31 - 1))
}

/** For the simulator: forget the cached settings and any request still on its way. */
export function resetAdsConfig() {
  adsConfig.value = null
  fetchedAt = 0
  inflight = null
  clearTimeout(returnTimer)
}

let showing = false
const silenced = new Set<string>()

/** The Adsgram interstitial. Resolves when it was shown (also when the player closed it); throws when there was no ad. */
async function showAdsgram(blockId: string): Promise<string> {
  const sdk = await loadSdk()
  const ctrl = sdk.init({ blockId })
  if (!silenced.has(blockId)) {
    // Adsgram would pop up its own alert for "too many ads in a row", "session too long" and "no ad"; with a listener it stays quiet
    silenced.add(blockId)
    for (const ev of ['onNonStopShow', 'onTooLongSession', 'onBannerNotFound', 'onError']) ctrl.addEventListener?.(ev, () => {})
  }
  try {
    const res = await ctrl.show()
    return res?.description ?? ''
  } catch (e) {
    // Adsgram rejects with a result object when the player closed the ad (error: false): that ad was shown, no second one follows
    if ((e as { error?: boolean } | null)?.error === false) return 'closed by the player'
    throw e
  }
}

/** The interstitial providers to try (an older server only sends the Adsgram block). */
function providerList(cfg: NonNullable<AdsConfig['interstitial']>): AdProviderRef[] {
  if (cfg.providers) return cfg.providers
  return cfg.blockId ? [{ id: 'adsgram', blockId: cfg.blockId }] : []
}

/** Shows an interstitial when it is switched on, the first minutes have passed and the gap since the last ad is over. */
export async function maybeShowInterstitial(): Promise<boolean> {
  if (showing || adBusy.value || document.hidden) return false
  const cfg = (await fetchAdsConfig())?.interstitial
  const list = cfg?.enabled ? providerList(cfg) : []
  if (!cfg || !list.length) return false
  if (msSinceOpen() < cfg.firstAfterSeconds * 1000 || msSinceLastAd() < cfg.intervalSeconds * 1000) return false
  if (showing || adBusy.value) return false
  showing = true
  let shown = 0
  const details: string[] = []
  try {
    // every provider that is switched on shows its ad, one after the other in the admin's priority order; one that has no ad is skipped
    for (const ref of list) {
      try {
        if (ref.id === 'adsgram' && ref.blockId) details.push(await showAdsgram(ref.blockId))
        else if (ref.id === 'monetag') await playMonetag(ref)
        else continue // a provider this app version does not know
        shown++
      } catch (e) {
        details.push(`${ref.id}: ${e instanceof Error ? e.message : JSON.stringify(e)}`)
      }
    }
    return shown > 0 // no ad, skipped or an error: all the same to the game
  } finally {
    showing = false
    markAd() // the gap starts now, also after a failure, so a missing ad is not asked for again and again
    void reportInterstitial(shown > 0 ? 'shown' : 'failed', details.filter(Boolean).join('; ')) // the owner sees in the server log why an ad did not appear
  }
}
