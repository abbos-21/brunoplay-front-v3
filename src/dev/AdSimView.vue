<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import SponsoredTask from '@/components/SponsoredTask.vue'
import { markAuthReady } from '@/composables/authReady'
import { fetchAdsConfig, resetAdsConfig } from '@/composables/useInterstitial'
import { announceSponsored, resetSponsoredAlert, sponsoredLeft, sponsoredWaiting } from '@/composables/sponsoredAlert'
import { defineFakeElement, installFakeServer, sim, simLog, type Scenario } from './adSim'

/**
 * DEVELOPMENT ONLY (/dev/ad-sim, not in the production build). The real sponsored task card, with a pretend Adsgram element
 * and a pretend server. Pick a situation, press Go / Claim in the card and watch what the card and the server do.
 */
const w = window as unknown as { Adsgram?: unknown }
const hadSdk = !!w.Adsgram
if (!hadSdk) w.Adsgram = { init: () => ({ show: () => Promise.resolve({}) }) } // so the card does not download the real script
defineFakeElement()
markAuthReady()
const restore = installFakeServer()
resetAdsConfig() // a request made before the pretend server was in place must not answer for it
onBeforeUnmount(() => {
  restore()
  if (!hadSdk) delete w.Adsgram
})

const cardKey = ref(0)
const scenarios: { key: Scenario; label: string }[] = [
  { key: 'normal', label: 'Normal: Adsgram calls the server 1.5 s after Claim' },
  { key: 'slow', label: 'Slow: Adsgram calls the server 6 s after Claim (the card keeps asking)' },
  { key: 'never', label: 'Never: Adsgram does not call the server (the player gets an error)' },
  { key: 'nobanner', label: 'Adsgram has no task for this player (the card hides)' },
  { key: 'error', label: 'Adsgram fails (the card hides)' },
]

async function reload() {
  await fetchAdsConfig(true)
  cardKey.value++
  simLog('card reloaded (like opening the Tasks screen again)')
}
function newDay() {
  sim.used = 0
  sim.pending = 0
  simLog('new game day: the counters are reset')
  void reload()
}
function launch() {
  resetSponsoredAlert()
  simLog('app launch: the toast and the badge are checked')
  void announceSponsored()
}
</script>

<template>
  <div class="fixed inset-0 z-[80] overflow-y-auto bg-white p-4 text-sm text-black">
    <h1 class="mb-3 text-lg font-bold">Sponsored task: simulator (development only)</h1>

    <div class="flex flex-wrap items-start gap-6">
      <!-- the phone: how the Tasks screen looks -->
      <div class="w-[360px] shrink-0 rounded-2xl bg-shop p-4 shadow">
        <p class="mb-2 text-center font-bold text-[#552a0f]">Tasks · Main</p>
        <div class="flex flex-col gap-4">
          <SponsoredTask :key="cardKey" />
          <article class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]">
            <h2 class="font-bold leading-tight text-[#552a0f]">Join the BrunoPlay channel (one of our own tasks)</h2>
            <p class="mt-0.5 text-[#8a5a2b]">The sponsored card is above it.</p>
          </article>
        </div>
      </div>

      <!-- the controls -->
      <div class="min-w-[300px] max-w-[520px] flex-1">
        <fieldset class="mb-3 rounded border p-2">
          <legend class="px-1 font-bold">Situation</legend>
          <label v-for="s in scenarios" :key="s.key" class="flex items-start gap-2 py-0.5">
            <input v-model="sim.scenario" type="radio" :value="s.key" class="mt-1" @change="reload" />
            <span>{{ s.label }}</span>
          </label>
        </fieldset>

        <div class="mb-3 grid grid-cols-2 gap-2">
          <label>Reward (coins)<input v-model.number="sim.coins" type="number" min="1" class="ml-1 w-24 rounded border px-1" @change="reload" /></label>
          <label>Per day<input v-model.number="sim.perDay" type="number" min="1" class="ml-1 w-16 rounded border px-1" @change="reload" /></label>
          <label>Already done today<input v-model.number="sim.used" type="number" min="0" class="ml-1 w-16 rounded border px-1" @change="reload" /></label>
          <label>"Go" step takes (s)<input v-model.number="sim.goSeconds" type="number" min="0" class="ml-1 w-16 rounded border px-1" /></label>
        </div>

        <div class="mb-3 flex flex-wrap gap-2">
          <button class="rounded border bg-gray-100 px-3 py-1" @click="reload">Reload the card</button>
          <button class="rounded border bg-gray-100 px-3 py-1" @click="newDay">New game day</button>
          <button class="rounded border bg-gray-100 px-3 py-1" @click="launch">Simulate app launch (toast + badge)</button>
        </div>

        <p class="mb-3 rounded bg-gray-100 p-2">
          Balance: <b>{{ sim.balance.toLocaleString('en-US') }}</b> coins ·
          left today: <b>{{ sponsoredLeft }}</b> ·
          badge on the Tasks tab: <b>{{ sponsoredWaiting ? 'YES (red dot)' : 'no' }}</b> ·
          completions waiting for a claim on the server: <b>{{ sim.pending }}</b>
        </p>

        <h2 class="mb-1 font-bold">What happens</h2>
        <ol class="h-56 overflow-y-auto rounded border bg-gray-50 p-2 font-mono text-xs">
          <li v-for="(l, i) in sim.log" :key="i">{{ l }}</li>
          <li v-if="!sim.log.length" class="text-gray-400">Nothing yet.</li>
        </ol>
      </div>
    </div>
  </div>
</template>
