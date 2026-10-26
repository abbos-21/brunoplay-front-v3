import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'

// ids of the gifts the player has already seen on the My gifts screen (per player, kept on this phone)
const seen = ref<number[]>([])
let seenFor = ''
let lastFetch = 0

function key(id: number) {
  return `bp.giftsSeen.${id}`
}

function load(id: number) {
  if (seenFor === String(id)) return
  seenFor = String(id)
  try {
    seen.value = JSON.parse(localStorage.getItem(key(id)) || '[]')
  } catch {
    seen.value = []
  }
}

/**
 * "A new gift is waiting": the hamburger button and the My gifts row show the red "!" while there is a gift the player
 * has not looked at yet (the My gifts screen marks them as seen).
 */
export function useGiftAlerts() {
  const auth = useAuthStore()
  const games = useGamesStore()

  const newCount = computed(() => {
    if (auth.user) load(auth.user.id)
    return games.gifts.filter((g) => g.status === 'OWNED' && !seen.value.includes(g.id)).length
  })
  const hasNew = computed(() => newCount.value > 0)

  /** ask the server for the gifts (at most every 20 s, so every screen can call it) */
  async function refresh(force = false) {
    if (!auth.user || (!force && Date.now() - lastFetch < 20_000)) return
    lastFetch = Date.now()
    try {
      await games.fetchGifts()
    } catch {
      // the dot just stays as it was
    }
  }

  /** the player has looked at the list */
  function markSeen() {
    if (!auth.user) return
    load(auth.user.id)
    seen.value = games.gifts.map((g) => g.id)
    try {
      localStorage.setItem(key(auth.user.id), JSON.stringify(seen.value))
    } catch {
      // private mode: the dot returns next time
    }
  }

  return { hasNew, newCount, refresh, markSeen }
}
