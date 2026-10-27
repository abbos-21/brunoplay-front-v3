<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { t } from '@/i18n'
import { CoinImage } from '@/assets/images'
import { claimSponsoredTask } from '@/api/ads'
import { apiCode } from '@/api/client'
import { apiMessage } from '@/composables/apiError'
import { useToast } from '@/composables/useToast'
import { useAuthStore } from '@/stores/auth'
import { loadSdk } from '@/composables/useAds'
import { adsConfig, fetchAdsConfig } from '@/composables/useInterstitial'

/**
 * The sponsored task (Adsgram Task block): Adsgram's own element shows a task ("join this channel", "open this app").
 * When the player finishes it, Adsgram calls our server; the reward is claimed only after that call has arrived, so the
 * "reward" event of the element alone proves nothing. The coins and the daily limit come from the admin panel (ads.task.*).
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
}

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
  <article
    v-if="visible && task"
    class="shrink-0 rounded-3xl border-2 border-[#cf8741] bg-[#fff4d6] p-3 shadow-[0px_4px_4px_rgba(0,0,0,0.25)]"
  >
    <p class="mb-1 font-extrabold uppercase leading-none tracking-wide text-[#8a5a2b] text-[0.65rem]">{{ $t('Sponsored') }}</p>
    <adsgram-task :data-block-id="task.blockId" ref="el" class="sponsored">
      <span slot="reward" class="reward">
        <img :src="CoinImage" alt="" class="size-[1.4em] object-contain" />+{{ task.coins.toLocaleString('en-US') }}
      </span>
      <div slot="button" class="btn go">{{ $t('Go') }}</div>
      <div slot="claim" class="btn claim">{{ $t('Claim') }}</div>
      <div slot="done" class="btn done">{{ $t('Completed ✓') }}</div>
    </adsgram-task>
  </article>
</template>

<style scoped>
.sponsored {
  display: block;
  color: #552a0f;
  font-weight: 700;
  --adsgram-task-font-size: clamp(0.9rem, 4.4vw, 1.15rem);
  --adsgram-task-icon-size: clamp(3rem, 15vw, 4rem);
  --adsgram-task-icon-border-radius: 1rem;
  --adsgram-task-button-width: auto;
}
.reward {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  border-radius: 9999px;
  border: 1px solid #e3b66f;
  background: #fde7b8;
  padding: 0.1rem 0.6rem 0.1rem 0.25rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
}
.btn {
  border-radius: 9999px;
  padding: 0.25rem 0.9rem;
  font-weight: 700;
  white-space: nowrap;
  color: #fff;
  text-align: center;
  font-size: clamp(0.82rem, 4.1vw, 1.15rem);
}
.go {
  border: 1px solid #0a6ea8;
  background: #0e89d4;
}
.claim {
  border: 1px solid #15861b;
  background: #1fb826;
}
.done {
  background: transparent;
  color: #1f6a05;
  font-weight: 800;
}
</style>
