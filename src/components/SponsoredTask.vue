<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { t } from '@/i18n'
import { claimSponsoredTask } from '@/api/ads'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { loadSdk } from '@/composables/useAds'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import PendingDot from '@/components/PendingDot.vue'
import { markSponsoredPaid, markSponsoredReal, markSponsoredSeen, markSponsoredUnavailable } from '@/composables/sponsoredAlert'

/**
 * The sponsored task (Adsgram Task block): Adsgram's own element shows a task ("join this channel", "open this app").
 * When the player finishes it, Adsgram calls our server; the reward is claimed only after that call has arrived, so the
 * "reward" event of the element alone proves nothing. The coins and the daily limit come from the admin panel (ads.task.*).
 * The look copies Adsgram's own example banner of the Task block (partner.adsgram.ai, light theme): a 340px card, 6px padding, a 50px
 * icon, the title (14px / 500), the reward line (12px / 500, grey) and a text button "Go" (14px / 600, light blue) on the right.
 */
const toast = useToast()
const auth = useAuthStore()
const host = ref<HTMLElement | null>(null)
const confirmed = ref(false) // the card has stayed up for a moment without a "no task" signal: a real task is showing
const CONFIRM_MS = 2500
const ready = ref(false) // the Adsgram script (which defines the element) is loaded
const hidden = ref(false) // Adsgram has no task for this player now, or failed
const task = computed(() => adsConfig.value?.task)
const visible = computed(() => ready.value && !hidden.value && !!task.value?.enabled && !!task.value?.available)

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
        markSponsoredPaid()
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
  confirmed.value = false
  markSponsoredUnavailable() // no task from Adsgram now: nothing to announce on the Tasks tab
}

// seeing the card puts the badge on the Tasks tab away until the next launch
watch(visible, (yes) => yes && markSponsoredSeen(), { immediate: true })

/** a piece of the card that Adsgram's element places in one of its slots (reward, button, claim, done) */
function slotPart(tag: string, cls: string, slot: string, text: string): HTMLElement {
  const part = document.createElement(tag)
  part.setAttribute('slot', slot)
  part.className = cls
  part.textContent = text
  return part
}

/**
 * The <adsgram-task> element is built here, not in the template: Adsgram sends "no banner" (onBannerNotFound) the moment it starts when it
 * has no task, and a listener added after the element is on the page misses it (the card then stayed an empty placeholder with its "!").
 * So every listener is attached BEFORE the element is put on the page.
 */
watch(host, (h) => {
  const tk = task.value
  if (!h || !tk) return
  const node = document.createElement('adsgram-task')
  node.setAttribute('data-block-id', tk.blockId)
  node.className = 'sponsored'
  node.append(
    slotPart('span', 'reward', 'reward', t('{n} coins', { n: tk.coins.toLocaleString('en-US') })),
    slotPart('div', 'btn', 'button', t('Go')),
    slotPart('div', 'btn', 'claim', t('Claim')),
    slotPart('div', 'btn done', 'done', t('Done')),
  )
  node.addEventListener('reward', onReward)
  for (const ev of ['onBannerNotFound', 'onError', 'onTooLongSession']) node.addEventListener(ev, hide)
  h.replaceChildren(node)
  confirmed.value = false
  window.setTimeout(() => {
    if (hidden.value || host.value !== h) return
    confirmed.value = true
    markSponsoredReal()
  }, CONFIRM_MS)
})
</script>

<template>
  <article v-if="visible && task" class="card">
    <PendingDot v-if="confirmed" />
    <div ref="host" />
  </article>
</template>

<style scoped>
/* values read from the example banner on partner.adsgram.ai (light theme) */
.card {
  position: relative; /* the red "!" sits on its corner */
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 6px;
  background: rgb(251, 252, 254);
  border: 0.8px solid rgb(205, 215, 225);
  border-radius: 10px;
  color: rgb(23, 26, 28);
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.card :deep(.sponsored) {
  display: block;
  color: rgb(23, 26, 28);
  font-weight: 500;
  line-height: 20px;
  --adsgram-task-font-size: 14px;
  --adsgram-task-icon-size: 50px;
  --adsgram-task-icon-border-radius: 6px;
  --adsgram-task-icon-title-gap: 6px;
  --adsgram-task-button-width: 76px;
  /* a very long title from Adsgram: at most three lines and the reward line, the rest is cut, the card never grows beyond that */
  max-height: 80px;
  overflow: hidden;
}
.card :deep(.reward) {
  display: block;
  color: rgb(99, 107, 116);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.card :deep(.btn) {
  display: block;
  box-sizing: border-box;
  width: fit-content;
  max-width: 100%;
  margin-left: auto;
  padding: 4px 8px;
  text-align: center;
  border-radius: 8px;
  color: rgb(11, 107, 203);
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden; /* a long label (translations) ends with "…" instead of leaving the card */
  text-overflow: ellipsis;
  cursor: pointer;
}
.card :deep(.done) {
  color: #16a34a;
  cursor: default;
}
</style>
