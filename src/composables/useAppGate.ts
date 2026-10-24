import { ref } from 'vue'

/**
 * Full-screen states the server can put the app in:
 *  - maintenance (503 MAINTENANCE, with a text and an end time)
 *  - upgrade (426 UPGRADE_REQUIRED: reload the app to get the new version)
 *  - blocked (403 ACCOUNT_BLOCKED)
 */
export type GateKind = 'maintenance' | 'upgrade' | 'blocked'

export interface Gate {
  kind: GateKind
  text: string
  until: string
}

export const gate = ref<Gate | null>(null);

type Body = { error?: { code?: string; message?: string; params?: Record<string, unknown> } } | undefined

/** Turns an API error into a gate. Returns true when it was one. */
export function applyGate(code: string | undefined, body: Body): boolean {
  const kind: GateKind | null =
    code === 'MAINTENANCE' ? 'maintenance' : code === 'UPGRADE_REQUIRED' ? 'upgrade' : code === 'ACCOUNT_BLOCKED' ? 'blocked' : null
  if (!kind) return false
  const p = body?.error?.params ?? {}
  // a blocked account's reason comes from the profile (see the auth store); the generic 403 message must not replace it
  if (kind === 'blocked') {
    if (gate.value?.kind !== 'blocked') gate.value = { kind, text: '', until: '' }
    return true
  }
  gate.value = {
    kind,
    text: String((p.text as string | undefined) || body?.error?.message || ''),
    until: String((p.until as string | undefined) || ''),
  }
  return true
}

export function clearGate() {
  gate.value = null
}

export function useAppGate() {
  return { gate, clear: clearGate }
}
