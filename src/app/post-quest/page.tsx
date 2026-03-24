"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { addDoc, collection, serverTimestamp, Timestamp } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { db, storage } from "@/lib/firebase"
import { AuthGuard } from "@/components/auth-guard"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RankBadge } from "@/components/rank-badge"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"
import { QUEST_CATEGORIES, SG_DISTRICTS, RANKS } from "@/lib/constants"
import type { RankKey } from "@/lib/constants"
import type { QuestCategory } from "@/lib/firestore-schema"
import { cn } from "@/lib/utils"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  MapPin,
  Coins,
  Users,
  Upload,
  X,
  Plus,
  Eye,
  Briefcase,
  Camera,
  Scroll,
} from "@phosphor-icons/react"

// ─── Types ────────────────────────────────────────────────────────────────────

type PayType = "fixed" | "hourly" | "daily"

interface FormState {
  title: string
  description: string
  category: QuestCategory | ""
  location: string
  address: string
  isRemote: boolean
  dateStart: string
  dateEnd: string
  duration: string
  payType: PayType
  payMin: string
  payMax: string
  rankRequired: RankKey
  slotsTotal: string
  skills: string[]
  requirements: string
  imageFile: File | null
}

const INITIAL_FORM: FormState = {
  title: "",
  description: "",
  category: "",
  location: "",
  address: "",
  isRemote: false,
  dateStart: "",
  dateEnd: "",
  duration: "",
  payType: "hourly",
  payMin: "",
  payMax: "",
  rankRequired: "F",
  slotsTotal: "1",
  skills: [],
  requirements: "",
  imageFile: null,
}

const RANK_ORDER: RankKey[] = ["F", "E", "D", "C", "B", "A"]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ step }: { step: 1 | 2 }) {
  const steps = [
    { n: 1, label: "Quest Details" },
    { n: 2, label: "Preview & Post" },
  ]
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s.n}>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-heading font-bold transition-all duration-300",
                step >= s.n
                  ? "bg-guild-500 text-white"
                  : "bg-surface-dark border border-border-dark text-text-muted-dark"
              )}
            >
              {step > s.n ? <Check weight="bold" size={10} /> : s.n}
            </div>
            <span
              className={cn(
                "text-xs font-heading font-semibold transition-colors hidden sm:block",
                step >= s.n ? "text-text-secondary-dark" : "text-text-muted-dark"
              )}
            >
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                "h-px w-8 transition-colors duration-300",
                step > 1 ? "bg-guild-500" : "bg-border-dark"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  )
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function FormSection({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="rounded-2xl border border-border-dark bg-surface-dark overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border-dark">
        <div className="w-7 h-7 rounded-lg bg-guild-500/10 border border-guild-500/20 flex items-center justify-center text-guild-400">
          {icon}
        </div>
        <h2 className="font-heading text-xs font-bold text-text-primary-dark uppercase tracking-widest">
          {title}
        </h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  )
}

// ─── Field helpers ────────────────────────────────────────────────────────────

const inputCls =
  "w-full h-10 px-3 rounded-xl bg-bg-dark border border-border-dark text-sm text-text-primary-dark placeholder:text-text-muted-dark hover:border-guild-500/30 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all duration-200"

function Label({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-heading font-semibold text-text-muted-dark uppercase tracking-wider mb-1.5"
    >
      {children}
    </label>
  )
}

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null
  return <p className="mt-1 text-xs text-red-400">{msg}</p>
}

// ─── Skills tag input ─────────────────────────────────────────────────────────

function SkillsInput({
  skills,
  onChange,
}: {
  skills: string[]
  onChange: (s: string[]) => void
}) {
  const [input, setInput] = React.useState("")

  const add = () => {
    const v = input.trim()
    if (v && !skills.includes(v) && skills.length < 12) {
      onChange([...skills, v])
      setInput("")
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault()
              add()
            }
          }}
          placeholder="Type a skill, press Enter to add"
          className={cn(inputCls, "flex-1")}
        />
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={add}
          disabled={!input.trim() || skills.length >= 12}
          className="shrink-0"
        >
          <Plus weight="bold" size={12} />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-guild-950/60 border border-guild-500/30 text-xs font-heading text-guild-300"
            >
              {skill}
              <button
                type="button"
                onClick={() => onChange(skills.filter((s) => s !== skill))}
                className="text-guild-500 hover:text-white transition-colors"
                aria-label={`Remove ${skill}`}
              >
                <X weight="bold" size={9} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Category grid ────────────────────────────────────────────────────────────

