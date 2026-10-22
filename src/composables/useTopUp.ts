import { ref } from 'vue'

// Shared open/close state for the "Top up Stars" bottom panel (rendered once in App.vue).
const isOpen = ref(false)

export function useTopUp() {
  return {
    isOpen,
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
  }
}
