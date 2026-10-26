<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import PlaceTrophy from '@/components/PlaceTrophy.vue'
import { StarIcon } from '@/assets/svgs'
import { CoinImage, TournamentBadge } from '@/assets/images'
import { GiftIcon } from '@/assets/icons'
import { getLeaderboard } from '@/api/tournaments'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { useTopUp } from '@/composables/useTopUp'
import { useToast } from '@/composables/useToast'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useCountdown } from '@/composables/useCountdown'
import type { LeaderboardEntry, LeaderboardResponse, Tournament, TournamentPrize } from '@/types'

const route = useRoute()
const games = useGamesStore()
const auth = useAuthStore()
const toast = useToast()
const topUp = useTopUp()
const isMenuOpen = ref(false)
const id = Number(route.params.id)

const tournament = computed<Tournament | undefined>(() => games.tournaments.find((x) => x.id === id))
const board = ref<LeaderboardResponse | null>(null)
const entries = ref<LeaderboardEntry[]>([])
const page = ref(0)
const loading = ref(false)

async function loadMore() {
  if (loading.value) return
  if (page.value > 0 && entries.value.length >= (board.value?.total ?? 0)) return
  loading.value = true
  try {
    const r = await getLeaderboard(id, page.value + 1)
    board.value = r
    entries.value.push(...(r.entries ?? []))
    page.value += 1
  } catch (e) {
    toast.show(apiMessage(e, 'Could not load the leaderboard'), 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    await games.fetchTournaments()
  } catch (e) {
    toast.show(apiMessage(e, 'Could not load the tournament'), 'error')
  }
  await loadMore()
})

// the clock counts down to the start (not started yet) or to the end
const clockTarget = computed(() => {
  const x = tournament.value
  if (!x) return null
  return x.status === 'SCHEDULED' ? x.startAt : x.status === 'ACTIVE' ? x.endAt : null
})
const { remaining } = useCountdown(() => clockTarget.value)
const pad = (n: number) => String(n).padStart(2, '0')
const clock = computed(() => {
  const s = Math.floor(remaining.value / 1000)
  return [
    { v: pad(Math.floor(s / 86400)), l: 'days' },
    { v: pad(Math.floor((s % 86400) / 3600)), l: 'hours' },
    { v: pad(Math.floor((s % 3600) / 60)), l: 'min' },
    { v: pad(s % 60), l: 'sec' },
  ]
})

const METRIC: Record<string, string> = {
  STARS_SPENT: 'Stars spent in games',
  RIDE_BEST: 'Best Ride score',
  COINS_MINED: 'Coins mined',
  FRIENDS_INVITED: 'Friends invited',
}

const STATUS = computed(() => {
  switch (tournament.value?.status) {
    case 'ACTIVE': return { label: 'Live', cls: 'bg-[#1fb826] border-[#168a1c]' }
    case 'SCHEDULED': return { label: 'Soon', cls: 'bg-[#f96a07] border-[#d9680f]' }
    case 'CANCELLED': return { label: 'Cancelled', cls: 'bg-[#8a5a2b] border-[#6b4520]' }
    default: return { label: 'Ended', cls: 'bg-[#8a5a2b] border-[#6b4520]' }
  }
})

async function join() {
  const x = tournament.value
  if (!x || games.isLoading) return
  if (x.entryFee > 0 && auth.user && auth.user.starsBalance < x.entryFee) {
    topUp.open()
    return
  }
  try {
    await games.joinTournament(x.id)
    toast.show(t('You joined the tournament'), 'success')
    page.value = 0
    entries.value = []
    await loadMore()
  } catch (e) {
    if (apiCode(e) === 'INSUFFICIENT_STARS') topUp.open()
    toast.show(apiMessage(e, 'Could not join'), 'error')
  }
}

