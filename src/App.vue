<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { hasChosen, locale, setLocale } from '@/i18n'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMusic } from '@/composables/useMusic'
import NavigationMenu from '@/components/NavigationMenu.vue'
import TopUpPanel from '@/components/TopUpPanel.vue'
import { useTopUp } from '@/composables/useTopUp'
import ToastContainer from './components/ToastContainer.vue'
import LevelUpOverlay from '@/components/LevelUpOverlay.vue'
import GateScreen from '@/components/GateScreen.vue'
import { gate } from '@/composables/useAppGate'
import { getAppInfo } from '@/api/user'
import { isApiDisabled } from '@/api/client'
import { BackgroundMusic } from './assets/audios'

const auth = useAuthStore()
const route = useRoute()
const topUp = useTopUp()

const i18nRu = () => locale.value === 'ru'

const audioRef = ref<HTMLAudioElement | null>(null)
const { setAudio, play } = useMusic()

// a phone that has never picked a language follows the one saved on the account
watch(
  () => auth.user?.language,
  (lang) => {
    if (lang && !hasChosen()) setLocale(lang === 'RU' ? 'ru' : 'en', false)
  },
)

onMounted(() => {
  auth.init()

  // maintenance can be switched on while the app is closed: ask before the first screen loads its data
  if (!isApiDisabled) {
    getAppInfo()
      .then((i) => {
        if (i.maintenance.enabled && !gate.value) {
          gate.value = { kind: 'maintenance', text: (i18nRu() ? i.maintenance.textRu : i.maintenance.textEn) || '', until: i.maintenance.until }
        }
      })
      .catch(() => {})
  }

  if (audioRef.value) {
    setAudio(audioRef.value)

    // Try autoplay
    play()
  }
})
</script>

<template>
  <div class="w-screen h-screen h-[100dvh] flex justify-start items-center">
    <audio ref="audioRef" :src="BackgroundMusic" loop preload="auto" />

    <!-- <div v-if="auth.isLoading">Loading...</div>

    <div v-else-if="auth.state === 'error'">
      <p>{{ auth.error }}</p>
      <button @click="auth.init()">Try again</button>
    </div>

    <div v-else-if="auth.isAuthenticated" class="w-full h-full max-w-md relative">
      <RouterView />
      <NavigationMenu />
      <ToastContainer />
    </div> -->

    <div class="w-full h-full max-w-md relative overflow-clip">
      <RouterView />
      <NavigationMenu v-if="!route.meta.hideNav" />
      <TopUpPanel v-model="topUp.isOpen.value" />
      <ToastContainer />
      <LevelUpOverlay />
      <GateScreen />
    </div>
  </div>
</template>
