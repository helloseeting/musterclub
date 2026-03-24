// ==========================================
// RANK PROGRESSION UTILITIES
// ==========================================

import { RANKS, XP_REWARDS, type RankKey } from "@/lib/constants"
import type { UserDoc } from "@/lib/firestore-schema"

const RANK_ORDER: RankKey[] = ["F", "E", "D", "C", "B", "A"]

export interface RankUpCheck {
  eligible: boolean
  nextRank: RankKey | null
  requirements: {
    xp: number
    quests: number
    rating: number
    meetsXP: boolean
    meetsQuests: boolean
    meetsRating: boolean
  } | null
}

export function checkRankUp(user: UserDoc): RankUpCheck {
  const currentIndex = RANK_ORDER.indexOf(user.rank)

  if (currentIndex === -1 || currentIndex === RANK_ORDER.length - 1) {
    return { eligible: false, nextRank: null, requirements: null }
  }

  const nextRank = RANK_ORDER[currentIndex + 1]
  const next = RANKS[nextRank]

  const meetsXP = user.xp >= next.minXP
  const meetsQuests = user.questsCompleted >= next.minQuests
  // If no ratings yet, rating requirement waived at lower ranks (E/D)
  const meetsRating =
    next.minRating === 0 ||
    user.totalRatings === 0 ||
    user.averageRating >= next.minRating

  return {
    eligible: meetsXP && meetsQuests && meetsRating,
    nextRank,
    requirements: {
      xp: next.minXP,
      quests: next.minQuests,
      rating: next.minRating,
      meetsXP,
      meetsQuests,
      meetsRating,
    },
  }
}

export function calculateXP(
  questCompleted: boolean,
  rating: number,
  isFirstQuest: boolean,
  streakWeeks: number
): number {
  if (!questCompleted) return 0

  let xp = XP_REWARDS.QUEST_COMPLETED

  if (isFirstQuest) {
    xp += XP_REWARDS.FIRST_QUEST
  }

  if (rating === 5) {
    xp += XP_REWARDS.FIVE_STAR_BONUS
  }

  if (streakWeeks > 0) {
    xp += XP_REWARDS.STREAK_BONUS * Math.min(streakWeeks, 10) // cap streak bonus
  }

  return xp
}

export function getNextRankProgress(user: UserDoc): {
  currentRank: RankKey
  nextRank: RankKey | null
  xpProgress: number
  questsProgress: number
  ratingProgress: number
  xpNeeded: number
  questsNeeded: number
} {
  const currentIndex = RANK_ORDER.indexOf(user.rank)

  if (currentIndex === RANK_ORDER.length - 1) {
    return {
      currentRank: user.rank,
      nextRank: null,
      xpProgress: 100,
      questsProgress: 100,
      ratingProgress: 100,
      xpNeeded: 0,
      questsNeeded: 0,
    }
  }

  const nextRank = RANK_ORDER[currentIndex + 1]
  const currentRankData = RANKS[user.rank]
  const nextRankData = RANKS[nextRank]

  const xpRange = nextRankData.minXP - currentRankData.minXP
  const xpDone = user.xp - currentRankData.minXP
  const xpProgress = xpRange > 0 ? Math.min(100, Math.max(0, Math.round((xpDone / xpRange) * 100))) : 100

  const questRange = nextRankData.minQuests - currentRankData.minQuests
  const questsDone = user.questsCompleted - currentRankData.minQuests
  const questsProgress = questRange > 0 ? Math.min(100, Math.max(0, Math.round((questsDone / questRange) * 100))) : 100

  const ratingProgress =
    nextRankData.minRating === 0 || user.totalRatings === 0
      ? 100
      : Math.min(100, Math.round((user.averageRating / nextRankData.minRating) * 100))

  return {
    currentRank: user.rank,
    nextRank,
    xpProgress,
    questsProgress,
    ratingProgress,
    xpNeeded: Math.max(0, nextRankData.minXP - user.xp),
    questsNeeded: Math.max(0, nextRankData.minQuests - user.questsCompleted),
  }
}
