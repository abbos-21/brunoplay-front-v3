<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { StarIcon } from '@/assets/svgs'
import { StarA, StarB, StarC, StarD, V21, V35, V43, V48, V62 } from '@/assets/svgs/spin'
import { CoinImage } from '@/assets/images'
import { resolvePrizes } from '@/views/spin-prizes'
import { getTelegram } from '@/composables/useTelegram'
import { playSfx } from '@/composables/useSfx'
import type { SpinResult } from '@/types'

const props = withDefaults(defineProps<{ result: SpinResult; unit?: string }>(), { unit: 'spin' })
const emit = defineEmits<{ (e: 'close'): void }>()

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

// ───────────────────────── prizes (identical ones are grouped: "×3") ─────────────────────────
const groups = computed(() => {
  const map = new Map<string, { r: ReturnType<typeof resolvePrizes>[number]; n: number }>()
  for (const r of resolvePrizes(props.result.results)) {
    const key = `${r.prize.type}:${r.prize.value}:${r.prize.label ?? ''}`
    const hit = map.get(key)
    if (hit) hit.n++
    else map.set(key, { r, n: 1 })
  }
  // best prizes first
  return [...map.values()].sort(
    (a, b) =>
      b.r.prize.value * (b.r.kind === 'coins' ? 0.01 : 1) -
      a.r.prize.value * (a.r.kind === 'coins' ? 0.01 : 1),
  )
})
const hero = computed(() => groups.value.length === 1 && groups.value[0]!.n === 1)
const giftCount = computed(() => props.result.results.filter((p) => p.type === 'gift').length)

// ───────────────────────── totals count up ─────────────────────────
const coins = ref(0)
const stars = ref(0)
let raf = 0
let startTimer: ReturnType<typeof setTimeout> | undefined

