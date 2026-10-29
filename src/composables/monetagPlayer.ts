import type { AdProviderRef } from '@/types'

/**
 * Monetag rewarded interstitial (Telegram Mini App SDK).
 * https://docs.monetag.com/docs/ad-integration/rewarded-interstitial/
 *
 * The SDK script defines `show_<zone>()`. We pass our proof id as `ymid`: Monetag sends it back to our server in its postback
 * (server to server), and only that makes the proof valid. The promise resolves when the ad is closed (an early close too), so
 * the app only checks that the event was paid; the server's wait (admin setting) covers the rest.
 */

const SDK_URL = 'https://libtl.com/sdk.js'
/** the promise of a show can hang when the ad never loads */
const SHOW_TIMEOUT_MS = 120_000

interface MonetagResult {
  reward_event_type?: string
}
type MonetagShow = (opts?: { ymid?: string; type?: 'preload' | 'pop'; requestVar?: string }) => Promise<MonetagResult | void>

const loaded = new Map<string, Promise<MonetagShow>>()

function loadMonetag(zone: string): Promise<MonetagShow> {
  const name = `show_${zone}`
  const w = window as unknown as Record<string, MonetagShow | undefined>
  const ready = w[name]
  if (ready) return Promise.resolve(ready)
  let p = loaded.get(zone)
  if (!p) {
    p = new Promise<MonetagShow>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SDK_URL
      s.async = true
      s.dataset.zone = zone
      s.dataset.sdk = name
      s.onload = () => {
        const fn = w[name]
        fn ? resolve(fn) : reject(new Error('Monetag missing'))
      }
      s.onerror = () => reject(new Error('Monetag failed to load'))
      document.head.appendChild(s)
    }).catch((e) => {
      loaded.delete(zone) // try again next time
      throw e
    })
    loaded.set(zone, p)
  }
  return p
}

const errText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e))

/** Shows one Monetag ad for the proof `ymid`. Resolves when it was shown and paid; throws when there was no ad. */
export async function playMonetag(ref: AdProviderRef, ymid: string): Promise<void> {
  if (!ref.zoneId) throw new Error('Monetag zone id missing')
  const show = await loadMonetag(ref.zoneId)
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('Monetag timeout')), SHOW_TIMEOUT_MS)
  })
  try {
    const run = async () => {
      await show({ type: 'preload', ymid }) // the same ymid for the preload and the show
      return show({ ymid, requestVar: 'reward' })
    }
    const res = await Promise.race([run(), timeout])
    // a resolved promise is not yet a paid view
    if (res && res.reward_event_type && res.reward_event_type !== 'valued') throw new Error('Monetag: not a paid view')
  } catch (e) {
    throw new Error(`Monetag: ${errText(e)}`)
  } finally {
    clearTimeout(timer)
  }
}
