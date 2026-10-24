import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Task, BonusAdStatus } from '@/types';
import * as tasksApi from '@/api/tasks';
import * as adsApi from '@/api/ads';
import { withAd } from '@/composables/useAds';
import { useAuthStore } from './auth';

export const useTasksStore = defineStore('tasks', () => {
  const tasks = ref<Task[]>([]);
  /** unfinished tasks the player has not looked at yet (the server counts them) */
  const newCount = ref(0);
  const bonus = ref<BonusAdStatus | null>(null);
  const isLoading = ref(false);

  const mainTasks = computed(() => tasks.value.filter((t) => t.category === 'MAIN'));
  const otherTasks = computed(() => tasks.value.filter((t) => t.category !== 'MAIN'));

  async function fetchTasks() {
    const data = await tasksApi.getTasks();
    tasks.value = data.tasks ?? [];
    newCount.value = data.newCount;
  }

  /** The player has seen the list: the NEW tags and the menu badge go away. */
  async function markSeen() {
    if (!newCount.value) return;
    newCount.value = 0;
    try {
      await tasksApi.markTasksSeen();
    } catch {
      // the badge simply comes back at the next refresh
    }
  }

  /** Link tasks: starts the timer the check relies on. */
  async function openTask(taskId: number) {
    try {
      await tasksApi.openTask(taskId);
    } catch {
      // not needed for every type; the check tells the player what is missing
    }
  }

  async function finish(result: Awaited<ReturnType<typeof tasksApi.checkTask>>) {
    if (result.completed) await useAuthStore().fetchUser();
    await fetchTasks();
    return result;
  }

  async function checkTask(taskId: number) {
    isLoading.value = true;
    try {
      return await finish(await tasksApi.checkTask(taskId));
    } finally {
      isLoading.value = false;
    }
  }

  /** "Watch N ads" tasks: each ad counts one step. */
  async function watchTaskAd(taskId: number) {
    isLoading.value = true;
    try {
      return await finish(await withAd('TASK_ADS', (id) => tasksApi.taskAdProgress(taskId, id!)));
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchBonus() {
    bonus.value = await adsApi.getBonusAd();
  }

  /** The bonus ad card: a few coins for one ad, a limited number of times a day. */
  async function claimBonus() {
    isLoading.value = true;
    try {
      const r = await withAd('BONUS_COINS', (id) => adsApi.claimBonusAd(id!));
      useAuthStore().updateUser({ coins: r.newBalance });
      await fetchBonus();
      return r;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    tasks, mainTasks, otherTasks, newCount, bonus, isLoading,
    fetchTasks, markSeen, openTask, checkTask, watchTaskAd, fetchBonus, claimBonus,
  };
});
