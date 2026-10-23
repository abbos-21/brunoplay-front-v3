<script setup lang="ts">
/**
 * One treasure chest, played by a Lottie animation (src/assets/treasure-chest.json).
 *  - closed:  the first frame, bobbing gently, waiting for a tap
 *  - opening: the animation plays (lid opens, coins and light burst out)
 *  - opened:  the last frame (open chest) with the prize floating above it
 *  - ghost:   an unpicked chest at the end of the round (open, dimmed, shows what was inside)
 */
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import lottie, { type AnimationItem } from 'lottie-web/build/player/lottie_light'
import chestAnimation from '@/assets/treasure-chest.json?url'
import { CoinImage } from '@/assets/images'
import { StarIcon } from '@/assets/svgs'

const props = defineProps<{
  state: 'closed' | 'opening' | 'opened' | 'ghost'
  /** prize picture shown above the open chest */
  img?: string
  /** small label under the prize, e.g. "500" */
  label?: string
  /** the number gets its icon, like on the final screen: coins the coin, stars and gifts (worth stars) the star */
  kind?: 'coins' | 'stars' | 'gift'
  disabled?: boolean
  /** unique number, only used to desynchronise the idle bobbing */
  seed?: number
}>()
defineEmits<{ (e: 'pick'): void }>()

/** how fast the animation runs (1 = as drawn, about 2.9 s) */
const SPEED = 1.3

const host = ref<HTMLDivElement | null>(null)
let anim: AnimationItem | null = null
let ready = false

const lastFrame = () => Math.max(0, (anim?.totalFrames ?? 1) - 1)

function apply(state: typeof props.state, before?: typeof props.state) {
  if (!anim || !ready) return
  if (state === 'closed') anim.goToAndStop(0, true)
  else if (state === 'opening') {
    anim.setSpeed(SPEED)
    anim.goToAndPlay(0, true)
  } else if (before !== 'opening') {
    // opened / ghost without having been played here: show the open chest
    anim.goToAndStop(lastFrame(), true)
  }
  // opening -> opened: the animation is still running or has stopped on its last frame already
}

onMounted(() => {
  if (!host.value) return
  anim = lottie.loadAnimation({
    container: host.value,
    renderer: 'svg',
    loop: false,
    autoplay: false,
    path: chestAnimation,
    rendererSettings: { preserveAspectRatio: 'xMidYMax meet', progressiveLoad: false },
  })
  anim.addEventListener('DOMLoaded', () => {
    ready = true
    apply(props.state)
  })
})

watch(
  () => props.state,
  (now, before) => apply(now, before),
)

onBeforeUnmount(() => {
  anim?.destroy()
  anim = null
})
</script>

<template>
  <button
    type="button"
    class="chest relative block w-full select-none"
    :class="[`is-${state}`, { 'is-disabled': disabled }]"
    :style="{ '--seed': seed ?? 0 }"
    :disabled="disabled || state !== 'closed'"
    :aria-label="state === 'closed' ? 'Open chest' : 'Opened chest'"
    @click="$emit('pick')"
  >
    <!-- the chest -->
    <div class="chest-art aspect-square w-full">
      <!-- the drawing has a lot of empty room around the chest, so it is shown larger -->
      <div ref="host" class="size-full origin-[50%_60%] scale-[1.3]" />
    </div>

    <!-- the prize floats up once the chest is open -->
    <div class="prize absolute left-1/2 bottom-[60%] w-[78%] -translate-x-1/2" aria-hidden="true">
      <img v-if="img" :src="img" alt="" draggable="false" />
      <span v-if="label" class="prize-label">
        <img :src="kind === 'coins' ? CoinImage : StarIcon" alt="" class="label-icon" />{{ label }}
      </span>
    </div>
  </button>
</template>

<style scoped>
.chest {
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  container-type: inline-size;
}
.chest:disabled {
  cursor: default;
}

/* closed: a gentle bob, a press-in on tap */
.is-closed .chest-art {
  animation: bob 2.6s ease-in-out calc(var(--seed) * -0.37s) infinite;
}
.is-closed:not(:disabled):hover .chest-art {
  filter: brightness(1.08);
}
.is-closed:not(:disabled):active .chest-art {
  transform: scale(0.96);
}
.is-closed.is-disabled {
  opacity: 0.85;
}
/* an unpicked chest at the end of the round */
.is-ghost .chest-art {
  opacity: 0.6;
  filter: grayscale(0.4);
}

/* prize */
.prize {
  display: flex;
  flex-direction: column;
  align-items: center;
  opacity: 0;
  pointer-events: none;
}
.prize > img {
  width: 100%;
  height: auto;
  max-height: 40cqw;
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.35));
}
.prize-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: -6px;
  padding: 1px 12px;
  border-radius: 999px;
  background: #195fd8;
  color: #fff;
  font-weight: 800;
  font-size: 20px;
  box-shadow:
    0 3px 2px rgba(0, 0, 0, 0.25),
    inset 0 3px 4px rgba(255, 255, 255, 0.25),
    inset 0 -3px 4px rgba(0, 0, 0, 0.25);
}
.label-icon {
  width: 24px;
  height: 24px;
  flex: none;
  filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.35));
}
.is-opened .prize {
  animation: prize-rise 0.75s cubic-bezier(0.2, 1.4, 0.4, 1) both;
}
.is-opened .prize > img {
  animation: float 2.2s ease-in-out 0.8s infinite;
}
.is-ghost .prize {
  opacity: 0.55;
  transform: translate(-50%, 0) scale(0.85);
  filter: grayscale(0.5);
}

@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3%);
  }
}
@keyframes prize-rise {
  0% {
    opacity: 0;
    transform: translate(-50%, 70px) scale(0.2) rotate(-12deg);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -14px) scale(1.12) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -6px) scale(1) rotate(0);
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-closed .chest-art,
  .is-opened .prize > img {
    animation: none;
  }
}
</style>
