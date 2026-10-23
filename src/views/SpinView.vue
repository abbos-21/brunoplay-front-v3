<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import SpinWheel, { type WheelSlot } from '@/components/SpinWheel.vue'
import StarBalance from '@/components/StarBalance.vue'
import { useTopUp } from '@/composables/useTopUp'
import { sparkles, FRAME } from '@/views/spin-sparkles'
import { StarIcon } from '@/assets/svgs'
import { CoinImage, TrophyImage, GiftBoxImage } from '@/assets/images'
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
const topUp = useTopUp()


// ───────────────────────── data ─────────────────────────
/** 500 → "500", 2500 → "2.5K", 1000000 → "1M" */
const shortCost = (n: number) =>
  n >= 1_000_000 ? `${Number((n / 1_000_000).toFixed(1))}M` : n >= 1000 ? `${Number((n / 1000).toFixed(1))}K` : String(n)
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

// for now the wheel and the prize list show only the real prizes (the 8 gifts): no coin or star prizes
const shownPrizes = computed(() => {
  const gifts = tier.value.prizes.filter((p) => p.type === 'gift')
  return gifts.length ? gifts : tier.value.prizes
})
// the player can pay for the chosen pack (unknown balance, e.g. API off, counts as enough)
const enough = computed(() => !auth.user || auth.user.starsBalance >= totalCost.value)


const prizeText = (p: SpinPrize) =>
  p.label || (p.type === 'gift' ? `Gift #${p.value}` : `${p.value.toLocaleString('en-US')} ${p.type}`)

// The wheel always has 8 slots, filled from the selected tier's prizes (repeating when there are fewer).
// When a won prize is not one of those, the landing slot temporarily shows the prize that was won,
// so the arrow always points at what you actually got.
const wheelPrizes = computed<ResolvedPrize[]>(() => {
  const all = resolvePrizes(shownPrizes.value)
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
      chip: shown.kind === 'gift' ? undefined : `+${shown.prize.value.toLocaleString('en-US')}`,
    }
  }),
)
const knownPrizes = computed(() => tiers.value.flatMap((t) => t.prizes))

