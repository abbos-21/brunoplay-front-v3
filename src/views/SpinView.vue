<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SpinWheel, { type WheelSlot } from '@/components/SpinWheel.vue'
import { sparkles, FRAME } from '@/views/spin-sparkles'
import { StarIcon } from '@/assets/svgs'
import { DotOff, DotOn, GlossA, GlossB, Knob } from '@/assets/svgs/spin'
import { Win1, Win2, Win3, Win4, Win5 } from '@/assets/images/spin'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { isApiDisabled } from '@/api/client'
import * as gamesApi from '@/api/games'
import SpinPrizesModal from '@/components/SpinPrizesModal.vue'
import SpinWinnersModal from '@/components/SpinWinnersModal.vue'
import SpinWinOverlay from '@/components/SpinWinOverlay.vue'
import { FALLBACK_PRIZES, resolvePrizes, type ResolvedPrize } from '@/views/spin-prizes'
import type { LiveWin, SpinPrize, SpinResult, SpinTierInfo } from '@/types'

const games = useGamesStore()
const auth = useAuthStore()
const toast = useToast()

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / FRAME.w) * 100).toFixed(4)}cqw`
const pct = (px: number, total: number) => `${((px / total) * 100).toFixed(4)}%`

// ───────────────────────── data ─────────────────────────
const COUNTS = [1, 3, 5, 10]
const WIN_TILES = [Win1, Win2, Win3, Win4, Win5]

// Used when the API has not returned tiers yet (or is disabled in dev mode).
const fallbackTiers: SpinTierInfo[] = [500, 1000, 2500, 5000, 10000].map((cost, i) => ({
  tier: `TIER_${i + 1}` as SpinTierInfo['tier'],
  name: `Tier ${i + 1}`,
  costStars: cost,
  prizes: FALLBACK_PRIZES,
}))

const tiers = computed(() => (games.spinTiers.length ? games.spinTiers : fallbackTiers))
const tierIndex = ref(1)
const countIndex = ref(0)

const tier = computed(() => tiers.value[Math.min(tierIndex.value, tiers.value.length - 1)]!)
const count = computed(() => COUNTS[countIndex.value]!)
const totalCost = computed(() => tier.value.costStars * count.value)

const prizeText = (p: SpinPrize) =>
  p.label || (p.type === 'gift' ? `Gift #${p.value}` : `${p.value.toLocaleString()} ${p.type}`)

// The wheel always has 8 slots, filled from the selected tier's prizes (repeating when there are fewer).
// When a won prize is not one of those, the landing slot temporarily shows the prize that was won,
// so the arrow always points at what you actually got.
const wheelPrizes = computed<ResolvedPrize[]>(() => {
  const all = resolvePrizes(tier.value.prizes)
  return Array.from({ length: 8 }, (_, i) => all[i % all.length]!).filter(Boolean)
})
const overrides = ref<Record<number, ResolvedPrize>>({})
watch(tierIndex, () => (overrides.value = {}))
const slots = computed<WheelSlot[]>(() =>
  wheelPrizes.value.map((r, i) => {
    const shown = overrides.value[i] ?? r
    return {
      img: shown.img,
      alt: prizeText(shown.prize),
      chip: shown.kind === 'gift' ? undefined : `+${shown.prize.value.toLocaleString()}`,
    }
  }),
)
const knownPrizes = computed(() => tiers.value.flatMap((t) => t.prizes))

const placeholderTiles = [Win1, Win2, Win3, Win4, Win5, Win2, Win4].map((img, i) => ({
  key: -i - 1,
  img,
  title: '',
}))
const tiles = computed<{ key: number; img: string; title: string }[]>(() => {
  if (!games.spinLiveWins.length) return placeholderTiles
  return games.spinLiveWins.map((w, i) => ({
    key: w.id,
    img: WIN_TILES[(w.id + i) % WIN_TILES.length]!,
    title: `${w.username}: ${w.prizeValue.toLocaleString()} ${w.prizeType}`,
  }))
})

