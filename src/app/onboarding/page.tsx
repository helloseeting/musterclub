"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { db, storage } from "@/lib/firebase"
import { QUEST_CATEGORIES, SG_DISTRICTS, RANKS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Rank } from "@/lib/firestore-schema"

// ─── Types ────────────────────────────────────────────────────────────────────

interface OnboardingData {
  displayName: string
  bio: string
  photoFile: File | null
  photoPreview: string
  location: string
  skills: string[]
  hasDoneGigWork: boolean | null
  hasCertifications: boolean | null
  hasOwnTools: boolean | null
}

// ─── Confetti ─────────────────────────────────────────────────────────────────
// Deterministic positions via golden angle to avoid SSR/hydration mismatch

const CONFETTI_DATA = Array.from({ length: 72 }, (_, i) => {
  const x = (i * 137.508) % 100
  const colors = ["#6366F1", "#7C3AED", "#F59E0B", "#EC4899", "#10B981", "#3B82F6", "#F97316", "#EAB308"]
  return {
    id: i,
    x,
    color: colors[i % colors.length],
    size: 5 + (i % 9),
    width: i % 4 === 0 ? (5 + (i % 9)) * 0.4 : 5 + (i % 9),
    duration: 2.2 + (i % 18) * 0.1,
    delay: (i % 20) * 0.08,
    rotation: (i * 53) % 540 - 270,
    borderRadius: i % 3 === 0 ? "50%" : i % 3 === 1 ? "3px" : "0%",
  }
})

function Confetti() {
  const [show, setShow] = React.useState(false)
  React.useEffect(() => { setShow(true) }, [])
  if (!show) return null

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40" aria-hidden="true">
      {CONFETTI_DATA.map(p => (
        <motion.div
          key={p.id}
          initial={{ y: -40, opacity: 1, rotate: 0 }}
          animate={{
            y: "110vh",
            rotate: p.rotation,
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: [0.1, 0.25, 0.7, 1],
            opacity: { times: [0, 0.5, 0.8, 1] },
          }}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            width: p.width,
            height: p.size,
            backgroundColor: p.color,
            borderRadius: p.borderRadius,
          }}
        />
      ))}
    </div>
  )
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ step, total }: { step: number; total: number }) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-white/5">
      <motion.div
        className="h-full"
        style={{
          background: "linear-gradient(90deg, #6366F1 0%, #7C3AED 50%, #F59E0B 100%)",
        }}
        initial={{ width: "0%" }}
        animate={{ width: `${((step + 1) / total) * 100}%` }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      />
    </div>
  )
}

// ─── Background ───────────────────────────────────────────────────────────────

