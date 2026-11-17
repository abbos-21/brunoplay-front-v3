<script setup lang="ts">
import { computed } from 'vue'
import { useMusic } from '@/composables/useMusic'
import { setSfxEnabled, sfxEnabled } from '@/composables/useSfx'

defineProps<{ demo: boolean }>()
const emit = defineEmits<{ (e: 'close'): void; (e: 'update:demo', v: boolean): void }>()

// the sound and the music are the same switches as in the menu: what is chosen here holds for the whole game
const music = useMusic()
const musicOn = computed(() => music.isPlaying.value)
</script>

<template>
  <!-- the Roulette settings (Figma "Roulette settings"): demo mode, sound effects, music -->
  <div class="rs-overlay" role="dialog" aria-modal="true" :aria-label="$t('Roulette settings')" @click.self="emit('close')">
    <div class="rs-panel">
      <h2 class="rs-title">{{ $t('Roulette settings') }}</h2>

      <div class="rs-row rs-row-tall">
        <div class="rs-text">
          <p class="rs-label">{{ $t('Demo mode') }}</p>
          <p class="rs-hint">{{ $t('All cases are free, but prizes won’t be credited') }}</p>
        </div>
        <button type="button" class="rs-switch" :class="{ on: demo }" role="switch" :aria-checked="demo" :aria-label="$t('Demo mode')" @click="emit('update:demo', !demo)">
          <span class="rs-state">{{ demo ? $t('ON') : $t('OFF') }}</span>
          <span class="rs-track"><span class="rs-knob" /></span>
        </button>
      </div>

      <div class="rs-row">
        <p class="rs-label">{{ $t('Sound Effects') }}</p>
        <button type="button" class="rs-switch" :class="{ on: sfxEnabled }" role="switch" :aria-checked="sfxEnabled" :aria-label="$t('Sound Effects')" @click="setSfxEnabled(!sfxEnabled)">
          <span class="rs-state">{{ sfxEnabled ? $t('ON') : $t('OFF') }}</span>
          <span class="rs-track"><span class="rs-knob" /></span>
        </button>
      </div>

      <div class="rs-row">
        <p class="rs-label">{{ $t('Music') }}</p>
        <button type="button" class="rs-switch" :class="{ on: musicOn }" role="switch" :aria-checked="musicOn" :aria-label="$t('Music')" @click="music.toggle()">
          <span class="rs-state">{{ musicOn ? $t('ON') : $t('OFF') }}</span>
          <span class="rs-track"><span class="rs-knob" /></span>
        </button>
      </div>

      <button type="button" class="rs-close" @click="emit('close')">{{ $t('Close') }}</button>
    </div>
  </div>
</template>

<style scoped>
.rs-overlay {
  --u: calc(100cqw / 776);
  position: absolute;
  inset: 0;
  z-index: 60;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: calc(var(--u) * 23);
  background: rgba(8, 28, 78, 0.62);
  backdrop-filter: blur(3px);
  animation: rs-fade 0.2s ease-out both;
}
.rs-panel {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: calc(var(--u) * 14);
  padding: calc(var(--u) * 15);
  border-radius: calc(var(--u) * 30);
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 calc(var(--u) * 12) calc(var(--u) * 40) rgba(0, 0, 0, 0.3);
  animation: rs-pop 0.32s cubic-bezier(0.2, 1.3, 0.4, 1) both;
}
.rs-title {
  padding: calc(var(--u) * 16) 0 calc(var(--u) * 6);
  text-align: center;
  font-weight: 700;
  line-height: 1.1;
  color: #fff;
  font-size: calc(var(--u) * 40);
  letter-spacing: 0.01em;
}
.rs-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: calc(var(--u) * 16);
  min-height: calc(var(--u) * 118);
  padding: calc(var(--u) * 18) calc(var(--u) * 22) calc(var(--u) * 18) calc(var(--u) * 26);
  border-radius: calc(var(--u) * 30);
  background: #28417f;
  box-shadow: inset 0 calc(var(--u) * -3) calc(var(--u) * 2) rgba(0, 0, 0, 0.25);
}
.rs-row-tall {
  min-height: calc(var(--u) * 176);
}
.rs-text {
  min-width: 0;
}
.rs-label {
  font-weight: 700;
  line-height: 1.1;
  color: #fff;
  font-size: calc(var(--u) * 36);
  letter-spacing: 0.01em;
}
.rs-hint {
  margin-top: calc(var(--u) * 18);
  font-weight: 700;
  line-height: 1.35;
  color: rgba(255, 255, 255, 0.5);
  font-size: calc(var(--u) * 24);
}

/* the switch: a dark rail, the state word, and a green capsule with a mint knob that slides in it */
.rs-switch {
  position: relative;
  flex: none;
  width: calc(var(--u) * 208);
  height: calc(var(--u) * 82);
  border: 0;
  padding: 0;
  border-radius: calc(var(--u) * 45);
  background: #152751;
  cursor: pointer;
}
.rs-switch::before {
  content: '';
  position: absolute;
  inset: calc(var(--u) * 10);
  border-radius: calc(var(--u) * 45);
  background: #1f356f;
}
.rs-state {
  position: absolute;
  left: calc(var(--u) * 28);
  top: 50%;
  transform: translateY(-52%);
  font-weight: 700;
  color: #fff;
  font-size: calc(var(--u) * 40);
  letter-spacing: 0.01em;
}
.rs-track {
  position: absolute;
  right: calc(var(--u) * 13);
  top: 50%;
  width: calc(var(--u) * 89);
  height: calc(var(--u) * 56);
  transform: translateY(-50%);
  border-radius: calc(var(--u) * 45);
  background: #2dc951;
  opacity: 0.1;
  transition: opacity 0.25s;
}
.rs-switch.on .rs-track {
  opacity: 1;
}
.rs-knob {
  position: absolute;
  top: 50%;
  left: calc(var(--u) * 4);
  width: calc(var(--u) * 48);
  height: calc(var(--u) * 48);
  border-radius: 50%;
  background: #b9ffd9;
  transform: translateY(-50%);
  transition: left 0.28s cubic-bezier(0.3, 1.5, 0.5, 1);
  box-shadow: 0 calc(var(--u) * 3) calc(var(--u) * 3) rgba(0, 0, 0, 0.2);
}
.rs-switch.on .rs-knob {
  left: calc(var(--u) * 37);
}
.rs-switch:active .rs-knob {
  width: calc(var(--u) * 54);
}

.rs-close {
  height: calc(var(--u) * 100);
  margin-top: calc(var(--u) * 4);
  border: 0;
  border-radius: calc(var(--u) * 30);
  background: #1b56c8;
  color: #fff;
  font-weight: 700;
  font-size: calc(var(--u) * 40);
  letter-spacing: 0.01em;
  box-shadow:
    inset 0 calc(var(--u) * 2) calc(var(--u) * 4) rgba(255, 255, 255, 0.25),
    inset 0 calc(var(--u) * -2) calc(var(--u) * 4) rgba(0, 0, 0, 0.25);
}
.rs-close:active {
  transform: translateY(1px);
}

@keyframes rs-fade {
  from {
    opacity: 0;
  }
}
@keyframes rs-pop {
  from {
    opacity: 0;
    transform: translateY(4%) scale(0.92);
  }
}
@media (prefers-reduced-motion: reduce) {
  .rs-overlay,
  .rs-panel {
    animation: none;
  }
  .rs-knob,
  .rs-track {
    transition: none;
  }
}
</style>
