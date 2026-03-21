<!-- <script setup lang="ts">
import { ref, onBeforeUnmount } from 'vue'

type Zone = 'div1' | 'div2'

const currentZone = ref<Zone>('div1')
const isDragging = ref(false)
const overZone = ref<Zone | null>(null)

const div1Ref = ref<HTMLDivElement | null>(null)
const div2Ref = ref<HTMLDivElement | null>(null)

let ghost: HTMLImageElement | null = null
let touchActive = false

const IMG_SRC = 'https://www.w3schools.com/html/img_w3slogo.gif'
const IMG_W = 88
const IMG_H = 31

// ─── Desktop Drag & Drop ───────────────────────────────────

function onDragStart(ev: DragEvent): void {
  isDragging.value = true
  ev.dataTransfer!.effectAllowed = 'move'
}

function onDragEnd(): void {
  isDragging.value = false
  overZone.value = null
}

function onDragOver(zone: Zone): void {
  overZone.value = zone
}

function onDragLeave(zone: Zone): void {
  if (overZone.value === zone) overZone.value = null
}

function onDrop(zone: Zone): void {
  overZone.value = null
  isDragging.value = false
  currentZone.value = zone
}

// ─── Touch (mobile) support ────────────────────────────────

function getZoneAtPoint(x: number, y: number): Zone | null {
  const el = document.elementFromPoint(x, y)
  if (div1Ref.value?.contains(el)) return 'div1'
  if (div2Ref.value?.contains(el)) return 'div2'
  return null
}

function onTouchStart(ev: TouchEvent): void {
  touchActive = true
  isDragging.value = true

  const { clientX, clientY } = ev.touches[0]

  ghost = document.createElement('img')
  ghost.src = IMG_SRC
  ghost.style.cssText = `
    position: fixed;
    pointer-events: none;
    z-index: 9999;
    opacity: 0.8;
    width: ${IMG_W}px;
    height: ${IMG_H}px;
    left: ${clientX - IMG_W / 2}px;
    top: ${clientY - IMG_H / 2}px;
  `
  document.body.appendChild(ghost)

  document.addEventListener('touchmove', globalTouchMove, { passive: false })
  document.addEventListener('touchend', globalTouchEnd)
}

function globalTouchMove(ev: TouchEvent): void {
  ev.preventDefault()
  if (!ghost) return

  const { clientX, clientY } = ev.touches[0]
  ghost.style.left = `${clientX - IMG_W / 2}px`
  ghost.style.top = `${clientY - IMG_H / 2}px`

  overZone.value = getZoneAtPoint(clientX, clientY)
}

function globalTouchEnd(ev: TouchEvent): void {
  if (!touchActive) return

  const { clientX, clientY } = ev.changedTouches[0]
  const targetZone = getZoneAtPoint(clientX, clientY)

  if (targetZone) {
    currentZone.value = targetZone
  }

  cleanup()
}

function cleanup(): void {
  isDragging.value = false
  overZone.value = null
  touchActive = false
  if (ghost) {
    ghost.remove()
    ghost = null
  }
  document.removeEventListener('touchmove', globalTouchMove)
  document.removeEventListener('touchend', globalTouchEnd)
}

onBeforeUnmount(cleanup)
</script>

