<script setup lang="ts">
import { LevelSVG } from '@/assets/svgs'
import { EnergyImage } from '@/assets/images'
</script>

<template>
  <div class="main-div flex items-center p-2 px-4 gap-2 relative">
    <h1 class="font-bold outlined [--outline:#C17E23]">1600</h1>
    <span class="h-4 w-px bg-[#C17E23]"></span>
    <div class="w-10"></div>

    <LevelSVG class="w-20 absolute inset-y-0 -right-5" />
    <img :src="EnergyImage" alt="Energy" class="absolute -top-1 -left-4 w-8" />
  </div>
</template>

<style scoped lang="css">
.main-div {
  background: #fbe166;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 0px 4px 2px rgba(0, 0, 0, 0.25);
  border-radius: 50px;
}
</style>