// ── prizes: the podium (2nd, 1st, 3rd) and the rest of the places as rows
const prizeOf = (place: number): TournamentPrize | undefined => tournament.value?.prizes.find((p) => p.place === place)
const podium = computed(() =>
  [2, 1, 3]
    .map((place) => ({ place, prize: prizeOf(place) }))
    .filter((x): x is { place: number; prize: TournamentPrize } => !!x.prize),
)
const otherPrizes = computed(() => (tournament.value?.prizes ?? []).filter((p) => p.place > 3).sort((a, b) => a.place - b.place))
const PODIUM_STYLE: Record<number, { h: string; bg: string; label: string }> = {
  1: { h: 'h-24', bg: 'bg-[linear-gradient(180deg,#ffd45a,#f2a424)] border-[#c17e23]', label: '1st' },
  2: { h: 'h-16', bg: 'bg-[linear-gradient(180deg,#e4eaf0,#aeb9c5)] border-[#8a97a4]', label: '2nd' },
  3: { h: 'h-12', bg: 'bg-[linear-gradient(180deg,#eaa56a,#b86c33)] border-[#8a4f22]', label: '3rd' },
}

const num = (n: number) => n.toLocaleString('en-US')
const name = (e: LeaderboardEntry) => e.username || e.firstName || `#${e.userId}`
const AVATARS = ['#2f9bff', '#ff3d77', '#ffa530', '#22b615', '#8a5cff']
const avatar = (e: LeaderboardEntry) => AVATARS[e.userId % AVATARS.length]
const metricIcon = computed(() => {
  const m = tournament.value?.metric
  return m === 'COINS_MINED' ? CoinImage : m === 'STARS_SPENT' ? StarIcon : ''
})

