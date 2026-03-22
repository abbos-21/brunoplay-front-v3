// composables/useToast.ts
import { ref } from 'vue'
import type { Toast, ToastType } from '@/types/toast'

const toasts = ref<Toast[]>([])
let id = 0

export function useToast() {
  function show(message: string, type: ToastType = 'info', duration = 3000) {
    const toast: Toast = {
      id: id++,
      message,
      type,
      duration,
    }

    toasts.value.push(toast)

    setTimeout(() => {
      remove(toast.id)
    }, duration)
  }

  function remove(id: number) {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  return {
    toasts,
    show,
    remove,
  }
}
