<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import kaboom, { type KaboomCtx } from 'kaboom'
import { CoinImage } from '@/assets/images'
import { StarIcon } from '@/assets/svgs'
import {
  CarSprite,
  RideBackground,
  ObstacleSprite,
  CollectSound,
  CrashSound,
  EngineSound,
} from '@/assets/ride'
import { useGamesStore } from '@/stores/games'
import { useToast } from '@/composables/useToast'
import { useMusic } from '@/composables/useMusic'
import { apiMessage } from '@/composables/apiError'
import { isApiDisabled } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { useTopUp } from '@/composables/useTopUp'
import { AdError } from '@/composables/useAds'
import { t } from '@/i18n'

const router = useRouter()
const games = useGamesStore()
const toast = useToast()
const music = useMusic()
const auth = useAuthStore()
const topUp = useTopUp()

/* =======================
   ENTRY: every run costs stars (there are no free runs)
   The price matches the server's default; the server checks it again when the run starts.
======================= */
const RUN_COST = computed(() => games.rideInfo?.runCostStars ?? 1)
const hasStars = computed(() => !auth.user || auth.user.starsBalance >= RUN_COST.value)
// when the stars ran out the server may offer a run for an ad (a few per day)
const adRun = computed(() => !hasStars.value && games.rideInfo?.adOffered === true)
const canPlay = computed(() => hasStars.value || adRun.value)

/* =======================
   GAME CONFIG (same values as the original runner)
======================= */
const CONFIG = {
  WIDTH: 480,
  HEIGHT: 854,

  FLOOR_HEIGHT: 210,
  OBSTACLE_HEIGHT: 80,

  COIN_WIDTH: 32,

  JUMP_FORCE: 800,
  GRAVITY: 2400,

  SPEED: 400,
  BG_SPEED: 400,
  ACCELERATION: 2,

  POINTS_PER_SECOND: 60,
}

/* =======================
   UI STATE
======================= */
type Phase = 'loading' | 'menu' | 'playing' | 'over' | 'error'
const phase = ref<Phase>('loading')
const starting = ref(false)
const score = ref(0)
const coins = ref(0)
const best = ref(Number(localStorage.getItem('ride-best') || 0))
const newBest = ref(false)
const saving = ref(false)

const host = ref<HTMLDivElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)

let k: KaboomCtx | null = null
let sessionId: string | null = null
let musicWasPlaying = false

/** Called by the game scene when the car hits an obstacle. */
async function finish(finalScore: number, finalCoins: number) {
  score.value = finalScore
  coins.value = finalCoins
  newBest.value = finalScore > best.value
  if (newBest.value) {
    best.value = finalScore
    try {
      localStorage.setItem('ride-best', String(finalScore))
    } catch {
      // storage unavailable
    }
  }
  phase.value = 'over'

  // pay out the coins (needs the session the server opened when the run started)
  if (sessionId && !isApiDisabled) {
    saving.value = true
    try {
      const r = await games.finishRide(finalCoins, finalScore)
      if (r.capped) toast.show(t('Daily coin limit reached, come back tomorrow'), 'info')
      if (r.bestScore > best.value) best.value = r.bestScore
    } catch (e) {
      toast.show(apiMessage(e, 'Could not save your result'), 'error')
    } finally {
      saving.value = false
    }
  }
  sessionId = null
}

async function play() {
  if (!k || starting.value) return
  if (!canPlay.value) return
  starting.value = true
  try {
    if (!isApiDisabled) {
      const run = await games.startRide(adRun.value)
      sessionId = run ? String(run.runId) : null
      if (!sessionId) throw new Error('no session')
    }
    score.value = 0
    coins.value = 0
    phase.value = 'playing'
    k.go('game')
    canvas.value?.focus()
  } catch (e) {
    toast.show(e instanceof AdError ? e.message : apiMessage(e, 'Could not start the game'), e instanceof AdError ? 'warning' : 'error')
  } finally {
    starting.value = false
  }
}

function leave() {
  router.push('/games')
}

