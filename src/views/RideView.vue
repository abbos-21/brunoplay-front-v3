<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RideGame, RIDE } from '@/games/ride/engine'
import { RideAudio } from '@/games/ride/audio'
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

let game: RideGame | null = null
let audio: RideAudio | null = null
let disposed = false
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
  if (!game || starting.value) return
  if (!canPlay.value) return
  // sound can only start from a tap, so it is woken here, before the server is asked
  audio?.unlock()
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
    game.start()
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

/** a picture, ready to draw (decoded before the first frame, so nothing stutters later) */
async function loadImage(url: string): Promise<HTMLImageElement> {
  const img = new Image()
  img.src = url
  await img.decode()
  return img
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

  try {
    audio = new RideAudio({ engine: EngineSound, crash: CrashSound, collect: CollectSound })
    const [car, background, obstacle, coin] = await Promise.all([
      loadImage(CarSprite),
      loadImage(RideBackground),
      loadImage(ObstacleSprite),
      loadImage(CoinImage),
      audio.prepare(),
    ])
    if (disposed || !canvas.value) return
    game = await RideGame.create(
      canvas.value,
      { car, background, obstacle, coin },
      audio,
      { onCrash: (points, coinsCollected) => void finish(points, coinsCollected), labels: { score: t('Score'), coins: t('Coins') } },
    )
    if (disposed) {
      game.destroy()
      game = null
      return
    }
  } catch {
    phase.value = 'error'
    return
  }

  game.showIdle()
  phase.value = 'menu'
})

onBeforeUnmount(() => {
  disposed = true
  game?.destroy()
  game = null
  audio?.destroy()
  audio = null
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
        width: `min(100cqw, calc(100cqh * ${RIDE.WIDTH} / ${RIDE.HEIGHT}))`,
        aspectRatio: `${RIDE.WIDTH} / ${RIDE.HEIGHT}`,
      }"
    >
      <canvas ref="canvas" class="block h-full w-full outline-none" />

      <!-- the score and the coins are drawn inside the canvas (no page updates while playing) -->

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
