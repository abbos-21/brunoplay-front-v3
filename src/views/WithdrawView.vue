<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import CloseButton from '@/components/CloseButton.vue'
import { CoinImage, TonImage } from '@/assets/images'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import type { WithdrawalInfo } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const wallet = useWalletStore()
const toast = useToast()

// used until the API answers (or when it is switched off in dev mode)
const fallbackInfo: WithdrawalInfo = {
  coinToTonRate: 0.00001,
  minimumCoinWithdrawal: 10000,
  maximumCoinWithdrawal: 5000000,
  withdrawalFeeTon: 0.005,
  balance: 0,
}
const info = computed(() => wallet.withdrawalInfo ?? fallbackInfo)

onMounted(() => {
  wallet.fetchWithdrawalInfo().catch(() => {})
})

// ───────────────────────── numbers ─────────────────────────
const num = (n: number) => n.toLocaleString('en-US')
const ton = (n: number) => String(Number(n.toFixed(4)))

/** the API gives the rate as TON per coin; tolerate "coins per TON" too */
const tonPerCoin = computed(() => {
  const r = info.value.coinToTonRate
  return r > 1 ? 1 / r : r
})
const coinsPerTon = computed(() => Math.round(1 / tonPerCoin.value))

const balance = computed(() => auth.user?.coins ?? 0)

const amountText = ref('')
const address = ref('')
const submitting = ref(false)

const amount = computed(() => Number(amountText.value) || 0)
const receive = computed(() =>
  Math.max(0, amount.value * tonPerCoin.value - info.value.withdrawalFeeTon),
)

/** fill in everything the player may withdraw at once */
function setMax() {
  const most = Math.min(Math.floor(balance.value), info.value.maximumCoinWithdrawal)
  amountText.value = most > 0 ? String(most) : ''
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '')
  amountText.value = digits
  el.value = digits
}

const TON_ADDRESS = /^(?:(?:EQ|UQ|kQ|0Q)[A-Za-z0-9_-]{46}|-?\d+:[0-9a-fA-F]{64})$/

function validate(): string | null {
  if (!amount.value) return 'Enter the amount of coins'
  if (amount.value < info.value.minimumCoinWithdrawal)
    return `Minimum withdrawal is ${num(info.value.minimumCoinWithdrawal)} coins`
  if (amount.value > info.value.maximumCoinWithdrawal)
    return `Maximum withdrawal is ${num(info.value.maximumCoinWithdrawal)} coins`
  if (auth.user && amount.value > balance.value) return 'Not enough coins'
  if (receive.value <= 0) return 'The amount is too small to cover the blockchain fee'
  if (!TON_ADDRESS.test(address.value.trim())) return 'Enter a valid TON address'
  return null
}

async function submit() {
  if (submitting.value) return
  const problem = validate()
  if (problem) {
    toast.show(problem, 'warning')
    return
  }
  submitting.value = true
  try {
    await wallet.createWithdrawal(address.value.trim(), amount.value)
    toast.show('Withdrawal requested', 'success')
    amountText.value = ''
    address.value = ''
  } catch (e) {
    toast.show(apiMessage(e, 'Withdrawal failed, please try again'), 'error')
  } finally {
    submitting.value = false
  }
}

function close() {
  if (window.history.length > 1) router.back()
  else router.push('/')
}
</script>

