<script setup lang="ts">
import { FishingImage, ShopImage, GamesImage, TasksImage, FriendsImage } from '@/assets/images'
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="absolute bottom-0 left-0 right-0 w-full p-4">
    <nav
      class="bg-[#fbe166] bg-[#fbe166] rounded-full shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_4px_2px_rgba(0,0,0,0.25)] flex justify-between items-start scrollbar"
    >
      <RouterLink
        to="/"
        class="nav-item h-18 aspect-square flex flex-col items-center justify-center rounded-full"
        active-class="active"
      >
        <img :src="FishingImage" alt="Fishing" class="w-8" />
        <h1 class="outlined [--outline:#532B23] -mt-3 font-bold">Fishing</h1>
      </RouterLink>
      <RouterLink
        to="/shop"
        class="nav-item h-18 aspect-square flex flex-col items-center justify-center rounded-full"
        active-class="active"
      >
        <img :src="ShopImage" alt="Shop" class="w-11" />
        <h1 class="outlined [--outline:#532B23] -mt-3 font-bold">Shop</h1>
      </RouterLink>
      <RouterLink
        to="/games"
        class="nav-item h-18 aspect-square flex flex-col items-center justify-center rounded-full"
        active-class="active"
      >
        <img :src="GamesImage" alt="Games" class="w-12" />
        <h1 class="outlined [--outline:#532B23] -mt-3 font-bold">Games</h1>
      </RouterLink>
      <RouterLink
        to="/tasks"
        class="nav-item h-18 aspect-square flex flex-col items-center justify-center rounded-full"
        active-class="active"
      >
        <img :src="TasksImage" alt="Tasks" class="w-10" />
        <h1 class="outlined [--outline:#532B23] -mt-3 font-bold">Tasks</h1>
      </RouterLink>
      <RouterLink
        to="/friends"
        class="nav-item h-18 aspect-square flex flex-col items-center justify-center rounded-full"
        active-class="active"
      >
        <img :src="FriendsImage" alt="Friends" class="w-8" />
        <h1 class="outlined [--outline:#532B23] -mt-3 font-bold">Friends</h1>
      </RouterLink>
    </nav>
  </div>
</template>

<style scoped lang="css">
.nav-item {
  transition:
    background-color 0.25s ease,
    box-shadow 0.25s ease,
    transform 0.2s ease;
}

.nav-item.active {
  background: #c17e23;
  box-shadow:
    inset 0px 3px 4px rgba(255, 255, 255, 0.25),
    inset 0px -3px 4px rgba(0, 0, 0, 0.25);
  transform: translateY(-2px) scale(1.05);
}

.nav-item:active {
  transform: translateY(0) scale(0.98);
}

.scrollbar {
  /* Firefox */
  scrollbar-width: none;
  /* IE and Edge */
  -ms-overflow-style: none;
  /* Chrome, Safari, and Opera */
}
.scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
