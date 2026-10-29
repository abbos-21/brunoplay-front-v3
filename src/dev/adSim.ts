import { reactive } from 'vue'
import { AxiosError, type AxiosAdapter, type AxiosResponse } from 'axios'
import client from '@/api/client'
import { ADSGRAM_TASK_CSS } from './adsgramTaskCss'

/**
 * Development only (the page /dev/ad-sim, never in the production build): a pretend Adsgram Task element and a pretend server,
 * so the sponsored task card can be looked at and tried in every situation without Telegram, Adsgram or the backend.
 */

export type Scenario = 'normal' | 'slow' | 'never' | 'nobanner' | 'error'

export const sim = reactive({
  scenario: 'normal' as Scenario,
  coins: 2000,
  intervalMinutes: 480, // minutes between two paid tasks (can be a fraction: 0.2 = 12 s, to watch the card come back)
  lastPaidAt: null as number | null, // when the last task was paid (ms), null = never
  balance: 10000,
  longTitle: false, // a very long task title from Adsgram
  goSeconds: 2, // how long the advertiser's step takes after "Go"
  callbackDelay: 1.5, // seconds from "Claim" until Adsgram's call reaches the server
  pending: 0, // completions the server heard about and nobody has claimed yet
  popupOn: true, // Monetag popup task card switched on by the admin
  popupCoins: 1000,
  popupWait: 4, // seconds from Monetag's postback until the coins can be claimed (the admin's wait)
  popupLastPaidAt: null as number | null,
  popupProof: '', // the proof the server handed out
  popupConfirmedAt: null as number | null, // when Monetag's postback arrived
  log: [] as string[],
})

export function simLog(line: string) {
  sim.log.unshift(`${new Date().toLocaleTimeString()}  ${line}`)
  sim.log.length = Math.min(sim.log.length, 80)
}

const ICON =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50"><rect width="50" height="50" fill="#29b6f6"/><circle cx="25" cy="25" r="12" fill="#fff"/><path d="M19 25l4 4 8-9" stroke="#29b6f6" stroke-width="3" fill="none"/></svg>',
  )

type State = 'loading' | 'task' | 'doing' | 'claim' | 'done'

/** Behaves like Adsgram's <adsgram-task>: the same layout, the same slots (reward, button, claim, done) and the same events. */
class FakeAdsgramTask extends HTMLElement {
  private state: State = 'loading'
  private timers: number[] = []

  connectedCallback() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' })
    this.render()
    simLog(`<adsgram-task> asks Adsgram for a task (block ${this.getAttribute('data-block-id')})`)
    this.later(700, () => {
      if (sim.scenario === 'nobanner') return this.fire('onBannerNotFound', 'Adsgram has no task for this player')
      if (sim.scenario === 'error') return this.fire('onError', 'Adsgram failed')
      this.set('task')
    })
  }

  disconnectedCallback() {
    this.timers.forEach(clearTimeout)
  }

  private later(ms: number, fn: () => void) {
    this.timers.push(window.setTimeout(fn, ms))
  }
  private fire(name: string, note: string) {
    simLog(`event "${name}": ${note}`)
    this.dispatchEvent(new CustomEvent(name))
  }
  private set(s: State) {
    this.state = s
    this.render()
  }

  private press = () => {
    if (this.state === 'task') {
      simLog('player pressed Go: the advertiser page opens')
      this.set('doing')
      this.later(sim.goSeconds * 1000, () => {
        simLog('player came back: Adsgram checked the task, the Claim button appears')
        this.set('claim')
      })
    } else if (this.state === 'claim') {
      this.set('done')
      this.fire('reward', 'the player pressed Claim')
      if (sim.scenario === 'never') {
        simLog('(simulated) Adsgram never calls the server')
        return
      }
      const delay = sim.scenario === 'slow' ? 6 : sim.callbackDelay
      this.later(delay * 1000, () => {
        sim.pending++
        simLog(`Adsgram calls the server: task done (${delay}s after Claim)`)
      })
    }
  }

  private render() {
    const root = this.shadowRoot
    if (!root) return
    const slot = this.state === 'task' ? 'button' : this.state === 'claim' ? 'claim' : this.state === 'done' ? 'done' : ''
    root.innerHTML = `<style>${ADSGRAM_TASK_CSS}</style><div class="_task_mvcb7_1">
      <img class="_icon_mvcb7_52" src="${ICON}" alt="logo">
      <p class="_title_mvcb7_76"><span class="_text_mvcb7_81">${this.state === 'loading' ? 'Loading…' : sim.longTitle ? 'Join the Demo channel and get a really long title that goes on and on and on for several lines of text' : 'Join the Demo channel'}</span></p>
      <slot name="reward" style="grid-area:reward"></slot>
      <button class="_button_mvcb7_64">${slot ? `<slot name="${slot}"></slot>` : ''}</button></div>`
    root.querySelector('button')?.addEventListener('click', this.press)
  }
}

export function defineFakeElement() {
  if (!customElements.get('adsgram-task')) customElements.define('adsgram-task', FakeAdsgramTask)
}

