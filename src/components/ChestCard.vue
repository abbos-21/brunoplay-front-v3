<script setup lang="ts">
/**
 * One treasure chest. States:
 *  - closed:  gently bobbing, waiting for a tap
 *  - opening: shakes, the lid flips open, light + sparkles burst out
 *  - opened:  the prize floats above the open chest
 *  - ghost:   an unpicked chest at the end of the round (open, dimmed, shows what was inside)
 */
defineProps<{
  state: 'closed' | 'opening' | 'opened' | 'ghost'
  /** prize picture shown above the open chest */
  img?: string
  /** small label under the prize, e.g. "500" */
  label?: string
  disabled?: boolean
  /** unique number, only used to desynchronise the idle bobbing */
  seed?: number
}>()
defineEmits<{ (e: 'pick'): void }>()
</script>

<template>
  <button
    type="button"
    class="chest relative block w-full aspect-[200/230] select-none"
    :class="[`is-${state}`, { 'is-disabled': disabled }]"
    :style="{ '--seed': seed ?? 0 }"
    :disabled="disabled || state !== 'closed'"
    :aria-label="state === 'closed' ? 'Open chest' : 'Opened chest'"
    @click="$emit('pick')"
  >
    <!-- light rays + glow behind the chest when open -->
    <span class="chest-glow absolute left-1/2 top-[34%] -translate-x-1/2 -translate-y-1/2" />
    <span class="chest-rays absolute left-1/2 top-[34%]" />

    <svg
      viewBox="0 0 200 230"
      class="chest-svg absolute inset-0 w-full h-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="wood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#b8692c" />
          <stop offset="1" stop-color="#7a3f17" />
        </linearGradient>
        <linearGradient id="woodLid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#cf7a35" />
          <stop offset="1" stop-color="#9a5120" />
        </linearGradient>
        <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff1a8" />
          <stop offset="0.5" stop-color="#fbc93a" />
          <stop offset="1" stop-color="#d88f0c" />
        </linearGradient>
        <radialGradient id="inside" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0" stop-color="#ffe98a" />
          <stop offset="0.45" stop-color="#d9831d" />
          <stop offset="1" stop-color="#4a2208" />
        </radialGradient>
        <filter id="soft" x="-20%" y="-20%" width="140%" height="150%">
          <feDropShadow dx="0" dy="5" stdDeviation="3.5" flood-color="#000" flood-opacity="0.35" />
        </filter>
      </defs>

      <!-- ground shadow -->
      <ellipse cx="100" cy="205" rx="82" ry="12" fill="#000" opacity="0.28" />

      <g class="chest-whole" filter="url(#soft)">
        <!-- inside of the chest (visible once the lid is up) -->
        <path d="M30 122 H170 V176 H30 Z" fill="url(#inside)" />

        <!-- lid: flips up around its back edge -->
        <g class="chest-lid">
          <path
            d="M24 118 V92 Q24 44 100 44 Q176 44 176 92 V118 Z"
            fill="url(#woodLid)"
            stroke="#4a220a"
            stroke-width="3"
          />
          <path
            d="M44 114 V70 Q44 52 62 48 M156 114 V70 Q156 52 138 48"
            fill="none"
            stroke="#8a5a06"
            stroke-width="0"
          />
          <rect
            x="44"
            y="52"
            width="16"
            height="64"
            rx="3"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2"
          />
          <rect
            x="140"
            y="52"
            width="16"
            height="64"
            rx="3"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2"
          />
          <path
            d="M34 98 Q34 62 74 52"
            fill="none"
            stroke="#fff"
            stroke-width="6"
            stroke-linecap="round"
            opacity="0.18"
          />
          <rect
            x="22"
            y="108"
            width="156"
            height="14"
            rx="5"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2.5"
          />
        </g>

        <!-- prize -->
        <foreignObject x="10" y="-86" width="180" height="200" class="prize-fo">
          <div class="prize" xmlns="http://www.w3.org/1999/xhtml">
            <img v-if="img" :src="img" alt="" draggable="false" />
            <span v-if="label" class="prize-label">{{ label }}</span>
          </div>
        </foreignObject>

        <!-- front of the chest -->
        <g>
          <path
            d="M26 118 H174 V190 Q174 200 164 200 H36 Q26 200 26 190 Z"
            fill="url(#wood)"
            stroke="#4a220a"
            stroke-width="3"
          />
          <!-- planks -->
          <path d="M26 142 H174 M26 166 H174" stroke="#5a2b0e" stroke-width="2" opacity="0.6" />
          <!-- gold bands -->
          <rect
            x="44"
            y="116"
            width="16"
            height="86"
            rx="3"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2"
          />
          <rect
            x="140"
            y="116"
            width="16"
            height="86"
            rx="3"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2"
          />
          <!-- rim -->
          <rect
            x="22"
            y="112"
            width="156"
            height="14"
            rx="5"
            fill="url(#gold)"
            stroke="#8a5a06"
            stroke-width="2.5"
          />
          <!-- lock -->
          <g class="chest-lock">
            <rect
              x="86"
              y="120"
              width="28"
              height="34"
              rx="6"
              fill="url(#gold)"
              stroke="#8a5a06"
              stroke-width="2.5"
            />
            <circle cx="100" cy="133" r="4.5" fill="#6b3b06" />
            <rect x="98" y="134" width="4" height="10" rx="2" fill="#6b3b06" />
          </g>
          <!-- shine -->
          <path
            d="M34 130 Q34 128 40 128 H44 V196 H40 Q34 196 34 190 Z"
            fill="#fff"
            opacity="0.12"
          />
        </g>

      </g>
    </svg>

    <!-- question mark on the closed chest -->
    <span
      class="chest-q absolute left-1/2 top-[78%] -translate-x-1/2 -translate-y-1/2 font-extrabold text-white leading-none"
      >?</span
    >

    <!-- sparkles burst when the chest opens -->
    <span class="chest-burst absolute left-1/2 top-[34%]">
      <i v-for="n in 8" :key="n" :style="{ '--a': `${n * 45}deg`, '--d': `${n % 2 ? 62 : 84}%` }" />
    </span>
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

