<script setup lang="ts">
import { ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import { LEVEL_STYLES } from '@/composables/levelStyles'
import { locale } from '@/i18n'

const isMenuOpen = ref(false)
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

    <h1 class="mt-4 text-center font-bold text-white text-[length:clamp(1.3rem,6.6vw,1.8rem)] [text-shadow:0px_2px_4px_rgba(0,0,0,0.35)]">
      {{ $t('Levels') }}
    </h1>

    <div class="mt-3 grid grid-cols-2 gap-3 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 content-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div
        v-for="l in LEVEL_STYLES"
        :key="l.level"
        class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-2 py-3 flex flex-col items-center shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
        :class="{ 'col-span-2': l.level === 10 }"
      >
        <LevelBadge :level="l.level" height="clamp(4.5rem,24vw,6rem)" class="!ms-0" />
        <p class="mt-1 font-bold text-[#552a0f] text-[length:clamp(1rem,5vw,1.3rem)] leading-tight">{{ $t(l.name) }}</p>
        <p class="text-[#8a5a2b] font-bold text-[length:clamp(0.65rem,3.1vw,0.8rem)]" :class="locale === 'en' ? 'uppercase tracking-wide' : ''">{{ $t('Level {n}', { n: l.level }) }}</p>
      </div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
