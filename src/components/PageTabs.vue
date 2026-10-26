<script setup lang="ts">
import { RouterLink } from 'vue-router'
import PendingDot from '@/components/PendingDot.vue'

/**
 * The two big switch buttons under the balances (Cards/Boosters, Main/Others). One component so every page has the same size:
 * the text grows with the screen width and the buttons never get smaller than a comfortable thumb target.
 * A tab with `to` is a link; without it, it is a button that emits `select`.
 */
defineProps<{
  tabs: { key: string; label: string; active: boolean; to?: string; dot?: boolean }[]
}>()
defineEmits<{ select: [key: string] }>()
</script>

<template>
  <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-[length:clamp(1rem,4.8vw,1.3rem)]">
    <component
      :is="tab.to ? RouterLink : 'button'"
      v-for="tab in tabs"
      :key="tab.key"
      v-bind="tab.to ? { to: tab.to } : { type: 'button' }"
      class="relative min-h-[2.75rem] py-[clamp(0.3rem,1.6vw,0.5rem)] border border-[#c17e23] rounded-2xl flex justify-center items-center font-bold leading-tight shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] active:translate-y-px"
      :class="tab.active ? 'bg-[#c17e23] text-white' : 'bg-[#fde7b8] text-[#552a0f]'"
      @click="!tab.to && $emit('select', tab.key)"
    >
      {{ tab.label }}
      <Transition name="dot"><PendingDot v-if="tab.dot" /></Transition>
    </component>
  </div>
</template>

<style scoped>
/* the red "!" on a tab pops away once the tab is opened */
.dot-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.5, 0, 0.8, 0.4),
    opacity 0.3s;
}
.dot-leave-to {
  transform: scale(0);
  opacity: 0;
}
</style>
