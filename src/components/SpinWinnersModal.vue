<script setup lang="ts">
import { t } from '@/i18n'
import { computed } from 'vue'
import { StarIcon } from '@/assets/svgs'
import { CoinImage } from '@/assets/images'
import { resolvePrizes } from '@/views/spin-prizes'
import type { LiveWin, SpinPrize } from '@/types'

const props = defineProps<{
  winners: LiveWin[]
  loading: boolean
  /** every prize we know about, used to pick the picture for a win */
  knownPrizes: SpinPrize[]
}>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'more'): void }>()

const resolved = computed(() => resolvePrizes(props.knownPrizes))
const colors = ['#2f9bff', '#ff3d77', '#ffa530', '#22b615', '#8a5cff']
const pad = (n: number) => String(n).padStart(2, '0')

function pictureFor(w: LiveWin) {
  const match = resolved.value.find((r) => r.prize.type === w.prizeType && r.prize.value === w.prizeValue)
  if (match) return match.img
  if (w.prizeType === 'coins') return CoinImage
  if (w.prizeType === 'stars') return StarIcon
  return resolved.value[0]?.img ?? StarIcon
}

const rows = computed(() =>
  props.winners.map((w) => {
    const d = new Date(w.createdAt)
    const date = Number.isNaN(d.getTime())
      ? ''
      : `${pad(d.getDate())}.${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`
    const spent = w.spentStars
    const profit =
      spent && spent > 0 && w.prizeType !== 'coins'
        ? `x${Math.max(1, Math.round(w.prizeValue / spent)).toLocaleString('en-US')}`
        : ''
    return {
      id: w.id,
      name: w.username ? `@${w.username}` : t('Anonymous'),
      initial: (w.username || '?').charAt(0).toUpperCase(),
      color: colors[w.id % colors.length]!,
      spend: spent ? spent.toLocaleString('en-US') : '',
      profit,
      img: pictureFor(w),
      date,
    }
  }),
)

function onScroll(e: Event) {
  const t = e.target as HTMLElement
  if (t.scrollTop + t.clientHeight >= t.scrollHeight - 60) emit('more')
}
</script>

<template>
  <div
    class="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('Winners')"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-full w-full max-w-[24rem] flex-col rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-4 text-[#552a0f] shadow-[0px_6px_12px_rgba(0,0,0,0.35)]"
    >
      <div class="shrink-0 text-center">
        <h2 class="font-extrabold leading-tight text-[length:clamp(1.35rem,6.4vw,1.75rem)]">{{ $t('Winners') }}</h2>
        <p class="text-[#8a5a2b] font-bold text-[length:clamp(0.8rem,3.8vw,0.95rem)]">{{ $t('Latest big wins') }}</p>
      </div>

      <ul
        class="mt-3 flex min-h-0 flex-col gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        @scroll.passive="onScroll"
      >
        <li
          v-for="r in rows"
          :key="r.id"
          class="flex shrink-0 items-center gap-2.5 rounded-2xl border border-[#e3b66f] bg-[#fde7b8] p-2"
        >
          <span
            class="flex size-[clamp(2.4rem,11vw,2.9rem)] shrink-0 items-center justify-center rounded-full font-extrabold text-white text-[length:clamp(1.05rem,5vw,1.3rem)]"
            :style="{ backgroundColor: r.color }"
          >
            {{ r.initial }}
          </span>

          <div class="min-w-0 flex-1 leading-tight">
            <p class="truncate font-extrabold text-[length:clamp(0.9rem,4.3vw,1.1rem)]">{{ r.name }}</p>
            <p class="flex items-center gap-1 text-[#8a5a2b] font-bold text-[length:clamp(0.72rem,3.4vw,0.88rem)]">
              <template v-if="r.spend">
                {{ $t('Spent') }} <img decoding="async" loading="lazy" :src="StarIcon" alt="" class="w-[1.2em]" />{{ r.spend }}
              </template>
              <template v-else>{{ r.date }}</template>
            </p>
            <p v-if="r.spend && r.date" class="text-[#8a5a2b]/80 text-[length:clamp(0.65rem,3.1vw,0.8rem)]">{{ r.date }}</p>
          </div>

          <div class="flex shrink-0 flex-col items-center gap-0.5">
            <img decoding="async" loading="lazy" :src="r.img" alt="" class="block size-[clamp(2.6rem,12vw,3.2rem)] object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)]" />
            <span
              v-if="r.profit"
              class="rounded-full bg-[#1fb826] px-2 py-px font-extrabold leading-tight text-white tabular-nums text-[length:clamp(0.65rem,3.1vw,0.8rem)]"
            >
              {{ r.profit }}
            </span>
          </div>
        </li>

        <li v-if="!rows.length && !loading" class="py-8 text-center font-bold text-[#8a5a2b] text-[length:clamp(0.9rem,4.3vw,1.1rem)]">
          {{ $t('No winners yet') }}
        </li>
        <li v-if="loading" class="py-3 text-center font-bold text-[#8a5a2b] text-[length:clamp(0.8rem,3.8vw,0.95rem)]">{{ $t('Loading…') }}</li>
      </ul>

      <button
        type="button"
        class="mt-3 w-full shrink-0 rounded-full border border-[#b9722a] bg-[#fff4d6] py-1.5 font-bold text-[#552a0f] shadow-[0px_3px_3px_rgba(0,0,0,0.2)] active:translate-y-px text-[length:clamp(1rem,4.8vw,1.25rem)]"
        @click="emit('close')"
      >
        {{ $t('Close') }}
      </button>
    </div>
  </div>
</template>
