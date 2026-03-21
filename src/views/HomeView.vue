<script setup lang="ts">
import { onMounted, computed, ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import EnergyLevel from '@/components/EnergyLevel.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import PuzzlePanel from '@/components/PuzzlePanel.vue'
import PuzzlePanelNew from '@/components/PuzzlePanelNew.vue'
import { CalendarImage, PuzzleImage } from '@/assets/images'
import { useFishingStore } from '@/stores/fishing'
import { useDailyStore } from '@/stores/daily'
import { useFormatters } from '@/composables/useFormatters'
import { usePolling } from '@/composables/usePolling'

const isMenuOpen = ref(false)
const isPuzzleOpen = ref(false)
const fishing = useFishingStore()

const daily = useDailyStore()

const { formatCoins } = useFormatters()
const collecting = ref(false)

onMounted(async () => {
  await fishing.fetchStatus()
  await daily.fetchActivity()
  await daily.fetchCombo()
})

usePolling(() => fishing.sync(), 2500)

const canCollect = computed(() => (fishing.status?.tankCoins ?? 0) > 0)

async function handleFishing() {
  try {
    if (!fishing.isFishing) {
      await fishing.start()
    } else {
      collecting.value = true
      await fishing.collect()
    }
  } catch (e: any) {
  } finally {
    collecting.value = false
  }
}
</script>

<template>
  <div
    class="w-full h-full bg-home p-4 relative flex flex-col justify-between items-center overflow-hidden"
  >
    <div class="w-full flex justify-between items-center">
      <CoinBalance />
      <!-- <div class="flex items-center gap-3 sm:gap-6"> -->
      <!-- <EnergyLevel /> -->
      <HamburgerButton v-model="isMenuOpen" />
      <!-- </div> -->
    </div>

    <ProgressBar
      :current-value="+formatCoins(fishing.status?.tankCoins ?? 0)"
      :max-value="+formatCoins(fishing.status?.tankCapacity ?? 0)"
      class="w-28 sm:w-36 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
    />

    <div class="mb-24 flex items-end justify-between w-full">
      <div class="flex flex-col items-center -ms-4">
        <button><img :src="CalendarImage" alt="Calendar" class="w-14 sm:w-20" /></button>
        <button @click="isPuzzleOpen = true">
          <img :src="PuzzleImage" alt="Puzzle" class="w-14 sm:w-20" />
        </button>
      </div>

      <button
        type="button"
        @click="handleFishing"
        :disabled="collecting || fishing.isLoading"
        class="bg-[#fbe166] border border-[#552a0f] shadow-[inset_0px_-3px_4px_#935324] rounded-xl w-fit py-1 px-3 sm:px-5 font-bold text-white outlined [--outline:#532B23] text-xl sm:text-2xl cursor-pointer mb-10 ms-4"
      >
        <span v-if="!fishing.isFishing">Fishing</span>
        <span v-else-if="canCollect">Collect </span>
        <!-- <span v-else>Fishing... wait for tank to fill</span> -->
      </button>

      <div class="w-14 sm:w-20"></div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
    <PuzzlePanelNew v-model="isPuzzleOpen" />
  </div>
</template>
