<script setup lang="ts">
import { t } from '@/i18n'
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
import { AdError } from '@/composables/useAds'
import { isApiDisabled } from '@/api/client'
import { StarIcon } from '@/assets/svgs'
import PageTabs from '@/components/PageTabs.vue'
import SponsoredTask from '@/components/SponsoredTask.vue'
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
  tasks.fetchBonus().catch(() => {})
  try {
    await tasks.fetchTasks()
  } catch {
    // keep the placeholder list when the API is unavailable
  }
  // the server knows which tasks are new to this player; they are tagged until the player leaves the page
  newIds.value = tasks.tasks.filter((t) => t.isNew && !t.isCompleted).map((t) => t.id)
  alerts.markSeen()
})

// the placeholder list is only for developing the screens without a backend
const mainList = () => (isApiDisabled && !tasks.mainTasks.length ? fallbackMain : tasks.mainTasks)
const otherList = () => tasks.otherTasks

// which tab still has tasks the player has not seen (and has not opened yet)
const opened = ref<Set<string>>(new Set(['main']))
const othersHasNew = computed(
  () => !opened.value.has('others') && otherList().some((t) => newIds.value.includes(t.id) && !t.isCompleted),
)

function openTab(next: 'main' | 'others') {
  tab.value = next
  opened.value = new Set([...opened.value, next])
}

