import {
  PrizeHeart,
  PrizeApple,
  PrizeRing,
  PrizeWatch,
  PrizeCat,
  PrizePanda,
  PrizeCap,
  PrizeFrog,
} from '@/assets/images/spin'
import { reactive } from 'vue'
import client from '@/api/client'
import { getGiftArt } from '@/api/games'
import { CoinImage } from '@/assets/images'
import { StarIcon } from '@/assets/svgs'
import type { SpinPrize } from '@/types'

/** Gift artwork, in the order the pictures appear around the wheel. */
const GIFTS = [
  { key: 'heart', img: PrizeHeart },
  { key: 'apple', img: PrizeApple },
  { key: 'ring', img: PrizeRing },
  { key: 'watch', img: PrizeWatch },
  { key: 'cat', img: PrizeCat },
  { key: 'panda', img: PrizePanda },
  { key: 'cap', img: PrizeCap },
  { key: 'frog', img: PrizeFrog },
]

/**
 * Pictures uploaded in the admin panel, by gift key (the value changes with every upload, so a new picture is not hidden by the cache).
 * A gift that is not here keeps the artwork bundled above. Reactive: screens that already drew a gift redraw when this arrives.
 */
const uploadedArt = reactive<Record<string, number>>({})
let artTriedAt = 0

function loadGiftArt() {
  const now = Date.now()
  if (now - artTriedAt < 60_000) return // asked a moment ago (or it failed a moment ago): do not ask again at once
  artTriedAt = now
  getGiftArt()
    .then((list) => {
      for (const k of Object.keys(uploadedArt)) delete uploadedArt[k]
      for (const g of list) uploadedArt[g.key] = g.imageV
    })
    .catch(() => {})
}

const uploadedImg = (key: string | undefined): string | undefined => {
  const v = key ? uploadedArt[key] : undefined
  return key && v ? `${client.defaults.baseURL ?? '/api'}/gift-images/${encodeURIComponent(key)}?v=${v}` : undefined
}

export type PrizeKind = 'gift' | 'coins' | 'stars' | 'empty'

/** the picture of an empty slot / an empty chest: a grey token with a cross */
export const EmptyImage =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" fill="#aab6cf" stroke="#6f7fa3" stroke-width="5"/><circle cx="50" cy="50" r="34" fill="none" stroke="#e6ecf8" stroke-width="3" stroke-dasharray="6 6"/><path d="M35 35 L65 65 M65 35 L35 65" stroke="#fff" stroke-width="9" stroke-linecap="round"/></svg>',
  )

export interface ResolvedPrize {
  prize: SpinPrize
  kind: PrizeKind
  /** big picture for the prize */
  img: string
  /** what the little pill shows */
  amount: string
  name: string
}

const num = (n: number) => n.toLocaleString('en-US')

/** Attach artwork / labels to a list of API prizes. Gifts are matched by their key or label, else by position. */
export function resolvePrizes(prizes: SpinPrize[]): ResolvedPrize[] {
  let giftIndex = 0
  loadGiftArt()
  return prizes.map((prize): ResolvedPrize => {
    if (prize.type === 'empty') {
      return { prize, kind: 'empty', img: EmptyImage, amount: '', name: prize.label || 'Empty' }
    }
    if (prize.type === 'coins') {
      return { prize, kind: 'coins', img: CoinImage, amount: num(prize.value), name: 'Coins' }
    }
    if (prize.type === 'stars') {
      return { prize, kind: 'stars', img: StarIcon, amount: num(prize.value), name: 'Stars' }
    }
    // the catalogue key (heart, apple, ...) when the server sends it, else the label
    const label = `${prize.gift ?? ''} ${prize.label ?? ''}`.toLowerCase()
    const byLabel = GIFTS.find((g) => label.includes(g.key))
    const art = byLabel ?? GIFTS[giftIndex % GIFTS.length]!
    giftIndex++
    return {
      prize,
      kind: 'gift',
      img: uploadedImg(prize.gift) ?? art.img,
      amount: num(prize.value),
      name: prize.label || art.key,
    }
  })
}

/**
 * The picture of a win from the live list: coins and stars have their own, a gift is found by its catalogue key
 * (the picture uploaded in the admin panel, else the bundled artwork), and only then by its value.
 */