function Background() {
  return (
    <div className="fixed inset-0 pointer-events-none" aria-hidden="true">
      <div
        className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[140%] h-[70%] rounded-[50%] opacity-[0.14]"
        style={{
          background:
            "radial-gradient(ellipse at center top, #312E81 0%, #4338CA 25%, #6366F1 50%, #7C3AED 70%, transparent 100%)",
          filter: "blur(80px)",
        }}
      />
      <div
        className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] opacity-10"
        style={{
          background:
            "radial-gradient(ellipse at bottom right, #F59E0B, #D97706 40%, transparent 75%)",
          filter: "blur(100px)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(99,102,241,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99,102,241,0.05) 1px, transparent 1px)
          `,
          backgroundSize: "60px 60px",
        }}
      />
    </div>
  )
}

// ─── Step transition variants ─────────────────────────────────────────────────

const stepVariants = {
  enter: (dir: number) => ({
    x: dir > 0 ? 52 : -52,
    opacity: 0,
    scale: 0.97,
  }),
  center: { x: 0, opacity: 1, scale: 1 },
  exit: (dir: number) => ({
    x: dir > 0 ? -52 : 52,
    opacity: 0,
    scale: 0.97,
  }),
}

const stepTransition = { duration: 0.38, ease: [0.23, 1, 0.32, 1] as [number, number, number, number] }

// ─── Shared field styles ──────────────────────────────────────────────────────

const fieldLabel =
  "text-xs font-heading font-semibold text-text-secondary-dark uppercase tracking-wider"

const inputBase =
  "w-full h-11 px-4 rounded-xl bg-surface-dark border border-border-dark text-text-primary-dark text-sm placeholder:text-text-muted-dark transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 hover:border-guild-500/30"

// ─── Step 1: Create Your Adventurer ──────────────────────────────────────────

function AdventurerStep({
  data,
  onChange,
  onNext,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
}) {
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChange({ photoFile: file, photoPreview: URL.createObjectURL(file) })
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-heading font-semibold tracking-widest text-guild-400 uppercase mb-1">
          Step 1 of 5
        </p>
        <h2 className="font-heading font-bold text-2xl text-white mb-1">
          Create Your Adventurer
        </h2>
        <p className="text-sm text-text-muted-dark">
          This is your identity in the guild. Make it count.
        </p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative group w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-guild-500/40 hover:border-guild-500 bg-surface-dark transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500"
          aria-label="Upload profile photo"
        >
          {data.photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.photoPreview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-1 h-full text-text-muted-dark group-hover:text-guild-400 transition-colors duration-200">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
              </svg>
              <span className="text-[11px] font-heading font-medium">Add Photo</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </div>
        </button>
        <p className="text-[11px] text-text-muted-dark">Optional · JPG or PNG</p>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={handleFile}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>

      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="display-name" className={fieldLabel}>
          Adventurer Name
        </label>
        <input
          id="display-name"
          type="text"
          value={data.displayName}
          onChange={e => onChange({ displayName: e.target.value })}
          placeholder="How the guild will know you"
          maxLength={40}
          autoComplete="off"
          autoFocus
          className={inputBase}
        />
      </div>

      {/* Bio */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="bio" className={fieldLabel}>
          Battle Cry{" "}
          <span className="text-text-muted-dark font-normal normal-case tracking-normal">
            — optional
          </span>
        </label>
        <textarea
          id="bio"
          value={data.bio}
          onChange={e => onChange({ bio: e.target.value })}
          placeholder="A short line about who you are and what you bring to every quest…"
          maxLength={160}
          rows={3}
          className={cn(
            inputBase,
            "h-auto py-3 resize-none leading-relaxed"
          )}
        />
        <p className="text-[11px] text-text-muted-dark text-right">{data.bio.length}/160</p>
      </div>

      <Button
        onClick={onNext}
        disabled={data.displayName.trim().length < 2}
        size="lg"
        className="w-full"
      >
        Continue →
      </Button>
    </div>
  )
}

// ─── Step 2: Location ─────────────────────────────────────────────────────────

function LocationStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-heading font-semibold tracking-widest text-guild-400 uppercase mb-1">
          Step 2 of 5
        </p>
        <h2 className="font-heading font-bold text-2xl text-white mb-1">
          Where Do You Operate?
        </h2>
        <p className="text-sm text-text-muted-dark">
          Pick your home district. You can still take quests anywhere.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 max-h-[40vh] sm:max-h-[360px] overflow-y-auto pr-0.5">
        {SG_DISTRICTS.map(district => {
          const selected = data.location === district
          const isIslandwide = district === "Island-wide"
          return (
            <button
              key={district}
              type="button"
              onClick={() => onChange({ location: district })}
              className={cn(
                "relative px-3 py-3 rounded-xl border text-sm font-heading font-medium text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500",
                isIslandwide && "col-span-2 sm:col-span-3 text-center",
                selected
                  ? "border-guild-500 bg-guild-500/10 text-white shadow-[0_0_16px_rgba(99,102,241,0.18)]"
                  : "border-border-dark bg-surface-dark text-text-secondary-dark hover:border-guild-500/40 hover:text-white hover:bg-surface-dark-hover"
              )}
            >
              {selected && (
                <motion.span
                  layoutId="district-check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-guild-500 flex items-center justify-center"
                >
                  <svg width="10" height="8" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                    <path d="M1.5 5l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
              {district}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" className="flex-1" disabled={!data.location} onClick={onNext}>
          Continue →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Skills ───────────────────────────────────────────────────────────

function SkillsStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const toggle = (key: string) => {
    const next = data.skills.includes(key)
      ? data.skills.filter(s => s !== key)
      : [...data.skills, key]
    onChange({ skills: next })
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xs font-heading font-semibold tracking-widest text-guild-400 uppercase mb-1">
          Step 3 of 5
        </p>
        <h2 className="font-heading font-bold text-2xl text-white mb-1">
          Your Skills &amp; Crafts
        </h2>
        <p className="text-sm text-text-muted-dark">
          Select everything you can bring to a quest.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        {Object.entries(QUEST_CATEGORIES).map(([key, cat]) => {
          const selected = data.skills.includes(key)
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={cn(
                "relative flex items-center gap-3 px-4 py-3.5 rounded-xl border text-sm font-heading font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500",
                selected
                  ? "text-white"
                  : "border-border-dark bg-surface-dark text-text-secondary-dark hover:border-guild-500/40 hover:text-white hover:bg-surface-dark-hover"
              )}
              style={
                selected
                  ? {
                      borderColor: cat.color,
                      backgroundColor: `${cat.color}18`,
                      boxShadow: `0 0 14px ${cat.color}22`,
                    }
                  : undefined
              }
            >
              <span className="text-xl leading-none shrink-0" aria-hidden="true">
                {cat.icon}
              </span>
              <span className="flex-1 text-left">{cat.label}</span>
              {selected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                  style={{ backgroundColor: cat.color }}
                >
                  <svg width="10" height="8" viewBox="0 0 12 10" fill="none" aria-hidden="true">
                    <path d="M1.5 5l3 3 6-6" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.span>
              )}
            </button>
          )
        })}
      </div>

      <AnimatePresence>
        {data.skills.length > 0 && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="text-xs text-guild-400 text-center"
          >
            {data.skills.length} skill{data.skills.length !== 1 ? "s" : ""} selected
          </motion.p>
        )}
      </AnimatePresence>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button
          size="lg"
          className="flex-1"
          disabled={data.skills.length === 0}
          onClick={onNext}
        >
          Continue →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 4: Experience ───────────────────────────────────────────────────────

function ToggleQuestion({
  question,
  hint,
  value,
  onChange,
}: {
  question: string
  hint?: string
  value: boolean | null
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <div>
        <p className="text-sm font-heading font-semibold text-text-primary-dark">{question}</p>
        {hint && <p className="text-xs text-text-muted-dark mt-0.5">{hint}</p>}
      </div>
      <div className="flex gap-2">
        {([true, false] as const).map(opt => (
          <button
            key={String(opt)}
            type="button"
            onClick={() => onChange(opt)}
            className={cn(
              "flex-1 h-11 rounded-xl border text-sm font-heading font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500",
              value === opt
                ? opt
                  ? "border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                  : "border-slate-500/60 bg-slate-500/10 text-slate-400"
                : "border-border-dark bg-surface-dark text-text-muted-dark hover:border-guild-500/40 hover:text-white hover:bg-surface-dark-hover"
            )}
          >
            {opt ? "Yes" : "No"}
          </button>
        ))}
      </div>
    </div>
  )
}

function ExperienceStep({
  data,
  onChange,
  onNext,
  onBack,
}: {
  data: OnboardingData
  onChange: (u: Partial<OnboardingData>) => void
  onNext: () => void
  onBack: () => void
}) {
  const allAnswered =
    data.hasDoneGigWork !== null &&
    data.hasCertifications !== null &&
    data.hasOwnTools !== null

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-heading font-semibold tracking-widest text-guild-400 uppercase mb-1">
          Step 4 of 5
        </p>
        <h2 className="font-heading font-bold text-2xl text-white mb-1">
          Experience Check
        </h2>
        <p className="text-sm text-text-muted-dark">
          Three quick questions to place you at the right rank.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        <ToggleQuestion
          question="Have you done gig or freelance work before?"
          hint="Delivery, events, tutoring, odd jobs — anything counts."
          value={data.hasDoneGigWork}
          onChange={v => onChange({ hasDoneGigWork: v })}
        />
        <div className="h-px bg-border-dark" />
        <ToggleQuestion
          question="Do you hold any certifications or formal training?"
          hint="Industry certs, courses, apprenticeships — any field."
          value={data.hasCertifications}
          onChange={v => onChange({ hasCertifications: v })}
        />
        <div className="h-px bg-border-dark" />
        <ToggleQuestion
          question="Do you have your own tools or equipment?"
          hint="Camera, laptop, vehicle, cleaning supplies, etc."
          value={data.hasOwnTools}
          onChange={v => onChange({ hasOwnTools: v })}
        />
      </div>

      <div className="flex gap-3">
        <Button variant="secondary" size="lg" className="flex-1" onClick={onBack}>
          ← Back
        </Button>
        <Button size="lg" className="flex-1" disabled={!allAnswered} onClick={onNext}>
          Reveal My Rank →
        </Button>
      </div>
    </div>
  )
}

// ─── Step 5: Rank Reveal ──────────────────────────────────────────────────────

function RankRevealStep({
  rank,
  onComplete,
  submitting,
}: {
  rank: Rank
  onComplete: () => void
  submitting: boolean
}) {
  const info = RANKS[rank]

  return (
    <div className="flex flex-col items-center text-center gap-8 relative z-10">
      <Confetti />

      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
        className="relative flex items-center justify-center"
      >
        {/* Glow ring */}
        <motion.div
          className="absolute rounded-full"
          animate={{
            boxShadow: [
              `0 0 30px ${info.color}50`,
              `0 0 70px ${info.color}80`,
              `0 0 30px ${info.color}50`,
            ],
          }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ width: 160, height: 160, borderRadius: "50%" }}
        />

        {/* Hexagon badge */}
        <div
          className="w-28 h-32 flex items-center justify-center relative z-10"
          style={{
            clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
            background: `linear-gradient(135deg, ${info.color}28, ${info.color}55)`,
            border: `2px solid ${info.color}`,
          }}
        >
          <span
            className="font-heading font-black text-5xl leading-none"
            style={{ color: info.color }}
          >
            {rank}
          </span>
        </div>

        {/* Orbiting particles */}
        {[0, 120, 240].map((angle, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: info.color, top: "50%", left: "50%" }}
            animate={{
              x: [0, 1, 2, 1, 0].map((_, t) =>
                Math.cos(((angle + t * 90) * Math.PI) / 180) * 72
              ),
              y: [0, 1, 2, 1, 0].map((_, t) =>
                Math.sin(((angle + t * 90) * Math.PI) / 180) * 72
              ),
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "linear",
              delay: i * 0.5,
            }}
          />
        ))}
      </motion.div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55, duration: 0.5 }}
        className="flex flex-col items-center gap-2"
      >
        <p className="text-xs font-heading font-semibold tracking-widest text-text-muted-dark uppercase">
          Your Starting Rank
        </p>
        <h2
          className="font-heading font-black text-5xl leading-none"
          style={{ color: info.color }}
        >
          {info.label}
        </h2>
        <p className="text-text-secondary-dark text-sm max-w-[280px] leading-relaxed">
          {info.description}
        </p>
      </motion.div>

      {/* XP chip */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="flex items-center gap-2 px-4 py-2 rounded-full border"
        style={{
          borderColor: "rgba(245,158,11,0.3)",
          backgroundColor: "rgba(245,158,11,0.08)",
        }}
      >
        <span className="text-base leading-none" aria-hidden="true">⚡</span>
        <span className="font-heading font-semibold text-sm text-amber-400">
          0 XP — your legend begins now
        </span>
      </motion.div>

      {rank === "E" && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0, duration: 0.4 }}
          className="text-xs text-emerald-400 flex items-center gap-1.5"
        >
          <span aria-hidden="true">🏆</span>
          Your experience earned you a head start at Rank E
        </motion.p>
      )}

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.5 }}
        className="w-full max-w-sm flex flex-col gap-3"
      >
        <Button onClick={onComplete} size="xl" className="w-full" disabled={submitting}>
          {submitting ? "Setting up your profile…" : "Your Quest Board Awaits →"}
        </Button>
        <p className="text-xs text-text-muted-dark">
          Rise through the ranks by completing quests: F → E → D → C → B → A
        </p>
      </motion.div>
    </div>
  )
}

// ─── Muster logo ──────────────────────────────────────────────────────────────

function MusterLogo() {
  return (
    <a href="/" aria-label="Back to home" className="inline-flex items-center gap-2.5 group">
      <div
        className="w-8 h-9 flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
        style={{
          clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
          background: "linear-gradient(135deg, #6366F1, #7C3AED)",
        }}
        aria-hidden="true"
      >
        <span className="font-heading font-black text-xs text-white">M</span>
      </div>
      <span className="font-heading font-bold text-base text-white tracking-tight">
        Muster<span className="text-guild-400">.club</span>
      </span>
    </a>
  )
}

// ─── Guild loader (shared with auth-guard) ────────────────────────────────────

function GuildLoader() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-14 flex items-center justify-center"
          style={{
            clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
            background: "linear-gradient(135deg, #6366F1, #7C3AED)",
            boxShadow: "0 0 32px rgba(99,102,241,0.4)",
          }}
          aria-hidden="true"
        >
          <span className="font-heading font-black text-base text-white">M</span>
        </div>
        <div className="flex gap-1.5" aria-label="Loading…">
          {[0, 1, 2].map(i => (
            <span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-guild-500"
              style={{ animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <style>{`
          @keyframes pulse {
            0%,100%{opacity:.3;transform:scale(.8)}
            50%{opacity:1;transform:scale(1.1)}
          }
        `}</style>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TOTAL_STEPS = 5

export default function OnboardingPage() {
  const { user, userDoc, loading, refreshUserDoc } = useAuth()
  const router = useRouter()

  const [step, setStep] = React.useState(0)
  const [direction, setDirection] = React.useState(1)
  const [submitting, setSubmitting] = React.useState(false)
  const [assignedRank, setAssignedRank] = React.useState<Rank>("F")

  const [data, setData] = React.useState<OnboardingData>({
    displayName: "",
    bio: "",
    photoFile: null,
    photoPreview: "",
    location: "",
    skills: [],
    hasDoneGigWork: null,
    hasCertifications: null,
    hasOwnTools: null,
  })

  // Pre-fill name from Firebase Auth profile
  React.useEffect(() => {
    if (user?.displayName && !data.displayName) {
      setData(d => ({ ...d, displayName: user.displayName! }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.displayName])

  // Guard: redirect unauthenticated or already-onboarded users
  React.useEffect(() => {
    if (loading) return
    if (!user) {
      router.replace("/auth")
    } else if (userDoc?.isOnboarded) {
      router.replace("/quests")
    }
  }, [loading, user, userDoc, router])

  const update = (u: Partial<OnboardingData>) => setData(d => ({ ...d, ...u }))

  const next = () => {
    setDirection(1)
    setStep(s => s + 1)
  }

  const back = () => {
    setDirection(-1)
    setStep(s => s - 1)
  }

  const handleExperienceNext = () => {
    const yesCount = [data.hasDoneGigWork, data.hasCertifications, data.hasOwnTools].filter(
      Boolean
    ).length
    setAssignedRank(yesCount >= 2 ? "E" : "F")
    next()
  }

  const handleComplete = async () => {
    if (!user) return
    setSubmitting(true)
    try {
      let avatarUrl: string | undefined

      if (data.photoFile) {
        const ext = data.photoFile.name.split(".").pop() ?? "jpg"
        const storageRef = ref(storage, `avatars/${user.uid}.${ext}`)
        await uploadBytes(storageRef, data.photoFile)
        avatarUrl = await getDownloadURL(storageRef)
      }

      await updateDoc(doc(db, "users", user.uid), {
        name: data.displayName.trim(),
        ...(data.bio.trim() ? { bio: data.bio.trim() } : {}),
        ...(avatarUrl ? { avatarUrl } : {}),
        location: data.location,
        skills: data.skills,
        rank: assignedRank,
        isOnboarded: true,
        updatedAt: serverTimestamp(),
      })

      await refreshUserDoc()
      router.replace("/quests")
    } catch (err) {
      console.error("Onboarding save failed:", err)
      setSubmitting(false)
    }
  }

  // Show loader while auth resolves or while redirecting
  if (loading || !user || userDoc?.isOnboarded) {
    return <GuildLoader />
  }

  const isReveal = step === TOTAL_STEPS - 1

  return (
    <main
      className="min-h-screen bg-bg-dark flex flex-col relative overflow-hidden"
      aria-label="Onboarding"
    >
      <Background />
      <ProgressBar step={step} total={TOTAL_STEPS} />

      {/* Top bar */}
      {!isReveal && (
        <div className="relative z-10 flex items-center justify-between px-4 sm:px-6 pt-6 pb-2 max-w-lg mx-auto w-full">
          <MusterLogo />
          <span className="text-xs font-heading text-text-muted-dark tabular-nums">
            {step + 1} / {TOTAL_STEPS}
          </span>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          "relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6",
          isReveal ? "pt-20 pb-safe-offset-8" : "py-6 pb-safe"
        )}
      >
        <div className={cn("w-full", isReveal ? "max-w-sm" : "max-w-lg")}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={stepTransition}
            >
              {step === 0 && (
                <div className="rounded-2xl bg-surface-dark border border-border-dark p-6 sm:p-8">
                  <AdventurerStep data={data} onChange={update} onNext={next} />
                </div>
              )}
              {step === 1 && (
                <div className="rounded-2xl bg-surface-dark border border-border-dark p-6 sm:p-8">
                  <LocationStep data={data} onChange={update} onNext={next} onBack={back} />
                </div>
              )}
              {step === 2 && (
                <div className="rounded-2xl bg-surface-dark border border-border-dark p-6 sm:p-8">
                  <SkillsStep data={data} onChange={update} onNext={next} onBack={back} />
                </div>
              )}
              {step === 3 && (
                <div className="rounded-2xl bg-surface-dark border border-border-dark p-6 sm:p-8">
                  <ExperienceStep
                    data={data}
                    onChange={update}
                    onNext={handleExperienceNext}
                    onBack={back}
                  />
                </div>
              )}
              {step === 4 && (
                <RankRevealStep
                  rank={assignedRank}
                  onComplete={handleComplete}
                  submitting={submitting}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </main>
  )
}
