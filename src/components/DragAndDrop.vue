<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'

interface ImageItem {
  id: number
  src: string
}

const MAX_CELLS = 4

const sourceImages: ImageItem[] = [
  { id: 1, src: 'https://picsum.photos/seed/alpha/200/200' },
  { id: 2, src: 'https://picsum.photos/seed/bravo/200/200' },
  { id: 3, src: 'https://picsum.photos/seed/charlie/200/200' },
  { id: 4, src: 'https://picsum.photos/seed/delta/200/200' },
  { id: 5, src: 'https://picsum.photos/seed/echo/200/200' },
  { id: 6, src: 'https://picsum.photos/seed/foxtrot/200/200' },
  { id: 7, src: 'https://picsum.photos/seed/golf/200/200' },
  { id: 8, src: 'https://picsum.photos/seed/hotel/200/200' },
]

const gallery = ref<ImageItem[]>([...sourceImages])
const container = ref<ImageItem[]>([])

const dragItem = ref<ImageItem | null>(null)
const overIndex = ref<number | null>(null)

const isFull = computed(() => container.value.length >= MAX_CELLS)

function isUsed(id: number) {
  return container.value.some((i) => i.id === id)
}

/* ───────── Desktop Drag ───────── */

function onDragStart(item: ImageItem) {
  dragItem.value = item
}

function onDropToContainer(index: number) {
  if (!dragItem.value) return

  const exists = isUsed(dragItem.value.id)
  const currentIndex = container.value.findIndex((i) => i.id === dragItem.value!.id)

  // Reorder inside container
  if (currentIndex !== -1) {
    container.value.splice(currentIndex, 1)
    container.value.splice(index, 0, dragItem.value)
  } else {
    if (exists || isFull.value) return
    container.value.splice(index, 0, dragItem.value)
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
    width: 70px;
    height: 70px;
    object-fit: cover;
    border-radius: 10px;
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

  const touch = ev.touches[0]
  if (!touch) return
  const { clientX, clientY } = touch
  createGhost(item, clientX, clientY)

  document.addEventListener('touchmove', onTouchMove, { passive: false })
  document.addEventListener('touchend', onTouchEnd)
}

function onTouchMove(ev: TouchEvent) {
  ev.preventDefault()
  if (!ghost) return

  const touch = ev.touches[0]
  if (!touch) return
  const { clientX, clientY } = touch
  ghost.style.left = `${clientX - 35}px`
  ghost.style.top = `${clientY - 35}px`

  const el = document.elementFromPoint(clientX, clientY)
  const idx = el?.closest('[data-slot]')?.getAttribute('data-slot')

  overIndex.value = idx ? Number(idx) : null
}

function onTouchEnd(ev: TouchEvent) {
  if (!dragItem.value) return

  const touch = ev.changedTouches[0]
  if (!touch) return
  const { clientX, clientY } = touch
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
  alert(JSON.stringify(container.value.map((i) => i.id)))
}
</script>

<template>
  <div class="im">
    <h1 class="im-title">Image Manager</h1>

    <!-- Gallery -->
    <div class="im-gallery">
      <div
        v-for="item in gallery"
        :key="item.id"
        class="im-thumb"
        :class="{ 'im-thumb--used': isUsed(item.id) }"
        draggable="true"
        @dragstart="onDragStart(item)"
        @dragend="onDropEnd"
        @touchstart.prevent="onTouchStart(item, $event)"
      >
        <img :src="item.src" />
      </div>
    </div>

    <!-- Container -->
    <div class="im-drop">
      <div
        v-for="n in MAX_CELLS"
        :key="n"
        class="im-slot"
        :data-slot="n - 1"
        :class="{ over: overIndex === n - 1 }"
        @dragover.prevent="overIndex = n - 1"
        @drop.prevent="onDropToContainer(n - 1)"
      >
        <template v-if="container[n - 1]">
          <div
            class="im-cell"
            draggable="true"
            @dragstart="onDragStart(container[n - 1]!)"
            @dragend="onDropEnd"
            @touchstart.prevent="onTouchStart(container[n - 1]!, $event)"
          >
            <img :src="container[n - 1]!.src" />
          </div>
        </template>
        <span v-else>+</span>
      </div>
    </div>

    <button :disabled="!isFull" @click="handleSubmit">Submit</button>
  </div>
</template>

<style scoped>
.im-gallery {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 20px;
}

.im-thumb {
  width: 64px;
  height: 64px;
  cursor: grab;
}

.im-thumb--used {
  opacity: 0.3;
  pointer-events: none;
}

.im-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}

.im-drop {
  display: grid;
  grid-template-columns: repeat(4, 80px);
  gap: 10px;
  margin-bottom: 20px;
}

.im-slot {
  width: 80px;
  height: 100px;
  border: 2px dashed #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
}

.im-slot.over {
  background: #e0f0ff;
}

.im-cell {
  width: 100%;
  height: 100%;
}

.im-cell img {
  width: 100%;
  height: 70px;
  object-fit: cover;
}
</style>
