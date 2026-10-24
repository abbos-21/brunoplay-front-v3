import { ref } from 'vue'
import bigWin from '@/assets/sounds/big-win.mp3?url'
import chestOpen from '@/assets/sounds/chest-open.mp3?url'
import coinDown from '@/assets/sounds/coin-down.mp3?url'
import coinUp from '@/assets/sounds/coin-up.mp3?url'
import error from '@/assets/sounds/error.mp3?url'
import levelUp from '@/assets/sounds/level-up.mp3?url'
import reveal from '@/assets/sounds/reveal.mp3?url'
import spinStart from '@/assets/sounds/spin-start.mp3?url'
import starDown from '@/assets/sounds/star-down.mp3?url'
import starUp from '@/assets/sounds/star-up.mp3?url'
import success from '@/assets/sounds/success.mp3?url'
import tap from '@/assets/sounds/tap.mp3?url'
import tick from '@/assets/sounds/tick.mp3?url'
import win from '@/assets/sounds/win.mp3?url'

/**
 * Short sound effects (Kenney, CC0). They go through the Web Audio API, which starts instantly and works in the
 * Telegram app on iPhones. The browser only lets sound start after a touch, so everything is prepared on the
 * first tap. Players can switch the effects off in the menu.
 */
const FILES = {
  tap,
  tick,
  coinUp,
  coinDown,
  starUp,
  starDown,
  spinStart,
  win,
  bigWin,
  levelUp,
  chestOpen,
  reveal,
  error,
  success,
}
export type SfxName = keyof typeof FILES

/** how loud each effect is (0 – 1) */
const LEVEL: Partial<Record<SfxName, number>> = { tap: 0.5, tick: 0.5, coinUp: 0.7, coinDown: 0.6, starDown: 0.6 }

const STORAGE_KEY = 'sfx'
function stored() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

/** true while sound effects are switched on */
export const sfxEnabled = ref(stored())

export function setSfxEnabled(on: boolean) {
  sfxEnabled.value = on
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
  } catch {
    // private mode: the choice lasts until the page is closed
  }
}

let ctx: AudioContext | null = null
const buffers = new Map<SfxName, AudioBuffer>()
let loading: Promise<void> | null = null

function context() {
  if (ctx) return ctx
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx = new Ctor()
  return ctx
}

function load(c: AudioContext) {
  loading ??= Promise.all(
    (Object.keys(FILES) as SfxName[]).map(async (name) => {
      try {
        const data = await (await fetch(FILES[name])).arrayBuffer()
        // the callback form also works on older iPhones
        buffers.set(
          name,
          await new Promise<AudioBuffer>((resolve, reject) => c.decodeAudioData(data, resolve, reject)),
        )
      } catch {
        // a missing effect is only silent
      }
    }),
  ).then(() => undefined)
  return loading
}

/** called on the first touch: wakes the audio up and loads the effects */
export function unlockSfx() {
  const c = context()
  if (!c) return
  if (c.state === 'suspended') void c.resume()
  void load(c)
}

const lastPlayed = new Map<SfxName, number>()

export function playSfx(name: SfxName, options: { volume?: number; rate?: number } = {}) {
  if (!sfxEnabled.value || !ctx || ctx.state !== 'running') return
  // two counters showing the same change should not play the same sound twice
  const now = performance.now()
  if (name !== 'tick' && now - (lastPlayed.get(name) ?? -1e9) < 120) return
  lastPlayed.set(name, now)
  const buffer = buffers.get(name)
  if (!buffer) return
  const source = ctx.createBufferSource()
  source.buffer = buffer
  if (options.rate) source.playbackRate.value = options.rate
  const gain = ctx.createGain()
  gain.gain.value = (options.volume ?? 1) * (LEVEL[name] ?? 1)
  source.connect(gain).connect(ctx.destination)
  source.start()
}

/** one-time setup: unlock on the first touch and tap sound on every button */
export function installSfx() {
  const first = () => {
    unlockSfx()
    window.removeEventListener('pointerdown', first, true)
  }
  window.addEventListener('pointerdown', first, true)
  document.addEventListener(
    'pointerdown',
    (e) => {
      const el = (e.target as Element | null)?.closest('button, a, [role="button"]')
      if (el && !(el as HTMLButtonElement).disabled) playSfx('tap')
    },
    true,
  )
  // the tab went to the background and came back
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && ctx?.state === 'suspended') void ctx.resume()
  })
}