function countUp() {
  const t0 = performance.now()
  const dur = 1400
  const tick = (now: number) => {
    const k = Math.min(1, (now - t0) / dur)
    const e = 1 - Math.pow(1 - k, 3)
    coins.value = Math.round(props.result.totalCoinsWon * e)
    stars.value = Math.round(props.result.totalStarsWon * e)
    if (k < 1) raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
}

onMounted(() => {
  playSfx(props.result.results.length >= 3 || hero.value ? 'bigWin' : 'win')
  startTimer = setTimeout(countUp, 900 + Math.min(groups.value.length, 6) * 140)
  try {
    getTelegram()?.HapticFeedback.notificationOccurred('success')
  } catch {
    // not inside Telegram
  }
})
onUnmounted(() => {
  cancelAnimationFrame(raf)
  clearTimeout(startTimer)
})

// ───────────────────────── effects ─────────────────────────
const rnd = (a: number, b: number) => a + Math.random() * (b - a)

/** sparkles that burst out of the middle and keep twinkling */
const sparks = Array.from({ length: 34 }, (_, i) => {
  const angle = rnd(0, Math.PI * 2)
  const dist = rnd(28, 62) // cqw
  return {
    src: [StarA, StarB, StarC, StarD, V21, V35, V43, V48, V62][i % 9]!,
    style: {
      '--dx': `${(Math.cos(angle) * dist).toFixed(1)}cqw`,
      '--dy': `${(Math.sin(angle) * dist * 1.25).toFixed(1)}cqw`,
      '--rot': `${rnd(-200, 200).toFixed(0)}deg`,
      width: `${rnd(7, 15).toFixed(1)}cqw`,
      animationDelay: `${rnd(0, 1.6).toFixed(2)}s`,
      animationDuration: `${rnd(1.8, 3.2).toFixed(2)}s`,
    },
  }
})

const confetti = Array.from({ length: 44 }, () => ({
  style: {
    left: `${rnd(0, 100).toFixed(1)}%`,
    width: `${rnd(1.4, 2.6).toFixed(2)}cqw`,
    height: `${rnd(2.4, 4.6).toFixed(2)}cqw`,
    background: ['#fbe166', '#ff3d77', '#2f9bff', '#22b615', '#ffa530', '#ffffff'][
      Math.floor(rnd(0, 6))
    ],
    animationDuration: `${rnd(3, 6.5).toFixed(2)}s`,
    animationDelay: `-${rnd(0, 6).toFixed(2)}s`,
    '--sway': `${rnd(-6, 6).toFixed(1)}cqw`,
  },
}))
</script>

<template>
  <div
    class="win absolute inset-0 z-50 overflow-hidden [container-type:inline-size]"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('You won')"
  >
    <!-- backdrop -->
    <div class="win-backdrop absolute inset-0" />

    <!-- rotating sun rays + pulsing glow -->
    <div class="win-rays absolute left-1/2 top-1/2" />
    <div class="win-rays win-rays-2 absolute left-1/2 top-1/2" />
    <div class="win-glow absolute left-1/2 top-1/2" />

    <!-- sparkles bursting from the centre -->
    <img
      v-for="(s, i) in sparks"
      :key="`s${i}`"
      :src="s.src"
      alt=""
      class="win-spark absolute left-1/2 top-1/2 pointer-events-none"
      :style="s.style"
    />

    <!-- confetti -->
    <span
      v-for="(c, i) in confetti"
      :key="`c${i}`"
      class="win-confetti absolute pointer-events-none"
      :style="c.style"
    />

    <!-- content -->
    <div
      class="absolute inset-0 flex items-center justify-center"
      :style="{ padding: u(20) }"
      @click.self="emit('close')"
    >
      <div
        class="flex flex-col items-center w-full min-h-0"
        :style="{ maxHeight: '96%', maxWidth: u(730) }"
      >
        <h2
          class="win-title relative font-extrabold leading-none text-center select-none"
          :style="{ fontSize: u(hero ? 104 : 92), letterSpacing: '0.01em' }"
        >
          <span class="win-title-text">{{ $t('You won!') }}</span>
        </h2>

        <p
          v-if="result.results.length > 1"
          class="win-fade font-extrabold text-white/90 [text-shadow:0px_3px_2px_rgba(0,0,0,0.35)]"
          :style="{ fontSize: u(30), animationDelay: '0.5s', marginTop: u(4) }"
        >
          {{ result.results.length }} {{ unit }}s
        </p>

        <!-- prizes -->
        <div
          class="min-h-0 w-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          :style="{ marginTop: u(20), paddingTop: u(12), paddingBottom: u(14) }"
        >
          <div
            class="grid justify-center"
            :class="hero ? 'grid-cols-1' : groups.length === 2 ? 'grid-cols-2' : 'grid-cols-3'"
            :style="{ gap: `${u(22)} ${u(14)}` }"
          >
            <div
              v-for="(g, i) in groups"
              :key="i"
              class="win-card relative flex flex-col items-center"
              :style="{ '--i': i }"
            >
              <div class="win-pic-wrap relative flex items-center justify-center">
                <div class="win-pic-glow absolute" />
                <img
                  :src="g.r.img"
                  :alt="g.r.name"
                  class="win-pic relative block object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.35)]"
                  :style="{
                    width: u(hero ? 330 : 200),
                    height: u(hero ? 330 : 200),
                    animationDelay: `${0.9 + i * 0.14}s`,
                  }"
                />
                <span
                  v-if="g.n > 1"
                  class="absolute right-0 top-0 rounded-full bg-gradient-to-b from-[#fda109] to-[#f96a07] border-2 border-[#c66a27] font-extrabold text-white shadow-[0px_3px_2px_rgba(0,0,0,0.3),inset_0px_2px_3px_rgba(255,255,255,0.4)]"
                  :style="{ fontSize: u(32), padding: `${u(2)} ${u(14)}` }"
                >
                  ×{{ g.n }}
                </span>
              </div>

              <span
                class="relative flex items-center justify-center bg-[#195fd8] text-white font-extrabold leading-none shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] overflow-hidden"
                :style="{
                  minWidth: u(hero ? 300 : 190),
                  height: u(hero ? 80 : 58),
                  borderRadius: u(30),
                  gap: u(8),
                  fontSize: u(hero ? 40 : 27),
                  marginTop: `-${u(hero ? 36 : 22)}`,
                  padding: `0 ${u(16)}`,
                }"
              >
                <img
                  v-if="g.r.kind !== 'gift'"
                  :src="g.r.kind === 'coins' ? CoinImage : StarIcon"
                  alt=""
                  :style="{ width: u(hero ? 50 : 36) }"
                />
                <template v-if="g.r.kind === 'gift'">
                  <img :src="StarIcon" alt="" :style="{ width: u(hero ? 50 : 38) }" />
                  {{ g.r.amount }}
                </template>
                <template v-else>{{ g.r.amount }}</template>
                <span class="win-shine absolute inset-0" />
              </span>

              <span
                v-if="g.r.kind === 'gift'"
                class="font-extrabold text-white/90 capitalize [text-shadow:0px_2px_2px_rgba(0,0,0,0.4)]"
                :style="{ fontSize: u(hero ? 34 : 22), marginTop: u(6) }"
              >
                {{ g.r.name }}
              </span>
            </div>
          </div>
        </div>

        <!-- totals -->
        <div
          v-if="result.totalCoinsWon || result.totalStarsWon"
          class="win-fade flex items-center justify-center font-extrabold text-white [text-shadow:0px_3px_2px_rgba(0,0,0,0.4)]"
          :style="{ gap: u(34), fontSize: u(40), animationDelay: '1.1s', marginBottom: u(14) }"
        >
          <span v-if="result.totalCoinsWon" class="flex items-center" :style="{ gap: u(10) }">
            <img :src="CoinImage" alt="" :style="{ width: u(52) }" />+{{
              coins.toLocaleString('en-US')
            }}
          </span>
          <span v-if="result.totalStarsWon" class="flex items-center" :style="{ gap: u(10) }">
            <img :src="StarIcon" alt="" :style="{ width: u(56) }" />+{{
              stars.toLocaleString('en-US')
            }}
          </span>
        </div>
        <p
          v-else-if="giftCount"
          class="win-fade font-extrabold text-white/90 [text-shadow:0px_3px_2px_rgba(0,0,0,0.4)]"
          :style="{ fontSize: u(32), animationDelay: '1.1s', marginBottom: u(14) }"
        >
          {{ $tn('{n} gift added to your collection|{n} gifts added to your collection', giftCount) }}
        </p>

        <button
          type="button"
          class="win-button relative shrink-0 overflow-hidden bg-[#fbe166] text-[#552a0f] font-extrabold shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] active:translate-y-px"
          :style="{
            width: u(340),
            height: u(90),
            borderRadius: u(30),
            fontSize: u(48),
            letterSpacing: '0.01em',
          }"
          @click="emit('close')"
        >
          {{ $t('Awesome!') }}
          <span class="win-shine absolute inset-0" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ── backdrop ─────────────────────────────────────────────── */
