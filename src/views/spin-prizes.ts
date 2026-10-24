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

export type PrizeKind = 'gift' | 'coins' | 'stars'

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
  return prizes.map((prize): ResolvedPrize => {
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
      img: art.img,
      amount: num(prize.value),
      name: prize.label || art.key,
    }
  })
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