let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  const load = () => {
    games.fetchSpinTiers().catch(() => {})
    games.fetchSpinLiveWins().catch(() => {})
  }
  load()
  timer = setInterval(() => games.fetchSpinLiveWins().catch(() => {}), 15000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
  if (settleTimer) clearTimeout(settleTimer)
})

// ───────────────────────── spinning ─────────────────────────
const rotation = ref(0)
const duration = ref(0)
const spinning = ref(false)
const result = ref<SpinResult | null>(null)
let settleTimer: ReturnType<typeof setTimeout> | null = null

function simulate(): SpinResult {
  const list = tier.value.prizes
  const total = list.reduce((s, p) => s + p.weight, 0)
  const results: SpinPrize[] = []
  for (let n = 0; n < count.value; n++) {
    let roll = Math.random() * total
    results.push(list.find((p) => (roll -= p.weight) < 0) ?? list[0]!)
  }
  return {
    results,
    totalCoinsWon: results.filter((p) => p.type === 'coins').reduce((s, p) => s + p.value, 0),
    totalStarsWon: results.filter((p) => p.type === 'stars').reduce((s, p) => s + p.value, 0),
  }
}

/** Slot the arrow should stop on for this prize (a matching slot, or a free one that we relabel). */
function slotFor(prize: SpinPrize) {
  const matches = wheelPrizes.value
    .map((r, i) => ({ r: overrides.value[i] ?? r, i }))
    .filter(({ r }) => r.prize.type === prize.type && r.prize.value === prize.value)
    .map(({ i }) => i)
  if (matches.length) return matches[Math.floor(Math.random() * matches.length)]!

  const slot = Math.floor(Math.random() * wheelPrizes.value.length)
  overrides.value = { ...overrides.value, [slot]: resolvePrizes([prize])[0]! }
  return slot
}

function spinTo(slot: number, ms: number, turns: number) {
  const slotAngle = 22.5 + 45 * slot
  const jitter = (Math.random() - 0.5) * 30 // stay inside the sector
  const current = ((rotation.value % 360) + 360) % 360
  // the arrow is at the top, so the slot's angle plus the wheel rotation must end up at 0°
  const delta = (((-slotAngle - jitter - current) % 360) + 360) % 360
  duration.value = ms
  rotation.value += 360 * turns + delta
  return wait(ms + 150)
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    settleTimer = setTimeout(resolve, ms)
  })
}

/** which spin of the purchase is currently turning (for the 3X / 5X / 10X packs) */
const progress = ref({ current: 0, total: 0 })

async function spin() {
  if (spinning.value) return
  if (!isApiDisabled && auth.user && auth.user.starsBalance < totalCost.value) {
    toast.show('Not enough stars', 'warning')
    return
  }
  spinning.value = true
  overrides.value = {}
  try {
    const res = isApiDisabled ? simulate() : await games.playSpin(tier.value.tier, count.value)
    if (!res.results.length) throw new Error('empty result')

    // one full spin per purchased spin: stop on each won prize, pause, then spin again
    const multi = res.results.length > 1
    progress.value = { current: 0, total: res.results.length }
    for (const [i, prize] of res.results.entries()) {
      progress.value.current = i + 1
      await spinTo(slotFor(prize), multi ? 2600 : 4500, multi ? 3 : 5)
      if (multi && i < res.results.length - 1) await wait(650) // let the player see the prize
    }

    result.value = res
    games.fetchSpinLiveWins().catch(() => {})
  } catch (e) {
    toast.show(apiMessage(e, 'Spin failed, please try again'), 'error')
  } finally {
    spinning.value = false
    progress.value = { current: 0, total: 0 }
  }
}

// ───────────────────────── modals ─────────────────────────
const modal = ref<'prizes' | 'winners' | null>(null)
const winners = ref<LiveWin[]>([])
const winnersPage = ref(0)
const winnersTotalPages = ref(1)
const winnersLoading = ref(false)