<template>
  <div class="dnd-wrapper">
    <h1>Drag and Drop API</h1>
    <p>Drag the image back and forth between the two div elements.</p>

    <div class="dnd-zones">
      <div
        ref="div1Ref"
        class="drop-zone"
        :class="{ over: overZone === 'div1' }"
        @dragover.prevent="onDragOver('div1')"
        @dragleave="onDragLeave('div1')"
        @drop.prevent="onDrop('div1')"
      >
        <img
          v-if="currentZone === 'div1'"
          class="draggable-img"
          :class="{ dragging: isDragging }"
          :src="IMG_SRC"
          :width="IMG_W"
          :height="IMG_H"
          alt="W3S Logo"
          draggable="true"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
          @touchstart.prevent="onTouchStart"
        />
      </div>

      <div
        ref="div2Ref"
        class="drop-zone"
        :class="{ over: overZone === 'div2' }"
        @dragover.prevent="onDragOver('div2')"
        @dragleave="onDragLeave('div2')"
        @drop.prevent="onDrop('div2')"
      >
        <img
          v-if="currentZone === 'div2'"
          class="draggable-img"
          :class="{ dragging: isDragging }"
          :src="IMG_SRC"
          :width="IMG_W"
          :height="IMG_H"
          alt="W3S Logo"
          draggable="true"
          @dragstart="onDragStart"
          @dragend="onDragEnd"
          @touchstart.prevent="onTouchStart"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.dnd-wrapper h1 {
  font-size: 1.4rem;
  margin-bottom: 4px;
}

.dnd-wrapper p {
  color: #555;
  margin-bottom: 16px;
  font-size: 0.95rem;
}

.dnd-zones {
  display: flex;
  gap: 20px;
}

.drop-zone {
  width: 120px;
  height: 55px;
  padding: 10px;
  border: 1px solid #000;
  transition: background 0.15s;
}

.drop-zone.over {
  background: #e0f0ff;
}

.draggable-img {
  cursor: grab;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.draggable-img.dragging {
  opacity: 0.4;
}
</style> -->

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { VueDraggable } from 'vue-draggable-plus'

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

const isFull = computed(() => container.value.length >= MAX_CELLS)
const emptyCount = computed(() => MAX_CELLS - container.value.length)

function isUsed(id: number): boolean {
  return container.value.some((item) => item.id === id)
}

function onContainerAdd(): void {
  nextTick(() => {
    // Remove duplicates — keep first occurrence only
    const seen = new Set<number>()
    container.value = container.value.filter((item) => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })
    // Enforce max
    if (container.value.length > MAX_CELLS) {
      container.value.splice(MAX_CELLS)
    }
  })
}

function removeItem(index: number): void {
  container.value.splice(index, 1)
}

function handleSubmit(): void {
  const result = container.value.map((item) => item.id)
  console.log('Submitted order:', result)
  alert(`Submitted: [${result.join(', ')}]`)
}
</script>

<template>
  <div class="im">
    <h1 class="im-title">Image Manager</h1>
    <p class="im-desc">Drag images into the container. Each image can only be used once.</p>

    <!-- ── Source gallery ── -->
    <h2 class="im-label">Available Images</h2>
    <VueDraggable
      v-model="gallery"
      :group="{ name: 'shared', pull: 'clone', put: false }"
      :sort="false"
      class="im-gallery"
    >
      <div
        v-for="item in gallery"
        :key="item.id"
        class="im-thumb"
        :class="{ 'im-thumb--used': isUsed(item.id) }"
      >
        <img :src="item.src" :alt="'Image ' + item.id" draggable="false" />
        <span class="im-thumb-id">#{{ item.id }}</span>
      </div>
    </VueDraggable>

    <!-- ── Drop container ── -->
    <h2 class="im-label">
      Container
      <span class="im-badge">{{ container.length }} / {{ MAX_CELLS }}</span>
    </h2>

    <div class="im-drop-wrapper">
      <!-- Empty slot backgrounds (always renders 4 cells) -->
      <div class="im-slots-bg">
        <div v-for="n in MAX_CELLS" :key="'bg-' + n" class="im-slot-bg">
          <span class="im-slot-plus">+</span>
          <span class="im-slot-pos">{{ n }}</span>
        </div>
      </div>

      <!-- Draggable layer on top -->
      <VueDraggable
        v-model="container"
        :group="{ name: 'shared', put: true }"
        :animation="200"
        class="im-drop-zone"
        @add="onContainerAdd"
      >
        <div v-for="(item, idx) in container" :key="item.id" class="im-cell">
          <img :src="item.src" :alt="'Image ' + item.id" draggable="false" />
          <span class="im-cell-id">#{{ item.id }}</span>
          <span class="im-cell-pos">{{ idx + 1 }}</span>
          <button class="im-cell-rm" @click="removeItem(idx)">&times;</button>
        </div>
      </VueDraggable>
    </div>

    <!-- ── Submit ── -->
    <button class="im-submit" :disabled="!isFull" @click="handleSubmit">Submit</button>
  </div>
