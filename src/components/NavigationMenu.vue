<script setup lang="ts">
import { FishingImage, ShopImage, GamesImage, TasksImage, FriendsImage } from '@/assets/images'
import { RouterLink } from 'vue-router'

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
        class="h-14 sm:h-18 aspect-square flex flex-col items-center justify-center rounded-full transition-[background-color,box-shadow,transform] duration-[250ms] ease active:translate-y-0 active:scale-[0.98]"
        active-class="bg-[#c17e23] shadow-[inset_0px_3px_4px_rgba(255,255,255,0.25),inset_0px_-3px_4px_rgba(0,0,0,0.25)] -translate-y-0.5 scale-105"
      >
        <img :src="item.img" :alt="item.label" :class="item.imgClass" />
        <h1 class="outlined [--outline:#532B23] -mt-2 sm:-mt-3 font-bold text-xs sm:text-sm">{{ item.label }}</h1>
      </RouterLink>
    </nav>
  </div>
</template>
