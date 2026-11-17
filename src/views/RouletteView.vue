<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { t } from '@/i18n'
import StarBalance from '@/components/StarBalance.vue'
import CoinBalance from '@/components/CoinBalance.vue'
import RoulettePrizesModal from '@/components/RoulettePrizesModal.vue'
import RouletteSettingsModal from '@/components/RouletteSettingsModal.vue'
import SpinWinOverlay from '@/components/SpinWinOverlay.vue'
import { ArrowLeftSVG, StarIcon } from '@/assets/svgs'
import ChevronSVG from '@/assets/svgs/roulette-chevron.svg?url'
import { CoinImage } from '@/assets/images'
import { LiveTiles } from '@/assets/images/roulette'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { useTopUp } from '@/composables/useTopUp'
import { playSfx } from '@/composables/useSfx'
import { getTelegram } from '@/composables/useTelegram'
import { apiMessage } from '@/composables/apiError'
import { apiCode, isApiDisabled } from '@/api/client'
import { resolvePrizes, winImage, type ResolvedPrize } from '@/views/spin-prizes'
import type { RouletteResult, SpinPrize, SpinResult } from '@/types'

const router = useRouter()
const games = useGamesStore()
const auth = useAuthStore()
const toast = useToast()
const topUp = useTopUp()

// ───────────────────────── data ─────────────────────────
/** shown while the API is off (dev mode) or has not answered: the prizes of the design */
const FALLBACK: SpinPrize[] = [
  { type: 'gift', gift: 'frog', value: 1_000_000, weight: 1 },
  { type: 'gift', gift: 'heart', value: 500_000, weight: 1 },
  { type: 'gift', gift: 'cap', value: 400_000, weight: 1 },
  { type: 'gift', gift: 'panda', value: 20_000, weight: 1 },
  { type: 'gift', gift: 'apple', value: 15_000, weight: 1 },
  { type: 'gift', gift: 'cat', value: 10_000, weight: 1 },
  { type: 'gift', gift: 'ring', value: 8_000, weight: 1 },
  { type: 'gift', gift: 'watch', value: 7_500, weight: 1 },
  { type: 'coins', value: 5000, weight: 1 },
  { type: 'coins', value: 3000, weight: 1 },
  { type: 'coins', value: 1500, weight: 1 },
  { type: 'coins', value: 500, weight: 1 },
]
const FALLBACK_COST = 15

const prizeList = computed<SpinPrize[]>(() => (games.roulette?.prizes.length ? games.roulette.prizes : FALLBACK))
const resolved = computed<ResolvedPrize[]>(() => resolvePrizes(prizeList.value))
const cost = computed(() => games.roulette?.costStars ?? FALLBACK_COST)

/** the demo switch is kept on this phone; without the API there is nothing to credit, so it is always a demo */
const DEMO_KEY = 'bp.roulette.demo'
const demoChoice = ref(false)
try {
  demoChoice.value = localStorage.getItem(DEMO_KEY) === 'on'
} catch {
  // private mode: the switch lasts until the page is closed
}
const demo = computed(() => demoChoice.value || isApiDisabled)
function setDemo(on: boolean) {
  demoChoice.value = on
  try {
    localStorage.setItem(DEMO_KEY, on ? 'on' : 'off')
  } catch {
    // ignore
  }
}

const enough = computed(() => demo.value || !auth.user || auth.user.starsBalance >= cost.value)

// ───────────────────────── live wins ─────────────────────────
type Tile = { key: number; img: string; bg: string; title: string }
const tiles = computed<Tile[]>(() =>
  games.spinLiveWins.slice(0, 12).map((w) => ({
    key: w.id,
    img: winImage(w, prizeList.value),
    bg: LiveTiles[w.id % LiveTiles.length]!,
    title: `${w.username}: ${w.prizeValue.toLocaleString('en-US')} ${w.prizeType}`,
  })),
)
let liveTimer: ReturnType<typeof setInterval> | undefined

// ───────────────────────── the reel ─────────────────────────
interface ReelItem {
  id: number
  r: ResolvedPrize
}
let uid = 0
const mk = (r: ResolvedPrize): ReelItem => ({ id: ++uid, r })

