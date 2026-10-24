<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { getAppInfo, updateSettings } from '@/api/user'
import { getTelegram } from '@/composables/useTelegram'
import { locale, setLocale, type Locale } from '@/i18n'
import { playSfx, setSfxEnabled, sfxEnabled } from '@/composables/useSfx'
import type { AppInfo } from '@/types'
import { ArrowLeftSVG } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import NotificationSettings from '@/components/NotificationSettings.vue'
import ToggleSwitch from '@/components/ToggleSwitch.vue'
import { GiftIcon } from '@/assets/icons'
import { useRouter } from 'vue-router'
import {
  ProfileImage,
  UkFlagImage,
  RuFlagImage,
  MusicBoxImage,
  SupportImage,
  NewsImage,
  FaqImage,
  MusicNextImage,
  MusicPauseImage,
  MusicPlayImage,
  MusicPrevImage,
} from '@/assets/images'

import { useMusic } from '@/composables/useMusic'

const { isPlaying, toggle } = useMusic()

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

// the player's Telegram profile picture (if Telegram shares it), else the default image
const photoUrl = ref(getTelegram()?.initDataUnsafe.user?.photo_url ?? '')

const auth = useAuthStore()
const router = useRouter()
const { user } = storeToRefs(auth)

// Support / News / FAQ links come from the server (/app-info)
const info = ref<AppInfo | null>(null)
onMounted(() => {
  getAppInfo()
    .then((i) => (info.value = i))
    .catch(() => {})
})

function openLink(url?: string) {
  if (!url) return
  const tg = getTelegram()
  if (tg && url.startsWith('https://t.me/')) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener')
}

// language: applied at once, remembered on the phone and saved on the server
const language = computed<Locale>(() => locale.value)
async function chooseLanguage(next: Locale) {
  if (next === locale.value) return
  setLocale(next)
  auth.updateUser({ language: next === 'ru' ? 'RU' : 'EN' })
  try {
    await updateSettings({ language: next === 'ru' ? 'RU' : 'EN' })
  } catch {
    // the choice still works here; the server copy is saved next time
  }
}
function onToggleSfx(on: boolean) {
  setSfxEnabled(on)
  if (on) playSfx('success')
}

function openGifts() {
  emit('update:modelValue', false)
  void router.push('/gifts')
}
const languages: { code: Locale; name: string; flag: string }[] = [
  { code: 'en', name: 'English', flag: UkFlagImage },
  { code: 'ru', name: 'Русский', flag: RuFlagImage },
]
</script>