export function winImage(w: { prizeType: string; prizeValue: number; gift?: string }, known: SpinPrize[]): string {
  if (w.prizeType === 'coins') return CoinImage
  if (w.prizeType === 'stars') return StarIcon
  const resolved = resolvePrizes(known)
  const gifts = resolved.filter((r) => r.kind === 'gift')
  const byKey = w.gift ? gifts.find((r) => r.prize.gift === w.gift) : undefined
  if (byKey) return byKey.img
  if (w.gift) {
    const uploaded = uploadedImg(w.gift)
    if (uploaded) return uploaded
    const bundled = GIFTS.find((g) => w.gift!.toLowerCase().includes(g.key))
    if (bundled) return bundled.img
  }
  return gifts.find((r) => r.prize.value === w.prizeValue)?.img ?? GIFTS[0]!.img
}

/** roughly what a prize is worth, to sort gifts, stars and coins together (a coin is a tiny fraction of a star) */
const worth = (r: ResolvedPrize) => (r.kind === 'coins' ? r.prize.value * 0.0001 : r.prize.value)

/** `n` items spread evenly over a list that is sorted from the best to the worst (the best and the worst are always in). */
function spread<T>(list: T[], n: number): T[] {
  if (n <= 0 || !list.length) return []
  if (list.length <= n) return list
  return Array.from({ length: n }, (_, i) => list[Math.round((i * (list.length - 1)) / Math.max(1, n - 1))]!)
}

/**
 * The 8 places of the wheel. With gifts only, the order is the server's, exactly as it always was (a shorter list repeats).
 * With coin or star prizes among the gifts, the places are shared out: at least five go to gifts, the rest to coin and star
 * prizes, each kind spread over its range from big to small, and the two kinds alternate around the wheel.
 */
export function wheelSlots(all: ResolvedPrize[]): ResolvedPrize[] {
  if (!all.length) return []
  // an empty slot (when the tier has one) always gets a place of its own; the prizes share the other seven
  const empty = all.find((r) => r.kind === 'empty')
  const real = all.filter((r) => r.kind !== 'empty')
  if (!real.length) return Array.from({ length: 8 }, () => empty!)
  // two outcomes only (a win and nothing): the wheel alternates them, four of each
  if (empty && real.length === 1) return Array.from({ length: 8 }, (_, i) => (i % 2 === 0 ? real[0]! : empty))
  const n = empty ? 7 : 8
  const gifts = real.filter((r) => r.kind === 'gift')
  const others = real.filter((r) => r.kind !== 'gift')
  let picked = real
  if (gifts.length && others.length) {
    const otherPlaces = Math.min(others.length, n - Math.min(gifts.length, 5))
    const giftPlaces = Math.min(gifts.length, n - otherPlaces)
    const g = spread([...gifts].sort((a, b) => worth(b) - worth(a)), giftPlaces)
    const o = spread([...others].sort((a, b) => worth(b) - worth(a)), otherPlaces)
    picked = []
    for (let i = 0; i < Math.max(g.length, o.length); i++) {
      if (g[i]) picked.push(g[i]!)
      if (o[i]) picked.push(o[i]!)
    }
  } else if (others.length > n) {
    picked = spread([...others].sort((a, b) => worth(b) - worth(a)), n)
  }
  const slots = Array.from({ length: n }, (_, i) => picked[i % picked.length]!)
  if (empty) slots.splice(3, 0, empty)
  return slots
}

/** Prizes list order from the design: gifts / stars by value (high → low), then coins. */
export function sortForList(items: ResolvedPrize[]): ResolvedPrize[] {
  const rank = (p: ResolvedPrize) => (p.kind === 'coins' ? 1 : 0)
  return [...items].sort((a, b) => rank(a) - rank(b) || b.prize.value - a.prize.value)
}

/** Shown when the API has no tiers (e.g. dev mode with the API switched off). */
export const FALLBACK_PRIZES: SpinPrize[] = [
  { type: 'gift', value: 500000, weight: 3, label: 'Heart' },
  { type: 'gift', value: 15000, weight: 12, label: 'Apple' },
  { type: 'gift', value: 8000, weight: 14, label: 'Ring' },
  { type: 'gift', value: 7500, weight: 14, label: 'Watch' },
  { type: 'gift', value: 10000, weight: 13, label: 'Cat' },
  { type: 'gift', value: 20000, weight: 10, label: 'Panda' },
  { type: 'gift', value: 400000, weight: 4, label: 'Cap' },
  { type: 'gift', value: 1000000, weight: 1, label: 'Frog' },
  { type: 'coins', value: 5000, weight: 15, label: 'Coins' },
  { type: 'coins', value: 3000, weight: 20, label: 'Coins' },
  { type: 'coins', value: 1500, weight: 25, label: 'Coins' },
  { type: 'coins', value: 500, weight: 30, label: 'Coins' },
]
