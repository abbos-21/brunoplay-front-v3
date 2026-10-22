<script setup lang="ts">
import { computed } from 'vue'
import { StarIcon } from '@/assets/svgs'
import { CoinImage } from '@/assets/images'
import { resolvePrizes, sortForList } from '@/views/spin-prizes'
import type { SpinPrize } from '@/types'

const props = defineProps<{ prizes: SpinPrize[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const items = computed(() => sortForList(resolvePrizes(props.prizes)))

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`
</script>

<template>
  <div
    class="absolute inset-0 z-40 flex items-center justify-center bg-[#543608]/90 backdrop-blur-[5px] [container-type:inline-size]"
    role="dialog"
    aria-modal="true"
    aria-label="Prizes list"
    @click.self="emit('close')"
  >
    <div
      class="flex flex-col bg-[#e11d10] shadow-[inset_0px_0px_133px_97px_rgba(0,0,0,0.25)]"
      :style="{
        width: u(730),
        maxHeight: '94%',
        borderRadius: u(30),
        padding: `${u(24)} ${u(20)} ${u(30)}`,
      }"
    >
      <h2
        class="text-center font-extrabold leading-tight bg-clip-text text-transparent [filter:drop-shadow(0px_4px_2px_rgba(0,0,0,0.25))]"
        :style="{
          fontSize: u(64),
          letterSpacing: '0.01em',
          backgroundImage: 'linear-gradient(183deg, rgb(247,255,247) 40%, rgb(253,222,114) 56%)',
        }"
      >
        Prizes List
      </h2>

      <div
        class="grid grid-cols-3 overflow-y-auto min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :style="{ gap: `${u(24)} ${u(8)}`, marginTop: u(20), paddingBottom: u(8) }"
      >
        <div v-for="(it, i) in items" :key="i" class="flex flex-col items-center">
          <img
            :src="it.img"
            :alt="it.name"
            class="block object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
            :style="{
              width: u(it.kind === 'gift' ? 230 : 150),
              height: u(it.kind === 'gift' ? 230 : 150),
              margin: it.kind === 'gift' ? 0 : `${u(80)} 0 0`,
            }"
          />
          <span
            class="flex items-center justify-center bg-[#195fd8] text-white font-extrabold leading-none shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)]"
            :style="{
              width: u(200),
              height: u(62),
              borderRadius: u(30),
              gap: u(8),
              fontSize: u(27),
              letterSpacing: '0.01em',
              marginTop: `-${u(20)}`,
            }"
          >
            <img
              :src="it.kind === 'coins' ? CoinImage : StarIcon"
              alt=""
              :style="{ width: u(it.kind === 'coins' ? 35 : 40) }"
            />
            {{ it.amount }}
          </span>
        </div>
      </div>

      <button
        type="button"
        class="self-center shrink-0 bg-[#fbe166] text-[#552a0f] font-extrabold shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] active:translate-y-px"
        :style="{
          width: u(340),
          height: u(90),
          borderRadius: u(30),
          fontSize: u(48),
          marginTop: u(16),
          letterSpacing: '0.01em',
        }"
        @click="emit('close')"
      >
        Close
      </button>
    </div>
  </div>
</template>
