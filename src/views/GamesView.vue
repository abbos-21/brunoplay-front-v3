<script setup lang="ts">
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { GameMegaChest, GameSpin, GameRide, GameJackpot } from '@/assets/images'

const isMenuOpen = ref(false)

const gameCards = [
  {
    key: 'mega-chest',
    title: 'Mega Chest',
    tag: 'Popular',
    img: GameMegaChest,
    to: '/games/roulette',
    border: 'border-[#de2623]',
    tagBg: 'bg-gradient-to-b from-[#ea3226] to-[#cb151e]',
  },
  {
    key: 'spin',
    title: 'Fortune Spin',
    tag: 'Hot',
    img: GameSpin,
    to: '/games/spin',
    border: 'border-[#fa7408]',
    tagBg: 'bg-gradient-to-b from-[#fda109] to-[#f96a07]',
  },
  {
    key: 'ride',
    title: 'Bruno’s Ride',
    tag: 'Common',
    img: GameRide,
    to: '/games/ride',
    border: 'border-[#2b981c]',
    tagBg: 'bg-gradient-to-b from-[#77dd24] to-[#1c8b1a]',
  },
  {
    key: 'jackpot',
    title: 'Jackpot',
    tag: 'New',
    img: GameJackpot,
    to: null,
    border: 'border-[#2898f2]',
    tagBg: 'bg-gradient-to-b from-[#4b95d8] to-[#1899fd]',
  },
]
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <StarBalance />
      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <div
      class="flex flex-col gap-[clamp(1.25rem,6vw,1.75rem)] mt-[clamp(1.25rem,6vw,1.75rem)] pt-3 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
    >
      <div
        v-for="game in gameCards"
        :key="game.key"
        class="relative shrink-0 flex items-center gap-[3%] bg-[#fde7b8] border-[3px] rounded-[clamp(1.5rem,7vw,2.25rem)] px-[4%] py-[3%] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_4px_9px_rgba(0,0,0,0.25)]"
        :class="game.border"
      >
        <!-- Tag pill -->
        <span
          class="absolute left-1/2 -translate-x-1/2 -top-[clamp(0.75rem,4vw,1.05rem)] px-[clamp(1.5rem,8vw,2.25rem)] rounded-full border border-black text-white font-bold leading-tight whitespace-nowrap text-[length:clamp(0.9rem,5vw,1.5rem)] shadow-[inset_0px_-6px_4px_rgba(0,0,0,0.25),inset_0px_8px_4px_rgba(255,255,255,0.25)]"
          :class="game.tagBg"
        >
          {{ game.tag }}
        </span>

        <!-- Image -->
        <div
          class="shrink-0 w-[clamp(4.5rem,21%,8rem)] aspect-square rounded-[clamp(0.9rem,4.5vw,1.5rem)] overflow-hidden shadow-[0px_0px_35px_5px_#fbe166]"
          :class="{ 'blur-[2px]': !game.to }"
        >
          <img :src="game.img" :alt="game.title" class="w-full h-full object-cover" />
        </div>

        <!-- Title -->
        <h2
          class="flex-1 min-w-0 text-center font-bold text-[#552a0f] leading-tight tracking-wide text-[length:clamp(1.15rem,6.4vw,1.9rem)]"
          :class="{ 'opacity-50 blur-[1.5px]': !game.to }"
        >
          {{ game.title }}
        </h2>

        <!-- Action -->
        <RouterLink
          v-if="game.to"
          :to="game.to"
          class="btn-gradient-orange shrink-0 w-[clamp(3.75rem,21%,6.5rem)] text-center border-2 border-[#c66a27] !rounded-full font-extrabold outlined [--outline:#D76826] text-[length:clamp(0.95rem,5vw,1.5rem)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)]"
        >
          Go
        </RouterLink>
        <span
          v-else
          class="btn-gradient-orange shrink-0 w-[clamp(3.75rem,21%,6.5rem)] text-center border-2 border-[#c66a27] !rounded-full font-extrabold text-white/80 text-[length:clamp(0.8rem,4.2vw,1.2rem)] opacity-60 blur-[1px] select-none"
        >
          Soon
        </span>
      </div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