const list = computed(() => {
  if (tab.value === 'others') return otherList()
  return mainList()
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
  // the link the admin set, else the channel; opening it also starts the server's timer for the check
  const url = task.url || (task.channelUsername ? `https://t.me/${task.channelUsername.replace(/^@/, '')}` : '')
  if (!url) return
  void tasks.openTask(task.id)
  const tg = getTelegram()
  if (tg && url.startsWith('https://t.me/')) tg.openTelegramLink(url)
  else if (tg) tg.openLink(url)
  else window.open(url, '_blank')
}

function rewardText(r: { reward: number; rewardStars?: number }) {
  const parts: string[] = []
  if (r.reward > 0) parts.push(t('{n} coins', { n: r.reward }))
  if ((r.rewardStars ?? 0) > 0) parts.push(t('{n} stars', { n: r.rewardStars ?? 0 }))
  return parts.join(' + ')
}

async function check(task: Task) {
  if (task.id < 0) return
  try {
    const r = task.type === 'WATCH_ADS' ? await tasks.watchTaskAd(task.id) : await tasks.checkTask(task.id)
    if (r.completed && (r.reward > 0 || (r.rewardStars ?? 0) > 0)) toast.show(t('Done! You got {text}', { text: rewardText(r) }), 'success')
    else if (r.completed) toast.show(t('Already completed'), 'info')
    else if (task.type === 'WATCH_ADS' && r.progress !== undefined) toast.show(t('Ad watched: {n} of {total}', { n: r.progress, total: r.required ?? task.required ?? 1 }), 'success')
    // `error` is a machine code (TASK_NOT_COMPLETED, ...); the readable text is `message`, else the plain "not done"
    else toast.show(r.message ? r.message : t('Not done yet'), 'warning')
  } catch (e) {
    toast.show(e instanceof AdError ? e.message : apiMessage(e, 'Could not check the task'), e instanceof AdError ? 'warning' : 'error')
  }
}

async function claimBonus() {
  try {
    const r = await tasks.claimBonus()
    toast.show(t('You got {n} coins', { n: r.coins }), 'success')
  } catch (e) {
    toast.show(e instanceof AdError ? e.message : apiMessage(e, 'Could not get the bonus'), e instanceof AdError ? 'warning' : 'error')
  }
}

const progressText = (task: Task) =>
  task.type === 'INVITE_FRIENDS' || task.type === 'WATCH_ADS'
    ? `${task.progress ?? 0}/${task.required ?? task.requiredInvites ?? 1}`
    : ''

</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-clip pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center gap-2">
      <CoinBalance />
      <div class="flex items-center gap-[clamp(0.25rem,2vw,0.5rem)]">
        <StarBalance />
        <HamburgerButton v-model="isMenuOpen" />
      </div>
    </div>

    <PageTabs
      :tabs="[
        { key: 'main', label: $t('Main'), active: tab === 'main' },
        { key: 'others', label: $t('Others'), active: tab === 'others', dot: othersHasNew },
      ]"
      @select="(k) => openTab(k as 'main' | 'others')"
    />

    <div class="flex flex-col gap-4 mt-4 px-1 pb-2 overflow-y-scroll flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <article
        v-if="tab === 'others' && tasks.bonus && tasks.bonus.perDay > 0"
        class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)] flex items-center gap-3"
      >
        <div class="flex-1 min-w-0">
          <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1rem,5vw,1.3rem)]">{{ $t('Watch an ad, get coins') }}</h2>
          <p class="mt-0.5 text-[#8a5a2b] text-[length:clamp(0.72rem,3.4vw,0.9rem)]">{{ $t('{n} left today', { n: tasks.bonus.left }) }}</p>
        </div>
        <button
          type="button"
          :disabled="tasks.isLoading || tasks.bonus.left <= 0"
          class="shrink-0 flex items-center gap-1 rounded-full border border-[#15861b] bg-[#1fb826] px-3 py-1 font-bold text-white text-[length:clamp(0.82rem,4.1vw,1.15rem)] disabled:opacity-60"
          @click="claimBonus"
        >
          <img decoding="async" loading="lazy" :src="CoinImage" alt="" class="w-[1.2em]" />+{{ tasks.bonus.coins.toLocaleString('en-US') }}
        </button>
      </article>

      <!-- Adsgram's Task block: first in the list, only when the admin switched it on -->
      <SponsoredTask v-if="tab === 'main'" />

      <p v-if="!list.length" class="text-center font-bold text-[#552a0f] mt-8">{{ $t('No tasks here yet') }}</p>

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
            <img decoding="async" loading="lazy" :src="imageFor(task)" :alt="$t(task.title)" class="w-[82%] h-[82%] rounded-full object-cover" />
          </div>

          <div class="flex-1 min-w-0">
            <h2 class="font-bold text-[#552a0f] leading-tight text-[length:clamp(1rem,5vw,1.3rem)]">
              <span
                v-if="newIds.includes(task.id) && !task.isCompleted"
                class="new-tag mr-1.5 inline-block align-middle rounded-full bg-[linear-gradient(180deg,#ff5a4f,#d0170c)] border border-white px-2 py-px text-[0.65rem] font-extrabold uppercase leading-tight tracking-wide text-white shadow-[0px_2px_3px_rgba(0,0,0,0.3)]"
              >
                {{ $t('New') }}
              </span>
              {{ $t(task.title) }}
            </h2>
            <p class="mt-0.5 text-[#8a5a2b] leading-tight text-[length:clamp(0.72rem,3.4vw,0.9rem)]">{{ $t(task.description) }}</p>
          </div>
        </div>

        <!-- rewards and buttons wrap onto a second line on narrow screens instead of overflowing -->
        <div class="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2">
          <div class="flex min-w-0 flex-wrap items-center gap-1.5">
            <span
              v-if="task.rewardCoins > 0"
              class="flex items-center gap-1 rounded-full bg-[#fde7b8] border border-[#e3b66f] pl-1 pr-2.5 py-0.5 font-extrabold leading-none text-[#552a0f] text-[length:clamp(0.8rem,4vw,1.15rem)] tabular-nums"
            >
              <img decoding="async" loading="lazy" :src="CoinImage" alt="" class="size-[1.5em] object-contain" />
              <span>+{{ task.rewardCoins.toLocaleString('en-US') }}</span>
            </span>
            <span
              v-if="(task.rewardStars ?? 0) > 0"
              class="flex items-center gap-1 rounded-full bg-[#fde7b8] border border-[#e3b66f] pl-1 pr-2.5 py-0.5 font-extrabold leading-none text-[#552a0f] text-[length:clamp(0.8rem,4vw,1.15rem)] tabular-nums"
            >
              <img decoding="async" loading="lazy" :src="StarIcon" alt="" class="size-[1.5em] object-contain" />
              <span>+{{ task.rewardStars!.toLocaleString('en-US') }}</span>
            </span>
            <span v-if="progressText(task) && !task.isCompleted" class="font-bold text-[#8a5a2b] tabular-nums text-[length:clamp(0.8rem,4vw,1.1rem)]">{{ progressText(task) }}</span>
          </div>

          <div v-if="task.isCompleted" class="ml-auto font-extrabold text-[#1f6a05] text-[length:clamp(0.95rem,4.7vw,1.25rem)]">
            {{ $t('Completed ✓') }}
          </div>

          <div v-else class="ml-auto flex shrink-0 justify-end gap-1.5">
            <button
              v-if="task.type !== 'WATCH_ADS'"
              type="button"
              class="rounded-full border border-[#0a6ea8] bg-[#0e89d4] px-3 py-1 font-bold whitespace-nowrap text-white text-[length:clamp(0.82rem,4.1vw,1.15rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
              @click="complete(task)"
            >
              {{ task.type === 'INVITE_FRIENDS' ? $t('Invite') : $t('Open') }}
            </button>
            <button
              type="button"
              :disabled="tasks.isLoading"
              class="rounded-full border border-[#15861b] bg-[#1fb826] px-3 py-1 font-bold whitespace-nowrap text-white text-[length:clamp(0.82rem,4.1vw,1.15rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px disabled:opacity-60"
              @click="check(task)"
            >
              {{ task.type === 'WATCH_ADS' ? $t('Watch') : $t('Check') }}
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
