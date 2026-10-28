import type { AdProviderRef } from '@/types'

/**
 * TADS rewarded ads (Fullscreen banner widget).
 * https://tads.gitbook.io/docs/getting-started/publishers/embed-widget/vanilla-js
 *
 * `showAd()` opens the fullscreen banner; `onShowReward` fires once the whole ad was watched. As with every provider the browser
 * is not trusted: TADS also calls our server (webhook), and only that makes the proof valid.
 */

const SDK_URL = 'https://w.tads.me/widget.js'
/** how long we wait for the reward after the banner is on screen (TADS tells nothing when the player closes it early) */
const REWARD_WAIT_MS = 60_000

interface TadsController {
  showAd(): Promise<unknown>
}
interface TadsGlobal {
  init(opts: {
    widgetId: number
    type: 'fullscreen'
    debug: boolean
    onShowReward: (adId?: unknown) => void
    onAdsNotFound: () => void
  }): TadsController
}

/** The player closed the ad before the end (not a failure of the provider). */
export class TadsSkipped extends Error {}

let sdk: Promise<TadsGlobal> | null = null

function loadSdk(): Promise<TadsGlobal> {
  const w = window as unknown as { tads?: TadsGlobal }
  if (w.tads) return Promise.resolve(w.tads)
  if (!sdk) {
    sdk = new Promise<TadsGlobal>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = SDK_URL
      s.async = true
      s.onload = () => (w.tads ? resolve(w.tads) : reject(new Error('TADS missing')))
      s.onerror = () => reject(new Error('TADS failed to load'))
      document.head.appendChild(s)
    }).catch((e) => {
      sdk = null // try again next time
      throw e
    })
  }
  return sdk
}

/** the callbacks of the ad on screen right now (a controller is created once per widget) */
let current: { reward: () => void; none: () => void } | null = null
const controllers = new Map<string, TadsController>()

function controller(g: TadsGlobal, ref: AdProviderRef): TadsController {
  const key = `${ref.widgetId}:${ref.debug ? 1 : 0}`
  let c = controllers.get(key)
  if (!c) {
    c = g.init({
      widgetId: Number(ref.widgetId),
      type: 'fullscreen',
      debug: !!ref.debug,
      onShowReward: () => current?.reward(),
      onAdsNotFound: () => current?.none(),
    })
    controllers.set(key, c)
  }
  return c
}

/** Shows one TADS ad. Resolves when it was watched to the end; throws TadsSkipped if the player left, any other error if there was no ad. */
export async function playTads(ref: AdProviderRef): Promise<void> {
  if (!ref.widgetId) throw new Error('TADS widget id missing')
  const g = await loadSdk()
  const c = controller(g, ref)
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      current = null
      reject(new TadsSkipped('closed'))
    }, REWARD_WAIT_MS)
    const done = (fn: () => void) => {
      clearTimeout(timer)
      current = null
      fn()
    }
    current = { reward: () => done(resolve), none: () => done(() => reject(new Error('No TADS ads'))) }
    c.showAd().catch((e: unknown) => done(() => reject(e instanceof Error ? e : new Error(String(e)))))
  })
}
