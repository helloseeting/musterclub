"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { collection, query, where, onSnapshot } from "firebase/firestore"
import * as Dialog from "@radix-ui/react-dialog"
import { MapPin, Clock, Coins, X, Users, Briefcase, Star, CheckCircle, Hourglass, XCircle } from "@phosphor-icons/react"
import { db } from "@/lib/firebase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import { QuestCard, type QuestCardData } from "@/components/quest-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RankBadge } from "@/components/rank-badge"
import { RankUpModal } from "@/components/rank-up-modal"
import { useAuth } from "@/lib/auth-context"
import { seedQuestsIfEmpty } from "@/lib/seed-quests"
import { applyToQuest, getUserApplication, rateUser, awardXP } from "@/lib/quest-actions"
import { calculateXP } from "@/lib/rank-utils"
import { QUEST_CATEGORIES, SG_DISTRICTS, RANKS } from "@/lib/constants"
import type { QuestDoc, ApplicationDoc } from "@/lib/firestore-schema"
import type { RankKey } from "@/lib/constants"
import { cn } from "@/lib/utils"

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return hydrated
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type QuestWithId = QuestDoc & { id: string }

function timeAgo(ts: QuestDoc["createdAt"]): string {
  if (!ts || typeof (ts as { toMillis?: unknown }).toMillis !== "function") return "Recently"
  const diff = Date.now() - (ts as { toMillis: () => number }).toMillis()
  const d = Math.floor(diff / 86400000)
  const h = Math.floor(diff / 3600000)
  const m = Math.floor(diff / 60000)
  if (d > 0) return `${d}d ago`
  if (h > 0) return `${h}h ago`
  if (m > 0) return `${m}m ago`
  return "Just now"
}

function toCardData(q: QuestWithId): QuestCardData {
  const catKey = q.category.toUpperCase() as keyof typeof QUEST_CATEGORIES
  const cat = QUEST_CATEGORIES[catKey] ?? QUEST_CATEGORIES.OTHER
  return {
    id: q.id,
    title: q.title,
    category: cat.label,
    categoryIcon: cat.icon,
    categoryColor: cat.color,
    location: q.location,
    payMin: q.payMin ?? 0,
    payMax: q.payMax ?? 0,
    rank: q.rankRequired as RankKey,
    timePosted: timeAgo(q.createdAt),
    slots: Math.max(0, q.slotsTotal - q.slotsFilled),
  }
}

const RANK_ORDER: RankKey[] = ["F", "E", "D", "C", "B", "A"]

function rankIndex(r: RankKey) {
  return RANK_ORDER.indexOf(r)
}

// ─── Filter select ────────────────────────────────────────────────────────────
interface FilterSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}

function FilterSelect({ label, value, onChange, options }: FilterSelectProps) {
  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <label className="text-xs font-heading font-semibold text-text-muted-dark uppercase tracking-wider sr-only">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label}
        className="h-11 px-3 rounded-lg bg-surface-dark border border-border-dark text-sm text-text-secondary-dark hover:border-guild-500/30 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all duration-200 cursor-pointer appearance-none pr-8"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B6784' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 10px center",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}

// ─── Star rating input ────────────────────────────────────────────────────────
interface StarRatingProps {
  value: number
  onChange: (v: number) => void
}