const card = 'rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] shadow-[0px_4px_4px_rgba(0,0,0,0.25)]'
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-clip pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <div class="mt-4 flex-1 min-h-0 overflow-y-scroll flex flex-col gap-4 px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <!-- the tournament: badge, name, countdown, join -->
      <section v-if="tournament" :class="[card, 'shrink-0 overflow-hidden']">
        <div class="relative flex flex-col items-center px-4 pt-3 pb-1 bg-[radial-gradient(ellipse_at_50%_30%,#fff6bf,#fbe166_55%,#f6c248)]">
          <span
            class="absolute right-3 top-3 rounded-full border px-2.5 py-px font-bold uppercase tracking-wide leading-tight text-white text-[length:clamp(0.62rem,3vw,0.78rem)]"
            :class="STATUS.cls"
          >
            {{ $t(STATUS.label) }}
          </span>
          <img :src="TournamentBadge" alt="" class="size-[clamp(9rem,46vw,12rem)] object-contain drop-shadow-[0_6px_6px_rgba(85,42,15,0.4)]" />
        </div>

        <div class="px-4 pb-4 text-center">
          <h1 class="mt-2 font-extrabold text-[#552a0f] leading-tight text-[length:clamp(1.3rem,6.6vw,1.8rem)]">{{ tournament.name }}</h1>
          <p v-if="tournament.description" class="mt-0.5 text-[#8a5a2b] leading-tight text-[length:clamp(0.78rem,3.7vw,0.95rem)]">{{ tournament.description }}</p>

          <div class="mt-3 flex items-center justify-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#fde7b8] border border-[#e3b66f] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
              {{ $t(METRIC[tournament.metric] ?? tournament.metric) }}
            </span>
            <span class="rounded-full bg-[#fde7b8] border border-[#e3b66f] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.75rem,3.6vw,0.95rem)] inline-flex items-center gap-1">
              <template v-if="tournament.entryFee > 0">{{ $t('Entry') }} <img :src="StarIcon" alt="" class="w-[1.1em]" />{{ num(tournament.entryFee) }}</template>
              <template v-else>{{ $t('Free entry') }}</template>
            </span>
            <span v-if="board" class="rounded-full bg-[#fde7b8] border border-[#e3b66f] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
              {{ num(board.total) }} {{ $t('players') }}
            </span>
          </div>

          <!-- countdown -->
          <template v-if="clockTarget">
            <p class="mt-4 font-bold uppercase tracking-wide text-[#8a5a2b] text-[length:clamp(0.7rem,3.3vw,0.85rem)]">
              {{ tournament.status === 'SCHEDULED' ? $t('Starts in') : $t('Ends in') }}
            </p>
            <div class="mt-1 grid grid-cols-4 gap-2">
              <div v-for="c in clock" :key="c.l" class="rounded-2xl bg-[#552a0f] py-1.5 shadow-[inset_0px_3px_4px_rgba(0,0,0,0.45)]">
                <p class="font-extrabold tabular-nums leading-none text-[#fbe166] text-[length:clamp(1.4rem,7.4vw,2rem)]">{{ c.v }}</p>
                <p class="mt-0.5 font-bold uppercase text-white/70 text-[length:clamp(0.55rem,2.6vw,0.7rem)]">{{ $t(c.l) }}</p>
              </div>
            </div>
          </template>

          <!-- joined, or the join button -->
          <div v-if="tournament.joined" class="mt-4 grid grid-cols-2 gap-2">
            <div class="rounded-2xl bg-[#e4f7d6] border border-[#74c14e] py-1.5">
              <p class="font-bold uppercase tracking-wide text-[#2f7a12] text-[length:clamp(0.62rem,3vw,0.78rem)]">{{ $t('Your score') }}</p>
              <p class="font-extrabold tabular-nums text-[#1f6a05] text-[length:clamp(1.1rem,5.6vw,1.5rem)]">{{ num(tournament.score) }}</p>
            </div>
            <div class="rounded-2xl bg-[#e4f7d6] border border-[#74c14e] py-1.5">
              <p class="font-bold uppercase tracking-wide text-[#2f7a12] text-[length:clamp(0.62rem,3vw,0.78rem)]">{{ $t('Place') }}</p>
              <p class="font-extrabold tabular-nums text-[#1f6a05] text-[length:clamp(1.1rem,5.6vw,1.5rem)]">{{ tournament.rank ? '#' + tournament.rank : '—' }}</p>
            </div>
          </div>
          <button
            v-else-if="tournament.status === 'ACTIVE' || tournament.status === 'SCHEDULED'"
            type="button"
            :disabled="games.isLoading"
            class="mt-4 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.15rem,5.8vw,1.5rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_3px_3px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
            @click="join"
          >
            {{ $t('Join') }}
            <template v-if="tournament.entryFee > 0"><img :src="StarIcon" alt="" class="w-[1.1em]" />{{ num(tournament.entryFee) }}</template>
          </button>
        </div>
      </section>

      <!-- prizes: a podium for the first three places -->
      <section v-if="tournament" :class="[card, 'shrink-0 p-3']">
        <h2 class="px-1 font-extrabold text-[#552a0f] text-[length:clamp(1.1rem,5.5vw,1.4rem)]">{{ $t('Prizes') }}</h2>

        <div v-if="podium.length" class="mt-3 flex items-end justify-center gap-2">
          <div v-for="x in podium" :key="x.place" class="flex-1 min-w-0 flex flex-col items-center">
            <PlaceTrophy :place="x.place" :class="x.place === 1 ? 'size-[clamp(2.6rem,13vw,3.4rem)]' : 'size-[clamp(2rem,10vw,2.7rem)]'" />
            <div class="mt-1 flex flex-col items-center gap-0.5 font-extrabold text-[#552a0f] text-[length:clamp(0.78rem,3.9vw,1rem)] leading-tight">
              <span v-if="x.prize.coins > 0" class="inline-flex items-center gap-1 tabular-nums"><img :src="CoinImage" alt="" class="w-[1.15em]" />{{ num(x.prize.coins) }}</span>
              <span v-if="x.prize.stars > 0" class="inline-flex items-center gap-1 tabular-nums"><img :src="StarIcon" alt="" class="w-[1.15em]" />{{ num(x.prize.stars) }}</span>
              <span v-if="x.prize.gift" class="inline-flex items-center gap-1 capitalize"><img :src="GiftIcon" alt="" class="w-[1.2em]" />{{ x.prize.gift }}</span>
            </div>
            <div
              class="mt-2 w-full rounded-t-2xl border-2 border-b-0 flex items-start justify-center pt-1.5 font-extrabold text-white [text-shadow:0px_2px_2px_rgba(0,0,0,0.35)] text-[length:clamp(1.2rem,6vw,1.6rem)]"
              :class="[PODIUM_STYLE[x.place]!.h, PODIUM_STYLE[x.place]!.bg]"
            >
              {{ x.place }}
            </div>
          </div>
        </div>

        <ul v-if="otherPrizes.length" class="mt-3 flex flex-col gap-1.5">
          <li v-for="p in otherPrizes" :key="p.place" class="flex items-center gap-3 rounded-2xl bg-[#fde7b8] border border-[#e3b66f] px-3 py-1.5 text-[length:clamp(0.9rem,4.4vw,1.15rem)]">
            <span class="w-9 shrink-0 text-center font-extrabold tabular-nums text-[#8a5a2b]">#{{ p.place }}</span>
            <span class="flex-1 min-w-0 flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 font-extrabold text-[#552a0f]">
              <span v-if="p.coins > 0" class="inline-flex items-center gap-1 tabular-nums"><img :src="CoinImage" alt="" class="w-[1.2em]" />{{ num(p.coins) }}</span>
              <span v-if="p.stars > 0" class="inline-flex items-center gap-1 tabular-nums"><img :src="StarIcon" alt="" class="w-[1.2em]" />{{ num(p.stars) }}</span>
              <span v-if="p.gift" class="inline-flex items-center gap-1 capitalize"><img :src="GiftIcon" alt="" class="w-[1.3em]" />{{ p.gift }}</span>
            </span>
          </li>
        </ul>
      </section>

      <!-- leaderboard -->
      <section :class="[card, 'shrink-0 p-3']">
        <h2 class="px-1 font-extrabold text-[#552a0f] text-[length:clamp(1.1rem,5.5vw,1.4rem)]">{{ $t('Leaderboard') }}</h2>
        <ol class="mt-2 flex flex-col gap-1.5">
          <li
            v-for="e in entries"
            :key="e.userId"
            class="flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 border text-[length:clamp(0.9rem,4.4vw,1.15rem)]"
            :class="e.userId === auth.user?.id ? 'bg-[#fbe166] border-[#cf8741]' : 'bg-[#fde7b8]/60 border-[#e3b66f]/60'"
          >
            <span class="w-8 shrink-0 flex justify-center">
              <PlaceTrophy v-if="e.rank <= 3" :place="e.rank" class="size-6" />
              <span v-else class="font-extrabold tabular-nums text-[#8a5a2b]">{{ e.rank }}</span>
            </span>
            <span
              class="size-8 shrink-0 rounded-full flex items-center justify-center font-extrabold text-white"
              :style="{ backgroundColor: avatar(e) }"
            >{{ name(e).charAt(0).toUpperCase() }}</span>
            <span class="flex-1 min-w-0 truncate font-bold text-[#552a0f]">
              {{ name(e) }}
              <span v-if="e.userId === auth.user?.id" class="ml-1 rounded-full bg-[#c8200f] px-1.5 text-[0.7em] uppercase text-white">{{ $t('You') }}</span>
            </span>
            <span class="inline-flex items-center gap-1 font-extrabold tabular-nums text-[#552a0f]">
              <img v-if="metricIcon" :src="metricIcon" alt="" class="w-[1.1em]" />{{ num(e.score) }}
            </span>
          </li>
        </ol>
        <p v-if="!entries.length && !loading" class="py-4 text-center text-[#8a5a2b] font-bold text-[length:clamp(0.9rem,4.4vw,1.15rem)]">{{ $t('Nobody has joined yet') }}</p>
        <button
          v-if="board && entries.length < board.total"
          type="button"
          :disabled="loading"
          class="mt-2 w-full rounded-full bg-[#fde7b8] border border-[#e3b66f] py-1.5 font-bold text-[#552a0f] active:translate-y-px text-[length:clamp(0.9rem,4.4vw,1.15rem)]"
          @click="loadMore"
        >
          {{ $t('Show more') }}
        </button>
        <p v-if="board?.userRank && !entries.some((e) => e.userId === auth.user?.id)" class="mt-2 text-center font-bold text-[#552a0f] text-[length:clamp(0.9rem,4.4vw,1.15rem)]">
          {{ $t('Your place') }}: #{{ board.userRank }}, {{ num(board.userScore ?? 0) }}
        </p>
      </section>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
