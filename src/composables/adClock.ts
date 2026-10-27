/**
 * When the last ad of any kind ended (rewarded or interstitial). Shared, so the gap between ads counts all of them:
 * a player who just watched a rewarded ad is not shown an interstitial right after it.
 */
const openedAt = Date.now()
let lastAdAt = 0

export const markAd = () => {
  lastAdAt = Date.now()
}
export const msSinceLastAd = () => (lastAdAt ? Date.now() - lastAdAt : Infinity)
export const msSinceOpen = () => Date.now() - openedAt