/* ── idle ─────────────────────────────────────────────────── */
.chest-whole {
  transform-origin: 100px 200px;
  transform-box: view-box;
}
.is-closed .chest-svg {
  animation: bob 2.6s ease-in-out calc(var(--seed) * -0.37s) infinite;
}
.is-closed:not(:disabled):hover .chest-svg {
  filter: brightness(1.08);
}
.is-closed:not(:disabled):active .chest-whole {
  transform: scale(0.96);
}
.is-closed.is-disabled {
  opacity: 0.85;
}

/* ── lid ──────────────────────────────────────────────────── */
.chest-lid {
  transform-origin: 100px 118px;
  transform-box: view-box;
  transition: none;
}
.is-opening .chest-lid,
.is-opened .chest-lid,
.is-ghost .chest-lid {
  animation: lid-open 0.5s cubic-bezier(0.3, 1.5, 0.5, 1) 0.32s both;
}
.is-ghost .chest-lid {
  animation-delay: 0s;
  animation-duration: 0.01s;
}
.is-opening .chest-svg {
  animation: shake 0.32s ease-in-out both;
}

/* ── the "?" ──────────────────────────────────────────────── */
.chest-q {
  font-size: 24cqw;
  text-shadow: 0 4px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
  transition: opacity 0.2s;
}
.is-opening .chest-q,
.is-opened .chest-q,
.is-ghost .chest-q {
  opacity: 0;
}
.is-closed .chest-q {
  animation: bob 2.6s ease-in-out calc(var(--seed) * -0.37s) infinite;
}

