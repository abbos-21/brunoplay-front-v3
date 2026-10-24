import client from './client';
import type { Task, TaskCheckResult } from '@/types';

export function getTasks() {
  return client.get<{ tasks: Task[] | null; newCount: number }>('/tasks').then((r) => r.data);
}

/** The player has looked at the list: the NEW tags and the badge go away. */
export function markTasksSeen() {
  return client.post('/tasks/seen').then((r) => r.data);
}

/** Link tasks: starts the timer that the check later relies on. */
export function openTask(taskId: number) {
  return client.post(`/tasks/${taskId}/open`).then((r) => r.data);
}

export function checkTask(taskId: number) {
  return client.post<TaskCheckResult>(`/tasks/${taskId}/check`).then((r) => r.data);
}

export function taskAdProgress(taskId: number, adViewId: string) {
  return client.post<TaskCheckResult>(`/tasks/${taskId}/ad-progress`, { adViewId }).then((r) => r.data);
}
