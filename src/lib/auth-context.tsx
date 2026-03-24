"use client"

import * as React from "react"
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import { auth, googleProvider, db } from "@/lib/firebase"
import type { UserDoc } from "@/lib/firestore-schema"

interface AuthContextType {
  user: User | null
  userDoc: UserDoc | null
  loading: boolean
  signInWithGoogle: () => Promise<void>
  signInWithEmail: (email: string, password: string) => Promise<void>
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUserDoc: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [userDoc, setUserDoc] = React.useState<UserDoc | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        await fetchOrCreateUserDoc(firebaseUser)
      } else {
        setUserDoc(null)
      }
      setLoading(false)
    })
    return unsubscribe
  }, [])

  async function fetchOrCreateUserDoc(firebaseUser: User) {
    const userRef = doc(db, "users", firebaseUser.uid)
    const snap = await getDoc(userRef)
    if (snap.exists()) {
      setUserDoc(snap.data() as UserDoc)
    } else {
      const newUserDoc = {
        email: firebaseUser.email ?? "",
        name:
          firebaseUser.displayName ??
          firebaseUser.email?.split("@")[0] ??
          "Adventurer",
        ...(firebaseUser.photoURL ? { avatarUrl: firebaseUser.photoURL } : {}),
        role: "adventurer" as const,
        rank: "F" as const,
        xp: 0,
        skills: [] as string[],
        questsCompleted: 0,
        averageRating: 0,
        totalEarnings: 0,
        totalRatings: 0,
        isVerified: false,
        isOnboarded: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }
      await setDoc(userRef, newUserDoc)
      setUserDoc(newUserDoc as unknown as UserDoc)
    }
  }

  const signInWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider)
    // onAuthStateChanged handles state updates
  }

  const signInWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
    // onAuthStateChanged handles state updates
  }

  const signUpWithEmail = async (
    email: string,
    password: string,
    name: string
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName: name })
    // Explicitly create user doc so the name is correct
    const userRef = doc(db, "users", cred.user.uid)
    const newUserDoc = {
      email: cred.user.email ?? "",
      name,
      role: "adventurer" as const,
      rank: "F" as const,
      xp: 0,
      skills: [] as string[],
      questsCompleted: 0,
      averageRating: 0,
      totalEarnings: 0,
      totalRatings: 0,
      isVerified: false,
      isOnboarded: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }
    await setDoc(userRef, newUserDoc)
    setUserDoc(newUserDoc as unknown as UserDoc)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    // onAuthStateChanged fires with null, resetting user + userDoc
  }

  const refreshUserDoc = async () => {
    if (!auth.currentUser) return
    const userRef = doc(db, "users", auth.currentUser.uid)
    const snap = await getDoc(userRef)
    if (snap.exists()) {
      setUserDoc(snap.data() as UserDoc)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userDoc,
        loading,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        refreshUserDoc,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
