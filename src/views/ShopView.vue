<script setup lang="ts">
import { ref } from 'vue'
import CoinBalance from '@/components/CoinBalance.vue'
import HamburgerButton from '@/components/HamburgerButton.vue'
import { ArrowLeftSVG, ExclamationSVG } from '@/assets/svgs'
import { RouterLink } from 'vue-router'
import { MiningRate, CoinCapacity, EnergyRate } from '@/assets/images'

const isMenuOpen = ref(false)
</script>

<template>
  <div class="w-full h-full bg-shop p-4 relative overflow-hidden pb-24 flex flex-col">
    <div class="w-full flex justify-between items-center">
      <CoinBalance />

      <HamburgerButton v-model="isMenuOpen" />
    </div>

    <div class="grid grid-cols-2 gap-4 px-2 mt-4 text-base sm:text-xl">
      <RouterLink to="/" class="navigation-button active"> Cards </RouterLink>
      <RouterLink to="/" class="navigation-button"> Boosters </RouterLink>
    </div>

    <div class="flex flex-col gap-2 mt-2 overflow-y-scroll scrollbar flex-1 min-h-0">
      <div class="shop-element flex p-3 relative">
        <div class="w-[40%] relative">
          <img :src="MiningRate" alt="mining-rate" class="w-full" />

          <span
            class="current-lvl absolute bottom-0 left-1/2 -translate-x-1/2 font-bold text-sm sm:text-base px-2 sm:px-4 text-center whitespace-nowrap"
          >
            Lvl: 1
          </span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-between py-2 min-w-0 pr-8">
          <h1 class="font-bold text-[#552A0F] text-lg sm:text-2xl text-center">Mining rate</h1>

          <p
            class="font-bold text-[#890D00] text-base sm:text-xl border-b border-dashed border-black flex items-center gap-1 whitespace-nowrap"
          >
            0.01
            <svg class="w-3 sm:w-4 shrink-0" viewBox="0 0 27 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 5.8L14.8 2.88C14.8 2.10667 15.0267 1.44 15.48 0.880004C15.9333 0.293337 16.64 3.8147e-06 17.6 3.8147e-06C18.0267 3.8147e-06 18.48 0.120004 18.96 0.360005C19.44 0.573338 19.96 0.920005 20.52 1.4L26.04 6.00001C26.2267 6.24001 26.3733 6.54667 26.48 6.92001C26.5867 7.29334 26.64 7.70667 26.64 8.16C26.64 8.8 26.5333 9.29334 26.32 9.64C26.1333 9.98667 25.88 10.2933 25.56 10.56L17.92 16.64C16.9333 16.4 16.2533 16.04 15.88 15.56C15.5067 15.08 15.32 14.5733 15.32 14.04C15.32 13.48 15.44 12.9733 15.68 12.52C15.92 12.0667 16.2 11.6 16.52 11.12L17 10.52H0.64C0.506667 10.2533 0.36 9.92 0.2 9.52001C0.0666667 9.12 1.49012e-08 8.69334 1.49012e-08 8.24001C1.49012e-08 7.38667 0.186667 6.77334 0.56 6.4C0.96 6 1.48 5.8 2.12 5.8H17Z"
                fill="#890D00"
              />
            </svg>
            0.02
          </p>
          <button
            type="button"
            class="upgrade-button text-base sm:text-xl px-3 sm:px-4 py-px outlined [--outline:#D76826] font-bold relative"
          >
            Upgrade
            <svg
              class="w-3 absolute top-px left-1 -rotate-45"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="8" cy="8" rx="6" ry="3" fill="white" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="requirements-button absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center rounded-full shrink-0"
        >
          <ExclamationSVG class="w-3" />
        </button>
      </div>

      <div class="shop-element flex p-3 relative">
        <div class="w-[40%] relative">
          <img :src="CoinCapacity" alt="coin-capacity" class="w-full" />

          <span
            class="current-lvl absolute bottom-0 left-1/2 -translate-x-1/2 font-bold text-sm sm:text-base px-2 sm:px-4 text-center whitespace-nowrap"
          >
            Lvl: 1
          </span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-between py-2 min-w-0 pr-8">
          <h1 class="font-bold text-[#552A0F] text-lg sm:text-2xl text-center">Coin capacity</h1>

          <p
            class="font-bold text-[#890D00] text-base sm:text-xl border-b border-dashed border-black flex items-center gap-1 whitespace-nowrap"
          >
            100
            <svg class="w-3 sm:w-4 shrink-0" viewBox="0 0 27 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 5.8L14.8 2.88C14.8 2.10667 15.0267 1.44 15.48 0.880004C15.9333 0.293337 16.64 3.8147e-06 17.6 3.8147e-06C18.0267 3.8147e-06 18.48 0.120004 18.96 0.360005C19.44 0.573338 19.96 0.920005 20.52 1.4L26.04 6.00001C26.2267 6.24001 26.3733 6.54667 26.48 6.92001C26.5867 7.29334 26.64 7.70667 26.64 8.16C26.64 8.8 26.5333 9.29334 26.32 9.64C26.1333 9.98667 25.88 10.2933 25.56 10.56L17.92 16.64C16.9333 16.4 16.2533 16.04 15.88 15.56C15.5067 15.08 15.32 14.5733 15.32 14.04C15.32 13.48 15.44 12.9733 15.68 12.52C15.92 12.0667 16.2 11.6 16.52 11.12L17 10.52H0.64C0.506667 10.2533 0.36 9.92 0.2 9.52001C0.0666667 9.12 1.49012e-08 8.69334 1.49012e-08 8.24001C1.49012e-08 7.38667 0.186667 6.77334 0.56 6.4C0.96 6 1.48 5.8 2.12 5.8H17Z"
                fill="#890D00"
              />
            </svg>
            200
          </p>
          <button
            type="button"
            class="upgrade-button text-base sm:text-xl px-3 sm:px-4 py-px outlined [--outline:#D76826] font-bold relative"
          >
            Upgrade
            <svg
              class="w-3 absolute top-px left-1 -rotate-45"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="8" cy="8" rx="6" ry="3" fill="white" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="requirements-button absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center rounded-full shrink-0"
        >
          <ExclamationSVG class="w-3" />
        </button>
      </div>

      <div class="shop-element flex p-3 relative">
        <div class="w-[40%] relative">
          <img :src="EnergyRate" alt="energy-rate" class="w-full" />

          <span
            class="current-lvl absolute bottom-0 left-1/2 -translate-x-1/2 font-bold text-sm sm:text-base px-2 sm:px-4 text-center whitespace-nowrap"
          >
            Lvl: 1
          </span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-between py-2 min-w-0 pr-8">
          <h1 class="font-bold text-[#552A0F] text-lg sm:text-2xl text-center">Energy rate</h1>

          <p
            class="font-bold text-[#890D00] text-base sm:text-xl border-b border-dashed border-black flex items-center gap-1 whitespace-nowrap"
          >
            800
            <svg class="w-3 sm:w-4 shrink-0" viewBox="0 0 27 17" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M17 5.8L14.8 2.88C14.8 2.10667 15.0267 1.44 15.48 0.880004C15.9333 0.293337 16.64 3.8147e-06 17.6 3.8147e-06C18.0267 3.8147e-06 18.48 0.120004 18.96 0.360005C19.44 0.573338 19.96 0.920005 20.52 1.4L26.04 6.00001C26.2267 6.24001 26.3733 6.54667 26.48 6.92001C26.5867 7.29334 26.64 7.70667 26.64 8.16C26.64 8.8 26.5333 9.29334 26.32 9.64C26.1333 9.98667 25.88 10.2933 25.56 10.56L17.92 16.64C16.9333 16.4 16.2533 16.04 15.88 15.56C15.5067 15.08 15.32 14.5733 15.32 14.04C15.32 13.48 15.44 12.9733 15.68 12.52C15.92 12.0667 16.2 11.6 16.52 11.12L17 10.52H0.64C0.506667 10.2533 0.36 9.92 0.2 9.52001C0.0666667 9.12 1.49012e-08 8.69334 1.49012e-08 8.24001C1.49012e-08 7.38667 0.186667 6.77334 0.56 6.4C0.96 6 1.48 5.8 2.12 5.8H17Z"
                fill="#890D00"
              />
            </svg>
            1000
          </p>
          <button
            type="button"
            class="upgrade-button text-base sm:text-xl px-3 sm:px-4 py-px outlined [--outline:#D76826] font-bold relative"
          >
            Upgrade
            <svg
              class="w-3 absolute top-px left-1 -rotate-45"
              viewBox="0 0 16 16"
              xmlns="http://www.w3.org/2000/svg"
            >
              <ellipse cx="8" cy="8" rx="6" ry="3" fill="white" />
            </svg>
          </button>
        </div>

        <button
          type="button"
          class="requirements-button absolute top-2 right-2 w-8 h-8 sm:w-10 sm:h-10 flex justify-center items-center rounded-full shrink-0"
        >
          <ExclamationSVG class="w-3" />
        </button>
      </div>
    </div>

    <div v-if="isMenuOpen" class="absolute inset-0 bg-black/40 z-40" @click="isMenuOpen = false" />

    <!-- Slide Panel -->
    <div
      class="absolute top-0 right-0 h-full w-[90%] z-50 transition-transform duration-300 ease-out py-1"
      :class="isMenuOpen ? 'translate-x-0' : 'translate-x-full'"
    >
      <div class="bg-[#FBE166] h-full rounded-s-lg p-2">
        <!-- <div class="p-4 font-bold text-xl">Menu</div> -->

        <button
          type="button"
          @click="isMenuOpen = false"
          class="close-menu-button w-10 h-10 p-2 rounded-full flex justify-center items-center"
        >
          <ArrowLeftSVG class="w-full" />
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.close-menu-button {
  background: #fb7a38;
  box-shadow:
    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
}