const SLOT = 267 / 776 // the width of one place, as a share of the screen width (Figma)
const MIN_SCALE = 0.74 // the pictures beside the middle one are this much smaller
const strip = ref<ReelItem[]>([])
const stripEl = ref<HTMLElement | null>(null)
const viewport = ref<HTMLElement | null>(null)
const artEls: (HTMLElement | null)[] = []
let slotPx = 0
let viewW = 0
let center = 1 // the index of the item in the middle
const mid = ref(1) // the same, for the template (the winning place)
let x = 0 // the current shift of the strip, in px

const xFor = (i: number) => viewW / 2 - (i + 0.5) * slotPx

/** the first three places: what the player sees before the first spin (the best prizes, as in the design) */
function resetStrip() {
  const list = resolved.value
  if (!list.length) return
  strip.value = [0, 1, 2].map((i) => mk(list[i % list.length]!))
  center = 1
  mid.value = 1
  artEls.length = 0
  void nextTick(() => place(xFor(center)))
}

function measure() {
  const w = viewport.value?.clientWidth ?? 0
  if (!w) return
  viewW = w
  slotPx = w * SLOT
  place(xFor(center))
}

/** move the strip and size the pictures: the closer to the middle, the bigger */
function place(nx: number) {
  x = nx
  const el = stripEl.value
  if (!el) return
  el.style.transform = `translate3d(${nx}px,0,0)`
  const at = (viewW / 2 - nx) / slotPx - 0.5 // the index at the middle, with a fraction
  const from = Math.max(0, Math.floor(at) - 3)
  const to = Math.min(strip.value.length - 1, Math.ceil(at) + 3)
  for (let i = from; i <= to; i++) {
    const art = artEls[i]
    if (!art) continue
    const d = Math.min(1, Math.abs(i - at))
    const k = 1 - d
    const s = MIN_SCALE + (1 - MIN_SCALE) * (k * k * (3 - 2 * k))
    art.style.transform = `scale(${s.toFixed(3)})`
  }
}

const setArt = (i: number) => (el: unknown) => {
  artEls[i] = el as HTMLElement | null
}

let raf = 0
function tween(from: number, to: number, ms: number, ease: (k: number) => number, onTick?: (nx: number) => void) {
  return new Promise<void>((resolve) => {
    const t0 = performance.now()
    const step = (now: number) => {
      const k = Math.min(1, (now - t0) / ms)
      const nx = from + (to - from) * ease(k)
      place(nx)
      onTick?.(nx)
      if (k < 1) raf = requestAnimationFrame(step)
      else resolve()
    }
    raf = requestAnimationFrame(step)
  })
}
const easeOutCubic = (k: number) => 1 - Math.pow(1 - k, 3)
const easeOutBack = (k: number) => 1 + 2.2 * Math.pow(k - 1, 3) + 1.2 * Math.pow(k - 1, 2)

// ───────────────────────── spinning ─────────────────────────
const spinning = ref(false)
const landed = ref(false) // the pop of the winning picture
const result = ref<SpinResult | null>(null)
const demoNote = ref('')
const modal = ref<'' | 'prizes' | 'settings'>('')
let lastTick = -1
let lastTickAt = 0

/** the picture of a prize that was really won: the same entry of the list when there is one */
function resolveWon(p: SpinPrize): ResolvedPrize {
  const same = resolved.value.find((r) => (p.gift && r.prize.gift ? r.prize.gift === p.gift : r.prize.type === p.type && r.prize.value === p.value))
  return same ?? resolvePrizes([p])[0]!
}

/** the demo draw: by the weights of the list (equal when the odds are not published) */
function drawLocal(): SpinPrize {
  const list = prizeList.value
  const total = list.reduce((s, p) => s + (p.weight || 1), 0)
  let roll = Math.random() * total
  return list.find((p) => (roll -= p.weight || 1) < 0) ?? list[0]!
}

