"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  React.useEffect(() => {
    if (!loading && !user) {
      router.push("/auth")
    }
  }, [loading, user, router])

  if (loading) {
    return <GuildLoader />
  }

  if (!user) {
    return null
  }

  return <>{children}</>
}

function GuildLoader() {
  return (
    <div className="min-h-screen bg-bg-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Shield mark */}
        <div
          className="w-12 h-14 flex items-center justify-center"
          style={{
            clipPath:
              "polygon(50% 0%, 100% 15%, 100% 65%, 50% 100%, 0% 65%, 0% 15%)",
            background: "linear-gradient(135deg, #6366F1, #7C3AED)",
            boxShadow: "0 0 32px rgba(99,102,241,0.4)",
          }}
          aria-hidden="true"
        >
          <span className="font-heading font-black text-base text-white">M</span>
        </div>
        {/* Pulsing dots */}
        <div className="flex gap-1.5" aria-label="Loading…">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-guild-500"
              style={{
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}
