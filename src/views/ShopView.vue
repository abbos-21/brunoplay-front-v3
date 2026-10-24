<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { RouterLink } from 'vue-router'
import { MiningRate, CoinCapacity, CoinImage } from '@/assets/images'
import { StarIcon } from '@/assets/svgs'
import { useShopStore } from '@/stores/shop'
import { useAuthStore } from '@/stores/auth'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import type { CardInfo, CardName } from '@/types'

const isMenuOpen = ref(false)
const shop = useShopStore()
const auth = useAuthStore()
const toast = useToast()

const IMAGES: Record<CardName, { img: string; title: string; hint: string }> = {
  MINING_RATE: { img: MiningRate, title: 'Mining rate', hint: 'Coins you fish per second' },
  COIN_CAPACITY: { img: CoinCapacity, title: 'Coin capacity', hint: 'Coins your tank can hold' },
}
const ORDER: CardName[] = ['MINING_RATE', 'COIN_CAPACITY']

// shown until the server answers
const PLACEHOLDER: CardInfo[] = [
  { cardName: 'MINING_RATE', currentLevel: 1, currentValue: 0.025, nextLevel: 2, nextValue: 0.03, upgradeCost: 700, upgradeCurrency: 'COIN', canUpgrade: false, requirements: [] },
  { cardName: 'COIN_CAPACITY', currentLevel: 1, currentValue: 5, nextLevel: 2, nextValue: 10, upgradeCost: 500, upgradeCurrency: 'COIN', canUpgrade: false, requirements: [] },
]

const cards = computed(() => {
  const list = shop.cards.length ? shop.cards : PLACEHOLDER
  return ORDER.map((n) => list.find((c) => c.cardName === n)).filter((c): c is CardInfo => !!c)
})

onMounted(() => {
  shop.fetchCards().catch(() => {})
})

const fmt = (n: number | null) => (n === null ? '—' : String(Number(n.toFixed(4))))
const busy = ref<CardName | null>(null)

/** why the card cannot be upgraded right now (first unmet requirement, else the price) */
function reason(c: CardInfo): string {
  if (c.nextLevel === null) return t('This card is at the maximum level')
  const unmet = c.requirements.find((r) => !r.met)
  if (unmet) return t('Needs: {text}', { text: t(unmet.description) })
  if (c.upgradeCost !== null) {
    // a card is paid in coins or in stars, as the owner set it per level
    const stars = c.upgradeCurrency === 'STAR'
    const have = stars ? (auth.user?.starsBalance ?? 0) : (auth.user?.coins ?? 0)
    if (have < c.upgradeCost) return t(stars ? 'You need {n} stars' : 'You need {n} coins', { n: c.upgradeCost.toLocaleString('en-US') })
  }
  return ''
}

/** the line under the numbers: what is missing for the next level (empty when nothing is) */
const lockNote = (c: CardInfo) => (c.nextLevel === null ? '' : reason(c))