async function spin() {
  if (spinning.value) return
  if (!enough.value) {
    toast.show(t('Not enough stars'), 'warning')
    topUp.open()
    return
  }
  spinning.value = true
  landed.value = false
  demoNote.value = ''
  playSfx('spinStart')
  let won: SpinPrize
  let server: RouletteResult | null = null
  try {
    if (demo.value) {
      won = drawLocal()
    } else {
      server = await games.spinRoulette()
      won = server.prize
    }
  } catch (e) {
    spinning.value = false
    toast.show(apiMessage(e, 'Something went wrong'), 'error')
    return
  }

  // the three places on screen stay, then 40 random places, the prize, and three more places after it
  const list = resolved.value
  const keep = strip.value.slice(center - 1, center + 2)
  const FILL = 38 + Math.floor(Math.random() * 6)
  const winIdx = 3 + FILL
  const next: ReelItem[] = [...keep]
  let prev = -1
  for (let i = 0; i < FILL; i++) {
    let k = Math.floor(Math.random() * list.length)
    if (list.length > 1 && k === prev) k = (k + 1) % list.length
    prev = k
    next.push(mk(list[k]!))
  }
  next.push(mk(resolveWon(won)))
  for (let i = 0; i < 3; i++) next.push(mk(list[Math.floor(Math.random() * list.length)]!))
  strip.value = next
  artEls.length = 0
  center = 1
  mid.value = 1
  await nextTick()
  place(xFor(1))

  // runs fast, slows down, stops a little off the middle, then settles with a small bounce
  const stopAt = xFor(winIdx) + (Math.random() - 0.5) * slotPx * 0.5
  lastTick = 1
  await tween(xFor(1), stopAt, 5800 + Math.random() * 700, easeOutCubic, (nx) => {
    const idx = Math.round((viewW / 2 - nx) / slotPx - 0.5)
    if (idx !== lastTick) {
      lastTick = idx
      const now = performance.now()
      if (now - lastTickAt > 55) {
        lastTickAt = now
        playSfx('tick')
        try {
          getTelegram()?.HapticFeedback.selectionChanged()
        } catch {
          // no haptics
        }
      }
    }
  })
  await tween(stopAt, xFor(winIdx), 420, easeOutBack)
  center = winIdx
  mid.value = winIdx

  // the win
  landed.value = true
  try {
    getTelegram()?.HapticFeedback.notificationOccurred('success')
  } catch {
    // no haptics
  }
  if (demo.value) {
    playSfx('win')
    demoNote.value = t('Demo mode: the prize is not credited')
    await wait(900)
    spinning.value = false
    return
  }
  await wait(1000)
  const coins = won.type === 'coins' ? won.value : 0
  const stars = won.type === 'stars' ? won.value : 0
  result.value = { results: [{ ...won, label: won.label ?? resolveWon(won).name }], totalCoinsWon: coins, totalStarsWon: stars }
  spinning.value = false
  void games.fetchSpinLiveWins().catch(() => {})
}

function wait(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms))
}

function closeResult() {
  result.value = null
  landed.value = false
}

function back() {
  router.push('/games')
}

function openModal(m: 'prizes' | 'settings') {
  if (spinning.value) return
  modal.value = m
}

// ───────────────────────── lifecycle ─────────────────────────
let ro: ResizeObserver | undefined
onMounted(() => {
  if (!isApiDisabled) {
    games.fetchRoulette().catch((e) => {
      // not open to this player (yet): back to the games
      if (apiCode(e) === 'NOT_FOUND') router.replace('/games')
      else toast.show(apiMessage(e, 'Could not load the game'), 'error')
    })
  }
  games.fetchSpinLiveWins().catch(() => {})
  liveTimer = setInterval(() => games.fetchSpinLiveWins().catch(() => {}), 15000)
  resetStrip()
  void nextTick(() => {
    measure()
    if (viewport.value && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(measure)
      ro.observe(viewport.value)
    }
  })
})
onBeforeUnmount(() => {
  clearInterval(liveTimer)
  cancelAnimationFrame(raf)
  ro?.disconnect()
})

// the prizes arrive after the screen opened: show the best three of them (never in the middle of a spin)
watch(
  () => games.roulette,
  () => {
    if (!spinning.value && !landed.value) resetStrip()
  },
)
</script>