.navigation-button {
  background: #fde7b8;
  border: 1px solid #c17e23;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 4px 4px rgba(255, 255, 255, 0.25),
    inset 0px -4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-weight: bold;
  padding: 5px;
  color: #552a0f;
}

.navigation-button.active {
  background: #c17e23;
  border: 1px solid #c17e23;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 4px 4px rgba(255, 255, 255, 0.25),
    inset 0px -4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 16px;
  color: white;
}

.shop-element {
  background: #fde7b8;
  border: 8px solid #cf8741;
  box-shadow:
    0px 4px 4px rgba(0, 0, 0, 0.25),
    inset 0px 0px 4px 2px rgba(0, 0, 0, 0.25);
  border-radius: 32px;
}

.current-lvl {
  background: linear-gradient(360deg, #fda109 0%, #f96a07 100%);
  border: 1px solid #c66a27;
  box-shadow:
    inset 0px -2px 2px #ffe120,
    inset 0px 2px 2px #ffe120;
  border-radius: 16px;
  color: #410200;
  white-space: nowrap;
}

.upgrade-button {
  background: linear-gradient(360deg, #fda109 0%, #f96a07 100%);
  border: 2px solid #c66a27;
  box-shadow:
    inset 0px -2px 2px #ffe120,
    inset 0px 2px 2px #ffe120;
  border-radius: 16px;
}

.requirements-button {
  background: #fb7a38;
  box-shadow:
    inset 0px -3px 4px rgba(0, 0, 0, 0.25),
    inset 0px 1px 0px rgba(255, 255, 255, 0.25);
}

.scrollbar {
  /* Firefox */
  scrollbar-width: none;
  /* IE and Edge */
  -ms-overflow-style: none;
  /* Chrome, Safari, and Opera */
}
.scrollbar::-webkit-scrollbar {
  display: none;
}
</style>
