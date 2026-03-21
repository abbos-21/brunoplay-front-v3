<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<template>
  <button
    type="button"
    class="flex flex-col justify-center items-center gap-1 w-10 aspect-square cursor-pointer bg-[#fbe166] rounded-lg shadow-card"
    @click="emit('update:modelValue', !modelValue)"
  >
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
