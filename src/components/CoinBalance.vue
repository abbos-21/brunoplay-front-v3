<script setup lang="ts">
import { CoinImage } from '@/assets/images'
import { MinusSVG } from '@/assets/svgs'
</script>

<template>
  <div class="inline-flex gap-px items-center p-1 py-1.5 pe-1.5 relative bg-[#fbe166] rounded-[50px] shadow-card">
    <img :src="CoinImage" alt="Coin" class="w-8" />
    <div class="text-white px-3 py-1 font-bold bg-[#c17e23] rounded-[50px] shadow-[inset_0px_0px_1px_1px_rgba(0,0,0,0.25)]">
      2,104,024
    </div>
    <span
      class="w-5 h-5 rounded-full flex justify-center items-center absolute -top-1 -right-1 text-white bg-[linear-gradient(192.38deg,#0fff00_6.75%,#1c8b1a_86.84%)] border-[0.5px] border-[#006417] shadow-[0px_4px_4px_rgba(0,0,0,0.25),inset_0px_0px_9px_2px_rgba(205,205,205,0.25)]"
    >
      <MinusSVG class="w-3" />
    </span>
  </div>
</template>
