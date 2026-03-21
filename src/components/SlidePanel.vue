<script setup lang="ts">
import { ArrowLeftSVG } from '@/assets/svgs'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <div v-if="modelValue" class="absolute inset-0 bg-black/40 z-40" @click="emit('update:modelValue', false)" />
  <div
    class="absolute top-0 right-0 h-full w-[90%] z-50 transition-transform duration-300 ease-out py-1"
    :class="modelValue ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="bg-[#FBE166] h-full rounded-s-lg p-2">
      <button
        type="button"
        @click="emit('update:modelValue', false)"
        class="btn-orange w-10 h-10 p-2 rounded-full flex justify-center items-center"
      >
        <ArrowLeftSVG class="w-full" />
      </button>
    </div>
  </div>
</template>
