<script setup lang="ts">
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

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

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
      : `${pad(d.getDate())}.${pad(d.getMonth() + 1)} - ${pad(d.getHours())}:${pad(d.getMinutes())}`
    const spent = w.spentStars
    const profit =
      spent && spent > 0 && w.prizeType !== 'coins'
        ? `x${Math.max(1, Math.round(w.prizeValue / spent)).toLocaleString('en-US')}`
        : '—'
    return {
      id: w.id,
      name: w.username ? `@${w.username}` : 'Anonymous',
      initial: (w.username || '?').charAt(0).toUpperCase(),
      color: colors[w.id % colors.length]!,
      spend: spent ? spent.toLocaleString('en-US') : '—',
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
    class="absolute inset-0 z-40 flex items-center justify-center bg-[#543608]/90 backdrop-blur-[5px] [container-type:inline-size]"
    role="dialog"
    aria-modal="true"
    aria-label="Winners list"
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
        Winners List
      </h2>

      <ul
        class="flex flex-col overflow-y-auto min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        :style="{ gap: u(10), marginTop: u(14) }"
        @scroll.passive="onScroll"
      >
        <li
          v-for="r in rows"
          :key="r.id"
          class="relative shrink-0 flex items-center bg-black/50 text-white"
          :style="{
            minHeight: u(150),
            borderRadius: u(30),
            padding: `${u(14)} ${u(20)} ${u(30)}`,
            gap: u(16),
          }"
        >
          <span
            class="shrink-0 flex items-center justify-center rounded-full font-extrabold text-white shadow-[0px_3px_2px_rgba(0,0,0,0.25),inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)]"
            :style="{ width: u(89), height: u(89), fontSize: u(44), backgroundColor: r.color }"
          >
            {{ r.initial }}
          </span>

          <div
            class="flex-1 min-w-0 font-extrabold leading-tight"
            :style="{ fontSize: u(27), letterSpacing: '0.01em' }"
          >
            <p class="truncate">{{ r.name }}</p>
            <p class="flex items-center opacity-50" :style="{ gap: u(6) }">
              Spend: {{ r.spend }}
              <img v-if="r.spend !== '—'" :src="StarIcon" alt="" :style="{ width: u(36) }" />
            </p>
          </div>

          <p
            class="shrink-0 text-center font-extrabold leading-tight"
            :style="{ fontSize: u(27), letterSpacing: '0.01em', width: u(110) }"
          >
            Profit:<br />{{ r.profit }}
          </p>

          <div class="shrink-0 flex flex-col items-center" :style="{ width: u(100) }">
            <span class="font-extrabold opacity-50 leading-none" :style="{ fontSize: u(27) }">Won</span>
            <img
              :src="r.img"
              alt=""
              class="block object-contain drop-shadow-[0_4px_4px_rgba(0,0,0,0.25)]"
              :style="{ width: u(90), height: u(90) }"
            />
          </div>

          <span
            class="absolute font-semibold leading-none whitespace-nowrap"
            :style="{ left: u(190), bottom: u(12), fontSize: u(20), letterSpacing: '0.01em' }"
          >
            #{{ r.id }}&nbsp;&nbsp;&nbsp;&nbsp;{{ r.date }}
          </span>
        </li>

        <li
          v-if="!rows.length && !loading"
          class="text-center font-bold text-white/70"
          :style="{ fontSize: u(30), padding: u(40) }"
        >
          No winners yet
        </li>
        <li
          v-if="loading"
          class="text-center font-bold text-white/70"
          :style="{ fontSize: u(26), padding: u(16) }"
        >
          Loading…
        </li>
      </ul>

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
