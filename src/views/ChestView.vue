<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChestCard from '@/components/ChestCard.vue'
import SpinWinOverlay from '@/components/SpinWinOverlay.vue'
import { sparkles, FRAME } from '@/views/spin-sparkles'
import { useGamesStore } from '@/stores/games'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { apiCode, isApiDisabled } from '@/api/client'
import { StarIcon } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import { useTopUp } from '@/composables/useTopUp'
import { playSfx } from '@/composables/useSfx'
import { FALLBACK_PRIZES, resolvePrizes, type ResolvedPrize } from '@/views/spin-prizes'
import type { ChestPrize, SpinPrize, SpinResult } from '@/types'

const router = useRouter()
const games = useGamesStore()
const toast = useToast()

const CHESTS = 9

// A round is paid once; the server draws its prizes at that moment, so the order of the taps changes nothing.
// A paid round survives leaving the app: it is resumed from the server.
const auth = useAuthStore()
const topUp = useTopUp()
const PICKS = computed(() => games.chest?.picksPerRound ?? 3)
const ROUND_COST = computed(() => games.chest?.roundCostStars ?? 10)
// the balance is unknown until the player has loaded (then the round can start, the server checks it)
const canPay = computed(() => !auth.user || auth.user.starsBalance >= ROUND_COST.value)
const started = ref(false) // the round is paid and the chests can be opened

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

const toPrize = (p: ChestPrize): SpinPrize => ({ type: p.type, value: p.value, weight: 0, label: p.label, gift: p.gift })
const describe = (p: SpinPrize): ResolvedPrize => resolvePrizes([p])[0]!

/** local stand-in for the server while the API is switched off in dev mode */
function simulate(): SpinPrize {
  const list = FALLBACK_PRIZES
  let roll = Math.random() * list.reduce((s, p) => s + p.weight, 0)
  return list.find((p) => (roll -= p.weight) < 0) ?? list[0]!
}

// ───────────────────────── round state ─────────────────────────
type Slot = { state: 'closed' | 'opening' | 'opened' | 'ghost'; prize?: ResolvedPrize }
const freshSlots = (): Slot[] => Array.from({ length: CHESTS }, () => ({ state: 'closed' }))

const slots = ref<Slot[]>(freshSlots())
const won = ref<SpinPrize[]>([])
const busy = ref(false)
const finished = ref(false)
const result = ref<SpinResult | null>(null)

const opened = computed(() => won.value.length)
const remaining = computed(() => PICKS.value - opened.value)

onMounted(async () => {
  if (isApiDisabled) return
  try {
    const st = await games.fetchChest()
    const round = st.round
    if (round) {
      // a paid round is waiting: show the chests that were already opened
      started.value = true
      for (const o of round.opened) {
        const slot = slots.value[o.slot]
        if (!slot) continue
        const prize = toPrize(o.prize)
        slot.prize = describe(prize)
        slot.state = 'opened'
        won.value.push(prize)
      }
    }
  } catch (e) {
    toast.show(apiMessage(e, 'Could not load the chests'), 'error')
  }
})

function reset() {
  slots.value = freshSlots()
  won.value = []
  finished.value = false
  result.value = null
  started.value = false
}

/** pay for a round (the chests unlock) */
async function startRound() {
  if (busy.value) return
  if (!canPay.value) {
    topUp.open()
    return
  }
  if (isApiDisabled) {
    started.value = true
    return
  }
  busy.value = true
  try {
    await games.startChestRound()
    started.value = true
  } catch (e) {
    if (apiCode(e) === 'INSUFFICIENT_STARS') topUp.open()
    toast.show(apiMessage(e, 'Could not start the round'), 'error')
  } finally {
    busy.value = false
  }
}

/** "Play again": a fresh round, paid straight away (or the pay screen when there are not enough stars) */
function playAgain() {
  reset()
  void startRound()
}

async function pick(i: number) {
  const slot = slots.value[i]!
  if (busy.value || finished.value || slot.state !== 'closed') return
  if (!started.value) return
  busy.value = true
  slot.state = 'opening'
  let done: { results: SpinPrize[]; coins: number; stars: number } | null = null
  try {
    let prize: SpinPrize
    if (isApiDisabled) {
      prize = simulate()
    } else {
      const r = await games.pickChest(i)
      prize = toPrize(r.prize)
      if (r.finished) {
        done = {
          results: (r.results ?? []).map(toPrize),
          coins: r.totalCoinsWon ?? 0,
          stars: r.totalStarsWon ?? 0,
        }
      }
    }
    slot.prize = describe(prize)
    won.value.push(prize)
    playSfx('chestOpen')
    setTimeout(() => playSfx('reveal'), 1100) // the prize pops out of the chest
    // give the lid / light / prize animation time to play
    await new Promise((r) => setTimeout(r, 2300))
    slot.state = 'opened'
  } catch (e) {
    slot.state = 'closed'
    slot.prize = undefined
    busy.value = false
    toast.show(apiMessage(e, 'Could not open the chest'), 'error')
    return
  }

  if (won.value.length >= PICKS.value) await finish(done)
  busy.value = false
}

async function finish(done: { results: SpinPrize[]; coins: number; stars: number } | null) {
  finished.value = true
  // the chests that were not opened are shown open and dimmed; the server does not reveal what was in them
  for (const s of slots.value.filter((x) => x.state === 'closed')) s.state = 'ghost'
  await new Promise((r) => setTimeout(r, 900))

  const results = done?.results.length ? done.results : [...won.value]
  result.value = {
    results,
    totalCoinsWon: done ? done.coins : results.filter((p) => p.type === 'coins').reduce((s, p) => s + p.value, 0),
    totalStarsWon: done ? done.stars : results.filter((p) => p.type === 'stars').reduce((s, p) => s + p.value, 0),
  }
}
</script>

