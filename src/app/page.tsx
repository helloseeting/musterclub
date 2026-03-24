"use client"

import * as React from "react"
import {
  motion,
  useInView,
  useScroll,
  useTransform,
} from "framer-motion"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/navbar"
import { QuestCard, type QuestCardData } from "@/components/quest-card"
import { RANKS, type RankKey } from "@/lib/constants"

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
    id: "3",
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
]

// ─────────────────────────────────────────────
// HYDRATION GUARD — prevents opacity:0 in SSR HTML
// ─────────────────────────────────────────────

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return hydrated
}

// ─────────────────────────────────────────────
// SCROLL FADE WRAPPER
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
  const hydrated = useHydrated()
  const inView = useInView(ref, { once: true, margin: "-80px" })

  // SSR: initial=false → renders at animate state (visible)
  // Client: once hydrated, elements start hidden and fade in on scroll
  return (
    <motion.div
      ref={ref}
      initial={hydrated ? { opacity: 0, y: 32 } : false}
      animate={
        !hydrated || inView
          ? { opacity: 1, y: 0 }
          : { opacity: 0, y: 32 }
      }
      transition={{ duration: 0.7, delay, ease: [0.23, 1, 0.32, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ─────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────

function HeroSection() {
  const hydrated = useHydrated()
  const { scrollY } = useScroll()
  const bgY = useTransform(scrollY, [0, 700], [0, 140])

  return (
    <section
      className="relative min-h-svh flex items-center overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* ── Gradient plane — the visual anchor ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ y: bgY }}
        aria-hidden="true"
      >
        {/* Indigo aurora — top center */}
        <div
          className="absolute -top-[15%] left-1/2 -translate-x-1/2 w-[120%] h-[75%] rounded-[50%] opacity-25"
          style={{
            background:
              "radial-gradient(ellipse at center top, #312E81 0%, #4338CA 25%, #6366F1 50%, #7C3AED 70%, transparent 100%)",
            filter: "blur(70px)",
          }}
        />
        {/* Warm gold — bottom right */}
        <div
          className="absolute bottom-[-10%] right-[-5%] w-[55%] h-[55%] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, #F59E0B, #D97706 40%, transparent 75%)",
            filter: "blur(100px)",
          }}
        />
        {/* Subtle grid texture */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "72px 72px",
          }}
        />
      </motion.div>

      {/* ── Inner text column ── */}
      <div className="relative z-10 w-full px-6 sm:px-10 lg:px-16 pt-28 pb-20">
        {/* MUSTER — brand signal at poster scale */}
        <div className="overflow-hidden">
          <motion.div
            initial={hydrated ? { opacity: 0, y: 40 } : false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.23, 1, 0.32, 1] }}
            aria-hidden="true"
          >
            <span
              className="block font-heading font-black leading-none tracking-tight select-none"
              style={{
                fontSize: "clamp(5rem, 19vw, 17rem)",
                background:
                  "linear-gradient(135deg, #C7D2FE 0%, #818CF8 30%, #6366F1 55%, #7C3AED 75%, #F59E0B 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              MUSTER
            </span>
          </motion.div>
        </div>

        {/* Headline */}
        <motion.h1
          id="hero-heading"
          className="font-heading text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mt-5 max-w-2xl"
          initial={hydrated ? { opacity: 0, y: 24 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
        >
          Rise through the guild.
          <br />
          Earn real income.
        </motion.h1>

        {/* Supporting sentence */}
        <motion.p
          className="mt-4 text-base sm:text-lg text-text-secondary-dark max-w-lg leading-relaxed"
          initial={hydrated ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          Take gigs across Singapore. Build your rank F→A.{" "}
          <span className="text-white">No résumé needed.</span>
        </motion.p>

        {/* CTA group */}
        <motion.div
          className="mt-8 flex flex-wrap gap-3"
          initial={hydrated ? { opacity: 0, y: 12 } : false}
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

        {/* Region signal */}
        <motion.div
          className="mt-8 flex items-center gap-3"
          initial={hydrated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <div
            className="h-4 w-0.5 rounded-full bg-guild-500"
            aria-hidden="true"
          />
          <span className="text-xs text-text-muted-dark tracking-wide">
            Singapore only · Stealth mode
          </span>
        </motion.div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// GUILD SYSTEM SECTION  (Support)
// ─────────────────────────────────────────────

function GuildSection() {
  const RANK_ENTRIES = Object.entries(RANKS) as [RankKey, (typeof RANKS)[RankKey]][]
  const ACTIVE: RankKey[] = ["F", "E"]

  return (
    <section
      id="guild"
      className="relative px-6 py-20 overflow-hidden bg-bg-dark-secondary"
      aria-labelledby="guild-heading"
    >
      {/* Top divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Background accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 15% 50%, rgba(99,102,241,0.15) 0%, transparent 60%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        {/* Section heading */}
        <FadeUp>
          <span className="text-xs font-semibold uppercase tracking-widest text-guild-400">
            The Guild System
          </span>
          <h2
            id="guild-heading"
            className="font-heading text-4xl sm:text-5xl font-black tracking-tight mt-3"
          >
            Your rank is your reputation.
          </h2>
          <p className="mt-4 text-lg text-text-secondary-dark max-w-xl">
            Complete quests, earn XP, unlock free courses. Every rank
            opens higher-paying gigs — and closes no doors.
          </p>
        </FadeUp>

        {/* Rank progression strip */}
        <FadeUp delay={0.15} className="mt-10">
          <div className="relative">
            {/* Desktop connector line */}
            <div
              className="hidden sm:block absolute top-8 left-8 right-8 h-px"
              style={{
                background:
                  "linear-gradient(90deg, rgba(99,102,241,0.4), rgba(245,158,11,0.4))",
              }}
              aria-hidden="true"
            />

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-y-10 gap-x-2 relative">
              {RANK_ENTRIES.map(([rankKey, rankData]) => {
                const isActive = ACTIVE.includes(rankKey)
                return (
                  <div
                    key={rankKey}
                    className="flex flex-col items-center gap-2.5 text-center"
                    style={{ opacity: isActive ? 1 : 0.32 }}
                  >
                    {/* Rank circle */}
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center font-heading font-black text-2xl border-2 relative z-10 transition-all duration-300"
                      style={{
                        background: isActive ? rankData.bgColor : "#1A1726",
                        borderColor: isActive ? rankData.color : "#2D2841",
                        color: rankData.color,
                        boxShadow: isActive
                          ? `0 0 24px ${rankData.color}35, 0 0 0 4px ${rankData.color}10`
                          : "none",
                      }}
                    >
                      {rankKey}
                    </div>

                    {/* Rank label */}
                    <div className="flex flex-col gap-0.5">
                      <span
                        className="text-xs font-bold uppercase tracking-wide"
                        style={{ color: isActive ? rankData.color : "#6B6784" }}
                      >
                        {rankData.label}
                      </span>
                      <span className="text-[11px] text-text-muted-dark leading-tight">
                        {isActive
                          ? rankData.minXP === 0
                            ? "Start here"
                            : `${rankData.minXP.toLocaleString()} XP`
                          : "Coming soon"}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </FadeUp>

        {/* XP progress bar */}
        <FadeUp delay={0.28} className="mt-10">
          <div className="h-[3px] w-full rounded-full bg-bg-dark-secondary overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{
                background: "linear-gradient(90deg, #6366F1, #7C3AED, #F59E0B)",
              }}
              initial={{ width: "0%" }}
              whileInView={{ width: "16.67%" }}
              viewport={{ once: true }}
              transition={{ duration: 1.3, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {Object.keys(RANKS).map((r) => (
              <span
                key={r}
                className="text-[10px] font-heading font-bold text-text-muted-dark"
              >
                {r}
              </span>
            ))}
          </div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// QUEST BOARD SECTION  (Detail)
// ─────────────────────────────────────────────

function QuestBoardSection() {
  return (
    <section
      id="quests"
      className="relative px-6 py-20 overflow-hidden"
      aria-labelledby="quests-heading"
    >
      {/* Top divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(245,158,11,0.2), transparent)",
        }}
        aria-hidden="true"
      />

      {/* Background accent */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at 80% 40%, rgba(245,158,11,0.10) 0%, transparent 55%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-5xl">
        {/* Section heading */}
        <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-12">
          <div>
            <span className="text-xs font-semibold uppercase tracking-widest text-gold-400">
              Open Quests
            </span>
            <h2
              id="quests-heading"
              className="font-heading text-4xl sm:text-5xl font-black tracking-tight mt-3"
            >
              The Quest Board.
            </h2>
            <p className="mt-3 text-text-secondary-dark max-w-sm">
              Real gigs. Real pay. New quests posted daily.
            </p>
          </div>
          <Button variant="secondary" size="md" aria-label="View all open quests">
            View All Quests →
          </Button>
        </FadeUp>

        {/* Quest cards — cards ARE the interaction */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_QUESTS.map((quest, i) => (
            <QuestCard key={quest.id} quest={quest} index={i} />
          ))}
        </div>

        {/* How it works — numbered list, no cards */}
        <div id="how-it-works" className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-12 sm:gap-8 relative">
          {/* Desktop connector */}
          <div
            className="hidden sm:block absolute top-5 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px"
            style={{
              background:
                "linear-gradient(90deg, transparent, rgba(99,102,241,0.25), transparent)",
            }}
            aria-hidden="true"
          />

          {[
            {
              n: "01",
              title: "Register & get ranked",
              body: "Create your profile in minutes. The guild places you at your starting rank — every legend begins as a Rookie.",
            },
            {
              n: "02",
              title: "Take quests",
              body: "Browse gigs matched to your rank across Singapore — events, F&B, photography, logistics, and more.",
            },
            {
              n: "03",
              title: "Rank up",
              body: "Complete quests, earn XP, unlock free guild courses. Rise from Rookie to Master.",
            },
          ].map((step, i) => (
            <FadeUp key={step.n} delay={i * 0.1}>
              <div className="flex flex-col gap-3">
                <span
                  className="font-heading font-black text-5xl leading-none"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(99,102,241,0.5), rgba(245,158,11,0.25))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {step.n}
                </span>
                <h3 className="font-heading text-lg font-bold text-white">
                  {step.title}
                </h3>
                <p className="text-sm text-text-secondary-dark leading-relaxed">
                  {step.body}
                </p>
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
      className="relative px-6 py-24 overflow-hidden bg-bg-dark-secondary"
      aria-labelledby="cta-heading"
    >
      {/* Gradient plane */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 60%),
            radial-gradient(ellipse at 50% 110%, rgba(245,158,11,0.07) 0%, transparent 50%)
          `,
        }}
        aria-hidden="true"
      />
      {/* Top divider */}
      <div
        className="absolute inset-x-0 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto max-w-2xl text-center">
        <FadeUp>
          <span className="text-xs font-semibold uppercase tracking-widest text-guild-400">
            Begin Your Adventure
          </span>
          <h2
            id="cta-heading"
            className="font-heading text-5xl sm:text-6xl font-black tracking-tight mt-4"
          >
            Your guild awaits.
          </h2>
          <p className="mt-4 text-lg text-text-secondary-dark">
            Free to join. Singapore-based gigs only.
          </p>
          <motion.div
            className="mt-10 inline-block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Button
              variant="primary"
              size="xl"
              className="animate-glow shadow-guild-lg"
              aria-label="Join Muster.club"
            >
              Join the Guild
              <svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.293 1.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L12.586 9H1a1 1 0 110-2h11.586L8.293 2.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </Button>
          </motion.div>
        </FadeUp>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────

function Footer() {
  return (
    <footer
      className="relative border-t border-border-dark px-6 py-8 pb-safe-offset-8"
      role="contentinfo"
    >
      <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-2.5 group"
          aria-label="Muster.club — home"
        >
          <div
            className="w-8 h-9 flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
            style={{
              clipPath:
                "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
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

        {/* Tagline */}
        <p className="text-sm text-text-secondary-dark text-center">
          Guild-based career gig platform. Take quests, rank up, build your career.
        </p>

        {/* Right: region + copyright */}
        <p className="text-sm text-text-muted-dark whitespace-nowrap">
          Built in Singapore{" "}
          <span role="img" aria-label="Singapore flag">
            🇸🇬
          </span>
          {" "}· © 2026 Muster.club
        </p>
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
        <GuildSection />
        <QuestBoardSection />
        <CtaSection />
      </main>
      <Footer />
    </>
  )
}