/* =======================
   MOUNT
======================= */
onMounted(async () => {
  if (!canvas.value || !host.value) return
  // price, daily limits and the best score live on the server
  if (!isApiDisabled) {
    games
      .fetchRideInfo()
      .then((i) => {
        if (i.bestScore > best.value) best.value = i.bestScore
      })
      .catch(() => {})
  }

  // the page background music would clash with the engine sound
  musicWasPlaying = music.isPlaying.value
  if (musicWasPlaying) music.pause()

  k = kaboom({
    canvas: canvas.value,
    root: host.value,
    global: false,
    width: CONFIG.WIDTH,
    height: CONFIG.HEIGHT,
    background: [255, 255, 255],
    stretch: true,
    letterbox: true,
    touchToMouse: true,
    debug: false,
  })
  const kk = k

  /* ---- ASSETS ---- */
  try {
    await Promise.all([
      kk.loadSprite('player', CarSprite),
      kk.loadSprite('background', RideBackground),
      kk.loadSprite('ice', ObstacleSprite),
      kk.loadSprite('coin', CoinImage),
      kk.loadSound('crash', CrashSound),
      kk.loadSound('bg', EngineSound),
      kk.loadSound('collect', CollectSound),
    ])
  } catch {
    phase.value = 'error'
    return
  }

  /* ---- IDLE SCENE (backdrop behind the menu) ---- */
  kk.scene('idle', () => {
    kk.add([kk.sprite('background', { width: kk.width(), height: kk.height() })])
  })

  /* ---- GAME SCENE ---- */
  kk.scene('game', () => {
    kk.setGravity(CONFIG.GRAVITY)

    let points = 0
    let collected = 0
    let gameTime = 0
    let gameOver = false

    /* music */
    const engine = kk.play('bg', { loop: true, volume: 0 })
    kk.tween(0, 0.6, 1.5, (v) => (engine.volume = v))
    kk.onSceneLeave(() => engine.stop())

    /* background (two tiles scrolling left) */
    for (let i = 0; i < 2; i++) {
      kk.add([
        kk.sprite('background', { width: kk.width(), height: kk.height() }),
        kk.pos(i * kk.width(), 0),
        'bg',
      ])
    }
    kk.onUpdate('bg', (b) => {
      if (gameOver) return
      b.pos.x -= CONFIG.BG_SPEED * kk.dt()
      if (b.pos.x <= -kk.width()) b.pos.x += kk.width() * 2
    })

    /* floor */
    kk.add([
      kk.rect(kk.width(), CONFIG.FLOOR_HEIGHT),
      kk.pos(0, kk.height()),
      kk.anchor('botleft'),
      kk.body({ isStatic: true }),
      kk.area(),
      kk.opacity(0),
    ])

    /* player */
    const player = kk.add([
      kk.sprite('player', { width: 64 }),
      kk.pos(80, kk.height() - CONFIG.FLOOR_HEIGHT - 128),
      kk.area(),
      kk.body(),
      kk.z(10),
    ])

    /* speed grows with time */
    const currentSpeed = () => CONFIG.SPEED + gameTime * CONFIG.ACCELERATION

    /* obstacles and coins scroll left */
    kk.onUpdate(() => {
      if (gameOver) return
      kk.get('mover').forEach((m) => {
        m.pos.x -= currentSpeed() * kk.dt()
        if (m.pos.x < -200) kk.destroy(m)
      })
    })

    /* score */
    kk.onUpdate(() => {
      if (gameOver) return
      gameTime += kk.dt()
      points += CONFIG.POINTS_PER_SECOND * kk.dt()
      const shown = Math.floor(points)
      if (shown !== score.value) score.value = shown
    })

    /* controls */
    const jump = () => {
      if (!gameOver && player.isGrounded()) player.jump(CONFIG.JUMP_FORCE)
    }
    kk.onKeyPress('space', jump)
    kk.onKeyPress('up', jump)
    kk.onClick(jump)

    /* "+1" pop when a coin is picked up: bouncy golden text with an outline, a ring and sparkles */
    const spawnCoinText = (p: { x: number; y: number }) => {
      const life = 0.7

      // shockwave ring
      const ring = kk.add([
        kk.pos(p.x, p.y),
        kk.circle(10),
        kk.color(255, 235, 140),
        kk.opacity(0.7),
        kk.scale(0.4),
        kk.anchor('center'),
        kk.z(18),
      ])
      kk.tween(0.4, 2.6, 0.35, (v) => (ring.scale = kk.vec2(v)), kk.easings.easeOutQuad)
      kk.tween(0.7, 0, 0.35, (o) => (ring.opacity = o))
      kk.wait(0.36, () => kk.destroy(ring))

      // sparkles flying outwards
      for (let i = 0; i < 7; i++) {
        const angle = (i / 7) * Math.PI * 2 + kk.rand(-0.3, 0.3)
        const dist = kk.rand(34, 60)
        const spark = kk.add([
          kk.pos(p.x, p.y),
          kk.circle(kk.rand(2.5, 4.5)),
          kk.color(i % 2 ? kk.rgb(255, 255, 255) : kk.rgb(255, 214, 64)),
          kk.opacity(1),
          kk.anchor('center'),
          kk.z(19),
        ])
        kk.tween(
          0,
          1,
          0.5,
          (t) => {
            spark.pos.x = p.x + Math.cos(angle) * dist * t
            spark.pos.y = p.y + Math.sin(angle) * dist * t + 24 * t * t // a little gravity
            spark.opacity = 1 - t
          },
          kk.easings.easeOutQuad,
        )
        kk.wait(0.52, () => kk.destroy(spark))
      }

      // the text: brown outline (4 offset copies) + gold fill, popping up and floating away
      const label = kk.add([kk.pos(p.x, p.y - 8), kk.scale(0.2), kk.anchor('center'), kk.z(20)])
      const parts: { opacity: number }[] = []
      const mk = (dx: number, dy: number, col: [number, number, number]) => {
        parts.push(
          label.add([
            kk.text('+1', { size: 30 }),
            kk.pos(dx, dy),
            kk.anchor('center'),
            kk.color(...col),
            kk.opacity(1),
          ]),
        )
      }
      const BROWN: [number, number, number] = [85, 42, 15]
      for (const [dx, dy] of [
        [-2, 0],
        [2, 0],
        [0, -2],
        [0, 3],
      ] as const)
        mk(dx, dy, BROWN)
      mk(0, 0, [255, 226, 90])

      kk.tween(0.2, 1, 0.22, (v) => (label.scale = kk.vec2(v)), kk.easings.easeOutBack)
      kk.tween(
        label.pos.y,
        label.pos.y - 56,
        life,
        (y) => (label.pos.y = y),
        kk.easings.easeOutCubic,
      )
      kk.wait(life * 0.55, () => {
        kk.tween(1, 0, life * 0.45, (o) => parts.forEach((t) => (t.opacity = o)))
      })
      kk.wait(life + 0.02, () => kk.destroy(label))
    }

    /* spawn: an obstacle, then coins in the safe gap before the next one */
    const spawnObstacle = () => {
      if (gameOver) return

      const floorY = kk.height() - CONFIG.FLOOR_HEIGHT
      const timeToNext = kk.rand(0.6, 2.4)

      kk.add([
        kk.sprite('ice', { height: CONFIG.OBSTACLE_HEIGHT }),
        kk.pos(kk.width(), floorY),
        kk.anchor('botleft'),
        kk.area(),
        kk.body({ isStatic: true }),
        'obstacle',
        'mover',
      ])

      const totalGapDistance = currentSpeed() * timeToNext
      const safetyPadding = 160 // keep coins away from the obstacles so you are not mid-jump
      const usableSpace = totalGapDistance - safetyPadding * 2

      if (usableSpace > 50) {
        let numCoins = kk.randi(1, 6)
        const spacing = 55
        let groupWidth = (numCoins - 1) * spacing
        while (groupWidth > usableSpace && numCoins > 0) {
          numCoins--
          groupWidth = (numCoins - 1) * spacing
        }
        if (numCoins > 0) {
          const startX = kk.width() + safetyPadding + kk.rand(0, usableSpace - groupWidth)
          const coinY = floorY - 64
          for (let i = 0; i < numCoins; i++) {
            kk.add([
              kk.sprite('coin', { width: CONFIG.COIN_WIDTH }),
              kk.pos(startX + i * spacing, coinY),
              kk.anchor('center'),
              kk.area(),
              'coin',
              'mover',
            ])
          }
        }
      }

      kk.wait(timeToNext, spawnObstacle)
    }
    kk.wait(3, spawnObstacle)

    /* collisions */
    player.onCollide('obstacle', () => {
      if (gameOver) return
      gameOver = true
      kk.shake(16)
      kk.play('crash')
      kk.tween(engine.volume, 0, 0.8, (v) => (engine.volume = v))
      // let the shake play out, then show the result
      kk.wait(0.7, () => {
        kk.go('idle')
        finish(Math.floor(points), collected)
      })
    })

    player.onCollide('coin', (c) => {
      if (gameOver) return
      kk.play('collect')
      collected++
      coins.value = collected
      spawnCoinText(c.pos)
      kk.destroy(c)
    })
  })

  kk.go('idle')
  phase.value = 'menu'
})

