// Shapes of the BrunoPlay v4 API (see brunoplay-back-v4/docs/FRONTEND-INTEGRATION.md).

// === Auth ===
export interface AuthResponse {
  token: string
  expiresAt: string
  user: User
  isNew: boolean
}

// === User ===
export interface User {
  id: number
  telegramId: string
  username: string
  firstName: string
  lastName: string
  photoUrl?: string
  language: 'EN' | 'RU'
  isBlocked: boolean
  blockReason?: string
  coins: number
  starsBalance: number
  totalCoinsEarned: number
  level: number
  coinCapacityLevel: number
  miningRateLevel: number
  bestRideScore: number
  createdAt: string
}

// === Fishing ===
export interface RateChange {
  at: string
  ratePerSecond: number
}

/** A snapshot of the tank. The app animates it locally and refreshes it now and then (no polling). */
export interface FishingStatus {
  isFishing: boolean
  fishingStartedAt: string | null
  tankCoins: number
  tankCapacity: number
  miningRate: number
  effectiveMiningRate: number
  isComplete: boolean
  elapsedSeconds: number
  fullAt: string | null
  serverTime: string
  canCollect: boolean
  collectMinPercent: number
  collectMinCoins: number
  nextRateChange: RateChange | null
  adsRequired: boolean
  /** the Autocollect booster is on: the server collects a full tank and starts the next one by itself */
  autoCollect: boolean
}

export interface CollectResult {
  coinsCollected: number
  newBalance: number
  autoRestarted: boolean
}

// === Ads ===
export type AdPlacement =
  | 'FISHING_START'
  | 'COLLECT'
  | 'DOUBLE_STREAK'
  | 'DOUBLE_COMBO'
  | 'COMBO_EXTRA'
  | 'RIDE_FREE'
  | 'TASK_ADS'
  | 'BONUS_COINS'

/** one ad provider the server wants the app to try (the list is in priority order) */
export interface AdProviderRef {
  id: string
  blockId?: string // Adsgram
  widgetId?: string // TADS
  zoneId?: string // Monetag (the proof id is passed to it as ymid)
  debug?: boolean
  /** the provider reports an ad when it starts: wait this long (the server also refuses the action before it) */
  waitSeconds?: number
}

export interface AdView {
  adViewId: string
  placement: AdPlacement
  blockId: string
  /** providers to try, first = highest priority; the app moves on to the next one when a provider has no ad */
  providers?: AdProviderRef[]
  expiresAt: string
  required: boolean
  fallback?: boolean
  /** this player has ads switched off (admin panel): the proof is already completed, show no ad and just use it */
  skip?: boolean
}

/** GET /ads/config: how to run the interstitial ads, and the sponsored task (Adsgram Task block) */
export interface AdsConfig {
  /** `providers`: who shows it, in priority order (an older server only sends the Adsgram `blockId`) */
  interstitial: { enabled: boolean; blockId: string; providers?: AdProviderRef[]; intervalSeconds: number; firstAfterSeconds: number }
  /** `available`: the player may do a sponsored task now; else `nextInSeconds` tells when (the admin sets the interval) */
  task: { enabled: boolean; blockId: string; coins: number; intervalMinutes: number; available: boolean; nextInSeconds: number }
  /** a block of ad cards inside a screen (TADS TGB widget); nothing is paid for it */
  banner: { enabled: boolean; provider: string; widgetId: string; debug: boolean }
  /** Monetag's Rewarded Popup as a task card: the tap opens a partner offer outside the game */
  popupTask: { enabled: boolean; provider: string; zoneId: string; coins: number; intervalMinutes: number; waitSeconds: number; available: boolean; nextInSeconds: number }
}

/** POST /ads/popup-task/prepare: the proof to hold until the tap (`completed`: Monetag already confirmed it, only the claim is left) */
export interface PopupProof {
  adViewId: string
  expiresAt: string
  completed: boolean
}

export interface SponsoredClaim {
  coins: number
  newBalance: number
  nextInSeconds: number
}

export interface BonusAdStatus {
  coins: number
  perDay: number
  usedToday: number
  left: number
}

export interface BonusAdResult {
  coins: number
  newBalance: number
  left: number
}

// === Cards ===
export type CardName = 'COIN_CAPACITY' | 'MINING_RATE'

export interface CardRequirement {
  description: string
  requirementType: string
  requirementValue: string
  met: boolean
}

