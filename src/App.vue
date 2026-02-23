<script setup lang="ts">
import { RouterView } from 'vue-router'
import NavigationMenu from './components/NavigationMenu.vue'
</script>

<template>
  <div class="w-screen h-screen flex justify-start items-center">
    <div class="w-full h-full max-w-md relative">
      <RouterView />

      <NavigationMenu />
    </div>
  </div>
</template>
