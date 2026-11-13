import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useGamesStore } from '@/stores/games'

/**
 * "A tournament is waiting": the Games tab shows the red "!" twice for every tournament, once when it appears (it is
 * announced, still SCHEDULED) and once when it starts (ACTIVE). Opening Games or the tournament clears the badge.
 * Kept per player on this phone: 0 = nothing seen yet, 1 = the announcement was seen, 2 = the start was seen too.
 * A tournament the player has already joined never raises the badge.
 */
const seen = ref<Record<number, number>>({})
let seenFor = ''

const key = (id: number) => `bp.tournamentsSeen.${id}`

function load(id: number) {
  if (seenFor === String(id)) return
  seenFor = String(id)
  try {
    seen.value = JSON.parse(localStorage.getItem(key(id)) || '{}')
  } catch {
    seen.value = {}
  }
}

export function useTournamentAlerts() {
  const auth = useAuthStore()
  const games = useGamesStore()

  const hasNew = computed(() => {
    if (auth.user) load(auth.user.id)
    return games.tournaments.some((t) => {
      if (t.joined) return false
      const level = seen.value[t.id] ?? 0
      return (t.status === 'SCHEDULED' && level < 1) || (t.status === 'ACTIVE' && level < 2)
    })
  })

  /** the player has looked at the tournaments: what is announced and what has started counts as seen */
  function markSeen() {
    if (!auth.user) return
    load(auth.user.id)
    const next = { ...seen.value }
    for (const t of games.tournaments) {
      const level = t.status === 'ACTIVE' ? 2 : t.status === 'SCHEDULED' ? 1 : 0
      if (level > (next[t.id] ?? 0)) next[t.id] = level
    }
    seen.value = next
    try {
      localStorage.setItem(key(auth.user.id), JSON.stringify(next))
    } catch {
      // private mode: the badge returns next time
    }
  }

  return { hasNew, markSeen }
}
