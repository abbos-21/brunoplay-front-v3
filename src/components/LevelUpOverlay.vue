<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import LevelBadge from '@/components/LevelBadge.vue'
import { levelStyle } from '@/composables/levelStyles'
import { playSfx } from '@/composables/useSfx'
import { useLevelUp } from '@/composables/useLevelUp'

/**
 * Plays when the player's level goes up: the old badge charges up and turns away, the new one spins in
 * with a burst of light, then "LEVEL UP!" lands. Tap anywhere to continue (it also closes by itself).
 */
const { level, hasLevel, hold, reward } = useLevelUp()

const active = ref<{ id: number; from: number; to: number } | null>(null)
const leaving = ref(false)
let prev: number | null = null
let counter = 0
let autoClose: ReturnType<typeof setTimeout> | undefined
let leaveTimer: ReturnType<typeof setTimeout> | undefined

watch(
  [level, hasLevel],
  ([now, has]) => {
    if (!has) {
      prev = 1 // nothing known yet: the first real level is not a level-up
      return
    }
    if (prev !== null && now > prev && !active.value) start(prev, now)
    prev = now
  },
  { immediate: true },
)

const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function start(from: number, to: number) {
  hold.value = from // the header badge waits on the old level
  playSfx('levelUp')
  leaving.value = false
  active.value = { id: ++counter, from, to }
  autoClose = setTimeout(close, reduced ? 2200 : 4600)
}

function close() {
  if (!active.value || leaving.value) return
  clearTimeout(autoClose)
  leaving.value = true
  leaveTimer = setTimeout(() => {
    active.value = null
    reward.value = null
    hold.value = null // the header badge now takes the new level (and pops)
    leaving.value = false
  }, 350)
}

onBeforeUnmount(() => {
  clearTimeout(autoClose)
  clearTimeout(leaveTimer)
  hold.value = null
})

const look = computed(() => levelStyle(active.value?.to ?? 1))
// the light colour follows the new badge
const glow = computed(() => look.value.inner[1])
const sparks = Array.from({ length: 16 }, (_, i) => ({
  a: (i / 16) * 360 + (i % 2 ? 8 : 0),
  d: 5.5 + (i % 3) * 1.6,
  s: 0.7 + (i % 4) * 0.22,
  delay: (i % 5) * 0.03,
}))
</script>

<template>
  <div
    v-if="active"
    :key="active.id"
    class="lvl-root absolute inset-0 z-[60] flex flex-col items-center justify-center overflow-hidden select-none"
    :class="{ leaving }"
    :style="{ '--glow': glow }"
    role="dialog"
    :aria-label="$t('Level up')"
    @click="close"
  >
    <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(30,10,50,0.78),rgba(0,0,0,0.9))]" />

    <!-- slowly turning rays -->
    <div class="lvl-rays absolute left-1/2 top-[42%] size-[34rem] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />

    <div class="relative flex flex-col items-center">
      <!-- the badge stage -->
      <div class="stage relative w-[17rem] h-[9.6rem]">
        <div class="ring absolute inset-0 m-auto size-40 rounded-full" />
        <div class="ring ring-2 absolute inset-0 m-auto size-40 rounded-full" />

        <div class="old absolute inset-0 flex items-center justify-center">
          <LevelBadge :level="active.from" height="9rem" class="!ms-0" />
        </div>
        <div class="new absolute inset-0 flex items-center justify-center">
          <LevelBadge :level="active.to" height="9rem" class="!ms-0" />
        </div>

        <div class="flash absolute left-1/2 top-1/2 size-56 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none" />

        <span
          v-for="(s, i) in sparks"
          :key="i"
          class="spark absolute left-1/2 top-1/2 pointer-events-none"
          :style="{ '--a': `${s.a}deg`, '--d': `${s.d}rem`, '--s': s.s, animationDelay: `${1.05 + s.delay}s` }"
        />
      </div>

      <h2
        class="title mt-5 font-extrabold tracking-wide text-white text-[length:clamp(2.2rem,12vw,3.2rem)] leading-none"
        :style="{ textShadow: `0 3px 0 ${look.stroke}, 0 0 18px ${glow}, 0 0 4px ${look.stroke}` }"
      >
        {{ $t('LEVEL UP!') }}
      </h2>
      <p class="sub mt-2 font-bold text-white text-[length:clamp(1.05rem,5.4vw,1.5rem)]">
        {{ $t('Level {n}', { n: active.to }) }} · <span :style="{ color: glow }">{{ $t(look.name) }}</span>
      </p>
      <p v-if="reward" class="sub mt-3 font-extrabold text-[#fbe166] text-[length:clamp(1rem,5vw,1.35rem)] [text-shadow:0_2px_0_rgba(0,0,0,0.35)]">
        {{ $t('Reward') }}:
        <template v-if="reward.coins">+{{ reward.coins.toLocaleString('en-US') }} {{ $t('coins') }}</template>
        <template v-if="reward.coins && reward.stars"> · </template>
        <template v-if="reward.stars">+{{ reward.stars.toLocaleString('en-US') }} {{ $t('stars') }}</template>
      </p>
      <p class="hint mt-7 text-white/70 text-[length:clamp(0.8rem,4vw,1rem)]">{{ $t('Tap to continue') }}</p>
    </div>
  </div>
