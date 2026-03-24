"use client"

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import * as Dialog from "@radix-ui/react-dialog"
import { Sword } from "@phosphor-icons/react"
import { RankBadge } from "@/components/rank-badge"
import { Button } from "@/components/ui/button"
import { RANKS } from "@/lib/constants"
import type { RankKey } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── Confetti particle ────────────────────────────────────────────────────────
interface Particle {
  id: number
  x: number
  delay: number
  duration: number
  color: string
  size: number
  rotate: number
  isCircle: boolean
}

const CONFETTI_COLORS = [
  "#6366F1", // indigo
  "#F59E0B", // gold
  "#7C3AED", // purple
  "#EC4899", // pink
  "#10B981", // emerald
  "#E2E8F0", // platinum
  "#A855F7", // violet
]

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 1.2,
    duration: 2.5 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.floor(Math.random() * 8),
    rotate: Math.random() * 720 - 360,
    isCircle: Math.random() > 0.5,
  }))
}

function ConfettiLayer() {
  const particles = React.useMemo(() => generateParticles(70), [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: "-10%", x: `${p.x}vw`, opacity: 1, rotate: 0, scale: 1 }}
          animate={{
            y: "110vh",
            opacity: [1, 1, 0.8, 0],
            rotate: p.rotate,
            scale: [1, 1.1, 0.9],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: "easeIn",
            repeat: Infinity,
            repeatDelay: Math.random() * 2,
          }}
          className={cn("absolute top-0", p.isCircle ? "rounded-full" : "rounded-sm")}
          style={{
            width: p.size,
            height: p.isCircle ? p.size : p.size * 0.6,
            backgroundColor: p.color,
            left: `${p.x}%`,
          }}
        />
      ))}
    </div>
  )
}

// ─── Rank glow pulse ──────────────────────────────────────────────────────────
function RankGlow({ rank }: { rank: RankKey }) {
  const rankData = RANKS[rank]
  return (
    <motion.div
      className="absolute inset-0 rounded-full pointer-events-none"
      animate={{
        boxShadow: [
          `0 0 30px ${rankData.color}40`,
          `0 0 60px ${rankData.color}70`,
          `0 0 30px ${rankData.color}40`,
        ],
      }}
      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
    />
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface RankUpModalProps {
  open: boolean
  oldRank: RankKey
  newRank: RankKey
  newXP: number
  onDismiss: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export function RankUpModal({ open, oldRank, newRank, newXP, onDismiss }: RankUpModalProps) {
  const oldRankData = RANKS[oldRank]
  const newRankData = RANKS[newRank]

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onDismiss()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
          />
        </Dialog.Overlay>

        <Dialog.Content
          className="fixed inset-0 z-[101] flex items-center justify-center focus:outline-none"
          aria-describedby="rank-up-desc"
        >
          {/* Confetti */}
          <ConfettiLayer />

          {/* Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
            className="relative z-10 w-full max-w-sm mx-6 rounded-3xl border border-white/10 overflow-hidden"
            style={{
              background: `linear-gradient(145deg, #0F0F23 0%, ${newRankData.bgColor} 100%)`,
            }}
          >
            {/* Inner glow top bar */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${newRankData.color}, transparent)`,
              }}
            />

            <div className="px-5 py-8 sm:px-8 sm:py-10 flex flex-col items-center text-center gap-5 sm:gap-6">
              {/* Rank title */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <p className="text-xs font-heading font-semibold tracking-widest uppercase text-text-muted-dark mb-1">
                  Rank Up!
                </p>
                <Dialog.Title className="font-heading text-2xl font-black text-white">
                  You&apos;ve ascended!
                </Dialog.Title>
              </motion.div>

              {/* Rank transition animation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 15 }}
                className="flex items-center gap-3 sm:gap-5"
              >
                {/* Old rank — shrinking/fading */}
                <motion.div
                  initial={{ scale: 1, opacity: 1 }}
                  animate={{ scale: 0.7, opacity: 0.4 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                >
                  <RankBadge rank={oldRank} size="lg" showLabel />
                </motion.div>

                {/* Arrow */}
                <motion.div
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                  className="text-text-muted-dark text-2xl"
                  aria-hidden="true"
                >
                  →
                </motion.div>

                {/* New rank — with glow */}
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.7, type: "spring", stiffness: 200, damping: 12 }}
                  className="relative"
                >
                  <RankGlow rank={newRank} />
                  <RankBadge rank={newRank} size="xl" showLabel />
                </motion.div>
              </motion.div>

              {/* New rank description */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-1"
              >
                <p
                  className="font-heading text-lg font-bold"
                  style={{ color: newRankData.color }}
                >
                  {newRankData.label}
                </p>
                <p
                  id="rank-up-desc"
                  className="text-sm text-text-secondary-dark leading-relaxed max-w-[240px]"
                >
                  {newRankData.description}
                </p>
              </motion.div>

              {/* XP total */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="px-5 py-2.5 rounded-full border text-sm font-heading font-semibold"
                style={{
                  borderColor: `${newRankData.color}40`,
                  background: `${newRankData.color}10`,
                  color: newRankData.color,
                }}
              >
                {newXP.toLocaleString()} XP total
              </motion.div>

              {/* Dismiss button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="w-full"
              >
                <Button
                  variant="primary"
                  size="lg"
                  className="w-full"
                  onClick={onDismiss}
                >
                  <Sword weight="bold" size={16} />
                  Continue Your Adventure
                </Button>
              </motion.div>
            </div>

            {/* Inner glow bottom bar */}
            <div
              className="h-1 w-full"
              style={{
                background: `linear-gradient(90deg, transparent, ${newRankData.color}60, transparent)`,
              }}
            />
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
