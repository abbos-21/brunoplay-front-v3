<template>
  <div class="toast-container">
    <transition-group name="toast">
      <div v-for="toast in toasts" :key="toast.id" :class="['toast', toast.type]">
        <img :src="ICONS[toast.type] ?? InfoIcon" alt="" class="toast-icon" />

        {{ toast.message }}

        <span class="w-6"></span>
      </div>
    </transition-group>
  </div>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'
import { CheckIcon, CrossIcon, WarningIcon, InfoIcon } from '@/assets/icons'

const ICONS: Record<string, string> = { success: CheckIcon, error: CrossIcon, warning: WarningIcon, info: InfoIcon }

const { toasts } = useToast()
</script>

<style scoped>
.toast-icon {
  width: 1.75rem;
  height: 1.75rem;
  flex: none;
  object-fit: contain;
  filter: drop-shadow(0 2px 2px rgba(85, 42, 15, 0.25));
}

.toast-container {
  width: 100%;
  position: absolute;
  /* below the balance row, so the coin and star counters stay visible while they animate */
  top: 5.5rem;
  right: 0;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.toast {
  pointer-events: auto;
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
