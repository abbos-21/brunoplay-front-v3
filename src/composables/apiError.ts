import { isAxiosError } from 'axios'
import { t } from '@/i18n'

/** The message the server sent ({ error: { message } }), else the fallback. */
export function apiMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const data = e.response?.data as { error?: { message?: string }; message?: string } | undefined
    // a message the server sent is shown in the player's language when we know a translation for it
    return t(data?.error?.message || data?.message || (e.response ? fallback : 'Cannot reach the server'))
  }
  return t(fallback)
}