<template>
  <div class="roulette" :class="{ spinning, landed }">
    <div class="vignette" />

    <div class="stage">
      <div class="frame">
        <!-- back and balances -->
        <div class="top">
          <button type="button" class="back" :disabled="spinning" :aria-label="$t('Back')" @click="back">
            <ArrowLeftSVG class="w-full" />
          </button>
          <div class="balances">
            <CoinBalance />
            <StarBalance />
          </div>
        </div>

        <!-- live wins -->
        <h1 class="title">{{ $t('Live Wins') }}</h1>
        <div class="tiles">
          <p v-if="!tiles.length" class="nowins">{{ $t('No winners yet') }}</p>
          <TransitionGroup v-else name="tile" tag="div" class="tiles-row">
            <div v-for="(tl, i) in tiles" :key="tl.key" class="tile" :class="{ first: i === 0 }" :title="tl.title" :style="{ backgroundImage: `url(${tl.bg})` }">
              <img decoding="async" :src="tl.img" alt="" />
            </div>
          </TransitionGroup>
        </div>

        <!-- the reel -->
        <div class="reel-area">
          <img :src="ChevronSVG" alt="" class="chev chev-top" aria-hidden="true" />
          <div ref="viewport" class="viewport">
            <div ref="stripEl" class="strip">
              <div v-for="(it, i) in strip" :key="it.id" class="slot" :class="{ win: landed && i === mid }">
                <div class="art-box">
                  <i v-if="landed && i === mid" class="glow" aria-hidden="true" />
                  <img :ref="setArt(i)" decoding="async" :src="it.r.img" :alt="it.r.name" class="art" :class="{ coin: it.r.kind !== 'gift', pop: landed && i === mid }" />
                </div>
                <span class="pill">
                  <img decoding="async" :src="it.r.kind === 'coins' ? CoinImage : StarIcon" alt="" />
                  {{ it.r.amount }}
                </span>
              </div>
            </div>
          </div>
          <img :src="ChevronSVG" alt="" class="chev chev-bottom" aria-hidden="true" />
          <p v-if="demoNote" class="demo-note">{{ demoNote }}</p>
        </div>

        <!-- buttons -->
        <div class="actions">
          <div class="pair">
            <button type="button" class="ghost" :disabled="spinning" @click="openModal('settings')">{{ $t('Settings') }}</button>
            <button type="button" class="ghost" :disabled="spinning" @click="openModal('prizes')">{{ $t('Prizes List') }}</button>
          </div>
          <button type="button" class="spin" :disabled="spinning" @click="spin">
            <span class="spin-label">{{ spinning ? $t('Spinning…') : $t('Spin') }}</span>
            <span v-if="!spinning" class="spin-cost">
              <template v-if="demo">{{ $t('Demo') }}</template>
              <template v-else-if="cost > 0"><img :src="StarIcon" alt="" />{{ cost.toLocaleString('en-US') }}</template>
              <template v-else>{{ $t('Free') }}</template>
            </span>
          </button>
        </div>
      </div>

      <RoulettePrizesModal v-if="modal === 'prizes'" :prizes="resolved" @close="modal = ''" />
      <RouletteSettingsModal v-if="modal === 'settings'" :demo="demoChoice" @update:demo="setDemo" @close="modal = ''" />
      <SpinWinOverlay v-if="result" :result="result" @close="closeResult" />
    </div>
  </div>
</template>

<style scoped>
.roulette {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #1b56c8;
  user-select: none;
}
.vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  box-shadow: inset 0 0 133px 120px rgba(0, 0, 0, 0.25);
}
/* the screen is drawn in the units of the 776 px wide Figma frame: --u is one of them */
.stage {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  container-type: inline-size;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
.stage::-webkit-scrollbar {
  display: none;
}
.frame {
  --u: calc(100cqw / 776);
  min-height: 100%;
  display: flex;
  flex-direction: column;
  padding: calc(var(--u) * 24) 0 calc(var(--u) * 38);
}
.top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u) * 16);
  padding: 0 calc(var(--u) * 38);
}
.back {
  flex: none;
  width: calc(var(--u) * 84);
  height: calc(var(--u) * 84);
  padding: calc(var(--u) * 17);
  border: 0;
  border-radius: 50%;
  background: linear-gradient(180deg, #ff8a2b, #f96a07);
  box-shadow: inset 0 3px 3px rgba(255, 255, 255, 0.3), 0 3px 3px rgba(0, 0, 0, 0.25);
}
.back:active {
  transform: translateY(1px);
}
.back:disabled {
  opacity: 0.5;
}
.balances {
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 14);
  min-width: 0;
}

