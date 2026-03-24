"use client"

import * as React from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  updateDoc,
  doc,
  increment,
  serverTimestamp,
  orderBy,
} from "firebase/firestore"
import {
  Sword,
  CheckCircle,
  XCircle,
  Clock,
  Users,
  MapPin,
  CurrencyDollar,
  CaretDown,
  PlusCircle,
  Star,
  Trophy,
  Briefcase,
} from "@phosphor-icons/react"
import { db } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import { RankBadge } from "@/components/rank-badge"
import { Button } from "@/components/ui/button"
import { acceptApplication, rejectApplication } from "@/lib/quest-actions"
import { QUEST_CATEGORIES } from "@/lib/constants"
import type { QuestDoc, ApplicationDoc } from "@/lib/firestore-schema"

type QuestWithId = QuestDoc & { id: string }
type ApplicationWithId = ApplicationDoc & { id: string }
type TabKey = "active" | "completed" | "all"

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Active", color: "#6366F1", bg: "rgba(99,102,241,0.15)" },
  in_progress: { label: "In Progress", color: "#F59E0B", bg: "rgba(245,158,11,0.15)" },
  completed: { label: "Completed", color: "#10B981", bg: "rgba(16,185,129,0.15)" },
  cancelled: { label: "Cancelled", color: "#EF4444", bg: "rgba(239,68,68,0.15)" },
  draft: { label: "Draft", color: "#64748B", bg: "rgba(100,116,139,0.15)" },
  pending_review: { label: "Pending", color: "#94A3B8", bg: "rgba(148,163,184,0.15)" },
  expired: { label: "Expired", color: "#64748B", bg: "rgba(100,116,139,0.15)" },
}

function getCategoryInfo(category: string) {
  const key = category.toUpperCase() as keyof typeof QUEST_CATEGORIES
  return QUEST_CATEGORIES[key] ?? QUEST_CATEGORIES.OTHER
}

function formatPay(quest: QuestDoc): string {
  if (!quest.payMin && !quest.payMax) return "Negotiable"
  const unit =
    quest.payType === "hourly" ? "/hr" : quest.payType === "daily" ? "/day" : " fixed"
  const min = quest.payMin ?? quest.payMax
  const max = quest.payMax
  if (min && max && min !== max) return `$${min}–$${max}${unit}`
  return `$${min}${unit}`
}

function timeAgo(ts: { seconds: number } | null | undefined): string {
  if (!ts) return "Just now"
  const secs = Math.floor(Date.now() / 1000 - ts.seconds)
  if (secs < 60) return "Just now"
  if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
  if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
  return `${Math.floor(secs / 86400)}d ago`
}

// ── Skeleton ───────────────────────────────────────────────────────────────────

function QuestSkeleton() {
  return (
    <div className="rounded-2xl border border-white/8 bg-surface p-5 space-y-3 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-xl bg-white/8 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 bg-white/10 rounded" />
          <div className="flex gap-3">
            <div className="h-3 w-20 bg-white/6 rounded" />
            <div className="h-3 w-16 bg-white/6 rounded" />
            <div className="h-3 w-14 bg-white/6 rounded" />
          </div>
        </div>
        <div className="h-6 w-20 bg-white/8 rounded-full flex-shrink-0" />
      </div>
    </div>
  )
}

// ── Applicant Row ──────────────────────────────────────────────────────────────

