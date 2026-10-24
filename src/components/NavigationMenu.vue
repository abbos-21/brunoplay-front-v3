<script setup lang="ts">
import { FishingImage, ShopImage, GamesImage, TasksImage, FriendsImage } from '@/assets/images'
import { onBeforeUnmount, onMounted } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PendingDot from '@/components/PendingDot.vue'
import { useTasksStore } from '@/stores/tasks'
import { useTaskAlerts } from '@/composables/useTaskAlerts'

const route = useRoute()
const tasks = useTasksStore()
const { hasNew } = useTaskAlerts()

// learn about new tasks on any page: when the app opens, now and then, and when the player comes back to it
const refresh = () => tasks.fetchTasks().catch(() => {})
let timer: ReturnType<typeof setInterval> | undefined
const onVisible = () => document.visibilityState === 'visible' && refresh()
onMounted(() => {
  refresh()
  timer = setInterval(refresh, 120_000)
  document.addEventListener('visibilitychange', onVisible)
})
onBeforeUnmount(() => {
  clearInterval(timer)
  document.removeEventListener('visibilitychange', onVisible)
})

const navItems = [
  { to: '/', img: FishingImage, label: 'Fishing', imgClass: 'w-6 sm:w-8' },
  { to: '/shop', img: ShopImage, label: 'Shop', imgClass: 'w-8 sm:w-11' },
  { to: '/games', img: GamesImage, label: 'Games', imgClass: 'w-9 sm:w-12' },
  { to: '/tasks', img: TasksImage, label: 'Tasks', imgClass: 'w-7 sm:w-10' },
  { to: '/friends', img: FriendsImage, label: 'Friends', imgClass: 'w-6 sm:w-8' },
]
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 w-full p-2 sm:p-4">
    <nav class="bg-[#fbe166] rounded-full shadow-card flex justify-between items-start [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <RouterLink
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="relative h-14 sm:h-18 aspect-square flex flex-col items-center justify-center rounded-full transition-[background-color,box-shadow,transform] duration-[250ms] ease active:translate-y-0 active:scale-[0.98]"
        active-class="bg-[#c17e23] shadow-[inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] -translate-y-0.5 scale-105"
      >
        <img :src="item.img" :alt="$t(item.label)" :class="item.imgClass" />
        <h1 class="outlined [--outline:#532B23] -mt-2 sm:-mt-3 font-bold text-xs sm:text-sm">{{ $t(item.label) }}</h1>
        <Transition name="dot">
          <PendingDot v-if="item.to === '/tasks' && hasNew && route.path !== '/tasks'" />
        </Transition>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped>
/* the red "!" pops away once the Tasks page has been opened */
.dot-leave-active {
  transition:
    transform 0.3s cubic-bezier(0.5, 0, 0.8, 0.4),
    opacity 0.3s;
}
.dot-leave-to {
  transform: scale(0);
  opacity: 0;
}
</style>
