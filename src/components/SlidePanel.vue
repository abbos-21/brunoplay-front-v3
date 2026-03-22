<script setup lang="ts">
import {
  ArrowLeftSVG,
  MusicNextSVG,
  MusicPlaySVG,
  MusicPrevSVG,
  LanguageArrowSVG,
  MusicPauseSVG,
} from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import {
  ProfileImage,
  UkFlagImage,
  MusicBoxImage,
  SupportImage,
  NewsImage,
  FaqImage,
} from '@/assets/images'

import { useMusic } from '@/composables/useMusic'

const { isPlaying, toggle } = useMusic()

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const { user } = useAuthStore()
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
          <img :src="ProfileImage" alt="profile-image" class="w-20" />
          <h1 class="text-3xl font-bold mt-1">{{ user?.firstName }}</h1>
          <h1 class="text-lg font-bold">ID: {{ user?.telegramId }}</h1>

          <button
            type="button"
            class="bg-[#fde7b8] border border-[#cf8741] w-full rounded-2xl p-4 flex justify-between items-center mt-4 cursor-pointer"
            style="
              box-shadow:
                inset 0px 2px 2px rgba(255, 255, 255, 0.25),
                inset 0px -2px 2px rgba(0, 0, 0, 0.25);
            "
          >
            <div class="flex items-center gap-4">
              <img :src="UkFlagImage" alt="uk-flag" class="h-10" />
              <span class="font-bold text-lg">English</span>
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

            <div class="flex gap-4 items-center">
              <button
                type="button"
                class="w-8 h-8 sm:w-10 sm:h-10 p-2 rounded-full flex justify-center items-center"
                style="
                  background: radial-gradient(50% 50% at 50% 50%, #fff277 0%, #fbba4e 100%);
                  box-shadow:
                    0px 2px 2px rgba(0, 0, 0, 0.25),
                    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
                "
              >
                <MusicPrevSVG class="w-full" />
              </button>

              <button
                type="button"
                @click="toggle"
                class="w-8 h-8 sm:w-10 sm:h-10 p-2 rounded-full flex justify-center items-center"
                style="
                  background: linear-gradient(180deg, #fff277 0%, #fbba4e 100%);
                  box-shadow:
                    0px 2px 2px rgba(0, 0, 0, 0.25),
                    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
                "
              >
                <MusicPauseSVG v-if="isPlaying" class="w-5" />
                <MusicPlaySVG v-else class="w-full" />
              </button>

              <button
                type="button"
                class="w-8 h-8 sm:w-10 sm:h-10 p-2 rounded-full flex justify-center items-center"
                style="
                  background: radial-gradient(50% 50% at 50% 50%, #fff277 0%, #fbba4e 100%);
                  box-shadow:
                    0px 2px 2px rgba(0, 0, 0, 0.25),
                    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
                "
              >
                <MusicNextSVG class="w-full" />
              </button>
            </div>
          </div>
        </div>

        <div class="w-full grid grid-cols-3 gap-4">
          <RouterLink
            to="/"
            class="flex flex-col items-center p-2"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
          >
            <img :src="SupportImage" alt="support" class="h-10" />
            <span class="text-lg font-bold">Support</span>
          </RouterLink>

          <RouterLink
            to="/"
            class="flex flex-col items-center p-2"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
          >
            <img :src="NewsImage" alt="news" class="h-10" />
            <span class="text-lg font-bold">News</span>
          </RouterLink>

          <RouterLink
            to="/"
            class="flex flex-col items-center p-2"
            style="
              background: #fde7b8;
              border: 1px solid #cf8741;
              box-shadow:
                inset 0px 4px 4px rgba(255, 255, 255, 0.25),
                inset 0px -4px 4px rgba(0, 0, 0, 0.25);
              border-radius: 16px;
            "
          >
            <img :src="FaqImage" alt="faq" class="h-10" />
            <span class="text-lg font-bold">FAQ</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>
