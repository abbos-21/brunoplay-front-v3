<script setup lang="ts">
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { LevelSVG } from '@/assets/svgs'
import { EnergyImage } from '@/assets/images'
import { useAuthStore } from '@/stores/auth'

// Placeholder shown until the user data arrives (or while the API is switched off in dev mode).
const FALLBACK_ENERGY = 1600

const { user } = storeToRefs(useAuthStore())

// The API has no energy field yet, so use one if it ever appears, else the placeholder.
const energy = computed(() => (user.value as { energy?: number } | null)?.energy ?? FALLBACK_ENERGY)
</script>

<template>
  <div
    class="relative inline-flex items-center ms-1 bg-[#fbe166] rounded-[50px] shadow-card ps-[clamp(1.4rem,7vw,1.75rem)] pe-1 gap-[clamp(0.25rem,1.5vw,0.5rem)] h-[calc(clamp(1.5rem,7.5vw,2rem)+0.75rem)]"
  >
    <img :src="EnergyImage" alt="Energy" class="absolute -top-1 -left-[clamp(0.25rem,1.5vw,0.5rem)] h-[115%] drop-shadow-[0px_4px_2px_rgba(0,0,0,0.25)]" />
    <span class="font-bold text-white text-[length:clamp(0.85rem,4.4vw,1.35rem)] outlined [--outline:#C17E23] tabular-nums">
      {{ energy.toLocaleString('en-US').replace(/,/g, '') }}
    </span>
    <span class="w-px self-stretch my-2.5 bg-[#c17e23]" />
    <span class="relative h-full aspect-[175/98] -my-0.5">
      <LevelSVG class="absolute inset-0 w-full h-full" />
    </span>
  </div>
</template>
