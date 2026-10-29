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
/** the SDK script, the preload and the show can each hang when there is no ad: the next provider must not wait for minutes */
const LOAD_TIMEOUT_MS = 15_000
const PRELOAD_TIMEOUT_MS = 15_000
const SHOW_TIMEOUT_MS = 120_000 // includes the time the player watches the ad

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

/** rejects with "<what> timeout" when the promise has not settled in time (the reason shows in the server log) */
function within<T>(p: Promise<T>, ms: number, what: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${what} timeout`)), ms)
  })
  return Promise.race([p, late]).finally(() => clearTimeout(timer))
}

/** Shows one Monetag ad for the proof `ymid`. Resolves when it was shown and paid; throws when there was no ad. */
export async function playMonetag(ref: AdProviderRef, ymid: string): Promise<void> {
  if (!ref.zoneId) throw new Error('Monetag zone id missing')
  let stage = 'load'
  try {
    const show = await within(loadMonetag(ref.zoneId), LOAD_TIMEOUT_MS, 'load')
    stage = 'preload'
    await within(show({ type: 'preload', ymid }), PRELOAD_TIMEOUT_MS, 'preload') // the same ymid for the preload and the show
    stage = 'show'
    const res = await within(show({ ymid, requestVar: 'reward' }), SHOW_TIMEOUT_MS, 'show')
    // a resolved promise is not yet a paid view
    if (res && res.reward_event_type && res.reward_event_type !== 'valued') throw new Error('not a paid view')
  } catch (e) {
    throw new Error(`Monetag ${stage}: ${errText(e)}`)
  }
}
