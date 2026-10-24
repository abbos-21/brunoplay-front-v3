<script setup lang="ts">
import { computed } from 'vue'
import { StarIcon } from '@/assets/svgs'
import { CoinImage } from '@/assets/images'
import { resolvePrizes, sortForList } from '@/views/spin-prizes'
import type { SpinPrize } from '@/types'

const props = defineProps<{ prizes: SpinPrize[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const items = computed(() => sortForList(resolvePrizes(props.prizes)))
</script>

<template>
  <div
    class="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-[3px]"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('Prizes')"
    @click.self="emit('close')"
  >
    <div
      class="flex max-h-full w-full max-w-[24rem] flex-col rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-4 text-[#552a0f] shadow-[0px_6px_12px_rgba(0,0,0,0.35)]"
    >
      <div class="shrink-0 text-center">
        <h2 class="font-extrabold leading-tight text-[length:clamp(1.35rem,6.4vw,1.75rem)]">{{ $t('Prizes') }}</h2>
        <p class="text-[#8a5a2b] font-bold text-[length:clamp(0.8rem,3.8vw,0.95rem)]">{{ $t('What you can win') }}</p>
      </div>

      <div
        class="mt-3 grid min-h-0 grid-cols-3 gap-2 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          v-for="(it, i) in items"
          :key="i"
          class="flex flex-col items-center rounded-2xl border border-[#e3b66f] bg-[#fde7b8] px-1 pb-2 pt-2"
        >
          <div class="flex aspect-square w-full items-center justify-center">
            <img
              :src="it.img"
              :alt="it.name"
              class="block max-h-full max-w-full object-contain drop-shadow-[0_3px_3px_rgba(0,0,0,0.3)]"
              :class="it.kind === 'gift' ? 'w-[88%]' : 'w-[62%]'"
            />
          </div>
          <span
            class="mt-1 flex max-w-full items-center gap-0.5 rounded-full bg-[#195fd8] px-2 py-0.5 font-extrabold leading-tight text-white tabular-nums shadow-[inset_0px_2px_3px_rgba(255,255,255,0.25),inset_0px_-2px_3px_rgba(0,0,0,0.25)] text-[length:clamp(0.62rem,3.1vw,0.9rem)]"
          >
            <img :src="it.kind === 'coins' ? CoinImage : StarIcon" alt="" class="w-[1.2em]" />
            {{ it.amount }}
          </span>
        </div>
      </div>

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
