<script setup lang="ts">
import CoinBalance from '@/components/CoinBalance.vue'
import EnergyLevel from '@/components/EnergyLevel.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { CalendarImage, PuzzleImage } from '@/assets/images'
</script>

<template>
  <div class="w-full h-full bg-home p-2 relative flex flex-col justify-between items-center">
    <div class="w-full flex justify-between items-center">
      <CoinBalance />

      <div class="flex items-center gap-6">
        <EnergyLevel />
        <HamburgerButton />
      </div>
    </div>

    <ProgressBar
      :current-value="120"
      :max-value="300"
      class="w-36 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
    />

    <div class="mb-20 flex items-end justify-between w-full">
      <div class="flex flex-col items-center -ms-2">
        <RouterLink to="/"> <img :src="CalendarImage" alt="Calendar" class="w-20" /> </RouterLink>
        <RouterLink to="/">
          <img :src="PuzzleImage" alt="Puzzle" class="w-20" />
        </RouterLink>
      </div>

      <button
        type="button"
        class="fishing-button w-fit py-1 px-5 font-bold text-white outlined [--outline:#532B23] text-2xl cursor-pointer mb-10 ms-2"
      >
        Fishing
      </button>

      <div class="w-20"></div>
    </div>
  </div>
</template>

<style scoped lang="css">
.fishing-button {
  background: #fbe166;
  border: 1px solid #552a0f;
  box-shadow: inset 0px -3px 4px #935324;
  border-radius: 12px;
}
</style>
