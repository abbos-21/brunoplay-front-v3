<script setup lang="ts">
import { onMounted } from 'vue'
import PendingDot from '@/components/PendingDot.vue'
import { useGiftAlerts } from '@/composables/useGiftAlerts'

const gifts = useGiftAlerts()
onMounted(() => gifts.refresh())
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <button
    type="button"
    class="relative flex flex-col justify-center items-center gap-1 w-9.5 aspect-square cursor-pointer bg-[#fbe166] rounded-lg shadow-card"
    @click="emit('update:modelValue', !modelValue)"
  >
    <Transition name="dot"><PendingDot v-if="gifts.hasNew.value && !modelValue" /></Transition>
    <span
      class="w-7 h-1 bg-white border-[1.5px] border-[#6f3c2d] rounded transition-[transform,opacity] duration-300 ease"
      :class="modelValue ? 'translate-y-2 rotate-45' : ''"
    ></span>
    <span
      class="w-7 h-1 bg-white border-[1.5px] border-[#6f3c2d] rounded transition-[transform,opacity] duration-300 ease"
      :class="{ 'opacity-0': modelValue }"
    ></span>
    <span
      class="w-7 h-1 bg-white border-[1.5px] border-[#6f3c2d] rounded transition-[transform,opacity] duration-300 ease"
      :class="modelValue ? '-translate-y-2 -rotate-45' : ''"
    ></span>
  </button>
</template>
