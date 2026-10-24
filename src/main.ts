import 'virtual:uno.css'
import '@unocss/reset/tailwind-v4.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { t, tn } from './i18n'
import { installSfx } from './composables/useSfx'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// `$t('text')` / `$tn('one|many', n)` in every template
app.config.globalProperties.$t = t
app.config.globalProperties.$tn = tn

installSfx()

app.mount('#app')
