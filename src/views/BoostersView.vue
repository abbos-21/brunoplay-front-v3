<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
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

const defaults: { type: BoosterType; title: string; img: string; badge?: string; duration: string; cost: number }[] = [
  { type: 'AUTO_MINING', title: 'Auto Collect', img: BoosterAutoCollect, duration: 'Lifetime', cost: 500 },
  { type: 'MINING_BOOST_1_5X', title: 'Booster', img: BoosterMining, badge: '1.5x', duration: '30 days', cost: 100 },
]

function formatDuration(minutes: number) {
  if (!minutes) return 'Lifetime'
  const days = Math.round(minutes / DAY_MINUTES)
  return `${days} ${days === 1 ? 'day' : 'days'}`
}

const items = computed(() =>
  defaults.map((d) => {
    const info = shop.boosters.find((b) => b.type === d.type)
    return {
      ...d,
      duration: info ? formatDuration(info.durationMinutes) : d.duration,
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
    toast.show('Booster activated!', 'success')
  } catch (e) {
    toast.show(apiMessage(e, 'Could not buy the booster'), 'error')
  } finally {
    buying.value = null
  }
}
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <StarBalance />
      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-[length:clamp(0.8rem,4.1vw,1.15rem)]">
      <RouterLink
        to="/shop"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#fde7b8] text-[#552a0f]"
      >
        Cards
      </RouterLink>
      <RouterLink
        to="/shop/boosters"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#c17e23] text-white"
      >
        Boosters
      </RouterLink>
    </div>

    <div class="flex flex-col gap-2 mt-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div v-for="item in items" :key="item.type" class="shop-card shrink-0 flex items-center p-3 gap-2">
        <div class="relative w-[42%] aspect-square rounded-[20px] border border-[#c17e23] overflow-hidden">
          <img :src="item.img" :alt="item.title" class="w-full h-full object-cover" />
          <span
            v-if="item.badge"
            class="btn-gradient-orange border border-[#c66a27] !rounded-[10px] text-[#410200] absolute bottom-1 left-1/2 -translate-x-1/2 font-bold text-[length:clamp(0.7rem,3.59vw,1.01rem)] px-4 text-center whitespace-nowrap"
          >
            {{ item.badge }}
          </span>
        </div>

        <div class="flex-1 min-w-0 flex flex-col items-center justify-between gap-2 py-2">
          <h2 class="font-bold text-[#552a0f] text-[length:clamp(1.2rem,6.15vw,1.72rem)] text-center leading-tight">{{ item.title }}</h2>

          <p class="w-full text-center font-bold text-[#890d00] text-[length:clamp(1rem,5.13vw,1.44rem)] border-b border-dashed border-[#890d00]">
            {{ item.duration }}
          </p>

          <button
            type="button"
            :disabled="buying !== null || item.isActive"
            class="btn-gradient-orange border-[3px] border-[#c66a27] w-full flex items-center justify-center gap-1 text-[length:clamp(1rem,5.13vw,1.44rem)] font-extrabold outlined [--outline:#D76826] px-4 py-px rounded-[60px] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] disabled:opacity-60"
            @click="buy(item.type)"
          >
            <img :src="StarIcon" alt="" class="w-[clamp(1.2rem,6.15vw,1.72rem)] shrink-0" />
            {{ item.cost }}
          </button>
        </div>
      </div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
