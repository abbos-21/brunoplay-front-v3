<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getTelegram } from '@/composables/useTelegram'
import { t } from '@/i18n'

/**
 * Shown when the app could not sign the player in. Two very different reasons:
 *  - the page was opened in a normal browser (no Telegram data): there is nothing to retry, it must be opened from the bot
 *  - the server could not be reached: trying again usually works
 */
const auth = useAuthStore()
const show = computed(() => auth.state === 'error')
const outsideTelegram = computed(() => !getTelegram()?.initData)

const BOT = import.meta.env.VITE_BOT_USERNAME || 'bruno_play_bot'
const openBot = () => window.location.assign(`https://t.me/${BOT}`)
</script>

<template>
  <div v-if="show" class="absolute inset-0 z-[90] flex items-center justify-center bg-[#f9dc7a] p-6" role="alert">
    <div class="w-full max-w-xs rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] px-5 py-6 text-center text-[#552a0f] shadow-[0px_6px_10px_rgba(0,0,0,0.3)]">
      <h1 class="font-extrabold leading-tight text-[length:clamp(1.3rem,6.5vw,1.7rem)]">
        {{ outsideTelegram ? t('Open the game in Telegram') : t('Cannot reach the server') }}
      </h1>
      <p class="mt-2 font-bold text-[#8a5a2b]">
        {{ outsideTelegram ? t('BrunoPlay runs inside Telegram. Open the bot and press Open game.') : t('Check your connection and try again.') }}
      </p>
      <button
        type="button"
        class="mt-4 w-full rounded-full border border-[#d9680f] bg-[#f96a07] py-2 font-bold text-white text-[length:clamp(1.05rem,5.2vw,1.3rem)] shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px"
        @click="outsideTelegram ? openBot() : auth.init()"
      >
        {{ outsideTelegram ? t('Open the bot') : t('Try again') }}
      </button>
    </div>
  </div>
</template>