</template>

<style scoped>
.lvl-root {
  animation: fade-in 0.3s ease-out both;
}
.lvl-root.leaving {
  animation: fade-out 0.35s ease-in both;
}
@keyframes fade-in {
  from {
    opacity: 0;
  }
}
@keyframes fade-out {
  to {
    opacity: 0;
  }
}

/* light rays */
.lvl-rays {
  background: repeating-conic-gradient(
    from 0deg,
    color-mix(in srgb, var(--glow) 55%, transparent) 0deg 9deg,
    transparent 9deg 24deg
  );
  -webkit-mask-image: radial-gradient(circle, #000 8%, transparent 62%);
  mask-image: radial-gradient(circle, #000 8%, transparent 62%);
  opacity: 0;
  animation:
    rays-in 0.9s ease-out 0.9s forwards,
    spin 14s linear infinite;
}
@keyframes rays-in {
  to {
    opacity: 0.9;
  }
}
@keyframes spin {
  to {
    transform: translate(-50%, -50%) rotate(360deg);
  }
}

.stage {
  perspective: 800px;
}

/* old badge: arrives, shakes with energy, then turns away */
.old {
  animation:
    old-in 0.4s cubic-bezier(0.2, 1.3, 0.4, 1) both,
    old-charge 0.5s ease-in-out 0.4s both,
    old-out 0.28s ease-in 0.95s forwards;
}
@keyframes old-in {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
}
@keyframes old-charge {
  0%,
  100% {
    transform: scale(1) rotate(0);
    filter: brightness(1);
  }
  25% {
    transform: scale(1.04) rotate(-2.5deg);
    filter: brightness(1.2);
  }
  50% {
    transform: scale(1.08) rotate(2.5deg);
    filter: brightness(1.45);
  }
  75% {
    transform: scale(1.1) rotate(-2deg);
    filter: brightness(1.7);
  }
}
@keyframes old-out {
  from {
    transform: scale(1.1) rotateY(0);
    filter: brightness(1.7);
  }
  to {
    opacity: 0;
    transform: scale(1.2) rotateY(90deg);
    filter: brightness(3);
  }
}

/* new badge: spins in with an overshoot */
.new {
  opacity: 0;
  animation: new-in 0.75s cubic-bezier(0.2, 0.9, 0.3, 1) 1.15s forwards;
}
@keyframes new-in {
  0% {
    opacity: 1;
    transform: scale(0.5) rotateY(-90deg);
    filter: brightness(3);
  }
  55% {
    transform: scale(1.3) rotateY(10deg);
    filter: brightness(1.6);
  }
  78% {
    transform: scale(0.95) rotateY(-3deg);
    filter: brightness(1.1);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotateY(0);
    filter: brightness(1);
  }
}

/* flash and shock rings at the moment of the swap */
.flash {
  opacity: 0;
  background: radial-gradient(circle, #fff 0%, color-mix(in srgb, var(--glow) 70%, transparent) 40%, transparent 70%);
  animation: flash 0.7s ease-out 1.1s both;
}
@keyframes flash {
  0% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.2);
  }
  25% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(2.2);
  }
}
.ring {
  opacity: 0;
  border: 4px solid #fff;
  box-shadow:
    0 0 14px var(--glow),
    inset 0 0 14px var(--glow);
  animation: ring 0.9s ease-out 1.1s both;
}
.ring-2 {
  animation-delay: 1.3s;
  border-width: 2px;
}
@keyframes ring {
  0% {
    opacity: 0.95;
    transform: scale(0.4);
  }
  100% {
    opacity: 0;
    transform: scale(3.2);
  }
}

/* sparkles flying out */
.spark {
  width: 0.7rem;
  height: 0.7rem;
  opacity: 0;
  background: #fff;
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  filter: drop-shadow(0 0 4px var(--glow));
  animation: spark 1.1s cubic-bezier(0.1, 0.8, 0.3, 1) both;
}
@keyframes spark {
  0% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(0) scale(0.2);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(calc(var(--d) * 0.6)) scale(var(--s));
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) rotate(var(--a)) translateX(var(--d)) scale(0.1);
  }
}

/* text */
.title {
  opacity: 0;
  animation: title-in 0.55s cubic-bezier(0.2, 1.6, 0.4, 1) 1.45s forwards;
}
@keyframes title-in {
  from {
    opacity: 0;
    transform: translateY(-1.5rem) scale(0.5);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
.sub {
  opacity: 0;
  animation: rise 0.45s ease-out 1.8s forwards;
}
.hint {
  opacity: 0;
  animation: rise 0.6s ease-out 2.6s forwards;
}
@keyframes rise {
  from {
    opacity: 0;
    transform: translateY(0.6rem);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .old,
  .lvl-rays,
  .ring,
  .flash,
  .spark {
    animation: none;
    opacity: 0;
  }
  .new {
    animation: none;
    opacity: 1;
  }
  .title,
  .sub,
  .hint {
    animation: none;
    opacity: 1;
  }
}
</style>
