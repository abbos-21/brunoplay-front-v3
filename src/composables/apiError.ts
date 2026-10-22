import { isAxiosError } from 'axios'

/** The message the server sent ({ error: { message } }), else the fallback. */
export function apiMessage(e: unknown, fallback: string): string {
  if (isAxiosError(e)) {
    const data = e.response?.data as { error?: { message?: string }; message?: string } | undefined
    return data?.error?.message || data?.message || (e.response ? fallback : 'Cannot reach the server')
  }
  return fallback
}
