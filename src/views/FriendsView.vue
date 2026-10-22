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
      <StarBalance />
      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <!-- Stats -->
    <div class="grid grid-cols-[1.9fr_1fr] gap-3 mt-4">
      <div class="friends-card flex flex-col items-center justify-center px-2 py-3 text-[#552a0f] font-semibold">
        <p class="text-[length:clamp(0.7rem,3.59vw,1.01rem)] leading-tight text-center">Coins earned from referrals:</p>
        <p class="flex items-center gap-2 text-[length:clamp(1rem,5.13vw,1.44rem)] mt-1">
          <img :src="CoinImage" alt="" class="w-[clamp(1.6rem,8.21vw,2.3rem)]" />
          {{ formatNumber(friends.stats?.referralEarnings ?? 0) }} coins
        </p>
      </div>
      <div class="friends-card flex flex-col items-center justify-center px-2 py-3 text-[#552a0f] font-semibold">
        <p class="flex items-center gap-1 text-[length:clamp(1rem,5.13vw,1.44rem)]">
          <img :src="ReferralsImage" alt="" class="h-[clamp(1.6rem,8.21vw,2.3rem)]" />
          {{ friends.stats?.totalReferrals ?? 0 }}
        </p>
        <p class="text-[length:clamp(0.7rem,3.59vw,1.01rem)] leading-tight text-center">Total referrals</p>
      </div>
    </div>

    <!-- List header -->
    <div class="flex items-center justify-between mt-3 mb-2">
      <h1 class="font-bold text-white text-[length:clamp(1.2rem,6.15vw,1.72rem)] tracking-wide [text-shadow:0px_2px_4px_rgba(0,0,0,0.25)]">
        Referrals List:
      </h1>
      <button
        type="button"
        class="px-4 py-1 rounded-[14px] border border-[#7f4b33] bg-[#4c90d0] text-white font-semibold text-[length:clamp(0.8rem,4.1vw,1.15rem)] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_2px_rgba(255,255,255,0.25)]"
        @click="showDetails = !showDetails"
      >
        More Details
      </button>
    </div>

    <div class="flex flex-col gap-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div v-if="showDetails" class="friends-card shrink-0 p-3 text-[#552a0f] font-semibold">
        <p class="text-[length:clamp(0.8rem,4.1vw,1.15rem)] mb-1">Reward per referral level</p>
        <p v-for="tier in friends.rewardTiers" :key="tier.level" class="flex justify-between text-[length:clamp(0.7rem,3.59vw,1.01rem)]">
          <span>Level {{ tier.level }}</span>
          <span>{{ formatNumber(tier.reward) }} coins</span>
        </p>
        <p v-if="!friends.rewardTiers.length" class="text-[length:clamp(0.7rem,3.59vw,1.01rem)]">No reward info yet.</p>
      </div>

      <div v-for="ref in referrals" :key="ref.id" class="friends-card shrink-0 flex items-center gap-3 px-3 py-2">
        <span
          class="size-[clamp(2.4rem,12.3vw,3.45rem)] shrink-0 rounded-full flex items-center justify-center text-white text-[length:clamp(1.2rem,6.15vw,1.72rem)] font-semibold shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
          :style="{ backgroundColor: ref.color }"
        >
          {{ ref.initial }}
        </span>

        <div class="flex-1 min-w-0 text-[#552a0f] font-semibold leading-tight">
          <p class="text-[length:clamp(0.9rem,4.62vw,1.29rem)] truncate">{{ ref.name }}</p>
          <p v-if="ref.username" class="text-[length:clamp(0.6rem,3.08vw,0.862rem)] text-[#552a0f]/60 truncate">{{ ref.username }}</p>
        </div>

        <div class="shrink-0 flex items-center gap-2 text-[#552a0f] font-semibold text-[length:clamp(0.9rem,4.62vw,1.29rem)]">
          <img :src="CoinImage" alt="" class="w-[clamp(1.6rem,8.21vw,2.3rem)]" />
          {{ formatNumber(ref.reward) }} coins
        </div>
      </div>

      <p v-if="!referrals.length" class="text-center text-white font-semibold text-lg mt-6 [text-shadow:0px_2px_4px_rgba(0,0,0,0.5)]">
        No referrals yet — share your link!
      </p>
    </div>

    <!-- Actions -->
    <div class="grid grid-cols-2 gap-4 px-2 pt-3">
      <button
        type="button"
        class="flex items-center justify-center gap-2 h-[clamp(2.2rem,11.3vw,3.16rem)] rounded-full border border-[#9bb6ff] bg-gradient-to-r from-[#6a89fd] to-[#546dfe] text-white font-semibold text-[length:clamp(0.9rem,4.62vw,1.29rem)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_2px_rgba(255,255,255,0.25),inset_0px_-4px_2px_rgba(0,0,0,0.25)]"
        @click="copyLink"
      >
        <span class="relative w-5 h-5 shrink-0" aria-hidden="true">
          <span class="absolute left-0 top-0 w-3.5 h-3.5 rounded-[4px] bg-white shadow-[0px_4px_4px_rgba(0,0,0,0.25)]" />
          <span class="absolute right-0 bottom-0 w-3.5 h-3.5 rounded-[4px] bg-white border-[1.5px] border-[#6380fd] shadow-[0px_4px_4px_rgba(0,0,0,0.25)]" />
        </span>
        Copy link
      </button>
      <button
        type="button"
        class="flex items-center justify-center gap-2 h-[clamp(2.2rem,11.3vw,3.16rem)] rounded-full border border-[#0b3715] bg-gradient-to-r from-[#0abf88] to-[#22b615] text-white font-semibold text-[length:clamp(0.9rem,4.62vw,1.29rem)] [text-shadow:0px_4px_4px_rgba(0,0,0,0.25)] shadow-[inset_0px_4px_2px_rgba(255,255,255,0.25),inset_0px_-4px_2px_rgba(0,0,0,0.25)]"
        @click="shareLink"
      >
        <img :src="TelegramImage" alt="" class="w-6 h-5 object-contain object-bottom shrink-0" />
        Share link
      </button>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>

<style scoped>
.friends-card {
  background: #fde7b8;
  border: 1px solid #c17e23;
  border-radius: 20px;
  box-shadow:
    0 4px 4px rgba(0, 0, 0, 0.25),
    inset 0 4px 4px rgba(255, 255, 255, 0.25),
    inset 0 -4px 4px rgba(0, 0, 0, 0.25);
}
</style>