async function loadWinners(reset = false) {
  if (winnersLoading.value) return
  if (reset) {
    winners.value = []
    winnersPage.value = 0
    winnersTotalPages.value = 1
  }
  if (winnersPage.value >= winnersTotalPages.value) return
  winnersLoading.value = true
  try {
    const data = await gamesApi.getSpinWinners(winnersPage.value + 1)
    winners.value.push(...data.data)
    winnersPage.value = data.page
    winnersTotalPages.value = data.totalPages
  } catch {
    // keep what we have
  } finally {
    winnersLoading.value = false
  }
}

function openWinners() {
  if (spinning.value) return
  modal.value = 'winners'
  loadWinners(true)
}

function onTrackClick(i: number) {
  if (!spinning.value) tierIndex.value = i
}

const trackX = [50, 220, 389, 558, 727] // dot centres in the Figma frame

const segmentBg = (i: number, active: boolean) => {
  if (active) return '#fbe166'
  return [
    'linear-gradient(#f76e4b,#f34433)',
    'linear-gradient(#f76e4b,#f34433)',
    'linear-gradient(#f26636,#df3a1a)',
    'linear-gradient(#f67710,#da670c)',
  ][i]
}
</script>

<template>
  <div class="relative w-full h-full bg-[#e11d10] overflow-hidden">
    <!-- full-screen vignette (also covers the bands beside / below the scene) -->
    <div
      class="absolute inset-0 pointer-events-none z-0 shadow-[inset_0px_0px_133px_97px_rgba(0,0,0,0.25)]"
    />

    <!--
      The scene keeps the Figma proportions (776 × 1591). It is as wide as the screen, but never so
      tall that it can't fit: on short screens it shrinks (down to 86% of the width, then it scrolls),
      on tall screens it is centred vertically.
    -->
    <div
      class="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden [container-type:size] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div class="min-h-full flex items-center justify-center">
        <div
          class="relative [container-type:inline-size] select-none shrink-0"
          :style="{
            width: `clamp(86cqw, calc(100cqh * ${FRAME.w} / ${FRAME.h}), 100cqw)`,
            aspectRatio: `${FRAME.w} / ${FRAME.h}`,
          }"
        >
          <!-- sparkles -->
          <img
            v-for="(s, i) in sparkles"
            :key="i"
            :src="s.src"
            alt=""
            class="absolute pointer-events-none"
            :style="s.style"
          />

          <!-- title -->
          <h1
            class="absolute left-0 right-0 text-center font-extrabold leading-none bg-clip-text text-transparent [filter:drop-shadow(0px_4px_2px_rgba(0,0,0,0.25))]"
            :style="{
              top: pct(79, FRAME.h),
              fontSize: u(64),
              letterSpacing: '0.01em',
              backgroundImage:
                'linear-gradient(183deg, rgb(247,255,247) 40%, rgb(253,222,114) 56%)',
            }"
          >
            Live Wins
          </h1>

          <!-- live wins row (endless marquee) -->
          <div
            class="absolute left-0 right-0 overflow-hidden"
            :style="{ top: pct(163, FRAME.h), height: u(140) }"
          >
            <div
              class="live-track flex items-end w-max h-full"
              :style="{ '--dur': `${Math.max(20, tiles.length * 5)}s` }"
            >
              <div
                v-for="copy in 2"
                :key="copy"
                class="flex items-end shrink-0"
                :style="{ gap: u(10), paddingRight: u(10) }"
                :aria-hidden="copy === 2"
              >
                <img
                  v-for="(t, i) in tiles"
                  :key="`${copy}-${t.key}`"
                  :src="t.img"
                  :alt="copy === 1 ? t.title : ''"
                  :title="t.title"
                  class="shrink-0 object-cover shadow-[0px_3px_2px_rgba(0,0,0,0.25)]"
                  :style="{
                    width: u(i === 0 ? 140 : 120),
                    height: u(i === 0 ? 140 : 120),
                    borderRadius: u(30),
                  }"
                />
              </div>
            </div>
          </div>

          <!-- lists -->
          <button
            v-for="b in [
              { label: 'Winners List', left: 25, action: openWinners },
              { label: 'Prizes List', left: 519, action: () => (modal = 'prizes') },
            ]"
            :key="b.label"
            type="button"
            :disabled="spinning"
            class="absolute flex items-center justify-center bg-[#195fd8] text-[#f5f5f5] font-extrabold shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed"
            :style="{
              left: u(b.left),
              top: pct(343, FRAME.h),
              width: u(232),
              height: u(75),
              borderRadius: u(30),
              fontSize: u(32),
              letterSpacing: '0.01em',
            }"
            @click="b.action()"
          >
            {{ b.label }}
          </button>

          <!-- wheel -->
          <div class="absolute" :style="{ left: u(62), top: pct(482, FRAME.h), width: u(650) }">
            <SpinWheel :slots="slots" :rotation="rotation" :duration="duration" />
          </div>

          <!-- multiplier -->
          <div
            class="absolute flex overflow-hidden bg-[#faa204] border-[#e93512]"
            :style="{
              left: u(23),
              top: pct(1204, FRAME.h),
              width: u(729),
              height: u(86),
              borderWidth: u(5),
              borderStyle: 'solid',
              borderRadius: u(45),
            }"
          >
            <button
              v-for="(n, i) in COUNTS"
              :key="n"
              type="button"
              class="flex-1 flex items-center justify-center border-[#9b1202] [border-left-width:1.5px] first:[border-left-width:0] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              :style="{ background: segmentBg(i, countIndex === i), gap: u(10) }"
              :disabled="spinning"
              @click="countIndex = i"
            >
              <span
                class="flex items-center justify-center border-[#ba3212] bg-gradient-to-b from-[#f97284] to-[#d25460] text-[#661115] font-extrabold shadow-[inset_0px_4px_2px_rgba(255,255,255,0.25)]"
                :style="{
                  width: u(56),
                  height: u(38),
                  borderRadius: u(10),
                  borderWidth: u(2),
                  borderStyle: 'solid',
                  fontSize: u(16),
                }"
              >
                SPIN
              </span>
              <span class="text-white font-extrabold leading-none" :style="{ fontSize: u(48) }"
                >{{ n }}X</span
              >
            </button>
          </div>

          <!-- tier slider -->
          <div
            class="absolute bg-[#fbe166] shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_2px_4px_rgba(255,255,255,0.25),inset_0px_-2px_4px_rgba(0,0,0,0.25)]"
            :style="{
              left: u(20),
              top: pct(1335, FRAME.h),
              width: u(737),
              height: u(26),
              borderRadius: u(30),
            }"
          />
          <template v-for="(x, i) in trackX.slice(0, tiers.length)" :key="x">
            <img
              v-if="i !== tierIndex"
              :src="i < tierIndex ? DotOn : DotOff"
              alt=""
              class="absolute pointer-events-none"
              :style="{
                left: pct(x - 10, FRAME.w),
                top: pct(1338, FRAME.h),
                width: u(20),
                height: u(20),
              }"
            />
            <img
              v-else
              :src="Knob"
              alt=""
              class="absolute pointer-events-none"
              :style="{
                left: pct(x - 32.5, FRAME.w),
                top: pct(1348 - 32.5, FRAME.h),
                width: u(65),
              }"
            />
            <button
              type="button"
              :disabled="spinning"
              class="absolute disabled:cursor-not-allowed"
              :style="{
                left: pct(x - 40, FRAME.w),
                top: pct(1348 - 40, FRAME.h),
                width: u(80),
                height: u(80),
              }"
              :aria-label="`${tiers[i]?.costStars} stars`"
              @click="onTrackClick(i)"
            />
          </template>

          <!-- stars balance -->
          <button
            type="button"
            :disabled="spinning"
            class="absolute flex items-center justify-center bg-[#fbe166] shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] disabled:opacity-60 disabled:cursor-not-allowed"
            :style="{
              left: u(61),
              top: pct(1412, FRAME.h),
              width: u(90),
              height: u(90),
              borderRadius: u(30),
            }"
            aria-label="Stars balance"
            @click="
              toast.show(`Your stars: ${(auth.user?.starsBalance ?? 0).toLocaleString()}`, 'info')
            "
          >
            <img :src="StarIcon" alt="" :style="{ width: u(64) }" />
          </button>

          <!-- spin button -->
          <button
            type="button"
            class="absolute group disabled:opacity-80 disabled:cursor-not-allowed"
            :style="{ left: u(187), top: pct(1397, FRAME.h), width: u(417), height: u(119) }"
            :disabled="spinning"
            @click="spin"
          >
            <span class="absolute inset-0 bg-[#0453a9]" :style="{ borderRadius: u(257) }" />
            <span
              class="absolute bg-[#90c8fb] shadow-[0px_0px_26px_6px_rgba(0,0,0,0.25)]"
              :style="{
                left: u(7),
                top: u(11),
                width: u(402),
                height: u(83),
                borderRadius: u(257),
              }"
            />
            <span
              class="absolute bg-[#005eb8] shadow-[0px_0px_12px_7px_rgba(0,0,0,0.25)]"
              :style="{
                left: u(7),
                top: u(16),
                width: u(402),
                height: u(89),
                borderRadius: u(257),
              }"
            />
            <span
              class="absolute bg-[#0491fd] shadow-[0px_0px_24px_1px_rgba(255,255,255,0.25),inset_0px_4px_22px_10px_rgba(0,0,0,0.25)] group-active:translate-y-px"
              :style="{ left: u(7), top: u(16), width: u(402), height: u(78), borderRadius: u(50) }"
            />
            <img
              :src="GlossB"
              alt=""
              class="absolute pointer-events-none"
              :style="{ left: u(34), top: u(22), width: u(40.3), transform: 'rotate(180deg)' }"
            />
            <img
              :src="GlossA"
              alt=""
              class="absolute pointer-events-none"
              :style="{ left: u(346), top: u(59.2), width: u(44) }"
            />
            <span
              class="absolute flex items-center justify-center font-extrabold text-white leading-none [text-shadow:0px_4px_2px_rgba(0,0,0,0.25)]"
              :style="{
                left: u(7),
                top: u(16),
                width: u(402),
                height: u(78),
                gap: u(10),
                fontSize: u(40),
              }"
            >
              {{
                spinning
                  ? progress.total > 1
                    ? `Spin ${progress.current}/${progress.total}`
                    : 'Spinning…'
                  : 'Spin for'
              }}
              <template v-if="!spinning">
                <img :src="StarIcon" alt="" :style="{ width: u(48) }" />
                {{ totalCost.toLocaleString() }}
              </template>
            </span>
          </button>
        </div>
      </div>
    </div>

    <SpinWinOverlay v-if="result" :result="result" @close="result = null" />

    <SpinPrizesModal v-if="modal === 'prizes'" :prizes="tier.prizes" @close="modal = null" />
    <SpinWinnersModal
      v-if="modal === 'winners'"
      :winners="winners"
      :loading="winnersLoading"
      :known-prizes="knownPrizes"
      @close="modal = null"
      @more="loadWinners()"
    />
  </div>
</template>

<style scoped>
.live-track {
  animation: live-scroll var(--dur, 30s) linear infinite;
}
.live-track:hover {
  animation-play-state: paused;
}
@keyframes live-scroll {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(-50%);
  }
}
@media (prefers-reduced-motion: reduce) {
  .live-track {
    animation: none;
  }
}
</style>