.win-backdrop {
  background: radial-gradient(
    circle at 50% 42%,
    rgba(255, 150, 30, 0.55) 0%,
    rgba(225, 29, 16, 0.92) 38%,
    rgba(70, 6, 4, 0.97) 100%
  );
  animation: win-fade-in 0.35s ease-out both;
}

/* ── sun rays ─────────────────────────────────────────────── */
.win-rays {
  width: 230cqw;
  height: 230cqw;
  margin: -115cqw 0 0 -115cqw;
  background: repeating-conic-gradient(
    from 0deg,
    rgba(255, 226, 120, 0.5) 0deg 6deg,
    transparent 6deg 16deg
  );
  -webkit-mask-image: radial-gradient(circle, #000 4%, transparent 62%);
  mask-image: radial-gradient(circle, #000 4%, transparent 62%);
  animation:
    win-fade-in 0.8s ease-out both,
    win-spin 26s linear infinite;
  pointer-events: none;
}
.win-rays-2 {
  background: repeating-conic-gradient(
    from 8deg,
    rgba(255, 140, 30, 0.4) 0deg 4deg,
    transparent 4deg 22deg
  );
  animation:
    win-fade-in 1.1s ease-out both,
    win-spin-rev 40s linear infinite;
}
.win-glow {
  width: 120cqw;
  height: 120cqw;
  margin: -60cqw 0 0 -60cqw;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 240, 160, 0.75) 0%,
    rgba(255, 190, 60, 0.25) 35%,
    transparent 65%
  );
  mix-blend-mode: screen;
  animation: win-pulse 2.2s ease-in-out infinite;
  pointer-events: none;
}

/* ── sparkles + confetti ──────────────────────────────────── */
.win-spark {
  margin: -3.5cqw 0 0 -3.5cqw;
  opacity: 0;
  filter: drop-shadow(0 0 6px rgba(255, 230, 120, 0.9));
  animation: win-burst 2.6s cubic-bezier(0.1, 0.7, 0.2, 1) infinite;
}
.win-confetti {
  top: -6%;
  border-radius: 2px;
  opacity: 0;
  animation: win-fall linear infinite;
}

