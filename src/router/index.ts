import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ShopView from '@/views/ShopView.vue'
import GamesView from '@/views/GamesView.vue'
import TasksView from '@/views/TasksView.vue'
import FriendsView from '@/views/FriendsView.vue'
import BoostersView from '@/views/BoostersView.vue'
import SpinView from '@/views/SpinView.vue'
import RideView from '@/views/RideView.vue'
import ChestView from '@/views/ChestView.vue'
import WithdrawView from '@/views/WithdrawView.vue'
import WithdrawalHistoryView from '@/views/WithdrawalHistoryView.vue'
import LevelsView from '@/views/LevelsView.vue'
import GiftsView from '@/views/GiftsView.vue'
import TournamentView from '@/views/TournamentView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/shop',
      name: 'shop',
      component: ShopView,
    },
    {
      path: '/shop/boosters',
      name: 'shop-boosters',
      component: BoostersView,
    },
    {
      path: '/games',
      name: 'games',
      component: GamesView,
    },
    {
      path: '/games/spin',
      name: 'games-spin',
      component: SpinView,
      meta: { hideNav: true },
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: WithdrawView,
      meta: { hideNav: true },
    },
    {
      path: '/withdraw/history',
      name: 'withdraw-history',
      component: WithdrawalHistoryView,
      meta: { hideNav: true },
    },
    {
      path: '/games/roulette',
      name: 'games-roulette',
      component: ChestView,
      meta: { hideNav: true },
    },
    {
      path: '/games/ride',
      name: 'games-ride',
      component: RideView,
      meta: { hideNav: true },
    },
    {
      path: '/gifts',
      name: 'gifts',
      component: GiftsView,
    },
    {
      path: '/tournaments/:id',
      name: 'tournament',
      component: TournamentView,
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: TasksView,
    },
    {
      path: '/level',
      name: 'level',
      component: LevelsView,
    },
    { path: '/levels', redirect: '/level' },
    {
      path: '/friends',
      name: 'friends',
      component: FriendsView,
    },
    { path: '/:pathMatch(.*)*', redirect: '/' },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

export default router
