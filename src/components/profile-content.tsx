"use client"

import * as React from "react"
import { motion } from "framer-motion"
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import {
  MapPin,
  Star,
  CalendarBlank,
  Trophy,
  Coins,
  PencilSimple,
  Check,
  X,
  Camera,
  Shield,
  ArrowLeft,
} from "@phosphor-icons/react"
import { useRouter } from "next/navigation"
import { db, storage } from "@/lib/firebase"
import { useAuth } from "@/lib/auth-context"
import { Navbar } from "@/components/navbar"
import { RankBadge } from "@/components/rank-badge"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RANKS, QUEST_CATEGORIES, SG_DISTRICTS } from "@/lib/constants"
import type { RankKey } from "@/lib/constants"
import { getNextRankProgress } from "@/lib/rank-utils"
import type { UserDoc, RatingDoc } from "@/lib/firestore-schema"
import { cn } from "@/lib/utils"

type RatingWithId = RatingDoc & { id: string }

function formatDate(ts: unknown): string {
  if (!ts) return "Unknown"
  if (typeof (ts as { toDate?: unknown }).toDate === "function") {
    return (ts as { toDate: () => Date })
      .toDate()
      .toLocaleDateString("en-SG", { year: "numeric", month: "short" })
  }
  if (typeof (ts as { seconds?: unknown }).seconds === "number") {
    return new Date((ts as { seconds: number }).seconds * 1000).toLocaleDateString("en-SG", {
      year: "numeric",
      month: "short",
    })
  }
  return "Recently"
}

function StarRating({ score, size = 14 }: { score: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          weight={i <= Math.round(score) ? "fill" : "regular"}
          className={i <= Math.round(score) ? "text-amber-400" : "text-slate-600"}
        />
      ))}
    </span>
  )
}

