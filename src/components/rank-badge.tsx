"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { RANKS, type RankKey } from "@/lib/constants"

interface RankBadgeProps {
  rank: RankKey
  size?: "sm" | "md" | "lg" | "xl"
  showLabel?: boolean
  className?: string
}

const sizeMap = {
  sm: { shield: "w-7 h-8", text: "text-xs", label: "text-xs" },
  md: { shield: "w-9 h-10", text: "text-sm", label: "text-xs" },
  lg: { shield: "w-12 h-14", text: "text-base", label: "text-sm" },
  xl: { shield: "w-16 h-[72px]", text: "text-xl", label: "text-sm" },
}

export function RankBadge({ rank, size = "md", showLabel = false, className }: RankBadgeProps) {
  const rankData = RANKS[rank]
  const sizes = sizeMap[size]

  return (
    <div className={cn("inline-flex flex-col items-center gap-1", className)}>
      {/* Shield shape via clip-path */}
      <div
        className={cn("relative flex items-center justify-center", sizes.shield)}
        style={{
          clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
          background: `linear-gradient(135deg, ${rankData.bgColor}, ${rankData.color}22)`,
          border: `1.5px solid ${rankData.color}55`,
          boxShadow: `0 0 12px ${rankData.color}33`,
        }}
      >
        {/* Inner glow border via pseudo-element workaround */}
        <span
          className={cn("font-heading font-black tracking-tight", sizes.text)}
          style={{ color: rankData.color }}
        >
          {rank}
        </span>
      </div>
      {showLabel && (
        <span
          className={cn("font-heading font-semibold", sizes.label)}
          style={{ color: rankData.color }}
        >
          {rankData.label}
        </span>
      )}
    </div>
  )
}
