<script setup lang="ts">
import { computed } from 'vue'
import { useFormatters } from '@/composables/useFormatters'

const { formatCoins } = useFormatters()

interface Props {
  currentValue: number
  maxValue: number
  minValue?: number
}

const props = withDefaults(defineProps<Props>(), {
  minValue: 0,
})

const progressPercentage = computed(() => {
  const range = props.maxValue - props.minValue
  const current = props.currentValue - props.minValue
  return Math.min(100, Math.max(0, (current / range) * 100))
})
</script>

<template>
  <div class="outlined [--outline:#532B23] text-lg font-bold text-white">
    <div class="relative border-2 border-[#552a0f] rounded-lg">
      <span class="absolute inset-0 flex justify-center items-center leading-none">
        {{ formatCoins(currentValue) }}
      </span>
      <div
        class="h-[30px] bg-[#fbe166] rounded-[6px] transition-[width] duration-[400ms] ease-linear"
        :style="{ width: `${progressPercentage}%` }"
      ></div>
    </div>
  </div>
</template>
