import type { RideAudio } from './audio'

/**
 * Bruno's Ride: a small, purpose-built Canvas 2D game loop (it replaced the general game library, which drew everything with
 * an anti-aliased, full-density WebGL context and cost a cheap phone half its frames).
 *
 * The rules, speeds and sizes are exactly the ones the game always had, in a 480 x 854 world:
 *  - the car stays at x = 80 and jumps with gravity 2400 / jump 800 (a jump lasts 0.67 s and rises 133 px)
 *  - obstacles and coins scroll left at 400 px/s, +2 px/s for every second played
 *  - the first obstacle comes after 3 s, then one every 0.6 to 2.4 s, with a group of 1 to 5 coins in the gap
 *  - 60 points per second (the server checks results against this rate)
 *
 * Why it is fast:
 *  - the picture is drawn at the world's own size (at most 1.5x) instead of the screen's full density, and drops lower by itself
 *    when the phone cannot keep up
 *  - every sprite, the digits and the text are scaled once and drawn as plain copies; nothing is created per frame
 *  - the score and the coins are drawn inside the canvas, so the page's layout is never touched while playing
 *  - objects of the coin effect are reused, and the loop stops completely when the game is idle
 */

export const RIDE = {
  WIDTH: 480,
  HEIGHT: 854,
  FLOOR_HEIGHT: 210,
  OBSTACLE_HEIGHT: 80,
  COIN_WIDTH: 32,
  CAR_WIDTH: 64,
  CAR_X: 80,
  CAR_START_ABOVE_FLOOR: 128,
  JUMP_FORCE: 800,
  GRAVITY: 2400,
  MAX_FALL_SPEED: 2400,
  SPEED: 400,
  BG_SPEED: 400,
  ACCELERATION: 2,
  POINTS_PER_SECOND: 60,
  FIRST_OBSTACLE_AFTER: 3,
  GAP_MIN: 0.6,
  GAP_MAX: 2.4,
  CRASH_DELAY: 0.7,
} as const

export interface RideImages {
  car: HTMLImageElement
  background: HTMLImageElement
  obstacle: HTMLImageElement
  coin: HTMLImageElement
}

export interface RideHooks {
  /** the crash has played out: show the result */
  onCrash: (points: number, coins: number) => void
  /** texts for the score display (already translated) */
  labels: { score: string; coins: string }
}

type Mode = 'idle' | 'running'

interface Mover {
  x: number
  y: number // top-left for obstacles, centre for coins
}

interface Fx {
  kind: 'ring' | 'spark' | 'label'
  x: number
  y: number
  age: number
  angle: number
  dist: number
  size: number
  white: boolean
}

const FONT = '"Baloo 2", Nunito, sans-serif'
const FLOOR_Y = RIDE.HEIGHT - RIDE.FLOOR_HEIGHT
const JUMP_BUFFER = 0.1 // seconds

const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t)
const easeOutCubic = (t: number) => (t - 1) ** 3 + 1
const easeOutBack = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const rand = (a: number, b: number) => a + Math.random() * (b - a)

/** a copy of the picture at an exact size, scaled in halves so a big picture shrunk a lot stays smooth */
function scaled(img: HTMLImageElement | HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  let src: CanvasImageSource = img
  let sw = img instanceof HTMLImageElement ? img.naturalWidth : img.width
  let sh = img instanceof HTMLImageElement ? img.naturalHeight : img.height
  while (sw > w * 2 || sh > h * 2) {
    const nw = Math.max(w, Math.ceil(sw / 2))
    const nh = Math.max(h, Math.ceil(sh / 2))
    const step = document.createElement('canvas')
    step.width = nw
    step.height = nh
    const g = step.getContext('2d')!
    g.imageSmoothingQuality = 'high'
    g.drawImage(src, 0, 0, nw, nh)
    src = step
    sw = nw
    sh = nh
  }
  const out = document.createElement('canvas')
  out.width = Math.max(1, Math.round(w))
  out.height = Math.max(1, Math.round(h))
  const g = out.getContext('2d')!
  g.imageSmoothingQuality = 'high'
  g.drawImage(src, 0, 0, out.width, out.height)
  return out
}

