import { createRouter, createWebHistory } from 'vue-router'
// only Home is in the first download; every other screen is its own file, fetched when it is opened (see prefetchScreens)
import HomeView from '../views/HomeView.vue'

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
      component: () => import('@/views/ShopView.vue'),
    },
    {
      path: '/shop/boosters',
      name: 'shop-boosters',
      component: () => import('@/views/BoostersView.vue'),
    },
    {
      path: '/games',
      name: 'games',
      component: () => import('@/views/GamesView.vue'),
    },
    {
      path: '/games/spin',
      name: 'games-spin',
      component: () => import('@/views/SpinView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/withdraw',
      name: 'withdraw',
      component: () => import('@/views/WithdrawView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/withdraw/history',
      name: 'withdraw-history',
      component: () => import('@/views/WithdrawalHistoryView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/games/roulette',
      name: 'games-roulette',
      component: () => import('@/views/ChestView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/games/ride',
      name: 'games-ride',
      component: () => import('@/views/RideView.vue'),
      meta: { hideNav: true },
    },
    {
      path: '/gifts',
      name: 'gifts',
      component: () => import('@/views/GiftsView.vue'),
    },
    {
      path: '/tournaments/:id',
      name: 'tournament',
      component: () => import('@/views/TournamentView.vue'),
    },
    {
      path: '/tasks',
      name: 'tasks',
      component: () => import('@/views/TasksView.vue'),
    },
    {
      path: '/level',
      name: 'level',
      component: () => import('@/views/LevelsView.vue'),
    },
    { path: '/levels', redirect: '/level' },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('@/views/FriendsView.vue'),
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

// natural pauses, the only places where an interstitial ad may follow: leaving a game, and moving between the screens of the bottom menu.
// It only shows when the admin switched it on and the gap since the last ad is over (see useInterstitial).
const GAME_ROUTES = new Set(['games-ride', 'games-spin', 'games-roulette'])
const MENU_ROUTES = new Set(['home', 'shop', 'games', 'tasks', 'friends'])
router.afterEach((to, from) => {
  const left = String(from.name ?? '')
  const next = String(to.name ?? '')
  if (!left || left === next) return
  const leftGame = GAME_ROUTES.has(left) && !GAME_ROUTES.has(next)
  const menuSwitch = MENU_ROUTES.has(left) && MENU_ROUTES.has(next)
  if (leftGame || menuSwitch) {
    setTimeout(() => void import('@/composables/useInterstitial').then((m) => m.maybeShowInterstitial()), 700)
  }
})

/** After the first screen has settled, quietly fetch the screens behind the bottom menu so they open instantly.
 *  Games with a heavy engine (Ride) are left out on purpose: they load when the player opens them. */
export function prefetchScreens() {
  const go = () => {
    void import('@/views/ShopView.vue')
    void import('@/views/GamesView.vue')
    void import('@/views/TasksView.vue')
    void import('@/views/FriendsView.vue')
  }
  const idle = (window as unknown as { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => void }).requestIdleCallback
  setTimeout(() => (idle ? idle(go, { timeout: 4000 }) : go()), 2500)
}

export default router