.title {
  margin-top: calc(var(--u) * 26);
  text-align: center;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: #fff;
  font-size: calc(var(--u) * 64);
  text-shadow: 0 calc(var(--u) * 3) calc(var(--u) * 3) rgba(0, 0, 0, 0.25);
}
.tiles {
  margin-top: calc(var(--u) * 14);
  height: calc(var(--u) * 150);
  padding-left: calc(var(--u) * 16);
  overflow: hidden;
}
.tiles-row {
  position: relative;
  display: flex;
  align-items: center;
  gap: calc(var(--u) * 10);
  width: max-content;
  height: 100%;
}
.nowins {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  font-size: calc(var(--u) * 30);
}
.tile {
  flex: none;
  width: calc(var(--u) * 120);
  height: calc(var(--u) * 120);
  border-radius: calc(var(--u) * 30);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 calc(var(--u) * 3) calc(var(--u) * 2) rgba(0, 0, 0, 0.25),
    inset 0 calc(var(--u) * 3) calc(var(--u) * 4) rgba(255, 255, 255, 0.25),
    inset 0 calc(var(--u) * -3) calc(var(--u) * 4) rgba(0, 0, 0, 0.25);
}
.tile.first {
  width: calc(var(--u) * 140);
  height: calc(var(--u) * 140);
}
.tile img {
  width: 82%;
  height: 82%;
  object-fit: contain;
  filter: drop-shadow(0 calc(var(--u) * 3) calc(var(--u) * 3) rgba(0, 0, 0, 0.3));
}
/* a new win slides in from the left and pushes the others along */
.tile-enter-active {
  transition: transform 0.55s cubic-bezier(0.2, 1.3, 0.4, 1), opacity 0.4s;
}
.tile-enter-from {
  opacity: 0;
  transform: translateX(-60%) scale(0.7);
}
.tile-leave-active {
  position: absolute;
  opacity: 0;
}
.tile-move {
  transition: transform 0.45s ease;
}

/* the reel */
.reel-area {
  position: relative;
  flex: 1 1 auto;
  min-height: calc(var(--u) * 520);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: calc(var(--u) * 20) 0;
}
.chev {
  flex: none;
  width: calc(var(--u) * 28);
  height: calc(var(--u) * 53);
  /* the drawing is a "‹" of 28 × 53: turned a quarter to point down (top) and up (bottom); the margins keep the turned size */
  margin: calc(var(--u) * -12.5) 0;
  animation: chev-down 1.6s ease-in-out infinite;
}
.chev-top {
  transform: rotate(-90deg);
}
.chev-bottom {
  transform: rotate(90deg);
  animation-name: chev-up;
}
.viewport {
  position: relative;
  width: 100%;
  height: calc(var(--u) * 480);
  margin: calc(var(--u) * 6) 0;
  overflow: hidden;
}
.strip {
  position: absolute;
  left: 0;
  top: 0;
  display: flex;
  height: 100%;
  will-change: transform;
}
.slot {
  flex: none;
  width: calc(100cqw * 267 / 776);
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.art-box {
  position: relative;
  width: 100%;
  height: calc(var(--u) * 392);
  display: flex;
  align-items: flex-end;
  justify-content: center;
}
.art {
  width: calc(var(--u) * 392);
  height: calc(var(--u) * 392);
  max-width: none; /* the reset caps pictures at the width of their box */
  margin-bottom: calc(var(--u) * -78);
  object-fit: contain;
  transform: scale(0.74);
  transform-origin: 50% 88%;
  filter: drop-shadow(0 calc(var(--u) * 6) calc(var(--u) * 6) rgba(0, 0, 0, 0.3));
}
.pill {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u) * 10);
  width: calc(var(--u) * 200);
  height: calc(var(--u) * 62);
  margin-top: calc(var(--u) * 6);
  border-radius: calc(var(--u) * 45);
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.28);
  color: #fff;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-size: calc(var(--u) * 27);
  letter-spacing: 0.01em;
  backdrop-filter: blur(2px);
}
.pill img {
  width: calc(var(--u) * 35);
  height: calc(var(--u) * 35);
  object-fit: contain;
}

