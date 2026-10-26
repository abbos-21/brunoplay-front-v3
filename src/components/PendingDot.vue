<script setup lang="ts">
import { AlertImage } from '@/assets/images'
</script>

<template>
  <!-- a glossy red "!" that bounces and pings: something here still needs the player today -->
  <span class="pending-dot absolute -top-1.5 -right-1 z-10 flex h-[1.6rem] w-[1.3rem] items-center justify-center pointer-events-none" aria-hidden="true">
    <span class="ping absolute left-1/2 top-1/2 size-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[#ff4a3d]" />
    <img decoding="async" :src="AlertImage" alt="" class="bounce relative h-full w-auto" />
  </span>
</template>

<style scoped>
.pending-dot {
  animation: dot-in 0.45s cubic-bezier(0.2, 1.6, 0.4, 1) both;
}
.bounce {
  transform-origin: 50% 90%;
  filter: drop-shadow(0 0 1.5px #fff) drop-shadow(0 0 1.5px #fff) drop-shadow(0 2px 2px rgba(0, 0, 0, 0.45));
  animation: bounce 1.6s ease-in-out infinite;
}
.ping {
  animation: ping 1.8s ease-out infinite;
}
@keyframes dot-in {
  from {
    opacity: 0;
    transform: scale(0.2);
  }
}
@keyframes bounce {
  0%,
  100% {
    transform: translateY(0) scale(1, 1);
  }
  20% {
    transform: translateY(-14%) scale(0.95, 1.08);
  }
  38% {
    transform: translateY(0) scale(1.08, 0.92);
  }
  52% {
    transform: translateY(-5%) scale(1, 1);
  }
  66% {
    transform: translateY(0) scale(1, 1);
  }
}
@keyframes ping {
  0% {
    opacity: 0.85;
    transform: translate(-50%, -50%) scale(0.6);
  }
  80%,
  100% {
    opacity: 0;
    transform: translate(-50%, -50%) scale(1.9);
  }
}
@media (prefers-reduced-motion: reduce) {
  .ping,
  .bounce {
    animation: none;
  }
  .ping {
    opacity: 0;
  }
}
</style>
