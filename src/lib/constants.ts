// ==========================================
// MUSTER.CLUB DESIGN TOKENS & CONSTANTS
// ==========================================

export const BRAND = {
  name: "Muster.club",
  tagline: "Your next quest awaits.",
  description: "Guild-Based Career Gig Platform",
} as const

// Rank definitions
export const RANKS = {
  F: {
    label: "Rookie",
    color: "#94A3B8", // Slate
    bgColor: "#1E293B",
    description: "Every adventure starts somewhere.",
    minXP: 0,
    minQuests: 0,
    minRating: 0,
  },
  E: {
    label: "Regular",
    color: "#CD7F32", // Bronze
    bgColor: "#422006",
    description: "Proven reliable. Trusted by the guild.",
    minXP: 500,
    minQuests: 5,
    minRating: 4.0,
  },
  D: {
    label: "Skilled",
    color: "#4682B4", // Steel Blue
    bgColor: "#172554",
    description: "Skills verified. Ready for bigger quests.",
    minXP: 2000,
    minQuests: 20,
    minRating: 4.2,
  },
  C: {
    label: "Certified",
    color: "#7C3AED", // Purple
    bgColor: "#2E1065",
    description: "Certified professional. Guild-endorsed.",
    minXP: 8000,
    minQuests: 50,
    minRating: 4.5,
  },
  B: {
    label: "Specialist",
    color: "#F59E0B", // Gold
    bgColor: "#451A03",
    description: "Elite specialist. Sought after.",
    minXP: 25000,
    minQuests: 200,
    minRating: 4.7,
  },
  A: {
    label: "Master",
    color: "#E2E8F0", // Platinum
    bgColor: "#0F172A",
    description: "Master of the guild. Legendary.",
    minXP: 100000,
    minQuests: 500,
    minRating: 4.9,
  },
} as const

export type RankKey = keyof typeof RANKS

// Quest categories with icons and colors
export const QUEST_CATEGORIES = {
  EVENTS: { label: "Events", icon: "🎪", color: "#EC4899" },
  FNB: { label: "F&B", icon: "🍽️", color: "#F97316" },
  ADMIN: { label: "Admin", icon: "📋", color: "#3B82F6" },
  DELIVERY: { label: "Delivery", icon: "📦", color: "#10B981" },
  CLEANING: { label: "Cleaning", icon: "✨", color: "#06B6D4" },
  MOVING: { label: "Moving", icon: "🏋️", color: "#8B5CF6" },
  MARKETING: { label: "Marketing", icon: "📣", color: "#F43F5E" },
  DESIGN: { label: "Design", icon: "🎨", color: "#A855F7" },
  PHOTOGRAPHY: { label: "Photography", icon: "📸", color: "#EAB308" },
  TUTORING: { label: "Tutoring", icon: "📚", color: "#14B8A6" },
  TECH_SUPPORT: { label: "Tech Support", icon: "💻", color: "#6366F1" },
  OTHER: { label: "Other", icon: "⚡", color: "#64748B" },
} as const

// Singapore districts for location filtering
export const SG_DISTRICTS = [
  "Ang Mo Kio",
  "Bedok",
  "Bishan",
  "Bukit Merah",
  "Bukit Timah",
  "CBD / Raffles Place",
  "Changi",
  "Clementi",
  "Geylang",
  "Hougang",
  "Jurong East",
  "Jurong West",
  "Kallang",
  "Marina Bay",
  "Novena",
  "Orchard",
  "Pasir Ris",
  "Punggol",
  "Queenstown",
  "Sembawang",
  "Sengkang",
  "Serangoon",
  "Tampines",
  "Toa Payoh",
  "Woodlands",
  "Yishun",
  "Island-wide",
] as const

// XP rewards
export const XP_REWARDS = {
  QUEST_COMPLETED: 100,
  FIVE_STAR_BONUS: 50,
  STREAK_BONUS: 25, // Per consecutive week with completed quest
  FIRST_QUEST: 200,
} as const
