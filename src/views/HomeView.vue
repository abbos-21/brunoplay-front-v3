<script setup lang="ts">
import { ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import EnergyLevel from '@/components/EnergyLevel.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import { CalendarImage, PuzzleImage } from '@/assets/images'
import { ArrowLeftSVG } from '@/assets/svgs'

const isMenuOpen = ref(false)
</script>

<template>
  <div
    class="w-full h-full bg-home p-4 relative flex flex-col justify-between items-center overflow-hidden"
  >
    <div class="w-full flex justify-between items-center">
      <CoinBalance />

      <div class="flex items-center gap-6">
        <EnergyLevel />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <ProgressBar
      :current-value="120"
      :max-value="300"
      class="w-36 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
    />

    <div class="mb-24 flex items-end justify-between w-full">
      <div class="flex flex-col items-center -ms-4">
        <RouterLink to="/"> <img :src="CalendarImage" alt="Calendar" class="w-20" /> </RouterLink>
        <RouterLink to="/">
          <img :src="PuzzleImage" alt="Puzzle" class="w-20" />
        </RouterLink>
      </div>

      <button
        type="button"
        class="fishing-button w-fit py-1 px-5 font-bold text-white outlined [--outline:#532B23] text-2xl cursor-pointer mb-10 ms-4"
      >
        Fishing
      </button>

      <div class="w-20"></div>
    </div>

    <div v-if="isMenuOpen" class="absolute inset-0 bg-black/40 z-40" @click="isMenuOpen = false" />

    <!-- Slide Panel -->
    <div
      class="absolute top-0 right-0 h-full w-[90%] z-50 transition-transform duration-300 ease-out py-1"
      :class="isMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="bg-[#FBE166] h-full rounded-s-lg p-2">
        <!-- <div class="p-4 font-bold text-xl">Menu</div> -->

        <button
          type="button"
          @click="isMenuOpen = false"
          class="close-menu-button w-10 h-10 p-2 rounded-full flex justify-center items-center"
        >
          <ArrowLeftSVG class="w-full" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fishing-button {
  background: #fbe166;
  border: 1px solid #552a0f;
  box-shadow: inset 0px -3px 4px #935324;
  border-radius: 12px;
}

.close-menu-button {
  background: #fb7a38;
  box-shadow:
    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
}
</style>
