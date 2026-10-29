<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { t } from '@/i18n'
import { claimPopupTask, preparePopupTask } from '@/api/ads'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'
import { loadMonetag, notFromTap, openMonetagPopup, type MonetagShow } from '@/composables/monetagPlayer'

/**
 * The popup task (Monetag Rewarded Popup): a card "open a partner offer". The tap opens the advertiser's page outside the game.
 * The browser only allows that inside a tap, so the SDK and the proof (asked from our server) are ready BEFORE the tap and the tap
 * calls Monetag at once. Monetag then calls our server (postback); the coins are claimed only after that call has arrived (and the
 * wait set in the admin panel is over), so a tap alone proves nothing. The coins and the interval come from the admin panel.
 */
const toast = useToast()
const auth = useAuthStore()
const show = shallowRef<MonetagShow | null>(null) // Monetag's function for the zone, loaded ahead of the tap
const proof = ref('') // the proof this tap will use
const busy = ref(false) // the offer was opened: waiting for Monetag's postback and claiming
const task = computed(() => adsConfig.value?.popupTask)
const visible = computed(() => !!task.value?.enabled && !!task.value.available && !!show.value && !!proof.value)

const CLAIM_EVERY_MS = 3000
const CLAIM_FOR_MS = 90_000 // after the tap
const CLAIM_BACK_MS = 45_000 // after the player came back to the game
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
let claimRun = 0 // only the newest claim loop goes on

/** Asks for the coins until Monetag's postback has arrived (AD_NOT_COMPLETED), for at most `forMs`. */
async function claim(id: string, forMs: number) {
  const run = ++claimRun
  const until = Date.now() + forMs
  try {
    while (run === claimRun) {
      try {
        const r = await claimPopupTask(id)
        auth.updateUser({ coins: r.newBalance })
        toast.show(t('Done! You got {text}', { text: t('{n} coins', { n: r.coins }) }), 'success')
        proof.value = ''
        void fetchAdsConfig(true) // the card goes away until the next interval
        return
      } catch (e) {
        if (apiCode(e) !== 'AD_NOT_COMPLETED') throw e
        if (Date.now() > until) {
          toast.show(t('We could not confirm the offer yet. Try again later'), 'error')
          return
        }
        await wait(CLAIM_EVERY_MS)
      }
    }
  } catch (e) {
    toast.show(apiMessage(e, 'Could not get the reward'), 'error')
    void fetchAdsConfig(true)
  } finally {
    if (run === claimRun) busy.value = false
  }
}

/** the tap: everything the browser needs for the popup is called right here, before any await */
function onTap() {
  const fn = show.value
  const id = proof.value
  if (busy.value || !fn || !id) return
  busy.value = true
  let opened: Promise<void>
  try {
    opened = openMonetagPopup(fn, id)
  } catch (e) {
    opened = Promise.reject(e)
  }
  opened.catch((e) => {
    // "not from a tap" is final; "failed to verify" can still be followed by the postback, so the claim loop goes on
    if (notFromTap(e)) {
      claimRun++ // stops the claim loop
      busy.value = false
      toast.show(t('Could not open the offer, try again'), 'error')
    }
  })
  void claim(id, CLAIM_FOR_MS)
}

// the player comes back from the offer page: look for the coins again for a while
function onVisible() {
  if (document.visibilityState === 'visible' && busy.value && proof.value) void claim(proof.value, CLAIM_BACK_MS)
}

onMounted(async () => {
  document.addEventListener('visibilitychange', onVisible)
  const cfg = await fetchAdsConfig(true)
  const pt = cfg?.popupTask
  if (!pt?.enabled || !pt.available || !pt.zoneId) return
  try {
    show.value = await loadMonetag(pt.zoneId)
    const p = await preparePopupTask()
    proof.value = p.adViewId
    if (p.completed) {
      busy.value = true // Monetag already confirmed it: only the claim is left
      void claim(p.adViewId, CLAIM_BACK_MS)
    }
  } catch {
    // no SDK or no proof: the card simply stays away
  }
})
onBeforeUnmount(() => {
  claimRun++
  document.removeEventListener('visibilitychange', onVisible)
})
</script>

<template>
  <article v-if="visible && task" class="card">
    <div class="icon" aria-hidden="true">🎁</div>
    <div class="text">
      <div class="title">{{ t('Open a partner offer') }}</div>
      <div class="reward">{{ t('{n} coins', { n: task.coins.toLocaleString('en-US') }) }}</div>
    </div>
    <button type="button" class="btn" :disabled="busy" @click="onTap">{{ busy ? t('Checking…') : t('Go') }}</button>
  </article>
</template>

<style scoped>
/* the same card as the sponsored task: 6px padding, light background, a 50px icon, the title (14px / 500), the reward line (12px / grey) */
.card {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  flex-shrink: 0;
  padding: 6px;
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
</style>
