<script setup lang="ts">
import { ArrowLeftSVG } from '@/assets/svgs'
import { useAuthStore } from '@/stores/auth'
import {
  ProfileImage,
  UkFlagImage,
  MusicBoxImage,
  SupportImage,
  NewsImage,
  FaqImage,
} from '@/assets/images'

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

            <svg viewBox="0 0 40 47" class="w-5" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M3.50049 3.50049L35.0894 22.6453C35.7317 23.0345 35.7317 23.9664 35.0894 24.3557L3.50049 43.5005"
                stroke="#552A0F"
                stroke-width="7"
                stroke-linecap="round"
              />
            </svg>
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
                <svg
                  class="w-full"
                  viewBox="0 0 45 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_d_0_1)">
                    <rect x="3" y="1" width="5" height="42" rx="2.5" fill="#F4E6A4" />
                    <rect x="2.5" y="0.5" width="6" height="43" rx="3" stroke="#C88A32" />
                  </g>
                  <g filter="url(#filter1_d_0_1)">
                    <path
                      d="M11.3005 19.3223C9.10413 20.4319 9.10413 23.5681 11.3005 24.6777L37.6473 37.9876C39.6427 38.9957 42 37.5455 42 35.3099V8.69009C42 6.45452 39.6427 5.00434 37.6473 6.01238L11.3005 19.3223Z"
                      fill="#F4E6A4"
                    />
                    <path
                      d="M11.0752 18.876C8.51277 20.1705 8.51277 23.8295 11.0752 25.124L37.4219 38.4336C39.7498 39.6096 42.5 37.9177 42.5 35.3096V8.69043C42.5 6.08226 39.7498 4.39036 37.4219 5.56641L11.0752 18.876Z"
                      stroke="#C88A32"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_0_1"
                      x="0"
                      y="0"
                      width="11"
                      height="48"
                      filterUnits="userSpaceOnUse"
                      color-interpolation-filters="sRGB"
                    >
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="2" />
                      <feGaussianBlur stdDeviation="1" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_0_1"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_0_1"
                        result="shape"
                      />
                    </filter>
                    <filter
                      id="filter1_d_0_1"
                      x="6.65332"
                      y="4.68481"
                      width="38.3467"
                      height="38.6304"
                      filterUnits="userSpaceOnUse"
                      color-interpolation-filters="sRGB"
                    >
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="2" />
                      <feGaussianBlur stdDeviation="1" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_0_1"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_0_1"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
              </button>

              <button
                type="button"
                class="w-8 h-8 sm:w-10 sm:h-10 p-2 rounded-full flex justify-center items-center"
                style="
                  background: linear-gradient(180deg, #fff277 0%, #fbba4e 100%);
                  box-shadow:
                    0px 2px 2px rgba(0, 0, 0, 0.25),
                    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
                "
              >
                <svg
                  class="w-full"
                  viewBox="0 0 39 39"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_d_4211_461)">
                    <path
                      d="M33.6995 14.6375C35.8959 15.747 35.8959 18.8833 33.6995 19.9929L7.35273 33.3028C5.35732 34.3108 3 32.8607 3 30.6251V4.00528C3 1.76971 5.35733 0.31953 7.35273 1.32757L33.6995 14.6375Z"
                      fill="#F4E6A4"
                    />
                    <path
                      d="M33.9248 14.1912C36.4872 15.4857 36.4872 19.1447 33.9248 20.4392L7.57813 33.7488C5.25015 34.9248 2.5 33.2329 2.5 30.6248V4.00562C2.5 1.39745 5.25015 -0.294455 7.57812 0.881592L33.9248 14.1912Z"
                      stroke="#C88A32"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_4211_461"
                      x="0"
                      y="0"
                      width="38.3467"
                      height="38.6304"
                      filterUnits="userSpaceOnUse"
                      color-interpolation-filters="sRGB"
                    >
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="2" />
                      <feGaussianBlur stdDeviation="1" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_4211_461"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_4211_461"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
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
                <svg
                  class="w-full rotate-180"
                  viewBox="0 0 45 48"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g filter="url(#filter0_d_0_1)">
                    <rect x="3" y="1" width="5" height="42" rx="2.5" fill="#F4E6A4" />
                    <rect x="2.5" y="0.5" width="6" height="43" rx="3" stroke="#C88A32" />
                  </g>
                  <g filter="url(#filter1_d_0_1)">
                    <path
                      d="M11.3005 19.3223C9.10413 20.4319 9.10413 23.5681 11.3005 24.6777L37.6473 37.9876C39.6427 38.9957 42 37.5455 42 35.3099V8.69009C42 6.45452 39.6427 5.00434 37.6473 6.01238L11.3005 19.3223Z"
                      fill="#F4E6A4"
                    />
                    <path
                      d="M11.0752 18.876C8.51277 20.1705 8.51277 23.8295 11.0752 25.124L37.4219 38.4336C39.7498 39.6096 42.5 37.9177 42.5 35.3096V8.69043C42.5 6.08226 39.7498 4.39036 37.4219 5.56641L11.0752 18.876Z"
                      stroke="#C88A32"
                    />
                  </g>
                  <defs>
                    <filter
                      id="filter0_d_0_1"
                      x="0"
                      y="0"
                      width="11"
                      height="48"
                      filterUnits="userSpaceOnUse"
                      color-interpolation-filters="sRGB"
                    >
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="2" />
                      <feGaussianBlur stdDeviation="1" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_0_1"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_0_1"
                        result="shape"
                      />
                    </filter>
                    <filter
                      id="filter1_d_0_1"
                      x="6.65332"
                      y="4.68481"
                      width="38.3467"
                      height="38.6304"
                      filterUnits="userSpaceOnUse"
                      color-interpolation-filters="sRGB"
                    >
                      <feFlood flood-opacity="0" result="BackgroundImageFix" />
                      <feColorMatrix
                        in="SourceAlpha"
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                        result="hardAlpha"
                      />
                      <feOffset dy="2" />
                      <feGaussianBlur stdDeviation="1" />
                      <feComposite in2="hardAlpha" operator="out" />
                      <feColorMatrix
                        type="matrix"
                        values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                      />
                      <feBlend
                        mode="normal"
                        in2="BackgroundImageFix"
                        result="effect1_dropShadow_0_1"
                      />
                      <feBlend
                        mode="normal"
                        in="SourceGraphic"
                        in2="effect1_dropShadow_0_1"
                        result="shape"
                      />
                    </filter>
                  </defs>
                </svg>
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
