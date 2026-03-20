// ==========================================
// FIRESTORE COLLECTION SCHEMAS
// ==========================================
// Collections: users, quests, applications, ratings

import { Timestamp } from "firebase/firestore"

// ==========================================
// USERS — /users/{userId}
// ==========================================

export type UserRole = "adventurer" | "quest_giver" | "admin"
export type Rank = "F" | "E" | "D" | "C" | "B" | "A"

export interface UserDoc {
  // Identity
  email: string
  name: string
  avatarUrl?: string
  bio?: string
  role: UserRole
  phone?: string

  // Rank & Progression
  rank: Rank
  xp: number

  // Location & Skills
  location?: string // SG district
  skills: string[]

  // Quest-giver specific
  companyName?: string
  companyDesc?: string

  // Stats (denormalized for fast reads)
  questsCompleted: number
  averageRating: number
  totalEarnings: number
  totalRatings: number

  // Flags
  isVerified: boolean
  isOnboarded: boolean

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
}

// ==========================================
// QUESTS — /quests/{questId}
// ==========================================

export type QuestStatus =
  | "draft"
  | "pending_review"
  | "active"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "expired"

export type QuestCategory =
  | "events"
  | "fnb"
  | "admin"
  | "delivery"
  | "cleaning"
  | "moving"
  | "marketing"
  | "design"
  | "photography"
  | "tutoring"
  | "tech_support"
  | "other"

export type QuestSource =
  | "direct"
  | "carousell"
  | "gumtree"
  | "facebook"
  | "indeed"
  | "other"

export interface QuestDoc {
  // Core
  title: string
  description: string
  category: QuestCategory

  // Location
  location: string // SG district
  address?: string
  isRemote: boolean

  // Pay & Time
  payMin?: number
  payMax?: number
  payType: "fixed" | "hourly" | "daily"
  currency: string // "SGD"
  dateStart?: Timestamp
  dateEnd?: Timestamp
  duration?: string // e.g. "3 hours"

  // Requirements
  rankRequired: Rank
  slotsTotal: number
  slotsFilled: number
  skills: string[]
  requirements?: string

  // Source (for aggregated quests)
  source: QuestSource
  sourceUrl?: string
  sourceId?: string

  // Media
  imageUrls: string[]

  // Status & Flags
  status: QuestStatus
  isFeatured: boolean

  // Quest Giver (denormalized for fast reads)
  questGiverId: string
  questGiverName: string
  questGiverAvatar?: string
  questGiverRating: number

  // Counts (denormalized)
  applicationCount: number

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  expiresAt?: Timestamp
}

// ==========================================
// APPLICATIONS — /quests/{questId}/applications/{appId}
// (subcollection of quests for efficient queries)
// ==========================================

export type ApplicationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "completed"

export interface ApplicationDoc {
  // Applicant info (denormalized)
  adventurerId: string
  adventurerName: string
  adventurerAvatar?: string
  adventurerRank: Rank
  adventurerRating: number
  adventurerQuestsCompleted: number

  // Application
  message?: string
  status: ApplicationStatus

  // Quest reference
  questId: string
  questTitle: string

  // Timestamps
  createdAt: Timestamp
  updatedAt: Timestamp
  acceptedAt?: Timestamp
  completedAt?: Timestamp
}

// ==========================================
// RATINGS — /ratings/{ratingId}
// (top-level for querying across quests)
// ==========================================

export interface RatingDoc {
  score: number // 1-5
  comment?: string
  skillTags: string[]

  // References
  questId: string
  questTitle: string
  giverId: string
  giverName: string
  receiverId: string
  receiverName: string

  // Timestamps
  createdAt: Timestamp
}

// ==========================================
// FIRESTORE INDEXES NEEDED
// ==========================================
// quests: status + category + createdAt
// quests: status + location + createdAt
// quests: status + rankRequired + createdAt
// ratings: receiverId + createdAt
// (Create via Firebase Console or firestore.indexes.json)