function getSkillCat(skill: string) {
  const upper = skill.toUpperCase() as keyof typeof QUEST_CATEGORIES
  return QUEST_CATEGORIES[upper] ?? null
}

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] as const },
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-[#0F0D15]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-safe-offset-20 space-y-4">
        <div className="rounded-2xl bg-[#1A1726] border border-[#2D2841] overflow-hidden">
          <div className="h-24 bg-[#231F33] animate-pulse" />
          <div className="px-5 pb-5 -mt-10 space-y-3">
            <div className="w-20 h-20 rounded-full bg-[#231F33] animate-pulse border-4 border-[#0F0D15]" />
            <div className="h-6 w-44 rounded-lg bg-[#231F33] animate-pulse" />
            <div className="h-4 w-28 rounded-lg bg-[#231F33] animate-pulse" />
            <div className="h-4 w-full rounded-lg bg-[#231F33] animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl bg-[#1A1726] border border-[#2D2841] p-4 space-y-2 animate-pulse">
              <div className="h-7 w-10 rounded bg-[#231F33] mx-auto" />
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

function ProfileNotFound() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-[#0F0D15] flex flex-col">
      <Navbar />
      <div className="flex-1 flex items-center justify-center px-4 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-5"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-[#1A1726] border border-[#2D2841] flex items-center justify-center">
            <span className="font-bold text-3xl text-slate-600">?</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Adventurer Not Found</h1>
            <p className="text-slate-400 text-sm">This guild member doesn&apos;t exist or may have left the ranks.</p>
          </div>
          <Button onClick={() => router.push("/quests")}>
            <ArrowLeft size={16} weight="bold" />
            Back to Quests
          </Button>
        </motion.div>
      </div>
    </div>
  )
}

interface EditState {
  name: string
  bio: string
  location: string
  skills: string[]
  avatarFile: File | null
  avatarPreview: string | null
}

export function ProfileContent({ userId }: { userId: string }) {
  const { user, userDoc: currentUserDoc, refreshUserDoc } = useAuth()
  const router = useRouter()

  const [profileUser, setProfileUser] = React.useState<UserDoc | null | undefined>(undefined)
  const [ratings, setRatings] = React.useState<RatingWithId[]>([])
  const [isEditing, setIsEditing] = React.useState(false)
  const [editState, setEditState] = React.useState<EditState>({
    name: "", bio: "", location: "", skills: [], avatarFile: null, avatarPreview: null,
  })
  const [saving, setSaving] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const isOwnProfile = user?.uid === userId

  React.useEffect(() => {
    async function fetchProfile() {
      const snap = await getDoc(doc(db, "users", userId))
      setProfileUser(snap.exists() ? (snap.data() as UserDoc) : null)
    }
    fetchProfile()
  }, [userId])

  React.useEffect(() => {
    if (isOwnProfile && currentUserDoc) setProfileUser(currentUserDoc)
  }, [isOwnProfile, currentUserDoc])

  React.useEffect(() => {
    async function fetchRatings() {
      try {
        const q = query(
          collection(db, "ratings"),
          where("receiverId", "==", userId),
          orderBy("createdAt", "desc"),
          limit(10)
        )
        const snap = await getDocs(q)
        setRatings(snap.docs.map((d) => ({ id: d.id, ...d.data() } as RatingWithId)))
      } catch {
        // Index may not exist yet
      }
    }
    fetchRatings()
  }, [userId])

  function startEditing() {
    if (!profileUser) return
    setEditState({
      name: profileUser.name,
      bio: profileUser.bio ?? "",
      location: profileUser.location ?? "",
      skills: profileUser.skills ?? [],
      avatarFile: null,
      avatarPreview: profileUser.avatarUrl ?? null,
    })
    setIsEditing(true)
  }

  async function saveProfile() {
    if (!user || !profileUser) return
    setSaving(true)
    try {
      let avatarUrl = profileUser.avatarUrl
      if (editState.avatarFile) {
        const storageRef = ref(storage, `avatars/${user.uid}`)
        await uploadBytes(storageRef, editState.avatarFile)
        avatarUrl = await getDownloadURL(storageRef)
      }
      await updateDoc(doc(db, "users", user.uid), {
        name: editState.name.trim() || profileUser.name,
        bio: editState.bio.trim(),
        location: editState.location,
        skills: editState.skills,
        ...(avatarUrl ? { avatarUrl } : {}),
        updatedAt: serverTimestamp(),
      })
      await refreshUserDoc()
      setIsEditing(false)
    } catch (err) {
      console.error("Failed to save profile:", err)
    } finally {
      setSaving(false)
    }
  }

  function toggleSkill(key: string) {
    setEditState((prev) => ({
      ...prev,
      skills: prev.skills.includes(key) ? prev.skills.filter((s) => s !== key) : [...prev.skills, key],
    }))
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setEditState((prev) => ({ ...prev, avatarFile: file, avatarPreview: URL.createObjectURL(file) }))
  }

  if (profileUser === undefined) return <ProfileSkeleton />
  if (profileUser === null) return <ProfileNotFound />

  const rankData = RANKS[profileUser.rank as RankKey]
  const progress = getNextRankProgress(profileUser)
  const avatarSrc = isEditing ? editState.avatarPreview : (profileUser.avatarUrl ?? null)
  const avatarLetter = profileUser.name?.[0]?.toUpperCase() ?? "?"

  return (
    <div className="min-h-screen bg-[#0F0D15]">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 pt-24 pb-safe-offset-20 space-y-4">

        {/* Hero card */}
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl border border-[#2D2841] bg-[#1A1726]">
          <div className="h-24 w-full" style={{ background: `linear-gradient(135deg, ${rankData.bgColor} 0%, ${rankData.color}33 60%, #1A1726 100%)` }} />
          <div className="px-5 pb-5">
            <div className="flex items-end justify-between -mt-10 mb-4">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center bg-[#1A1726] border-4" style={{ borderColor: `${rankData.color}55` }}>
                  {avatarSrc ? (
                    <img src={avatarSrc} alt={profileUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-3xl" style={{ color: rankData.color }}>{avatarLetter}</span>
                  )}
                </div>
                {isEditing && (
                  <>
                    <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#4F46E5] border-2 border-[#0F0D15] flex items-center justify-center hover:bg-[#5B52F0] transition-colors">
                      <Camera size={13} weight="bold" className="text-white" />
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                  </>
                )}
                <div className="absolute -bottom-2 -right-3">
                  <RankBadge rank={profileUser.rank as RankKey} size="sm" />
                </div>
              </div>
              {isOwnProfile && (
                <div className="flex items-center gap-2 pb-1 shrink-0">
                  {isEditing ? (
                    <>
                      <Button size="sm" onClick={() => setIsEditing(false)} disabled={saving}><X size={13} weight="bold" /> Cancel</Button>
                      <Button size="sm" onClick={saveProfile} disabled={saving}><Check size={13} weight="bold" /> {saving ? "Saving…" : "Save"}</Button>
                    </>
                  ) : (
                    <Button size="sm" onClick={startEditing}><PencilSimple size={13} weight="bold" /> Edit Profile</Button>
                  )}
                </div>
              )}
            </div>

            {isEditing ? (
              <input type="text" value={editState.name} onChange={(e) => setEditState((p) => ({ ...p, name: e.target.value }))} className="w-full bg-[#231F33] border border-[#2D2841] rounded-xl px-4 py-2.5 text-white font-bold text-xl focus:outline-none focus:border-[#4F46E5] transition-colors mb-3" placeholder="Your name" maxLength={60} />
            ) : (
              <div className="flex items-center gap-2.5 mb-1 flex-wrap">
                <h1 className="font-bold text-2xl text-white">{profileUser.name}</h1>
                {profileUser.isVerified && <Shield size={18} weight="fill" className="text-[#7C3AED]" />}
              </div>
            )}

            {!isEditing && <p className="text-sm font-semibold mb-3" style={{ color: rankData.color }}>Rank {profileUser.rank} — {rankData.label}</p>}

            {isEditing ? (
              <textarea value={editState.bio} onChange={(e) => setEditState((p) => ({ ...p, bio: e.target.value }))} className="w-full bg-[#231F33] border border-[#2D2841] rounded-xl px-4 py-2.5 text-slate-400 text-sm focus:outline-none focus:border-[#4F46E5] transition-colors resize-none mb-4" placeholder="Tell the guild who you are…" rows={3} maxLength={300} />
            ) : profileUser.bio && (
              <p className="text-slate-400 text-sm leading-relaxed mb-3">{profileUser.bio}</p>
            )}

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
              {isEditing ? (
                <select value={editState.location} onChange={(e) => setEditState((p) => ({ ...p, location: e.target.value }))} className="bg-[#231F33] border border-[#2D2841] rounded-lg px-3 py-1.5 text-slate-400 text-xs focus:outline-none focus:border-[#4F46E5]">
                  <option value="">No location set</option>
                  {SG_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              ) : profileUser.location && (
                <span className="flex items-center gap-1.5"><MapPin size={13} weight="fill" className="text-[#7C3AED]" />{profileUser.location}, Singapore</span>
              )}
              <span className="flex items-center gap-1.5"><CalendarBlank size={13} weight="fill" className="text-[#7C3AED]" />Member since {formatDate(profileUser.createdAt)}</span>
            </div>
          </div>
        </motion.div>

        {/* Skills */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.06 }} className="rounded-2xl border border-[#2D2841] bg-[#1A1726] p-5">
          <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-widest mb-3">Skills</h2>
          {isEditing ? (
            <div className="flex flex-wrap gap-2">
              {Object.entries(QUEST_CATEGORIES).map(([key, cat]) => {
                const selected = editState.skills.includes(key)
                return (
                  <button key={key} onClick={() => toggleSkill(key)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all", !selected && "border-[#2D2841] bg-[#231F33] text-slate-500 hover:border-[#4F46E5]/40")} style={selected ? { borderColor: cat.color + "80", backgroundColor: cat.color + "20", color: cat.color } : undefined}>
                    <span>{cat.icon}</span> {cat.label} {selected && <Check size={10} weight="bold" />}
                  </button>
                )
              })}
            </div>
          ) : profileUser.skills?.length ? (
            <div className="flex flex-wrap gap-2">
              {profileUser.skills.map((skill) => {
                const cat = getSkillCat(skill)
                return cat ? (
                  <span key={skill} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border" style={{ borderColor: cat.color + "60", backgroundColor: cat.color + "18", color: cat.color }}>
                    <span>{cat.icon}</span> {cat.label}
                  </span>
                ) : <Badge key={skill}>{skill}</Badge>
              })}
            </div>
          ) : <p className="text-sm text-slate-500">No skills listed yet.</p>}
        </motion.div>

        {/* Stats */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }} className="grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-[#2D2841] bg-[#1A1726] p-4 text-center">
            <Trophy size={20} weight="fill" className="text-amber-400 mx-auto mb-2" />
            <p className="font-bold text-2xl text-white">{profileUser.questsCompleted}</p>
            <p className="text-xs text-slate-500 mt-0.5">Quests</p>
          </div>
          <div className="rounded-xl border border-[#2D2841] bg-[#1A1726] p-4 text-center">
            <Star size={20} weight="fill" className="text-amber-400 mx-auto mb-2" />
            <p className="font-bold text-2xl text-white">{profileUser.totalRatings > 0 ? profileUser.averageRating.toFixed(1) : "—"}</p>
            {profileUser.totalRatings > 0 && <div className="flex justify-center my-0.5"><StarRating score={profileUser.averageRating} size={10} /></div>}
            <p className="text-xs text-slate-500 mt-0.5">{profileUser.totalRatings > 0 ? `${profileUser.totalRatings} reviews` : "No reviews"}</p>
          </div>
          <div className="rounded-xl border border-[#2D2841] bg-[#1A1726] p-4 text-center">
            <Coins size={20} weight="fill" className="text-amber-400 mx-auto mb-2" />
            <p className="font-bold text-2xl text-white">${profileUser.totalEarnings.toLocaleString()}</p>
            <p className="text-xs text-slate-500 mt-0.5">SGD earned</p>
          </div>
        </motion.div>

        {/* XP Progress */}
        {progress.nextRank && (
          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.14 }} className="rounded-2xl border border-[#2D2841] bg-[#1A1726] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-widest">Rank Progress</h2>
              <div className="flex items-center gap-2">
                <RankBadge rank={profileUser.rank as RankKey} size="sm" />
                <span className="text-slate-500">→</span>
                <RankBadge rank={progress.nextRank} size="sm" />
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">XP</span>
                  <span className="text-slate-500 tabular-nums">{profileUser.xp.toLocaleString()} / {RANKS[progress.nextRank].minXP.toLocaleString()}</span>
                </div>
                <div className="h-2.5 rounded-full bg-[#231F33] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress.xpProgress}%` }} transition={{ duration: 1.1, delay: 0.35, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${rankData.color}, ${RANKS[progress.nextRank].color})` }} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-slate-400 font-medium">Quests</span>
                  <span className="text-slate-500 tabular-nums">{profileUser.questsCompleted} / {RANKS[progress.nextRank].minQuests}</span>
                </div>
                <div className="h-2 rounded-full bg-[#231F33] overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${progress.questsProgress}%` }} transition={{ duration: 1.1, delay: 0.45, ease: "easeOut" }} className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${rankData.color}, ${RANKS[progress.nextRank].color})` }} />
                </div>
              </div>
            </div>
            {progress.xpNeeded > 0 && <p className="text-xs text-slate-500 mt-3"><span className="text-slate-300 font-semibold">{progress.xpNeeded.toLocaleString()} XP</span> needed to unlock Rank {progress.nextRank}</p>}
          </motion.div>
        )}

        {/* Reviews */}
        <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.18 }}>
          <h2 className="font-semibold text-xs text-slate-500 uppercase tracking-widest px-1 mb-3">Reviews{ratings.length > 0 && ` (${ratings.length})`}</h2>
          {ratings.length === 0 ? (
            <div className="rounded-2xl border border-[#2D2841] bg-[#1A1726] p-8 text-center">
              <Star size={28} weight="fill" className="text-slate-600 mx-auto mb-2.5" />
              <p className="text-slate-500 text-sm">No reviews yet.</p>
              {isOwnProfile && <p className="text-slate-600 text-xs mt-1">Complete quests to earn your first review.</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {ratings.map((rating, i) => (
                <motion.div key={rating.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.22 + i * 0.05 }} className="rounded-xl border border-[#2D2841] bg-[#1A1726] p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#231F33] border border-[#4F46E5]/30 flex items-center justify-center shrink-0">
                        <span className="font-bold text-xs text-[#7C3AED]">{rating.giverName?.[0]?.toUpperCase() ?? "?"}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{rating.giverName}</p>
                        <p className="text-xs text-slate-500 truncate">{rating.questTitle}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <StarRating score={rating.score} size={12} />
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(rating.createdAt)}</p>
                    </div>
                  </div>
                  {rating.comment && <p className="text-sm text-slate-400 leading-relaxed pl-[42px]">&ldquo;{rating.comment}&rdquo;</p>}
                  {rating.skillTags?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5 pl-[42px]">
                      {rating.skillTags.map((tag) => <Badge key={tag}>{tag}</Badge>)}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