async function upgrade(c: CardInfo) {
  if (busy.value) return
  const why = reason(c)
  if (why) return toast.show(why, 'warning')
  busy.value = c.cardName
  try {
    await shop.upgradeCard(c.cardName)
    toast.show(t('{name} upgraded!', { name: t(IMAGES[c.cardName].title) }), 'success')
  } catch (e) {
    toast.show(apiMessage(e, 'Could not upgrade'), 'error')
  } finally {
    busy.value = null
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

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-base sm:text-xl">
      <RouterLink
        to="/shop"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#c17e23] text-white"
      >
        {{ $t('Cards') }}
      </RouterLink>
      <RouterLink
        to="/shop/boosters"
        class="border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px] bg-[#fde7b8] text-[#552a0f]"
      >
        {{ $t('Boosters') }}
      </RouterLink>
    </div>

    <div class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <article
        v-for="item in cards"
        :key="item.cardName"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <!-- icon, name, level -->
        <div class="flex items-center gap-3">
          <div
            class="shrink-0 w-[clamp(4rem,19vw,5.25rem)] aspect-square rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#fff6bf,#fbe166_70%)] border border-[#cf8741] shadow-[inset_0px_-4px_6px_rgba(193,126,35,0.45)] flex items-center justify-center p-2"
          >
            <img :src="IMAGES[item.cardName].img" :alt="$t(IMAGES[item.cardName].title)" class="w-full h-full object-contain" />
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1.15rem,6vw,1.6rem)]">
              {{ $t(IMAGES[item.cardName].title) }}
            </h2>
            <p class="text-[#8a5a2b] leading-tight text-[length:clamp(0.75rem,3.6vw,0.95rem)]">
              {{ $t(IMAGES[item.cardName].hint) }}
            </p>
          </div>

          <span
            class="shrink-0 self-start rounded-full bg-[#552a0f] px-3 py-0.5 font-bold text-[#fbe166] text-[length:clamp(0.75rem,3.6vw,0.95rem)] shadow-[inset_0px_-2px_2px_rgba(0,0,0,0.35)]"
          >
            {{ $t('Lvl {n}', { n: item.currentLevel }) }}
          </span>
        </div>

        <!-- now → next -->
        <div class="mt-3 flex items-stretch gap-2">
          <div class="flex-1 rounded-2xl bg-[#fde7b8] border border-[#e3b66f] py-1.5 text-center">
            <div class="text-[#8a5a2b] text-[length:clamp(0.65rem,3vw,0.8rem)] uppercase tracking-wide font-bold">{{ $t('Now') }}</div>
            <div class="font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(1.05rem,5.4vw,1.45rem)]">
              {{ fmt(item.currentValue) }}
            </div>
          </div>

          <svg class="w-5 shrink-0 self-center text-[#c17e23]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>

          <div
            class="flex-1 rounded-2xl border py-1.5 text-center"
            :class="item.nextLevel === null ? 'bg-[#fde7b8] border-[#e3b66f]' : 'bg-[#e4f7d6] border-[#74c14e]'"
          >
            <div
              class="text-[length:clamp(0.65rem,3vw,0.8rem)] uppercase tracking-wide font-bold"
              :class="item.nextLevel === null ? 'text-[#8a5a2b]' : 'text-[#2f7a12]'"
            >
              {{ item.nextLevel === null ? $t('Top level') : $t('Lvl {n}', { n: item.nextLevel }) }}
            </div>
            <div
              class="font-extrabold tabular-nums text-[length:clamp(1.05rem,5.4vw,1.45rem)]"
              :class="item.nextLevel === null ? 'text-[#552a0f]' : 'text-[#1f6a05]'"
            >
              {{ item.nextLevel === null ? 'MAX' : fmt(item.nextValue) }}
            </div>
          </div>
        </div>

        <!-- why it is locked -->
        <p v-if="lockNote(item)" class="mt-2 flex items-center gap-1.5 text-[#890d00] font-bold text-[length:clamp(0.75rem,3.5vw,0.9rem)] leading-tight">
          <svg class="w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5Zm-3 8V7a3 3 0 1 1 6 0v3H9Z" />
          </svg>
          {{ lockNote(item) }}
        </p>

        <!-- upgrade -->
        <button
          v-if="item.nextLevel !== null"
          type="button"
          class="mt-3 w-full rounded-full border py-2 flex items-center justify-center gap-2 font-bold text-white text-[length:clamp(1.1rem,5.6vw,1.45rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px"
          :class="item.canUpgrade && !lockNote(item) ? 'border-[#d9680f] bg-[#f96a07]' : 'border-[#b59468] bg-[#c9a97d]'"
          :disabled="busy !== null"
          @click="upgrade(item)"
        >
          <template v-if="busy === item.cardName">{{ $t('Upgrading…') }}</template>
          <template v-else>
            {{ $t('Upgrade') }}
            <span class="flex items-center gap-1">
              <img :src="item.upgradeCurrency === 'STAR' ? StarIcon : CoinImage" alt="" class="w-[1.2em]" />
              {{ item.upgradeCost === null ? '' : item.upgradeCost.toLocaleString('en-US') }}
            </span>
          </template>
        </button>
        <div
          v-else
          class="mt-3 w-full rounded-2xl border-2 border-[#74c14e] bg-[#e4f7d6] py-2 text-center font-extrabold text-[#1f6a05] text-[length:clamp(1.05rem,5.4vw,1.4rem)]"
        >
          {{ $t('Fully upgraded ✓') }}
        </div>
      </article>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
