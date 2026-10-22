/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Set to 'true' to enable real API calls in dev mode (they are disabled by default). */
  readonly VITE_USE_API?: string
  /** dev only: Telegram initData stand-in, e.g. "dev:1001:Abbos" (needs DEV_AUTH=true on the backend) */
  readonly VITE_DEV_INIT_DATA?: string
}
