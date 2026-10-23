<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import WalletIcon from '@/components/WalletIcon.vue'
import { ArrowLeftSVG } from '@/assets/svgs'
import * as walletApi from '@/api/wallet'
import type { Withdrawal, WithdrawalStatus } from '@/types'

const router = useRouter()

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

const STATUS: Record<WithdrawalStatus, { label: string; chip: string }> = {
  PENDING: { label: 'Pending', chip: 'bg-[#ffe9b0] text-[#8a5a00] border-[#e8c25a]' },
  PROCESSING: { label: 'Processing', chip: 'bg-[#d8ecff] text-[#0a5a96] border-[#7fbbe8]' },
  COMPLETED: { label: 'Completed', chip: 'bg-[#e4f7d6] text-[#1f6a05] border-[#74c14e]' },
  FAILED: { label: 'Failed', chip: 'bg-[#ffdcd8] text-[#a01208] border-[#e8877e]' },
  CANCELLED: { label: 'Cancelled', chip: 'bg-[#ece6dc] text-[#6b5a45] border-[#c9bba6]' },
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
      status: STATUS[w.status] ?? { label: w.status, chip: 'bg-[#ece6dc] text-[#6b5a45] border-[#c9bba6]' },
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
    class="w-full h-full flex flex-col bg-[#f9dc7a] bg-[radial-gradient(ellipse_75%_38%_at_50%_58%,#fbe166_0%,#f8db7c_70%,#f7db7e_100%)]"
  >
    <!-- header -->
    <div class="shrink-0 flex items-center gap-3 p-4 pb-4">
      <button
        type="button"
        class="btn-orange shrink-0 size-[clamp(2.8rem,13vw,3.4rem)] p-[0.6rem] rounded-full flex justify-center items-center active:translate-y-px"
        aria-label="Back"
        @click="back"
      >
        <ArrowLeftSVG class="w-full" />
      </button>
      <h1 class="flex-1 text-center font-bold text-[#552a0f] leading-tight text-[length:clamp(1.3rem,6.6vw,1.8rem)] pr-[clamp(2.8rem,13vw,3.4rem)]">
        Transaction history
      </h1>
    </div>

    <!-- notice + list -->
    <div
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      @scroll.passive="onScroll"
    >
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-4 py-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] text-[#552a0f] leading-snug text-[length:clamp(0.78rem,3.8vw,1rem)]">
        <p class="font-bold">Withdrawals are processed within 48 hours.</p>
        <p class="mt-1 text-[#8a5a2b]">Share your payout in our chat and celebrate with other players.</p>
      </div>

      <ul class="mt-4 flex flex-col gap-3">
        <li
          v-for="r in rows"
          :key="r.id"
          class="flex items-center gap-3 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
        >
          <span class="shrink-0 size-[clamp(2.6rem,12.5vw,3.2rem)] rounded-2xl bg-[#fde7b8] border border-[#e3b66f] flex items-center justify-center">
            <WalletIcon class="w-[78%]" />
          </span>

          <div class="flex-1 min-w-0 leading-tight">
            <p class="font-bold text-[#552a0f] text-[length:clamp(0.95rem,4.7vw,1.2rem)]">TON withdrawal</p>
            <p class="truncate text-[#8a5a2b] text-[length:clamp(0.72rem,3.5vw,0.9rem)]">To {{ r.address }}</p>
            <p class="text-[#8a5a2b] text-[length:clamp(0.68rem,3.3vw,0.85rem)]">{{ r.date }}</p>
          </div>

          <div class="shrink-0 flex flex-col items-end gap-1">
            <p class="font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(1rem,5vw,1.3rem)]">−{{ r.amount }} TON</p>
            <span
              class="rounded-full border px-2.5 py-px font-bold leading-tight text-[length:clamp(0.62rem,3vw,0.78rem)]"
              :class="r.status.chip"
            >
              {{ r.status.label }}
            </span>
          </div>
        </li>
      </ul>

      <div v-if="!rows.length && !loading" class="mt-6 rounded-3xl border-2 border-dashed border-[#cf8741] bg-[#fff4d6]/80 px-4 py-6 text-center">
        <p class="font-bold text-[#552a0f] text-[length:clamp(1rem,5vw,1.3rem)]">No withdrawals yet</p>
        <p class="mt-1 text-[#8a5a2b] text-[length:clamp(0.8rem,4vw,1.05rem)]">Your requests will show up here.</p>
      </div>
      <p v-if="loading" class="mt-4 text-center font-bold text-[#552a0f]/70 text-[length:clamp(0.85rem,4.2vw,1.1rem)]">Loading…</p>
    </div>
  </div>
</template>
