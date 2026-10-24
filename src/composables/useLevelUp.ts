import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Shared state of the level-up celebration.
 *  - `level` is the player's level
 *  - `hold` keeps the header badge on the OLD level while the celebration plays; it swaps afterwards
 */
const hold = ref<number | null>(null)
/** what the server paid for the level just reached (shown in the celebration) */
const reward = ref<{ coins: number; stars: number } | null>(null)

export function setLevelReward(coins: number, stars: number) {
  reward.value = coins || stars ? { coins, stars } : null
}

export function useLevelUp() {
  const auth = useAuthStore()
  const level = computed(() => auth.user?.level ?? 1)
  const hasLevel = computed(() => !!auth.user)
  /** what the header badge shows */
  const shown = computed(() => hold.value ?? level.value)
  const playing = computed(() => hold.value !== null)

  return { level, hasLevel, shown, playing, hold, reward }
}
