<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import CoinBalance from '@/components/CoinBalance.vue'
import StarBalance from '@/components/StarBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import SlidePanel from '@/components/SlidePanel.vue'
import { CoinImage, TaskChannel, TaskChat, TaskPayouts, TaskSupport, TaskFriends } from '@/assets/images'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'
import { useTasksStore } from '@/stores/tasks'
import { getTelegram } from '@/composables/useTelegram'
import { useTaskAlerts } from '@/composables/useTaskAlerts'
import PendingDot from '@/components/PendingDot.vue'
import type { Task } from '@/types'

const isMenuOpen = ref(false)
const tab = ref<'main' | 'others'>('main')
const tasks = useTasksStore()
const toast = useToast()
const router = useRouter()
const alerts = useTaskAlerts()
// tasks that were not here the last time the player looked (shown with a NEW tag until they leave)
const newIds = ref<number[]>([])

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
  // everything unfinished that was not seen before is NEW; from now on it counts as seen (the tab badge goes away)
  const pending = [...mainList(), ...otherList()].filter((t) => !t.isCompleted).map((t) => t.id)
  newIds.value = pending.filter((id) => !alerts.isSeen(id))
  // only Main is on screen now: Others counts as seen when it is opened
  alerts.markSeen(mainList().filter((t) => !t.isCompleted).map((t) => t.id))
})

const mainList = () => (tasks.mainTasks.length ? tasks.mainTasks : fallbackMain)
const otherList = () => tasks.otherTasks

// which tab still has tasks the player has not seen (and has not opened yet)
const opened = ref<Set<string>>(new Set(['main']))
const othersHasNew = computed(
  () => !opened.value.has('others') && otherList().some((t) => newIds.value.includes(t.id) && !t.isCompleted),
)

function openTab(next: 'main' | 'others') {
  tab.value = next
  opened.value = new Set([...opened.value, next])
  if (next === 'others') alerts.markSeen(otherList().filter((t) => !t.isCompleted).map((t) => t.id))
}

