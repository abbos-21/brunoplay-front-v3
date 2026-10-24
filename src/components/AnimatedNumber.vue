<script lang="ts">
// shared by every counter on screen (a plain script block, so it is not recreated per component)
// What every counter last showed, so a counter that appears later (the player came back from a game)
// still plays the change that happened while it was not on screen.
const lastShown: Record<string, number | undefined> = {}
</script>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { playSfx } from '@/composables/useSfx'

/**
 * The brown number pill of a balance. When the value changes it
 *  - counts from the old number to the new one,
 *  - pops and flashes green (more) or red (less),
 *  - sends a "+250" / "−10" chip: a gain flows up into the pill, a spend drops out of it.
 * `ready` is false until the real value is known, so the first load shows the number without any show.
 */
const props = defineProps<{
  value: number
  ready: boolean
  /** which balance this is ("coins", "stars") */
  kind: string
  /** no brown pill, the number takes the text style of its parent */
  plain?: boolean
}>()

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// a counter that shows up late starts from what the player saw last
const display = ref(props.ready && lastShown[props.kind] !== undefined ? lastShown[props.kind]! : props.value)
const pulse = ref<{ id: number; dir: 'up' | 'down' } | null>(null)
const chips = ref<{ id: number; dir: 'up' | 'down'; text: string }[]>([])

let seen = props.ready
let raf = 0
let counter = 0

const fmt = (n: number) => Math.floor(n).toLocaleString('en-US')
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

function tween(to: number) {
  cancelAnimationFrame(raf)
  const from = display.value
  const size = Math.abs(to - from)
  // small changes are quick, big ones take longer (but never more than 1.2 s)
  const duration = Math.min(1200, 450 + Math.log10(size + 1) * 190)
  const t0 = performance.now()
  const step = (now: number) => {
    const k = Math.min(1, (now - t0) / duration)
    display.value = from + (to - from) * easeOut(k)
    if (k < 1) raf = requestAnimationFrame(step)
    else display.value = to
  }
  raf = requestAnimationFrame(step)
}

function change(value: number) {
  const diff = Math.floor(value) - Math.floor(display.value)
  if (diff === 0) {
    display.value = value
    return
  }
  const dir = diff > 0 ? 'up' : 'down'
  const id = ++counter
  pulse.value = { id, dir }
  if (props.kind === 'coins') playSfx(dir === 'up' ? 'coinUp' : 'coinDown')
  else if (props.kind === 'stars') playSfx(dir === 'up' ? 'starUp' : 'starDown')
  chips.value.push({ id, dir, text: `${diff > 0 ? '+' : '−'}${fmt(Math.abs(diff))}` })
  setTimeout(() => (chips.value = chips.value.filter((c) => c.id !== id)), 1400)
  tween(value)
}

watch(
  () => [props.value, props.ready] as const,
  ([value, ready]) => {
    if (!ready || !seen || reducedMotion) {
      // first real value (or no motion wanted): show it straight away
      cancelAnimationFrame(raf)
      display.value = value
      seen = ready
    } else {
      change(value)
    }
    if (ready) lastShown[props.kind] = value
  },
)

onMounted(() => {
  if (props.ready && !reducedMotion && Math.floor(display.value) !== Math.floor(props.value)) change(props.value)
  if (props.ready) lastShown[props.kind] = props.value
})

onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="relative">
    <div
      :key="pulse?.id ?? 0"
      class="number-pill tabular-nums"
      :class="[
        plain
          ? 'plain'
          : 'text-white px-[clamp(0.5rem,3vw,0.75rem)] py-1 font-bold text-[length:clamp(0.75rem,3.9vw,1rem)] bg-[#c17e23] rounded-[50px] shadow-[inset_0px_0px_1px_1px_rgba(0,0,0,0.25)]',
        pulse ? `pop-${pulse.dir}` : '',
      ]"
    >
      {{ fmt(display) }}
    </div>

    <span
      v-for="c in chips"
      :key="c.id"
      class="chip outlined pointer-events-none absolute left-1/2 top-full z-30 whitespace-nowrap font-extrabold text-[length:clamp(0.9rem,4.6vw,1.2rem)]"
      :class="c.dir === 'up' ? 'chip-up [--outline:#1c8b1a]' : 'chip-down [--outline:#a81a18]'"
    >
      {{ c.text }}
    </span>
  </div>
</template>

<style scoped>
.number-pill {
  transform-origin: 50% 50%;
}
.pop-up {
  animation: pop-up 0.9s ease-out;
}
.pop-down {
  animation: pop-down 0.9s ease-out;
}
@keyframes pop-up {
  0% {
    transform: scale(1);
  }
  18% {
    transform: scale(1.14);
    background-color: #3fb62f;
    box-shadow:
      0 0 0 3px rgba(125, 255, 90, 0.65),
      0 0 14px 3px rgba(125, 255, 90, 0.6);
  }
  100% {
    transform: scale(1);
  }
}
@keyframes pop-down {
  0% {
    transform: scale(1);
  }
  18% {
    transform: scale(0.92);
    background-color: #d23a2c;
    box-shadow:
      0 0 0 3px rgba(255, 110, 90, 0.6),
      0 0 12px 2px rgba(255, 90, 70, 0.5);
  }
  35% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.chip-up {
  animation: chip-up 1.3s ease-out forwards;
}
.chip-down {
  animation: chip-down 1.3s ease-out forwards;
}
/* a gain rises into the pill */
@keyframes chip-up {
  0% {
    opacity: 0;
    transform: translate(-50%, 22px) scale(0.7);
  }
  22% {
    opacity: 1;
    transform: translate(-50%, 12px) scale(1.1);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -4px) scale(0.95);
  }
}
/* a spend drops out of the pill */
@keyframes chip-down {
  0% {
    opacity: 0;
    transform: translate(-50%, -8px) scale(0.7);
  }
  22% {
    opacity: 1;
    transform: translate(-50%, 2px) scale(1.1);
  }
  70% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, 28px) scale(0.95);
  }
}

/* the same pop for a number without a pill: only its colour and size change */
.plain.pop-up {
  animation: plain-up 0.9s ease-out;
}
.plain.pop-down {
  animation: plain-down 0.9s ease-out;
}
@keyframes plain-up {
  18% {
    transform: scale(1.14);
    color: #c8ff9c;
    text-shadow: 0 0 10px rgba(125, 255, 90, 0.9);
  }
}
@keyframes plain-down {
  18% {
    transform: scale(0.92);
    color: #ffb3a8;
    text-shadow: 0 0 10px rgba(255, 90, 70, 0.8);
  }
  35% {
    transform: scale(1.05);
  }
}

@media (prefers-reduced-motion: reduce) {
  .pop-up,
  .pop-down {
    animation: none;
  }
  .chip-up,
  .chip-down {
    animation-duration: 1.3s;
    animation-name: chip-fade;
  }
  @keyframes chip-fade {
    0%,
    70% {
      opacity: 1;
      transform: translate(-50%, 8px);
    }
    100% {
      opacity: 0;
      transform: translate(-50%, 8px);
    }
  }
}
</style>
