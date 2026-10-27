import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import vueDevTools from 'vite-plugin-vue-devtools'

import UnoCSS from 'unocss/vite'
import svgLoader from 'vite-svg-loader'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag === 'adsgram-task' } } }), vueJsx(), UnoCSS(), svgLoader()],
  server: {
    // talk to the local v4 backend (brunoplay-back-v4) without CORS; VITE_BACKEND points it somewhere else
    proxy: { '/api': process.env.VITE_BACKEND ?? 'http://localhost:8080' },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    // phones with an old system web view (Chrome 80 and up) still run the game
    target: ['es2020', 'chrome80', 'safari13'],
    cssTarget: 'chrome80',
    // never inline pictures as text inside the scripts: files are cached by the browser and decoded only when shown
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // the shared libraries change rarely: one file the phone keeps in its cache across game updates
        manualChunks(id) {
          if (!id.includes('node_modules')) return
          if (/node_modules[\\/](vue|@vue|pinia|vue-router|axios)[\\/]/.test(id)) return 'vendor'
          if (id.includes('lottie-web')) return 'lottie'
        },
      },
    },
  },
})
