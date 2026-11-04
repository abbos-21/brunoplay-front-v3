<script setup lang="ts">
import { t } from '@/i18n'
import { computed, onMounted, ref } from 'vue'
import AnimatedNumber from '@/components/AnimatedNumber.vue'
import CloseButton from '@/components/CloseButton.vue'
import { StarIcon } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import { apiMessage } from '@/composables/apiError'
import { getStarWithdrawalInfo, getStarWithdrawals, createStarWithdrawal } from '@/api/games'
import { useToast } from '@/composables/useToast'
import { useGoBack } from '@/composables/useGoBack'
import type { StarWdInfo, StarWithdrawal } from '@/types'

const auth = useAuthStore()
const toast = useToast()

// used until the API answers (or when it is switched off in dev mode)
const info = ref<StarWdInfo>({ minStars: 100, balance: 0, notice: '', canWithdraw: true, minLevel: 1 })
const history = ref<StarWithdrawal[]>([])

async function reload() {
  info.value = await getStarWithdrawalInfo()
  history.value = await getStarWithdrawals()
}
onMounted(() => {
  reload().catch(() => {})
})

const num = (n: number) => n.toLocaleString('en-US')
const stars = computed(() => auth.user?.starsBalance ?? 0)

const amountText = ref('')
const submitting = ref(false)
const amount = computed(() => Number(amountText.value) || 0)

function setMax() {
  amountText.value = stars.value > 0 ? String(Math.floor(stars.value)) : ''
}

function onAmountInput(e: Event) {
  const el = e.target as HTMLInputElement
  const digits = el.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 12)
  amountText.value = digits
  el.value = digits
}

/** why a request cannot be made right now (the server decides; shown instead of letting the player try) */
const blockedText = computed(() => {
  const i = info.value
  if (i.canWithdraw) return ''
  switch (i.blockedReason) {
    case 'WITHDRAWAL_ALREADY_OPEN': return t('You already have a withdrawal in progress')
    case 'WITHDRAWAL_LEVEL_TOO_LOW': return t('Reach level {level} to withdraw', { level: i.minLevel })
    case 'WITHDRAWAL_ACCOUNT_TOO_NEW': return t('Your account is too new to withdraw')
    case 'UNDER_REVIEW': return t('Withdrawals are on review for your account')
    default: return t('Withdrawals are not available right now')
  }
})

function validate(): string | null {
  if (!amount.value) return t('Enter the amount of stars')
  if (amount.value < info.value.minStars) return t('Minimum withdrawal is {n} stars', { n: num(info.value.minStars) })
  if (auth.user && amount.value > stars.value) return t('Not enough stars')
  return null
}

async function submit() {
  if (submitting.value) return
  if (blockedText.value) {
    toast.show(blockedText.value, 'warning')
    return
  }
  const problem = validate()
  if (problem) {
    toast.show(problem, 'warning')
    return
  }
  submitting.value = true
  try {
    const r = await createStarWithdrawal(amount.value)
    auth.updateUser({ starsBalance: r.newBalance })
    toast.show(t('Withdrawal requested'), 'success')
    amountText.value = ''
  } catch (e) {
    toast.show(apiMessage(e, 'Withdrawal failed, please try again'), 'error')
  } finally {
    submitting.value = false
    reload().catch(() => {})
    auth.fetchUser().catch(() => {})
  }
}

const pad = (n: number) => String(n).padStart(2, '0')
const dateText = (iso: string) => {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const STATUS: Record<string, { label: string; chip: string }> = {
  PENDING: { label: 'Pending', chip: 'bg-[#ffe9b0] text-[#8a5a00] border-[#e8c25a]' },
  DELIVERED: { label: 'Delivered', chip: 'bg-[#e4f7d6] text-[#1f6a05] border-[#74c14e]' },
  CANCELLED: { label: 'Cancelled', chip: 'bg-[#ece6dc] text-[#6b5a45] border-[#c9bba6]' },
}
const rows = computed(() =>
  history.value.map((w) => ({
    ...w,
    date: dateText(w.createdAt),
    status: STATUS[w.status] ?? { label: w.status, chip: 'bg-[#ece6dc] text-[#6b5a45] border-[#c9bba6]' },
  })),
)

const close = useGoBack('/withdraw')
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

      <h1 class="text-center font-bold text-[#552a0f] text-[length:clamp(1.5rem,8vw,2.1rem)] leading-none">{{ $t('Withdraw stars') }}</h1>

      <p class="text-center text-[#8a5a2b] text-[length:clamp(0.8rem,3.9vw,1rem)]">
        {{ $t('You get real Telegram Stars on your Telegram account.') }}
        <template v-if="info.notice"> {{ info.notice }}</template>
      </p>

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

      <p v-if="blockedText" class="text-center font-bold text-[#890d00] text-[length:clamp(0.85rem,4.2vw,1.05rem)]">{{ blockedText }}</p>
      <button
        type="button"
        class="w-full rounded-full border border-[#552a0f] bg-[#5edf3d] py-2.5 font-bold text-white text-[length:clamp(1.3rem,6.6vw,1.8rem)] shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] active:translate-y-px disabled:opacity-60"
        :disabled="submitting || !!blockedText"
        @click="submit"
      >
        {{ submitting ? $t('Sending…') : $t('Withdraw') }}
      </button>

      <!-- history -->
      <h2 v-if="rows.length" class="mt-2 text-center font-bold text-[#552a0f] text-[length:clamp(1.1rem,5.6vw,1.5rem)] leading-none">{{ $t('Transaction history') }}</h2>
      <ul v-if="rows.length" class="flex flex-col gap-2">
        <li v-for="w in rows" :key="w.id" class="rounded-2xl border-2 border-[#cf8741] bg-[#fff4d6] px-3 py-2 shadow-[0px_3px_3px_rgba(0,0,0,0.2)]">
          <div class="flex items-center justify-between gap-2">
            <span class="flex items-center gap-1.5 font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(1rem,5.2vw,1.35rem)]">
              <img decoding="async" loading="lazy" :src="StarIcon" alt="" class="w-[1.3em]" />
              {{ num(w.stars) }}
            </span>
            <span class="rounded-full border px-2.5 py-px font-bold text-[length:clamp(0.7rem,3.4vw,0.85rem)]" :class="w.status.chip">{{ $t(w.status.label) }}</span>
          </div>
          <p class="text-[#8a5a2b] text-[length:clamp(0.7rem,3.4vw,0.85rem)]">{{ w.date }}</p>
          <p v-if="w.rejectReason" class="text-[#890d00] text-[length:clamp(0.75rem,3.6vw,0.9rem)]">{{ w.rejectReason }}</p>
        </li>
      </ul>
    </div>
  </div>
</template>
