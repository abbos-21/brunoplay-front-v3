<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        <span
          v-if="toast.type === 'success'"
          class="w-6 aspect-square rounded-full bg-[#1BB33F] text-white flex justify-center items-center"
        >
          <TickSVG class="w-3.5" />
        </span>

        <span
          v-else-if="toast.type === 'error'"
          class="w-6 aspect-square rounded-full bg-[#FB7A38] text-white flex justify-center items-center"
        >
          <TimesSVG class="w-3" />
        </span>

        <span
          v-else-if="toast.type === 'warning'"
          class="w-6 aspect-square rounded-full bg-[#FB7A38] text-white flex justify-center items-center"
        >
          <WarningSVG class="h-4" />
        </span>

        {{ toast.message }}

        <span class="w-6"></span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { TickSVG, TimesSVG, WarningSVG } from '@/assets/svgs'

const { toasts } = useToast()
</script>

<style scoped>
.toast-container {
  width: 100%;
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  padding: 12px 16px;
  border-radius: 16px;
  color: white;
  margin: 0 16px;
  color: #552a0f;
  font-weight: 600;
  background: #fbe166;
  text-align: center;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toast:first-child {
  margin-top: 16px;
}

/* .toast.success {
  background: #fbe166;
}
.toast.error {
  background: #ef4444;
}
.toast.info {
  background: #3b82f6;
}
.toast.warning {
  background: #f59e0b;
} */

.toast-enter-active,
.toast-leave-active {
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-enter-to {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave-from {
  opacity: 1;
  transform: translateY(0);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-move {
  transition: transform 0.3s ease;
}
</style>
