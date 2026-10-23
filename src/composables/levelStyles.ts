/** The look of each level badge (1–10). Colours get richer and rarer the higher the level. */
export interface LevelStyle {
  level: number
  name: string
  /** shield, top and bottom of the gradient */
  shield: [string, string]
  /** the lit gem inside the shield, dark to light */
  inner: [string, string]
  wing: string
  wingDark: string
  /** thin outline of every part */
  stroke: string
  /** outline of the "LV" text, and the text itself */
  textOutline: string
  text: string
  /** soft light around the whole badge (top levels only) */
  glow?: string
  /** colours keep shifting (the top level) */
  prismatic?: boolean
}

export const LEVEL_STYLES: LevelStyle[] = [
  {
    level: 1, name: 'Ember',
    shield: ['#ED8800', '#A32F04'], inner: ['#BA3D02', '#FFB203'],
    wing: '#DF7E03', wingDark: '#C4761D', stroke: '#890D00', textOutline: '#95410d', text: '#feeef8',
  },
  {
    level: 2, name: 'Meadow',
    shield: ['#4CC93A', '#17731A'], inner: ['#1F7A1B', '#A6F26B'],
    wing: '#3DB32E', wingDark: '#2A8F25', stroke: '#0B4A10', textOutline: '#0f4a14', text: '#f3ffe9',
  },
  {
    level: 3, name: 'Lagoon',
    shield: ['#3FA7FF', '#1450B8'], inner: ['#1747A8', '#8FDBFF'],
    wing: '#2F8FEF', wingDark: '#2476D6', stroke: '#0A2D6B', textOutline: '#0b2f73', text: '#eef8ff',
  },
  {
    level: 4, name: 'Silver',
    shield: ['#EEF2F8', '#7C8794'], inner: ['#6A7584', '#FFFFFF'],
    wing: '#C9D2DE', wingDark: '#A7B2C0', stroke: '#4A5463', textOutline: '#4a5463', text: '#ffffff',
  },
  {
    level: 5, name: 'Gold',
    shield: ['#FFD84A', '#B97A00'], inner: ['#A86A00', '#FFF3A6'],
    wing: '#F5C21D', wingDark: '#D9A010', stroke: '#6B4300', textOutline: '#6b4300', text: '#fffbe6',
    glow: 'rgba(255, 207, 64, 0.55)',
  },
  {
    level: 6, name: 'Ruby',
    shield: ['#FF4D5E', '#8E0A22'], inner: ['#7A0A1E', '#FF9AA6'],
    wing: '#E8344A', wingDark: '#BF2238', stroke: '#4D0613', textOutline: '#560816', text: '#fff0f2',
    glow: 'rgba(255, 70, 90, 0.5)',
  },
  {
    level: 7, name: 'Amethyst',
    shield: ['#B56BFF', '#4B1C99'], inner: ['#3C1580', '#E0B8FF'],
    wing: '#9A55E6', wingDark: '#7B3CC4', stroke: '#2A0D5C', textOutline: '#30106b', text: '#f8f0ff',
    glow: 'rgba(181, 107, 255, 0.55)',
  },
  {
    level: 8, name: 'Emerald',
    shield: ['#1FD08A', '#04523A'], inner: ['#05402D', '#7DFFC8'],
    wing: '#12B878', wingDark: '#0B9560', stroke: '#022B1E', textOutline: '#03352a', text: '#eafff6',
    glow: 'rgba(40, 235, 160, 0.6)',
  },
  {
    level: 9, name: 'Obsidian',
    shield: ['#4A4F5E', '#0B0D14'], inner: ['#0B0D14', '#FFD84A'],
    wing: '#F5C21D', wingDark: '#C58F0C', stroke: '#1A1200', textOutline: '#1a1200', text: '#ffe27a',
    glow: 'rgba(255, 214, 80, 0.7)',
  },
  {
    level: 10, name: 'Legend',
    shield: ['#FF5FD2', '#4A3CFF'], inner: ['#3A1BA8', '#7DF9FF'],
    wing: '#FFE27A', wingDark: '#FFB52E', stroke: '#3A0B6B', textOutline: '#3a0b6b', text: '#ffffff',
    glow: 'rgba(255, 255, 255, 0.75)', prismatic: true,
  },
]

export const MAX_LEVEL = LEVEL_STYLES.length

/** the badge look for a level, kept inside 1–10 */
export function levelStyle(level: number): LevelStyle {
  const n = Math.min(MAX_LEVEL, Math.max(1, Math.floor(level) || 1))
  return LEVEL_STYLES[n - 1]!
}
