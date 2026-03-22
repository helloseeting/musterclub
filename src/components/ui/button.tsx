"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-heading font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-dark disabled:pointer-events-none disabled:opacity-40 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-guild-500 text-white shadow-guild hover:bg-guild-600 hover:shadow-guild-lg hover:scale-[1.02] active:scale-[0.98]",
        secondary:
          "border border-guild-500/50 bg-guild-950/60 text-guild-300 hover:border-guild-400 hover:bg-guild-900/60 hover:text-white active:scale-[0.98]",
        ghost:
          "text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover active:scale-[0.98]",
        danger:
          "bg-red-600 text-white hover:bg-red-500 active:scale-[0.98]",
      },
      size: {
        sm: "h-8 px-4 text-sm",
        md: "h-10 px-5 text-sm",
        lg: "h-12 px-7 text-base",
        xl: "h-14 px-9 text-lg",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
