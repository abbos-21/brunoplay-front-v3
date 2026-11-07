import 'virtual:uno.css'
import '@unocss/reset/tailwind-v4.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router, { prefetchScreens } from './router'
import { t, tn } from './i18n'
import { installSfx } from './composables/useSfx'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// `$t('text')` / `$tn('one|many', n)` in every template
app.config.globalProperties.$t = t
app.config.globalProperties.$tn = tn

installSfx()

// no zoom: iOS pinch gestures, double-tap zoom and ctrl+wheel (the viewport tag alone is not always obeyed)
for (const ev of ['gesturestart', 'gesturechange', 'gestureend']) {
  document.addEventListener(ev, (e) => e.preventDefault())
}
document.addEventListener('touchmove', (e) => { if (e.touches.length > 1) e.preventDefault() }, { passive: false })
document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault() }, { passive: false })
document.addEventListener('selectstart', (e) => {
  const t = e.target as HTMLElement | null
  if (!t?.closest?.('input, textarea, [contenteditable]')) e.preventDefault()
})

app.mount('#app')
prefetchScreens()
