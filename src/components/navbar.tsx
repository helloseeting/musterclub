"use client"

import * as React from "react"
import { motion, useScroll, useMotionValueEvent } from "framer-motion"
import * as DropdownMenu from "@radix-ui/react-dropdown-menu"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
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
  const { user, userDoc, loading, signOut } = useAuth()
  const router = useRouter()

  useMotionValueEvent(scrollY, "change", (v) => {
    setScrolled(v > 24)
  })

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const avatarLetter =
    userDoc?.name?.[0]?.toUpperCase() ??
    user?.displayName?.[0]?.toUpperCase() ??
    user?.email?.[0]?.toUpperCase() ??
    "?"

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
          href={user ? "/quests" : "#"}
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
          {!loading && user ? (
            <UserMenu
              avatarLetter={avatarLetter}
              avatarUrl={userDoc?.avatarUrl ?? user?.photoURL ?? undefined}
              name={userDoc?.name ?? user?.displayName ?? "Adventurer"}
              rank={userDoc?.rank ?? "F"}
              onSignOut={handleSignOut}
              onProfile={() => router.push("/profile")}
              onMyQuests={() => router.push("/quests")}
            />
          ) : !loading ? (
            <>
              <Button
                variant="ghost"
                size="md"
                onClick={() => router.push("/auth")}
                aria-label="Sign in"
              >
                Sign In
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => router.push("/auth")}
                aria-label="Join the guild"
              >
                Join the Guild
              </Button>
            </>
          ) : null}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover transition-colors"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
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
          data-testid="mobile-menu"
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
            {!loading && user ? (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    router.push("/quests")
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-left text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover transition-all"
                >
                  My Quests
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    handleSignOut()
                  }}
                  className="px-4 py-3 rounded-xl text-sm font-medium text-left text-red-400 hover:text-red-300 hover:bg-surface-dark-hover transition-all"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileOpen(false)
                    router.push("/auth")
                  }}
                >
                  Sign In
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  className="w-full justify-center"
                  onClick={() => {
                    setMobileOpen(false)
                    router.push("/auth")
                  }}
                >
                  Join the Guild
                </Button>
              </>
            )}
          </div>
        </motion.div>
      )}
    </motion.header>
  )
}

// ─── User menu dropdown ───────────────────────────────────────────────────────

interface UserMenuProps {
  avatarLetter: string
  avatarUrl?: string
  name: string
  rank: string
  onSignOut: () => void
  onProfile: () => void
  onMyQuests: () => void
}

function UserMenu({
  avatarLetter,
  avatarUrl,
  name,
  rank,
  onSignOut,
  onProfile,
  onMyQuests,
}: UserMenuProps) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="flex items-center gap-2.5 rounded-full pl-1 pr-3 py-1 border border-border-dark bg-surface-dark hover:bg-surface-dark-hover hover:border-guild-500/40 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500"
          aria-label="User menu"
        >
          <span className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center bg-guild-900 border border-guild-500/30 shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="font-heading font-bold text-xs text-guild-300">
                {avatarLetter}
              </span>
            )}
          </span>
          <span className="font-heading text-sm font-semibold text-white max-w-[100px] truncate">
            {name.split(" ")[0]}
          </span>
          <span className="text-xs font-heading font-bold text-guild-400">
            {rank}
          </span>
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            className="text-text-muted-dark"
            aria-hidden="true"
          >
            <path
              d="M2.5 4.5L6 8L9.5 4.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={8}
          align="end"
          className="min-w-[180px] rounded-2xl border border-border-dark bg-bg-dark-secondary backdrop-blur-xl shadow-guild-lg p-1.5 z-50"
          style={{ animationDuration: "150ms" }}
        >
          <div className="px-3 py-2.5 mb-1">
            <p className="font-heading text-sm font-semibold text-white truncate">
              {name}
            </p>
            <p className="text-xs text-text-muted-dark">Rank {rank} Adventurer</p>
          </div>
          <DropdownMenu.Separator className="h-px bg-border-dark mx-1 mb-1" />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover cursor-pointer outline-none transition-colors"
            onSelect={onProfile}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <circle cx="8" cy="5" r="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 14c0-3.314 2.686-5 6-5s6 1.686 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Profile
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-text-secondary-dark hover:text-white hover:bg-surface-dark-hover cursor-pointer outline-none transition-colors"
            onSelect={onMyQuests}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M13 3H3a1 1 0 00-1 1v8a1 1 0 001 1h10a1 1 0 001-1V4a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M5 7h6M5 10h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            My Quests
          </DropdownMenu.Item>

          <DropdownMenu.Separator className="h-px bg-border-dark mx-1 my-1" />

          <DropdownMenu.Item
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer outline-none transition-colors"
            onSelect={onSignOut}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M10 3h3a1 1 0 011 1v8a1 1 0 01-1 1h-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M7 10l3-2.5L7 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 7.5H3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Sign Out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