export interface CardInfo {
  cardName: CardName
  currentLevel: number
  currentValue: number
  nextLevel: number | null
  nextValue: number | null
  upgradeCost: number | null
  upgradeCurrency: 'COIN' | 'STAR'
  canUpgrade: boolean
  requirements: CardRequirement[]
}

export interface UpgradeResult {
  cardName: CardName
  newLevel: number
  newValue: number
  newUserLevel: number
  levelUp: boolean
  rewardCoins: number
  rewardStars: number
  coins: number
  stars: number
}

// === Levels ===
export interface LevelInfo {
  level: number
  name: string
  nameEn: string
  nameRu: string
  rewardCoins: number
  rewardStars: number
}

// === Boosters ===
export type BoosterType = 'MINING_BOOST_1_5X' | 'AUTO_MINING'

export interface BoosterInfo {
  type: BoosterType
  name: string
  description: string
  costStars: number
  durationMinutes: number
  isActive: boolean
  expiresAt: string | null
  canBuy: boolean
}

// === Spin ===
export type SpinTier = string

export interface SpinPrize {
  type: 'coins' | 'stars' | 'gift'
  value: number
  weight: number
  label?: string
  /** key of the gift in the catalogue (heart, apple, ...) */
  gift?: string
  giftId?: number
  starValue?: number
}

export interface SpinTierInfo {
  tier: SpinTier
  name: string
  costStars: number
  prizes: SpinPrize[]
}

export interface SpinResult {
  results: SpinPrize[]
  totalCoinsWon: number
  totalStarsWon: number
  spent?: number
  stars?: number
}

export interface LiveWin {
  id: number
  username: string
  prizeType: string
  prizeValue: number
  gift?: string
  game: string
  createdAt: string
  /** stars the player spent on the winning spin(s) */
  spentStars?: number
}

// === Gifts ===
export type GiftStatus = 'OWNED' | 'SOLD' | 'CLAIM_REQUESTED' | 'DELIVERED'

export interface PlayerGift {
  id: number
  gift: string
  name: string
  starValue: number
  status: GiftStatus
  source: string
  rejectReason?: string
  createdAt: string
  soldAt: string | null
  claimRequestedAt: string | null
  deliveredAt: string | null
}

// === Chest ===
export interface ChestPrize {
  type: 'coins' | 'stars' | 'gift'
  value: number
  gift?: string
  label: string
  giftId?: number
}

export interface ChestRound {
  roundId: number
  picks: number
  opened: { slot: number; prize: ChestPrize }[]
  remaining: number
  createdAt: string
}

export interface ChestState {
  round: ChestRound | null
  roundCostStars: number
  picksPerRound: number
}

export interface ChestPickResult {
  prize: ChestPrize
  slot: number
  remaining: number
  finished: boolean
  results?: ChestPrize[]
  totalCoinsWon?: number
  totalStarsWon?: number
}

// === Bruno's Ride ===
export interface RideInfo {
  bestScore: number
  runCostStars: number
  coinsLeftToday: number
  maxCoinsPerDay: number
  freeRunsLeft: number
  canPayWithStars: boolean
  adOffered: boolean
}

export interface RideRun {
  runId: number
  sessionId: string
  startTime: string
  expiresAt: string
  paidWith: string
  stars: number
}

export interface RideFinishResult {
  coinsEarned: number
  coinsClaimed: number
  newBalance: number
  score: number
  bestScore: number
  newBest: boolean
  capped: boolean
  coinsLeftToday: number
}

// === Daily combo ===
export interface ComboItem {
  id: number
  name: string
  icon: string
}

export interface DailyComboStatus {
  items: ComboItem[]
  slots: number
  alreadyAttempted: boolean
  attempts: number
  extraAttemptsLeft: number
  bestCorrect: number
  lastResult: number | null
  lastCorrect: boolean[] | null
  lastItems: number[] | null
  reward: number
  canClaim: boolean
  claimed: boolean
  coinsPerCorrect: number
  resetsAt: string
}

export interface ComboSubmitResult {
  correct: boolean[]
  correctCount: number
  bestCorrect: number
  reward: number
  attempts: number
  extraAttemptsLeft: number
}

export interface ComboClaimResult {
  reward: number
  doubled: boolean
  newBalance: number
}

// === Daily streak ===
export interface DayReward {
  day: number
  coins: number
  claimed: boolean
  isToday: boolean
}

export interface DailyActivityStatus {
  currentStreak: number
  bestStreak: number
  canClaim: boolean
  todayReward: number
  todayDay: number
  streakRewards: DayReward[]
  resetsAt: string
  doubleAvailable: boolean
}

