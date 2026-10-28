<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { t } from '@/i18n'
import { claimSponsoredTask } from '@/api/ads'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { loadSdk } from '@/composables/useAds'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import { markSponsoredSeen, markSponsoredUnavailable } from '@/composables/sponsoredAlert'

/**
 * The sponsored task (Adsgram Task block): Adsgram's own element shows a task ("join this channel", "open this app").
 * When the player finishes it, Adsgram calls our server; the reward is claimed only after that call has arrived, so the
 * "reward" event of the element alone proves nothing. The coins and the daily limit come from the admin panel (ads.task.*).
 * The look copies Adsgram's own example banner of the Task block (partner.adsgram.ai, dark theme): a 340px card, 6px padding, a 50px
 * icon, the title (14px / 500), the reward line (12px / 500, grey) and a text button "Go" (14px / 600, light blue) on the right.
 */
const toast = useToast()
const auth = useAuthStore()
const el = ref<HTMLElement | null>(null)
const ready = ref(false) // the Adsgram script (which defines the element) is loaded
const hidden = ref(false) // Adsgram has no task for this player now, or failed
const task = computed(() => adsConfig.value?.task)
const visible = computed(() => ready.value && !hidden.value && !!task.value?.enabled && (task.value?.left ?? 0) > 0)

onMounted(async () => {
  const cfg = await fetchAdsConfig(true)
  if (!cfg?.task.enabled) return
  try {
    await loadSdk()
    ready.value = true
  } catch {
    hidden.value = true
  }
})

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let claiming = false

async function onReward() {
  if (claiming) return
  claiming = true
  try {
    for (let attempt = 0; ; attempt++) {
      try {
        const r = await claimSponsoredTask()
        auth.updateUser({ coins: r.newBalance })
        toast.show(t('Done! You got {text}', { text: t('{n} coins', { n: r.coins }) }), 'success')
        return
      } catch (e) {
        // Adsgram's call to our server may still be on its way
        if (apiCode(e) === 'AD_NOT_COMPLETED' && attempt < 15) {
          await wait(800)
          continue
        }
        throw e
      }
    }
  } catch (e) {
    toast.show(apiMessage(e, 'Could not get the reward'), 'error')
  } finally {
    claiming = false
    void fetchAdsConfig(true)
  }
}

const hide = () => {
  hidden.value = true
  markSponsoredUnavailable() // no task from Adsgram now: nothing to announce on the Tasks tab
}

// seeing the card puts the badge on the Tasks tab away until the next launch
watch(visible, (yes) => yes && markSponsoredSeen(), { immediate: true })

watch(el, async (node) => {
  if (!node) return
  await nextTick()
  node.addEventListener('reward', onReward)
  for (const ev of ['onBannerNotFound', 'onError', 'onTooLongSession']) node.addEventListener(ev, hide)
})
</script>

<template>
  <!-- the slot="..." attributes below are the web component's own slots (Adsgram), not Vue 2 slots -->
  <!-- eslint-disable vue/no-deprecated-slot-attribute -->
  <article v-if="visible && task" class="card">
    <adsgram-task :data-block-id="task.blockId" ref="el" class="sponsored">
      <span slot="reward" class="reward">{{ $t('{n} coins', { n: task.coins.toLocaleString('en-US') }) }}</span>
      <div slot="button" class="btn">{{ $t('Go') }}</div>
      <div slot="claim" class="btn">{{ $t('Claim') }}</div>
      <div slot="done" class="btn done">{{ $t('Done ✓') }}</div>
    </adsgram-task>
  </article>
</template>

<style scoped>
/* values read from the example banner on partner.adsgram.ai (dark theme) */
.card {
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 6px;
  background: rgb(11, 13, 14);
  border: 0.8px solid rgb(50, 56, 62);
  border-radius: 10px;
  color: rgb(240, 244, 248);
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.sponsored {
  display: block;
  color: rgb(240, 244, 248);
  font-weight: 500;
  line-height: 20px;
  --adsgram-task-font-size: 14px;
  --adsgram-task-icon-size: 50px;
  --adsgram-task-icon-border-radius: 6px;
  --adsgram-task-icon-title-gap: 6px;
  --adsgram-task-button-width: 48px;
}
.reward {
  display: block;
  color: rgb(159, 166, 173);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.btn {
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: fit-content;
  min-height: 32px;
  margin-left: auto;
  padding: 4px 12px;
  border-radius: 8px;
  color: rgb(151, 195, 240);
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  white-space: nowrap;
  cursor: pointer;
}
.done {
  color: rgb(159, 166, 173);
  cursor: default;
}
</style>
