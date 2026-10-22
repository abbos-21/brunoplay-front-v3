<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { WalletImage } from '@/assets/images'
import { RoundButton } from '@/assets/svgs/wallet'
import * as walletApi from '@/api/wallet'
import type { Withdrawal, WithdrawalStatus } from '@/types'

const router = useRouter()

/** design px (776px wide frame) → container-width units */
const u = (px: number) => `${((px / 776) * 100).toFixed(4)}cqw`

// the design's inset shadow, scaled with the page width
const cardShadow = `0px 4px 4px rgba(0,0,0,0.25), inset 0px 0px ${u(10)} ${u(4)} rgba(0,0,0,0.25)`

const items = ref<Withdrawal[]>([])
const page = ref(0)
const totalPages = ref(1)
const loading = ref(false)

async function loadMore() {
  if (loading.value || page.value >= totalPages.value) return
  loading.value = true
  try {
    const data = await walletApi.getWithdrawalHistory(page.value + 1)
    items.value.push(...data.data)
    page.value = data.page
    totalPages.value = data.totalPages
  } catch {
    // keep what we already have
  } finally {
    loading.value = false
  }
}
onMounted(loadMore)

function onScroll(e: Event) {
  const t = e.target as HTMLElement
  if (t.scrollTop + t.clientHeight >= t.scrollHeight - 160) loadMore()
}

const pad = (n: number) => String(n).padStart(2, '0')
const short = (a: string) => (a.length > 12 ? `${a.slice(0, 4)}...${a.slice(-4)}` : a)
const ton = (n: number) => String(Number(n.toFixed(4)))

const STATUS: Record<WithdrawalStatus, string> = {
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  COMPLETED: '',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
}

const rows = computed(() =>
  items.value.map((w) => {
    const d = new Date(w.createdAt)
    const date = Number.isNaN(d.getTime())
      ? ''
      : `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}, ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
    return {
      id: w.id,
      address: short(w.targetAddress),
      date,
      amount: ton(w.amountTon),
      status: STATUS[w.status] ?? '',
    }
  }),
)

function back() {
  if (window.history.length > 1) router.back()
  else router.push('/withdraw')
}
</script>

<template>
  <div
    class="w-full h-full flex flex-col [container-type:inline-size] bg-[#f9dc7a] bg-[radial-gradient(ellipse_75%_38%_at_50%_58%,#fbe166_0%,#f8db7c_70%,#f7db7e_100%)]"
  >
    <!-- header -->
    <div
      class="shrink-0 flex items-center"
      :style="{ padding: `${u(40)} ${u(38)} ${u(16)} ${u(41)}`, gap: u(40) }"
    >
      <button
        type="button"
        class="relative shrink-0 flex items-center justify-center active:translate-y-px"
        :style="{ width: u(120), height: u(120) }"
        aria-label="Back"
        @click="back"
      >
        <img :src="RoundButton" alt="" class="absolute inset-0 w-full h-full" />
        <svg
          class="relative drop-shadow-[0_3px_4px_rgba(0,0,0,0.25)]"
          :style="{ width: u(64) }"
          viewBox="0 0 64 46"
          fill="none"
          stroke="#fff"
          stroke-width="11"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M60 23H8M26 6 8 23l18 17" />
        </svg>
      </button>
      <h1
        class="flex-1 text-center font-bold text-[#552a0f] leading-tight"
        :style="{ fontSize: u(48), letterSpacing: '0.01em' }"
      >
        Transaction History
      </h1>
    </div>

    <!-- notice + list -->
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      :style="{ padding: `${u(4)} ${u(38)} ${u(40)}` }"
      @scroll.passive="onScroll"
    >
      <div
        class="bg-[#fde7b8] border-[#cf8741]"
        :style="{
          borderWidth: u(15),
          boxShadow: cardShadow,
          borderStyle: 'solid',
          borderRadius: u(45),
          padding: `${u(8)} ${u(14)}`,
        }"
      >
        <p
          class="font-bold text-[#890d00]"
          :style="{ fontSize: u(28), lineHeight: u(35), letterSpacing: '0.01em' }"
        >
          The withdrawal processing time is up to 48 hours.
        </p>
        <p
          class="font-bold text-[#890d00]"
          :style="{ fontSize: u(28), lineHeight: u(35), letterSpacing: '0.01em', marginTop: u(35) }"
        >
          Share your payout in our chat, and celebrate your success with other players.
        </p>
      </div>

      <ul class="flex flex-col" :style="{ marginTop: u(40), gap: u(20) }">
        <li
          v-for="r in rows"
          :key="r.id"
          class="relative flex items-center bg-[#cf8741] border border-[#552a0f] shadow-[inset_0px_-3px_4px_#935324] text-white"
          :style="{
            minHeight: u(130),
            borderRadius: u(30),
            padding: `${u(12)} ${u(26)} ${u(12)} ${u(20)}`,
            gap: u(24),
          }"
        >
          <img :src="WalletImage" alt="" class="shrink-0 block" :style="{ width: u(44) }" />

          <div
            class="flex-1 min-w-0 font-extrabold leading-snug"
            :style="{ fontSize: u(24), letterSpacing: '0.01em' }"
          >
            <p>TON withdrawal to</p>
            <p class="truncate">{{ r.address }}</p>
            <p>{{ r.date }}</p>
          </div>

          <div
            class="shrink-0 text-center font-extrabold leading-tight"
            :style="{ fontSize: u(32), letterSpacing: '0.01em', minWidth: u(90) }"
          >
            <p>- {{ r.amount }}</p>
            <p>TON</p>
            <p v-if="r.status" class="font-bold text-white/80" :style="{ fontSize: u(20) }">
              {{ r.status }}
            </p>
          </div>
        </li>
      </ul>

      <p
        v-if="!rows.length && !loading"
        class="text-center font-bold text-[#552a0f]/70"
        :style="{ marginTop: u(60), fontSize: u(34) }"
      >
        No withdrawals yet
      </p>
      <p
        v-if="loading"
        class="text-center font-bold text-[#552a0f]/70"
        :style="{ marginTop: u(24), fontSize: u(28) }"
      >
        Loading…
      </p>
    </div>
  </div>
</template>