</template>

<style scoped>
.im {
  max-width: 600px;
  font-family: 'Segoe UI', system-ui, sans-serif;
}

.im-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 2px;
}

.im-desc {
  color: #666;
  font-size: 0.88rem;
  margin: 0 0 20px;
}

.im-label {
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #555;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.im-badge {
  font-size: 0.7rem;
  font-weight: 600;
  background: #eee;
  color: #777;
  padding: 1px 8px;
  border-radius: 9px;
}

/* ── Gallery ── */

.im-gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
  min-height: 88px;
}

.im-thumb {
  width: 70px;
  text-align: center;
  cursor: grab;
  transition:
    opacity 0.2s,
    transform 0.15s;
}

.im-thumb:active {
  cursor: grabbing;
}

.im-thumb--used {
  opacity: 0.25;
  pointer-events: none;
}

.im-thumb img {
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 10px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  display: block;
  margin: 0 auto;
  transition:
    transform 0.15s,
    box-shadow 0.15s;
}

.im-thumb:not(.im-thumb--used):hover img {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.im-thumb-id {
  font-size: 0.68rem;
  color: #999;
  font-weight: 600;
  margin-top: 2px;
  display: block;
}

/* ── Drop area ── */

.im-drop-wrapper {
  position: relative;
  margin-bottom: 20px;
  /* Fixed size: always shows 4 cells */
  width: calc(4 * 90px + 3 * 10px);
  height: 106px;
}

/* Background grid — always shows 4 empty slots */
.im-slots-bg {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 90px);
  gap: 10px;
}

.im-slot-bg {
  border: 2px dashed #d0d0d0;
  border-radius: 12px;
  background: #fafafa;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.im-slot-plus {
  font-size: 1.6rem;
  color: #ccc;
  font-weight: 300;
  line-height: 1;
}

.im-slot-pos {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.58rem;
  font-weight: 700;
  color: #bbb;
}

/* Draggable zone — sits on top, same size */
.im-drop-zone {
  position: absolute;
  inset: 0;
  display: grid;
  grid-template-columns: repeat(4, 90px);
  gap: 10px;
  z-index: 1;
}

/* ── Filled cells ── */

.im-cell {
  width: 90px;
  height: 106px;
  border-radius: 12px;
  border: 2px solid #e0e0e0;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: grab;
}

.im-cell:active {
  cursor: grabbing;
}

.im-cell img {
  width: 54px;
  height: 54px;
  object-fit: cover;
  border-radius: 8px;
}

.im-cell-id {
  font-size: 0.68rem;
  font-weight: 600;
  color: #777;
  margin-top: 2px;
}

.im-cell-pos {
  position: absolute;
  bottom: 4px;
  right: 6px;
  font-size: 0.58rem;
  font-weight: 700;
  color: #bbb;
}

.im-cell-rm {
  position: absolute;
  top: -7px;
  right: -7px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #fff;
  background: #d9534f;
  color: #fff;
  font-size: 0.9rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.15s;
}

.im-cell:hover .im-cell-rm {
  opacity: 1;
}

/* ── Submit ── */

.im-submit {
  padding: 10px 36px;
  font-size: 0.92rem;
  font-weight: 600;
  border: none;
  border-radius: 8px;
  background: #264653;
  color: #fff;
  cursor: pointer;
  transition:
    background 0.2s,
    opacity 0.2s;
}

.im-submit:hover:not(:disabled) {
  background: #1a3440;
}

.im-submit:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
