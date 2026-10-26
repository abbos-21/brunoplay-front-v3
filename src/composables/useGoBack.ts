import { useRouter } from 'vue-router'

/**
 * A back button that always does something. When the Mini App is opened straight on a page (the button under a bot message,
 * a link), there is no earlier page of the game to return to and router.back() would do nothing, or leave the game.
 * vue-router stores the previous page in history.state.back (null when the page was the first one), which is reliable;
 * window.history.length is not, because Telegram's web view can start with more than one entry.
 */
export function useGoBack(fallback: string) {
  const router = useRouter()
  return () => {
    if (window.history.state?.back) router.back()
    else void router.replace(fallback)
  }
}
