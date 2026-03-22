<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMusic } from '@/composables/useMusic'
import NavigationMenu from '@/components/NavigationMenu.vue'
import ToastContainer from './components/ToastContainer.vue'
import { BackgroundMusic } from './assets/audios'

const auth = useAuthStore()

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
  <div class="w-screen h-screen flex justify-start items-center">
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

    <div class="w-full h-full max-w-md relative">
      <RouterView />
      <NavigationMenu />
      <ToastContainer />
    </div>
  </div>
</template>
