<script setup lang="ts">
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { StarIcon } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import { isApiDisabled } from '@/api/client'
import { useTopUp } from '@/composables/useTopUp'

// Placeholder shown until the user data arrives (or while the API is switched off in dev mode).
const FALLBACK_STARS = isApiDisabled ? 641000 : 0

const { user } = storeToRefs(useAuthStore())
const { open: openTopUp } = useTopUp()
const stars = computed(() => user.value?.starsBalance ?? FALLBACK_STARS)
</script>

<template>
  <div
    class="inline-flex gap-px items-center p-1 py-1.5 pe-1.5 relative z-[45] bg-[#fbe166] rounded-[50px] shadow-card"
  >
    <img decoding="async" :src="StarIcon" :alt="$t('Stars')" class="w-[clamp(1.35rem,6.8vw,1.8rem)]" />
    <AnimatedNumber kind="stars" :value="stars" :ready="!!user" />
    <button
      type="button"
      :aria-label="$t('Add stars')"
      class="w-5 h-5 rounded-full flex justify-center items-center absolute -top-1 -right-1 text-white bg-[linear-gradient(192.38deg,#0fff00_6.75%,#1c8b1a_86.84%)] border-[0.5px] border-[#006417] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_9px_2px_rgba(205,205,205,0.25)]"
      @click="openTopUp"
    >
      <svg
        class="w-3"
        viewBox="0 0 12 12"
        fill="none"
        stroke="#fff"
        stroke-width="2.6"
        stroke-linecap="round"
        aria-hidden="true"
      >
        <path d="M6 1.5v9M1.5 6h9" />
      </svg>
    </button>
  </div>
</template>
