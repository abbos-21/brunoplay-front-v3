<script setup lang="ts">
/**
 * The game's on/off switch: a green pill that lights up, with a round white knob that slides across.
 * The knob is always inset by the same 3px on every side, so it never touches the edge or looks off-centre.
 */
const props = withDefaults(
  defineProps<{
    modelValue: boolean
    /** md for the main rows, sm for lists inside a card */
    size?: 'md' | 'sm'
    disabled?: boolean
    label?: string
  }>(),
  { size: 'md', disabled: false, label: '' },
)
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()

function toggle() {
  if (!props.disabled) emit('update:modelValue', !props.modelValue)
}
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :aria-label="label || undefined"
    :disabled="disabled"
    class="toggle"
    :class="[size, { on: modelValue }]"
    @click.stop="toggle"
  >
    <span class="knob" />
  </button>
</template>

<style scoped>
/* Everything is in whole pixels and the knob is centred by flexbox, not by offsets: fractional sizes (rem on a scaled screen,
   a 1px border that rounds differently from the knob) are what made the gaps uneven on some phones.
   track = --w x --h, knob = --h - 2 x --pad, the ring is drawn inside the track so it never changes the size. */
.toggle {
  --w: 50px;
  --h: 28px;
  --pad: 3px;
  --knob: calc(var(--h) - var(--pad) * 2);
  --ring: #a8844f;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex: none;
  width: var(--w);
  min-width: var(--w);
  height: var(--h);
  min-height: var(--h);
  margin: 0;
  padding: var(--pad);
  border: 0;
  border-radius: 9999px;
  background: #c9a97d;
  box-shadow:
    inset 0 0 0 1px var(--ring),
    inset 0 2px 3px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  appearance: none;
  -webkit-appearance: none;
  transition:
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.toggle.sm {
  --w: 40px;
  --h: 22px;
}
.toggle.on {
  --ring: #168a1c;
  background: linear-gradient(180deg, #34d13b, #1fb826);
}
.toggle:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}
.toggle:focus-visible {
  outline: 2px solid #f96a07;
  outline-offset: 2px;
}

.knob {
  display: block;
  flex: none;
  box-sizing: border-box;
  width: var(--knob);
  height: var(--knob);
  border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, #ffffff, #f1ece1);
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.35),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s cubic-bezier(0.3, 0.9, 0.4, 1);
}
/* travel = track width - knob - both paddings: the same gap on the left when off and on the right when on */
.toggle.on .knob {
  transform: translateX(calc(var(--w) - var(--knob) - var(--pad) * 2));
}

@media (prefers-reduced-motion: reduce) {
  .toggle,
  .knob {
    transition: none;
  }
}
</style>