<template>
  <div
    class="w-full h-full overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#f9dc7a] bg-[radial-gradient(ellipse_75%_38%_at_50%_58%,#fbe166_0%,#f8db7c_70%,#f7db7e_100%)]"
  >
    <div class="min-h-full flex flex-col gap-3 p-4 pb-5">
      <!-- balance + close -->
      <div class="flex items-center justify-between gap-3">
        <div class="flex-1 min-w-0 flex items-center gap-2 h-[clamp(2.8rem,13vw,3.4rem)] rounded-full border border-[#552a0f] bg-[#cf8741] pl-1.5 pr-5 shadow-[inset_0px_-3px_4px_#935324]">
          <img :src="CoinImage" alt="Coins" class="h-[82%] w-auto aspect-square shrink-0" />
          <AnimatedNumber
            kind="coins"
            plain
            :value="balance"
            :ready="!!auth.user"
            class="flex-1 text-center font-extrabold text-white text-[length:clamp(1.2rem,6.4vw,1.7rem)]"
          />
        </div>

        <CloseButton class="shrink-0 size-[clamp(2.8rem,13vw,3.4rem)]" @click="close" />
      </div>

      <h1 class="text-center font-bold text-[#552a0f] text-[length:clamp(1.5rem,8vw,2.1rem)] leading-none">Withdraw</h1>

      <!-- rate -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-3 py-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <p class="text-center text-[#8a5a2b] font-bold uppercase tracking-wide text-[length:clamp(0.65rem,3.1vw,0.8rem)]">Coin rate</p>
        <p class="mt-1 flex items-center justify-center gap-2 font-extrabold text-[#552a0f] text-[length:clamp(1rem,5.2vw,1.4rem)]">
          <img :src="CoinImage" alt="" class="w-[1.4em]" />
          {{ num(coinsPerTon) }} coins
          <span class="text-[#c17e23]">=</span>
          <img :src="TonImage" alt="" class="w-[1.4em] rounded-full" />
          1 TON
        </p>
      </div>

      <!-- form -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <label class="block">
          <span class="flex items-end justify-between px-1">
            <span class="font-bold text-[#552a0f] text-[length:clamp(0.9rem,4.4vw,1.15rem)]">Amount of coins</span>
            <span class="text-[#8a5a2b] text-[length:clamp(0.65rem,3.2vw,0.85rem)]">
              {{ num(info.minimumCoinWithdrawal) }} – {{ num(info.maximumCoinWithdrawal) }}
            </span>
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
              Max
            </button>
          </span>
        </label>

        <label class="block mt-3">
          <span class="block px-1 font-bold text-[#552a0f] text-[length:clamp(0.9rem,4.4vw,1.15rem)]">TON address</span>
          <input
            v-model="address"
            type="text"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            placeholder="UQA…"
            class="mt-1 w-full rounded-2xl border border-[#e3b66f] bg-[#fde7b8] px-3 py-2.5 outline-none font-bold text-[#552a0f] placeholder:text-[#552a0f]/40 focus:border-[#cf8741] focus:bg-[#ffeec7] truncate text-[length:clamp(0.95rem,4.8vw,1.25rem)]"
          />
        </label>
      </div>

      <!-- summary -->
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-4 py-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <div class="flex items-center justify-between text-[#8a5a2b] font-bold text-[length:clamp(0.8rem,4vw,1.05rem)]">
          <span>Blockchain fee</span>
          <span class="tabular-nums">{{ ton(info.withdrawalFeeTon) }} TON</span>
        </div>
        <div class="mt-1.5 flex items-center justify-between text-[#552a0f] font-extrabold text-[length:clamp(1rem,5.2vw,1.4rem)]">
          <span>You will receive</span>
          <span class="flex items-center gap-1.5 tabular-nums">
            <img :src="TonImage" alt="" class="w-[1.3em] rounded-full" />
            {{ ton(receive) }} TON
          </span>
        </div>
      </div>

      <div class="flex-1 min-h-2" />

      <!-- withdraw -->
      <button
        type="button"
        class="w-full rounded-full border border-[#552a0f] bg-[#5edf3d] py-2.5 font-bold text-white text-[length:clamp(1.3rem,6.6vw,1.8rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitting ? 'Sending…' : 'Withdraw' }}
      </button>

      <RouterLink
        to="/withdraw/history"
        class="self-center flex items-center gap-2 rounded-full border border-[#b9722a] bg-[#fff4d6] px-5 py-1.5 font-bold text-[#552a0f] text-[length:clamp(0.85rem,4.2vw,1.1rem)] shadow-[0px_3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
      >
        <svg class="w-[1.3em]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" />
          <path d="M3.5 3.8v4.7h4.7" />
          <path d="M12 7.5V12l3 2" />
        </svg>
        Transaction history
      </RouterLink>
    </div>
  </div>
</template>
