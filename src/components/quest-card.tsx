"use client"

import * as React from "react"
import { motion } from "framer-motion"

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return hydrated
}
import { MapPin, Clock, Coins } from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { RankBadge } from "@/components/rank-badge"
import { Badge } from "@/components/ui/badge"
import type { RankKey } from "@/lib/constants"

export interface QuestCardData {
  id: string
  title: string
  category: string
  categoryIcon: string
  categoryColor: string
  location: string
  payMin: number
  payMax: number
  rank: RankKey
  timePosted: string
  slots?: number
}

interface QuestCardProps {
  quest: QuestCardData
  className?: string
  index?: number
}

export function QuestCard({ quest, className, index = 0 }: QuestCardProps) {
  const hydrated = useHydrated()
  return (
    <motion.article
      initial={hydrated ? { opacity: 0, y: 24 } : false}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={cn(
        "card-hover group relative flex flex-col gap-4 rounded-2xl border border-border-dark bg-surface-dark p-5 cursor-pointer",
        className
      )}
    >
      {/* Top row: category + rank */}
      <div className="flex items-start justify-between gap-3">
        <Badge
          variant="category"
          size="md"
          className="shrink-0"
          style={{
            backgroundColor: `${quest.categoryColor}15`,
            borderColor: `${quest.categoryColor}35`,
            color: quest.categoryColor,
          }}
        >
          <span aria-hidden="true">{quest.categoryIcon}</span>
          {quest.category}
        </Badge>
        <RankBadge rank={quest.rank} size="sm" />
      </div>

      {/* Title */}
      <h3 className="font-heading text-base font-bold text-text-primary-dark leading-snug group-hover:text-guild-300 transition-colors">
        {quest.title}
      </h3>

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-text-secondary-dark">
        <span className="flex items-center gap-1.5">
          <MapPin weight="fill" className="w-3.5 h-3.5 text-text-muted-dark" aria-hidden="true" />
          {quest.location}
        </span>
        <span className="flex items-center gap-1.5">
          <Coins weight="fill" className="w-3.5 h-3.5 text-gold-400" aria-hidden="true" />
          <span className="text-gold-400 font-semibold">
            ${quest.payMin}–${quest.payMax}/hr
          </span>
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border-dark/60">
        <span className="flex items-center gap-1.5 text-xs text-text-muted-dark">
          <Clock weight="regular" className="w-3.5 h-3.5" aria-hidden="true" />
          {quest.timePosted}
        </span>
        {quest.slots !== undefined && (
          <span className="text-xs text-text-muted-dark">
            {quest.slots} slot{quest.slots !== 1 ? "s" : ""} left
          </span>
        )}
      </div>

      {/* Hover border glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          boxShadow: "inset 0 0 0 1px rgba(99,102,241,0.4)",
        }}
        aria-hidden="true"
      />
    </motion.article>
  )
}
