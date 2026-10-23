<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { CoinImage, TelegramImage, ReferralsImage } from '@/assets/images'
import { useFriendsStore } from '@/stores/friends'
import { useToast } from '@/composables/useToast'
import { useFormatters } from '@/composables/useFormatters'
import { getTelegram } from '@/composables/useTelegram'

const isMenuOpen = ref(false)
const showDetails = ref(false)
const friends = useFriendsStore()
const toast = useToast()
const { formatNumber } = useFormatters()

onMounted(() => {
  friends.init().catch(() => {})
})

const avatarColors = ['#2f9bff', '#ff3d77', '#ffa530', '#22b615', '#8a5cff']

const referrals = computed(() =>
  friends.friends.map((f) => {
    const name = f.firstName || f.username || '?'
    return {
      id: f.id,
      name,
      username: f.username,
      initial: name.charAt(0).toUpperCase(),
      color: avatarColors[f.id % avatarColors.length],
      reward: friends.rewardTiers.find((t) => t.level === f.level)?.reward ?? 0,
    }
  }),
)

async function copyLink() {
  if (!friends.inviteLink) return
  try {
    await navigator.clipboard.writeText(friends.inviteLink)
    toast.show('Link copied', 'success')
  } catch {
    toast.show('Could not copy the link', 'error')
  }
}

function shareLink() {
  if (!friends.inviteLink) return
  const url = `https://t.me/share/url?url=${encodeURIComponent(friends.inviteLink)}`
  const tg = getTelegram()
  if (tg) tg.openTelegramLink(url)
  else window.open(url, '_blank')
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

    <!-- numbers -->
    <div class="grid grid-cols-2 gap-3 mt-4">
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-3 py-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <p class="text-[#8a5a2b] font-bold uppercase tracking-wide text-[length:clamp(0.62rem,3vw,0.78rem)]">Earned from friends</p>
        <p class="mt-1 flex items-center gap-1.5 font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(1.1rem,5.8vw,1.6rem)]">
          <img :src="CoinImage" alt="" class="w-[1.3em]" />
          {{ formatNumber(friends.stats?.referralEarnings ?? 0) }}
        </p>
      </div>
      <div class="rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-3 py-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <p class="text-[#8a5a2b] font-bold uppercase tracking-wide text-[length:clamp(0.62rem,3vw,0.78rem)]">Friends invited</p>
        <p class="mt-1 flex items-center gap-1.5 font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(1.1rem,5.8vw,1.6rem)]">
          <img :src="ReferralsImage" alt="" class="h-[1.3em]" />
          {{ friends.stats?.totalReferrals ?? 0 }}
        </p>
      </div>
    </div>

    <!-- list header -->
    <div class="flex items-center justify-between mt-4 mb-2 px-1">
      <h1 class="font-bold text-white text-[length:clamp(1.15rem,5.9vw,1.6rem)] [text-shadow:0px_2px_4px_rgba(0,0,0,0.35)]">Your friends</h1>
      <button
        type="button"
        class="rounded-full border border-[#b9722a] bg-[#fff4d6] px-4 py-0.5 font-bold text-[#552a0f] text-[length:clamp(0.8rem,4vw,1.05rem)] shadow-[0px_3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
        @click="showDetails = !showDetails"
      >
        {{ showDetails ? 'Hide rewards' : 'Rewards' }}
      </button>
    </div>

    <div class="flex flex-col gap-2.5 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <!-- what a friend of each level pays -->
      <div v-if="showDetails" class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
        <p class="font-bold text-[#552a0f] text-[length:clamp(0.95rem,4.8vw,1.25rem)]">You get coins when a friend levels up</p>
        <div class="mt-2 flex flex-col gap-1">
          <div
            v-for="tier in friends.rewardTiers"
            :key="tier.level"
            class="flex items-center justify-between rounded-xl bg-[#fde7b8] px-3 py-1 text-[#552a0f] text-[length:clamp(0.8rem,4vw,1.05rem)]"
          >
            <span class="font-bold">Friend reaches level {{ tier.level }}</span>
            <span class="flex items-center gap-1 font-extrabold tabular-nums">
              <img :src="CoinImage" alt="" class="w-[1.2em]" />
              {{ formatNumber(tier.reward) }}
            </span>
          </div>
        </div>
        <p v-if="!friends.rewardTiers.length" class="mt-1 text-[#8a5a2b] text-[length:clamp(0.8rem,4vw,1.05rem)]">No reward info yet.</p>
      </div>

      <div
        v-for="ref in referrals"
        :key="ref.id"
        class="shrink-0 flex items-center gap-3 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-2.5 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
      >
        <span
          class="size-[clamp(2.6rem,12.5vw,3.3rem)] shrink-0 rounded-full flex items-center justify-center text-white font-bold text-[length:clamp(1.1rem,5.6vw,1.5rem)]"
          :style="{ backgroundColor: ref.color }"
        >
          {{ ref.initial }}
        </span>

        <div class="flex-1 min-w-0 leading-tight">
          <p class="font-bold text-[#552a0f] truncate text-[length:clamp(0.95rem,4.8vw,1.25rem)]">{{ ref.name }}</p>
          <p v-if="ref.username" class="text-[#8a5a2b] truncate text-[length:clamp(0.7rem,3.4vw,0.9rem)]">@{{ ref.username.replace(/^@/, '') }}</p>
        </div>

        <span class="shrink-0 flex items-center gap-1 rounded-full bg-[#fde7b8] border border-[#e3b66f] pl-1 pr-3 py-0.5 font-extrabold text-[#552a0f] tabular-nums text-[length:clamp(0.9rem,4.5vw,1.2rem)]">
          <img :src="CoinImage" alt="" class="w-[1.4em]" />
          +{{ formatNumber(ref.reward) }}
        </span>
      </div>

      <div v-if="!referrals.length" class="shrink-0 rounded-3xl border-2 border-dashed border-[#cf8741] bg-[#fff4d6]/80 px-4 py-6 text-center">
        <p class="font-bold text-[#552a0f] text-[length:clamp(1rem,5vw,1.3rem)]">No friends yet</p>
        <p class="mt-1 text-[#8a5a2b] text-[length:clamp(0.8rem,4vw,1.05rem)]">Share your link and earn coins when they join.</p>
      </div>
    </div>

    <!-- invite -->
    <div class="grid grid-cols-2 gap-3 px-1 pt-3">
      <button
        type="button"
        class="h-[clamp(2.4rem,11.5vw,3rem)] rounded-full border border-[#b9722a] bg-[#fff4d6] flex items-center justify-center gap-2 font-bold text-[#552a0f] text-[length:clamp(0.95rem,4.8vw,1.25rem)] shadow-[0px_3px_3px_rgba(0,0,0,0.25)] active:translate-y-px"
        @click="copyLink"
      >
        <svg class="size-8 shrink-0" viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round" aria-hidden="true">
          <path d="M18 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
          <rect x="10" y="10" width="14" height="14" rx="2.5" fill="#fff4d6" />
        </svg>
        Copy link
      </button>
      <button
        type="button"
        class="h-[clamp(2.4rem,11.5vw,3rem)] rounded-full border border-[#15861b] bg-[#1fb826] flex items-center justify-center gap-2 font-bold text-white text-[length:clamp(0.95rem,4.8vw,1.25rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
        @click="shareLink"
      >
        <img :src="TelegramImage" alt="" class="size-8 object-contain shrink-0" />
        Invite friends
      </button>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
