"use client"

import * as React from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const NAV_LINKS = [
  { label: "Guild System", href: "#guild" },
  { label: "Quests", href: "#quests" },
  { label: "How It Works", href: "#how-it-works" },
]

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return hydrated
}

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false)
  const [mobileOpen, setMobileOpen] = React.useState(false)
  const hydrated = useHydrated()
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24)
  })

  return (
    <motion.header
      initial={hydrated ? { y: -16, opacity: 0 } : false}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-bg-dark/80 backdrop-blur-xl border-b border-border-dark shadow-guild"
          : "bg-transparent"
      )}
    >
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <a
          href="#"
          className="flex items-center gap-2.5 group"
          aria-label="Muster.club — home"
        >
          {/* Mini shield logo mark */}
          <div
            className="w-8 h-9 flex items-center justify-center transition-transform group-hover:scale-110 duration-200"
            style={{
              clipPath: "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
              background: "linear-gradient(135deg, #6366F1, #7C3AED)",
            }}
            aria-hidden="true"
          >
            <span className="font-heading font-black text-xs text-white">M</span>
          </div>
          <span className="font-heading font-bold text-lg text-white tracking-tight">
            Muster<span className="text-guild-400">.club</span>
          </span>
        </a>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-1" role="list">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="px-4 py-2 rounded-full text-sm font-medium text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover transition-all duration-150"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Button variant="ghost" size="md" aria-label="Sign in">
            Sign In
          </Button>
          <Button variant="primary" size="md" aria-label="Join the guild">
            Join the Guild
          </Button>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            {mobileOpen ? (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              />
            ) : (
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
              />
            )}
          </svg>
        </button>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="md:hidden border-t border-border-dark bg-bg-dark/95 backdrop-blur-xl px-6 py-4 flex flex-col gap-2"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="px-4 py-3 rounded-xl text-sm font-medium text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover transition-all"
            >
              {link.label}
            </a>
          ))}
          <div className="flex flex-col gap-2 pt-2 border-t border-border-dark">
            <Button variant="ghost" size="md" className="w-full justify-center">
              Sign In
            </Button>
            <Button variant="primary" size="md" className="w-full justify-center">
              Join the Guild
            </Button>
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}
