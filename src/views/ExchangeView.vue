<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import CloseButton from '@/components/CloseButton.vue'
import { CoinImage } from '@/assets/images'
import { StarIcon } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/composables/apiError'
import { apiCode } from '@/api/client'
import { getExchange, exchangeStars } from '@/api/games'
import { useToast } from '@/composables/useToast'
import { useTopUp } from '@/composables/useTopUp'
import { useGoBack } from '@/composables/useGoBack'
import type { ExchangeInfo } from '@/types'

const auth = useAuthStore()
const toast = useToast()
const topUp = useTopUp()

// used until the API answers (or when it is switched off in dev mode)
const info = ref<ExchangeInfo>({ coinsPerStar: 10000, minStars: 1, enabled: true })
const loaded = ref(false)
onMounted(() => {
  getExchange()
    .then((i) => (info.value = i))
    .catch(() => {})
    .finally(() => (loaded.value = true))
})

const num = (n: number) => n.toLocaleString('en-US')
/** the rate may be a fraction (2.5 coins per star): show it without a long tail */
const rateText = computed(() => num(Number(info.value.coinsPerStar.toFixed(4))))

const stars = computed(() => auth.user?.starsBalance ?? 0)
const amountText = ref('')
const submitting = ref(false)

const amount = computed(() => Number(amountText.value) || 0)
/** the server rounds down, so does the preview */
const receive = computed(() => Math.floor(amount.value * info.value.coinsPerStar))

function setMax() {
  amountText.value = stars.value > 0 ? String(Math.floor(stars.value)) : ''
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
  amountText.value = digits
  el.value = digits
}

function validate(): string | null {
  if (!amount.value) return t('Enter the amount of stars')
  if (amount.value < info.value.minStars) return t('Minimum exchange is {n} stars', { n: num(info.value.minStars) })
  if (auth.user && amount.value > stars.value) return t('Not enough stars')
  if (receive.value < 1) return t('The amount is too small to exchange')
  return null
}

async function submit() {
  if (submitting.value) return
  if (!info.value.enabled) {
    toast.show(t('The exchange is not available right now'), 'warning')
    return
  }
  const problem = validate()
  if (problem) {
    toast.show(problem, 'warning')
    return
  }
  submitting.value = true
  try {
    const r = await exchangeStars(amount.value)
    auth.updateUser({ starsBalance: r.starsBalance, coins: r.coinsBalance })
    toast.show(t('Exchanged: +{n} coins', { n: num(r.coins) }), 'success')
    amountText.value = ''
  } catch (e) {
    if (apiCode(e) === 'INSUFFICIENT_STARS') {
      toast.show(t('Not enough stars'), 'warning')
      topUp.open()
    } else {
      toast.show(apiMessage(e, 'Exchange failed, please try again'), 'error')
    }
    // the rate or the balance may have changed meanwhile
    getExchange().then((i) => (info.value = i)).catch(() => {})
    auth.fetchUser().catch(() => {})
  } finally {
    submitting.value = false
  }
}

const close = useGoBack('/')
</script>

<template>
  <div
    class="w-full h-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#f9dc7a] bg-[radial-gradient(ellipse_75%_38%_at_50%_58%,#fbe166_0%,#f8db7c_70%,#f7db7e_100%)]"
  >
    <div class="min-h-full flex flex-col gap-3 p-4 pb-5">
      <!-- star balance + close -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0 flex items-center gap-2 h-[clamp(2.8rem,13vw,3.4rem)] rounded-full border border-[#552a0f] bg-[#cf8741] pl-1.5 pr-5 shadow-[inset_0px_-3px_4px_#935324]">
          <img decoding="async" :src="StarIcon" :alt="$t('Stars')" class="h-[82%] w-auto aspect-square shrink-0" />
          <AnimatedNumber
            kind="stars"
            plain
            :value="stars"
            :ready="!!auth.user"
            class="flex-1 text-center font-extrabold text-white text-[length:clamp(1.2rem,6.4vw,1.7rem)]"
          />
        </div>

        <CloseButton class="shrink-0 size-[clamp(2.8rem,13vw,3.4rem)]" @click="close" />
      </div>

      <h1 class="text-center font-bold text-[#552a0f] text-[length:clamp(1.5rem,8vw,2.1rem)] leading-none">{{ $t('Exchange') }}</h1>

      <!-- rate -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-3 py-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <p class="text-center text-[#8a5a2b] font-bold uppercase tracking-wide text-[length:clamp(0.65rem,3.1vw,0.8rem)]">{{ $t('Star rate') }}</p>
        <p class="mt-1 flex items-center justify-center gap-2 font-extrabold text-[#552a0f] text-[length:clamp(1rem,5.2vw,1.4rem)]">
          <img decoding="async" :src="StarIcon" alt="" class="w-[1.4em]" />
          1
          <span class="text-[#c17e23]">=</span>
          <img decoding="async" :src="CoinImage" alt="" class="w-[1.4em]" />
          {{ rateText }}
        </p>
      </div>

      <!-- form -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <label class="block">
          <span class="flex items-end justify-between px-1">
            <span class="font-bold text-[#552a0f] text-[length:clamp(0.9rem,4.4vw,1.15rem)]">{{ $t('Amount of stars') }}</span>
            <span class="text-[#8a5a2b] text-[length:clamp(0.65rem,3.2vw,0.85rem)]">{{ $t('Minimum') }}: {{ num(info.minStars) }}</span>
          </span>
          <span class="mt-1 flex items-center gap-2 rounded-2xl border border-[#e3b66f] bg-[#fde7b8] pl-3 pr-1.5 py-1.5 focus-within:border-[#cf8741] focus-within:bg-[#ffeec7]">
            <input
              :value="amountText"
              type="text"
              inputmode="numeric"
              autocomplete="off"
              placeholder="0"
              class="flex-1 min-w-0 bg-transparent outline-none font-extrabold text-[#552a0f] placeholder:text-[#552a0f]/40 text-[length:clamp(1.1rem,5.6vw,1.5rem)]"
              @input="onAmountInput"
            />
            <button
              type="button"
              class="shrink-0 rounded-full border border-[#b9722a] bg-[#fff4d6] px-3 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.8rem,3.9vw,1rem)] active:translate-y-px"
              @click="setMax"
            >
              {{ $t('Max') }}
            </button>
          </span>
        </label>
      </div>

      <!-- summary -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-4 py-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <div class="flex items-center justify-between text-[#552a0f] font-extrabold text-[length:clamp(1rem,5.2vw,1.4rem)]">
          <span>{{ $t('You will get') }}</span>
          <span class="flex items-center gap-1.5 tabular-nums">
            <img decoding="async" :src="CoinImage" alt="" class="w-[1.3em]" />
            {{ num(receive) }}
          </span>
        </div>
      </div>

      <div class="flex-1 min-h-2" />

      <p v-if="loaded && !info.enabled" class="text-center font-bold text-[#890d00] text-[length:clamp(0.85rem,4.2vw,1.05rem)]">
        {{ $t('The exchange is not available right now') }}
      </p>
      <button
        type="button"
        class="w-full rounded-full border border-[#552a0f] bg-[#5edf3d] py-2.5 font-bold text-white text-[length:clamp(1.3rem,6.6vw,1.8rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
        :disabled="submitting || (loaded && !info.enabled)"
        @click="submit"
      >
        {{ submitting ? $t('Sending…') : $t('Exchange') }}
      </button>
    </div>
  </div>
</template>
