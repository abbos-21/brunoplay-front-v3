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
    class="relative flex flex-none items-center justify-center size-[38px] p-0 cursor-pointer bg-[#fbe166] rounded-lg shadow-card"
    :aria-label="$t('Menu')"
    :aria-expanded="modelValue"
    @click="emit('update:modelValue', !modelValue)"
  >
    <Transition name="dot"><PendingDot v-if="gifts.hasNew.value && !modelValue" /></Transition>
    <!-- drawn as an SVG: a CSS box snaps to device pixels, and on screens scaled 2.625x or 2.75x the three bars snapped
         differently (one thicker or longer than the others). Vector shapes are anti-aliased the same way, so they look identical. -->
    <svg class="icon" width="38" height="38" viewBox="0 0 38 38" aria-hidden="true" shape-rendering="geometricPrecision">
      <rect class="bar" :class="{ top: modelValue }" x="5.75" y="9.75" width="26.5" height="2.5" rx="1.25" />
      <rect class="bar" :class="{ mid: modelValue }" x="5.75" y="17.75" width="26.5" height="2.5" rx="1.25" />
      <rect class="bar" :class="{ bottom: modelValue }" x="5.75" y="25.75" width="26.5" height="2.5" rx="1.25" />
    </svg>
  </button>
</template>

<style scoped>
.icon {
  display: block;
  flex: none;
  overflow: visible;
}
.bar {
  fill: #fff;
  stroke: #6f3c2d;
  stroke-width: 1.5px;
  transform-box: fill-box;
  transform-origin: center;
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}
/* open: the outer bars cross into an X (8 = the distance between two bars), the middle one fades */
.bar.top {
  transform: translateY(8px) rotate(45deg);
}
.bar.mid {
  opacity: 0;
}
.bar.bottom {
  transform: translateY(-8px) rotate(-45deg);
}
</style>
