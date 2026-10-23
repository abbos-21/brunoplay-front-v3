<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import LevelBadgeArt from '@/components/LevelBadgeArt.vue'
import { levelStyle } from '@/composables/levelStyles'
import { useLevelUp } from '@/composables/useLevelUp'

/**
 * The level badge. Without props it shows the signed-in player's level;
 * `level` shows any level (1–10) and `height` any size.
 */
const props = defineProps<{ level?: number; height?: string }>()

const levelUp = useLevelUp()

// a badge for one fixed level, or the player's own (which waits while the level-up celebration plays)
const shown = computed(() => Math.max(1, Math.floor(props.level ?? levelUp.shown.value)))

// the player's own badge pops when it takes a new level
const popKey = ref(0)
watch(shown, (now, before) => {
  if (props.level === undefined && now > before) popKey.value++
})
const style = computed(() => levelStyle(shown.value))
const label = computed(() => `LV${shown.value}`)
// longer labels (LV10) get a smaller font so they stay inside the shield
const sizeFactor = computed(() => (label.value.length <= 3 ? 0.25 : label.value.length === 4 ? 0.2 : 0.16))
</script>

<template>
  <div
    :key="popKey"
    class="relative ms-1 inline-block"
    :class="{ pop: popKey > 0 }"
    :style="{ '--h': height ?? 'calc(clamp(1.5rem,7.5vw,2rem) + 1.25rem)' }"
    role="img"
    :aria-label="`Level ${shown}`"
  >
    <LevelBadgeArt :level="shown" class="block h-[var(--h)] w-auto" />
    <span
      class="absolute left-[49%] top-[47%] -translate-x-1/2 -translate-y-1/2 font-extrabold leading-none tabular-nums whitespace-nowrap pointer-events-none"
      :style="{
        fontSize: `calc(var(--h) * ${sizeFactor})`,
        color: style.text,
        textShadow: `-1px -1px 0 ${style.textOutline}, 1px -1px 0 ${style.textOutline}, -1px 1px 0 ${style.textOutline}, 1px 1px 0 ${style.textOutline}`,
      }"
    >
      {{ label }}
    </span>
  </div>
</template>

<style scoped>
.pop {
  animation: badge-pop 0.7s cubic-bezier(0.2, 1.5, 0.4, 1);
}
@keyframes badge-pop {
  0% {
    transform: scale(0.6);
    filter: brightness(2.2);
  }
  55% {
    transform: scale(1.22);
    filter: brightness(1.35);
  }
  100% {
    transform: scale(1);
    filter: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .pop {
    animation: none;
  }
}
</style>