<template>
  <div
    v-if="modelValue"
    class="absolute inset-0 bg-black/40 z-40"
    @click="emit('update:modelValue', false)"
  />
  <div
    class="absolute top-0 right-0 h-full w-[90%] z-50 transition-transform duration-300 ease-out py-1"
    :class="modelValue ? 'translate-x-0' : 'translate-x-full'"
  >
    <div class="bg-[#FBE166] flex flex-col h-full rounded-s-lg p-2">
      <button
        type="button"
        @click="emit('update:modelValue', false)"
        class="btn-orange w-10 h-10 p-2 rounded-full flex justify-center items-center"
      >
        <ArrowLeftSVG class="w-full" />
      </button>

      <div
        class="flex flex-col justify-between gap-3 text-[#552A0F] flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div class="flex flex-col items-center">
          <!-- <div class="border border-white w-20 h-20 rounded-full"></div> -->
          <img
            :src="photoUrl || ProfileImage"
            alt=""
            :class="photoUrl ? 'object-cover' : 'object-contain'"
            class="w-20 aspect-square rounded-full bg-white"
            referrerpolicy="no-referrer"
            @error="photoUrl = ''"
          />
          <h1 class="text-3xl font-bold mt-1">{{ user?.firstName }}</h1>
          <h1 class="text-lg font-bold">{{ $t('ID') }}: {{ user?.telegramId }}</h1>

          <div class="mt-4 grid w-full grid-cols-2 gap-2" role="radiogroup" :aria-label="$t('Language')">
            <button
              v-for="l in languages"
              :key="l.code"
              type="button"
              role="radio"
              :aria-checked="language === l.code"
              class="flex min-w-0 items-center justify-center gap-1.5 rounded-2xl border px-1.5 py-3 font-bold transition-colors active:translate-y-px"
              :class="
                language === l.code
                  ? 'border-[#d9680f] bg-[#f96a07] text-white shadow-[inset_0px_3px_3px_rgba(255,255,255,0.25),inset_0px_-3px_3px_rgba(0,0,0,0.2)]'
                  : 'border-[#cf8741] bg-[#fde7b8] text-[#552a0f] shadow-[inset_0px_2px_2px_rgba(255,255,255,0.25),inset_0px_-2px_2px_rgba(0,0,0,0.25)]'
              "
              @click="chooseLanguage(l.code)"
            >
              <img :src="l.flag" alt="" class="h-6 shrink-0" />
              <span class="min-w-0 truncate text-[length:clamp(0.85rem,4vw,1rem)]">{{ l.name }}</span>
            </button>
          </div>

          <div
            class="bg-[#fde7b8] border border-[#cf8741] w-full rounded-2xl p-3 flex justify-between items-center gap-2 mt-4"
            style="
              box-shadow:
                inset 0px 2px 2px rgba(255, 255, 255, 0.25),
                inset 0px -2px 2px rgba(0, 0, 0, 0.25);
            "
          >
            <div class="flex min-w-0 items-center gap-3">
              <img :src="MusicBoxImage" alt="" class="h-10 shrink-0" />
              <div class="flex min-w-0 flex-col items-start">
                <span class="whitespace-nowrap font-bold -mb-1 text-[length:clamp(1rem,4.6vw,1.125rem)]">{{ $t('Music') }} 1</span>
                <span class="max-w-full truncate font-bold text-[rgba(85,42,15,.7)] -mt-1 text-[length:clamp(0.8rem,3.7vw,1rem)]">{{ $t('Default') }}</span>
              </div>
            </div>

            <div class="flex shrink-0 gap-1 items-center">
              <button
                type="button"
                disabled
                class="w-7 h-7 sm:w-10 sm:h-10 flex justify-center items-center opacity-40"
              >
                <img :src="MusicPrevImage" alt="" class="w-full" />
              </button>

              <button
                type="button"
                @click="toggle"
                class="w-7 h-7 sm:w-10 sm:h-10 flex justify-center items-center cursor-pointer"
              >
                <img :src="MusicPauseImage" v-if="isPlaying" alt="" class="w-full" />
                <img :src="MusicPlayImage" v-else alt="" class="w-full" />
              </button>

              <button
                type="button"
                disabled
                class="w-7 h-7 sm:w-10 sm:h-10 flex justify-center items-center opacity-40"
              >
                <img :src="MusicNextImage" alt="" class="w-full" />
              </button>
            </div>
          </div>

          <button
            type="button"
            class="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#cf8741] bg-[#fde7b8] px-4 py-2.5 text-left font-bold text-[#552a0f] shadow-[inset_0px_2px_2px_rgba(255,255,255,0.25),inset_0px_-2px_2px_rgba(0,0,0,0.25)] active:translate-y-px"
            @click="openGifts"
          >
            <img :src="GiftIcon" alt="" class="size-7 shrink-0 object-contain" />
            <span class="min-w-0 flex-1 leading-tight text-[length:clamp(0.9rem,4.3vw,1.125rem)]">{{ $t('My gifts') }}</span>
            <svg class="w-4 shrink-0 text-[#c17e23]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
          </button>

          <div
            class="mt-3 flex w-full items-center gap-3 rounded-2xl border border-[#cf8741] bg-[#fde7b8] px-4 py-2.5 font-bold text-[#552a0f] shadow-[inset_0px_2px_2px_rgba(255,255,255,0.25),inset_0px_-2px_2px_rgba(0,0,0,0.25)]"
          >
            <span class="min-w-0 flex-1 text-left leading-tight text-[length:clamp(0.9rem,4.3vw,1.125rem)]">{{ $t('Sound effects') }}</span>
            <ToggleSwitch :model-value="sfxEnabled" :label="$t('Sound effects')" @update:model-value="onToggleSfx" />
          </div>

          <NotificationSettings :bot-username="info?.botUsername" />
        </div>

        <div class="w-full grid grid-cols-3 gap-2">
          <button
            type="button"
            :disabled="!info?.supportUrl"
            class="flex min-w-0 flex-col items-center p-2 disabled:opacity-50"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
            @click="openLink(info?.supportUrl)"
          >
            <img :src="SupportImage" :alt="$t('Support')" class="h-10" />
            <span class="max-w-full truncate font-bold text-[length:clamp(0.75rem,3.8vw,1.125rem)]">{{ $t('Support') }}</span>
          </button>

          <button
            type="button"
            :disabled="!info?.newsUrl"
            class="flex min-w-0 flex-col items-center p-2 disabled:opacity-50"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
            @click="openLink(info?.newsUrl)"
          >
            <img :src="NewsImage" :alt="$t('News')" class="h-10" />
            <span class="max-w-full truncate font-bold text-[length:clamp(0.75rem,3.8vw,1.125rem)]">{{ $t('News') }}</span>
          </button>

          <button
            type="button"
            :disabled="!info?.faqUrl"
            class="flex min-w-0 flex-col items-center p-2 disabled:opacity-50"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
            @click="openLink(info?.faqUrl)"
          >
            <img :src="FaqImage" :alt="$t('FAQ')" class="h-10" />
            <span class="max-w-full truncate font-bold text-[length:clamp(0.75rem,3.8vw,1.125rem)]">{{ $t('FAQ') }}</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
