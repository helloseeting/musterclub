"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full font-heading font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:
          "bg-surface-dark border border-border-dark text-text-secondary-dark",
        guild:
          "bg-guild-950 border border-guild-500/40 text-guild-300",
        gold:
          "bg-yellow-950/60 border border-gold-500/40 text-gold-400",
        category:
          "bg-surface-dark border border-border-dark text-text-secondary-dark",
        rank:
          "border font-bold uppercase tracking-widest",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-3 py-1 text-xs",
        lg: "px-3.5 py-1.5 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
