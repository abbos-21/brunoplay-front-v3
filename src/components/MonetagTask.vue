<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { t } from '@/i18n'
import { preparePopupTask } from '@/api/ads'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import { loadMonetag, notFromTap, openMonetagPopup } from '@/composables/monetagPlayer'
import { claimAfterTap, claimConfirmed, popupAborted, popupLeftMs, popupProgress, popupSoon, popupStarted, popupTask, type PopupHandlers } from '@/composables/popupTask'

/**
 * The popup task (Monetag Rewarded Popup): a card "open a partner offer". The tap opens the advertiser's page outside the game.
 * The browser only allows that inside a tap, so the SDK and the proof (asked from our server) are ready BEFORE the tap and the tap
 * calls Monetag at once. Monetag then calls our server (postback); the coins are claimed only after that call has arrived (and the
 * wait set in the admin panel is over), so a tap alone proves nothing. While it is confirmed the card counts down, and the check
 * goes on even if the player opens another section (the state is in composables/popupTask.ts). The coins and the interval come
 * from the admin panel.
 */
const SOON_MS = 8000 // how long a late postback is still awaited after Monetag reported a problem
const toast = useToast()
const auth = useAuthStore()
const task = computed(() => adsConfig.value?.popupTask)
const visible = computed(() => !!task.value?.enabled && (popupTask.busy || !!task.value.available) && !!popupTask.show && !!popupTask.proof)
const secondsLeft = computed(() => Math.ceil(popupLeftMs() / 1000))
const progress = computed(() => `${Math.round(popupProgress() * 100)}%`)

const handlers: PopupHandlers = {
  paid(r) {
    auth.updateUser({ coins: r.newBalance })
    toast.show(t('Done! You got {text}', { text: t('{n} coins', { n: r.coins }) }), 'success')
    void fetchAdsConfig(true) // the card goes away until the next interval
  },
  failed(e) {
    toast.show(apiMessage(e, 'Could not get the reward'), 'error')
    void fetchAdsConfig(true)
  },
  timedOut() {
    toast.show(t('The offer was not confirmed. Tap Go to try again'), 'error')
  },
}

/** the tap: everything the browser needs for the popup is called right here, before any await */
function onTap() {
  const fn = popupTask.show
  const id = popupTask.proof
  if (popupTask.busy || !fn || !id) return
  popupStarted(task.value?.waitSeconds ?? 0)
  let opened: Promise<string | undefined>
  try {
    opened = openMonetagPopup(fn, id)
  } catch (e) {
    opened = Promise.reject(e)
  }
  opened.then(
    (kind) => {
      if (kind && kind !== 'valued') popupSoon(SOON_MS) // an unpaid open: nothing is coming
    },
    (e) => {
      // "not from a tap" is final. Any other error means the offer did not open (or Monetag could not confirm it): only a postback
      // that is already on its way can still pay, so the card gives up soon instead of keeping the player waiting
      if (notFromTap(e)) {
        popupAborted()
        toast.show(t('Could not open the offer, try again'), 'error')
      } else popupSoon(SOON_MS)
    },
  )
  void claimAfterTap(id, handlers)
}

onMounted(async () => {
  const cfg = await fetchAdsConfig(true)
  const pt = cfg?.popupTask
  if (popupTask.busy) return // the offer is being confirmed (the player left this screen and came back): just show it
  if (!pt?.enabled || !pt.available || !pt.zoneId) return
  try {
    popupTask.show = await loadMonetag(pt.zoneId)
    const p = await preparePopupTask()
    popupTask.proof = p.adViewId
    if (p.completed) {
      // Monetag already confirmed it (the page was reloaded or left): only the claim is left
      popupStarted(0)
      void claimConfirmed(p.adViewId, handlers)
    }
  } catch {
    // no SDK or no proof: the card simply stays away
  }
})
</script>

<template>
  <article v-if="visible && task" class="card">
    <div class="icon" aria-hidden="true">🎁</div>
    <div class="text">
      <div class="title">{{ t('Open a partner offer') }}</div>
      <div v-if="!popupTask.busy" class="reward">{{ t('{n} coins', { n: task.coins.toLocaleString('en-US') }) }}</div>
      <div v-else class="reward busy">
        {{ secondsLeft > 0 ? t('{n} s left, the coins arrive by themselves', { n: secondsLeft }) : t('Confirming with the partner…') }}
      </div>
    </div>
    <button type="button" class="btn" :disabled="popupTask.busy" @click="onTap">{{ popupTask.busy ? t('Checking…') : t('Go') }}</button>
    <div v-if="popupTask.busy" class="bar" aria-hidden="true"><span :style="{ width: progress }" /></div>
  </article>
</template>

<style scoped>
/* the same card as the sponsored task: 6px padding, light background, a 50px icon, the title (14px / 500), the reward line (12px / grey) */
.card {
  position: relative; /* the progress bar sits on the bottom edge */
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 6px;
  overflow: hidden;
  background: rgb(251, 252, 254);
  border: 0.8px solid rgb(205, 215, 225);
  border-radius: 10px;
  color: rgb(23, 26, 28);
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}
.icon {
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 6px;
  background: rgb(232, 240, 250);
  font-size: 28px;
}
.text {
  flex: 1;
  min-width: 0;
}
.title {
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
}
.reward {
  color: rgb(99, 107, 116);
  font-size: 12px;
  font-weight: 500;
  line-height: 18px;
}
.reward.busy {
  color: rgb(11, 107, 203);
}
.btn {
  flex: none;
  max-width: 40%;
  padding: 4px 8px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: rgb(11, 107, 203);
  font-size: 14px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
}
.btn:disabled {
  color: rgb(99, 107, 116);
  cursor: default;
}
.bar {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 3px;
  background: rgb(222, 229, 238);
}
.bar span {
  display: block;
  height: 100%;
  background: rgb(11, 107, 203);
  transition: width 0.3s linear;
}
</style>
