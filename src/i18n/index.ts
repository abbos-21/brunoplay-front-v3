import { ref } from 'vue'
import ru from './ru'

/**
 * Tiny translation layer. The English text itself is the key: t('Play') returns 'Play' in English and the
 * Russian text from ru.ts in Russian. A missing translation falls back to the English text, so nothing breaks.
 *   t('Minimum withdrawal is {n} coins', { n: 10000 })
 *   tn('{n} day|{n} days', 3)        // plural: English "one|many", Russian "one|few|many" in ru.ts
 */
export type Locale = 'en' | 'ru'

const STORAGE_KEY = 'lang'

function stored(): Locale | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'ru' || v === 'en' ? v : null
  } catch {
    return null
  }
}

function detect(): Locale {
  const saved = stored()
  if (saved) return saved
  // first visit: follow the language of the player's Telegram
  const code = (window as unknown as { Telegram?: { WebApp?: { initDataUnsafe?: { user?: { language_code?: string } } } } })
    .Telegram?.WebApp?.initDataUnsafe?.user?.language_code
  return code === 'ru' ? 'ru' : 'en'
}

export const locale = ref<Locale>(detect())
if (typeof document !== 'undefined') document.documentElement.lang = locale.value

/** true once the player (or their Telegram language) has picked a language on this phone */
export const hasChosen = () => stored() !== null

/** switch the language; `remember` keeps it for next time */
export function setLocale(next: Locale, remember = true) {
  locale.value = next
  document.documentElement.lang = next
  if (!remember) return
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // private mode: the choice lasts until the page is closed
  }
}

function fill(text: string, params?: Record<string, string | number>) {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in params ? String(params[k]) : m))
}

export function t(key: string, params?: Record<string, string | number>): string {
  const text = locale.value === 'ru' ? (ru[key] ?? key) : key
  return fill(text, params)
}

/** plural form: "one|many" in English, "one|few|many" in Russian (1 · 2-4 · 5-20) */
export function tn(key: string, n: number, params?: Record<string, string | number>): string {
  const all: Record<string, string | number> = { n: n.toLocaleString('en-US'), ...params }
  if (locale.value === 'ru') {
    const forms = (ru[key] ?? key).split('|')
    const a = Math.abs(n) % 100
    const b = a % 10
    const i = a > 10 && a < 20 ? 2 : b > 1 && b < 5 ? 1 : b === 1 ? 0 : 2
    return fill(forms[Math.min(i, forms.length - 1)]!, all)
  }
  const [one = key, many = one] = key.split('|')
  return fill(n === 1 ? one : many, all)
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $t: typeof t
    $tn: typeof tn
  }
}
