"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  collectionGroup,
  query,
  where,
  onSnapshot,
  getDoc,
  doc,
} from "firebase/firestore"
import {
  MapPin,
  Coins,
  Clock,
  Star,
  CheckCircle,
  Hourglass,
  XCircle,
  Sword,
  Trophy,
} from "@phosphor-icons/react"
import { db } from "@/lib/firebase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import { RankBadge } from "@/components/rank-badge"
import { Badge } from "@/components/ui/badge"
import { RankUpModal } from "@/components/rank-up-modal"
import { useAuth } from "@/lib/auth-context"
import { rateUser, awardXP } from "@/lib/quest-actions"
import { calculateXP, getNextRankProgress } from "@/lib/rank-utils"
import { QUEST_CATEGORIES, RANKS } from "@/lib/constants"
import type { ApplicationDoc, QuestDoc } from "@/lib/firestore-schema"
import type { RankKey } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── Types ────────────────────────────────────────────────────────────────────
type AppWithId = ApplicationDoc & { id: string }
type QuestWithId = QuestDoc & { id: string }
type Tab = "applied" | "in_progress" | "completed"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function timeAgo(ts: ApplicationDoc["createdAt"]): string {
  if (!ts || typeof (ts as { toMillis?: unknown }).toMillis !== "function") return "Recently"
  const diff = Date.now() - (ts as { toMillis: () => number }).toMillis()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  return "Just now"
}

function payLabel(quest: QuestDoc): string {
  if (quest.payMin && quest.payMax) {
    const suffix = quest.payType === "hourly" ? "/hr" : quest.payType === "daily" ? "/day" : ""
    return `$${quest.payMin}–$${quest.payMax}${suffix}`
  }
  return "Negotiable"
}

// ─── Status config ────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  ApplicationDoc["status"],
  { label: string; color: string; icon: React.ElementType; bg: string; border: string }
> = {
  pending: {
    label: "Pending review",
    color: "text-yellow-400",
    icon: Hourglass,
    bg: "bg-yellow-400/10",
    border: "border-yellow-400/30",
  },
  accepted: {
    label: "Accepted!",
    color: "text-emerald-400",
    icon: CheckCircle,
    bg: "bg-emerald-400/10",
    border: "border-emerald-400/30",
  },
  rejected: {
    label: "Not selected",
    color: "text-red-400",
    icon: XCircle,
    bg: "bg-red-400/10",
    border: "border-red-400/30",
  },
  withdrawn: {
    label: "Withdrawn",
    color: "text-text-muted-dark",
    icon: XCircle,
    bg: "bg-surface-dark",
    border: "border-border-dark",
  },
  completed: {
    label: "Completed",
    color: "text-guild-400",
    icon: CheckCircle,
    bg: "bg-guild-500/10",
    border: "border-guild-500/30",
  },
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hovered, setHovered] = React.useState(0)
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <motion.button
            key={star}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-guild-500 rounded"
          >
            <Star
              weight={filled ? "fill" : "regular"}
              size={24}
              className={cn("transition-colors", filled ? "text-gold-400" : "text-text-muted-dark")}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Quest application card ───────────────────────────────────────────────────
interface AppCardProps {
  app: AppWithId
  quest: QuestWithId | null
  onRankUp: (old: RankKey, next: RankKey, xp: number) => void
  userId: string
  questsCompleted: number
}

