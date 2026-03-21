<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import NavigationMenu from '@/components/NavigationMenu.vue'

const auth = useAuthStore()

onMounted(() => {
  auth.init()
})
</script>

<template>
  <div class="w-screen h-screen flex justify-start items-center">
    <div v-if="auth.isLoading">Loading...</div>

    <div v-else-if="auth.state === 'error'">
      <p>{{ auth.error }}</p>
      <button @click="auth.init()">Try again</button>
    </div>

    <div v-else-if="auth.isAuthenticated" class="w-full h-full max-w-md relative">
      <RouterView />
      <NavigationMenu />
    </div>
  </div>
</template>