/* ── title ────────────────────────────────────────────────── */
.win-title {
  animation: win-title-pop 0.9s cubic-bezier(0.2, 1.6, 0.4, 1) 0.15s both;
  filter: drop-shadow(0px 6px 3px rgba(0, 0, 0, 0.4)) drop-shadow(0 0 22px rgba(255, 200, 60, 0.85));
}
.win-title-text {
  display: inline-block;
  background: linear-gradient(
    100deg,
    #fff7d8 0%,
    #fde072 30%,
    #ffffff 48%,
    #fde072 62%,
    #ffb21e 100%
  );
  background-size: 250% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: win-title-shine 2.4s linear infinite;
}

/* ── prize cards ──────────────────────────────────────────── */
.win-card {
  animation: win-card-pop 0.75s cubic-bezier(0.2, 1.5, 0.4, 1) calc(0.55s + var(--i) * 0.14s) both;
}
.win-pic {
  animation: win-bob 2.4s ease-in-out infinite;
}
.win-pic-glow {
  inset: 6%;
  border-radius: 50%;
  background: radial-gradient(
    circle,
    rgba(255, 236, 140, 0.95) 0%,
    rgba(255, 170, 40, 0.45) 45%,
    transparent 72%
  );
  animation: win-pulse 1.8s ease-in-out infinite;
}
.win-shine {
  background: linear-gradient(
    105deg,
    transparent 35%,
    rgba(255, 255, 255, 0.65) 50%,
    transparent 65%
  );
  transform: translateX(-130%);
  animation: win-sweep 2.8s ease-in-out 1.2s infinite;
  pointer-events: none;
}
.win-fade {
  animation: win-fade-in 0.6s ease-out 0.9s both;
}
.win-button {
  animation:
    win-card-pop 0.7s cubic-bezier(0.2, 1.5, 0.4, 1) 1.3s both,
    win-button-pulse 1.8s ease-in-out 2.1s infinite;
}

/* ── keyframes ────────────────────────────────────────────── */
@keyframes win-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes win-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes win-spin-rev {
  to {
    transform: rotate(-360deg);
  }
}
@keyframes win-pulse {
  0%,
  100% {
    transform: scale(0.92);
    opacity: 0.75;
  }
  50% {
    transform: scale(1.08);
    opacity: 1;
  }
}
@keyframes win-burst {
  0% {
    opacity: 0;
    transform: translate(0, 0) scale(0.2) rotate(0deg);
  }
  15% {
    opacity: 1;
  }
  70% {
    opacity: 1;
    transform: translate(var(--dx), var(--dy)) scale(1) rotate(var(--rot));
  }
  100% {
    opacity: 0;
    transform: translate(calc(var(--dx) * 1.15), calc(var(--dy) * 1.15)) scale(0.4)
      rotate(calc(var(--rot) * 1.3));
  }
}
@keyframes win-fall {
  0% {
    opacity: 0;
    transform: translate3d(0, 0, 0) rotate(0deg);
  }
  8% {
    opacity: 1;
  }
  100% {
    opacity: 0.9;
    transform: translate3d(var(--sway), 112cqh, 0) rotate(720deg);
  }
}
@keyframes win-title-pop {
  0% {
    opacity: 0;
    transform: scale(0.2) rotate(-8deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
@keyframes win-title-shine {
  from {
    background-position: 150% 0;
  }
  to {
    background-position: -100% 0;
  }
}
@keyframes win-card-pop {
  0% {
    opacity: 0;
    transform: scale(0) rotate(-14deg);
  }
  60% {
    opacity: 1;
    transform: scale(1.14) rotate(3deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}
@keyframes win-bob {
  0%,
  100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-4%) scale(1.04);
  }
}
@keyframes win-sweep {
  0% {
    transform: translateX(-130%);
  }
  55%,
  100% {
    transform: translateX(130%);
  }
}
@keyframes win-button-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow:
      0 3px 2px rgba(0, 0, 0, 0.25),
      0 0 0 rgba(255, 225, 100, 0);
  }
  50% {
    transform: scale(1.05);
    box-shadow:
      0 3px 2px rgba(0, 0, 0, 0.25),
      0 0 26px 6px rgba(255, 225, 100, 0.8);
  }
}

@media (prefers-reduced-motion: reduce) {
  .win-rays,
  .win-spark,
  .win-confetti,
  .win-glow,
  .win-pic,
  .win-pic-glow,
  .win-shine,
  .win-title-text,
  .win-button {
    animation: none;
  }
  .win-spark,
  .win-confetti {
    display: none;
  }
}
</style>
