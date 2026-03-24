"use client"

import * as React from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import * as Tabs from "@radix-ui/react-tabs"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function useHydrated() {
  const [hydrated, setHydrated] = React.useState(false)
  React.useEffect(() => setHydrated(true), [])
  return hydrated
}

// ─── Google icon ──────────────────────────────────────────────────────────────
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}

// ─── Input component ──────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

function Input({ label, error, className, id, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-")
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={inputId}
        className="text-xs font-heading font-semibold text-text-secondary-dark uppercase tracking-wider"
      >
        {label}
      </label>
      <input
        id={inputId}
        className={cn(
          "w-full h-11 px-4 rounded-xl bg-surface-dark border text-text-primary-dark text-sm placeholder:text-text-muted-dark transition-all duration-200",
          "focus:outline-none focus:ring-2 focus:ring-guild-500 focus:border-guild-500/50",
          error
            ? "border-red-500/60 focus:ring-red-500/50"
            : "border-border-dark hover:border-guild-500/30",
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-xs text-red-400 mt-0.5" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

// ─── Error message ────────────────────────────────────────────────────────────
function ErrorBanner({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-red-950/60 border border-red-500/30 text-red-300 text-sm"
      role="alert"
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        className="shrink-0 mt-0.5"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
      {message}
    </motion.div>
  )
}

// ─── Sign-in form ─────────────────────────────────────────────────────────────
function SignInForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!email || !password) {
      setError("Please fill in all fields.")
      return
    }
    setLoading(true)
    try {
      await signInWithEmail(email, password)
      onSuccess()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Incorrect email or password.")
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Try again in a few minutes.")
      } else {
        setError("Sign-in failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorBanner message={error} />}
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-1"
        disabled={loading}
      >
        {loading ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  )
}

// ─── Sign-up form ─────────────────────────────────────────────────────────────
function SignUpForm({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { signUpWithEmail } = useAuth()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [error, setError] = React.useState("")
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    if (!name.trim()) {
      setError("Please enter your name.")
      return
    }
    if (!email) {
      setError("Please enter your email.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setLoading(true)
    try {
      await signUpWithEmail(email, password, name.trim())
      onSuccess()
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      if (code === "auth/email-already-in-use") {
        setError("An account with this email already exists.")
      } else if (code === "auth/weak-password") {
        setError("Password is too weak. Use at least 8 characters.")
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email address.")
      } else {
        setError("Sign-up failed. Please try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      {error && <ErrorBanner message={error} />}
      <Input
        label="Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        autoComplete="name"
        required
      />
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Min. 8 characters"
        autoComplete="new-password"
        required
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full mt-1"
        disabled={loading}
      >
        {loading ? "Creating account…" : "Join the Guild"}
      </Button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AuthPage() {
  const { user, userDoc, loading, signInWithGoogle } = useAuth()
  const router = useRouter()
  const hydrated = useHydrated()
  const [googleLoading, setGoogleLoading] = React.useState(false)
  const [googleError, setGoogleError] = React.useState("")

  // Redirect based on onboarding status
  React.useEffect(() => {
    if (!loading && user && userDoc) {
      router.replace(userDoc.isOnboarded ? "/quests" : "/onboarding")
    }
  }, [loading, user, userDoc, router])

  if (loading || user) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center">
        <div
          className="w-10 h-12 flex items-center justify-center"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
            background: "linear-gradient(135deg, #6366F1, #7C3AED)",
          }}
          aria-hidden="true"
        >
          <span className="font-heading font-black text-sm text-white">M</span>
        </div>
      </div>
    )
  }

  const handleGoogleSignIn = async () => {
    setGoogleError("")
    setGoogleLoading(true)
    try {
      await signInWithGoogle()
      // Redirect handled by useEffect once userDoc is loaded
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? ""
      if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setGoogleError("Google sign-in failed. Try again or use email.")
      }
    } finally {
      setGoogleLoading(false)
    }
  }

  return (
    <main
      className="min-h-screen bg-bg-dark flex items-center justify-center relative overflow-hidden px-4"
      aria-label="Authentication"
    >
      {/* Background gradient — matches landing page energy */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[140%] h-[70%] rounded-[50%] opacity-20"
          style={{
            background:
              "radial-gradient(ellipse at center top, #312E81 0%, #4338CA 25%, #6366F1 50%, #7C3AED 70%, transparent 100%)",
            filter: "blur(80px)",
          }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] opacity-15"
          style={{
            background:
              "radial-gradient(ellipse at bottom right, #F59E0B, #D97706 40%, transparent 75%)",
            filter: "blur(100px)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(99,102,241,0.06) 1px, transparent 1px),
              linear-gradient(90deg, rgba(99,102,241,0.06) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Content block */}
      <motion.div
        initial={hydrated ? { opacity: 0, y: 28 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        className="relative z-10 w-full max-w-[400px]"
      >
        {/* Brand */}
        <motion.div
          className="flex flex-col items-center mb-8"
          initial={hydrated ? { opacity: 0, y: 16 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.23, 1, 0.32, 1] }}
        >
          <a href="/" aria-label="Back to home" className="inline-flex flex-col items-center gap-3 group">
            <div
              className="w-12 h-14 flex items-center justify-center transition-transform group-hover:scale-105 duration-200"
              style={{
                clipPath:
                  "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
                background: "linear-gradient(135deg, #6366F1, #7C3AED)",
                boxShadow: "0 0 32px rgba(99,102,241,0.35)",
              }}
              aria-hidden="true"
            >
              <span className="font-heading font-black text-base text-white">M</span>
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-tight">
              Muster<span className="text-guild-400">.club</span>
            </span>
          </a>
          <p className="mt-2 text-sm text-text-muted-dark">
            Your next quest awaits.
          </p>
        </motion.div>

        {/* Google button */}
        <motion.div
          initial={hydrated ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="mb-5"
        >
          {googleError && <ErrorBanner message={googleError} />}
          <button
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="mt-3 w-full h-11 flex items-center justify-center gap-3 rounded-xl border border-border-dark bg-surface-dark hover:bg-surface-dark-hover hover:border-guild-500/30 text-sm font-heading font-semibold text-text-primary-dark transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500 disabled:opacity-50 disabled:pointer-events-none"
            aria-label="Continue with Google"
          >
            <GoogleIcon />
            {googleLoading ? "Connecting…" : "Continue with Google"}
          </button>
        </motion.div>

        {/* Divider */}
        <motion.div
          initial={hydrated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex items-center gap-3 mb-5"
          aria-hidden="true"
        >
          <div className="flex-1 h-px bg-border-dark" />
          <span className="text-xs text-text-muted-dark font-heading">or</span>
          <div className="flex-1 h-px bg-border-dark" />
        </motion.div>

        {/* Tabs: Sign In / Sign Up */}
        <motion.div
          initial={hydrated ? { opacity: 0, y: 12 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.35, ease: [0.23, 1, 0.32, 1] }}
        >
          <Tabs.Root defaultValue="signin">
            <Tabs.List
              className="flex rounded-xl bg-surface-dark border border-border-dark p-1 mb-5"
              aria-label="Authentication method"
            >
              <Tabs.Trigger
                value="signin"
                className="flex-1 h-9 rounded-lg text-sm font-heading font-semibold text-text-muted-dark transition-all duration-200 data-[state=active]:bg-guild-600 data-[state=active]:text-white data-[state=active]:shadow-guild focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500"
              >
                Sign In
              </Tabs.Trigger>
              <Tabs.Trigger
                value="signup"
                className="flex-1 h-9 rounded-lg text-sm font-heading font-semibold text-text-muted-dark transition-all duration-200 data-[state=active]:bg-guild-600 data-[state=active]:text-white data-[state=active]:shadow-guild focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-guild-500"
              >
                Sign Up
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="signin" className="outline-none">
              <SignInForm onSuccess={() => { /* redirect handled by useEffect */ }} />
            </Tabs.Content>

            <Tabs.Content value="signup" className="outline-none">
              <SignUpForm onSuccess={() => { /* redirect handled by useEffect */ }} />
            </Tabs.Content>
          </Tabs.Root>
        </motion.div>

        {/* Footer copy */}
        <motion.p
          initial={hydrated ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.55 }}
          className="mt-6 text-center text-xs text-text-muted-dark leading-relaxed"
        >
          By signing up you agree to our Terms of Service.
          <br />
          Muster.club is currently in stealth mode — Singapore only.
        </motion.p>
      </motion.div>
    </main>
  )
}
