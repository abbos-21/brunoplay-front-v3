<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from 'vue'
import { gate, clearGate } from '@/composables/useAppGate'
import { getAppInfo } from '@/api/user'
import { locale, t } from '@/i18n'

/**
 * Covers the whole app when the server says so:
 *  - maintenance: "back soon" with the owner's text; it checks every 20 s and reopens the game by itself
 *  - upgrade: this version is too old, reload to get the new one
 *  - blocked: the account is blocked
 */
const title = computed(() => {
  switch (gate.value?.kind) {
    case 'maintenance': return t('We are updating the game')
    case 'upgrade': return t('Please update the game')
    default: return t('Your account is blocked')
  }
})

const text = computed(() => {
  const g = gate.value
  if (!g) return ''
  if (g.text) return g.text
  if (g.kind === 'maintenance') return t('We will be back soon.')
  if (g.kind === 'upgrade') return t('Close the game and open it again to get the new version.')
  return t('If you think this is a mistake, contact support.')
})

const until = computed(() => {
  const g = gate.value
  if (!g || g.kind !== 'maintenance' || !g.until) return ''
  const d = new Date(g.until)
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleString(locale.value === 'ru' ? 'ru-RU' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' })
})

const reload = () => window.location.reload()

let timer: ReturnType<typeof setInterval> | undefined
watch(
  () => gate.value?.kind,
  (kind) => {
    clearInterval(timer)
    if (kind !== 'maintenance') return
    // the game opens again by itself when the maintenance is over
    timer = setInterval(async () => {
      try {
        const info = await getAppInfo()
        if (!info.maintenance.enabled) {
          clearGate()
          window.location.reload()
        }
      } catch {
        // still down: keep waiting
      }
    }, 20_000)
  },
  { immediate: true },
)
onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div v-if="gate" class="absolute inset-0 z-[100] flex items-center justify-center bg-[#f9dc7a] p-6" role="alert">
    <div class="w-full max-w-xs rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-5 py-6 text-center text-[#552a0f] shadow-[0px_6px_10px_rgba(0,0,0,0.3)]">
      <p class="text-5xl">{{ gate.kind === 'maintenance' ? '🛠️' : gate.kind === 'upgrade' ? '⬆️' : '⛔' }}</p>
      <h1 class="mt-2 font-extrabold leading-tight text-[length:clamp(1.3rem,6.5vw,1.7rem)]">{{ title }}</h1>
      <p class="mt-2 text-[#8a5a2b] font-bold">{{ text }}</p>
      <p v-if="until" class="mt-1 text-[#8a5a2b]">{{ $t('Expected back') }}: {{ until }}</p>
      <button
        v-if="gate.kind !== 'blocked'"
        type="button"
        class="mt-4 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 font-bold text-white text-[length:clamp(1.05rem,5.2vw,1.3rem)]"
        @click="reload"
      >
        {{ $t('Reload') }}
      </button>
    </div>
  </div>
</template>
