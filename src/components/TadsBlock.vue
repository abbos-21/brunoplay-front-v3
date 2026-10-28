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
    // TADS says nothing when it drew nothing, so look: no children in the container = no cards
    if (!box.childElementCount) return miss('shown, but the container is empty')
    reportInterstitial('shown', `tads-tgb ${b.widgetId}: ${box.childElementCount} element(s), debug=${b.debug}`)
  } catch (e) {
    miss(e instanceof Error ? e.message : String(e))
  }
})
</script>

<template>
  <div v-if="shown" class="tads-block">
    <div :id="containerId" />
  </div>
</template>

<style scoped>
.tads-block {
  margin: 0 0 12px;
  border-radius: 10px;
  overflow: hidden;
}
</style>