export class RideGame {
  private ctx: CanvasRenderingContext2D
  private mode: Mode = 'idle'
  private raf = 0
  private last = 0
  private destroyed = false

  // picture sizes (the world is 480 x 854; `s` is how many canvas pixels one world unit takes)
  private s = 1
  private levels: number[]
  private level = 0
  private slowFrames = 0
  private frames = 0
  private frameTime = 0

  private bg!: HTMLCanvasElement
  private carImg!: HTMLCanvasElement
  private obstacleImg!: HTMLCanvasElement
  private coinImg!: HTMLCanvasElement
  private plusOne!: HTMLCanvasElement
  private digits!: HTMLCanvasElement
  private digitW = 0
  private digitH = 0
  private labelScore!: HTMLCanvasElement
  private labelCoins!: HTMLCanvasElement

  private carW = RIDE.CAR_WIDTH
  private carH: number
  private obstacleW: number
  private coinH: number

  // one run
  private carX: number = RIDE.CAR_X // the car stays here, except for a small push back when it hits an obstacle
  private carY = 0
  private carVy = 0
  private grounded = false
  private jumpBuffer = 0
  private points = 0
  private collected = 0
  private gameTime = 0
  private gameOver = false
  private crashTimer = 0
  private shake = 0
  private bgOffset = 0
  private spawnTimer = 0
  private obstacles: Mover[] = []
  private coins: Mover[] = []
  private fx: Fx[] = []
  private fxPool: Fx[] = []

