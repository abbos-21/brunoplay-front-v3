import type { TonConnectUI } from '@tonconnect/ui'

/**
 * Pays a TON order with the player's own wallet (TON Connect).
 * The server created the order: it says where to send, how much, and the comment (payload) that identifies the order.
 * The server credits the stars itself once it sees the transfer on the chain, so this only has to get the transfer sent.
 */

let ui: TonConnectUI | null = null

/** The wallet library is large, so it is downloaded the first time a player pays, not when the game starts. */
async function client(): Promise<TonConnectUI> {
  if (!ui) {
    const { TonConnectUI } = await import('@tonconnect/ui')
    ui = new TonConnectUI({
      // must be reachable over HTTPS and name this app's real address (see public/tonconnect-manifest.json)
      manifestUrl: `${window.location.origin}/tonconnect-manifest.json`,
    })
  }
  return ui
}

/** Resolves when a wallet is connected (the connect window opens when none is). Rejects if the window is closed first. */
async function ensureWallet(c: TonConnectUI): Promise<void> {
  await c.connectionRestored
  if (c.connected) return
  await new Promise<void>((resolve, reject) => {
    const stopStatus = c.onStatusChange((wallet) => {
      if (wallet) {
        done();
        resolve()
      }
    })
    const stopModal = c.onModalStateChange((s) => {
      if (s.status === 'closed' && s.closeReason !== 'wallet-selected' && !c.connected) {
        done()
        reject(new Error('cancelled'))
      }
    })
    function done() {
      stopStatus()
      stopModal()
    }
    void c.openModal()
  })
}

export interface TonPayment {
  address: string
  amountNano: number
  /** the order's comment as a base64 cell */
  payload: string
  /** seconds since epoch until which the request is valid */
  validUntil: number
}

/** Asks the wallet to send the transfer. Throws when the player declines or closes the window. */
export async function payWithTon(p: TonPayment): Promise<void> {
  const c = await client()
  await ensureWallet(c)
  await c.sendTransaction({
    validUntil: p.validUntil,
    messages: [{ address: p.address, amount: String(p.amountNano), payload: p.payload }],
  })
}

/** true when the error is just the player saying no */
export function isCancelled(e: unknown): boolean {
  const msg = e instanceof Error ? `${e.name} ${e.message}` : String(e)
  return /cancel|reject|declin|UserRejects|closed/i.test(msg)
}
