import { computed, ref } from 'vue'
import { useTasksStore } from '@/stores/tasks'

/**
 * "A new task is waiting": the Tasks tab shows a badge while there is an unfinished task the player has not
 * looked at yet. A task counts as looked at once the Tasks page has been opened while it was in the list.
 * (What was seen is remembered on the phone.)
 */
const KEY = 'seenTasks'

function load(): number[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]')
    return Array.isArray(raw) ? raw.filter((n) => typeof n === 'number') : []
  } catch {
    return []
  }
}

const seen = ref<number[]>(load())

export function useTaskAlerts() {
  const tasks = useTasksStore()

  /** every unfinished task right now */
  const pendingIds = computed(() => {
    const all = [...tasks.mainTasks, ...tasks.otherTasks]
    return all.filter((t) => t.isActive && !t.isCompleted).map((t) => t.id)
  })

  const hasNew = computed(() => pendingIds.value.some((id) => !seen.value.includes(id)))

  /** the player has looked at these tasks */
  function markSeen(ids: number[]) {
    const merged = [...new Set([...seen.value, ...ids])]
    if (merged.length === seen.value.length) return
    seen.value = merged
    try {
      localStorage.setItem(KEY, JSON.stringify(merged))
    } catch {
      // private mode: the badge simply comes back next time
    }
  }

  function isSeen(id: number) {
    return seen.value.includes(id)
  }

  return { pendingIds, hasNew, markSeen, isSeen }
}