export interface DailyClaimResult {
  reward: number
  doubled: boolean
  newStreak: number
  newBalance: number
  ladderDay: number
}

// === Tasks ===
export type TaskCategory = 'MAIN' | 'OTHER'
export type TaskType = 'CHANNEL_JOIN' | 'INVITE_FRIENDS' | 'OPEN_LINK' | 'WATCH_ADS'

export interface Task {
  id: number
  category: TaskCategory
  type: TaskType
  title: string
  description: string
  channelUsername: string | null
  url?: string
  requiredInvites?: number | null
  required?: number
  rewardCoins: number
  rewardStars?: number
  isActive: boolean
  sortOrder: number
  isCompleted: boolean
  progress?: number
  isNew?: boolean
  repeat?: 'ONCE' | 'DAILY' | 'WEEKLY'
  endsAt?: string | null
}

export interface TaskCheckResult {
  completed: boolean
  reward: number
  rewardStars?: number
  error?: string
  message?: string
  progress?: number
  required?: number
}

// === Friends ===
export interface FriendsStats {
  totalReferrals: number
  pendingReferrals: number
  referralEarnings: number
  /** stars earned from the friends' Telegram Stars top-ups (refunds taken off) */
  topupStars: number
}

export interface ReferralInfo {
  id: number
  username: string
  firstName: string
  level: number
  counted: boolean
  createdAt: string
  /** stars this friend's top-ups earned you */
  topupStars: number
}

export interface RewardTier {
  level: number
  reward: number
}

export interface FriendsData {
  stats: FriendsStats
  friends: ReferralInfo[]
  total: number
  page: number
  rewards: RewardTier[]
  /** percent of a friend's Stars top-up that the inviter gets in stars (0 = off) */
  topupPercent: number
  links: { inviteLink: string; botLink: string }
}

// === Withdrawals ===
export type WithdrawalStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED' | 'FAILED'

export interface WithdrawalInfo {
  coinsPerTon: number
  coinToTonRate: number
  minimumCoinWithdrawal: number
  maximumCoinWithdrawal: number
  withdrawalFeeTon: string | number
  balance: number
  notice: string
  canWithdraw: boolean
  blockedReason?: string
  nextWithdrawalAt?: string | null
  minLevel: number
}

export interface Withdrawal {
  id: number
  amountCoins: number
  amountTon: string | number
  amountNano: number
  feeNano: number
  targetAddress: string
  status: WithdrawalStatus
  txHash: string | null
  failReason?: string
  createdAt: string
  processedAt: string | null
}

// === Stars top-up ===
export interface TopupPack {
  stars: number
  telegramStars: number
  telegramBonusStars: number
  ton: string
  tonNano: number
  tonBonusStars: number
}

export interface TopupPacks {
  packs: TopupPack[]
  tonBonusPercent: number
  telegramBonusPercent: number
  tonAvailable: boolean
  telegramAvailable: boolean
}

export interface TopupOrder {
  id: string
  method: 'TG_STARS' | 'TON'
  status: 'PENDING' | 'PAID' | 'EXPIRED' | 'REFUNDED'
  stars: number
  bonusStars: number
  price: number
  createdAt: string
  expiresAt: string
  paidAt: string | null
  invoiceLink?: string
  address?: string
  comment?: string
  payload?: string
  amountNano?: number
}

// === Tournaments ===
export interface TournamentPrize {
  place: number
  coins: number
  stars: number
  gift: string
}

export interface Tournament {
  id: number
  name: string
  description: string
  metric: string
  startAt: string
  endAt: string
  entryFee: number
  prizes: TournamentPrize[]
  status: 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'PAID' | 'CANCELLED'
  timeRemainingMs: number
  joined: boolean
  score: number
  rank: number | null
}

export interface LeaderboardEntry {
  rank: number
  userId: number
  username: string
  firstName: string
  score: number
}

export interface LeaderboardResponse {
  tournament?: Tournament
  entries: LeaderboardEntry[]
  total: number
  userRank: number | null
  userScore: number | null
}

// === Notifications ===
export interface NotificationPrefs {
  [key: string]: unknown
}

// === Paginated ===
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  totalPages: number
}

// === App Info ===
export interface AppInfo {
  supportUrl: string
  newsUrl: string
  faqUrl: string
  version: string
  botUsername: string
  maintenance: { enabled: boolean; until: string; textEn: string; textRu: string }
  minVersion: string
  topupTonBonusPercent?: number
}
