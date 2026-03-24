// ==========================================
// QUEST ACTIONS — Firestore operations
// ==========================================

import {
  doc,
  collection,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
  increment,
  query,
  where,
} from "firebase/firestore"
import { db } from "@/lib/firebase"
import { checkRankUp } from "@/lib/rank-utils"
import type { ApplicationDoc, RatingDoc, UserDoc } from "@/lib/firestore-schema"
import type { RankKey } from "@/lib/constants"

// ─── Apply to quest ────────────────────────────────────────────────────────────
export async function applyToQuest(
  questId: string,
  adventurerId: string,
  message?: string
): Promise<string> {
  const [questSnap, userSnap] = await Promise.all([
    getDoc(doc(db, "quests", questId)),
    getDoc(doc(db, "users", adventurerId)),
  ])

  if (!questSnap.exists()) throw new Error("Quest not found")
  if (!userSnap.exists()) throw new Error("User not found")

  const quest = questSnap.data()
  const user = userSnap.data() as UserDoc

  // Check rank requirement
  const rankOrder: RankKey[] = ["F", "E", "D", "C", "B", "A"]
  if (rankOrder.indexOf(user.rank) < rankOrder.indexOf(quest.rankRequired as RankKey)) {
    throw new Error(`Rank ${quest.rankRequired} or above required for this quest`)
  }

  // Check for duplicate application
  const existing = await getDocs(
    query(
      collection(db, "quests", questId, "applications"),
      where("adventurerId", "==", adventurerId)
    )
  )
  if (!existing.empty) throw new Error("You have already applied to this quest")

  const applicationData: Omit<ApplicationDoc, never> = {
    adventurerId,
    adventurerName: user.name,
    ...(user.avatarUrl ? { adventurerAvatar: user.avatarUrl } : {}),
    adventurerRank: user.rank,
    adventurerRating: user.averageRating,
    adventurerQuestsCompleted: user.questsCompleted,
    message: message ?? "",
    status: "pending",
    questId,
    questTitle: quest.title,
    createdAt: serverTimestamp() as ApplicationDoc["createdAt"],
    updatedAt: serverTimestamp() as ApplicationDoc["updatedAt"],
  }

  const appDoc = await addDoc(
    collection(db, "quests", questId, "applications"),
    applicationData
  )

  await updateDoc(doc(db, "quests", questId), {
    applicationCount: increment(1),
    updatedAt: serverTimestamp(),
  })

  return appDoc.id
}

