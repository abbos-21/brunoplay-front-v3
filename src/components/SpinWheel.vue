<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { playSfx } from '@/composables/useSfx'
import {
  CenterA, CenterB, Pointer1, Pointer3, WheelDot, WheelRimA, WheelRimB, WheelRimC,
} from '@/assets/svgs/spin'

export interface WheelSlot {
  img: string
  alt: string
  /** small caption under the prize (e.g. "+500") */
  chip?: string
  /** colour of the sector on a two-sector wheel */
  tone?: 'win' | 'empty'
}

const props = defineProps<{
  slots: WheelSlot[]
  /** current wheel rotation in degrees (clockwise) */
  rotation: number
  /** transition duration in ms */
  duration: number
}>()

/** All geometry below is in Figma px on a 650px wheel; converted to container-width units. */
const SIZE = 650
const wu = (px: number) => `${((px / SIZE) * 100).toFixed(4)}cqw`
const C = SIZE / 2

const place = (size: number, cx = C, cy = C) => ({
  position: 'absolute' as const,
  width: wu(size),
  left: wu(cx - size / 2),
  top: wu(cy - size / 2),
})

// a tick every time a stud passes the pointer: the real angle is read while the wheel turns, so the clicks
// follow the slowing down of the CSS transition
const turning = ref<HTMLElement | null>(null)
let raf = 0
let lastStud = 0
const angleNow = () => {
  const m = turning.value ? getComputedStyle(turning.value).transform : 'none'
  if (!m || m === 'none') return null
  const [a = 1, b = 0] = m.slice(m.indexOf('(') + 1, -1).split(',').map(Number)
  return (Math.atan2(b, a) * 180) / Math.PI
}
function followWheel(until: number) {
  cancelAnimationFrame(raf)
  const first = angleNow()
  lastStud = Math.floor(((first ?? 0) + 360) / 45)
  const step = (now: number) => {
    const a = angleNow()
    if (a !== null) {
      const stud = Math.floor((a + 360) / 45)
      if (stud !== lastStud) {
        lastStud = stud
        playSfx('tick', { rate: 0.95 + Math.random() * 0.1 })
      }
    }
    if (now < until) raf = requestAnimationFrame(step)
  }
  raf = requestAnimationFrame(step)
}
watch(
  () => props.rotation,
  () => {
    if (props.duration) followWheel(performance.now() + props.duration + 100)
  },
  { flush: 'post' },
)
onBeforeUnmount(() => cancelAnimationFrame(raf))

const rotStyle = computed(() => ({
  transform: `rotate(${props.rotation}deg)`,
  transition: props.duration ? `transform ${props.duration}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none',
}))
const counterStyle = computed(() => ({
  transform: `rotate(${-props.rotation}deg)`,
  transition: props.duration ? `transform ${props.duration}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none',
}))

// the wheel has as many sectors as slots (8 normally, 2 for a win-or-nothing game)
const N = computed(() => Math.max(1, props.slots.length))
const HALVES = computed(() => props.slots.length === 2)

// spokes: radius 68 → 324, one between every two sectors. Drawn with CSS (not the 1px SVG strokes) so they
// keep a minimum thickness and never disappear when the wheel is small.
const SPOKE_H = `max(1.5px, ${wu(2)})`
const spokes = computed(() => Array.from({ length: N.value }, (_, i) => -90 + (360 / N.value) * i).map((a) => ({
  position: 'absolute' as const,
  left: wu(C),
  // the line's own middle sits exactly on the wheel's centre, so it turns around the centre (no sideways drift)
  top: `calc(${wu(C)} - ${SPOKE_H} / 2)`,
  height: SPOKE_H,
  background: 'rgba(255,255,255,0.9)',
  transformOrigin: '0 50%',
  transform: `rotate(${a}deg) translateX(${wu(HALVES.value ? 0 : 68)})`,
  width: wu(HALVES.value ? 324 : 256),
})))

// two sectors: the right half (clockwise from the top) is slot 0, the left half slot 1
const HALF_R = 322
const halfPaths = [
  `M ${C} ${C - HALF_R} A ${HALF_R} ${HALF_R} 0 0 1 ${C} ${C + HALF_R} L ${C} ${C} Z`,
  `M ${C} ${C + HALF_R} A ${HALF_R} ${HALF_R} 0 0 1 ${C} ${C - HALF_R} L ${C} ${C} Z`,
]
const toneOf = (i: number) => props.slots[i]?.tone ?? (i === 0 ? 'win' : 'empty')