const list = computed(() => {
  if (tab.value === 'others') return otherList()
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

function complete(task: Task) {
  if (task.type === 'INVITE_FRIENDS') return router.push('/friends')
  if (!task.channelUsername) return
  const url = `https://t.me/${task.channelUsername.replace(/^@/, '')}`
  const tg = getTelegram()
  if (tg) tg.openTelegramLink(url)
  else window.open(url, '_blank')
}

async function check(task: Task) {
  if (task.id < 0) return
  try {
    const r = await tasks.checkTask(task.id)
    if (r.completed && r.reward > 0) toast.show(`Done! You got ${r.reward} coins`, 'success')
    else if (r.completed) toast.show('Already completed', 'info')
    else toast.show(r.error || 'Not done yet', 'warning')
  } catch (e) {
    toast.show(apiMessage(e, 'Could not check the task'), 'error')
  }
}

const tabBase =
  'relative border border-[#c17e23] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_4px_4px_rgba(255,255,255,0.25),inset_0px_-4px_4px_rgba(0,0,0,0.25)] rounded-2xl flex justify-center items-center font-bold py-[5px]'
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

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-[length:clamp(0.8rem,4.1vw,1.15rem)]">
      <button
        type="button"
        :class="[tabBase, tab === 'main' ? 'bg-[#c17e23] text-white' : 'bg-[#fde7b8] text-[#552a0f]']"
        @click="openTab('main')"
      >
        Main
      </button>
      <button
        type="button"
        :class="[tabBase, tab === 'others' ? 'bg-[#c17e23] text-white' : 'bg-[#fde7b8] text-[#552a0f]']"
        @click="openTab('others')"
      >
        Others
        <Transition name="dot"><PendingDot v-if="othersHasNew" /></Transition>
      </button>
    </div>

    <div class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <p v-if="!list.length" class="text-center font-bold text-[#552a0f] mt-8">No tasks here yet</p>

      <article
        v-for="task in list"
        :key="task.id"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
        :class="{ 'opacity-80': task.isCompleted, 'new-card': newIds.includes(task.id) && !task.isCompleted }"
      >
        <div class="flex items-center gap-3">
          <div
            class="shrink-0 size-[clamp(3.5rem,17vw,4.5rem)] rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#fff6bf,#fbe166_75%)] border border-[#cf8741] flex items-center justify-center"
          >
            <img :src="imageFor(task)" :alt="task.title" class="w-[82%] h-[82%] rounded-full object-cover" />
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1rem,5vw,1.3rem)]">
              <span
                v-if="newIds.includes(task.id) && !task.isCompleted"
                class="new-tag mr-1.5 inline-block align-middle rounded-full bg-[linear-gradient(180deg,#ff5a4f,#d0170c)] border border-white px-2 py-px text-[0.65rem] font-extrabold uppercase leading-tight tracking-wide text-white shadow-[0px_2px_3px_rgba(0,0,0,0.3)]"
              >
                New
              </span>
              {{ task.title }}
            </h2>
            <p class="mt-0.5 text-[#8a5a2b] leading-tight text-[length:clamp(0.72rem,3.4vw,0.9rem)]">{{ task.description }}</p>
          </div>
        </div>

        <div class="mt-3 flex items-center gap-2">
          <span
            class="shrink-0 flex items-center gap-1 rounded-full bg-[#fde7b8] border border-[#e3b66f] pl-1 pr-3 py-0.5 font-extrabold text-[#552a0f] text-[length:clamp(0.95rem,4.7vw,1.25rem)] tabular-nums"
          >
            <img :src="CoinImage" alt="" class="w-[1.4em]" />
            +{{ task.rewardCoins.toLocaleString('en-US') }}
          </span>

          <div v-if="task.isCompleted" class="flex-1 text-right font-extrabold text-[#1f6a05] text-[length:clamp(0.95rem,4.7vw,1.25rem)]">
            Completed ✓
          </div>

          <div v-else class="flex-1 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-full border border-[#0a6ea8] bg-[#0e89d4] px-4 py-1 font-bold text-white text-[length:clamp(0.9rem,4.4vw,1.15rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
              @click="complete(task)"
            >
              {{ task.type === 'INVITE_FRIENDS' ? 'Invite' : 'Open' }}
            </button>
            <button
              type="button"
              :disabled="tasks.isLoading"
              class="rounded-full border border-[#15861b] bg-[#1fb826] px-4 py-1 font-bold text-white text-[length:clamp(0.9rem,4.4vw,1.15rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px disabled:opacity-60"
              @click="check(task)"
            >
              Check
            </button>
          </div>
        </div>
      </article>
    </div>

    <SlidePanel v-model="isMenuOpen" />
  </div>
</template>

<style scoped>
/* the red "!" on a tab pops away once the tab is opened */
.dot-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.5, 0, 0.8, 0.4),
    opacity 0.3s;
}
.dot-leave-to {
  transform: scale(0);
  opacity: 0;
}
.new-tag {
  animation: new-pop 0.5s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
@keyframes new-pop {
  from {
    opacity: 0;
    transform: scale(0.3);
  }
}
/* a new task: its border glows gently */
.new-card {
  animation: new-glow 1.8s ease-in-out infinite;
}
@keyframes new-glow {
  0%,
  100% {
    box-shadow:
      0px 4px 4px rgba(0, 0, 0, 0.25),
      0 0 0 0 rgba(255, 90, 79, 0);
  }
  50% {
    box-shadow:
      0px 4px 4px rgba(0, 0, 0, 0.25),
      0 0 12px 3px rgba(255, 90, 79, 0.55);
  }
}
@media (prefers-reduced-motion: reduce) {
  .new-card,
  .new-tag {
    animation: none;
  }
}
</style>
