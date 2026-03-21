<script setup lang="ts">
import { CoinImage } from '@/assets/images'
import { TickSVG } from '@/assets/svgs'
import { useDailyStore } from '@/stores/daily'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

const daily = useDailyStore()

async function handleClaim() {
  await daily.claimDaily()
}
</script>

<template>
  <div
    v-if="modelValue"
    class="absolute inset-0 bg-black/40 z-40"
    @click="emit('update:modelValue', false)"
  />
  <div
    class="absolute bottom-0 left-0 w-full z-50 transition-transform duration-300 ease-out"
    :class="modelValue ? 'translate-y-0' : 'translate-y-full'"
  >
    <div class="bg-[#FBE166] rounded-t-2xl p-4 relative flex flex-col items-center max-h-[85svh]">
      <!-- Close button -->
      <button
        type="button"
        @click="emit('update:modelValue', false)"
        class="absolute top-3 right-3 close bg-[#fb7a38] w-10 aspect-square rounded-full flex justify-center items-center shrink-0"
      >
        <svg class="w-6" viewBox="0 0 58 62" fill="none" xmlns="http://www.w3.org/2000/svg">
          <g filter="url(#filter0_d_4211_431)">
            <mask
              id="path-1-outside-1_4211_431"
              maskUnits="userSpaceOnUse"
              x="1.7463"
              y="-0.50332"
              width="53.6404"
              height="57.0448"
              fill="black"
            >
              <rect fill="white" x="1.7463" y="-0.50332" width="53.6404" height="57.0448" />
              <path
                d="M10.4153 7.8971C10.7603 7.2387 11.2043 6.59423 11.7473 5.96367C12.2904 5.33311 12.922 4.79073 13.6422 4.33655C14.4189 3.83981 15.2773 3.48077 16.2172 3.25943C17.1641 2.98858 18.1822 2.9297 19.2715 3.08279C20.7074 3.28459 21.9178 3.83339 22.9027 4.72918C23.8946 5.57546 24.8382 6.94511 25.7334 8.83812L30.2844 18.4904L40.5999 7.06488C41.0238 6.92249 41.5928 6.82574 42.3069 6.77463C43.0774 6.68095 43.8093 6.68282 44.5025 6.78025C46.7801 7.10034 48.486 7.8955 49.6203 9.16572C50.7545 10.4359 51.2103 11.8633 50.9877 13.4477C50.7928 14.8341 50.2475 16.0197 49.3517 17.0046C48.5054 17.9965 47.3555 19.1729 45.902 20.5339L36.937 28.8168L46.6109 47.8231C45.9574 49.5994 44.8856 50.9383 43.3956 51.8397C41.9622 52.6986 40.1314 52.9714 37.9033 52.6583C36.4674 52.4565 35.2782 51.9359 34.3359 51.0966C33.4005 50.2078 32.5099 48.8203 31.6642 46.9343L26.9844 36.5822L15.6431 49.3784C15.24 49.3722 14.8652 49.3448 14.5186 49.2961C14.1651 49.2969 13.815 49.2729 13.4684 49.2242C10.6461 48.8276 8.64659 47.9659 7.46978 46.6392C6.29297 45.3125 5.82286 43.8074 6.05945 42.124C6.26125 40.6881 6.7323 39.492 7.47259 38.5357C8.26936 37.5369 9.33804 36.3996 10.6787 35.1237L19.8861 26.1932L10.4153 7.8971Z"
              />
            </mask>
            <path
              d="M10.4153 7.8971C10.7603 7.2387 11.2043 6.59423 11.7473 5.96367C12.2904 5.33311 12.922 4.79073 13.6422 4.33655C14.4189 3.83981 15.2773 3.48077 16.2172 3.25943C17.1641 2.98858 18.1822 2.9297 19.2715 3.08279C20.7074 3.28459 21.9178 3.83339 22.9027 4.72918C23.8946 5.57546 24.8382 6.94511 25.7334 8.83812L30.2844 18.4904L40.5999 7.06488C41.0238 6.92249 41.5928 6.82574 42.3069 6.77463C43.0774 6.68095 43.8093 6.68282 44.5025 6.78025C46.7801 7.10034 48.486 7.8955 49.6203 9.16572C50.7545 10.4359 51.2103 11.8633 50.9877 13.4477C50.7928 14.8341 50.2475 16.0197 49.3517 17.0046C48.5054 17.9965 47.3555 19.1729 45.902 20.5339L36.937 28.8168L46.6109 47.8231C45.9574 49.5994 44.8856 50.9383 43.3956 51.8397C41.9622 52.6986 40.1314 52.9714 37.9033 52.6583C36.4674 52.4565 35.2782 51.9359 34.3359 51.0966C33.4005 50.2078 32.5099 48.8203 31.6642 46.9343L26.9844 36.5822L15.6431 49.3784C15.24 49.3722 14.8652 49.3448 14.5186 49.2961C14.1651 49.2969 13.815 49.2729 13.4684 49.2242C10.6461 48.8276 8.64659 47.9659 7.46978 46.6392C6.29297 45.3125 5.82286 43.8074 6.05945 42.124C6.26125 40.6881 6.7323 39.492 7.47259 38.5357C8.26936 37.5369 9.33804 36.3996 10.6787 35.1237L19.8861 26.1932L10.4153 7.8971Z"
              fill="white"
            />
            <path
              d="M10.4153 7.8971L8.64377 6.96884L8.16032 7.89147L8.63916 8.8165L10.4153 7.8971ZM11.7473 5.96367L10.2319 4.65854L10.2319 4.65854L11.7473 5.96367ZM13.6422 4.33655L14.7091 6.02829L14.7198 6.02143L13.6422 4.33655ZM16.2172 3.25943L16.6756 5.20619L16.7217 5.19534L16.7672 5.18231L16.2172 3.25943ZM22.9027 4.72918L21.557 6.20875L21.5805 6.23007L21.6046 6.25065L22.9027 4.72918ZM25.7334 8.83812L27.5424 7.98519L27.5414 7.98307L25.7334 8.83812ZM30.2844 18.4904L28.4754 19.3434L29.7562 22.0599L31.7688 19.8307L30.2844 18.4904ZM40.5999 7.06488L39.9631 5.16895L39.4665 5.33575L39.1154 5.72462L40.5999 7.06488ZM42.3069 6.77462L42.4497 8.76952L42.4991 8.76598L42.5483 8.76001L42.3069 6.77462ZM49.6203 9.16573L48.1285 10.4978V10.4978L49.6203 9.16573ZM49.3517 17.0046L47.8721 15.6589L47.8508 15.6824L47.8302 15.7065L49.3517 17.0046ZM45.902 20.5339L47.2592 22.0029L47.2689 21.9938L45.902 20.5339ZM36.937 28.8168L35.5797 27.3478L34.4679 28.375L35.1546 29.724L36.937 28.8168ZM46.6109 47.8231L48.4879 48.5137L48.7895 47.6942L48.3933 46.9159L46.6109 47.8231ZM43.3956 51.8397L44.4236 53.5554L44.4309 53.5509L43.3956 51.8397ZM34.3359 51.0966L32.9582 52.5465L32.9816 52.5687L33.0057 52.5901L34.3359 51.0966ZM31.6642 46.9343L33.4891 46.1159L33.4866 46.1104L31.6642 46.9343ZM26.9844 36.5822L28.8068 35.7584L27.5352 32.9454L25.4876 35.2557L26.9844 36.5822ZM15.6431 49.3784L15.6126 51.3781L16.5308 51.3922L17.1398 50.7049L15.6431 49.3784ZM14.5186 49.2961L14.797 47.3155L14.6562 47.2957L14.5141 47.2961L14.5186 49.2961ZM7.46978 46.6392L5.97358 47.9664L5.97358 47.9664L7.46978 46.6392ZM7.47259 38.5357L5.9091 37.2885L5.90002 37.2999L5.8911 37.3114L7.47259 38.5357ZM10.6787 35.1237L12.0574 36.5725L12.0643 36.566L12.0711 36.5594L10.6787 35.1237ZM19.8861 26.1932L21.2786 27.6289L22.3456 26.594L21.6623 25.2738L19.8861 26.1932Z"
              fill="#D76826"
              mask="url(#path-1-outside-1_4211_431)"
            />
          </g>
          <defs>
            <filter
              id="filter0_d_4211_431"
              x="0"
              y="0"
              width="57.0426"
              height="61.7834"
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
              <feOffset dy="3" />
              <feGaussianBlur stdDeviation="2" />
              <feComposite in2="hardAlpha" operator="out" />
              <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0" />
              <feBlend
                mode="normal"
                in2="BackgroundImageFix"
                result="effect1_dropShadow_4211_431"
              />
              <feBlend
                mode="normal"
                in="SourceGraphic"
                in2="effect1_dropShadow_4211_431"
                result="shape"
              />
            </filter>
          </defs>
        </svg>
      </button>

      <!-- Header -->
      <h1 class="font-bold text-2xl sm:text-3xl text-center text-[#552a0f] pr-10">
        Daily Activity
      </h1>
      <p
        class="font-bold text-sm sm:text-base text-center text-[rgba(85,42,15,.7)] mt-1 max-w-xs sm:max-w-sm"
      >
        Visit daily to grow your streak and unlock the maximum reward after 10 days in a row.
      </p>

      <!-- Streak badge -->
      <div
        v-if="daily.activityStatus"
        class="mt-2 bg-[#552a0f]/10 rounded-full px-4 py-1 text-[#552a0f] font-bold text-sm"
      >
        🔥 {{ daily.activityStatus.currentStreak }}-day streak
      </div>

      <!-- Day cards — scrollable -->
      <div class="overflow-y-auto w-full mt-3 flex-1 min-h-0">
        <div
          v-if="daily.activityStatus"
          class="flex gap-2 flex-wrap justify-center items-start pb-2"
        >
          <div
            v-for="day in daily.activityStatus.streakRewards"
            :key="day.day"
            class="day-card rounded-xl py-2 px-3 font-bold text-[#552A0F] relative"
            :class="{
              'bg-[#fde7b8] border border-[#1BB33F]': day.claimed,
              // 'bg-[#fff8e0] border-2 border-[#552a0f]': day.isToday && !day.claimed,
              // 'bg-[#fde7b8] border border-[#cf8741]': !day.claimed && !day.isToday,
            }"
          >
            <h3 class="text-xs sm:text-sm">Day {{ day.day }}</h3>
            <div class="flex gap-1 items-center">
              <img :src="CoinImage" alt="coin" class="w-4 sm:w-5" />
              <span class="text-sm sm:text-base">{{ day.coins }}</span>
            </div>

            <!-- Claimed tick -->
            <span
              v-if="day.claimed"
              class="absolute w-5 aspect-square rounded-full bg-[#1BB33F] -top-1.5 -right-1.5 text-white flex justify-center items-center"
            >
              <TickSVG class="w-3" />
            </span>

            <!-- Today indicator -->
            <!-- <span
              v-else-if="day.isToday"
              class="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#552a0f] bg-[#fbe166] px-1 rounded whitespace-nowrap"
            >
              Today
            </span> -->
          </div>
        </div>

        <!-- Loading skeleton -->
        <div v-else class="flex gap-2 flex-wrap justify-center items-start pb-2">
          <div
            v-for="i in 10"
            :key="i"
            class="bg-[#fde7b8]/60 border border-[#cf8741]/40 rounded-xl py-2 px-3 w-[72px] h-[52px] animate-pulse"
          />
        </div>
      </div>

      <!-- Claim button -->
      <button
        type="button"
        @click="handleClaim"
        :disabled="!daily.activityStatus?.canClaim || daily.isLoading"
        class="claim mt-4 mb-1 font-bold text-2xl sm:text-3xl rounded-full border border-[#552a0f] px-8 py-1 transition-opacity shrink-0"
        :class="
          daily.activityStatus?.canClaim && !daily.isLoading
            ? 'bg-[#5edf3d] text-white'
            : 'bg-[#aaa] text-white/70 opacity-60 cursor-not-allowed'
        "
      >
        {{ daily.isLoading ? 'Claiming…' : 'Claim' }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="css">
.day-card {
  box-shadow:
    inset 0px 2px 2px rgba(255, 255, 255, 0.25),
    inset 0px -2px 2px rgba(0, 0, 0, 0.25);
}

.close {
  box-shadow:
    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
}

.claim {
  box-shadow:
    inset 0px 4px 4px rgba(255, 255, 255, 0.25),
    inset 0px -4px 4px rgba(0, 0, 0, 0.25);
}
</style>