/** A pretend Monetag SDK function for zone 12144526: like the real one it refuses a popup that does not come from a tap. */
export function defineFakeMonetag(): () => void {
  const w = window as unknown as Record<string, unknown>
  const name = 'show_12144526'
  w[name] = (opts?: { type?: string; ymid?: string }) => {
    if (opts?.type !== 'pop') return Promise.resolve()
    if (!navigator.userActivation?.isActive) {
      simLog("Monetag: refused, Ad can only be opened directly in response to a user's click")
      return Promise.reject(new Error("Ad can only be opened directly in response to a user's click"))
    }
    simLog(`Monetag: the offer page opens (ymid ${opts.ymid})`)
    window.setTimeout(() => {
      if (opts.ymid === sim.popupProof) {
        sim.popupConfirmedAt = Date.now()
        simLog('Monetag calls the server: postback valued')
      }
    }, 1500)
    return new Promise((resolve) => window.setTimeout(() => resolve({ reward_event_type: 'valued' }), 3000))
  }
  return () => {
    delete w[name]
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Answers the two calls the card makes (the ads settings and the claim) as the server would. Returns a function that puts the real client back. */
export function installFakeServer(): () => void {
  const original = client.defaults.adapter
  const adapter: AxiosAdapter = async (config) => {
    await sleep(150)
    const url = String(config.url)
    const ok = (data: unknown) => ({ data, status: 200, statusText: 'OK', headers: {}, config, request: {} }) as AxiosResponse
    const fail = (code: string, message: string): never => {
      throw new AxiosError(message, code, config, {}, { data: { error: { code, message } }, status: 409, statusText: 'Conflict', headers: {}, config } as AxiosResponse)
    }
    const waitMs = () => (sim.lastPaidAt === null ? 0 : Math.max(sim.lastPaidAt + sim.intervalMinutes * 60_000 - Date.now(), 0))
    const popupWaitMs = () => (sim.popupLastPaidAt === null ? 0 : Math.max(sim.popupLastPaidAt + sim.intervalMinutes * 60_000 - Date.now(), 0))
    if (url === '/ads/config') {
      return ok({
        popupTask: { enabled: sim.popupOn, provider: 'monetag', zoneId: '12144526', coins: sim.popupCoins, intervalMinutes: sim.intervalMinutes, waitSeconds: sim.popupWait, available: popupWaitMs() === 0, nextInSeconds: Math.ceil(popupWaitMs() / 1000) },
        interstitial: { enabled: false, blockId: '', intervalSeconds: 180, firstAfterSeconds: 120 },
        task: { enabled: true, blockId: 'task-sim', coins: sim.coins, intervalMinutes: sim.intervalMinutes, available: waitMs() === 0, nextInSeconds: Math.ceil(waitMs() / 1000) },
      })
    }
    if (url === '/ads/popup-task/prepare') {
      if (!sim.popupOn) return fail('AD_PLACEMENT_DISABLED', 'This option is switched off')
      if (popupWaitMs() > 0) return fail('AD_TASK_NOT_READY', 'The next sponsored task is not available yet')
      if (!sim.popupProof) {
        sim.popupProof = Math.random().toString(16).slice(2).padEnd(24, '0').slice(0, 24)
        sim.popupConfirmedAt = null
        simLog(`server: proof ${sim.popupProof} handed out`)
      }
      return ok({ adViewId: sim.popupProof, expiresAt: new Date(Date.now() + 900_000).toISOString(), completed: sim.popupConfirmedAt !== null })
    }
    if (url === '/ads/popup-task/claim') {
      if (popupWaitMs() > 0) return fail('AD_TASK_NOT_READY', 'The next sponsored task is not available yet')
      if (sim.popupConfirmedAt === null || Date.now() < sim.popupConfirmedAt + sim.popupWait * 1000) {
        simLog('server: popup claim refused, AD_NOT_COMPLETED (no postback yet, or the wait is not over)')
        return fail('AD_NOT_COMPLETED', 'Watch the ad to continue')
      }
      sim.popupProof = ''
      sim.popupConfirmedAt = null
      sim.popupLastPaidAt = Date.now()
      sim.balance += sim.popupCoins
      simLog(`server: popup claim paid +${sim.popupCoins} coins`)
      return ok({ coins: sim.popupCoins, newBalance: sim.balance, nextInSeconds: Math.round(sim.intervalMinutes * 60) })
    }
    if (url === '/ads/task/claim') {
      if (waitMs() > 0) {
        simLog('server: claim refused, AD_TASK_NOT_READY (the interval is not over)')
        return fail('AD_TASK_NOT_READY', 'The next sponsored task is not available yet')
      }
      if (sim.pending <= 0) {
        simLog('server: claim refused, AD_NOT_COMPLETED (Adsgram has not called yet)')
        return fail('AD_NOT_COMPLETED', 'Watch the ad to continue')
      }
      sim.pending--
      sim.lastPaidAt = Date.now()
      sim.balance += sim.coins
      simLog(`server: claim paid +${sim.coins} coins; the next task is allowed in ${sim.intervalMinutes} min`)
      return ok({ coins: sim.coins, newBalance: sim.balance, nextInSeconds: Math.round(sim.intervalMinutes * 60) })
    }
    return fail('NOT_FOUND', `not simulated: ${url}`)
  }
  client.defaults.adapter = adapter
  return () => {
    client.defaults.adapter = original
  }
}
