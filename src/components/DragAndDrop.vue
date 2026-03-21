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
  <div class="im">
    <h1 class="im-title">Image Manager</h1>
    <p class="im-desc">Drag images into any slot. Each image can only be used once.</p>

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
        <span class="im-thumb-id">#{{ item.id }}</span>
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
        @dragleave="overIndex = null"
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
            <span class="im-cell-pos">{{ n }}</span>
          </div>
        </template>

        <template v-else>
          <span class="im-slot-plus">+</span>
          <span class="im-slot-pos">{{ n }}</span>
        </template>
      </div>
    </div>

    <!-- Submit -->
    <button class="im-submit" :disabled="!isFull" @click="handleSubmit">Submit</button>
  </div>
</template>

<style scoped>
.im {
  max-width: 600px;
  font-family: system-ui;
}

.im-title {
  font-size: 1.4rem;
  font-weight: 700;
}

.im-desc {
  color: #666;
  margin-bottom: 20px;
}

.im-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.im-thumb {
  width: 70px;
  text-align: center;
  cursor: grab;
}

.im-thumb--used {
  opacity: 0.3;
  pointer-events: none;
}

.im-thumb img {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
}

.im-thumb-id {
  font-size: 0.7rem;
  color: #888;
}

.im-drop {
  display: grid;
  grid-template-columns: repeat(4, 90px);
  gap: 10px;
  margin-bottom: 20px;
}

.im-slot {
  width: 90px;
  height: 106px;
  border: 2px dashed #ccc;
  border-radius: 12px;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.im-slot.over {
  background: #e0f0ff;
}

.im-slot-plus {
  font-size: 1.5rem;
  color: #ccc;
}

.im-slot-pos {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.6rem;
  color: #aaa;
}

.im-cell {
  width: 100%;
  height: 100%;
  position: relative;
}

.im-cell img {
  width: 100%;
  height: 70px;
  object-fit: cover;
  border-radius: 8px;
}

.im-cell-pos {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.6rem;
  color: #aaa;
}

.im-submit {
  padding: 10px 30px;
  background: #264653;
  color: #fff;
  border-radius: 8px;
  border: none;
}

.im-submit:disabled {
  opacity: 0.3;
}
</style>
