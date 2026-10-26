<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import CoinBalance from '@/components/CoinBalance.vue'
import LevelBadge from '@/components/LevelBadge.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import ProgressBar from '@/components/ProgressBar.vue'
import PendingDot from '@/components/PendingDot.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import PuzzlePanel from '@/components/PuzzlePanel.vue'
import CalendarPanel from '@/components/CalendarPanel.vue'
import { CalendarImage, PuzzleImage } from '@/assets/images'
import { useFishingStore } from '@/stores/fishing'
import { useDailyStore } from '@/stores/daily'
import { AdError } from '@/composables/useAds'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { t } from '@/i18n'

const toast = useToast()

const isMenuOpen = ref(false)
const isCalendarOpen = ref(false)
const isPuzzleOpen = ref(false)
const fishing = useFishingStore()

const daily = useDailyStore()

const collecting = ref(false)

let stopTicker: (() => void) | null = null

onMounted(async () => {
  // the tank is animated here; a fresh snapshot comes now, after each action, on focus and every 30 s (no polling)
  stopTicker = fishing.startTicker()
  await fishing.fetchStatus()
  await daily.fetchActivity()
  await daily.fetchCombo()
})
onUnmounted(() => stopTicker?.())

// the two things to do every day: claim the streak reward, play the combo (unknown until the server answers)
const streakPending = computed(() => daily.activityStatus?.canClaim === true)
const comboPending = computed(() => daily.comboStatus?.alreadyAttempted === false)

// with Autocollect the server collects every full tank and starts the next one: nothing to tap, no ad
const auto = computed(() => fishing.isFishing && fishing.autoCollect)
const canCollect = computed(() => fishing.canCollect && !auto.value)

async function handleFishing() {
  if (collecting.value || fishing.isLoading || auto.value) return
  try {
    if (!fishing.isFishing) {
      await fishing.start()
    } else if (!fishing.canCollect) {
      // nothing is spent: no ad is shown until the tank is full enough to collect
      toast.show(t('Collect once the tank is at least {n}% full', { n: fishing.status?.collectMinPercent ?? 10 }), 'info')
    } else {
      collecting.value = true
      await fishing.collect()
    }
  } catch (e) {
    toast.show(e instanceof AdError ? e.message : apiMessage(e, 'Something went wrong'), e instanceof AdError ? 'warning' : 'error')
  } finally {
    collecting.value = false
  }
}
</script>

<template>
  <div
    class="w-full h-full bg-home p-4 relative flex flex-col justify-between items-center overflow-clip"
  >
    <!-- <button @click="show('Saved successfully!', 'success', 1000)">Toast</button> -->
    <div class="w-full flex justify-between items-center">
      <CoinBalance />
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <RouterLink to="/level" class="flex items-center" :aria-label="$t('Levels')">
          <LevelBadge />
        </RouterLink>
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <ProgressBar
      :current-value="fishing.liveTank"
      :max-value="fishing.status?.tankCapacity || 1"
      class="w-28 sm:w-36 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2"
    />

    <div class="mb-24 flex items-end justify-between w-full">
      <div class="flex flex-col items-center -ms-4">
        <button
          type="button"
          class="relative"
          :aria-label="streakPending ? $t('Daily reward, ready to claim') : $t('Daily reward')"
          @click="isCalendarOpen = true"
        >
          <img decoding="async" :src="CalendarImage" :alt="$t('Daily reward')" class="w-14 sm:w-20" :class="{ 'daily-nudge': streakPending }" />
          <Transition name="dot"><PendingDot v-if="streakPending" /></Transition>
        </button>
        <button
          type="button"
          class="relative"
          :aria-label="comboPending ? $t('Daily combo, not played yet') : $t('Daily combo')"
          @click="isPuzzleOpen = true"
        >
          <img decoding="async"
            :src="PuzzleImage"
            :alt="$t('Daily combo')"
            class="w-14 sm:w-20"
            :class="{ 'daily-nudge daily-nudge-late': comboPending }"
          />
          <Transition name="dot"><PendingDot v-if="comboPending" /></Transition>
          <!-- style="background: #fbe066; filter: blur(20px)" -->
          <span class="absolute w-1/2 h-1/2 top-0 left-0 bg-[#fbe066] blur-2xl"></span>
        </button>
      </div>

      <button
        type="button"
        @click="handleFishing"
        :disabled="collecting || fishing.isLoading || auto"
        class="bg-[#fbe166] border border-[#552a0f] shadow-[inset_0px_-3px_4px_#935324] rounded-xl w-fit py-1 px-3 sm:px-5 font-bold text-white outlined [--outline:#532B23] text-xl sm:text-2xl cursor-pointer mb-10 ms-4"
      >
        <span v-if="!fishing.isFishing">{{ $t('Fishing') }}</span>
        <span v-else-if="auto">{{ $t('Auto Collect') }}</span>
        <span v-else-if="canCollect">{{ $t('Collect') }}</span>
        <span v-else>{{ $t('Fishing…') }}</span>
        <!-- <span v-else>Fishing... wait for tank to fill</span> -->
      </button>

      <div class="w-14 sm:w-20"></div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
    <CalendarPanel v-model="isCalendarOpen" />
    <PuzzlePanel v-model="isPuzzleOpen" />
  </div>
</template>

<style scoped>
/* an unfinished daily task: the icon hops and glows now and then */
.daily-nudge {
  animation: nudge 3.4s ease-in-out infinite;
  transform-origin: 50% 80%;
}
.daily-nudge-late {
  animation-delay: 1.1s;
}
@keyframes nudge {
  0%,
  62%,
  100% {
    transform: translateY(0) rotate(0) scale(1);
    filter: drop-shadow(0 0 0 rgba(255, 220, 90, 0));
  }
  68% {
    transform: translateY(-9%) rotate(-9deg) scale(1.1);
    filter: drop-shadow(0 0 8px rgba(255, 220, 90, 0.95));
  }
  75% {
    transform: translateY(0) rotate(8deg) scale(1.06);
    filter: drop-shadow(0 0 10px rgba(255, 220, 90, 0.95));
  }
  82% {
    transform: translateY(-4%) rotate(-5deg) scale(1.06);
    filter: drop-shadow(0 0 8px rgba(255, 220, 90, 0.8));
  }
  90% {
    transform: translateY(0) rotate(2deg) scale(1.02);
    filter: drop-shadow(0 0 4px rgba(255, 220, 90, 0.4));
  }
}

/* the red "!" pops away when the task is done */
.dot-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.5, 0, 0.8, 0.4),
    opacity 0.3s;
}
.dot-leave-to {
  transform: scale(0);
  opacity: 0;
}

@media (prefers-reduced-motion: reduce) {
  .daily-nudge {
    animation: none;
  }
}
</style>
