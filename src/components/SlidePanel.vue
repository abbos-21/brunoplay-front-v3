<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { getAppInfo, updateSettings } from '@/api/user'
import { getTelegram } from '@/composables/useTelegram'
import type { AppInfo } from '@/types'
import { ArrowLeftSVG, LanguageArrowSVG } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
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
const { user } = storeToRefs(auth)

// Support / News / FAQ links come from the server (/user/app-info)
const info = ref<AppInfo | null>(null)
onMounted(() => {
  getAppInfo()
    .then((i) => (info.value = i))
    .catch(() => {})
})

function openLink(url?: string) {
  if (!url) return
  const tg = getTelegram()
  if (tg && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url)
  else window.open(url, '_blank', 'noopener')
}

// language: saved on the server; the screens are English only for now
const language = computed(() => user.value?.language ?? 'EN')
async function toggleLanguage() {
  const next = language.value === 'EN' ? 'RU' : 'EN'
  try {
    await updateSettings({ language: next })
    auth.updateUser({ language: next })
  } catch {
    // keep the current language
  }
}
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

      <div class="flex flex-col justify-between text-[#552A0F] flex-1 px-2">
        <div class="flex flex-col items-center">
          <!-- <div class="border border-white w-20 h-20 rounded-full"></div> -->
          <img
            :src="photoUrl || ProfileImage"
            alt="profile-image"
            :class="photoUrl ? 'object-cover' : 'object-contain'"
            class="w-20 aspect-square rounded-full bg-white"
            referrerpolicy="no-referrer"
            @error="photoUrl = ''"
          />
          <h1 class="text-3xl font-bold mt-1">{{ user?.firstName }}</h1>
          <h1 class="text-lg font-bold">ID: {{ user?.telegramId }}</h1>

          <button
            @click="toggleLanguage"
            type="button"
            class="bg-[#fde7b8] border border-[#cf8741] w-full rounded-2xl p-4 flex justify-between items-center mt-4 cursor-pointer"
            style="
              box-shadow:
                inset 0px 2px 2px rgba(255, 255, 255, 0.25),
                inset 0px -2px 2px rgba(0, 0, 0, 0.25);
            "
          >
            <div class="flex items-center gap-4">
              <img :src="language === 'RU' ? RuFlagImage : UkFlagImage" alt="flag" class="h-10" />
              <span class="font-bold text-lg">{{ language === 'RU' ? 'Русский' : 'English' }}</span>
            </div>

            <LanguageArrowSVG class="w-5" />
          </button>

          <div
            class="bg-[#fde7b8] border border-[#cf8741] w-full rounded-2xl p-4 flex justify-between items-center mt-4"
            style="
              box-shadow:
                inset 0px 2px 2px rgba(255, 255, 255, 0.25),
                inset 0px -2px 2px rgba(0, 0, 0, 0.25);
            "
          >
            <div class="flex items-center gap-4">
              <img :src="MusicBoxImage" alt="music-box" class="h-10" />
              <div class="flex flex-col items-start">
                <span class="font-bold text-lg -mb-1">Music 1</span>
                <span class="font-bold text-[rgba(85,42,15,.7)] -mt-1">Default</span>
              </div>
            </div>

            <div class="flex gap-2 items-center">
              <button
                type="button"
                disabled
                class="w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center opacity-40"
              >
                <img :src="MusicPrevImage" alt="" class="w-full" />
              </button>

              <button
                type="button"
                @click="toggle"
                class="w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center cursor-pointer"
              >
                <img :src="MusicPauseImage" v-if="isPlaying" alt="" class="w-full" />
                <img :src="MusicPlayImage" v-else alt="" class="w-full" />
              </button>

              <button
                type="button"
                disabled
                class="w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center opacity-40"
              >
                <img :src="MusicNextImage" alt="" class="w-full" />
              </button>
            </div>
          </div>
        </div>

        <div class="w-full grid grid-cols-3 gap-4">
          <button
            type="button"
            :disabled="!info?.supportUrl"
            class="flex flex-col items-center p-2 disabled:opacity-50"
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
            <img :src="SupportImage" alt="support" class="h-10" />
            <span class="text-lg font-bold">Support</span>
          </button>

          <button
            type="button"
            :disabled="!info?.communityUrl"
            class="flex flex-col items-center p-2 disabled:opacity-50"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
            @click="openLink(info?.communityUrl)"
          >
            <img :src="NewsImage" alt="news" class="h-10" />
            <span class="text-lg font-bold">News</span>
          </button>

          <button
            type="button"
            :disabled="!info?.communityUrl"
            class="flex flex-col items-center p-2 disabled:opacity-50"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
            @click="openLink(info?.communityUrl)"
          >
            <img :src="FaqImage" alt="faq" class="h-10" />
            <span class="text-lg font-bold">FAQ</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