function AppCard({ app, quest, onRankUp, userId, questsCompleted }: AppCardProps) {
  const [ratingOpen, setRatingOpen] = React.useState(false)
  const [ratingScore, setRatingScore] = React.useState(0)
  const [ratingComment, setRatingComment] = React.useState("")
  const [ratingSkills, setRatingSkills] = React.useState<string[]>([])
  const [submitting, setSubmitting] = React.useState(false)
  const [submitted, setSubmitted] = React.useState(false)

  const statusConf = STATUS_CONFIG[app.status] ?? STATUS_CONFIG.pending
  const StatusIcon = statusConf.icon

  const catKey = (quest?.category ?? "other").toUpperCase() as keyof typeof QUEST_CATEGORIES
  const cat = QUEST_CATEGORIES[catKey] ?? QUEST_CATEGORIES.OTHER

  const handleSubmitRating = async () => {
    if (!quest || ratingScore === 0) return
    setSubmitting(true)
    try {
      await rateUser(quest.id, userId, quest.questGiverId, ratingScore, ratingComment, ratingSkills)
      const isFirst = questsCompleted === 0
      const xp = calculateXP(true, ratingScore, isFirst, 0)
      // We'd need the userDoc rank to handle rank-up; grab from auth context parent
      await awardXP(userId, xp)
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-dark bg-surface-dark overflow-hidden"
    >
      {/* Card top: category accent */}
      <div className="h-0.5" style={{ background: `linear-gradient(90deg, ${cat.color}60, transparent)` }} />

      <div className="p-4 sm:p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base">{cat.icon}</span>
              <span className="text-xs text-text-muted-dark font-heading font-semibold uppercase tracking-wider">
                {cat.label}
              </span>
            </div>
            <h3 className="font-heading font-bold text-white text-base leading-snug truncate">
              {app.questTitle}
            </h3>
          </div>
          <div
            className={cn(
              "flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-heading font-semibold border shrink-0",
              statusConf.color,
              statusConf.bg,
              statusConf.border
            )}
          >
            <StatusIcon weight="fill" size={10} />
            {statusConf.label}
          </div>
        </div>

        {/* Quest meta */}
        {quest && (
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-3 text-xs text-text-muted-dark">
            <span className="flex items-center gap-1">
              <MapPin size={11} weight="fill" />
              {quest.location}
            </span>
            <span className="flex items-center gap-1 text-gold-400">
              <Coins size={11} weight="fill" />
              {payLabel(quest)}
            </span>
            {quest.duration && (
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {quest.duration}
              </span>
            )}
          </div>
        )}

        {/* Application message */}
        {app.message && (
          <p className="text-xs text-text-muted-dark italic border-l-2 border-border-dark pl-2 mb-3 line-clamp-2">
            &ldquo;{app.message}&rdquo;
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-text-muted-dark">
          <span>Applied {timeAgo(app.createdAt)}</span>
          {app.status === "accepted" && (
            <span className="text-emerald-400 font-heading font-semibold">
              Quest in progress
            </span>
          )}
        </div>

        {/* Rate quest giver (completed only) */}
        {app.status === "completed" && !submitted && quest && (
          <div className="mt-4 pt-4 border-t border-border-dark">
            {!ratingOpen ? (
              <button
                onClick={() => setRatingOpen(true)}
                className="text-sm font-heading font-semibold text-guild-400 hover:text-guild-300 transition-colors"
              >
                + Rate quest giver
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm font-heading font-semibold text-white">
                  Rate {quest.questGiverName}
                </p>
                <StarRating value={ratingScore} onChange={setRatingScore} />
                <textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Your experience… (optional)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-bg-dark border border-border-dark text-sm text-text-secondary-dark placeholder:text-text-muted-dark resize-none focus:outline-none focus:ring-2 focus:ring-guild-500"
                />
                {quest.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {quest.skills.map((skill) => {
                      const active = ratingSkills.includes(skill)
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() =>
                            setRatingSkills((prev) =>
                              active ? prev.filter((s) => s !== skill) : [...prev, skill]
                            )
                          }
                          className={cn(
                            "px-2 py-0.5 rounded-full text-xs font-heading font-semibold border transition-colors",
                            active
                              ? "bg-guild-500/20 border-guild-500/50 text-guild-300"
                              : "bg-surface-dark border-border-dark text-text-muted-dark hover:border-guild-500/30"
                          )}
                        >
                          {skill.replace(/_/g, " ")}
                        </button>
                      )
                    })}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setRatingOpen(false)}
                    className="text-xs text-text-muted-dark hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={ratingScore === 0 || submitting}
                    onClick={handleSubmitRating}
                    className="text-xs font-heading font-semibold text-guild-400 hover:text-white disabled:opacity-40 transition-colors"
                  >
                    {submitting ? "Submitting…" : "Submit Review"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {submitted && (
          <div className="mt-4 pt-4 border-t border-border-dark flex items-center gap-1.5 text-xs text-emerald-400 font-heading font-semibold">
            <CheckCircle weight="fill" size={12} />
            Review submitted
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── XP progress bar ──────────────────────────────────────────────────────────
function XPProgressBar() {
  const { userDoc } = useAuth()
  if (!userDoc) return null

  const progress = getNextRankProgress(userDoc)
  const rankData = RANKS[userDoc.rank]

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border-dark bg-surface-dark p-4 sm:p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <RankBadge rank={userDoc.rank} size="md" showLabel />
          <div>
            <p className="font-heading font-bold text-white text-sm">{userDoc.name}</p>
            <p className="text-xs text-text-muted-dark">{userDoc.xp.toLocaleString()} XP total</p>
          </div>
        </div>
        {userDoc.averageRating > 0 && (
          <div className="flex items-center gap-1 text-gold-400 text-sm font-heading font-semibold">
            <Star weight="fill" size={14} />
            {userDoc.averageRating.toFixed(1)}
            <span className="text-text-muted-dark font-normal text-xs">
              ({userDoc.totalRatings})
            </span>
          </div>
        )}
      </div>

      {progress.nextRank ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-text-muted-dark">
            <span>Progress to Rank {progress.nextRank}</span>
            <span className="text-guild-400 font-heading font-semibold">
              {progress.xpNeeded.toLocaleString()} XP needed
            </span>
          </div>
          {/* XP bar */}
          <div className="h-1.5 rounded-full bg-bg-dark overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress.xpProgress}%` }}
              transition={{ duration: 1.2, ease: [0.23, 1, 0.32, 1] }}
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${rankData.color}, ${RANKS[progress.nextRank].color})`,
              }}
            />
          </div>
          <div className="flex gap-4 text-xs text-text-muted-dark">
            <span>
              <span className="text-white font-medium">{userDoc.questsCompleted}</span>
              /{RANKS[progress.nextRank].minQuests} quests
            </span>
            {progress.questsNeeded > 0 && (
              <span className="text-guild-400">{progress.questsNeeded} more to go</span>
            )}
          </div>
        </div>
      ) : (
        <div className="text-xs text-gold-400 font-heading font-semibold flex items-center gap-1.5">
          <Trophy weight="fill" size={12} />
          Maximum rank achieved — Legend!
        </div>
      )}
    </motion.div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ tab }: { tab: Tab }) {
  const messages: Record<Tab, { title: string; body: string }> = {
    applied: {
      title: "No applications yet",
      body: "Browse the quest board and apply to quests that match your skills.",
    },
    in_progress: {
      title: "No active quests",
      body: "You have no quests in progress. Check your applied quests for updates.",
    },
    completed: {
      title: "No completed quests",
      body: "Finish your first quest to earn XP and build your guild reputation.",
    },
  }
  const m = messages[tab]
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div
        className="w-14 h-16 flex items-center justify-center mb-4 opacity-20"
        style={{
          clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
          background: "linear-gradient(135deg, #6366F1, #7C3AED)",
        }}
        aria-hidden="true"
      >
        <Sword weight="bold" size={20} className="text-white" />
      </div>
      <h3 className="font-heading text-lg font-bold text-white mb-1">{m.title}</h3>
      <p className="text-sm text-text-muted-dark max-w-xs leading-relaxed">{m.body}</p>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
function MyQuestsBoard() {
  const { user, userDoc } = useAuth()
  const [applications, setApplications] = React.useState<AppWithId[]>([])
  const [quests, setQuests] = React.useState<Record<string, QuestWithId>>({})
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<Tab>("applied")

  // Rank-up modal
  const [rankUpData, setRankUpData] = React.useState<{
    oldRank: RankKey
    newRank: RankKey
    newXP: number
  } | null>(null)

  // Real-time subscription to user's applications via collectionGroup
  React.useEffect(() => {
    if (!user) return

    const q = query(
      collectionGroup(db, "applications"),
      where("adventurerId", "==", user.uid)
    )

    const unsub = onSnapshot(q, async (snap) => {
      const apps = snap.docs.map((d) => ({ id: d.id, ...(d.data() as ApplicationDoc) }))
      setApplications(apps)

      // Batch fetch quest docs for any we don't have yet
      const missingIds = [...new Set(apps.map((a) => a.questId))].filter(
        (id) => !quests[id]
      )
      if (missingIds.length > 0) {
        const snapshots = await Promise.all(
          missingIds.map((id) => getDoc(doc(db, "quests", id)))
        )
        const newQuests: Record<string, QuestWithId> = {}
        snapshots.forEach((s) => {
          if (s.exists()) newQuests[s.id] = { id: s.id, ...(s.data() as QuestDoc) }
        })
        setQuests((prev) => ({ ...prev, ...newQuests }))
      }

      setLoading(false)
    })

    return unsub
  }, [user?.uid])

  // Tab filtering
  const filtered = React.useMemo(() => {
    switch (tab) {
      case "applied":
        return applications.filter((a) =>
          ["pending", "rejected", "withdrawn"].includes(a.status)
        )
      case "in_progress":
        return applications.filter((a) => a.status === "accepted")
      case "completed":
        return applications.filter((a) => a.status === "completed")
    }
  }, [applications, tab])

  const tabs: { key: Tab; label: string; count: number }[] = [
    {
      key: "applied",
      label: "Applied",
      count: applications.filter((a) => ["pending", "rejected", "withdrawn"].includes(a.status)).length,
    },
    {
      key: "in_progress",
      label: "In Progress",
      count: applications.filter((a) => a.status === "accepted").length,
    },
    {
      key: "completed",
      label: "Completed",
      count: applications.filter((a) => a.status === "completed").length,
    },
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-bg-dark pt-20">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-border-dark">
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background: "linear-gradient(to bottom, rgba(99,102,241,0.06) 0%, transparent 100%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl px-6 py-8">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-0.5 rounded-full bg-guild-500" aria-hidden="true" />
              <span className="text-xs font-heading font-semibold text-guild-400 uppercase tracking-widest">
                Your journey
              </span>
            </div>
            <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
              My Quests
            </h1>
          </div>
        </section>

        <div className="mx-auto max-w-3xl px-6 py-6 space-y-6">
          {/* XP progress card */}
          <XPProgressBar />

          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-xl bg-surface-dark border border-border-dark">
            {tabs.map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-heading font-semibold transition-all duration-200",
                  tab === key
                    ? "bg-guild-500 text-white shadow-guild"
                    : "text-text-muted-dark hover:text-white"
                )}
              >
                {label}
                {count > 0 && (
                  <span
                    className={cn(
                      "inline-flex items-center justify-center w-5 h-5 rounded-full text-xs",
                      tab === key ? "bg-white/20 text-white" : "bg-surface-dark-hover text-text-muted-dark"
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quest cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl bg-surface-dark animate-pulse border border-border-dark" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState tab={tab} />
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {filtered.map((app) => (
                  <AppCard
                    key={app.id}
                    app={app}
                    quest={quests[app.questId] ?? null}
                    userId={user!.uid}
                    questsCompleted={userDoc?.questsCompleted ?? 0}
                    onRankUp={(old, next, xp) => setRankUpData({ oldRank: old, newRank: next, newXP: xp })}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {rankUpData && (
        <RankUpModal
          open={!!rankUpData}
          oldRank={rankUpData.oldRank}
          newRank={rankUpData.newRank}
          newXP={rankUpData.newXP}
          onDismiss={() => setRankUpData(null)}
        />
      )}
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────
export default function MyQuestsPage() {
  return (
    <AuthGuard>
      <MyQuestsBoard />
    </AuthGuard>
  )
}
