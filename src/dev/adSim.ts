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
  perDay: 3,
  used: 0,
  balance: 10000,
  goSeconds: 2, // how long the advertiser's step takes after "Go"
  callbackDelay: 1.5, // seconds from "Claim" until Adsgram's call reaches the server
  pending: 0, // completions the server heard about and nobody has claimed yet
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

  private click = () => {
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
      <p class="_title_mvcb7_76"><span class="_text_mvcb7_81">${this.state === 'loading' ? 'Loading…' : 'Join the Demo channel'}</span></p>
      <slot name="reward" style="grid-area:reward"></slot>
      <button class="_button_mvcb7_64">${slot ? `<slot name="${slot}"></slot>` : ''}</button></div>`
    root.querySelector('button')?.addEventListener('click', this.click)
  }
}

export function defineFakeElement() {
  if (!customElements.get('adsgram-task')) customElements.define('adsgram-task', FakeAdsgramTask)
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
    if (url === '/ads/config') {
      return ok({
        interstitial: { enabled: false, blockId: '', intervalSeconds: 180, firstAfterSeconds: 120 },
        task: { enabled: true, blockId: 'task-sim', coins: sim.coins, perDay: sim.perDay, usedToday: sim.used, left: Math.max(sim.perDay - sim.used, 0) },
      })
    }
    if (url === '/ads/task/claim') {
      if (sim.used >= sim.perDay) {
        simLog('server: claim refused, AD_LIMIT_REACHED')
        return fail('AD_LIMIT_REACHED', 'Daily limit reached, come back tomorrow')
      }
      if (sim.pending <= 0) {
        simLog('server: claim refused, AD_NOT_COMPLETED (Adsgram has not called yet)')
        return fail('AD_NOT_COMPLETED', 'Watch the ad to continue')
      }
      sim.pending--
      sim.used++
      sim.balance += sim.coins
      simLog(`server: claim paid +${sim.coins} coins (${sim.perDay - sim.used} left today)`)
      return ok({ coins: sim.coins, newBalance: sim.balance, left: sim.perDay - sim.used })
    }
    return fail('NOT_FOUND', `not simulated: ${url}`)
  }
  client.defaults.adapter = adapter
  return () => {
    client.defaults.adapter = original
  }
}
