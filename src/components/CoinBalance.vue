<script setup lang="ts">
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import { CoinImage } from '@/assets/images'
import { computed } from 'vue'
import { isApiDisabled } from '@/api/client'
import { RouterLink } from 'vue-router'
import { storeToRefs } from 'pinia'
import { MinusSVG } from '@/assets/svgs'

import { useAuthStore } from '@/stores/auth'

// Placeholder shown until the user data arrives (or while the API is switched off in dev mode).
const FALLBACK_COINS = isApiDisabled ? 2104024 : 0

const { user } = storeToRefs(useAuthStore())
const coins = computed(() => user.value?.coins ?? FALLBACK_COINS)
</script>

<template>
  <div
    class="inline-flex gap-px items-center p-1 py-1.5 pe-1.5 relative z-[45] bg-[#fbe166] rounded-[50px] shadow-card"
  >
    <img :src="CoinImage" :alt="$t('Coins')" class="w-[clamp(1.5rem,7.5vw,2rem)]" />
    <AnimatedNumber kind="coins" :value="coins" :ready="!!user" />
    <RouterLink
      to="/withdraw"
      :aria-label="$t('Withdraw')"
      class="w-5 h-5 rounded-full flex justify-center items-center absolute -top-1 -right-1 text-white bg-[linear-gradient(192.38deg,#0fff00_6.75%,#1c8b1a_86.84%)] border-[0.5px] border-[#006417] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_9px_2px_rgba(205,205,205,0.25)]"
    >
      <MinusSVG class="w-3" />
    </RouterLink>
  </div>
</template>