  private onPointer = () => this.jump()
  private onKey = (e: KeyboardEvent) => {
    if (this.mode !== 'running') return
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault()
      this.jump()
    }
  }

  constructor(
    private canvas: HTMLCanvasElement,
    private images: RideImages,
    private audio: RideAudio,
    private hooks: RideHooks,
  ) {
    this.ctx = canvas.getContext('2d', { alpha: false })!
    this.carH = (RIDE.CAR_WIDTH * images.car.naturalHeight) / images.car.naturalWidth
    this.obstacleW = (RIDE.OBSTACLE_HEIGHT * images.obstacle.naturalWidth) / images.obstacle.naturalHeight
    this.coinH = (RIDE.COIN_WIDTH * images.coin.naturalHeight) / images.coin.naturalWidth
    const first = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1))
    this.levels = [first, Math.max(0.75, first * 0.7), 0.6]
    this.applyScale(this.levels[0] ?? 1)
    canvas.addEventListener('pointerdown', this.onPointer)
    window.addEventListener('keydown', this.onKey)
  }

  /** Waits for the game's font, then builds the game (the digits are drawn with it). */
  static async create(canvas: HTMLCanvasElement, images: RideImages, audio: RideAudio, hooks: RideHooks) {
    try {
      await document.fonts.load(`800 34px ${FONT}`)
      await document.fonts.load(`700 12px ${FONT}`)
    } catch {
      // the fallback font is fine
    }
    return new RideGame(canvas, images, audio, hooks)
  }

  /** Sets the canvas to `s` pixels per world unit and prepares every picture at that size. */
  private applyScale(s: number) {
    this.s = s
    const W = Math.round(RIDE.WIDTH * s)
    const H = Math.round(RIDE.HEIGHT * s)
    this.canvas.width = W
    this.canvas.height = H
    this.ctx = this.canvas.getContext('2d', { alpha: false })!
    const u = (v: number) => Math.round(v * s)
    this.bg = scaled(this.images.background, W, H)
    this.carImg = scaled(this.images.car, u(this.carW), u(this.carH))
    this.obstacleImg = scaled(this.images.obstacle, u(this.obstacleW), u(RIDE.OBSTACLE_HEIGHT))
    this.coinImg = scaled(this.images.coin, u(RIDE.COIN_WIDTH), u(this.coinH))
    this.buildTexts()
    if (this.mode === 'idle') this.drawIdle()
  }

  /** The "+1", the ten digits and the two captions are drawn once (with their outlines) and then only copied. */
  private buildTexts() {
    const s = this.s
    const make = (w: number, h: number) => {
      const c = document.createElement('canvas')
      c.width = Math.ceil(w)
      c.height = Math.ceil(h)
      return c
    }
    // "+1": brown outline, gold fill
    {
      const size = 34 * s
      const c = make(size * 1.9, size * 1.5)
      const g = c.getContext('2d')!
      g.font = `800 ${size}px ${FONT}`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.lineJoin = 'round'
      g.lineWidth = 6 * s
      g.strokeStyle = 'rgb(85,42,15)'
      g.strokeText('+1', c.width / 2, c.height / 2)
      g.fillStyle = 'rgb(255,226,90)'
      g.fillText('+1', c.width / 2, c.height / 2)
      this.plusOne = c
    }
    // digits 0-9, white with the dark outline, in cells of one width so a number never wiggles
    {
      const size = 30 * s
      const probe = make(10, 10).getContext('2d')!
      probe.font = `800 ${size}px ${FONT}`
      let maxW = 0
      for (let d = 0; d < 10; d++) maxW = Math.max(maxW, probe.measureText(String(d)).width)
      this.digitW = Math.ceil(maxW + 2.5 * s)
      this.digitH = Math.ceil(size * 1.35)
      const c = make(this.digitW * 10, this.digitH)
      const g = c.getContext('2d')!
      g.font = `800 ${size}px ${FONT}`
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      g.lineJoin = 'round'
      g.lineWidth = 3 * s
      g.strokeStyle = '#3b2412'
      g.fillStyle = '#fff'
      for (let d = 0; d < 10; d++) {
        g.strokeText(String(d), d * this.digitW + this.digitW / 2, this.digitH / 2)
        g.fillText(String(d), d * this.digitW + this.digitW / 2, this.digitH / 2)
      }
      this.digits = c
    }
    const caption = (text: string) => {
      const size = 13 * s
      const probe = make(10, 10).getContext('2d')!
      probe.font = `700 ${size}px ${FONT}`
      const w = probe.measureText(text.toUpperCase()).width + 6 * s
      const c = make(w, size * 1.5)
      const g = c.getContext('2d')!
      g.font = `700 ${size}px ${FONT}`
      g.textBaseline = 'middle'
      g.lineJoin = 'round'
      g.lineWidth = 2.5 * s
      g.strokeStyle = '#3b2412'
      g.strokeText(text.toUpperCase(), 3 * s, c.height / 2)
      g.fillStyle = 'rgba(255,255,255,0.85)'
      g.fillText(text.toUpperCase(), 3 * s, c.height / 2)
      return c
    }
    this.labelScore = caption(this.hooks.labels.score)
    this.labelCoins = caption(this.hooks.labels.coins)
  }

  // ---------------------------------------------------------------- control

  /** The backdrop behind the menu: the road, not moving. The loop is stopped. */
  showIdle() {
    this.mode = 'idle'
    cancelAnimationFrame(this.raf)
    this.raf = 0
    this.audio.stopEngine()
    this.drawIdle()
  }

  /** Begins a run. */
  start() {
    if (this.destroyed) return
    this.mode = 'running'
    this.carY = RIDE.HEIGHT - RIDE.FLOOR_HEIGHT - RIDE.CAR_START_ABOVE_FLOOR // it drops onto the road at the start
    this.carX = RIDE.CAR_X
    this.carVy = 0
    this.grounded = false
    this.jumpBuffer = 0
    this.points = 0
    this.collected = 0
    this.gameTime = 0
    this.gameOver = false
    this.crashTimer = 0
    this.shake = 0
    this.bgOffset = 0
    this.spawnTimer = RIDE.FIRST_OBSTACLE_AFTER
    this.obstacles.length = 0
    this.coins.length = 0
    this.releaseFx()
    this.frames = 0
    this.frameTime = 0
    this.audio.startEngine(1.5, 0.6)
    cancelAnimationFrame(this.raf)
    this.last = performance.now()
    this.raf = requestAnimationFrame(this.frame)
  }

  destroy() {
    this.destroyed = true
    cancelAnimationFrame(this.raf)
    this.canvas.removeEventListener('pointerdown', this.onPointer)
    window.removeEventListener('keydown', this.onKey)
    this.audio.stopEngine()
  }

  private jump() {
    if (this.mode !== 'running' || this.gameOver) return
    if (this.grounded) {
      this.carVy = -RIDE.JUMP_FORCE
      this.grounded = false
    } else {
      // a tap just before landing still counts: on a slow phone the tap often arrives a moment early
      this.jumpBuffer = JUMP_BUFFER
    }
  }

  // ---------------------------------------------------------------- the loop

  private frame = (now: number) => {
    if (this.destroyed || this.mode !== 'running') return
    // a long gap (the app was in the background) is played as one short step, so nothing jumps or falls through the road
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000))
    const rawMs = now - this.last
    this.last = now
    if (dt > 0) {
      // small steps keep the physics the same at 30, 60 or 120 frames a second
      const steps = Math.ceil(dt / (1 / 120))
      const h = dt / steps
      for (let i = 0; i < steps; i++) this.step(h)
      this.tickEffects(dt)
      if (this.mode !== 'running') return // the crash is over: the result screen is showing the plain road
    }
    this.draw()
    this.watchSpeed(rawMs)
    if (this.mode === 'running') this.raf = requestAnimationFrame(this.frame)
  }

  private currentSpeed() {
    return RIDE.SPEED + this.gameTime * RIDE.ACCELERATION
  }

  private step(dt: number) {
    if (!this.gameOver) {
      // road
      this.bgOffset -= RIDE.BG_SPEED * dt
      if (this.bgOffset <= -RIDE.WIDTH) this.bgOffset += RIDE.WIDTH
      // obstacles and coins
      const v = this.currentSpeed() * dt
      for (const o of this.obstacles) o.x -= v
      for (const c of this.coins) c.x -= v
      while (this.obstacles[0] && this.obstacles[0].x < -200) this.obstacles.shift()
      while (this.coins[0] && this.coins[0].x < -200) this.coins.shift()
      // score
      this.gameTime += dt
      this.points += RIDE.POINTS_PER_SECOND * dt
      // spawn
      this.spawnTimer -= dt
      if (this.spawnTimer <= 0) this.spawnObstacle()
    }

    // the car
    this.carVy = Math.min(RIDE.MAX_FALL_SPEED, this.carVy + RIDE.GRAVITY * dt)
    this.carY += this.carVy * dt
    if (this.carY + this.carH >= FLOOR_Y) {
      this.carY = FLOOR_Y - this.carH
      if (this.carVy > 0) this.carVy = 0
      this.grounded = true
    } else {
      this.grounded = false
    }
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= dt
      if (this.grounded && !this.gameOver) {
        this.carVy = -RIDE.JUMP_FORCE
        this.grounded = false
        this.jumpBuffer = 0
      }
    }

    if (this.gameOver) this.pushOutOfObstacles()
    else this.collide()
  }

  /**
   * After a crash the obstacle is still solid: the car is pushed out of it the shorter way (back, or up so it rests on top),
   * and the road keeps pulling it down. Without this the car sank into the obstacle while the crash played out.
   */
  private pushOutOfObstacles() {
    for (const o of this.obstacles) {
      const overlapX = this.carX + this.carW - o.x
      const overlapY = this.carY + this.carH - o.y
      if (overlapX <= 0 || overlapY <= 0) continue
      if (this.carX >= o.x + this.obstacleW || this.carY >= o.y + RIDE.OBSTACLE_HEIGHT) continue
      if (overlapY <= overlapX) {
        this.carY -= overlapY
        if (this.carVy > 0) this.carVy = 0
        this.grounded = true
      } else {
        this.carX -= overlapX
      }
    }
  }

  private spawnObstacle() {
    const timeToNext = rand(RIDE.GAP_MIN, RIDE.GAP_MAX)
    this.spawnTimer += timeToNext
    this.obstacles.push({ x: RIDE.WIDTH, y: FLOOR_Y - RIDE.OBSTACLE_HEIGHT })

    const totalGap = this.currentSpeed() * timeToNext
    const safety = 160 // keep coins away from the obstacles so you are not mid-jump
    const usable = totalGap - safety * 2
    if (usable > 50) {
      let n = 1 + Math.floor(Math.random() * 5)
      const spacing = 55
      let group = (n - 1) * spacing
      while (group > usable && n > 0) {
        n--
        group = (n - 1) * spacing
      }
      if (n > 0) {
        const startX = RIDE.WIDTH + safety + rand(0, usable - group)
        for (let i = 0; i < n; i++) this.coins.push({ x: startX + i * spacing, y: FLOOR_Y - 64 })
      }
    }
  }

  private collide() {
    const cx = this.carX
    const cy = this.carY
    const cw = this.carW
    const ch = this.carH
    for (const o of this.obstacles) {
      const ow = this.obstacleW
      const oh = RIDE.OBSTACLE_HEIGHT
      if (cx < o.x + ow && cx + cw > o.x && cy < o.y + oh && cy + ch > o.y) {
        this.crash()
        return
      }
    }
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i]!
      const hw = RIDE.COIN_WIDTH / 2
      const hh = this.coinH / 2
      if (cx < c.x + hw && cx + cw > c.x - hw && cy < c.y + hh && cy + ch > c.y - hh) {
        this.coins.splice(i, 1)
        this.collected++
        this.audio.play('collect')
        this.spawnCoinEffect(c.x, c.y)
      }
    }
  }

  private crash() {
    this.gameOver = true
    this.shake = 16
    this.crashTimer = RIDE.CRASH_DELAY
    this.audio.play('crash')
    this.audio.fadeEngine(0.8)
    this.pushOutOfObstacles()
  }

  private tickEffects(dt: number) {
    for (let i = this.fx.length - 1; i >= 0; i--) {
      const f = this.fx[i]!
      f.age += dt
      const life = f.kind === 'ring' ? 0.36 : f.kind === 'spark' ? 0.52 : 0.72
      if (f.age >= life) {
        this.fxPool.push(f)
        this.fx[i] = this.fx[this.fx.length - 1]!
        this.fx.pop()
      }
    }
    if (this.gameOver) {
      this.shake += (0 - this.shake) * Math.min(1, 5 * dt)
      this.crashTimer -= dt
      if (this.crashTimer <= 0 && this.mode === 'running') {
        const points = Math.floor(this.points)
        const coins = this.collected
        this.showIdle()
        this.hooks.onCrash(points, coins)
      }
    }
  }

  // ---------------------------------------------------------------- the coin effect (ring, sparkles, "+1")

  private newFx(kind: Fx['kind'], x: number, y: number): Fx {
    const f = this.fxPool.pop() ?? { kind, x, y, age: 0, angle: 0, dist: 0, size: 0, white: false }
    f.kind = kind
    f.x = x
    f.y = y
    f.age = 0
    f.angle = 0
    f.dist = 0
    f.size = 0
    f.white = false
    this.fx.push(f)
    return f
  }

  private releaseFx() {
    for (const f of this.fx) this.fxPool.push(f)
    this.fx.length = 0
  }

  private spawnCoinEffect(x: number, y: number) {
    this.newFx('ring', x, y)
    for (let i = 0; i < 7; i++) {
      const f = this.newFx('spark', x, y)
      f.angle = (i / 7) * Math.PI * 2 + rand(-0.3, 0.3)
      f.dist = rand(34, 60)
      f.size = rand(2.5, 4.5)
      f.white = i % 2 === 1
    }
    this.newFx('label', x, y - 8)
  }

  // ---------------------------------------------------------------- drawing

  private drawRoad(offset: number) {
    const ctx = this.ctx
    const w = this.bg.width
    const x = Math.round(offset * this.s)
    ctx.drawImage(this.bg, x, 0)
    if (x + w < this.canvas.width) ctx.drawImage(this.bg, x + w, 0)
  }

  private drawIdle() {
    this.drawRoad(0)
  }

  private draw() {
    const ctx = this.ctx
    const s = this.s
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    let ox = 0
    let oy = 0
    if (this.shake > 0.4) {
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
      ox = Math.round(rand(-this.shake, this.shake) * s)
      oy = Math.round(rand(-this.shake, this.shake) * s)
      ctx.setTransform(1, 0, 0, 1, ox, oy)
    }

    this.drawRoad(this.bgOffset)

    for (const o of this.obstacles) ctx.drawImage(this.obstacleImg, Math.round(o.x * s), Math.round(o.y * s))
    const hw = RIDE.COIN_WIDTH / 2
    const hh = this.coinH / 2
    for (const c of this.coins) ctx.drawImage(this.coinImg, Math.round((c.x - hw) * s), Math.round((c.y - hh) * s))
    ctx.drawImage(this.carImg, Math.round(this.carX * s), Math.round(this.carY * s))

    for (const f of this.fx) this.drawFx(f)

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.globalAlpha = 1
    this.drawHud()
  }

  private drawFx(f: Fx) {
    const ctx = this.ctx
    const s = this.s
    if (f.kind === 'ring') {
      const t = clamp01(f.age / 0.35)
      const r = 10 * (0.4 + 2.2 * easeOutQuad(t))
      ctx.globalAlpha = 0.7 * (1 - t)
      ctx.fillStyle = 'rgb(255,235,140)'
      ctx.beginPath()
      ctx.arc(f.x * s, f.y * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    } else if (f.kind === 'spark') {
      const e = easeOutQuad(clamp01(f.age / 0.5))
      const x = f.x + Math.cos(f.angle) * f.dist * e
      const y = f.y + Math.sin(f.angle) * f.dist * e + 24 * e * e
      ctx.globalAlpha = 1 - e
      ctx.fillStyle = f.white ? '#fff' : 'rgb(255,214,64)'
      ctx.beginPath()
      ctx.arc(x * s, y * s, f.size * s, 0, Math.PI * 2)
      ctx.fill()
    } else {
      const sc = f.age < 0.22 ? 0.2 + 0.8 * easeOutBack(f.age / 0.22) : 1
      const y = f.y - 56 * easeOutCubic(clamp01(f.age / 0.7))
      ctx.globalAlpha = f.age < 0.385 ? 1 : Math.max(0, 1 - (f.age - 0.385) / 0.315)
      const w = this.plusOne.width * sc
      const h = this.plusOne.height * sc
      ctx.drawImage(this.plusOne, f.x * s - w / 2, y * s - h / 2, w, h)
    }
    ctx.globalAlpha = 1
  }

  private drawNumber(value: number, x: number, y: number, align: 'left' | 'right') {
    const ctx = this.ctx
    const text = String(value)
    const total = text.length * this.digitW
    let px = align === 'left' ? x : x - total
    for (let i = 0; i < text.length; i++) {
      const d = text.charCodeAt(i) - 48
      ctx.drawImage(this.digits, d * this.digitW, 0, this.digitW, this.digitH, Math.round(px), Math.round(y), this.digitW, this.digitH)
      px += this.digitW
    }
  }

  private drawHud() {
    const ctx = this.ctx
    const s = this.s
    const pad = 12 * s
    ctx.drawImage(this.labelScore, Math.round(pad), Math.round(10 * s))
    this.drawNumber(Math.floor(this.points), pad, 22 * s, 'left')
    ctx.drawImage(this.labelCoins, Math.round(this.canvas.width - pad - this.labelCoins.width + 3 * s), Math.round(10 * s))
    this.drawNumber(this.collected, this.canvas.width - pad, 22 * s, 'right')
    // the little coin icon sits left of the coin count
    const icon = Math.round(24 * s)
    const digits = String(this.collected).length * this.digitW
    ctx.drawImage(this.coinImg, Math.round(this.canvas.width - pad - digits - icon - 2 * s), Math.round(22 * s + (this.digitH - icon) / 2), icon, icon)
  }

  // ---------------------------------------------------------------- keeping up on slow phones

  /** If the phone cannot hold about 60 frames a second, draw a little smaller (at most twice). Smaller pictures cost far less to paint. */
  private watchSpeed(ms: number) {
    if (this.level >= this.levels.length - 1 || ms > 120) return
    this.frames++
    if (this.frames <= 30) return // warm-up: the first frames include setting everything up
    this.frameTime += ms
    if (this.frames - 30 < 45) return
    const avg = this.frameTime / 45
    this.frames = 0
    this.frameTime = 0
    if (avg > 19.5) {
      this.level++
      this.applyScale(this.levels[this.level] ?? 1)
    }
  }
}