/* ── prize ────────────────────────────────────────────────── */
.prize {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  opacity: 0;
  transform: translateY(70px) scale(0.2);
}
.prize img {
  width: 100%;
  height: auto;
  max-height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 4px 4px rgba(0, 0, 0, 0.35));
}
.prize-label {
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
.is-opening .prize,
.is-opened .prize {
  animation: prize-rise 0.75s cubic-bezier(0.2, 1.4, 0.4, 1) 0.62s both;
}
.is-opened .prize img {
  animation: float 2.2s ease-in-out 1.4s infinite;
}
.is-ghost .prize {
  opacity: 0.55;
  transform: translateY(-4px) scale(0.85);
  filter: grayscale(0.5);
}

/* ── glow + rays ──────────────────────────────────────────── */
.chest-glow {
  width: 120%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 238, 150, 0.95) 0%,
    rgba(255, 180, 50, 0.4) 40%,
    transparent 70%
  );
  mix-blend-mode: screen;
  opacity: 0;
  pointer-events: none;
}
.chest-rays {
  width: 190%;
  aspect-ratio: 1;
  margin: -95% 0 0 -95%;
  border-radius: 50%;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 232, 130, 0.5) 0deg 7deg,
    transparent 7deg 20deg
  );
  -webkit-mask-image: radial-gradient(circle, #000 5%, transparent 62%);
  mask-image: radial-gradient(circle, #000 5%, transparent 62%);
  opacity: 0;
  pointer-events: none;
}
.is-opening .chest-glow,
.is-opened .chest-glow {
  animation:
    glow-in 0.6s ease-out 0.5s both,
    pulse 2s ease-in-out 1.1s infinite;
}
.is-opening .chest-rays,
.is-opened .chest-rays {
  animation:
    rays-in 0.6s ease-out 0.5s both,
    spin 18s linear 1.1s infinite;
}

/* ── sparkles ─────────────────────────────────────────────── */
.chest-burst i {
  position: absolute;
  left: 0;
  top: 0;
  width: 9cqw;
  height: 9cqw;
  margin: -4.5cqw 0 0 -4.5cqw;
  background: radial-gradient(circle, #fff 0%, #ffe270 45%, transparent 72%);
  clip-path: polygon(50% 0, 62% 38%, 100% 50%, 62% 62%, 50% 100%, 38% 62%, 0 50%, 38% 38%);
  opacity: 0;
}
.is-opening .chest-burst i {
  animation: burst 0.9s cubic-bezier(0.1, 0.7, 0.2, 1) 0.55s both;
}

/* ── keyframes ────────────────────────────────────────────── */
@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-3%);
  }
}
@keyframes shake {
  0%,
  100% {
    transform: translateX(0) rotate(0);
  }
  20% {
    transform: translateX(-3%) rotate(-3deg);
  }
  40% {
    transform: translateX(3%) rotate(3deg);
  }
  60% {
    transform: translateX(-2%) rotate(-2deg);
  }
  80% {
    transform: translateX(2%) rotate(2deg);
  }
}
@keyframes lid-open {
  0% {
    transform: translateY(0) scaleY(1);
  }
  100% {
    transform: translateY(-4px) scaleY(0.2);
  }
}
@keyframes prize-rise {
  0% {
    opacity: 0;
    transform: translateY(70px) scale(0.2) rotate(-12deg);
  }
  60% {
    opacity: 1;
    transform: translateY(-14px) scale(1.12) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: translateY(-6px) scale(1) rotate(0);
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
@keyframes glow-in {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
}
@keyframes rays-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 0.9;
  }
}
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes burst {
  0% {
    opacity: 0;
    transform: rotate(var(--a)) translateY(0) scale(0.2);
  }
  20% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: rotate(var(--a)) translateY(calc(var(--d) * -1.2)) scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .is-closed .chest-svg,
  .is-closed .chest-q,
  .is-opened .chest-glow,
  .is-opened .chest-rays,
  .is-opened .prize img {
    animation: none;
  }
}
</style>
