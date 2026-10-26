<script setup lang="ts">
import { t, tn } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import PageTabs from '@/components/PageTabs.vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { StarIcon } from '@/assets/svgs'
import { BoosterAutoCollect, BoosterMining } from '@/assets/images'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { useShopStore } from '@/stores/shop'
import type { BoosterType } from '@/types'

const isMenuOpen = ref(false)
const shop = useShopStore()
const toast = useToast()

onMounted(() => {
  shop.fetchBoosters().catch(() => {})
})

const DAY_MINUTES = 60 * 24

const defaults: { type: BoosterType; title: string; img: string; hint: string; minutes: number; cost: number }[] = [
  { type: 'AUTO_MINING', title: 'Auto Collect', img: BoosterAutoCollect, hint: 'Collects your coins for you, no tapping', minutes: 0, cost: 500 },
  { type: 'MINING_BOOST_1_5X', title: 'Booster', img: BoosterMining, hint: 'Fish 1.5 times faster', minutes: 30 * DAY_MINUTES, cost: 100 },
]

function formatDuration(minutes: number) {
  if (!minutes) return t('Lifetime')
  return tn('{n} day|{n} days', Math.round(minutes / DAY_MINUTES))
}

const items = computed(() =>
  defaults.map((d) => {
    const info = shop.boosters.find((b) => b.type === d.type)
    return {
      ...d,
      duration: formatDuration(info ? info.durationMinutes : d.minutes),
      cost: info?.costStars ?? d.cost,
      isActive: info?.isActive ?? false,
    }
  }),
)

const buying = ref<BoosterType | null>(null)

async function buy(type: BoosterType) {
  if (buying.value) return
  buying.value = type
  try {
    await shop.purchaseBooster(type)
    toast.show(t('Booster activated!'), 'success')
  } catch (e) {
    toast.show(apiMessage(e, 'Could not buy the booster'), 'error')
  } finally {
    buying.value = null
  }
}
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-clip pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <PageTabs
      :tabs="[
        { key: 'cards', label: $t('Cards'), to: '/shop', active: false },
        { key: 'boosters', label: $t('Boosters'), to: '/shop/boosters', active: true },
      ]"
    />

    <div class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <article
        v-for="item in items"
        :key="item.type"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <!-- picture, name, what it does -->
        <div class="flex items-center gap-3">
          <div
            class="relative shrink-0 w-[clamp(4rem,19vw,5.25rem)] aspect-square rounded-2xl border border-[#cf8741] overflow-hidden"
          >
            <img decoding="async" loading="lazy" :src="item.img" :alt="$t(item.title)" class="w-full h-full object-cover" />
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1.15rem,6vw,1.6rem)]">{{ $t(item.title) }}</h2>
            <p class="text-[#8a5a2b] leading-tight text-[length:clamp(0.75rem,3.6vw,0.95rem)]">{{ $t(item.hint) }}</p>
          </div>
        </div>

        <!-- how long it lasts -->
        <div class="mt-3 flex items-center justify-between rounded-2xl bg-[#fde7b8] border border-[#e3b66f] px-3 py-1.5">
          <span class="text-[#8a5a2b] uppercase tracking-wide font-bold text-[length:clamp(0.65rem,3vw,0.8rem)]">{{ $t('Lasts') }}</span>
          <span class="font-extrabold text-[#552a0f] text-[length:clamp(1rem,5vw,1.3rem)]">{{ item.duration }}</span>
        </div>

        <!-- buy -->
        <div
          v-if="item.isActive"
          class="mt-3 w-full rounded-2xl border-2 border-[#74c14e] bg-[#e4f7d6] py-2 text-center font-extrabold text-[#1f6a05] text-[length:clamp(1.05rem,5.4vw,1.4rem)]"
        >
          {{ $t('Active ✓') }}
        </div>
        <button
          v-else
          type="button"
          :disabled="buying !== null"
          class="mt-3 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 flex items-center justify-center gap-2 font-bold text-white text-[length:clamp(1.1rem,5.6vw,1.45rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
          @click="buy(item.type)"
        >
          <template v-if="buying === item.type">{{ $t('Buying…') }}</template>
          <template v-else>
            {{ $t('Buy') }}
            <span class="flex items-center gap-1">
              <img decoding="async" loading="lazy" :src="StarIcon" alt="" class="w-[1.2em]" />
              {{ item.cost.toLocaleString('en-US') }}
            </span>
          </template>
        </button>
      </article>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
