<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { StarIcon, ArrowLeftSVG } from '@/assets/svgs'
import { CoinImage } from '@/assets/images'
import { TrophyIcon, MedalFirst, MedalSecond, MedalThird, GiftIcon } from '@/assets/icons'
import { getLeaderboard } from '@/api/tournaments'
import { useGamesStore } from '@/stores/games'
import { useAuthStore } from '@/stores/auth'
import { useTopUp } from '@/composables/useTopUp'
import { useToast } from '@/composables/useToast'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useCountdown } from '@/composables/useCountdown'
import type { LeaderboardEntry, LeaderboardResponse, Tournament } from '@/types'

const route = useRoute()
const router = useRouter()
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

// the clock shows the time to the start (not started yet) or to the end
const clockTarget = computed(() => {
  const x = tournament.value
  if (!x) return null
  return x.status === 'SCHEDULED' ? x.startAt : x.status === 'ACTIVE' ? x.endAt : null
})
const { formatted } = useCountdown(() => clockTarget.value)

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

const MEDALS = [MedalFirst, MedalSecond, MedalThird]
const medal = (rank: number) => MEDALS[rank - 1]
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
  <div class="w-full h-full bg-shop p-4 relative overflow-clip pb-8 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <button
        type="button"
        :aria-label="$t('Back')"
        class="size-10 shrink-0 rounded-full bg-[#f96a07] border border-[#d9680f] p-2.5 flex items-center justify-center shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
        @click="router.push('/games')"
      >
        <ArrowLeftSVG class="w-full text-white" />
      </button>
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <CoinBalance />
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <div class="mt-4 flex-1 min-h-0 overflow-y-scroll flex flex-col gap-4 px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <!-- the tournament -->
      <section v-if="tournament" :class="[card, 'shrink-0 overflow-hidden']">
        <div class="relative px-4 pt-4 pb-3 bg-[linear-gradient(180deg,#fbe166,#fff4d6)]">
          <span
            class="absolute right-3 top-3 rounded-full border px-2.5 py-px font-bold uppercase tracking-wide leading-tight text-white text-[length:clamp(0.62rem,3vw,0.78rem)]"
            :class="STATUS.cls"
          >
            {{ $t(STATUS.label) }}
          </span>
          <div class="flex items-center gap-3">
            <div class="shrink-0 size-[clamp(4.25rem,21vw,5.5rem)] rounded-2xl flex items-center justify-center bg-[radial-gradient(circle_at_50%_35%,#fff6bf,#fbe166_70%,#f6b73c)] border border-[#e3b66f] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.5),inset_0px_-3px_3px_rgba(0,0,0,0.12)]">
              <img :src="TrophyIcon" alt="" class="w-[78%] drop-shadow-[0_4px_4px_rgba(85,42,15,0.35)]" />
            </div>
            <div class="min-w-0 flex-1 pr-12">
              <h1 class="font-extrabold text-[#552a0f] leading-tight text-[length:clamp(1.25rem,6.4vw,1.75rem)]">{{ tournament.name }}</h1>
              <p v-if="tournament.description" class="text-[#8a5a2b] leading-tight text-[length:clamp(0.75rem,3.6vw,0.95rem)]">{{ tournament.description }}</p>
            </div>
          </div>
        </div>

        <div class="px-4 pb-4">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="rounded-full bg-[#fde7b8] border border-[#e3b66f] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
              {{ $t(METRIC[tournament.metric] ?? tournament.metric) }}
            </span>
            <span class="rounded-full bg-[#fde7b8] border border-[#e3b66f] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.75rem,3.6vw,0.95rem)] inline-flex items-center gap-1">
              <template v-if="tournament.entryFee > 0">{{ $t('Entry') }} <img :src="StarIcon" alt="" class="w-[1.1em]" />{{ num(tournament.entryFee) }}</template>
              <template v-else>{{ $t('Free entry') }}</template>
            </span>
          </div>

          <div v-if="clockTarget" class="mt-3 rounded-2xl bg-[#552a0f] px-4 py-2 text-center shadow-[inset_0px_3px_4px_rgba(0,0,0,0.4)]">
            <p class="font-bold uppercase tracking-wide text-[#fbe166] text-[length:clamp(0.65rem,3.1vw,0.8rem)]">
              {{ tournament.status === 'SCHEDULED' ? $t('Starts in') : $t('Ends in') }}
            </p>
            <p class="font-extrabold tabular-nums text-white leading-none text-[length:clamp(1.6rem,8.4vw,2.3rem)]">{{ formatted }}</p>
          </div>

          <!-- joined, or the join button -->
          <div v-if="tournament.joined" class="mt-3 grid grid-cols-2 gap-2 text-center">
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
            class="mt-3 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.15rem,5.8vw,1.5rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_3px_3px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
            @click="join"
          >
            {{ $t('Join') }}
            <template v-if="tournament.entryFee > 0"><img :src="StarIcon" alt="" class="w-[1.1em]" />{{ num(tournament.entryFee) }}</template>
          </button>
        </div>
      </section>

      <!-- prizes -->
      <section v-if="tournament" :class="[card, 'shrink-0 p-3']">
        <h2 class="px-1 font-extrabold text-[#552a0f] text-[length:clamp(1.1rem,5.5vw,1.4rem)]">{{ $t('Prizes') }}</h2>
        <ul class="mt-2 flex flex-col gap-1.5">
          <li
            v-for="p in tournament.prizes"
            :key="p.place"
            class="flex items-center gap-3 rounded-2xl bg-[#fde7b8] border border-[#e3b66f] px-3 py-1.5"
          >
            <span class="w-9 shrink-0 flex justify-center">
              <img v-if="medal(p.place)" :src="medal(p.place)" alt="" class="size-8 object-contain" />
              <span v-else class="font-extrabold tabular-nums text-[#8a5a2b]">#{{ p.place }}</span>
            </span>
            <span class="flex-1 min-w-0 flex flex-wrap items-center justify-end gap-x-3 gap-y-0.5 font-extrabold text-[#552a0f] text-[length:clamp(0.9rem,4.4vw,1.15rem)]">
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
            class="flex items-center gap-2.5 rounded-2xl px-2.5 py-1.5 border"
            :class="e.userId === auth.user?.id ? 'bg-[#fbe166] border-[#cf8741]' : 'bg-[#fde7b8]/60 border-[#e3b66f]/60'"
          >
            <span class="w-8 shrink-0 flex justify-center">
              <img v-if="medal(e.rank)" :src="medal(e.rank)" alt="" class="size-7 object-contain" />
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
        <p v-if="!entries.length && !loading" class="py-4 text-center text-[#8a5a2b] font-bold">{{ $t('Nobody has joined yet') }}</p>
        <button
          v-if="board && entries.length < board.total"
          type="button"
          :disabled="loading"
          class="mt-2 w-full rounded-full bg-[#fde7b8] border border-[#e3b66f] py-1.5 font-bold text-[#552a0f] active:translate-y-px"
          @click="loadMore"
        >
          {{ $t('Show more') }}
        </button>
        <p v-if="board?.userRank && !entries.some((e) => e.userId === auth.user?.id)" class="mt-2 text-center font-bold text-[#552a0f]">
          {{ $t('Your place') }}: #{{ board.userRank }} · {{ num(board.userScore ?? 0) }}
        </p>
      </section>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