// rim studs: one at the end of every spoke (the one at 0° starts under the pointer)
const studs = [0, 45, 90, 135, 180, 225, 270, 315].map((a) => {
  const r = 340
  const rad = (a * Math.PI) / 180
  return {
    ...place(22, C + r * Math.sin(rad), C - r * Math.cos(rad)),
    // never smaller than 10px so the studs stay visible on narrow screens
    width: `max(10px, ${wu(22)})`,
    transform: 'translate(-50%, -50%)',
    left: wu(C + r * Math.sin(rad)),
    top: wu(C - r * Math.cos(rad)),
  }
})

// prizes sit between spokes: 22.5° + 45° * i, clockwise from the top
const prizes = computed(() =>
  props.slots.map((slot, i) => {
    const a = (360 / N.value) * (i + 0.5)
    // the red disc fills the 650px box (radius 325); keep r + size/2 well inside it
    const r = HALVES.value ? 215 : 222
    const rad = (a * Math.PI) / 180
    return { slot, style: place(HALVES.value ? 150 : 168, C + r * Math.sin(rad), C - r * Math.cos(rad)) }
  }),
)

// Pointer: sits on the rim at the top of the wheel, tip pointing down into the disc like a real
// fortune wheel. An orange arrow with the yellow arrow centred on top (Figma offsets the two
// shapes, which reads as two separate arrows).
const TIP = 14 // y of the arrow tip, measured from the top of the wheel box
const pointers = [
  { src: Pointer3, left: C - 44.78, top: TIP + 7 - 88 - 6.56, w: 89.55 },
  { src: Pointer1, left: C - 38, top: TIP - 73 - 8, w: 76 },
].map((p) => ({
  src: p.src,
  style: { position: 'absolute' as const, left: wu(p.left), top: wu(p.top), width: wu(p.w), transform: 'scaleY(-1)' },
}))
</script>

<template>
  <div class="relative w-full aspect-square [container-type:inline-size] [&_img]:max-w-none">
    <!-- rims carry a vertical light gradient, so they stay put while the wheel turns -->
    <img decoding="async" :src="WheelRimA" alt="" :style="place(710)" />
    <img decoding="async" :src="WheelRimB" alt="" :style="place(730)" />

    <div class="absolute inset-0" :style="rotStyle">
      <!-- a win-or-nothing wheel: two halves, green for the win and blue for nothing -->
      <svg v-if="HALVES" class="absolute inset-0 h-full w-full" :viewBox="`0 0 ${SIZE} ${SIZE}`" aria-hidden="true">
        <defs>
          <radialGradient id="wheel-win" cx="50%" cy="50%" r="50%">
            <stop offset="18%" stop-color="#7bea5c" />
            <stop offset="70%" stop-color="#2fc21f" />
            <stop offset="100%" stop-color="#17870f" />
          </radialGradient>
          <radialGradient id="wheel-empty" cx="50%" cy="50%" r="50%">
            <stop offset="18%" stop-color="#6f86c4" />
            <stop offset="70%" stop-color="#3f5599" />
            <stop offset="100%" stop-color="#2b3b78" />
          </radialGradient>
        </defs>
        <path v-for="(d, i) in halfPaths" :key="i" :d="d" :fill="toneOf(i) === 'win' ? 'url(#wheel-win)' : 'url(#wheel-empty)'" />
      </svg>
      <span v-for="(s, i) in spokes" :key="i" :style="s" />
    </div>

    <img decoding="async" :src="WheelRimC" alt="" :style="place(710)" />

    <div ref="turning" class="absolute inset-0" :style="rotStyle">
      <img decoding="async" v-for="(s, i) in studs" :key="`stud-${i}`" :src="WheelDot" alt="" :style="s" />

      <div v-for="(p, i) in prizes" :key="i" :style="p.style">
        <div class="w-full" :style="counterStyle">
          <img decoding="async" :src="p.slot.img" :alt="p.slot.alt" class="block w-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
          <span
            v-if="p.slot.chip"
            class="absolute left-1/2 -translate-x-1/2 whitespace-nowrap font-extrabold text-white [text-shadow:0_2px_2px_rgba(0,0,0,0.6)]"
            :class="HALVES ? 'bottom-[-34%]' : 'bottom-[4%]'"
            :style="{ fontSize: wu(HALVES ? 46 : 30) }"
          >
            {{ p.slot.chip }}
          </span>
        </div>
      </div>
    </div>

    <!-- fixed parts -->
    <img decoding="async" :src="CenterA" alt="" :style="place(314)" />
    <img decoding="async" :src="CenterB" alt="" :style="place(297.4)" />
    <img decoding="async" v-for="(p, i) in pointers" :key="`ptr-${i}`" :src="p.src" alt="" :style="p.style" />
  </div>
</template>
