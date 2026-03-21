<script setup lang="ts">
import { LevelSVG } from '@/assets/svgs'
import { EnergyImage } from '@/assets/images'
</script>

<template>
  <div class="flex items-center p-2 px-4 gap-2 relative bg-[#fbe166] rounded-[50px] shadow-card">
    <h1 class="font-bold outlined [--outline:#C17E23]">1600</h1>
    <span class="h-4 w-px bg-[#C17E23]"></span>
    <div class="w-10"></div>
    <LevelSVG class="w-20 absolute inset-y-0 -right-5" />
    <img :src="EnergyImage" alt="Energy" class="absolute -top-1 -left-4 w-8" />
  </div>
</template>
