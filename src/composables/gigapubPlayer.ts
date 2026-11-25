import type { AdProviderRef } from '@/types'
import { reportAdDone } from '@/api/ads'

/**
 * GigaPub rewarded video (https://docs.giga.pub/integration-guide.html).
 *
 * The script https://ad.gigapub.tech/script?id=<app id> defines `window.showGiga(placement?)`: a promise that resolves when the ad
 * was watched and rejects when there was no ad or it failed. GigaPub sends our server no notice, so after the promise resolves the
 * app reports the finished ad (POST /ads/done) and the server accepts it only when the least time an ad takes has passed since the
 * proof was requested (admin: Ads page, GigaPub, "Least seconds an ad takes"); the app waits for the rest of that time first.
 *
 * The script is loaded when the first ad is asked for, from the main server and, when it does not answer in time, from the backup one.
 */

const SERVERS = ['https://ad.gigapub.tech', 'https://ru-ad.gigapub.tech']
const LOAD_TIMEOUT_MS = 15_000 // per server
const SHOW_TIMEOUT_MS = 120_000 // includes the time the player watches the ad

type GigaShow = (placement?: string) => Promise<unknown>

const loaded = new Map<string, Promise<GigaShow>>()

function loadFrom(server: string, appId: string): Promise<GigaShow> {
  const w = window as unknown as { showGiga?: GigaShow }
  return new Promise<GigaShow>((resolve, reject) => {
    const s = document.createElement('script')
    s.async = true
    s.src = `${server}/script?id=${encodeURIComponent(appId)}`
    const timer = setTimeout(() => {
      s.onload = s.onerror = null
      s.remove()
      reject(new Error('GigaPub load timeout'))
    }, LOAD_TIMEOUT_MS)
    s.onload = () => {
      clearTimeout(timer)
      w.showGiga ? resolve(w.showGiga) : reject(new Error('GigaPub missing'))
    }
    s.onerror = () => {
      clearTimeout(timer)
      reject(new Error('GigaPub failed to load'))
    }
    document.head.appendChild(s)
  })
}

export function loadGigaPub(appId: string): Promise<GigaShow> {
  const w = window as unknown as { showGiga?: GigaShow }
  if (w.showGiga) return Promise.resolve(w.showGiga)
  let p = loaded.get(appId)
  if (!p) {
    p = (async () => {
      let last: unknown = new Error('GigaPub failed to load')
      for (const server of SERVERS) {
        try {
          return await loadFrom(server, appId)
        } catch (e) {
          last = e
        }
      }
      throw last
    })().catch((e) => {
      loaded.delete(appId) // try again next time
      throw e
    })
    loaded.set(appId, p)
  }
  return p
}

const errText = (e: unknown) => (e instanceof Error ? e.message : typeof e === 'string' ? e : JSON.stringify(e))
const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

/** Shows one GigaPub ad for the proof. Resolves when it was watched and the server took the report; throws when there was no ad. */
export async function playGigaPub(ref: AdProviderRef, adViewId: string): Promise<void> {
  if (!ref.projectId) throw new Error('GigaPub app id missing')
  const started = Date.now()
  let stage = 'load'
  try {
    const show = await loadGigaPub(ref.projectId)
    stage = 'show'
    let timer: ReturnType<typeof setTimeout> | undefined
    const late = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error('show timeout')), SHOW_TIMEOUT_MS)
    })
    try {
      await Promise.race([ref.placement ? show(ref.placement) : show(), late])
    } finally {
      clearTimeout(timer)
    }
    stage = 'report'
    // the server refuses the report of an ad that took less than the least time: wait for the rest of it
    if (ref.waitSeconds) await wait(Math.max(0, ref.waitSeconds * 1000 - (Date.now() - started)) + 300)
    if (!(await reportAdDone(adViewId, 'gigapub'))) throw new Error('the server did not take the report')
  } catch (e) {
    throw new Error(`GigaPub ${stage}: ${errText(e)}`)
  }
}