function StarRating({ value, onChange }: StarRatingProps) {
  const [hovered, setHovered] = React.useState(0)

  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= (hovered || value)
        return (
          <motion.button
            key={star}
            type="button"
            role="radio"
            aria-checked={value === star}
            aria-label={`${star} star${star !== 1 ? "s" : ""}`}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => onChange(star)}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-guild-500 rounded"
          >
            <Star
              weight={filled ? "fill" : "regular"}
              size={28}
              className={cn(
                "transition-colors duration-100",
                filled ? "text-gold-400" : "text-text-muted-dark"
              )}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

// ─── Application status pill ──────────────────────────────────────────────────
function AppStatusPill({ status }: { status: ApplicationDoc["status"] }) {
  const config = {
    pending: { icon: Hourglass, label: "Pending review", className: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30" },
    accepted: { icon: CheckCircle, label: "Accepted!", className: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30" },
    rejected: { icon: XCircle, label: "Not selected", className: "text-red-400 bg-red-400/10 border-red-400/30" },
    withdrawn: { icon: XCircle, label: "Withdrawn", className: "text-text-muted-dark bg-surface-dark border-border-dark" },
    completed: { icon: CheckCircle, label: "Completed", className: "text-guild-400 bg-guild-500/10 border-guild-500/30" },
  }
  const c = config[status] ?? config.pending
  const Icon = c.icon
  return (
    <div className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-heading font-semibold border", c.className)}>
      <Icon weight="fill" size={12} />
      {c.label}
    </div>
  )
}

// ─── Quest detail modal ───────────────────────────────────────────────────────
interface QuestModalProps {
  quest: QuestWithId | null
  onClose: () => void
  onRankUp: (oldRank: RankKey, newRank: RankKey, newXP: number) => void
}

function QuestModal({ quest, onClose, onRankUp }: QuestModalProps) {
  const { user, userDoc } = useAuth()

  // Application state
  const [application, setApplication] = React.useState<(ApplicationDoc & { id: string }) | null>(null)
  const [appLoading, setAppLoading] = React.useState(false)

  // Apply flow
  const [applyOpen, setApplyOpen] = React.useState(false)
  const [message, setMessage] = React.useState("")
  const [applying, setApplying] = React.useState(false)
  const [applyError, setApplyError] = React.useState("")

  // Rating flow
  const [ratingOpen, setRatingOpen] = React.useState(false)
  const [ratingScore, setRatingScore] = React.useState(0)
  const [ratingComment, setRatingComment] = React.useState("")
  const [ratingSkills, setRatingSkills] = React.useState<string[]>([])
  const [submittingRating, setSubmittingRating] = React.useState(false)
  const [ratingSubmitted, setRatingSubmitted] = React.useState(false)

  // Fetch existing application when modal opens
  React.useEffect(() => {
    if (!quest || !user) return
    setApplication(null)
    setApplyOpen(false)
    setRatingOpen(false)
    setRatingSubmitted(false)
    setAppLoading(true)
    getUserApplication(quest.id, user.uid)
      .then(setApplication)
      .catch(console.error)
      .finally(() => setAppLoading(false))
  }, [quest?.id, user?.uid])

  const handleApply = async () => {
    if (!quest || !user) return
    setApplying(true)
    setApplyError("")
    try {
      await applyToQuest(quest.id, user.uid, message.trim() || undefined)
      const app = await getUserApplication(quest.id, user.uid)
      setApplication(app)
      setApplyOpen(false)
      setMessage("")
    } catch (err) {
      setApplyError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setApplying(false)
    }
  }

  const handleSubmitRating = async () => {
    if (!quest || !user || ratingScore === 0) return
    setSubmittingRating(true)
    try {
      // Rate the quest giver
      await rateUser(quest.id, user.uid, quest.questGiverId, ratingScore, ratingComment, ratingSkills)
      // Award XP
      const isFirst = (userDoc?.questsCompleted ?? 0) === 0
      const xpAmount = calculateXP(true, ratingScore, isFirst, 0)
      const result = await awardXP(user.uid, xpAmount)
      setRatingSubmitted(true)
      if (result.rankedUp && result.newRank && userDoc?.rank) {
        onRankUp(userDoc.rank, result.newRank, result.newXP)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingRating(false)
    }
  }

  if (!quest) return null

  const catKey = quest.category.toUpperCase() as keyof typeof QUEST_CATEGORIES
  const cat = QUEST_CATEGORIES[catKey] ?? QUEST_CATEGORIES.OTHER
  const rankData = RANKS[quest.rankRequired as RankKey] ?? RANKS.F
  const slotsLeft = Math.max(0, quest.slotsTotal - quest.slotsFilled)
  const canApply = !application && !appLoading && quest.status === "active" && slotsLeft > 0

  return (
    <Dialog.Root open={!!quest} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        <Dialog.Content
          className="fixed inset-x-0 bottom-0 sm:inset-x-4 sm:top-1/2 sm:bottom-auto sm:-translate-y-1/2 z-50 sm:max-w-lg sm:mx-auto max-h-[92vh] sm:max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-border-dark bg-bg-dark-secondary shadow-guild-lg focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom sm:data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom sm:data-[state=closed]:zoom-out-95"
          aria-describedby="quest-description"
        >
          {/* Mobile drag handle */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
            <div className="w-10 h-1 rounded-full bg-border-dark" />
          </div>

          {/* Close */}
          <Dialog.Close asChild>
            <button
              className="absolute top-4 right-4 flex items-center justify-center min-w-[44px] min-h-[44px] rounded-lg text-text-muted-dark hover:text-white hover:bg-surface-dark-hover transition-colors z-10"
              aria-label="Close"
            >
              <X weight="bold" size={16} />
            </button>
          </Dialog.Close>

          <div className="p-6">
            {/* Category + rank */}
            <div className="flex items-start justify-between gap-3 mb-4">
              <Badge
                variant="category"
                size="md"
                style={{
                  backgroundColor: `${cat.color}15`,
                  borderColor: `${cat.color}35`,
                  color: cat.color,
                }}
              >
                <span aria-hidden="true">{cat.icon}</span>
                {cat.label}
              </Badge>
              <RankBadge rank={quest.rankRequired as RankKey} size="md" showLabel />
            </div>

            {/* Title */}
            <Dialog.Title className="font-heading text-xl font-bold text-white leading-snug mb-1">
              {quest.title}
            </Dialog.Title>

            {/* Quest giver */}
            <p className="text-sm text-text-muted-dark mb-5">
              by{" "}
              <span className="text-text-secondary-dark font-medium">
                {quest.questGiverName}
              </span>
              {quest.questGiverRating > 0 && (
                <span className="ml-2 text-gold-400">
                  ★ {quest.questGiverRating.toFixed(1)}
                </span>
              )}
              <span className="ml-2 text-text-muted-dark">
                · {quest.applicationCount} applied
              </span>
            </p>

            {/* Meta grid */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-dark border border-border-dark">
                <MapPin weight="fill" size={14} className="text-text-muted-dark shrink-0" />
                <div>
                  <p className="text-xs text-text-muted-dark">Location</p>
                  <p className="text-sm font-medium text-text-primary-dark">{quest.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-dark border border-border-dark">
                <Coins weight="fill" size={14} className="text-gold-400 shrink-0" />
                <div>
                  <p className="text-xs text-text-muted-dark">Pay</p>
                  <p className="text-sm font-semibold text-gold-400">
                    {quest.payMin && quest.payMax
                      ? `$${quest.payMin}–$${quest.payMax}/${quest.payType === "hourly" ? "hr" : quest.payType === "daily" ? "day" : "fixed"}`
                      : "Negotiable"}
                  </p>
                </div>
              </div>
              {quest.duration && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-dark border border-border-dark">
                  <Clock weight="regular" size={14} className="text-text-muted-dark shrink-0" />
                  <div>
                    <p className="text-xs text-text-muted-dark">Duration</p>
                    <p className="text-sm font-medium text-text-primary-dark">{quest.duration}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-surface-dark border border-border-dark">
                <Users weight="regular" size={14} className="text-text-muted-dark shrink-0" />
                <div>
                  <p className="text-xs text-text-muted-dark">Slots left</p>
                  <p className="text-sm font-medium text-text-primary-dark">
                    {slotsLeft} of {quest.slotsTotal}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="mb-5">
              <h3 className="font-heading text-xs font-semibold text-text-muted-dark uppercase tracking-wider mb-2">
                About this quest
              </h3>
              <p
                id="quest-description"
                className="text-sm text-text-secondary-dark leading-relaxed"
              >
                {quest.description}
              </p>
            </div>

            {/* Requirements */}
            {quest.requirements && (
              <div className="mb-5">
                <h3 className="font-heading text-xs font-semibold text-text-muted-dark uppercase tracking-wider mb-2">
                  Requirements
                </h3>
                <p className="text-sm text-text-secondary-dark leading-relaxed">
                  {quest.requirements}
                </p>
              </div>
            )}

            {/* Skills */}
            {quest.skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-heading text-xs font-semibold text-text-muted-dark uppercase tracking-wider mb-2">
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {quest.skills.map((skill) => (
                    <Badge key={skill} variant="default" size="sm">
                      {skill.replace(/_/g, " ")}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Rank requirement banner */}
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border"
              style={{
                backgroundColor: `${rankData.color}10`,
                borderColor: `${rankData.color}30`,
              }}
            >
              <RankBadge rank={quest.rankRequired as RankKey} size="sm" />
              <div>
                <p className="text-xs font-heading font-semibold" style={{ color: rankData.color }}>
                  Rank {quest.rankRequired} required
                </p>
                <p className="text-xs text-text-muted-dark">{rankData.label} level or above</p>
              </div>
            </div>

            {/* ── Application / Rating zone ── */}
            <AnimatePresence mode="wait">
              {appLoading ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-12 rounded-xl bg-surface-dark animate-pulse"
                />
              ) : application ? (
                <motion.div
                  key="app-status"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {/* Current application status */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-surface-dark border border-border-dark">
                    <span className="text-xs text-text-muted-dark font-heading font-semibold uppercase tracking-wider">
                      Your application
                    </span>
                    <AppStatusPill status={application.status} />
                  </div>

                  {/* Rate quest giver after completion */}
                  {application.status === "completed" && !ratingSubmitted && (
                    <div className="rounded-xl border border-guild-500/30 bg-guild-500/5 p-4">
                      {!ratingOpen ? (
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-heading font-semibold text-white">
                            Rate your quest giver
                          </p>
                          <Button size="sm" variant="secondary" onClick={() => setRatingOpen(true)}>
                            Leave a review
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <p className="text-sm font-heading font-semibold text-white">
                            Rate {quest.questGiverName}
                          </p>
                          <StarRating value={ratingScore} onChange={setRatingScore} />
                          <textarea
                            value={ratingComment}
                            onChange={(e) => setRatingComment(e.target.value)}
                            placeholder="Share your experience (optional)…"
                            rows={2}
                            className="w-full px-3 py-2 rounded-lg bg-bg-dark border border-border-dark text-sm text-text-secondary-dark placeholder:text-text-muted-dark resize-none focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50"
                          />
                          {quest.skills.length > 0 && (
                            <div>
                              <p className="text-xs text-text-muted-dark mb-2">Tag skills demonstrated:</p>
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
                                        "px-2.5 py-1 rounded-full text-xs font-heading font-semibold border transition-colors",
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
                            </div>
                          )}
                          <Button
                            variant="primary"
                            size="md"
                            className="w-full"
                            disabled={ratingScore === 0 || submittingRating}
                            onClick={handleSubmitRating}
                          >
                            {submittingRating ? "Submitting…" : "Submit Review"}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {ratingSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-400 font-heading font-semibold"
                    >
                      <CheckCircle weight="fill" size={16} />
                      Review submitted — XP awarded!
                    </motion.div>
                  )}
                </motion.div>
              ) : applyOpen ? (
                <motion.div
                  key="apply-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <p className="text-sm font-heading font-semibold text-white">
                    Apply to this quest
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Introduce yourself to the quest giver… (optional)"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-xl bg-surface-dark border border-border-dark text-sm text-text-secondary-dark placeholder:text-text-muted-dark resize-none focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all"
                  />
                  {applyError && (
                    <p className="text-xs text-red-400">{applyError}</p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="md"
                      className="flex-1"
                      onClick={() => { setApplyOpen(false); setApplyError("") }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      size="md"
                      className="flex-1"
                      disabled={applying}
                      onClick={handleApply}
                    >
                      {applying ? "Sending…" : "Confirm Apply"}
                    </Button>
                  </div>
                </motion.div>
              ) : canApply ? (
                <motion.div
                  key="apply-btn"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full"
                    onClick={() => setApplyOpen(true)}
                  >
                    <Briefcase weight="bold" size={16} />
                    Apply Now
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="no-slots"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-3 text-center text-sm text-text-muted-dark"
                >
                  {slotsLeft === 0 ? "All slots filled" : "Applications closed"}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
function EmptyState({ hasFilters }: { hasFilters: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="col-span-full flex flex-col items-center justify-center py-20 text-center"
    >
      <div
        className="w-16 h-18 flex items-center justify-center mb-5 opacity-30"
        style={{
          clipPath:
            "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
          background: "linear-gradient(135deg, #6366F1, #7C3AED)",
        }}
        aria-hidden="true"
      >
        <span className="font-heading font-black text-xl text-white">?</span>
      </div>
      <h3 className="font-heading text-lg font-bold text-white mb-2">
        No quests found
      </h3>
      <p className="text-sm text-text-muted-dark max-w-xs leading-relaxed">
        {hasFilters
          ? "Try adjusting your filters or check back soon — new quests are posted daily."
          : "No active quests right now. Check back soon!"}
      </p>
    </motion.div>
  )
}

// ─── Skeleton cards ───────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border-dark bg-surface-dark p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div className="skeleton h-6 w-24 rounded-full" />
        <div className="skeleton h-8 w-7 rounded" />
      </div>
      <div className="skeleton h-5 w-3/4 rounded" />
      <div className="skeleton h-4 w-1/2 rounded" />
      <div className="flex justify-between pt-1 border-t border-border-dark/60">
        <div className="skeleton h-3.5 w-20 rounded" />
        <div className="skeleton h-3.5 w-16 rounded" />
      </div>
    </div>
  )
}

// ─── Quest board ──────────────────────────────────────────────────────────────
function QuestBoard() {
  const hydrated = useHydrated()
  const { userDoc } = useAuth()

  const [quests, setQuests] = React.useState<QuestWithId[]>([])
  const [questsLoading, setQuestsLoading] = React.useState(true)
  const [selectedQuest, setSelectedQuest] = React.useState<QuestWithId | null>(null)

  // Rank-up modal state
  const [rankUpData, setRankUpData] = React.useState<{
    oldRank: RankKey
    newRank: RankKey
    newXP: number
  } | null>(null)

  const handleRankUp = (oldRank: RankKey, newRank: RankKey, newXP: number) => {
    setRankUpData({ oldRank, newRank, newXP })
  }

  // Filter state
  const [category, setCategory] = React.useState("all")
  const [location, setLocation] = React.useState("all")
  const [rank, setRank] = React.useState("all")
  const [search, setSearch] = React.useState("")
  const [sort, setSort] = React.useState("newest")

  // Seed + subscribe
  React.useEffect(() => {
    seedQuestsIfEmpty().catch(console.error)

    const q = query(collection(db, "quests"), where("status", "==", "active"))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as QuestDoc) }))
      setQuests(list)
      setQuestsLoading(false)
    })
    return unsub
  }, [])

  // Derived: filtered + sorted
  const filtered = React.useMemo(() => {
    let result = [...quests]

    if (category !== "all") {
      result = result.filter((q) => q.category === category)
    }
    if (location !== "all") {
      result = result.filter((q) => q.location === location)
    }
    if (rank !== "all") {
      result = result.filter((q) => q.rankRequired === rank)
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase()
      result = result.filter((q) => q.title.toLowerCase().includes(s))
    }

    switch (sort) {
      case "highest_pay":
        result.sort((a, b) => (b.payMax ?? 0) - (a.payMax ?? 0))
        break
      case "rank_match": {
        const userRank = userDoc?.rank ?? "F"
        const uIdx = rankIndex(userRank)
        result.sort(
          (a, b) =>
            Math.abs(rankIndex(a.rankRequired as RankKey) - uIdx) -
            Math.abs(rankIndex(b.rankRequired as RankKey) - uIdx)
        )
        break
      }
      case "newest":
      default:
        result.sort((a, b) => {
          const at = (a.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
          const bt = (b.createdAt as { toMillis?: () => number })?.toMillis?.() ?? 0
          return bt - at
        })
    }

    return result
  }, [quests, category, location, rank, search, sort, userDoc?.rank])

  const hasFilters =
    category !== "all" || location !== "all" || rank !== "all" || search.trim() !== ""

  // Filter options
  const categoryOptions = [
    { value: "all", label: "All categories" },
    ...Object.entries(QUEST_CATEGORIES).map(([k, v]) => ({
      value: k.toLowerCase(),
      label: `${v.icon} ${v.label}`,
    })),
  ]

  const locationOptions = [
    { value: "all", label: "All locations" },
    ...SG_DISTRICTS.map((d) => ({ value: d, label: d })),
  ]

  const rankOptions = [
    { value: "all", label: "Any rank" },
    ...RANK_ORDER.map((r) => ({ value: r, label: `Rank ${r} — ${RANKS[r].label}` })),
  ]

  const sortOptions = [
    { value: "newest", label: "Newest first" },
    { value: "highest_pay", label: "Highest pay" },
    { value: "rank_match", label: "Best rank match" },
  ]

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-bg-dark pt-20">
        {/* Header */}
        <section className="relative overflow-hidden border-b border-border-dark">
          {/* Subtle gradient */}
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(to bottom, rgba(99,102,241,0.06) 0%, transparent 100%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-7xl px-6 py-8">
            <motion.div
              initial={hydrated ? { opacity: 0, y: 16 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-center gap-2 mb-1">
                <div
                  className="w-4 h-0.5 rounded-full bg-guild-500"
                  aria-hidden="true"
                />
                <span className="text-xs font-heading font-semibold text-guild-400 uppercase tracking-widest">
                  Active quests
                </span>
              </div>
              <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
                Quest Board
              </h1>
              <p className="mt-1.5 text-sm text-text-secondary-dark">
                {questsLoading
                  ? "Loading quests…"
                  : `${filtered.length} quest${filtered.length !== 1 ? "s" : ""} available across Singapore`}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters */}
        <section className="sticky top-[65px] z-40 border-b border-border-dark bg-bg-dark/90 backdrop-blur-xl">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 py-3">
            <div className="flex gap-2 items-center overflow-x-auto pb-1 scrollbar-none snap-x">
              {/* Search */}
              <div className="relative flex-shrink-0 w-40 sm:flex-1 sm:min-w-[160px] sm:max-w-xs">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted-dark pointer-events-none"
                  width="14"
                  height="14"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quests…"
                  aria-label="Search quests"
                  className="w-full h-11 pl-8 pr-3 rounded-lg bg-surface-dark border border-border-dark text-sm text-text-secondary-dark placeholder:text-text-muted-dark hover:border-guild-500/30 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all duration-200"
                />
              </div>

              <FilterSelect
                label="Category"
                value={category}
                onChange={setCategory}
                options={categoryOptions}
              />
              <FilterSelect
                label="Location"
                value={location}
                onChange={setLocation}
                options={locationOptions}
              />
              <FilterSelect
                label="Rank"
                value={rank}
                onChange={setRank}
                options={rankOptions}
              />
              <FilterSelect
                label="Sort by"
                value={sort}
                onChange={setSort}
                options={sortOptions}
              />

              {hasFilters && (
                <button
                  onClick={() => {
                    setCategory("all")
                    setLocation("all")
                    setRank("all")
                    setSearch("")
                  }}
                  className="h-9 px-3 text-xs font-heading font-semibold text-text-muted-dark hover:text-white transition-colors"
                  aria-label="Clear filters"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Quest grid */}
        <section className="mx-auto max-w-7xl px-4 sm:px-6 py-8 pb-safe-offset-20">
          {questsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState hasFilters={hasFilters} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((quest, i) => (
                <button
                  key={quest.id}
                  onClick={() => setSelectedQuest(quest)}
                  className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500 rounded-2xl"
                  aria-label={`View quest: ${quest.title}`}
                >
                  <QuestCard
                    quest={toCardData(quest)}
                    index={i}
                    className={cn(
                      "transition-all",
                      quest.isFeatured &&
                        "ring-1 ring-guild-500/30 shadow-guild"
                    )}
                  />
                </button>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Quest detail modal */}
      <QuestModal
        quest={selectedQuest}
        onClose={() => setSelectedQuest(null)}
        onRankUp={handleRankUp}
      />

      {/* Rank-up celebration */}
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
export default function QuestsPage() {
  return (
    <AuthGuard>
      <QuestBoard />
    </AuthGuard>
  )
}
