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

const prizeText = (p: Tournament['prizes'][number]) =>
  [p.coins > 0 && `${p.coins.toLocaleString('en-US')} ${t('coins')}`, p.stars > 0 && `${p.stars.toLocaleString('en-US')} ${t('stars')}`, p.gift]
    .filter(Boolean)
    .join(' + ')

const name = (e: LeaderboardEntry) => e.username || e.firstName || `#${e.userId}`
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-clip pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <button type="button" :aria-label="$t('Back')" class="size-10 rounded-full bg-[#f96a07] border border-[#d9680f] flex items-center justify-center" @click="router.push('/games')">
        <ArrowLeftSVG class="w-5 text-white" />
      </button>
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <CoinBalance />
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <div class="mt-4 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col gap-4">
      <section v-if="tournament" class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-4 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <h1 class="font-extrabold text-[#552a0f] leading-tight text-[length:clamp(1.3rem,6.5vw,1.8rem)]">🏆 {{ tournament.name }}</h1>
        <p v-if="tournament.description" class="mt-1 text-[#8a5a2b]">{{ tournament.description }}</p>
        <p class="mt-2 font-bold text-[#552a0f]">{{ $t(METRIC[tournament.metric] ?? tournament.metric) }}</p>

        <p v-if="clockTarget" class="mt-1 font-extrabold tabular-nums text-[#c8200f] text-[length:clamp(1.1rem,5.5vw,1.5rem)]">
          {{ tournament.status === 'SCHEDULED' ? $t('Starts in') : $t('Ends in') }} {{ formatted }}
        </p>
        <p v-else-if="tournament.status !== 'ACTIVE'" class="mt-1 font-bold text-[#8a5a2b]">{{ $t('Finished') }}</p>

        <h2 class="mt-3 font-bold text-[#552a0f]">{{ $t('Prizes') }}</h2>
        <ul class="mt-1 text-[#552a0f]">
          <li v-for="p in tournament.prizes" :key="p.place" class="flex justify-between gap-2">
            <span class="font-bold">#{{ p.place }}</span><span class="text-right">{{ prizeText(p) }}</span>
          </li>
        </ul>

        <div v-if="tournament.joined" class="mt-3 rounded-2xl bg-[#e4f7d6] border border-[#74c14e] px-3 py-2 font-bold text-[#1f6a05]">
          {{ $t('You are in') }} · {{ $t('Your score') }}: {{ tournament.score.toLocaleString('en-US') }}
          <template v-if="tournament.rank"> · {{ $t('Place') }} #{{ tournament.rank }}</template>
        </div>
        <button
          v-else-if="tournament.status === 'ACTIVE' || tournament.status === 'SCHEDULED'"
          type="button"
          :disabled="games.isLoading"
          class="mt-3 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-1.5 font-bold text-white text-[length:clamp(1.05rem,5.2vw,1.35rem)] disabled:opacity-60"
          @click="join"
        >
          {{ $t('Join') }}
          <template v-if="tournament.entryFee > 0"><img :src="StarIcon" alt="" class="w-[1.15em]" />{{ tournament.entryFee.toLocaleString('en-US') }}</template>
          <template v-else>· {{ $t('free') }}</template>
        </button>
      </section>

      <section class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <h2 class="font-bold text-[#552a0f] text-[length:clamp(1.1rem,5.5vw,1.4rem)]">{{ $t('Leaderboard') }}</h2>
        <ol class="mt-2 flex flex-col gap-1">
          <li v-for="e in entries" :key="e.userId" class="flex items-center gap-2 rounded-xl px-2 py-1" :class="e.userId === auth.user?.id ? 'bg-[#fbe166]' : ''">
            <span class="w-8 font-extrabold text-[#552a0f] tabular-nums">{{ e.rank }}</span>
            <span class="flex-1 min-w-0 truncate font-bold text-[#552a0f]">{{ name(e) }}</span>
            <span class="font-extrabold text-[#552a0f] tabular-nums flex items-center gap-1">
              <img v-if="tournament?.metric === 'COINS_MINED'" :src="CoinImage" alt="" class="w-[1.1em]" />{{ e.score.toLocaleString('en-US') }}
            </span>
          </li>
        </ol>
        <p v-if="!entries.length && !loading" class="py-4 text-center text-[#8a5a2b] font-bold">{{ $t('Nobody has joined yet') }}</p>
        <button
          v-if="board && entries.length < board.total"
          type="button"
          :disabled="loading"
          class="mt-2 w-full rounded-full bg-[#fde7b8] border border-[#e3b66f] py-1.5 font-bold text-[#552a0f]"
          @click="loadMore"
        >
          {{ $t('Show more') }}
        </button>
        <p v-if="board?.userRank && !entries.some((e) => e.userId === auth.user?.id)" class="mt-2 text-center font-bold text-[#552a0f]">
          {{ $t('Your place') }}: #{{ board.userRank }} · {{ (board.userScore ?? 0).toLocaleString('en-US') }}
        </p>
      </section>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
