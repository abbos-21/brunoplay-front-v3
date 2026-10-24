import client from './client';
import type { FriendsData } from '@/types';

/** Everything the Friends page shows in one call (stats, the list, reward tiers and the invite links). */
export function getFriends(page = 1) {
  return client.get<FriendsData>('/friends', { params: { page } }).then((r) => r.data);
}
