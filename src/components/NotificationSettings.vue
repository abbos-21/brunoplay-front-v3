<script setup lang="ts">
import { onMounted, ref } from 'vue'
import client from '@/api/client'
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

function toggle(c: Cat) {
  if (!prefs.value || c.mandatory) return
  const off = prefs.value.categories.filter((x) => !x.mandatory && (x.key === c.key ? c.on : !x.on)).map((x) => x.key)
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
  <div v-if="prefs" class="mt-3 rounded-2xl border border-[#cf8741] bg-[#fde7b8] px-4 py-2.5 text-[#552a0f]">
    <div class="flex items-center justify-between gap-3">
      <span class="font-bold leading-tight text-[length:clamp(0.9rem,4.3vw,1.125rem)]">{{ $t('Bot notifications') }}</span>
      <button
        type="button"
        role="switch"
        :aria-checked="!prefs.allOff"
        :disabled="busy"
        class="relative block h-7 w-12 shrink-0 rounded-full transition-colors shadow-[inset_0px_2px_3px_rgba(0,0,0,0.3)]"
        :class="!prefs.allOff ? 'bg-[#1fb826]' : 'bg-[#c9a97d]'"
        @click="save({ allOff: !prefs.allOff })"
      >
        <span
          class="absolute left-0.5 top-0.5 block size-6 rounded-full bg-white shadow-[0px_2px_3px_rgba(0,0,0,0.35)] transition-transform duration-200"
          :class="!prefs.allOff ? 'translate-x-5' : 'translate-x-0'"
        />
      </button>
    </div>

    <button
      v-if="!prefs.botStarted || prefs.botBlocked"
      type="button"
      class="mt-2 w-full rounded-full border border-[#0a6ea8] bg-[#0e89d4] py-1.5 font-bold text-white"
      @click="openBot"
    >
      {{ prefs.botBlocked ? $t('Unblock the bot to get messages') : $t('Press Start in the bot to get messages') }}
    </button>

    <ul v-if="!prefs.allOff" class="mt-2 flex flex-col gap-1">
      <li v-for="c in prefs.categories" :key="c.key" class="flex items-center justify-between gap-2">
        <span class="text-[length:clamp(0.8rem,3.9vw,1rem)]">{{ c.name }}</span>
        <input
          type="checkbox"
          :checked="c.on"
          :disabled="busy || c.mandatory"
          class="size-5 accent-[#1fb826]"
          :aria-label="c.name"
          @change="toggle(c)"
        />
      </li>
    </ul>
  </div>
</template>
