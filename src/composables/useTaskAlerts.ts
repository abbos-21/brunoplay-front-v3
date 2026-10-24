import { computed } from 'vue'
import { useTasksStore } from '@/stores/tasks'

/**
 * "A new task is waiting": the Tasks tab shows a badge while there is an unfinished task the player has not
 * looked at yet. The server keeps track of that (per player, across phones) and counts them in `newCount`.
 */
export function useTaskAlerts() {
  const tasks = useTasksStore()

  /** every unfinished task right now */
  const pendingIds = computed(() => tasks.tasks.filter((t) => t.isActive && !t.isCompleted).map((t) => t.id))

  const hasNew = computed(() => tasks.newCount > 0)

  /** the player has looked at the list */
  function markSeen(_ids?: number[]) {
    void tasks.markSeen()
  }

  function isSeen(id: number) {
    return !tasks.tasks.find((t) => t.id === id)?.isNew
  }

  return { pendingIds, hasNew, markSeen, isSeen }
}