function CategoryGrid({
  value,
  onChange,
}: {
  value: QuestCategory | ""
  onChange: (cat: QuestCategory) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
      {Object.entries(QUEST_CATEGORIES).map(([key, cat]) => {
        const catValue = key.toLowerCase() as QuestCategory
        const selected = value === catValue
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(catValue)}
            className={cn(
              "relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200",
              selected
                ? "border-guild-500/50 bg-guild-950/60"
                : "border-border-dark bg-bg-dark hover:border-guild-500/20 hover:bg-surface-dark"
            )}
          >
            <span className="text-xl leading-none" aria-hidden="true">
              {cat.icon}
            </span>
            <span
              className={cn(
                "text-[11px] font-heading font-semibold leading-tight text-center",
                selected ? "text-guild-300" : "text-text-muted-dark"
              )}
            >
              {cat.label}
            </span>
            {selected && (
              <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-guild-500 flex items-center justify-center">
                <Check weight="bold" size={8} className="text-white" />
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}

// ─── Rank selector ────────────────────────────────────────────────────────────

function RankSelector({
  value,
  onChange,
}: {
  value: RankKey
  onChange: (r: RankKey) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {RANK_ORDER.map((rank) => {
        const rankData = RANKS[rank]
        const selected = value === rank
        return (
          <button
            key={rank}
            type="button"
            onClick={() => onChange(rank)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-xl border transition-all duration-200",
              selected
                ? "border-guild-500/40 bg-guild-950/50"
                : "border-border-dark bg-bg-dark hover:border-guild-500/20"
            )}
          >
            <RankBadge rank={rank} size="sm" />
            <div className="text-left">
              <p
                className={cn(
                  "text-xs font-heading font-bold leading-none",
                  selected ? "text-white" : "text-text-secondary-dark"
                )}
              >
                {rank}
              </p>
              <p className="text-[10px] text-text-muted-dark mt-0.5">{rankData.label}</p>
            </div>
          </button>
        )
      })}
    </div>
  )
}

// ─── Preview card ─────────────────────────────────────────────────────────────

function PreviewQuestCard({
  form,
  questGiverName,
}: {
  form: FormState
  questGiverName: string
}) {
  const catKey = (form.category || "other").toUpperCase() as keyof typeof QUEST_CATEGORIES
  const cat = QUEST_CATEGORIES[catKey] ?? QUEST_CATEGORIES.OTHER
  const rankData = RANKS[form.rankRequired]
  const slots = Math.max(1, parseInt(form.slotsTotal) || 1)
  const payLabel =
    form.payMin && form.payMax
      ? `$${form.payMin}–$${form.payMax}/${form.payType === "hourly" ? "hr" : form.payType === "daily" ? "day" : "fixed"}`
      : form.payMin
        ? `From $${form.payMin}`
        : "Negotiable"

  return (
    <div className="rounded-2xl border border-guild-500/20 bg-surface-dark p-5 flex flex-col gap-4 max-w-sm mx-auto shadow-guild">
      <div className="flex items-start justify-between">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold border"
          style={{
            backgroundColor: `${cat.color}15`,
            borderColor: `${cat.color}35`,
            color: cat.color,
          }}
        >
          <span aria-hidden="true">{cat.icon}</span>
          {cat.label}
        </span>
        <RankBadge rank={form.rankRequired} size="sm" />
      </div>

      <div>
        <h3 className="font-heading text-base font-bold text-white leading-snug line-clamp-2">
          {form.title || "Your Quest Title"}
        </h3>
        <p className="mt-0.5 text-xs text-text-muted-dark">by {questGiverName}</p>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-text-muted-dark">
          <MapPin weight="fill" size={11} />
          {form.location || "Location TBD"}
        </span>
        <span className="flex items-center gap-1 font-semibold text-gold-400">
          <Coins weight="fill" size={11} />
          {payLabel}
        </span>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-border-dark/60">
        <span className="text-[11px] text-text-muted-dark">Just now</span>
        <span
          className="text-[11px] font-heading font-semibold"
          style={{ color: rankData.color }}
        >
          {slots} slot{slots !== 1 ? "s" : ""} open
        </span>
      </div>
    </div>
  )
}

// ─── Main form component ──────────────────────────────────────────────────────

function PostQuestForm() {
  const { user, userDoc } = useAuth()
  const router = useRouter()

  const [step, setStep] = React.useState<1 | 2>(1)
  const [form, setForm] = React.useState<FormState>(INITIAL_FORM)
  const [submitting, setSubmitting] = React.useState(false)
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({})
  const [imagePreview, setImagePreview] = React.useState<string | null>(null)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }))
  }

  const validate = (): boolean => {
    const errs: Partial<Record<keyof FormState, string>> = {}
    if (!form.title.trim()) errs.title = "Quest title is required"
    if (!form.category) errs.category = "Choose a category"
    if (!form.description.trim()) errs.description = "Description is required"
    if (!form.location) errs.location = "Choose a district"
    if (!form.slotsTotal || parseInt(form.slotsTotal) < 1)
      errs.slotsTotal = "At least 1 slot required"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (validate()) setStep(2)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    update("imageFile", file)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!user || !userDoc) return
    setSubmitting(true)
    try {
      let imageUrls: string[] = []
      if (form.imageFile) {
        const storageRef = ref(
          storage,
          `quest-images/${user.uid}/${Date.now()}_${form.imageFile.name}`
        )
        await uploadBytes(storageRef, form.imageFile)
        const url = await getDownloadURL(storageRef)
        imageUrls = [url]
      }

      await addDoc(collection(db, "quests"), {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category as QuestCategory,
        location: form.location,
        ...(form.address.trim() ? { address: form.address.trim() } : {}),
        isRemote: form.isRemote,
        payType: form.payType,
        ...(form.payMin ? { payMin: parseFloat(form.payMin) } : {}),
        ...(form.payMax ? { payMax: parseFloat(form.payMax) } : {}),
        currency: "SGD",
        ...(form.dateStart
          ? { dateStart: Timestamp.fromDate(new Date(form.dateStart)) }
          : {}),
        ...(form.dateEnd
          ? { dateEnd: Timestamp.fromDate(new Date(form.dateEnd)) }
          : {}),
        ...(form.duration.trim() ? { duration: form.duration.trim() } : {}),
        rankRequired: form.rankRequired,
        slotsTotal: parseInt(form.slotsTotal) || 1,
        slotsFilled: 0,
        skills: form.skills,
        ...(form.requirements.trim()
          ? { requirements: form.requirements.trim() }
          : {}),
        source: "direct" as const,
        imageUrls,
        status: "active" as const,
        isFeatured: false,
        questGiverId: user.uid,
        questGiverName: userDoc.name,
        ...(userDoc.avatarUrl ? { questGiverAvatar: userDoc.avatarUrl } : {}),
        questGiverRating: userDoc.averageRating ?? 0,
        applicationCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      router.push("/dashboard")
    } catch (err) {
      console.error("Failed to post quest:", err)
      setSubmitting(false)
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-bg-dark pt-20">
        {/* Page header */}
        <section className="relative overflow-hidden border-b border-border-dark">
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden="true"
            style={{
              background:
                "linear-gradient(to bottom, rgba(99,102,241,0.06) 0%, transparent 100%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl px-4 sm:px-6 py-6 sm:py-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-4 h-0.5 rounded-full bg-guild-500" aria-hidden="true" />
                  <span className="text-xs font-heading font-semibold text-guild-400 uppercase tracking-widest">
                    Quest Board
                  </span>
                </div>
                <h1 className="font-heading text-3xl sm:text-4xl font-black text-white tracking-tight">
                  Post a Quest
                </h1>
                <p className="mt-1.5 text-sm text-text-secondary-dark">
                  Find your guild&rsquo;s finest adventurers.
                </p>
              </div>
              <div className="pt-1 shrink-0">
                <StepIndicator step={step} />
              </div>
            </div>
          </div>
        </section>

        {/* Form body */}
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-8 pb-safe-offset-8">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-5"
              >
                {/* Quest Basics */}
                <FormSection
                  title="Quest Basics"
                  icon={<Scroll weight="bold" size={13} />}
                >
                  <div>
                    <Label htmlFor="quest-title">Quest Title *</Label>
                    <input
                      id="quest-title"
                      type="text"
                      value={form.title}
                      onChange={(e) => update("title", e.target.value)}
                      placeholder="e.g. Event Staff for Corporate Dinner"
                      maxLength={80}
                      className={cn(
                        inputCls,
                        errors.title && "border-red-500/60 focus:ring-red-500"
                      )}
                    />
                    <FieldError msg={errors.title} />
                  </div>

                  <div>
                    <Label>Category *</Label>
                    <CategoryGrid
                      value={form.category}
                      onChange={(cat) => update("category", cat)}
                    />
                    <FieldError msg={errors.category} />
                  </div>

                  <div>
                    <Label htmlFor="quest-desc">Description *</Label>
                    <textarea
                      id="quest-desc"
                      value={form.description}
                      onChange={(e) => update("description", e.target.value)}
                      placeholder="Describe what adventurers will be doing, what to expect, and any important details…"
                      rows={4}
                      maxLength={2000}
                      className={cn(
                        "w-full px-3 py-2.5 rounded-xl bg-bg-dark border border-border-dark text-sm text-text-primary-dark placeholder:text-text-muted-dark hover:border-guild-500/30 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all duration-200 resize-none",
                        errors.description &&
                          "border-red-500/60 focus:ring-red-500"
                      )}
                    />
                    <div className="flex justify-between mt-1">
                      <FieldError msg={errors.description} />
                      <span className="text-xs text-text-muted-dark ml-auto">
                        {form.description.length}/2000
                      </span>
                    </div>
                  </div>
                </FormSection>

                {/* Location & Time */}
                <FormSection
                  title="Location & Time"
                  icon={<MapPin weight="bold" size={13} />}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quest-location">District *</Label>
                      <select
                        id="quest-location"
                        value={form.location}
                        onChange={(e) => update("location", e.target.value)}
                        className={cn(
                          "w-full h-10 px-3 rounded-xl bg-bg-dark border border-border-dark text-sm focus:outline-none focus:ring-2 focus:ring-guild-500 transition-all appearance-none",
                          form.location
                            ? "text-text-primary-dark"
                            : "text-text-muted-dark",
                          errors.location && "border-red-500/60"
                        )}
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%236B6784' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 10px center",
                        }}
                      >
                        <option value="">Select district</option>
                        {SG_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <FieldError msg={errors.location} />
                    </div>

                    <div>
                      <Label htmlFor="quest-address">Address (optional)</Label>
                      <input
                        id="quest-address"
                        type="text"
                        value={form.address}
                        onChange={(e) => update("address", e.target.value)}
                        placeholder="Specific venue or address"
                        className={inputCls}
                      />
                    </div>
                  </div>

                  {/* Remote toggle */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.isRemote}
                    onClick={() => update("isRemote", !form.isRemote)}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl border border-border-dark bg-bg-dark hover:border-guild-500/20 transition-colors text-left"
                  >
                    <div
                      className={cn(
                        "relative flex-shrink-0 w-9 h-5 rounded-full transition-colors duration-200",
                        form.isRemote ? "bg-guild-500" : "bg-surface-dark border border-border-dark"
                      )}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                        style={{ left: form.isRemote ? "calc(100% - 18px)" : "2px" }}
                      />
                    </div>
                    <span className="text-sm text-text-secondary-dark">
                      Remote / work from home
                    </span>
                  </button>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="quest-start">Start Date</Label>
                      <input
                        id="quest-start"
                        type="datetime-local"
                        value={form.dateStart}
                        onChange={(e) => update("dateStart", e.target.value)}
                        className={cn(inputCls, "text-text-secondary-dark")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quest-end">End Date</Label>
                      <input
                        id="quest-end"
                        type="datetime-local"
                        value={form.dateEnd}
                        onChange={(e) => update("dateEnd", e.target.value)}
                        className={cn(inputCls, "text-text-secondary-dark")}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quest-duration">Duration</Label>
                      <input
                        id="quest-duration"
                        type="text"
                        value={form.duration}
                        onChange={(e) => update("duration", e.target.value)}
                        placeholder="e.g. 4 hours"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </FormSection>

                {/* Compensation */}
                <FormSection
                  title="Compensation"
                  icon={<Coins weight="bold" size={13} />}
                >
                  <div>
                    <Label>Pay Type</Label>
                    <div className="flex gap-2">
                      {(["fixed", "hourly", "daily"] as PayType[]).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => update("payType", type)}
                          className={cn(
                            "flex-1 h-10 rounded-xl border text-sm font-heading font-semibold transition-all duration-200 capitalize",
                            form.payType === type
                              ? "border-guild-500/50 bg-guild-950/60 text-guild-300"
                              : "border-border-dark bg-bg-dark text-text-muted-dark hover:border-guild-500/20"
                          )}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="pay-min">
                        Min Pay (SGD
                        {form.payType === "hourly"
                          ? "/hr"
                          : form.payType === "daily"
                            ? "/day"
                            : ""}
                        )
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted-dark pointer-events-none">
                          $
                        </span>
                        <input
                          id="pay-min"
                          type="number"
                          value={form.payMin}
                          onChange={(e) => update("payMin", e.target.value)}
                          placeholder="0"
                          min="0"
                          className={cn(inputCls, "pl-6")}
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="pay-max">Max Pay (SGD)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-text-muted-dark pointer-events-none">
                          $
                        </span>
                        <input
                          id="pay-max"
                          type="number"
                          value={form.payMax}
                          onChange={(e) => update("payMax", e.target.value)}
                          placeholder="0"
                          min="0"
                          className={cn(inputCls, "pl-6")}
                        />
                      </div>
                    </div>
                  </div>
                </FormSection>

                {/* Requirements */}
                <FormSection
                  title="Requirements"
                  icon={<Users weight="bold" size={13} />}
                >
                  <div>
                    <Label>Minimum Rank Required</Label>
                    <RankSelector
                      value={form.rankRequired}
                      onChange={(r) => update("rankRequired", r)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quest-slots">Number of Slots *</Label>
                    <input
                      id="quest-slots"
                      type="number"
                      value={form.slotsTotal}
                      onChange={(e) => update("slotsTotal", e.target.value)}
                      min="1"
                      max="100"
                      className={cn(
                        inputCls,
                        "max-w-[120px]",
                        errors.slotsTotal && "border-red-500/60"
                      )}
                    />
                    <FieldError msg={errors.slotsTotal} />
                  </div>

                  <div>
                    <Label>Skills Needed</Label>
                    <SkillsInput
                      skills={form.skills}
                      onChange={(s) => update("skills", s)}
                    />
                  </div>

                  <div>
                    <Label htmlFor="quest-reqs">Additional Requirements</Label>
                    <textarea
                      id="quest-reqs"
                      value={form.requirements}
                      onChange={(e) => update("requirements", e.target.value)}
                      placeholder="Dress code, documents needed, physical requirements, etc."
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-xl bg-bg-dark border border-border-dark text-sm text-text-primary-dark placeholder:text-text-muted-dark hover:border-guild-500/30 focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50 transition-all duration-200 resize-none"
                    />
                  </div>
                </FormSection>

                {/* Image */}
                <FormSection
                  title="Quest Image (optional)"
                  icon={<Camera weight="bold" size={13} />}
                >
                  {imagePreview ? (
                    <div className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={imagePreview}
                        alt="Quest preview"
                        className="w-full h-44 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          update("imageFile", null)
                          setImagePreview(null)
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-bg-dark/80 backdrop-blur-sm border border-border-dark text-text-muted-dark hover:text-white transition-colors"
                        aria-label="Remove image"
                      >
                        <X weight="bold" size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-border-dark bg-bg-dark hover:border-guild-500/30 hover:bg-surface-dark transition-all cursor-pointer group">
                      <Upload
                        size={20}
                        weight="regular"
                        className="text-text-muted-dark group-hover:text-guild-400 transition-colors mb-2"
                      />
                      <p className="text-sm text-text-muted-dark group-hover:text-text-secondary-dark transition-colors">
                        Upload quest image
                      </p>
                      <p className="text-xs text-text-muted-dark mt-0.5">
                        PNG, JPG up to 10 MB
                      </p>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="sr-only"
                      />
                    </label>
                  )}
                </FormSection>

                <div className="flex justify-end pt-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleNext}
                  >
                    Preview Quest
                    <ArrowRight weight="bold" size={16} />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                className="space-y-5"
              >
                {/* Preview card */}
                <div className="rounded-2xl border border-border-dark bg-surface-dark p-6">
                  <div className="flex items-center gap-2 mb-1">
                    <Eye weight="bold" size={15} className="text-guild-400" />
                    <h2 className="font-heading text-xs font-bold text-text-primary-dark uppercase tracking-widest">
                      Quest Board Preview
                    </h2>
                  </div>
                  <p className="text-sm text-text-muted-dark mb-6">
                    This is how your quest will appear to adventurers.
                  </p>
                  <PreviewQuestCard
                    form={form}
                    questGiverName={userDoc?.name ?? "You"}
                  />
                </div>

                {/* Full details */}
                <div className="rounded-2xl border border-border-dark bg-surface-dark p-6 space-y-5">
                  <h2 className="font-heading text-xs font-bold text-text-primary-dark uppercase tracking-widest">
                    Full Quest Details
                  </h2>

                  <div className="space-y-1">
                    <p className="text-xs font-heading font-semibold text-text-muted-dark uppercase tracking-wider">
                      Description
                    </p>
                    <p className="text-sm text-text-secondary-dark leading-relaxed whitespace-pre-wrap">
                      {form.description}
                    </p>
                  </div>

                  {form.requirements && (
                    <div className="space-y-1">
                      <p className="text-xs font-heading font-semibold text-text-muted-dark uppercase tracking-wider">
                        Requirements
                      </p>
                      <p className="text-sm text-text-secondary-dark leading-relaxed whitespace-pre-wrap">
                        {form.requirements}
                      </p>
                    </div>
                  )}

                  {form.skills.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-heading font-semibold text-text-muted-dark uppercase tracking-wider">
                        Skills
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {form.skills.map((skill) => (
                          <Badge key={skill} variant="default" size="sm">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                    {[
                      {
                        label: "Location",
                        value: form.location || "—",
                      },
                      {
                        label: "Duration",
                        value: form.duration || "—",
                      },
                      {
                        label: "Slots",
                        value: form.slotsTotal || "1",
                      },
                      {
                        label: "Rank min.",
                        value: `${form.rankRequired} — ${RANKS[form.rankRequired].label}`,
                      },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="px-3 py-2.5 rounded-xl bg-bg-dark border border-border-dark"
                      >
                        <p className="text-[10px] text-text-muted-dark uppercase tracking-wider font-heading font-semibold mb-0.5">
                          {label}
                        </p>
                        <p className="text-sm font-medium text-text-primary-dark">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="md"
                    onClick={() => setStep(1)}
                  >
                    <ArrowLeft weight="bold" size={15} />
                    Edit
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="min-w-[160px]"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Posting…
                      </>
                    ) : (
                      <>
                        <Briefcase weight="bold" size={16} />
                        Post Quest
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export default function PostQuestPage() {
  return (
    <AuthGuard>
      <PostQuestForm />
    </AuthGuard>
  )
}