type LiveItem = { key: number; img: string; title: string; name: string; amount: string; stars: boolean }
const placeholderTiles: LiveItem[] = [Win1, Win2, Win3, Win4, Win5, Win2, Win4].map((img, i) => ({
  key: -i - 1,
  img,
  title: '',
  name: '',
  amount: '',
  stars: false,
}))
const tiles = computed<LiveItem[]>(() => {
  if (!games.spinLiveWins.length) return placeholderTiles
  return games.spinLiveWins.map((w, i) => ({
    key: w.id,
    img: WIN_TILES[(w.id + i) % WIN_TILES.length]!,
    title: `${w.username}: ${w.prizeValue.toLocaleString('en-US')} ${w.prizeType}`,
    name: w.username,
    amount: shortCost(w.prizeValue),
    // gifts and stars are counted in stars, coins in coins
    stars: w.prizeType !== 'coins',
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
  const list = shownPrizes.value
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
</script>

<template>
  <div class="relative w-full h-full bg-[#e11d10] overflow-hidden">
    <!-- same look as the other game pages: red, dark vignette, golden sparkles -->
    <div class="absolute inset-0 pointer-events-none z-0 shadow-[inset_0px_0px_133px_97px_rgba(0,0,0,0.25)]" />
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none [container-type:inline-size]">
      <div class="relative w-full" :style="{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }">
        <img v-for="(s, i) in sparkles" :key="i" :src="s.src" alt="" class="absolute" :style="s.style" />
      </div>
    </div>

    <div class="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <div class="min-h-full flex flex-col items-center gap-2.5 p-4 pb-5">
        <!-- stars and the two lists -->
        <div class="w-full flex items-center justify-between gap-2">
          <StarBalance />
          <div class="flex gap-1.5">
            <button
              type="button"
              :disabled="spinning"
              class="flex items-center gap-1.5 rounded-full border border-[#b9722a] bg-[#fff4d6] py-1 pl-2 pr-3.5 font-bold text-[#552a0f] text-[length:clamp(0.8rem,3.8vw,1rem)] shadow-[0px_3px_3px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-50"
              @click="openWinners"
            >
              <img :src="TrophyImage" alt="" class="h-[1.35em] w-auto" />Winners
            </button>
            <button
              type="button"
              :disabled="spinning"
              class="flex items-center gap-1.5 rounded-full border border-[#b9722a] bg-[#fff4d6] py-1 pl-2 pr-3.5 font-bold text-[#552a0f] text-[length:clamp(0.8rem,3.8vw,1rem)] shadow-[0px_3px_3px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-50"
              @click="modal = 'prizes'"
            >
              <img :src="GiftBoxImage" alt="" class="h-[1.35em] w-auto" />Prizes
            </button>
          </div>
        </div>

        <!-- live wins: a "LIVE" tag and a ticker of the latest wins -->
        <div class="w-full flex items-center gap-2 rounded-full border border-white/15 bg-black/25 p-1.5">
          <span class="shrink-0 flex items-center gap-1 rounded-full bg-[#e5261b] px-2.5 py-0.5 font-extrabold uppercase tracking-wide text-white text-[0.68rem]">
            <span class="size-1.5 rounded-full bg-white animate-pulse" />Live
          </span>
          <div class="ticker min-w-0 flex-1 overflow-hidden">
            <div class="live-track flex items-center w-max" :style="{ '--dur': `${Math.max(20, tiles.length * 5)}s` }">
              <div v-for="copy in 2" :key="copy" class="flex items-center shrink-0 gap-3 pr-3" :aria-hidden="copy === 2">
                <div v-for="t in tiles" :key="`${copy}-${t.key}`" class="flex items-center gap-1.5 shrink-0" :title="t.title">
                  <img :src="t.img" :alt="copy === 1 ? t.title : ''" class="size-8 rounded-lg object-cover" />
                  <span v-if="t.name" class="flex items-center gap-1 font-bold text-white/90 text-[0.78rem] whitespace-nowrap">
                    {{ t.name }}
                    <img :src="t.stars ? StarIcon : CoinImage" alt="" class="w-[1.1em]" />
                    <b class="text-white tabular-nums">{{ t.amount }}</b>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!--
          The drawing is bigger than its box: the rims reach 12% beyond each side and the pointer 11% above,
          so the box is 78% wide and gets matching room above and below (percent margins follow the width).
        -->
        <div class="w-[78%] mt-[calc(9.4%+0.9rem)] mb-[calc(5.1%+0.9rem)]">
          <SpinWheel :slots="slots" :rotation="rotation" :duration="duration" />
        </div>

        <!-- controls -->
        <div class="w-full max-w-[24rem] rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_6px_10px_rgba(0,0,0,0.3)]">
          <p class="px-1 font-bold uppercase tracking-wide text-[#8a5a2b] text-[0.65rem]">Price per spin</p>
          <div class="mt-1 grid gap-1" :style="{ gridTemplateColumns: `repeat(${tiers.length}, minmax(0, 1fr))` }">
            <button
              v-for="(t, i) in tiers"
              :key="t.tier"
              type="button"
              :disabled="spinning"
              class="flex items-center justify-center gap-0.5 rounded-full border py-1 font-bold tabular-nums text-[length:clamp(0.75rem,3.6vw,0.95rem)] transition-colors disabled:opacity-60"
              :class="
                tierIndex === i
                  ? 'border-[#d9680f] bg-[#f96a07] text-white'
                  : 'border-[#e3b66f] bg-[#fde7b8] text-[#552a0f]'
              "
              @click="tierIndex = i"
            >
              <img :src="StarIcon" alt="" class="w-[1.1em]" />{{ shortCost(t.costStars) }}
            </button>
          </div>

          <p class="mt-3 px-1 font-bold uppercase tracking-wide text-[#8a5a2b] text-[0.65rem]">Spins</p>
          <div class="mt-1 grid grid-cols-4 gap-1">
            <button
              v-for="(n, i) in COUNTS"
              :key="n"
              type="button"
              :disabled="spinning"
              class="rounded-full border py-1 font-bold text-[length:clamp(0.85rem,4vw,1.05rem)] transition-colors disabled:opacity-60"
              :class="
                countIndex === i
                  ? 'border-[#d9680f] bg-[#f96a07] text-white'
                  : 'border-[#e3b66f] bg-[#fde7b8] text-[#552a0f]'
              "
              @click="countIndex = i"
            >
              {{ n }}×
            </button>
          </div>

          <button
            type="button"
            class="mt-3 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.1rem,5.6vw,1.45rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px disabled:opacity-70"
            :disabled="spinning"
            @click="enough ? spin() : topUp.open()"
          >
            <template v-if="spinning">
              {{ progress.total > 1 ? `Spin ${progress.current}/${progress.total}` : 'Spinning…' }}
            </template>
            <template v-else-if="!enough">Get stars</template>
            <template v-else>
              Spin
              <img :src="StarIcon" alt="" class="w-[1.15em]" />{{ totalCost.toLocaleString('en-US') }}
            </template>
          </button>
        </div>
      </div>
    </div>

    <SpinWinOverlay v-if="result" :result="result" @close="result = null" />

    <SpinPrizesModal v-if="modal === 'prizes'" :prizes="shownPrizes" @close="modal = null" />
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
/* the ticker fades out at both ends */
.ticker {
  -webkit-mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(to right, transparent, #000 8%, #000 92%, transparent);
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
