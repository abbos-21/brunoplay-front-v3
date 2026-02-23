<script setup lang="ts">
import { CoinImage } from '@/assets/images'
import { MinusSVG } from '@/assets/svgs'
</script>

<template>
  <div class="inline-flex gap-px items-center p-1 py-1.5 pe-1.5 main-div relative">
    <img :src="CoinImage" alt="Coin" class="w-8" />
    <div class="child-div text-white px-3 py-1 font-bold">2,104,024</div>
    <span
      class="child-span w-5 h-5 rounded-full flex justify-center items-center absolute -top-1 -right-1 text-white"
    >
      <MinusSVG class="w-3" />
    </span>
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

.child-div {
  background: #c17e23;
  box-shadow:
    inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25),
    inset 0px 0px 1px 1px rgba(0, 0, 0, 0.25);
  border-radius: 50px;
}

.child-span {
  background: linear-gradient(192.38deg, #0fff00 6.75%, #1c8b1a 86.84%);
  border: 0.5px solid #006417;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 0px 9px 2px rgba(205, 205, 205, 0.25);
}
</style>
