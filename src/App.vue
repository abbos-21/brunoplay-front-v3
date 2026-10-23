<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMusic } from '@/composables/useMusic'
import NavigationMenu from '@/components/NavigationMenu.vue'
import TopUpPanel from '@/components/TopUpPanel.vue'
import { useTopUp } from '@/composables/useTopUp'
import ToastContainer from './components/ToastContainer.vue'
import LevelUpOverlay from '@/components/LevelUpOverlay.vue'
import { BackgroundMusic } from './assets/audios'

const auth = useAuthStore()
const route = useRoute()
const topUp = useTopUp()

const audioRef = ref<HTMLAudioElement | null>(null)
const { setAudio, play } = useMusic()

onMounted(() => {
  auth.init()

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

    <div class="w-full h-full max-w-md relative overflow-hidden">
      <RouterView />
      <NavigationMenu v-if="!route.meta.hideNav" />
      <TopUpPanel v-model="topUp.isOpen.value" />
      <ToastContainer />
      <LevelUpOverlay />
    </div>
  </div>
</template>
