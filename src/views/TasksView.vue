<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { ChevronLeftSVG } from '@/assets/svgs'
import { CoinImage, TaskChannel, TaskChat, TaskPayouts, TaskSupport, TaskFriends } from '@/assets/images'
import { useTasksStore } from '@/stores/tasks'
import { getTelegram } from '@/composables/useTelegram'
import type { Task } from '@/types'

const isMenuOpen = ref(false)
const tab = ref<'main' | 'others'>('main')
const tasks = useTasksStore()
const openId = ref<number | null>(null)

const fallbackMain: Task[] = [
  { id: -1, category: 'MAIN', type: 'CHANNEL_JOIN', title: 'Join the BrunoPlay channel', description: 'You just need to subscribe to the BrunoPlay channel.', channelUsername: null, requiredInvites: null, rewardCoins: 50, isActive: true, sortOrder: 1, isCompleted: false },
  { id: -2, category: 'MAIN', type: 'CHANNEL_JOIN', title: 'Join the BrunoPlay chat', description: 'You just need to join the BrunoPlay chat.', channelUsername: null, requiredInvites: null, rewardCoins: 50, isActive: true, sortOrder: 2, isCompleted: false },
  { id: -3, category: 'MAIN', type: 'CHANNEL_JOIN', title: 'Join the BrunoPlay payouts channel', description: 'You just need to subscribe to the BrunoPlay payouts channel.', channelUsername: null, requiredInvites: null, rewardCoins: 50, isActive: true, sortOrder: 3, isCompleted: false },
  { id: -4, category: 'MAIN', type: 'CHANNEL_JOIN', title: 'Support the BrunoPlay channel', description: 'Support the BrunoPlay channel with a boost.', channelUsername: null, requiredInvites: null, rewardCoins: 100, isActive: true, sortOrder: 4, isCompleted: false },
  { id: -5, category: 'MAIN', type: 'INVITE_FRIENDS', title: 'Invite 5 friends', description: 'Invite 5 friends to BrunoPlay.', channelUsername: null, requiredInvites: 5, rewardCoins: 200, isActive: true, sortOrder: 5, isCompleted: false },
  { id: -6, category: 'MAIN', type: 'INVITE_FRIENDS', title: 'Invite 10 friends', description: 'Invite 10 friends to BrunoPlay.', channelUsername: null, requiredInvites: 10, rewardCoins: 500, isActive: true, sortOrder: 6, isCompleted: false },
]

onMounted(async () => {
  try {
    await tasks.fetchTasks()
  } catch {
    // keep placeholder list when the API is unavailable
  }
  openId.value = list.value[0]?.id ?? null
})

const list = computed(() => {
  if (tab.value === 'others') return tasks.otherTasks
  return tasks.mainTasks.length ? tasks.mainTasks : fallbackMain
})

function imageFor(task: Task) {
  if (task.type === 'INVITE_FRIENDS') return TaskFriends
  const t = task.title.toLowerCase()
  if (t.includes('payout')) return TaskPayouts
  if (t.includes('chat')) return TaskChat
  if (t.includes('support')) return TaskSupport
  return TaskChannel
}

function toggle(id: number) {
  openId.value = openId.value === id ? null : id
}

function complete(task: Task) {
  if (!task.channelUsername) return
  const url = `https://t.me/${task.channelUsername.replace(/^@/, '')}`
  const tg = getTelegram()
  if (tg) tg.openTelegramLink(url)
  else window.open(url, '_blank')
}

async function check(task: Task) {
  if (task.id < 0) return
  try {
    await tasks.checkTask(task.id)
  } catch {
    // errors are surfaced by the API client
  }
}

const tabBase =
  'border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px]'
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <StarBalance />
      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-[length:clamp(0.8rem,4.1vw,1.15rem)]">
      <button
        type="button"
        :class="[tabBase, tab === 'main' ? 'bg-[#c17e23] text-white' : 'bg-[#fde7b8] text-[#552a0f]']"
        @click="tab = 'main'"
      >
        Main
      </button>
      <button
        type="button"
        :class="[tabBase, tab === 'others' ? 'bg-[#c17e23] text-white' : 'bg-[#fde7b8] text-[#552a0f]']"
        @click="tab = 'others'"
      >
        Others
      </button>
    </div>

    <div class="flex flex-col gap-2 mt-3 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div
        v-for="task in list"
        :key="task.id"
        class="shrink-0 bg-[#fde7b8] border border-[#c17e23] rounded-[20px] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] px-2 py-2"
      >
        <button type="button" class="w-full flex items-center gap-3" @click="toggle(task.id)">
          <span class="size-[clamp(2.8rem,14.4vw,4.02rem)] shrink-0 rounded-[18px] bg-[#fbe166] flex items-center justify-center">
            <img :src="imageFor(task)" :alt="task.title" class="w-[90%] h-[90%] rounded-full object-cover shadow-[0px_4px_4px_rgba(0,0,0,0.25)]" />
          </span>

          <span class="flex-1 min-w-0 text-left font-bold text-[#552a0f] text-[length:clamp(0.8rem,4.1vw,1.15rem)] leading-snug">
            {{ task.title }}
          </span>

          <span class="shrink-0 flex items-center gap-1 bg-[#ffac33] rounded-full pl-0.5 pr-3 py-0.5 font-extrabold text-[#552a0f] text-[length:clamp(0.9rem,4.62vw,1.29rem)]">
            <img :src="CoinImage" alt="" class="w-6 h-6" />
            {{ task.rewardCoins }}
          </span>

          <ChevronLeftSVG
            class="w-2.5 shrink-0 transition-transform"
            :class="openId === task.id ? '-rotate-90' : 'rotate-90'"
          />
        </button>

        <div v-if="openId === task.id" class="mt-2 border-t border-[#c17e23]/40 pt-1">
          <p class="text-[length:clamp(0.6rem,3.08vw,0.862rem)] font-bold text-[#552a0f]/70">{{ task.description }}</p>
          <div class="grid grid-cols-2 gap-3 mt-2">
            <button
              type="button"
              class="h-9 rounded-full bg-[#0e89d4] text-white font-bold text-lg shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)]"
              @click="complete(task)"
            >
              Complete
            </button>
            <button
              type="button"
              :disabled="tasks.isLoading || task.isCompleted"
              class="h-9 rounded-full bg-[#1fb826] text-[#fff8f3] font-bold text-lg shadow-[inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] disabled:opacity-60"
              @click="check(task)"
            >
              Check
            </button>
          </div>
        </div>
      </div>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>