// ─── Accept application ────────────────────────────────────────────────────────
export async function acceptApplication(
  questId: string,
  applicationId: string
): Promise<void> {
  const appRef = doc(db, "quests", questId, "applications", applicationId)
  const questRef = doc(db, "quests", questId)

  await runTransaction(db, async (tx) => {
    const [appSnap, questSnap] = await Promise.all([tx.get(appRef), tx.get(questRef)])
    if (!appSnap.exists() || !questSnap.exists()) throw new Error("Document not found")

    const quest = questSnap.data()
    if (quest.slotsFilled >= quest.slotsTotal) throw new Error("No slots available")

    const newSlotsFilled = quest.slotsFilled + 1
    const newStatus = newSlotsFilled >= quest.slotsTotal ? "in_progress" : "active"

    tx.update(appRef, {
      status: "accepted",
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    tx.update(questRef, {
      slotsFilled: newSlotsFilled,
      status: newStatus,
      updatedAt: serverTimestamp(),
    })
  })
}

// ─── Reject application ────────────────────────────────────────────────────────
export async function rejectApplication(
  questId: string,
  applicationId: string
): Promise<void> {
  await updateDoc(doc(db, "quests", questId, "applications", applicationId), {
    status: "rejected",
    updatedAt: serverTimestamp(),
  })
}

// ─── Complete quest ────────────────────────────────────────────────────────────
export async function completeQuest(
  questId: string,
  adventurerId: string
): Promise<void> {
  const questRef = doc(db, "quests", questId)

  // Find the accepted application for this adventurer
  const appsSnap = await getDocs(
    query(
      collection(db, "quests", questId, "applications"),
      where("adventurerId", "==", adventurerId),
      where("status", "==", "accepted")
    )
  )

  await runTransaction(db, async (tx) => {
    const questSnap = await tx.get(questRef)
    if (!questSnap.exists()) throw new Error("Quest not found")

    tx.update(questRef, {
      status: "completed",
      updatedAt: serverTimestamp(),
    })

    // Mark each accepted application as completed
    appsSnap.docs.forEach((appDoc) => {
      tx.update(appDoc.ref, {
        status: "completed",
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })

    // Increment adventurer's questsCompleted
    const userRef = doc(db, "users", adventurerId)
    tx.update(userRef, {
      questsCompleted: increment(1),
      updatedAt: serverTimestamp(),
    })
  })
}

// ─── Rate user ─────────────────────────────────────────────────────────────────
export async function rateUser(
  questId: string,
  giverId: string,
  receiverId: string,
  score: number,
  comment: string,
  skillTags: string[]
): Promise<void> {
  if (score < 1 || score > 5) throw new Error("Score must be between 1 and 5")

  const [giverSnap, receiverSnap, questSnap] = await Promise.all([
    getDoc(doc(db, "users", giverId)),
    getDoc(doc(db, "users", receiverId)),
    getDoc(doc(db, "quests", questId)),
  ])

  if (!giverSnap.exists()) throw new Error("Giver not found")
  if (!receiverSnap.exists()) throw new Error("Receiver not found")
  if (!questSnap.exists()) throw new Error("Quest not found")

  const giver = giverSnap.data() as UserDoc
  const receiver = receiverSnap.data() as UserDoc
  const quest = questSnap.data()

  // Check for duplicate rating
  const existingRating = await getDocs(
    query(
      collection(db, "ratings"),
      where("questId", "==", questId),
      where("giverId", "==", giverId),
      where("receiverId", "==", receiverId)
    )
  )
  if (!existingRating.empty) throw new Error("You have already rated this user for this quest")

  const ratingData: Omit<RatingDoc, never> = {
    score,
    comment,
    skillTags,
    questId,
    questTitle: quest.title,
    giverId,
    giverName: giver.name,
    receiverId,
    receiverName: receiver.name,
    createdAt: serverTimestamp() as RatingDoc["createdAt"],
  }

  await addDoc(collection(db, "ratings"), ratingData)

  // Update receiver's denormalized rating stats
  const newTotalRatings = receiver.totalRatings + 1
  const newAvgRating =
    Math.round(
      ((receiver.averageRating * receiver.totalRatings + score) / newTotalRatings) * 10
    ) / 10

  await updateDoc(doc(db, "users", receiverId), {
    averageRating: newAvgRating,
    totalRatings: newTotalRatings,
    updatedAt: serverTimestamp(),
  })
}

// ─── Award XP ──────────────────────────────────────────────────────────────────
export async function awardXP(
  userId: string,
  amount: number
): Promise<{ newXP: number; rankedUp: boolean; newRank: RankKey | null }> {
  const userRef = doc(db, "users", userId)
  let result = { newXP: 0, rankedUp: false, newRank: null as RankKey | null }

  await runTransaction(db, async (tx) => {
    const userSnap = await tx.get(userRef)
    if (!userSnap.exists()) throw new Error("User not found")

    const user = userSnap.data() as UserDoc
    const newXP = user.xp + amount
    const updatedUser = { ...user, xp: newXP }

    const { eligible, nextRank } = checkRankUp(updatedUser)

    const updates: Record<string, unknown> = {
      xp: increment(amount),
      updatedAt: serverTimestamp(),
    }

    if (eligible && nextRank) {
      updates.rank = nextRank
      result.rankedUp = true
      result.newRank = nextRank
    }

    tx.update(userRef, updates)
    result.newXP = newXP
  })

  return result
}

// ─── Get user's application for a quest ───────────────────────────────────────
export async function getUserApplication(
  questId: string,
  adventurerId: string
): Promise<(ApplicationDoc & { id: string }) | null> {
  const snap = await getDocs(
    query(
      collection(db, "quests", questId, "applications"),
      where("adventurerId", "==", adventurerId)
    )
  )
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...(d.data() as ApplicationDoc) }
}
