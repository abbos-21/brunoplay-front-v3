# brunoplay-front-v3

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur).

## Recommended Browser Setup

- Chromium-based browsers (Chrome, Edge, Brave, etc.):
  - [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
  - [Turn on Custom Object Formatter in Chrome DevTools](http://bit.ly/object-formatters)
- Firefox:
  - [Vue.js devtools](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
  - [Turn on Custom Object Formatter in Firefox DevTools](https://fxdx.dev/firefox-devtools-custom-object-formatters/)

## Type Support for `.vue` Imports in TS

TypeScript cannot handle type information for `.vue` imports by default, so we replace the `tsc` CLI with `vue-tsc` for type checking. In editors, we need [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) to make the TypeScript language service aware of `.vue` types.

## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

## Running against the v4 backend

```sh
# 1. backend (brunoplay-back-v4): DEV_AUTH=true, see its README; optional test numbers:
#    ADMIN_PASSWORD=... node ../brunoplay-back-v4/scripts/dev-seed.mjs http://localhost:8080 you@example.com
# 2. this app
cp .env.example .env.development.local
npm run dev
```

What talks to the server: `src/api/*` (one file per area), `src/stores/*` (state), `src/composables/useAds.ts` (Adsgram
rewarded ads), `useTonConnect.ts` (TON payments), `useAppGate.ts` (maintenance / reload / blocked screens).
Before going live: put the real address in `public/tonconnect-manifest.json` and serve the app over HTTPS.