/* the winning place: it pops, a light blooms behind it */
.glow {
  position: absolute;
  left: 50%;
  bottom: 6%;
  width: 150%;
  aspect-ratio: 1;
  transform: translateX(-50%);
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 244, 170, 0.85) 0%, rgba(255, 220, 90, 0.35) 38%, rgba(255, 220, 90, 0) 68%);
  animation: glow 1.4s ease-out both;
  pointer-events: none;
}
/* a coin or a star has no empty margin in its picture, unlike the gifts: it is drawn smaller to look as big as them */
.art.coin {
  width: calc(var(--u) * 250);
  height: calc(var(--u) * 250);
  margin-bottom: calc(var(--u) * 4);
}
.art.pop {
  animation: pop 0.9s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.slot.win .pill {
  animation: pill-win 0.9s ease-out both;
}
/* the middle place breathes while the reel waits for a spin */
.roulette:not(.spinning):not(.landed) .slot .art {
  animation: idle 3.2s ease-in-out infinite;
}

.demo-note {
  position: absolute;
  bottom: calc(var(--u) * -4);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  border-radius: 999px;
  padding: calc(var(--u) * 8) calc(var(--u) * 26);
  background: rgba(0, 0, 0, 0.35);
  color: #fff;
  font-weight: 700;
  font-size: calc(var(--u) * 26);
  animation: note 0.4s ease-out both;
}

/* buttons */
.actions {
  padding: 0 calc(var(--u) * 38);
}
.pair {
  display: flex;
  gap: calc(var(--u) * 24);
}
.ghost {
  flex: 1;
  height: calc(var(--u) * 80);
  border: 0;
  border-radius: calc(var(--u) * 45);
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
  font-weight: 700;
  letter-spacing: 0.01em;
  font-size: calc(var(--u) * 40);
}
.ghost:active:not(:disabled) {
  transform: translateY(1px);
  background: rgba(255, 255, 255, 0.22);
}
.ghost:disabled,
.spin:disabled {
  opacity: 0.6;
}
.spin {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u) * 22);
  width: 100%;
  height: calc(var(--u) * 100);
  margin-top: calc(var(--u) * 22);
  border: 0;
  border-radius: calc(var(--u) * 30);
  background: #fbe166;
  color: #552a0f;
  box-shadow:
    0 calc(var(--u) * 3) calc(var(--u) * 2) rgba(0, 0, 0, 0.25),
    inset 0 calc(var(--u) * 3) calc(var(--u) * 4) rgba(255, 255, 255, 0.25),
    inset 0 calc(var(--u) * -3) calc(var(--u) * 4) rgba(0, 0, 0, 0.25);
}
.spin:active:not(:disabled) {
  transform: translateY(1px);
}
.spin::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.55) 50%, transparent 65%);
  transform: translateX(-120%);
  animation: sweep 3.4s ease-in-out infinite;
  pointer-events: none;
}
.roulette.spinning .spin::after {
  animation: none;
  opacity: 0;
}
.spin-label {
  font-weight: 800;
  letter-spacing: 0.01em;
  font-size: calc(var(--u) * 48);
}
.spin-cost {
  display: inline-flex;
  align-items: center;
  gap: calc(var(--u) * 8);
  border-radius: 999px;
  padding: calc(var(--u) * 6) calc(var(--u) * 20);
  background: rgba(85, 42, 15, 0.12);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-size: calc(var(--u) * 36);
}
.spin-cost img {
  width: calc(var(--u) * 40);
  height: calc(var(--u) * 40);
}

@keyframes chev-down {
  0%,
  100% {
    opacity: 0.5;
    translate: 0 0;
  }
  50% {
    opacity: 1;
    translate: 0 calc(var(--u) * 8);
  }
}
@keyframes chev-up {
  0%,
  100% {
    opacity: 0.5;
    translate: 0 0;
  }
  50% {
    opacity: 1;
    translate: 0 calc(var(--u) * -8);
  }
}
@keyframes idle {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 calc(var(--u) * -10);
  }
}
@keyframes sweep {
  0%,
  8% {
    transform: translateX(-120%);
  }
  40%,
  100% {
    transform: translateX(120%);
  }
}
@keyframes glow {
  0% {
    opacity: 0;
    scale: 0.4;
  }
  35% {
    opacity: 1;
    scale: 1;
  }
  100% {
    opacity: 0.55;
    scale: 1.08;
  }
}
@keyframes pop {
  0% {
    scale: 1;
  }
  30% {
    scale: 1.22;
    rotate: -4deg;
  }
  55% {
    scale: 1.06;
    rotate: 3deg;
  }
  100% {
    scale: 1.12;
    rotate: 0deg;
  }
}
@keyframes pill-win {
  0% {
    scale: 1;
  }
  35% {
    scale: 1.14;
    background: #fbe166;
    color: #552a0f;
  }
  100% {
    scale: 1.06;
    background: rgba(251, 225, 102, 0.95);
    color: #552a0f;
  }
}
@keyframes note {
  from {
    opacity: 0;
    transform: translate(-50%, 8px);
  }
}
@media (prefers-reduced-motion: reduce) {
  .chev,
  .spin::after,
  .roulette:not(.spinning):not(.landed) .slot .art {
    animation: none;
  }
}
</style>
