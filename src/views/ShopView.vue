<script setup lang="ts">
import { ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { ExclamationSVG } from '@/assets/svgs'
import { RouterLink } from 'vue-router'
import { MiningRate, CoinCapacity, EnergyRate } from '@/assets/images'

const isMenuOpen = ref(false)

const shopItems = [
  { img: MiningRate, alt: 'mining-rate', title: 'Mining rate', current: '0.01', next: '0.02' },
  { img: CoinCapacity, alt: 'coin-capacity', title: 'Coin capacity', current: '100', next: '200' },
  { img: EnergyRate, alt: 'energy-rate', title: 'Energy rate', current: '800', next: '1000' },
]
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center">
      <CoinBalance />
      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-base sm:text-xl">
      <RouterLink
        to="/"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#c17e23] text-white"
      >
        Cards
      </RouterLink>
      <RouterLink
        to="/"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#fde7b8] text-[#552a0f]"
      >
        Boosters
      </RouterLink>
    </div>

    <div class="flex flex-col gap-2 mt-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div v-for="item in shopItems" :key="item.alt" class="shop-card flex p-3 relative">
        <div class="w-[40%] relative">
          <img :src="item.img" :alt="item.alt" class="w-full" />
          <span
            class="btn-gradient-orange border border-[#c66a27] text-[#410200] absolute bottom-0 left-1/2 -translate-x-1/2 font-bold text-sm sm:text-base px-2 sm:px-4 text-center whitespace-nowrap"
          >
            Lvl: 1
          </span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-between py-2 min-w-0 pr-8">
          <h1 class="font-bold text-[#552A0F] text-lg sm:text-2xl text-center">{{ item.title }}</h1>

          <p class="font-bold text-[#890D00] text-base sm:text-xl border-b border-dashed border-black flex items-center gap-1 whitespace-nowrap">
            {{ item.current }}
            <svg class="w-3 sm:w-4 shrink-0" viewBox="0 0 27 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 5.8L14.8 2.88C14.8 2.10667 15.0267 1.44 15.48 0.880004C15.9333 0.293337 16.64 3.8147e-06 17.6 3.8147e-06C18.0267 3.8147e-06 18.48 0.120004 18.96 0.360005C19.44 0.573338 19.96 0.920005 20.52 1.4L26.04 6.00001C26.2267 6.24001 26.3733 6.54667 26.48 6.92001C26.5867 7.29334 26.64 7.70667 26.64 8.16C26.64 8.8 26.5333 9.29334 26.32 9.64C26.1333 9.98667 25.88 10.2933 25.56 10.56L17.92 16.64C16.9333 16.4 16.2533 16.04 15.88 15.56C15.5067 15.08 15.32 14.5733 15.32 14.04C15.32 13.48 15.44 12.9733 15.68 12.52C15.92 12.0667 16.2 11.6 16.52 11.12L17 10.52H0.64C0.506667 10.2533 0.36 9.92 0.2 9.52001C0.0666667 9.12 1.49012e-08 8.69334 1.49012e-08 8.24001C1.49012e-08 7.38667 0.186667 6.77334 0.56 6.4C0.96 6 1.48 5.8 2.12 5.8H17Z"
                fill="#890D00"
              />
            </svg>
            {{ item.next }}
          </p>

          <button
            type="button"
            class="btn-gradient-orange border-2 border-[#c66a27] text-base sm:text-xl px-3 sm:px-4 py-px outlined [--outline:#D76826] font-bold relative"
          >
            Upgrade
            <svg class="w-3 absolute top-px left-1 -rotate-45" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="8" cy="8" rx="6" ry="3" fill="white" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="btn-orange absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center rounded-full shrink-0"
        >
          <ExclamationSVG class="w-3" />
        </button>
      </div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
