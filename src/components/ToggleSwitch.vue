<script setup lang="ts">
/**
 * The game's on/off switch: a green pill that lights up, with a round white knob that slides across.
 * The knob is always inset by the same 2px on every side, so it never touches the edge or looks off-centre.
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
.toggle {
  --h: 1.75rem;
  --pad: 2px;
  position: relative;
  display: block;
  flex: none;
  width: calc(var(--h) * 1.75);
  height: var(--h);
  padding: 0;
  border: 1px solid #a8844f;
  border-radius: 9999px;
  background: #c9a97d;
  box-shadow: inset 0 2px 3px rgba(0, 0, 0, 0.28);
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    opacity 0.2s ease;
  -webkit-tap-highlight-color: transparent;
}
.toggle.sm {
  --h: 1.4rem;
}
.toggle.on {
  background: linear-gradient(180deg, #34d13b, #1fb826);
  border-color: #168a1c;
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
  position: absolute;
  top: calc(var(--pad) - 1px);
  left: calc(var(--pad) - 1px);
  width: calc(var(--h) - var(--pad) * 2);
  height: calc(var(--h) - var(--pad) * 2);
  border-radius: 9999px;
  background: radial-gradient(circle at 35% 30%, #ffffff, #f1ece1);
  box-shadow:
    0 2px 3px rgba(0, 0, 0, 0.35),
    inset 0 -1px 1px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s cubic-bezier(0.3, 0.9, 0.4, 1);
}
/* travel = track width − knob − both paddings (the 1px borders are already inside the box) */
.toggle.on .knob {
  transform: translateX(calc(var(--h) * 0.75));
}

@media (prefers-reduced-motion: reduce) {
  .toggle,
  .knob {
    transition: none;
  }
}
</style>
