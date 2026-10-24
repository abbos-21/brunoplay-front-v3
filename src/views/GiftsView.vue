<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { StarIcon } from '@/assets/svgs'
import { useGamesStore } from '@/stores/games'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { resolvePrizes } from '@/views/spin-prizes'
import type { PlayerGift } from '@/types'

const isMenuOpen = ref(false)
const games = useGamesStore()
const toast = useToast()
const loaded = ref(false)

onMounted(async () => {
  try {
    await games.fetchGifts()
  } catch (e) {
    toast.show(apiMessage(e, 'Could not load your gifts'), 'error')
  } finally {
    loaded.value = true
  }
})

// gifts that are gone (sold) are not listed
const list = computed(() => games.gifts.filter((g) => g.status !== 'SOLD'))

/** the picture of a gift, found by its catalogue key */
const art = (g: PlayerGift) =>
  resolvePrizes([{ type: 'gift', value: g.starValue, weight: 0, gift: g.gift, label: g.name }])[0]!.img

const STATUS: Record<string, { label: string; chip: string }> = {
  OWNED: { label: 'In your collection', chip: 'bg-[#ffe9b0] text-[#8a5a00] border-[#e8c25a]' },
  CLAIM_REQUESTED: { label: 'Waiting for delivery', chip: 'bg-[#d8ecff] text-[#0a5a96] border-[#7fbbe8]' },
  DELIVERED: { label: 'Delivered', chip: 'bg-[#e4f7d6] text-[#1f6a05] border-[#74c14e]' },
}

// a two-step confirm: the first tap asks, the second one does it
const asking = ref<{ id: number; action: 'sell' | 'claim' } | null>(null)
let askTimer: ReturnType<typeof setTimeout> | undefined

async function act(g: PlayerGift, action: 'sell' | 'claim') {
  if (games.isLoading) return
  if (asking.value?.id !== g.id || asking.value.action !== action) {
    asking.value = { id: g.id, action }
    clearTimeout(askTimer)
    askTimer = setTimeout(() => (asking.value = null), 4000)
    return
  }
  asking.value = null
  try {
    if (action === 'sell') {
      const r = await games.sellGift(g.id)
      toast.show(t('Sold for {n} stars', { n: r.stars.toLocaleString('en-US') }), 'success')
    } else {
      await games.claimGift(g.id)
      toast.show(t('Request sent. We will deliver the gift in Telegram.'), 'success')
    }
  } catch (e) {
    toast.show(apiMessage(e, 'Something went wrong'), 'error')
  }
}
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <h1 class="mt-4 text-center font-bold text-[#552a0f] text-[length:clamp(1.5rem,8vw,2.1rem)] leading-none">{{ $t('My gifts') }}</h1>
    <p class="mt-1 text-center text-[#8a5a2b] text-[length:clamp(0.8rem,3.8vw,1rem)]">
      {{ $t('Sell a gift for its full value in stars, or ask us to send the real gift to your Telegram.') }}
    </p>

    <div class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <p v-if="loaded && !list.length" class="text-center font-bold text-[#552a0f] mt-8">{{ $t('You have no gifts yet. Win them in Fortune Spin!') }}</p>

      <article
        v-for="g in list"
        :key="g.id"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <div class="flex items-center gap-3">
          <div class="shrink-0 size-[clamp(3.5rem,17vw,4.5rem)] rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#fff6bf,#fbe166_75%)] border border-[#cf8741] flex items-center justify-center">
            <img :src="art(g)" :alt="g.name" class="w-[82%] h-[82%] object-contain" />
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1rem,5vw,1.3rem)]">{{ g.name }}</h2>
            <p class="flex items-center gap-1 font-extrabold text-[#552a0f] tabular-nums">
              <img :src="StarIcon" alt="" class="w-[1.1em]" />{{ g.starValue.toLocaleString('en-US') }}
            </p>
            <span
              class="mt-1 inline-block rounded-full border px-2.5 py-px font-bold leading-tight text-[length:clamp(0.62rem,3vw,0.78rem)]"
              :class="STATUS[g.status]?.chip"
            >{{ $t(STATUS[g.status]?.label ?? g.status) }}</span>
          </div>
        </div>
        <p v-if="g.status === 'OWNED' && g.rejectReason" class="mt-2 text-[#a01208] font-bold text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
          {{ $t('We could not send it:') }} {{ g.rejectReason }}
        </p>

        <div v-if="g.status === 'OWNED'" class="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            :disabled="games.isLoading"
            class="rounded-full border border-[#d9680f] bg-[#f96a07] py-1.5 font-bold text-white text-[length:clamp(0.85rem,4.2vw,1.1rem)] disabled:opacity-60 active:translate-y-px"
            @click="act(g, 'sell')"
          >
            {{ asking?.id === g.id && asking.action === 'sell' ? $t('Tap to confirm') : $t('Sell') }}
          </button>
          <button
            type="button"
            :disabled="games.isLoading"
            class="rounded-full border border-[#0a6ea8] bg-[#0e89d4] py-1.5 font-bold text-white text-[length:clamp(0.85rem,4.2vw,1.1rem)] disabled:opacity-60 active:translate-y-px"
            @click="act(g, 'claim')"
          >
            {{ asking?.id === g.id && asking.action === 'claim' ? $t('Tap to confirm') : $t('Get the gift') }}
          </button>
        </div>
      </article>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
