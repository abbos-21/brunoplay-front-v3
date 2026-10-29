import type { AdProviderRef } from '@/types'
import { reportInterstitial } from '@/api/ads'

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
const PRELOAD_TIMEOUT_MS = 8_000
const PRELOAD_TRIES = 2 // the first call after the SDK loads sometimes gets no answer
const SHOW_TIMEOUT_MS = 120_000 // includes the time the player watches the ad
const NOTHING_DRAWN_MS = 12_000

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

/** Watches the page for elements added by the SDK after show(). `noneIn(ms)` rejects when nothing was added in that time. */
function watchPage(onFirst: (tags: string) => void) {
  let seen = false
  let timer: ReturnType<typeof setTimeout> | undefined
  const obs = new MutationObserver((list) => {
    const tags = list.flatMap((m) => [...m.addedNodes]).filter((n): n is Element => n.nodeType === 1).map((n) => n.tagName.toLowerCase())
    if (!tags.length || seen) return
    seen = true
    onFirst([...new Set(tags)].slice(0, 6).join(','))
  })
  obs.observe(document.documentElement, { childList: true, subtree: true })
  return {
    noneIn: (ms: number) =>
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          if (!seen) reject(new Error('nothing was drawn'))
        }, ms)
      }),
    stop: () => {
      obs.disconnect()
      clearTimeout(timer)
    },
  }
}

/** Shows one Monetag ad for the proof `ymid`. Resolves when it was shown and paid; throws when there was no ad. */
export async function playMonetag(ref: AdProviderRef, ymid: string): Promise<void> {
  if (!ref.zoneId) throw new Error('Monetag zone id missing')
  const t0 = Date.now()
  // one line per step in the server log: it tells where an ad that never appears gets stuck
  const note = (what: string) => void reportInterstitial('shown', `monetag ${what} (+${Date.now() - t0}ms)`)
  let stage = 'load'
  try {
    const show = await within(loadMonetag(ref.zoneId), LOAD_TIMEOUT_MS, 'load')
    note('sdk ready')
    stage = 'preload'
    for (let attempt = 1; ; attempt++) {
      try {
        await within(show({ type: 'preload', ymid }), PRELOAD_TIMEOUT_MS, 'preload') // the same ymid for the preload and the show
        note(`preload ok, try ${attempt}`)
        break
      } catch (e) {
        note(`preload failed, try ${attempt}: ${errText(e)}`)
        if (attempt >= PRELOAD_TRIES) throw e
      }
    }
    stage = 'show'
    // the SDK draws the ad into the page: if nothing appears soon, it is not coming (a silent show() would hold the player for minutes)
    const drawn = watchPage((tags) => note(`page got ${tags}`))
    note('show called')
    let res: MonetagResult | void
    try {
      res = await within(
        Promise.race([show({ ymid, requestVar: 'reward' }), drawn.noneIn(NOTHING_DRAWN_MS)]),
        SHOW_TIMEOUT_MS,
        'show',
      )
    } finally {
      drawn.stop()
    }
    note(`show closed, ${res && res.reward_event_type ? res.reward_event_type : 'no result'}`)
    // a resolved promise is not yet a paid view
    if (res && res.reward_event_type && res.reward_event_type !== 'valued') throw new Error('not a paid view')
  } catch (e) {
    throw new Error(`Monetag ${stage}: ${errText(e)}`)
  }
}
