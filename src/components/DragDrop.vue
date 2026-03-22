<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { Hat, Fish, Net, Boots, Boat, Bucket, Backpack, Rod } from '@/assets/images'
import { TickSVG, XSVG } from '@/assets/svgs'

interface ImageItem {
  id: number
  src: string
}

const MAX_CELLS = 4

const sourceImages: ImageItem[] = [
  { id: 1, src: Hat },
  { id: 2, src: Fish },
  { id: 3, src: Net },
  { id: 4, src: Boots },
  { id: 5, src: Boat },
  { id: 6, src: Bucket },
  { id: 7, src: Backpack },
  { id: 8, src: Rod },
]

const gallery = ref<ImageItem[]>([...sourceImages])

// ✅ FIXED GRID (IMPORTANT)
const container = ref<(ImageItem | null)[]>(Array(MAX_CELLS).fill(null))

const dragItem = ref<ImageItem | null>(null)
const overIndex = ref<number | null>(null)

const isFull = computed(() => container.value.every((cell) => cell !== null))

function isUsed(id: number) {
  return container.value.some((i) => i?.id === id)
}

/* ───────── Desktop Drag ───────── */

function onDragStart(item: ImageItem) {
  dragItem.value = item
}

function onDropToContainer(index: number) {
  if (!dragItem.value) return

  const dragged = dragItem.value
  const existingIndex = container.value.findIndex((i) => i?.id === dragged.id)

  // 🔁 Reorder inside container
  if (existingIndex !== -1) {
    container.value[existingIndex] = null
    container.value[index] = dragged
  } else {
    // ❌ Prevent duplicates
    if (isUsed(dragged.id)) return

    container.value[index] = dragged
  }

  cleanup()
}

function onDropEnd() {
  cleanup()
}

function cleanup() {
  dragItem.value = null
  overIndex.value = null
}

/* ───────── Touch Support ───────── */

let ghost: HTMLImageElement | null = null

function createGhost(item: ImageItem, x: number, y: number) {
  ghost = document.createElement('img')
  ghost.src = item.src
  ghost.style.cssText = `
    position: fixed;
    height: 64px;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.85;
    left: ${x - 35}px;
    top: ${y - 35}px;
  `
  document.body.appendChild(ghost)
}

