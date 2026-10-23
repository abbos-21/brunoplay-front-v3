<script setup lang="ts">
import { computed } from 'vue'
import {
  CenterA, CenterB, Pointer1, Pointer3, WheelDot, WheelRimA, WheelRimB, WheelRimC,
} from '@/assets/svgs/spin'

export interface WheelSlot {
  img: string
  alt: string
  /** small caption under the prize (e.g. "+500") */
  chip?: string
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

const rotStyle = computed(() => ({
  transform: `rotate(${props.rotation}deg)`,
  transition: props.duration ? `transform ${props.duration}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none',
}))
const counterStyle = computed(() => ({
  transform: `rotate(${-props.rotation}deg)`,
  transition: props.duration ? `transform ${props.duration}ms cubic-bezier(0.12, 0.7, 0.1, 1)` : 'none',
}))

// spokes: radius 68 → 324, one every 45°. Drawn with CSS (not the 1px SVG strokes) so they
// keep a minimum thickness and never disappear when the wheel is small.
const SPOKE_H = `max(1.5px, ${wu(2)})`
const spokes = [-90, -45, 0, 45, 90, 135, 180, 225].map((a) => ({
  position: 'absolute' as const,
  left: wu(C),
  // the line's own middle sits exactly on the wheel's centre, so it turns around the centre (no sideways drift)
  top: `calc(${wu(C)} - ${SPOKE_H} / 2)`,
  width: wu(256),
  height: SPOKE_H,
  background: 'rgba(255,255,255,0.9)',
  transformOrigin: '0 50%',
  transform: `rotate(${a}deg) translateX(${wu(68)})`,
}))

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
  props.slots.slice(0, 8).map((slot, i) => {
    const a = 22.5 + 45 * i
    // the red disc fills the 650px box (radius 325); keep r + size/2 well inside it
    const r = 222
    const rad = (a * Math.PI) / 180
    return { slot, style: place(168, C + r * Math.sin(rad), C - r * Math.cos(rad)) }
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
    <img :src="WheelRimA" alt="" :style="place(710)" />
    <img :src="WheelRimB" alt="" :style="place(730)" />

    <div class="absolute inset-0" :style="rotStyle">
      <span v-for="(s, i) in spokes" :key="i" :style="s" />
    </div>

    <img :src="WheelRimC" alt="" :style="place(710)" />

    <div class="absolute inset-0" :style="rotStyle">
      <img v-for="(s, i) in studs" :key="`stud-${i}`" :src="WheelDot" alt="" :style="s" />

      <div v-for="(p, i) in prizes" :key="i" :style="p.style">
        <div class="w-full" :style="counterStyle">
          <img :src="p.slot.img" :alt="p.slot.alt" class="block w-full drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]" />
          <span
            v-if="p.slot.chip"
            class="absolute left-1/2 bottom-[4%] -translate-x-1/2 whitespace-nowrap font-extrabold text-white [text-shadow:0_2px_2px_rgba(0,0,0,0.6)]"
            :style="{ fontSize: wu(30) }"
          >
            {{ p.slot.chip }}
          </span>
        </div>
      </div>
    </div>

    <!-- fixed parts -->
    <img :src="CenterA" alt="" :style="place(314)" />
    <img :src="CenterB" alt="" :style="place(297.4)" />
    <img v-for="(p, i) in pointers" :key="`ptr-${i}`" :src="p.src" alt="" :style="p.style" />
  </div>
</template>
