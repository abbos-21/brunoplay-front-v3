<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useGamesStore } from '@/stores/games'
import { useCountdown } from '@/composables/useCountdown'
import { TournamentBadge } from '@/assets/images'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { GameMegaChest, GameSpin, GameRide } from '@/assets/images'

const isMenuOpen = ref(false)
const games = useGamesStore()

// the tournament running now (or the next one)
const tournament = computed(() => games.activeTournament)
const { formatted } = useCountdown(() => {
  const x = tournament.value
  return x ? (x.status === 'SCHEDULED' ? x.startAt : x.endAt) : null
})

onMounted(() => {
  games.fetchTournaments().catch(() => {})
})

const gameCards = [
  {
    key: 'mega-chest',
    motion: 'game-chest',
    title: 'Mega Chest',
    tag: 'Popular',
    hint: 'Pick a chest and win up to 5,000 coins',
    img: GameMegaChest,
    to: '/games/roulette',
    accent: '#de2623',
    accentDark: '#a81a18',
  },
  {
    key: 'spin',
    motion: 'game-wheel',
    title: 'Fortune Spin',
    tag: 'Hot',
    hint: 'Spin the wheel for coins and stars',
    img: GameSpin,
    to: '/games/spin',
    accent: '#f96a07',
    accentDark: '#c85405',
  },
  {
    key: 'ride',
    motion: 'game-car',
    title: 'Bruno’s Ride',
    tag: 'Common',
    hint: 'Drive, dodge and collect coins',
    img: GameRide,
    to: '/games/ride',
    accent: '#2b981c',
    accentDark: '#1f7414',
  },
]
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

    <div
      class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <!-- the tournament running now (or the next one) -->
      <article
        v-if="tournament"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <div class="flex items-center gap-5">
          <div class="shrink-0 w-[clamp(4.75rem,23vw,6.25rem)] aspect-square">
            <img decoding="async" loading="lazy" :src="TournamentBadge" :alt="tournament.name" class="game-art game-pulse w-full h-full object-contain drop-shadow-[0_4px_4px_rgba(85,42,15,0.35)]" />
          </div>

          <div class="flex-1 min-w-0">
            <span
              class="inline-block rounded-full bg-[#c8200f] px-2.5 py-px font-bold text-white leading-tight text-[length:clamp(0.65rem,3.1vw,0.8rem)] uppercase tracking-wide"
            >
              {{ $t('Tournament') }}
            </span>
            <h2 class="mt-1 truncate font-bold text-[#552a0f] leading-tight text-[length:clamp(1.2rem,6.2vw,1.7rem)]">{{ tournament.name }}</h2>
            <p class="font-bold tabular-nums text-[#8a5a2b] leading-tight text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
              {{ tournament.status === 'SCHEDULED' ? $t('Starts in') : $t('Ends in') }} {{ formatted }}
              <template v-if="tournament.joined && tournament.rank">, {{ $t('Place') }} #{{ tournament.rank }}</template>
            </p>
            <RouterLink
              :to="`/tournaments/${tournament.id}`"
              class="mt-2 inline-flex items-center justify-center rounded-full border border-[#a81a18] bg-[#de2623] px-7 py-1 font-bold text-white text-[length:clamp(0.95rem,4.6vw,1.2rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
            >
              {{ tournament.joined ? $t('Open') : $t('Join') }}
            </RouterLink>
          </div>
        </div>
      </article>

      <article
        v-for="game in gameCards"
        :key="game.key"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <div class="flex items-center gap-5">
          <div
            class="shrink-0 w-[clamp(4.75rem,23vw,6.25rem)] aspect-square rounded-2xl overflow-hidden game-tile"
            :class="{ 'grayscale opacity-70': !game.to }"
          >
            <img decoding="async" loading="lazy" :src="game.img" :alt="$t(game.title)" class="game-art w-full h-full object-cover" :class="game.motion" />
          </div>

          <div class="flex-1 min-w-0">
            <span
              class="inline-block rounded-full px-2.5 py-px font-bold text-white leading-tight text-[length:clamp(0.65rem,3.1vw,0.8rem)] uppercase tracking-wide"
              :style="{ backgroundColor: game.accent }"
            >
              {{ $t(game.tag) }}
            </span>
            <h2 class="mt-1 font-bold text-[#552a0f] leading-tight text-[length:clamp(1.2rem,6.2vw,1.7rem)]">{{ $t(game.title) }}</h2>
            <p class="text-[#8a5a2b] leading-tight text-[length:clamp(0.75rem,3.6vw,0.95rem)]">{{ $t(game.hint) }}</p>
          <RouterLink
            v-if="game.to"
            :to="game.to"
            class="mt-2 inline-flex items-center justify-center rounded-full border px-7 py-1 font-bold text-white text-[length:clamp(0.95rem,4.6vw,1.2rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
            :style="{ backgroundColor: game.accent, borderColor: game.accentDark }"
          >
            {{ $t('Play') }}
          </RouterLink>
          <span
            v-else
            class="mt-2 inline-flex items-center justify-center rounded-full border border-[#b59468] bg-[#c9a97d] px-5 py-1 font-bold text-white text-[length:clamp(0.95rem,4.6vw,1.2rem)] select-none"
          >
            {{ $t('Coming soon') }}
          </span>
          </div>
        </div>

      </article>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>

<style scoped>
/* the pictures are alive: each game gets its own gentle motion, plus a light sweep across the tile */
.game-tile {
  position: relative;
}
.game-tile::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.55) 50%, transparent 65%);
  transform: translateX(-120%);
  animation: sweep 3.6s ease-in-out infinite;
  pointer-events: none;
}
.game-art {
  transform-origin: 50% 60%;
}
.game-chest {
  animation: chest 2.8s ease-in-out infinite;
}
.game-wheel {
  animation: wheel 4s ease-in-out infinite;
}
.game-car {
  animation: car 0.9s ease-in-out infinite;
}
.game-pulse {
  animation: pulse 1.8s ease-in-out infinite;
}

@keyframes sweep {
  0%,
  55% {
    transform: translateX(-120%);
  }
  100% {
    transform: translateX(120%);
  }
}
/* the chest hops and wiggles, then rests */
@keyframes chest {
  0%,
  55%,
  100% {
    transform: translateY(0) rotate(0) scale(1);
  }
  62% {
    transform: translateY(-6%) rotate(-4deg) scale(1.05);
  }
  72% {
    transform: translateY(0) rotate(4deg) scale(1.02);
  }
  82% {
    transform: translateY(-3%) rotate(-3deg) scale(1.03);
  }
  90% {
    transform: translateY(0) rotate(2deg) scale(1);
  }
}
/* the wheel swings back and forth like it is about to spin */
@keyframes wheel {
  0%,
  100% {
    transform: rotate(-10deg) scale(1.04);
  }
  50% {
    transform: rotate(10deg) scale(1.04);
  }
}
/* the car bounces along the road */
@keyframes car {
  0%,
  100% {
    transform: translateY(0) rotate(0);
  }
  50% {
    transform: translateY(-3%) rotate(-1.5deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.06);
    filter: brightness(1.15);
  }
}

@media (prefers-reduced-motion: reduce) {
  .game-tile::after,
  .game-art {
    animation: none;
  }
}
</style>
