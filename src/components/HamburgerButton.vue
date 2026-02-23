<script setup lang="ts">
defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()
</script>

<template>
  <button
    type="button"
    class="menu-button"
    @click="emit('update:modelValue', !modelValue)"
    :class="{ open: modelValue }"
  >
    <span class="burger-piece"></span>
    <span class="burger-piece"></span>
    <span class="burger-piece"></span>
  </button>
</template>

<style scoped lang="css">
.menu-button {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 4px; /* ⬅️ tighter spacing */
  width: 40px;
  aspect-ratio: 1;
  cursor: pointer;

  background: #fbe166;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 0px 4px 2px rgba(0, 0, 0, 0.25);
  border-radius: 8px;
}

.burger-piece {
  width: 28px;
  height: 4px;
  background: #ffffff;
  border: 1.5px solid #6f3c2d;
  border-radius: 4px;

  transition:
    transform 0.35s ease,
    opacity 0.25s ease;
  transform-origin: center;
}

/* 🍔 → ❌ transition */
.menu-button.open .burger-piece:nth-child(1) {
  transform: translateY(8px) rotate(45deg);
}

.menu-button.open .burger-piece:nth-child(2) {
  opacity: 0;
}

.menu-button.open .burger-piece:nth-child(3) {
  transform: translateY(-8px) rotate(-45deg);
}
</style>
