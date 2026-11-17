<script setup lang="ts">
import { StarIcon } from '@/assets/svgs'
import { CoinImage } from '@/assets/images'
import type { ResolvedPrize } from '@/views/spin-prizes'

defineProps<{ prizes: ResolvedPrize[] }>()
const emit = defineEmits<{ (e: 'close'): void }>()
</script>

<template>
  <!-- the Prizes List of the Roulette (Figma "Prizes list 2"): a glass panel, a 3-column grid, a yellow Close -->
  <div
    class="rp-overlay"
    role="dialog"
    aria-modal="true"
    :aria-label="$t('Prizes List')"
    @click.self="emit('close')"
  >
    <div class="rp-panel">
      <h2 class="rp-title">{{ $t('Prizes List') }}</h2>

      <div class="rp-grid">
        <div v-for="(p, i) in prizes" :key="i" class="rp-item" :style="{ animationDelay: `${Math.min(i, 14) * 45}ms` }">
          <div class="rp-art">
            <img decoding="async" :src="p.img" :alt="p.name" :class="p.kind === 'gift' ? 'rp-gift' : 'rp-coin'" />
          </div>
          <span class="rp-pill">
            <img decoding="async" :src="p.kind === 'coins' ? CoinImage : StarIcon" alt="" />
            {{ p.amount }}
          </span>
        </div>
      </div>

      <button type="button" class="rp-close" @click="emit('close')">{{ $t('Close') }}</button>
    </div>
  </div>
</template>

<style scoped>
/* design px of the 776 px wide Figma frame → the width of the panel's container */
.rp-overlay {
  --u: calc(100cqw / 776);
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--u) * 30);
  background: rgba(8, 28, 78, 0.62);
  backdrop-filter: blur(3px);
  animation: rp-fade 0.2s ease-out both;
}
.rp-panel {
  width: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: calc(var(--u) * 30) calc(var(--u) * 30) calc(var(--u) * 34);
  border-radius: calc(var(--u) * 30);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 calc(var(--u) * 12) calc(var(--u) * 40) rgba(0, 0, 0, 0.3);
  animation: rp-pop 0.32s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}
.rp-title {
  flex: none;
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: 0.01em;
  color: #fff;
  font-size: calc(var(--u) * 64);
  text-shadow: 0 calc(var(--u) * 3) calc(var(--u) * 3) rgba(0, 0, 0, 0.25);
}
.rp-grid {
  min-height: 0;
  width: 100%;
  margin-top: calc(var(--u) * 26);
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: calc(var(--u) * 26) calc(var(--u) * 10);
  overflow-y: auto;
  scrollbar-width: none;
}
.rp-grid::-webkit-scrollbar {
  display: none;
}
.rp-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: rp-item 0.4s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}
.rp-art {
  width: 100%;
  aspect-ratio: 1.3;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  overflow: hidden;
}
.rp-gift {
  height: 112%;
  aspect-ratio: 1;
  margin-bottom: -14%;
  object-fit: contain;
  filter: drop-shadow(0 calc(var(--u) * 4) calc(var(--u) * 4) rgba(0, 0, 0, 0.25));
}
.rp-coin {
  height: 82%;
  aspect-ratio: 1;
  object-fit: contain;
  filter: drop-shadow(0 calc(var(--u) * 4) calc(var(--u) * 4) rgba(0, 0, 0, 0.25));
}
.rp-pill {
  position: relative;
  z-index: 1;
  margin-top: calc(var(--u) * -8);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: calc(var(--u) * 10);
  width: 94%;
  height: calc(var(--u) * 62);
  border-radius: calc(var(--u) * 30);
  background: #195fd8;
  color: #fff;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  font-size: calc(var(--u) * 27);
  letter-spacing: 0.01em;
  box-shadow:
    0 calc(var(--u) * 3) calc(var(--u) * 2) rgba(0, 0, 0, 0.25),
    inset 0 calc(var(--u) * 3) calc(var(--u) * 4) rgba(255, 255, 255, 0.25),
    inset 0 calc(var(--u) * -3) calc(var(--u) * 4) rgba(0, 0, 0, 0.25);
}
.rp-pill img {
  width: calc(var(--u) * 35);
  height: calc(var(--u) * 35);
  object-fit: contain;
}
.rp-close {
  flex: none;
  margin-top: calc(var(--u) * 26);
  width: 46%;
  height: calc(var(--u) * 90);
  border: 0;
  border-radius: calc(var(--u) * 30);
  background: #fbe166;
  color: #552a0f;
  font-weight: 800;
  font-size: calc(var(--u) * 48);
  letter-spacing: 0.01em;
  box-shadow:
    0 calc(var(--u) * 3) calc(var(--u) * 2) rgba(0, 0, 0, 0.25),
    inset 0 calc(var(--u) * 3) calc(var(--u) * 4) rgba(255, 255, 255, 0.25),
    inset 0 calc(var(--u) * -3) calc(var(--u) * 4) rgba(0, 0, 0, 0.25);
}
.rp-close:active {
  transform: translateY(1px);
}

@keyframes rp-fade {
  from {
    opacity: 0;
  }
}
@keyframes rp-pop {
  from {
    opacity: 0;
    transform: translateY(4%) scale(0.92);
  }
}
@keyframes rp-item {
  from {
    opacity: 0;
    transform: translateY(14px) scale(0.85);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rp-overlay,
  .rp-panel,
  .rp-item {
    animation: none;
  }
}
</style>
