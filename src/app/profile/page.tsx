"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { ProfileContent } from "@/components/profile-content"

function ProfileInner() {
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const userId = searchParams.get("id") ?? user?.uid ?? null

  if (!userId) return null

  return <ProfileContent userId={userId} />
}

// Profile route: /profile?id=<userId>  or  /profile (own profile)
export default function ProfilePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-[#0F0D15]" />}>
      <ProfileInner />
    </React.Suspense>
  )
}
