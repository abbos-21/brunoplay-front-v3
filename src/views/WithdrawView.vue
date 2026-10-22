<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { CoinImage, TonImage } from '@/assets/images'
import { ClockIcon, RoundButton } from '@/assets/svgs/wallet'
import { useAuthStore } from '@/stores/auth'
import { useWalletStore } from '@/stores/wallet'
import { useToast } from '@/composables/useToast'
import type { WithdrawalInfo } from '@/types'

const router = useRouter()
const auth = useAuthStore()
const wallet = useWalletStore()
const toast = useToast()

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

// the design's inset shadow, scaled with the page width
const cardShadow = `0px 4px 4px rgba(0,0,0,0.25), inset 0px 0px ${u(4)} ${u(9)} rgba(0,0,0,0.25)`

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
    router.push('/withdraw/history')
  } catch (e: any) {
    toast.show(
      e?.response?.data?.error?.message ||
        e?.response?.data?.message ||
        'Withdrawal failed, please try again',
      'error',
    )
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
    class="w-full h-full overflow-y-auto overflow-x-hidden [container-type:inline-size] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden bg-[#f9dc7a] bg-[radial-gradient(ellipse_75%_38%_at_50%_58%,#fbe166_0%,#f8db7c_70%,#f7db7e_100%)]"
  >
    <div class="min-h-full flex flex-col" :style="{ padding: `${u(40)} ${u(38)} ${u(34)}` }">
      <!-- balance + close -->
      <div class="flex items-center justify-between" :style="{ gap: u(20) }">
        <div
          class="flex items-center bg-[#cf8741] border border-[#552a0f] shadow-[inset_0px_-3px_4px_#935324]"
          :style="{
            width: u(476),
            height: u(120),
            borderRadius: u(45),
            padding: `0 ${u(24)}`,
            gap: u(24),
          }"
        >
          <img :src="CoinImage" alt="Coins" class="shrink-0 block" :style="{ width: u(90) }" />
          <span
            class="flex-1 text-center font-extrabold text-white leading-none truncate"
            :style="{ fontSize: u(64), letterSpacing: '0.01em' }"
          >
            {{ num(balance) }}
          </span>
        </div>

        <button
          type="button"
          class="relative shrink-0 flex items-center justify-center active:translate-y-px"
          :style="{ width: u(120), height: u(120) }"
          aria-label="Close"
          @click="close"
        >
          <img :src="RoundButton" alt="" class="absolute inset-0 w-full h-full" />
          <svg
            class="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
            :style="{ width: u(56) }"
            viewBox="0 0 56 56"
            fill="none"
            stroke="#fff"
            stroke-width="13"
            stroke-linecap="round"
            aria-hidden="true"
          >
            <path d="M9 9 47 47M47 9 9 47" />
          </svg>
        </button>
      </div>

      <!-- rate -->
      <div
        class="text-center font-bold text-[#552a0f]"
        :style="{ marginTop: u(56), fontSize: u(40) }"
      >
        <p class="leading-tight">Coin rate:</p>
        <p
          class="flex items-center justify-center leading-tight"
          :style="{ gap: u(14), marginTop: u(4) }"
        >
          <img :src="CoinImage" alt="" :style="{ width: u(58) }" />
          {{ num(coinsPerTon) }} coins =
          <img :src="TonImage" alt="" class="rounded-full" :style="{ width: u(58) }" />
          1 TON
        </p>
      </div>

      <!-- amount -->
      <label
        class="relative block bg-[#fde7b8] border-[#cf8741] cursor-text"
        :style="{
          marginTop: u(70),
          height: u(151),
          boxShadow: cardShadow,
          borderWidth: u(5),
          borderStyle: 'solid',
          borderRadius: u(45),
        }"
      >
        <span
          class="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black bg-gradient-to-b from-[#ea3226] to-[#cb151e] font-bold text-white leading-none flex items-center justify-center"
          :style="{
            top: u(-47),
            height: u(65),
            padding: `0 ${u(26)}`,
            fontSize: u(38),
            letterSpacing: '0.01em',
          }"
        >
          Enter the amount of coins
        </span>
        <input
          :value="amountText"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          placeholder="0.00"
          class="absolute inset-x-0 w-full bg-transparent text-center font-extrabold text-[#552a0f]/70 placeholder:text-[#552a0f]/70 outline-none"
          :style="{ top: u(34), fontSize: u(40), padding: `0 ${u(40)}` }"
          @input="onAmountInput"
        />
        <span
          class="absolute h-px bg-[#cf8741]/60"
          :style="{ left: u(27), right: u(27), top: u(110) }"
        />
      </label>

      <!-- address -->
      <label
        class="relative block bg-[#fde7b8] border-[#cf8741] cursor-text"
        :style="{
          marginTop: u(75),
          height: u(151),
          boxShadow: cardShadow,
          borderWidth: u(5),
          borderStyle: 'solid',
          borderRadius: u(45),
        }"
      >
        <span
          class="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-black bg-gradient-to-b from-[#ea3226] to-[#cb151e] font-bold text-white leading-none flex items-center justify-center"
          :style="{
            top: u(-47),
            height: u(65),
            padding: `0 ${u(26)}`,
            fontSize: u(38),
            letterSpacing: '0.01em',
          }"
        >
          Enter the TON address
        </span>
        <input
          v-model="address"
          type="text"
          autocomplete="off"
          autocapitalize="off"
          spellcheck="false"
          placeholder="UQA..."
          class="absolute inset-x-0 w-full bg-transparent text-center font-extrabold text-[#552a0f]/70 placeholder:text-[#552a0f]/70 outline-none truncate"
          :style="{ top: u(34), fontSize: u(40), padding: `0 ${u(40)}` }"
        />
        <span
          class="absolute h-px bg-[#cf8741]/60"
          :style="{ left: u(27), right: u(27), top: u(110) }"
        />
      </label>

      <div class="flex-1" :style="{ minHeight: u(60) }" />

      <!-- summary -->
      <div
        class="flex items-center justify-between font-extrabold text-[#552a0f]"
        :style="{ fontSize: u(24), letterSpacing: '0.01em', padding: `0 ${u(12)}`, gap: u(12) }"
      >
        <span>Blockchain fee: {{ ton(info.withdrawalFeeTon) }} TON</span>
        <span>You will receive: {{ ton(receive) }} TON</span>
      </div>

      <!-- withdraw -->
      <button
        type="button"
        class="self-center bg-[#5edf3d] border border-[#552a0f] text-white font-bold shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
        :style="{
          marginTop: u(14),
          width: u(500),
          height: u(120),
          borderRadius: u(50),
          fontSize: u(64),
          letterSpacing: '0.01em',
        }"
        :disabled="submitting"
        @click="submit"
      >
        {{ submitting ? 'Sending…' : 'Withdraw' }}
      </button>

      <RouterLink
        to="/withdraw/history"
        class="self-center flex items-center font-extrabold text-[#552a0f]"
        :style="{ marginTop: u(14), gap: u(10), fontSize: u(24), letterSpacing: '0.01em' }"
      >
        <img :src="ClockIcon" alt="" :style="{ width: u(33) }" />
        Transaction History
      </RouterLink>
    </div>
  </div>
</template>
