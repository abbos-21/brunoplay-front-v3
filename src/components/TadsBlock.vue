<script setup lang="ts">
import { computed, nextTick, onMounted, ref } from 'vue'
import { reportInterstitial } from '@/api/ads'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import { loadTadsSdk } from '@/composables/tadsPlayer'

/**
 * A block of ad cards (TADS "TGB" widget) inside the Tasks screen. Nothing is paid for it. It shows only when the admin put a TGB
 * widget id on the Ads page; when TADS has no ad it stays hidden. What happened is written to the server log (one line).
 */
const banner = computed(() => adsConfig.value?.banner)
const failed = ref(false)
const drawn = ref(false) // TADS has put its cards into the container: only then the card frame is shown
const DRAW_WAIT_MS = 6000
const shown = computed(() => !!banner.value?.enabled && !failed.value)
const containerId = computed(() => `tads-container-${banner.value?.widgetId ?? ''}`)

onMounted(async () => {
  const cfg = await fetchAdsConfig()
  const b = cfg?.banner
  if (!b?.enabled) return
  const miss = (why: string) => {
    failed.value = true
    reportInterstitial('failed', `tads-tgb ${b.widgetId}: ${why}`)
  }
  try {
    const g = await loadTadsSdk()
    await nextTick() // the container <div> is drawn only now (the config has just arrived)
    const box = document.getElementById(`tads-container-${b.widgetId}`)
    if (!box) return miss('container missing')
    const ctrl = g.init({
      widgetId: Number(b.widgetId),
      type: 'static',
      debug: b.debug,
      onClickReward: () => undefined, // nothing is paid for it
      onAdsNotFound: () => miss('No TADS ads'),
    })
    await ctrl.loadAd()
    await ctrl.showAd()
    // showAd() answers at once; TADS draws the cards a moment later, when its template has arrived. So wait for them (the
    // container must stay on the page meanwhile, TADS draws into it), and only then judge.
    for (let waited = 0; waited < DRAW_WAIT_MS; waited += 300) {
      if (box.childElementCount) {
        drawn.value = true
        reportInterstitial('shown', `tads-tgb ${b.widgetId}: ${box.childElementCount} card(s), debug=${b.debug}`)
        return
      }
      await new Promise((r) => setTimeout(r, 300))
    }
    miss(`nothing was drawn within ${DRAW_WAIT_MS / 1000} s`)
  } catch (e) {
    miss(e instanceof Error ? e.message : String(e))
  }
})
</script>

<template>
  <div v-if="shown" class="tads-block" :class="{ drawn }">
    <div :id="containerId" />
  </div>
</template>

<style scoped>
/* the Tasks list squeezes its children, so the block must keep its own height (the Adsgram card does the same) */
.tads-block {
  flex-shrink: 0;
  box-sizing: border-box;
}
/* the frame follows the Adsgram card: light card, thin border; TADS's own colours are for dark apps (white title) */
.tads-block.drawn {
  margin: 0 0 12px;
  padding: 6px;
  background: rgb(251, 252, 254);
  border: 0.8px solid rgb(205, 215, 225);
  border-radius: 10px;
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.tads-block :deep(div[id*='tads-container-']) {
  gap: 6px;
}
.tads-block :deep(.tads) {
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.tads-block :deep(.tads-image) {
  flex-shrink: 0;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  object-fit: cover;
}
.tads-block :deep(.tads-title) {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: rgb(23, 26, 28);
}
.tads-block :deep(.tads-text) {
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  color: rgb(99, 107, 116);
}
</style>
