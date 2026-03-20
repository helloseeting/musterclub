"use client"

import * as React from "react"
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
  AnimatePresence,
} from "framer-motion"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { QuestCard, type QuestCardData } from "@/components/quest-card"
import { RankBadge } from "@/components/rank-badge"
import { RANKS, type RankKey } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────

const SAMPLE_QUESTS: QuestCardData[] = [
  {
    id: "1",
    title: "Event Helper — Orchard Road Night Market",
    category: "Events",
    categoryIcon: "🎪",
    categoryColor: "#EC4899",
    location: "Orchard",
    payMin: 14,
    payMax: 18,
    rank: "F",
    timePosted: "2 hours ago",
    slots: 4,
  },
  {
    id: "2",
    title: "Café Barista — Weekend Shifts",
    category: "F&B",
    categoryIcon: "🍽️",
    categoryColor: "#F97316",
    location: "Tampines",
    payMin: 11,
    payMax: 14,
    rank: "F",
    timePosted: "5 hours ago",
    slots: 2,
  },
  {
    id: "3",
    title: "Photography Assistant — Product Shoot",
    category: "Photography",
    categoryIcon: "📸",
    categoryColor: "#EAB308",
    location: "Marina Bay",
    payMin: 22,
    payMax: 28,
    rank: "E",
    timePosted: "1 day ago",
    slots: 1,
  },
  {
    id: "4",
    title: "Warehouse Packer — Same Day",
    category: "Other",
    categoryIcon: "⚡",
    categoryColor: "#64748B",
    location: "Jurong",
    payMin: 13,
    payMax: 16,
    rank: "F",
    timePosted: "Just now",
    slots: 6,
  },
]

const STEPS = [
  {
    number: "01",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <circle cx="20" cy="14" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="M6 36c0-7.732 6.268-14 14-14s14 6.268 14 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M26 10l2 2 4-4" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Register & Get Ranked",
    description:
      "Create your adventurer profile in minutes. Our guild assessment places you at your starting rank — every legend begins as a Rookie.",
  },
  {
    number: "02",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <rect x="5" y="8" width="30" height="24" rx="4" stroke="currentColor" strokeWidth="2" />
        <path d="M5 15h30" stroke="currentColor" strokeWidth="2" />
        <path d="M13 23h6M13 28h10" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
        <circle cx="29" cy="25" r="4" stroke="#6366F1" strokeWidth="2" />
        <path d="M27.5 25l1 1 2-2" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Take Quests",
    description:
      "Browse physical gigs across Singapore matched to your rank. Event helper, barista, photo assistant — every quest builds your legacy.",
  },
  {
    number: "03",
    icon: (
      <svg viewBox="0 0 40 40" fill="none" className="w-10 h-10" aria-hidden="true">
        <path d="M20 5l3.5 8.5L33 15l-6.5 6.5L28 32l-8-4-8 4 1.5-10.5L7 15l9.5-1.5L20 5z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <circle cx="20" cy="18" r="3" fill="#F59E0B" />
        <path d="M14 35l6-3 6 3" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Rank Up",
    description:
      "Complete quests, earn XP, unlock free courses. Rise from Rookie to Master. Your guild reputation opens doors no résumé can.",
  },
]

const STATS = [
  { value: 500, suffix: "+", label: "Adventurers Registered" },
  { value: 200, suffix: "+", label: "Quests Completed" },
  { value: 50, suffix: "+", label: "Quest Givers" },
]

// ─────────────────────────────────────────────
// ANIMATED COUNTER
// ─────────────────────────────────────────────

function AnimatedCounter({
  value,
  suffix = "",
}: {
  value: number
  suffix?: string
}) {
  const ref = React.useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })
  const motionVal = useMotionValue(0)
  const spring = useSpring(motionVal, { stiffness: 60, damping: 18 })
  const display = useTransform(spring, (v) => Math.round(v).toLocaleString())

  React.useEffect(() => {
    if (inView) motionVal.set(value)
  }, [inView, value, motionVal])

  return (
    <span ref={ref}>
      <motion.span>{display}</motion.span>
      {suffix}
    </span>
  )
}

// ─────────────────────────────────────────────
// FADE UP WRAPPER
// ─────────────────────────────────────────────