<template>
  <div class="relative w-full h-full overflow-hidden bg-[#e11d10]">
    <!-- same look as the Fortune Spin page: red, dark vignette, golden sparkles -->
    <div
      class="absolute inset-0 pointer-events-none shadow-[inset_0px_0px_133px_97px_rgba(0,0,0,0.25)]"
    />
    <div class="absolute inset-0 z-0 overflow-hidden pointer-events-none [container-type:inline-size]">
      <div class="relative w-full" :style="{ aspectRatio: `${FRAME.w} / ${FRAME.h}` }">
        <img
          v-for="(s, i) in sparkles"
          :key="i"
          :src="s.src"
          alt=""
          class="absolute"
          :style="s.style"
        />
      </div>
    </div>

    <div
      class="relative z-10 w-full h-full overflow-y-auto overflow-x-hidden [container-type:inline-size] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        class="min-h-full flex flex-col items-center overflow-x-clip"
        :style="{ padding: `${u(40)} ${u(20)} ${u(40)}` }"
      >
        <h1
          class="font-extrabold text-white leading-tight text-center [text-shadow:0px_4px_2px_rgba(0,0,0,0.25)]"
          :style="{ fontSize: u(64), letterSpacing: '0.01em' }"
        >
          {{ finished ? $t('Your prizes') : $t('Choose yours') }}
        </h1>
        <p
          class="font-bold text-white/90 [text-shadow:0px_2px_2px_rgba(0,0,0,0.3)] text-center"
          :style="{ fontSize: u(30), marginTop: u(4) }"
        >
          <template v-if="!finished">
            <template v-if="started">{{ $tn('Open {n} more chest|Open {n} more chests', remaining) }}</template>
            <template v-else>{{ $t('Pay once, open {n} chests', { n: PICKS }) }}</template>
          </template>
          <template v-else>{{ $t('Nice! Want another round?') }}</template>
        </p>

        <div
          class="grid grid-cols-3 w-full"
          :style="{ gap: `${u(14)} ${u(10)}`, marginTop: u(66) }"
        >
          <ChestCard
            v-for="(s, i) in slots"
            :key="i"
            :state="s.state"
            :img="s.prize?.img"
            :label="s.prize?.amount"
            :kind="s.prize?.kind"
            :seed="i"
            :disabled="(busy || !started) && s.state === 'closed'"
            @pick="pick(i)"
          />
        </div>

        <!-- pick counter -->
        <div class="flex items-center justify-center" :style="{ gap: u(16), marginTop: u(26) }">
          <span
            v-for="n in PICKS"
            :key="n"
            class="rounded-full border-2 transition-all duration-300"
            :class="
              n <= opened
                ? 'bg-[#fbe166] border-[#fbe166] shadow-[0_0_12px_rgba(255,225,100,0.9)]'
                : 'bg-white/10 border-white/80'
            "
            :style="{ width: u(34), height: u(34) }"
          />
        </div>

        <div
          v-if="finished"
          class="flex flex-col items-center"
          :style="{ marginTop: u(34), gap: u(14) }"
        >
          <button
            type="button"
            class="bg-[#fbe166] text-[#552a0f] font-extrabold shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] active:translate-y-px"
            :style="{ width: u(420), height: u(90), borderRadius: u(30), fontSize: u(44) }"
            @click="playAgain"
          >
            <span class="inline-flex items-center justify-center gap-[0.25em]">
              {{ $t('Play again') }}
              <img :src="StarIcon" alt="" class="w-[1.05em]" />{{ ROUND_COST }}
            </span>
          </button>
          <button
            type="button"
            class="font-extrabold text-white/90 underline underline-offset-4"
            :style="{ fontSize: u(30) }"
            @click="router.push('/games')"
          >
            {{ $t('Back to games') }}
          </button>
        </div>
      </div>
    </div>

    <!-- pay once to open the 3 chests of a round -->
    <div v-if="!started && !finished" class="absolute inset-0 z-20 flex items-center justify-center bg-black/35 p-6">
      <div
        class="w-full max-w-[16rem] rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-4 py-4 text-center text-[#552a0f] shadow-[0px_6px_10px_rgba(0,0,0,0.3)]"
      >
        <h2 class="font-extrabold leading-tight text-[length:clamp(1.3rem,6vw,1.6rem)]">{{ $t('Mega Chest') }}</h2>
        <p class="mt-0.5 text-[#8a5a2b] font-bold text-[length:clamp(0.85rem,4vw,1rem)]">{{ $t('Open {n} chests', { n: PICKS }) }}</p>
        <button
          type="button"
          class="mt-4 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.05rem,5.2vw,1.35rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
          @click="startRound"
        >
          <template v-if="!canPay">{{ $t('Get stars') }}</template>
          <template v-else>
            {{ $t('Play') }}
            <img :src="StarIcon" alt="" class="w-[1.15em]" />{{ ROUND_COST }}
          </template>
        </button>
        <button
          type="button"
          class="mt-2 text-[#8a5a2b] font-bold text-[length:clamp(0.85rem,4vw,1rem)] active:opacity-70"
          @click="router.push('/games')"
        >
          {{ $t('Back') }}
        </button>
      </div>
    </div>

    <SpinWinOverlay v-if="result" :result="result" unit="chest" @close="result = null" />
  </div>
</template>
