import { sfxEnabled } from '@/composables/useSfx'

/**
 * The three sounds of Bruno's Ride, played through the Web Audio API (starts instantly, works in Telegram on iPhones).
 * The engine hum loops and fades in and out; the crash and the coin pickup are one-shot.
 * Players who switched sound effects off in the menu hear nothing.
 */
export interface RideSoundUrls {
  engine: string
  crash: string
  collect: string
}

type Name = keyof RideSoundUrls

export class RideAudio {
  private ctx: AudioContext | null = null
  private buffers = new Map<Name, AudioBuffer>()
  private engine: { source: AudioBufferSourceNode; gain: GainNode } | null = null
  private hiddenListener = () => {
    if (!this.ctx) return
    if (document.visibilityState === 'hidden') void this.ctx.suspend()
    else if (this.engine || this.running) void this.ctx.resume()
  }
  private running = false

  constructor(private urls: RideSoundUrls) {
    document.addEventListener('visibilitychange', this.hiddenListener)
  }

  private context(): AudioContext | null {
    if (this.ctx) return this.ctx
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    this.ctx = new Ctor()
    return this.ctx
  }

  /** Download and decode the sounds (the context may still be asleep: decoding works anyway). Never throws: a missing sound is only silent. */
  async prepare(): Promise<void> {
    const c = this.context()
    if (!c) return
    await Promise.all(
      (Object.keys(this.urls) as Name[]).map(async (name) => {
        try {
          const data = await (await fetch(this.urls[name])).arrayBuffer()
          // the callback form also works on older iPhones
          this.buffers.set(name, await new Promise<AudioBuffer>((resolve, reject) => c.decodeAudioData(data, resolve, reject)))
        } catch {
          // silent
        }
      }),
    )
  }

  /** Call from a tap (the Play button): browsers only let sound start after a touch. */
  unlock() {
    this.running = true
    const c = this.context()
    if (c && c.state === 'suspended') void c.resume()
  }

  startEngine(fadeSeconds = 1.5, volume = 0.6) {
    const c = this.ctx
    const buffer = this.buffers.get('engine')
    if (!c || !buffer || !sfxEnabled.value) return
    this.stopEngine()
    const source = c.createBufferSource()
    source.buffer = buffer
    source.loop = true
    const gain = c.createGain()
    gain.gain.setValueAtTime(0, c.currentTime)
    gain.gain.linearRampToValueAtTime(volume, c.currentTime + fadeSeconds)
    source.connect(gain).connect(c.destination)
    source.start()
    this.engine = { source, gain }
  }

  fadeEngine(seconds: number) {
    const c = this.ctx
    if (!c || !this.engine) return
    const g = this.engine.gain.gain
    g.cancelScheduledValues(c.currentTime)
    g.setValueAtTime(g.value, c.currentTime)
    g.linearRampToValueAtTime(0, c.currentTime + seconds)
  }

  stopEngine() {
    if (!this.engine) return
    try {
      this.engine.source.stop()
    } catch {
      // already stopped
    }
    this.engine.source.disconnect()
    this.engine = null
  }

  play(name: Exclude<Name, 'engine'>, volume = 1) {
    const c = this.ctx
    const buffer = this.buffers.get(name)
    if (!c || !buffer || c.state !== 'running' || !sfxEnabled.value) return
    const source = c.createBufferSource()
    source.buffer = buffer
    const gain = c.createGain()
    gain.gain.value = volume
    source.connect(gain).connect(c.destination)
    source.start()
  }

  destroy() {
    document.removeEventListener('visibilitychange', this.hiddenListener)
    this.stopEngine()
    this.running = false
    if (this.ctx) void this.ctx.close().catch(() => undefined)
    this.ctx = null
    this.buffers.clear()
  }
}
