<script setup lang="ts">
import { computed, useId } from 'vue'

/**
 * The trophy from the Figma file (node 780:24, "Vector"), drawn from the same path with the same 2px inner outline,
 * coloured for the place: gold (the design's own #FFAC33), silver and bronze.
 */
const props = withDefaults(defineProps<{ place: number }>(), { place: 1 })

const FILL: Record<number, string> = { 1: '#FFAC33', 2: '#C9D2DB', 3: '#D8884A' }
const fill = computed(() => FILL[props.place] ?? '#FFAC33')
const id = useId()

const D =
  'M16.5 14.6667C17.5083 14.6667 18.3718 14.3079 19.0905 13.5905C19.8092 12.8731 20.1679 12.0096 20.1667 11C20.1654 9.99044 19.8067 9.12756 19.0905 8.41133C18.3743 7.69511 17.5108 7.33578 16.5 7.33333C15.4892 7.33089 14.6263 7.69022 13.9113 8.41133C13.1963 9.13244 12.837 9.99533 12.8333 11C12.8297 12.0047 13.189 12.8682 13.9113 13.5905C14.6337 14.3128 15.4966 14.6716 16.5 14.6667ZM7.33333 33V29.3333H14.6667V23.65C13.1694 23.3139 11.8329 22.6802 10.6572 21.7488C9.48139 20.8175 8.61789 19.6484 8.06667 18.2417C5.775 17.9667 3.85794 16.9663 2.3155 15.2405C0.773055 13.5147 0.00122222 11.4901 0 9.16667V7.33333C0 6.325 0.359333 5.46211 1.078 4.74467C1.79667 4.02722 2.65956 3.66789 3.66667 3.66667H7.33333V0H25.6667V3.66667H29.3333C30.3417 3.66667 31.2052 4.026 31.9238 4.74467C32.6425 5.46333 33.0012 6.32622 33 7.33333V9.16667C33 11.4889 32.2282 13.5135 30.6845 15.2405C29.1408 16.9675 27.2238 17.9679 24.9333 18.2417C24.3833 19.6472 23.5204 20.8163 22.3447 21.7488C21.1689 22.6814 19.8318 23.3151 18.3333 23.65V29.3333H25.6667V33H7.33333ZM7.33333 14.3V7.33333H3.66667V9.16667C3.66667 10.3278 4.00278 11.3746 4.675 12.3072C5.34722 13.2397 6.23333 13.904 7.33333 14.3ZM25.6667 14.3C26.7667 13.9028 27.6528 13.2379 28.325 12.3053C28.9972 11.3728 29.3333 10.3266 29.3333 9.16667V7.33333H25.6667V14.3Z'
</script>

<template>
  <svg viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="shrink-0">
    <defs>
      <clipPath :id="`${id}-clip`"><path :d="D" /></clipPath>
    </defs>
    <path :d="D" :fill="fill" />
    <!-- the design's 2px black outline, kept inside the shape -->
    <path :d="D" fill="none" stroke="black" stroke-width="4" :clip-path="`url(#${id}-clip)`" />
  </svg>
</template>