onBeforeUnmount(() => {
  try {
    k?.quit()
  } catch {
    // already torn down
  }
  k = null
  if (musicWasPlaying) music.play()
})
</script>

<template>
  <!-- the game keeps its 480 × 854 shape: the stage is the largest such box that fits the screen -->
  <div
    class="w-full h-full flex items-center justify-center bg-[#6b4a2a] [container-type:size] overflow-hidden"
  >
    <div
      ref="host"
      class="relative overflow-hidden bg-[#fbe166] select-none touch-none"
      :style="{
        width: `min(100cqw, calc(100cqh * ${CONFIG.WIDTH} / ${CONFIG.HEIGHT}))`,
        aspectRatio: `${CONFIG.WIDTH} / ${CONFIG.HEIGHT}`,
      }"
    >
      <canvas ref="canvas" tabindex="0" class="block outline-none" />

      <!-- HUD: two plain numbers, no boxes -->
      <div
        v-if="phase === 'playing'"
        class="absolute top-3 left-4 right-4 flex items-start justify-between pointer-events-none outlined [--outline:#3b2412] tabular-nums"
      >
        <div class="leading-none">
          <p class="font-bold uppercase tracking-wider text-white/80 text-[0.65rem]">{{ $t('Score') }}</p>
          <p class="mt-0.5 font-extrabold text-[length:clamp(1.5rem,7vw,2rem)]">{{ score }}</p>
        </div>
        <div class="text-right leading-none">
          <p class="font-bold uppercase tracking-wider text-white/80 text-[0.65rem]">{{ $t('Coins') }}</p>
          <p class="mt-0.5 flex items-center justify-end gap-1 font-extrabold text-[length:clamp(1.5rem,7vw,2rem)]">
            <img :src="CoinImage" alt="" class="w-[0.9em]" />{{ coins }}
          </p>
        </div>
      </div>

      <!-- loading / error -->
      <div
        v-if="phase === 'loading'"
        class="absolute inset-0 flex items-center justify-center bg-[#fbe166]"
      >
        <span class="font-bold text-2xl text-[#552a0f] animate-pulse">{{ $t('Loading…') }}</span>
      </div>
      <div
        v-else-if="phase === 'error'"
        class="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-[#fbe166] p-6 text-center"
      >
        <p class="font-bold text-2xl text-[#552a0f]">{{ $t('Could not load the game') }} 😢</p>
        <button
          type="button"
          class="btn-gradient-orange border-[3px] border-[#c66a27] px-8 py-1 text-2xl font-extrabold outlined [--outline:#D76826] !rounded-full"
          @click="leave"
        >
          {{ $t('Back') }}
        </button>
      </div>

      <!-- menu / result: just a title, one button and a way back -->
      <div
        v-if="phase === 'menu' || phase === 'over'"
        class="absolute inset-0 flex items-center justify-center bg-black/40 p-6"
      >
        <div
          class="w-full max-w-[17rem] rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-4 py-4 text-center text-[#552a0f] shadow-[0px_6px_10px_rgba(0,0,0,0.3)]"
        >
          <h1 class="font-extrabold leading-tight text-[length:clamp(1.3rem,6vw,1.6rem)]">
            {{ phase === 'over' ? $t('Crash!') : $t('Bruno’s Ride') }}
          </h1>

          <div v-if="phase === 'over'" class="mt-3 grid grid-cols-3 gap-1">
            <div>
              <p class="font-bold uppercase tracking-wide text-[#8a5a2b] text-[0.62rem]">{{ $t('Score') }}</p>
              <p class="font-extrabold tabular-nums text-[length:clamp(1rem,4.8vw,1.25rem)]">{{ score }}</p>
            </div>
            <div>
              <p class="font-bold uppercase tracking-wide text-[#8a5a2b] text-[0.62rem]">{{ $t('Coins') }}</p>
              <p class="flex items-center justify-center gap-0.5 font-extrabold tabular-nums text-[length:clamp(1rem,4.8vw,1.25rem)]">
                <img :src="CoinImage" alt="" class="w-[1.1em]" />{{ coins }}
              </p>
            </div>
            <div>
              <p class="font-bold uppercase tracking-wide text-[#8a5a2b] text-[0.62rem]">{{ $t('Top score') }}</p>
              <p
                class="font-extrabold tabular-nums text-[length:clamp(1rem,4.8vw,1.25rem)]"
                :class="newBest ? 'text-[#c8200f]' : ''"
              >
                {{ best }}
              </p>
            </div>
          </div>

          <button
            type="button"
            class="mt-4 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.05rem,5.2vw,1.35rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px disabled:opacity-60"
            :disabled="starting || saving"
            @click="canPlay ? play() : topUp.open()"
          >
            <template v-if="starting">{{ $t('Starting…') }}</template>
            <template v-else-if="!canPlay">{{ $t('Get stars') }}</template>
            <template v-else>
              {{ phase === 'over' ? $t('Again') : $t('Play') }}
              <template v-if="adRun">{{ $t('(watch an ad)') }}</template>
              <template v-else><img :src="StarIcon" alt="" class="w-[1.15em]" />{{ RUN_COST }}</template>
            </template>
          </button>

          <button
            type="button"
            class="mt-2 text-[#8a5a2b] font-bold text-[length:clamp(0.85rem,4vw,1rem)] underline-offset-2 active:opacity-70"
            @click="leave"
          >
            {{ $t('Back') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
