<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import client from '@/api/client'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import { getTelegram } from '@/composables/useTelegram'
import { useToast } from '@/composables/useToast'
import { apiMessage } from '@/composables/apiError'

/**
 * Which bot messages the player wants. The bot can only write to someone who pressed Start in it once,
 * so while that has not happened the card offers to open the bot.
 */
const props = defineProps<{ botUsername?: string }>()

interface Cat { key: string; name: string; on: boolean; mandatory: boolean }
interface Prefs { allOff: boolean; categories: Cat[]; botStarted: boolean; botBlocked: boolean }

const toast = useToast()
const prefs = ref<Prefs | null>(null)
const busy = ref(false)

onMounted(async () => {
  try {
    prefs.value = (await client.get<Prefs>('/me/notifications')).data
  } catch {
    // the menu still works without it
  }
})

async function save(body: { allOff?: boolean; off?: string[] }) {
  if (busy.value) return
  busy.value = true
  try {
    prefs.value = (await client.patch<Prefs>('/me/notifications', body)).data
  } catch (e) {
    toast.show(apiMessage(e, 'Could not save'), 'error')
  } finally {
    busy.value = false
  }
}

const master = computed(() => !!prefs.value && !prefs.value.allOff)

function setMaster(on: boolean) {
  void save({ allOff: !on })
}

function setCategory(c: Cat, on: boolean) {
  if (!prefs.value || c.mandatory) return
  // the list of switched-off categories after this change
  const off = prefs.value.categories.filter((x) => !x.mandatory && (x.key === c.key ? !on : !x.on)).map((x) => x.key)
  void save({ off, allOff: false })
}

function openBot() {
  if (!props.botUsername) return
  const url = `https://t.me/${props.botUsername}?start=app`
  const tg = getTelegram()
  if (tg) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener')
}
</script>

<template>
  <section
    v-if="prefs"
    class="mt-3 w-full rounded-2xl border border-[#cf8741] bg-[#fde7b8] px-4 py-2.5 text-[#552a0f] shadow-[inset_0px_2px_2px_rgba(255,255,255,0.25),inset_0px_-2px_2px_rgba(0,0,0,0.25)]"
  >
    <div class="flex items-center gap-3">
      <span class="min-w-0 flex-1 text-left font-bold leading-tight text-[length:clamp(0.9rem,4.3vw,1.125rem)]">{{ $t('Bot notifications') }}</span>
      <ToggleSwitch :model-value="master" :disabled="busy" :label="$t('Bot notifications')" @update:model-value="setMaster" />
    </div>

    <button
      v-if="!prefs.botStarted || prefs.botBlocked"
      type="button"
      class="mt-2.5 w-full rounded-xl border border-[#0a6ea8] bg-[#0e89d4] px-3 py-1.5 text-center font-bold leading-tight text-white shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)] active:translate-y-px text-[length:clamp(0.8rem,3.9vw,1rem)]"
      @click="openBot"
    >
      {{ prefs.botBlocked ? $t('Unblock the bot to get messages') : $t('Press Start in the bot to get messages') }}
    </button>

    <ul v-if="master" class="mt-2 divide-y divide-[#cf8741]/30 border-t border-[#cf8741]/40">
      <li v-for="c in prefs.categories" :key="c.key" class="flex items-center justify-between gap-3 py-1.5">
        <span class="min-w-0 truncate font-semibold text-[length:clamp(0.8rem,3.9vw,1rem)]" :class="{ 'opacity-70': c.mandatory }">
          {{ c.name }}
          <span v-if="c.mandatory" class="ml-1 text-[0.75em] font-bold uppercase tracking-wide text-[#8a5a2b]">{{ $t('always on') }}</span>
        </span>
        <ToggleSwitch size="sm" :model-value="c.on" :disabled="busy || c.mandatory" :label="c.name" @update:model-value="(v) => setCategory(c, v)" />
      </li>
    </ul>
  </section>
</template>
