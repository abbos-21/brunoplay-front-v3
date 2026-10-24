import client from './client';
import type { Tournament, LeaderboardResponse } from '@/types';

export function getTournaments() {
  return client.get<{ tournaments: Tournament[] | null }>('/tournaments').then((r) => r.data.tournaments ?? []);
}

export function joinTournament(id: number) {
  return client.post(`/tournaments/${id}/join`).then((r) => r.data);
}

export function getLeaderboard(tournamentId: number, page = 1) {
  return client.get<LeaderboardResponse>(`/tournaments/${tournamentId}/leaderboard`, { params: { page } }).then((r) => r.data);
}