function FadeUp({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-60px" })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// HERO SECTION
// ─────────────────────────────────────────────

function HeroSection() {
  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden px-6 pt-24 pb-16"
      aria-labelledby="hero-heading"
    >
      {/* Background radial glows */}
      <div
        className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at center, #6366F1 0%, #7C3AED 40%, transparent 70%)",
          filter: "blur(80px)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 w-[500px] h-[400px] opacity-10"
        style={{
          background: "radial-gradient(ellipse at bottom right, #F59E0B, transparent 70%)",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Floating particles */}
      <Particles />

      <div className="relative z-10 mx-auto max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
        {/* Left copy */}
        <div className="flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-guild-500/30 bg-guild-950/60 px-4 py-1.5 text-xs font-semibold text-guild-300 mb-4">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-guild-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-guild-500" />
              </span>
              Now Live in Singapore
            </span>
          </motion.div>

          <motion.h1
            id="hero-heading"
            className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.0] tracking-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          >
            Your Next Quest{" "}
            <span className="text-guild-gradient">Awaits</span>
          </motion.h1>

          <motion.p
            className="text-lg sm:text-xl text-text-secondary-dark leading-relaxed max-w-lg"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
          >
            Take quests. Rank up. Build your career.{" "}
            <span className="text-white font-medium">Welcome to the guild.</span>
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-3 pt-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Button variant="primary" size="lg" aria-label="Join as Adventurer">
              Join as Adventurer
            </Button>
            <Button variant="secondary" size="lg" aria-label="Post a Quest">
              Post a Quest
            </Button>
          </motion.div>

          <motion.div
            className="flex items-center gap-4 pt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.7 }}
          >
            <div className="flex -space-x-2">
              {["F", "E", "F", "F"].map((rank, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-bg-dark flex items-center justify-center text-xs font-bold"
                  style={{
                    background: i % 2 === 0 ? "#1E293B" : "#422006",
                    color: i % 2 === 0 ? "#94A3B8" : "#CD7F32",
                    zIndex: 4 - i,
                  }}
                  aria-hidden="true"
                >
                  {rank}
                </div>
              ))}
            </div>
            <p className="text-sm text-text-secondary-dark">
              <span className="text-white font-semibold">500+</span> adventurers already questing
            </p>
          </motion.div>
        </div>

        {/* Right — guild emblem SVG */}
        <motion.div
          className="relative flex items-center justify-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.23, 1, 0.32, 1] }}
          aria-hidden="true"
        >
          <GuildEmblem />
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// GUILD EMBLEM SVG
// ─────────────────────────────────────────────

function GuildEmblem() {
  return (
    <div className="relative w-full max-w-[420px] aspect-square flex items-center justify-center">
      {/* Outer glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating outer ring */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full opacity-20"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="200"
          cy="200"
          r="185"
          stroke="url(#ringGrad)"
          strokeWidth="1"
          fill="none"
          strokeDasharray="8 12"
        />
        <defs>
          <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </motion.svg>

      {/* Counter-rotating inner ring */}
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 w-full h-full opacity-15"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <circle
          cx="200"
          cy="200"
          r="155"
          stroke="#818CF8"
          strokeWidth="0.75"
          fill="none"
          strokeDasharray="4 16"
        />
      </motion.svg>

      {/* Main shield */}
      <svg
        viewBox="0 0 280 320"
        className="relative z-10 w-[62%]"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Muster.club guild shield emblem"
      >
        <defs>
          <linearGradient id="shieldFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" />
            <stop offset="100%" stopColor="#0F0D15" />
          </linearGradient>
          <linearGradient id="shieldStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#818CF8" />
            <stop offset="50%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <linearGradient id="letterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A5B4FC" />
            <stop offset="100%" stopColor="#F59E0B" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Shield outer shape */}
        <path
          d="M140 8 L268 52 L268 180 C268 248 210 296 140 312 C70 296 12 248 12 180 L12 52 Z"
          fill="url(#shieldFill)"
          stroke="url(#shieldStroke)"
          strokeWidth="2.5"
          filter="url(#glow)"
        />

        {/* Inner shield bevel */}
        <path
          d="M140 28 L250 65 L250 178 C250 236 200 278 140 292 C80 278 30 236 30 178 L30 65 Z"
          fill="none"
          stroke="rgba(129,140,248,0.2)"
          strokeWidth="1"
        />

        {/* Geometric inner pattern — hexagon */}
        <polygon
          points="140,80 180,102 180,148 140,170 100,148 100,102"
          fill="none"
          stroke="rgba(99,102,241,0.4)"
          strokeWidth="1.5"
        />

        {/* Crossing swords silhouette */}
        <line x1="96" y1="96" x2="184" y2="184" stroke="rgba(129,140,248,0.3)" strokeWidth="2" strokeLinecap="round" />
        <line x1="184" y1="96" x2="96" y2="184" stroke="rgba(129,140,248,0.3)" strokeWidth="2" strokeLinecap="round" />

        {/* Center M lettermark */}
        <text
          x="140"
          y="150"
          textAnchor="middle"
          dominantBaseline="middle"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="900"
          fontSize="72"
          fill="url(#letterGrad)"
          filter="url(#glow)"
        >
          M
        </text>

        {/* Rank stars at bottom */}
        {[100, 124, 140, 156, 180].map((cx, i) => (
          <polygon
            key={i}
            points={`${cx},235 ${cx + 4},243 ${cx + 8},235 ${cx + 2},240 ${cx + 6},240`}
            fill={i === 2 ? "#F59E0B" : "rgba(99,102,241,0.4)"}
          />
        ))}

        {/* Bottom tagline area */}
        <text
          x="140"
          y="278"
          textAnchor="middle"
          fontFamily="'Space Grotesk', sans-serif"
          fontWeight="700"
          fontSize="11"
          fill="rgba(129,140,248,0.6)"
          letterSpacing="3"
        >
          MUSTER.CLUB
        </text>
      </svg>

      {/* Orbiting rank badges */}
      {(["F", "E", "D"] as RankKey[]).map((rank, i) => {
        const angle = (i / 3) * Math.PI * 2 - Math.PI / 2
        const r = 160
        const x = 50 + Math.cos(angle) * (r / 4.2) + "%"
        const y = 50 + Math.sin(angle) * (r / 4.2) + "%"
        return (
          <motion.div
            key={rank}
            className="absolute"
            style={{ left: x, top: y, transform: "translate(-50%, -50%)" }}
            animate={{ y: [0, -6, 0] }}
            transition={{
              duration: 3 + i * 0.7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.5,
            }}
          >
            <RankBadge rank={rank} size="md" showLabel />
          </motion.div>
        )
      })}
    </div>
  )
}

// ─────────────────────────────────────────────
// FLOATING PARTICLES
// ─────────────────────────────────────────────

function Particles() {
  const particles = React.useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 1,
        duration: Math.random() * 6 + 5,
        delay: Math.random() * 4,
        opacity: Math.random() * 0.4 + 0.1,
      })),
    []
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-guild-400"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────
// HOW IT WORKS SECTION
// ─────────────────────────────────────────────

function HowItWorksSection() {
  return (
    <section
      id="how-it-works"
      className="relative px-6 py-28 overflow-hidden"
      aria-labelledby="how-it-works-heading"
    >
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-guild-400 mb-3">
            The Path
          </span>
          <h2
            id="how-it-works-heading"
            className="font-heading text-4xl sm:text-5xl font-black tracking-tight"
          >
            Three Steps to Glory
          </h2>
          <p className="mt-4 text-lg text-text-secondary-dark max-w-lg mx-auto">
            From sign-up to ranked adventurer in less time than it takes to update your résumé.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {/* Connector line (desktop) */}
          <div
            className="hidden md:block absolute top-12 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(245,158,11,0.4), transparent)",
            }}
            aria-hidden="true"
          />

          {STEPS.map((step, i) => (
            <FadeUp key={step.number} delay={i * 0.12}>
              <div className="relative group rounded-2xl border border-border-dark bg-surface-dark p-7 flex flex-col gap-4 card-hover h-full">
                {/* Step number */}
                <div className="flex items-start justify-between">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-text-secondary-dark"
                    style={{
                      background: "rgba(99,102,241,0.08)",
                      border: "1px solid rgba(99,102,241,0.2)",
                    }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="font-heading font-black text-4xl"
                    style={{
                      background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(245,158,11,0.15))",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                    }}
                  >
                    {step.number}
                  </span>
                </div>
                <h3 className="font-heading text-xl font-bold text-white">{step.title}</h3>
                <p className="text-sm text-text-secondary-dark leading-relaxed flex-1">
                  {step.description}
                </p>

                {/* Bottom accent line */}
                <div
                  className="h-0.5 w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{
                    background: "linear-gradient(90deg, #6366F1, #F59E0B)",
                  }}
                  aria-hidden="true"
                />
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// QUEST PREVIEW SECTION
// ─────────────────────────────────────────────

function QuestPreviewSection() {
  return (
    <section
      id="quests"
      className="relative px-6 py-28 overflow-hidden"
      aria-labelledby="quests-heading"
    >
      {/* Background accent */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        style={{
          background:
            "radial-gradient(ellipse at 30% 50%, #6366F1, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-7xl relative">
        <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="inline-block text-xs font-semibold uppercase tracking-widest text-guild-400 mb-3">
              Open Quests
            </span>
            <h2
              id="quests-heading"
              className="font-heading text-4xl sm:text-5xl font-black tracking-tight"
            >
              Latest Quests
            </h2>
            <p className="mt-3 text-text-secondary-dark max-w-md">
              Real gigs, real pay. Singapore-wide. New quests posted daily.
            </p>
          </div>
          <Button variant="secondary" size="md" aria-label="View all open quests">
            View Quest Board →
          </Button>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SAMPLE_QUESTS.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// RANK SYSTEM SECTION
// ─────────────────────────────────────────────

function RankSystemSection() {
  const ACTIVE_RANKS: RankKey[] = ["F", "E"]

  return (
    <section
      id="ranks"
      className="relative px-6 py-28 overflow-hidden"
      aria-labelledby="ranks-heading"
    >
      <div className="mx-auto max-w-7xl">
        <FadeUp className="text-center mb-16">
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-gold-400 mb-3">
            The Hierarchy
          </span>
          <h2
            id="ranks-heading"
            className="font-heading text-4xl sm:text-5xl font-black tracking-tight"
          >
            Rise Through the Ranks
          </h2>
          <p className="mt-4 text-lg text-text-secondary-dark max-w-lg mx-auto">
            Every completed quest brings you closer to Master. Your rank is your reputation.
          </p>
        </FadeUp>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {(Object.entries(RANKS) as [RankKey, typeof RANKS[RankKey]][]).map(
            ([rankKey, rankData], i) => {
              const isActive = ACTIVE_RANKS.includes(rankKey)
              return (
                <FadeUp key={rankKey} delay={i * 0.07}>
                  <div
                    className={cn(
                      "card-hover group relative rounded-2xl border p-5 flex flex-col items-center gap-3 text-center transition-all duration-300 cursor-default",
                      isActive
                        ? "border-border-dark bg-surface-dark"
                        : "border-border-dark/40 bg-surface-dark/40 opacity-60"
                    )}
                    style={
                      isActive
                        ? {
                            boxShadow: `0 0 0 1px ${rankData.color}22, 0 4px 24px -4px ${rankData.color}15`,
                          }
                        : {}
                    }
                  >
                    {!isActive && (
                      <div className="absolute top-2.5 right-2.5">
                        <span className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-surface-dark-hover text-text-muted-dark border border-border-dark">
                          Soon
                        </span>
                      </div>
                    )}

                    <RankBadge rank={rankKey} size="lg" />

                    <div className="flex flex-col gap-1">
                      <h3
                        className="font-heading font-bold text-sm"
                        style={{ color: rankData.color }}
                      >
                        Rank {rankKey}
                      </h3>
                      <p className="font-heading font-semibold text-xs text-white">
                        {rankData.label}
                      </p>
                      <p className="text-xs text-text-muted-dark leading-snug mt-1">
                        {rankData.description}
                      </p>
                    </div>

                    {isActive && (
                      <div className="text-[10px] text-text-muted-dark border border-border-dark rounded-full px-2 py-0.5">
                        {rankData.minXP === 0
                          ? "Starting rank"
                          : `${rankData.minXP.toLocaleString()} XP`}
                      </div>
                    )}
                  </div>
                </FadeUp>
              )
            }
          )}
        </div>

        {/* XP progression bar */}
        <FadeUp delay={0.3} className="mt-10">
          <div className="rounded-2xl border border-border-dark bg-surface-dark p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-text-secondary-dark">
                Guild Progression Path
              </span>
              <span className="text-xs text-text-muted-dark">F → A</span>
            </div>
            <div className="relative h-2.5 rounded-full bg-bg-dark overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "linear-gradient(90deg, #6366F1, #7C3AED, #F59E0B)",
                }}
                initial={{ width: "0%" }}
                whileInView={{ width: "16.67%" }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: 0.5, ease: [0.23, 1, 0.32, 1] }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {Object.keys(RANKS).map((r) => (
                <span key={r} className="text-xs text-text-muted-dark font-heading font-bold">
                  {r}
                </span>
              ))}
            </div>
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────

function StatsSection() {
  return (
    <section
      className="relative px-6 py-24 overflow-hidden"
      aria-labelledby="stats-heading"
    >
      {/* Divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        <FadeUp className="text-center mb-14">
          <h2
            id="stats-heading"
            className="font-heading text-4xl sm:text-5xl font-black tracking-tight"
          >
            Join the Guild
          </h2>
          <p className="mt-3 text-text-secondary-dark">
            Adventurers across Singapore are already on their journey.
          </p>
        </FadeUp>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {STATS.map((stat, i) => (
            <FadeUp key={stat.label} delay={i * 0.1}>
              <div className="rounded-2xl border border-border-dark bg-surface-dark p-8 text-center card-hover">
                <div
                  className="font-heading text-5xl font-black mb-2"
                  style={{
                    background: "linear-gradient(135deg, #818CF8, #F59E0B)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="text-sm text-text-secondary-dark font-medium">{stat.label}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FINAL CTA SECTION
// ─────────────────────────────────────────────

function CtaSection() {
  return (
    <section
      className="relative px-6 py-32 overflow-hidden"
      aria-labelledby="cta-heading"
    >
      {/* Background gradient */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 60%, rgba(99,102,241,0.12) 0%, transparent 65%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 50% 40%, rgba(124,58,237,0.08) 0%, transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-3xl text-center relative z-10">
        <FadeUp>
          <span className="inline-block text-xs font-semibold uppercase tracking-widest text-guild-400 mb-5">
            Begin Your Adventure
          </span>
          <h2
            id="cta-heading"
            className="font-heading text-5xl sm:text-6xl font-black tracking-tight mb-6"
          >
            Ready to Begin Your{" "}
            <span className="text-guild-gradient">Adventure?</span>
          </h2>
          <p className="text-lg text-text-secondary-dark mb-10 max-w-xl mx-auto">
            Join hundreds of adventurers already building their careers through the guild.
            Your first quest is one click away.
          </p>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <Button
              variant="primary"
              size="xl"
              className="animate-glow shadow-guild-lg"
              aria-label="Start your adventure and join Muster.club"
            >
              Start Your Adventure
              <svg
                className="w-5 h-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </motion.div>

          <p className="mt-6 text-sm text-text-muted-dark">
            Free to join · No commitment · Singapore-based gigs only
          </p>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function Footer() {
  const footerLinks = {
    Platform: ["About", "How It Works", "Quest Board", "Post a Quest"],
    Adventurers: ["Join the Guild", "Rank System", "Free Courses", "Leaderboard"],
    "Quest Givers": ["List a Quest", "Pricing", "Trust & Safety", "FAQ"],
  } as const

  return (
    <footer className="relative border-t border-border-dark px-6 pt-16 pb-10" role="contentinfo">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand col */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <a href="#" className="flex items-center gap-2.5 group w-fit" aria-label="Muster.club">
              <div
                className="w-8 h-9 flex items-center justify-center"
                style={{
                  clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
                  background: "linear-gradient(135deg, #6366F1, #7C3AED)",
                }}
                aria-hidden="true"
              >
                <span className="font-heading font-black text-xs text-white">M</span>
              </div>
              <span className="font-heading font-bold text-lg text-white">
                Muster<span className="text-guild-400">.club</span>
              </span>
            </a>
            <p className="text-sm text-text-secondary-dark max-w-xs leading-relaxed">
              Guild-based career gig platform. Take quests, rank up, build your career.
            </p>
            <p className="text-sm text-text-muted-dark">
              Built in Singapore{" "}
              <span role="img" aria-label="Singapore flag">
                🇸🇬
              </span>
            </p>
            {/* Social links */}
            <div className="flex gap-3 mt-1" aria-label="Social media links">
              {[
                { label: "Twitter / X", path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" },
                { label: "LinkedIn", path: "M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z M4 6a2 2 0 100-4 2 2 0 000 4z" },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-dark text-text-muted-dark hover:text-white hover:border-guild-500/50 hover:bg-surface-dark-hover transition-all"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor" aria-hidden="true">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {(Object.entries(footerLinks) as [string, readonly string[]][]).map(([col, links]) => (
            <div key={col}>
              <h3 className="font-heading font-semibold text-sm text-white mb-4">{col}</h3>
              <ul className="flex flex-col gap-2.5" role="list">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-text-secondary-dark hover:text-white transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-border-dark pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted-dark">
          <p>© 2026 Muster.club. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <QuestPreviewSection />
        <RankSystemSection />
        <StatsSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
