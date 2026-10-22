<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import ChestCard from '@/components/ChestCard.vue'
import SpinWinOverlay from '@/components/SpinWinOverlay.vue'
import { sparkles, FRAME } from '@/views/spin-sparkles'
import { useGamesStore } from '@/stores/games'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { isApiDisabled } from '@/api/client'
import { FALLBACK_PRIZES, resolvePrizes, type ResolvedPrize } from '@/views/spin-prizes'
import type { SpinPrize, SpinResult } from '@/types'

const router = useRouter()
const games = useGamesStore()
const toast = useToast()

const PICKS = 3
const CHESTS = 9

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

// ───────────────────────── prizes ─────────────────────────
onMounted(() => {
  games.fetchRoulettePrizes().catch(() => {})
})

const prizePool = computed<SpinPrize[]>(() => {
  const api = games.roulettePrizes
  if (!api.length) return FALLBACK_PRIZES
  return api.map((p) => ({
    type: p.type as SpinPrize['type'],
    value: p.value,
    weight: p.weight,
    label: p.label,
  }))
})

const describe = (p: SpinPrize): ResolvedPrize => resolvePrizes([p])[0]!

/** local stand-in for the server while the API is switched off in dev mode */
function simulate(): SpinPrize {
  const list = prizePool.value
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
const remaining = computed(() => PICKS - opened.value)

function reset() {
  slots.value = freshSlots()
  won.value = []
  finished.value = false
  result.value = null
}

async function pick(i: number) {
  const slot = slots.value[i]!
  if (busy.value || finished.value || slot.state !== 'closed') return
  busy.value = true
  slot.state = 'opening'
  try {
    let prize: SpinPrize
    if (isApiDisabled) {
      prize = simulate()
    } else {
      const r = await games.playRoulette()
      prize = {
        type: (r.prize.type as SpinPrize['type']) ?? 'coins',
        value: r.prize.value,
        weight: r.prize.weight,
        label: r.prize.label,
      }
    }
    slot.prize = describe(prize)
    won.value.push(prize)
    // give the lid / light / prize animation time to play
    await new Promise((r) => setTimeout(r, 1500))
    slot.state = 'opened'
  } catch (e) {
    slot.state = 'closed'
    slot.prize = undefined
    busy.value = false
    toast.show(apiMessage(e, 'Could not open the chest'), 'error')
    return
  }

  if (won.value.length >= PICKS) await finish()
  busy.value = false
}

async function finish() {
  finished.value = true
  // reveal what the unpicked chests held
  for (const s of slots.value.filter((x) => x.state === 'closed')) {
    s.prize = describe(prizePool.value[Math.floor(Math.random() * prizePool.value.length)]!)
    s.state = 'ghost'
  }
  await new Promise((r) => setTimeout(r, 900))

  const results = [...won.value]
  result.value = {
    results,
    totalCoinsWon: results.filter((p) => p.type === 'coins').reduce((s, p) => s + p.value, 0),
    totalStarsWon: results.filter((p) => p.type === 'stars').reduce((s, p) => s + p.value, 0),
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
          {{ finished ? 'Your prizes' : 'Choose yours' }}
        </h1>
        <p
          class="font-bold text-white/90 [text-shadow:0px_2px_2px_rgba(0,0,0,0.3)] text-center"
          :style="{ fontSize: u(30), marginTop: u(4) }"
        >
          <template v-if="!finished">
            Open {{ remaining }} more {{ remaining === 1 ? 'chest' : 'chests' }}
          </template>
          <template v-else>Here is what the other chests held</template>
        </p>

        <div
          class="grid grid-cols-3 w-full"
          :style="{ gap: `${u(14)} ${u(10)}`, marginTop: u(34) }"
        >
          <ChestCard
            v-for="(s, i) in slots"
            :key="i"
            :state="s.state"
            :img="s.prize?.img"
            :label="s.prize?.amount"
            :seed="i"
            :disabled="busy && s.state === 'closed'"
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
            @click="reset"
          >
            Play again
          </button>
          <button
            type="button"
            class="font-extrabold text-white/90 underline underline-offset-4"
            :style="{ fontSize: u(30) }"
            @click="router.push('/games')"
          >
            Back to games
          </button>
        </div>
      </div>
    </div>

    <SpinWinOverlay v-if="result" :result="result" unit="chest" @close="result = null" />
  </div>
</template>