function ApplicantRow({
  app,
  questId,
  onAction,
}: {
  app: ApplicationWithId
  questId: string
  onAction: () => void
}) {
  const [actionLoading, setActionLoading] = React.useState<"accept" | "reject" | null>(null)

  async function handleAccept() {
    setActionLoading("accept")
    try {
      await acceptApplication(questId, app.id)
      onAction()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    setActionLoading("reject")
    try {
      await rejectApplication(questId, app.id)
      onAction()
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-white/6 bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
    >
      {/* Avatar + info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {app.adventurerAvatar ? (
            <img
              src={app.adventurerAvatar}
              alt={app.adventurerName}
              className="w-10 h-10 rounded-full object-cover border border-white/10"
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-sm"
              style={{ background: "linear-gradient(135deg, #6366F1, #7C3AED)" }}
            >
              {app.adventurerName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute -bottom-1 -right-1">
            <RankBadge rank={app.adventurerRank} size="sm" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-heading font-semibold text-sm text-white truncate">
            {app.adventurerName}
          </p>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Star size={11} weight="fill" style={{ color: "#F59E0B" }} />
              {app.adventurerRating > 0 ? app.adventurerRating.toFixed(1) : "New"}
            </span>
            <span className="text-xs text-slate-500">
              {app.adventurerQuestsCompleted} quests
            </span>
          </div>
          {app.message && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 italic">
              "{app.message}"
            </p>
          )}
        </div>
      </div>

      {/* Status / Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {app.status === "accepted" && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-400 px-2 py-1 rounded-full bg-emerald-400/10">
            <CheckCircle size={12} weight="fill" />
            Accepted
          </span>
        )}
        {app.status === "rejected" && (
          <span className="flex items-center gap-1 text-xs font-medium text-red-400 px-2 py-1 rounded-full bg-red-400/10">
            <XCircle size={12} weight="fill" />
            Rejected
          </span>
        )}
        {app.status === "completed" && (
          <span
            className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full"
            style={{ color: "#6366F1", background: "rgba(99,102,241,0.12)" }}
          >
            <Trophy size={12} weight="fill" />
            Completed
          </span>
        )}
        {app.status === "pending" && (
          <>
            <button
              onClick={handleReject}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 border border-red-400/30 hover:bg-red-400/10 transition-colors disabled:opacity-50"
            >
              {actionLoading === "reject" ? (
                <span
                  className="w-3 h-3 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(248,113,113,0.3)", borderTopColor: "#F87171" }}
                />
              ) : (
                <XCircle size={12} weight="bold" />
              )}
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={!!actionLoading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-guild-600 hover:bg-guild-500 transition-colors disabled:opacity-50"
            >
              {actionLoading === "accept" ? (
                <span
                  className="w-3 h-3 rounded-full border-2 animate-spin"
                  style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "white" }}
                />
              ) : (
                <CheckCircle size={12} weight="bold" />
              )}
              Accept
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}

// ── Quest Item ─────────────────────────────────────────────────────────────────

function QuestItem({ quest }: { quest: QuestWithId }) {
  const [expanded, setExpanded] = React.useState(false)
  const [apps, setApps] = React.useState<ApplicationWithId[]>([])
  const [appsLoading, setAppsLoading] = React.useState(false)
  const [completing, setCompleting] = React.useState(false)

  const catInfo = getCategoryInfo(quest.category)
  const statusCfg = STATUS_CONFIG[quest.status] ?? STATUS_CONFIG.active
  const isCompletable = quest.status === "active" || quest.status === "in_progress"

  async function fetchApps() {
    setAppsLoading(true)
    try {
      const snap = await getDocs(
        query(
          collection(db, "quests", quest.id, "applications"),
          orderBy("createdAt", "desc")
        )
      )
      setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as ApplicationWithId))
    } catch (e) {
      console.error(e)
    } finally {
      setAppsLoading(false)
    }
  }

  async function handleCompleteQuest() {
    if (
      !window.confirm(
        "Mark this quest as completed? All accepted adventurers will be credited."
      )
    )
      return
    setCompleting(true)
    try {
      const acceptedSnap = await getDocs(
        query(
          collection(db, "quests", quest.id, "applications"),
          where("status", "==", "accepted")
        )
      )
      await updateDoc(doc(db, "quests", quest.id), {
        status: "completed",
        updatedAt: serverTimestamp(),
      })
      for (const appDoc of acceptedSnap.docs) {
        const app = appDoc.data() as ApplicationDoc
        await updateDoc(appDoc.ref, {
          status: "completed",
          completedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        await updateDoc(doc(db, "users", app.adventurerId), {
          questsCompleted: increment(1),
          updatedAt: serverTimestamp(),
        })
      }
    } catch (e) {
      console.error(e)
      alert("Something went wrong. Please try again.")
    } finally {
      setCompleting(false)
    }
  }

  function handleToggle() {
    if (!expanded && apps.length === 0) fetchApps()
    setExpanded((v) => !v)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/8 bg-surface overflow-hidden"
      whileHover={{ boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.25)" }}
      transition={{ duration: 0.15 }}
    >
      <button
        onClick={handleToggle}
        className="w-full flex flex-col sm:flex-row sm:items-center gap-3 p-5 text-left hover:bg-white/[0.025] transition-colors"
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `${catInfo.color}22`, border: `1px solid ${catInfo.color}44` }}
        >
          {catInfo.icon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-heading font-semibold text-white text-[15px]">
              {quest.title}
            </h3>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ color: statusCfg.color, background: statusCfg.bg }}
            >
              {statusCfg.label}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin size={11} />
              {quest.location}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <CurrencyDollar size={11} />
              {formatPay(quest)}
            </span>
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <Clock size={11} />
              {timeAgo(quest.createdAt as unknown as { seconds: number })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-center">
          <div className="flex items-center gap-1.5">
            <Users size={14} className="text-slate-400" />
            <span className="font-heading font-bold text-sm text-white">
              {quest.applicationCount}
            </span>
            <span className="text-slate-500 text-xs">applicants</span>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <CaretDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="panel"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            style={{ overflow: "hidden" }}
          >
            <div className="px-5 pb-5 border-t border-white/6">
              <div className="flex items-center justify-between py-3.5">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Applicants
                </span>
                {isCompletable && (
                  <button
                    onClick={handleCompleteQuest}
                    disabled={completing}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-400 border border-emerald-400/30 hover:bg-emerald-400/10 transition-colors disabled:opacity-50"
                  >
                    {completing ? (
                      <span
                        className="w-3 h-3 rounded-full border-2 animate-spin"
                        style={{
                          borderColor: "rgba(52,211,153,0.3)",
                          borderTopColor: "#34D399",
                        }}
                      />
                    ) : (
                      <Trophy size={13} weight="fill" />
                    )}
                    Mark Complete
                  </button>
                )}
              </div>

              {appsLoading ? (
                <div className="space-y-2">
                  {[1, 2].map((i) => (
                    <div key={i} className="h-[68px] rounded-xl bg-white/[0.04] animate-pulse" />
                  ))}
                </div>
              ) : apps.length === 0 ? (
                <div className="py-8 text-center">
                  <Users size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">No adventurers have applied yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {apps.map((app) => (
                    <ApplicantRow
                      key={app.id}
                      app={app}
                      questId={quest.id}
                      onAction={fetchApps}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ tab }: { tab: TabKey }) {
  const isCompleted = tab === "completed"
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center py-24 text-center"
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(124,58,237,0.07))",
          border: "1px solid rgba(99,102,241,0.15)",
        }}
      >
        {isCompleted ? (
          <Trophy size={32} style={{ color: "#F59E0B" }} weight="fill" />
        ) : (
          <Sword size={32} className="text-guild-400" weight="fill" />
        )}
      </div>
      <h3 className="font-heading font-bold text-xl text-white mb-2">
        {isCompleted ? "No completed quests yet" : "No quests posted yet"}
      </h3>
      <p className="text-slate-400 text-sm max-w-xs mb-8 leading-relaxed">
        {isCompleted
          ? "Once you mark a quest as complete, it will appear here."
          : "Your first quest could be taken by a rising star. Post it now."}
      </p>
      {!isCompleted && (
        <Link href="/post-quest">
          <Button variant="primary" size="lg">
            <PlusCircle size={18} weight="fill" />
            Post Your First Quest
          </Button>
        </Link>
      )}
    </motion.div>
  )
}

// ── Dashboard content ──────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuth()
  const [quests, setQuests] = React.useState<QuestWithId[]>([])
  const [loading, setLoading] = React.useState(true)
  const [tab, setTab] = React.useState<TabKey>("active")

  React.useEffect(() => {
    if (!user) return
    const q = query(collection(db, "quests"), where("questGiverId", "==", user.uid))
    const unsub = onSnapshot(
      q,
      (snap) => {
        const sorted = snap.docs
          .map((d) => ({ id: d.id, ...d.data() }) as QuestWithId)
          .sort(
            (a, b) =>
              ((b.createdAt as unknown as { seconds: number })?.seconds ?? 0) -
              ((a.createdAt as unknown as { seconds: number })?.seconds ?? 0)
          )
        setQuests(sorted)
        setLoading(false)
      },
      (err) => {
        console.error(err)
        setLoading(false)
      }
    )
    return unsub
  }, [user])

  const filteredQuests = quests.filter((q) => {
    if (tab === "active") return q.status === "active" || q.status === "in_progress"
    if (tab === "completed") return q.status === "completed"
    return true
  })

  const stats = {
    total: quests.length,
    active: quests.filter((q) => q.status === "active" || q.status === "in_progress").length,
    completed: quests.filter((q) => q.status === "completed").length,
    applicants: quests.reduce((s, q) => s + (q.applicationCount ?? 0), 0),
  }

  const TABS: { key: TabKey; label: string; count: number }[] = [
    { key: "active", label: "Active", count: stats.active },
    { key: "completed", label: "Completed", count: stats.completed },
    { key: "all", label: "All", count: stats.total },
  ]

  return (
    <div className="min-h-screen bg-bg-dark">
      <Navbar />

      {/* Header */}
      <div
        className="relative pt-24 pb-10 px-4"
        style={{
          background: "linear-gradient(180deg, rgba(79,70,229,0.1) 0%, transparent 100%)",
        }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-end justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center"
                  style={{ background: "linear-gradient(135deg, #6366F1, #7C3AED)" }}
                >
                  <Briefcase size={14} className="text-white" weight="fill" />
                </div>
                <span className="text-xs font-semibold text-guild-400 uppercase tracking-widest">
                  Quest Giver Dashboard
                </span>
              </div>
              <h1 className="font-heading font-black text-3xl sm:text-4xl text-white">
                Your Quests
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Manage postings and review adventurer applications
              </p>
            </div>
            <Link href="/post-quest">
              <Button variant="primary" size="md" className="whitespace-nowrap">
                <PlusCircle size={16} weight="fill" />
                Post New Quest
              </Button>
            </Link>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8"
          >
            {[
              { label: "Total Quests", value: stats.total, icon: <Sword size={15} />, accent: false },
              { label: "Active", value: stats.active, icon: <Clock size={15} />, accent: true },
              { label: "Completed", value: stats.completed, icon: <Trophy size={15} />, accent: false },
              { label: "Applicants", value: stats.applicants, icon: <Users size={15} />, accent: false },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl p-4 border"
                style={{
                  background: s.accent
                    ? "linear-gradient(135deg, rgba(99,102,241,0.14), rgba(124,58,237,0.08))"
                    : "rgba(255,255,255,0.025)",
                  borderColor: s.accent ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.08)",
                }}
              >
                <div className="mb-2" style={{ color: s.accent ? "#6366F1" : "#475569" }}>
                  {s.icon}
                </div>
                <div className="font-heading font-black text-2xl text-white">{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Tabs + list */}
      <div className="max-w-4xl mx-auto px-4 pb-safe-offset-20">
        <div className="flex gap-1 mb-6 bg-surface rounded-xl p-1 w-full sm:w-fit border border-white/6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="relative flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-150 min-h-[44px]"
              style={{ color: tab === t.key ? "white" : "#64748B" }}
            >
              {tab === t.key && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-lg"
                  style={{ background: "linear-gradient(135deg, #6366F1, #7C3AED)" }}
                  transition={{ type: "spring", bounce: 0.18, duration: 0.35 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t.label}
                {t.count > 0 && (
                  <span
                    className="text-xs px-1.5 rounded-full"
                    style={{
                      background:
                        tab === t.key ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.06)",
                      color: tab === t.key ? "white" : "#475569",
                    }}
                  >
                    {t.count}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <QuestSkeleton key={i} />
            ))}
          </div>
        ) : filteredQuests.length === 0 ? (
          <EmptyState tab={tab} />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {filteredQuests.map((q) => (
                <QuestItem key={q.id} quest={q} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  )
}