function onTouchStart(item: ImageItem, ev: TouchEvent) {
  dragItem.value = item

  const { clientX, clientY } = ev.touches[0]
  createGhost(item, clientX, clientY)

  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(ev: TouchEvent) {
  ev.preventDefault()
  if (!ghost) return

  const { clientX, clientY } = ev.touches[0]
  ghost.style.left = `${clientX - 35}px`
  ghost.style.top = `${clientY - 35}px`

  const el = document.elementFromPoint(clientX, clientY)
  const idx = el?.closest('[data-slot]')?.getAttribute('data-slot')

  overIndex.value = idx ? Number(idx) : null
}

function onTouchEnd(ev: TouchEvent) {
  if (!dragItem.value) return

  const { clientX, clientY } = ev.changedTouches[0]
  const el = document.elementFromPoint(clientX, clientY)
  const idx = el?.closest('[data-slot]')?.getAttribute('data-slot')

  if (idx !== null) {
    onDropToContainer(Number(idx))
  }

  cleanupTouch()
}

function cleanupTouch() {
  if (ghost) ghost.remove()
  ghost = null
  document.removeEventListener('touchmove', onTouchMove)
  document.removeEventListener('touchend', onTouchEnd)
}

onBeforeUnmount(cleanupTouch)

/* ───────── Submit ───────── */

function handleSubmit() {
  const result = container.value.map((i) => i?.id).filter(Boolean)

  alert(`Submitted: [${result.join(', ')}]`)
}
</script>

<template>
  <div class="flex flex-col items-center">
    <div
      class="w-full grid grid-cols-4 border border-[#CF8741] bg-[#FDE7B8] rounded-2xl"
      style="
        box-shadow:
          inset 0px 2px 2px rgba(255, 255, 255, 0.25),
          inset 0px -2px 2px rgba(0, 0, 0, 0.25);
      "
    >
      <div
        v-for="n in MAX_CELLS"
        :key="n"
        class="flex justify-center items-center h-16 relative border-r border-[#CF8741] last:border-r-0 p-2"
        :data-slot="n - 1"
        :class="{ 'bg-[#e0f0ff] first:rounded-l-2xl last:rounded-r-2xl': overIndex === n - 1 }"
        @dragover.prevent="overIndex = n - 1"
        @dragleave="overIndex = null"
        @drop.prevent="onDropToContainer(n - 1)"
      >
        <template v-if="container[n - 1]">
          <div
            draggable="true"
            class="relative h-full w-full flex justify-center items-center"
            @dragstart="onDragStart(container[n - 1]!)"
            @dragend="onDropEnd"
            @touchstart.prevent="onTouchStart(container[n - 1]!, $event)"
          >
            <img :src="container[n - 1]!.src" class="h-full" />

            <!-- <span
              style="
                box-shadow:
                  inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                  inset 0px 1px 0px rgba(255, 255, 255, 0.25);
              "
              class="absolute w-6 aspect-square rounded-full bg-[#1BB33F] -top-4 -right-4 text-white flex justify-center items-center"
            >
              <TickSVG class="w-3.5" />
            </span> -->

            <span
              style="
                box-shadow:
                  inset 0px -3px 4px rgba(0, 0, 0, 0.25),
                  inset 0px 1px 0px rgba(255, 255, 255, 0.25);
              "
              class="absolute w-6 aspect-square rounded-full bg-[#FB7A38] -top-4 -right-4 text-white flex justify-center items-center"
            >
              <svg class="w-4" viewBox="0 0 35 37" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g filter="url(#filter0_d_4211_433)">
                  <mask
                    id="path-1-outside-1_4211_433"
                    maskUnits="userSpaceOnUse"
                    x="3.31372"
                    y="0.47998"
                    width="28"
                    height="30"
                    fill="black"
                  >
                    <rect fill="white" x="3.31372" y="0.47998" width="28" height="30" />
                    <path
                      d="M6.23372 6.19998C6.36705 5.82665 6.55372 5.45331 6.79372 5.07998C7.03372 4.70665 7.32705 4.37331 7.67372 4.07998C8.04705 3.75998 8.47372 3.50665 8.95372 3.31998C9.43372 3.10665 9.96705 2.99998 10.5537 2.99998C11.3271 2.99998 12.0071 3.19998 12.5937 3.59998C13.1804 3.97331 13.7804 4.62665 14.3937 5.55998L17.5137 10.32L22.1137 3.51998C22.3271 3.41331 22.6204 3.31998 22.9937 3.23998C23.3937 3.13331 23.7804 3.07998 24.1537 3.07998C25.3804 3.07998 26.3404 3.37331 27.0337 3.95998C27.7271 4.54665 28.0737 5.26665 28.0737 6.11998C28.0737 6.86665 27.8737 7.53331 27.4737 8.11998C27.1004 8.70665 26.5804 9.41331 25.9137 10.24L21.7937 15.28L28.3137 24.6C28.1004 25.5866 27.6337 26.3733 26.9137 26.96C26.2204 27.52 25.2737 27.8 24.0737 27.8C23.3004 27.8 22.6337 27.6133 22.0737 27.24C21.5137 26.84 20.9404 26.1733 20.3537 25.24L17.1137 20.12L12.0737 27.72C11.8604 27.7466 11.6604 27.76 11.4737 27.76C11.2871 27.7866 11.1004 27.8 10.9137 27.8C9.39372 27.8 8.27372 27.4933 7.55372 26.88C6.83372 26.2666 6.47372 25.5066 6.47372 24.6C6.47372 23.8266 6.63372 23.16 6.95372 22.6C7.30039 22.0133 7.78039 21.3333 8.39372 20.56L12.5937 15.16L6.23372 6.19998Z"
                    />
                  </mask>
                  <path
                    d="M6.23372 6.19998C6.36705 5.82665 6.55372 5.45331 6.79372 5.07998C7.03372 4.70665 7.32705 4.37331 7.67372 4.07998C8.04705 3.75998 8.47372 3.50665 8.95372 3.31998C9.43372 3.10665 9.96705 2.99998 10.5537 2.99998C11.3271 2.99998 12.0071 3.19998 12.5937 3.59998C13.1804 3.97331 13.7804 4.62665 14.3937 5.55998L17.5137 10.32L22.1137 3.51998C22.3271 3.41331 22.6204 3.31998 22.9937 3.23998C23.3937 3.13331 23.7804 3.07998 24.1537 3.07998C25.3804 3.07998 26.3404 3.37331 27.0337 3.95998C27.7271 4.54665 28.0737 5.26665 28.0737 6.11998C28.0737 6.86665 27.8737 7.53331 27.4737 8.11998C27.1004 8.70665 26.5804 9.41331 25.9137 10.24L21.7937 15.28L28.3137 24.6C28.1004 25.5866 27.6337 26.3733 26.9137 26.96C26.2204 27.52 25.2737 27.8 24.0737 27.8C23.3004 27.8 22.6337 27.6133 22.0737 27.24C21.5137 26.84 20.9404 26.1733 20.3537 25.24L17.1137 20.12L12.0737 27.72C11.8604 27.7466 11.6604 27.76 11.4737 27.76C11.2871 27.7866 11.1004 27.8 10.9137 27.8C9.39372 27.8 8.27372 27.4933 7.55372 26.88C6.83372 26.2666 6.47372 25.5066 6.47372 24.6C6.47372 23.8266 6.63372 23.16 6.95372 22.6C7.30039 22.0133 7.78039 21.3333 8.39372 20.56L12.5937 15.16L6.23372 6.19998Z"
                    fill="white"
                  />
                  <path
                    d="M6.23372 6.19998L4.35024 5.52731L3.9999 6.50824L4.60282 7.35763L6.23372 6.19998ZM6.79372 5.07998L5.11136 3.99846H5.11136L6.79372 5.07998ZM7.67372 4.07998L8.96563 5.60678L8.9753 5.59849L7.67372 4.07998ZM8.95372 3.31998L9.67862 5.18399L9.72274 5.16683L9.766 5.1476L8.95372 3.31998ZM12.5937 3.59998L11.467 5.25243L11.4932 5.27029L11.52 5.2873L12.5937 3.59998ZM14.3937 5.55998L16.0664 4.46359L16.0651 4.46162L14.3937 5.55998ZM17.5137 10.32L15.841 11.4164L17.4875 13.9283L19.1703 11.4406L17.5137 10.32ZM22.1137 3.51998L21.2193 1.73112L20.7507 1.96542L20.4572 2.39936L22.1137 3.51998ZM22.9937 3.23998L23.4128 5.19559L23.4612 5.18521L23.509 5.17245L22.9937 3.23998ZM27.0337 3.95998L25.7418 5.48675V5.48675L27.0337 3.95998ZM27.4737 8.11998L25.8213 6.99331L25.8034 7.01949L25.7864 7.04623L27.4737 8.11998ZM25.9137 10.24L27.4622 11.5058L27.4705 11.4955L25.9137 10.24ZM21.7937 15.28L20.2453 14.0142L19.2872 15.1861L20.1549 16.4264L21.7937 15.28ZM28.3137 24.6L30.2686 25.0226L30.4531 24.1691L29.9525 23.4535L28.3137 24.6ZM26.9137 26.96L28.1704 28.5159L28.1771 28.5105L26.9137 26.96ZM22.0737 27.24L20.9112 28.8674L20.9375 28.8862L20.9643 28.9041L22.0737 27.24ZM20.3537 25.24L22.047 24.1756L22.0438 24.1705L20.3537 25.24ZM17.1137 20.12L18.8038 19.0505L17.153 16.4419L15.4469 19.0146L17.1137 20.12ZM12.0737 27.72L12.3218 29.7045L13.233 29.5906L13.7405 28.8253L12.0737 27.72ZM11.4737 27.76V25.76H11.3316L11.1909 25.7801L11.4737 27.76ZM7.55372 26.88L6.25679 28.4025H6.25679L7.55372 26.88ZM6.95372 22.6L5.23187 21.5825L5.22446 21.5951L5.21723 21.6077L6.95372 22.6ZM8.39372 20.56L9.96072 21.8028L9.96661 21.7953L9.97243 21.7879L8.39372 20.56ZM12.5937 15.16L14.1724 16.3879L15.085 15.2145L14.2246 14.0023L12.5937 15.16ZM6.23372 6.19998L8.1172 6.87265C8.19362 6.6587 8.30882 6.42167 8.47608 6.1615L6.79372 5.07998L5.11136 3.99846C4.79862 4.48496 4.54049 4.99459 4.35024 5.52731L6.23372 6.19998ZM6.79372 5.07998L8.47608 6.1615C8.60625 5.95901 8.76692 5.77487 8.96561 5.60675L7.67372 4.07998L6.38183 2.55321C5.88719 2.97176 5.46119 3.45429 5.11136 3.99846L6.79372 5.07998ZM7.67372 4.07998L8.9753 5.59849C9.16926 5.43224 9.39889 5.29277 9.67862 5.18399L8.95372 3.31998L8.22883 1.45597C7.54855 1.72052 6.92485 2.08772 6.37214 2.56146L7.67372 4.07998ZM8.95372 3.31998L9.766 5.1476C9.9619 5.06054 10.2141 4.99998 10.5537 4.99998V2.99998V0.999979C9.72004 0.999979 8.90554 1.15276 8.14144 1.49236L8.95372 3.31998ZM10.5537 2.99998V4.99998C10.9626 4.99998 11.2422 5.09911 11.467 5.25243L12.5937 3.59998L13.7204 1.94753C12.7719 1.30085 11.6915 0.999979 10.5537 0.999979V2.99998ZM12.5937 3.59998L11.52 5.2873C11.7667 5.4443 12.181 5.8346 12.7223 6.65833L14.3937 5.55998L16.0651 4.46162C15.3798 3.4187 14.5941 2.50233 13.6675 1.91266L12.5937 3.59998ZM14.3937 5.55998L12.721 6.65637L15.841 11.4164L17.5137 10.32L19.1864 9.22359L16.0664 4.46359L14.3937 5.55998ZM17.5137 10.32L19.1703 11.4406L23.7703 4.6406L22.1137 3.51998L20.4572 2.39936L15.8572 9.19936L17.5137 10.32ZM22.1137 3.51998L23.0081 5.30883C22.9998 5.31299 23.0256 5.29956 23.1001 5.27583C23.1727 5.25276 23.275 5.22511 23.4128 5.19559L22.9937 3.23998L22.5747 1.28437C22.1224 1.38128 21.6458 1.51789 21.2193 1.73112L22.1137 3.51998ZM22.9937 3.23998L23.509 5.17245C23.759 5.1058 23.9721 5.07998 24.1537 5.07998V3.07998V1.07998C23.5887 1.07998 23.0285 1.16082 22.4784 1.30751L22.9937 3.23998ZM24.1537 3.07998V5.07998C25.0738 5.07998 25.5191 5.29826 25.7418 5.48675L27.0337 3.95998L28.3256 2.43321C27.1617 1.44836 25.6869 1.07998 24.1537 1.07998V3.07998ZM27.0337 3.95998L25.7418 5.48675C26.019 5.72128 26.0737 5.89677 26.0737 6.11998H28.0737H30.0737C30.0737 4.63652 29.4351 3.37201 28.3256 2.43321L27.0337 3.95998ZM28.0737 6.11998H26.0737C26.0737 6.4866 25.9828 6.75639 25.8213 6.99331L27.4737 8.11998L29.1262 9.24665C29.7646 8.31023 30.0737 7.24669 30.0737 6.11998H28.0737ZM27.4737 8.11998L25.7864 7.04623C25.4681 7.54634 24.9983 8.18908 24.3569 8.98447L25.9137 10.24L27.4705 11.4955C28.1624 10.6375 28.7326 9.86696 29.161 9.19373L27.4737 8.11998ZM25.9137 10.24L24.3653 8.97417L20.2453 14.0142L21.7937 15.28L23.3422 16.5458L27.4622 11.5058L25.9137 10.24ZM21.7937 15.28L20.1549 16.4264L26.6749 25.7464L28.3137 24.6L29.9525 23.4535L23.4325 14.1335L21.7937 15.28ZM28.3137 24.6L26.3589 24.1773C26.2326 24.7616 25.9873 25.135 25.6504 25.4095L26.9137 26.96L28.1771 28.5105C29.2801 27.6117 29.9682 26.4117 30.2686 25.0226L28.3137 24.6ZM26.9137 26.96L25.657 25.4041C25.4257 25.591 24.9746 25.8 24.0737 25.8V27.8V29.8C25.5728 29.8 27.0151 29.449 28.1704 28.5159L26.9137 26.96ZM24.0737 27.8V25.8C23.6347 25.8 23.3676 25.6989 23.1831 25.5759L22.0737 27.24L20.9643 28.9041C21.8998 29.5278 22.9661 29.8 24.0737 29.8V27.8ZM22.0737 27.24L23.2362 25.6125C22.9772 25.4275 22.5686 25.0055 22.047 24.1756L20.3537 25.24L18.6604 26.3043C19.3122 27.3411 20.0502 28.2524 20.9112 28.8674L22.0737 27.24ZM20.3537 25.24L22.0438 24.1705L18.8038 19.0505L17.1137 20.12L15.4237 21.1895L18.6637 26.3095L20.3537 25.24ZM17.1137 20.12L15.4469 19.0146L10.4069 26.6146L12.0737 27.72L13.7405 28.8253L18.7805 21.2253L17.1137 20.12ZM12.0737 27.72L11.8257 25.7354C11.6826 25.7533 11.5661 25.76 11.4737 25.76V27.76V29.76C11.7546 29.76 12.0382 29.74 12.3218 29.7045L12.0737 27.72ZM11.4737 27.76L11.1909 25.7801C11.0969 25.7935 11.0048 25.8 10.9137 25.8V27.8V29.8C11.196 29.8 11.4772 29.7798 11.7566 29.7399L11.4737 27.76ZM10.9137 27.8V25.8C9.59809 25.8 9.04551 25.5235 8.85065 25.3575L7.55372 26.88L6.25679 28.4025C7.50193 29.4631 9.18935 29.8 10.9137 29.8V27.8ZM7.55372 26.88L8.85065 25.3575C8.55468 25.1054 8.47372 24.8923 8.47372 24.6H6.47372H4.47372C4.47372 26.121 5.11276 27.4279 6.25679 28.4025L7.55372 26.88ZM6.47372 24.6H8.47372C8.47372 24.1054 8.57429 23.7951 8.69021 23.5923L6.95372 22.6L5.21723 21.6077C4.69315 22.5248 4.47372 23.5479 4.47372 24.6H6.47372ZM6.95372 22.6L8.67557 23.6174C8.96032 23.1356 9.38133 22.5333 9.96072 21.8028L8.39372 20.56L6.82673 19.3172C6.17944 20.1333 5.64045 20.8911 5.23187 21.5825L6.95372 22.6ZM8.39372 20.56L9.97243 21.7879L14.1724 16.3879L12.5937 15.16L11.015 13.9321L6.81502 19.3321L8.39372 20.56ZM12.5937 15.16L14.2246 14.0023L7.86462 5.04233L6.23372 6.19998L4.60282 7.35763L10.9628 16.3176L12.5937 15.16Z"
                    fill="#D76826"
                    mask="url(#path-1-outside-1_4211_433)"
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_d_4211_433"
                    x="0"
                    y="0"
                    width="34.4531"
                    height="36.8"
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
                    <feColorMatrix
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"
                    />
                    <feBlend
                      mode="normal"
                      in2="BackgroundImageFix"
                      result="effect1_dropShadow_4211_433"
                    />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="effect1_dropShadow_4211_433"
                      result="shape"
                    />
                  </filter>
                </defs>
              </svg>
            </span>
          </div>
        </template>
      </div>
    </div>

    <div class="w-full grid grid-cols-4 gap-2 items-center mt-4">
      <div
        v-for="item in gallery"
        :key="item.id"
        class="border border-[#CF8741] bg-[#FDE7B8] rounded-2xl flex justify-center items-center cursor-grab h-16 p-2"
        :class="{ 'opacity-30 pointer-events-none': isUsed(item.id) }"
        style="
          box-shadow:
            inset 0px 2px 2px rgba(255, 255, 255, 0.25),
            inset 0px -2px 2px rgba(0, 0, 0, 0.25);
        "
        draggable="true"
        @dragstart="onDragStart(item)"
        @dragend="onDropEnd"
        @touchstart.prevent="onTouchStart(item, $event)"
      >
        <img :src="item.src" class="h-full" />
      </div>
    </div>

    <button
      @click="handleSubmit"
      type="button"
      class="claim bg-[#5edf3d] text-white font-bold text-3xl rounded-full border border-[#552a0f] mt-4 px-5 py-[2px] disabled:bg-slate-400"
    >
      Claim
    </button>
  </div>
</template>
