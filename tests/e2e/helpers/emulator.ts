/**
 * Firebase Emulator utilities for test setup/teardown.
 * Emulators must be running before tests: `firebase emulators:start --only auth,firestore`
 */

const PROJECT_ID =
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "musterclubbers"
const AUTH_URL = "http://127.0.0.1:9099"
const FIRESTORE_URL = "http://127.0.0.1:8080"

/** Clear all Auth and Firestore emulator data. */
export async function clearEmulatorData(): Promise<void> {
  const [authRes, fsRes] = await Promise.allSettled([
    fetch(
      `${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`,
      { method: "DELETE" }
    ),
    fetch(
      `${FIRESTORE_URL}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`,
      { method: "DELETE" }
    ),
  ])

  if (authRes.status === "rejected") {
    throw new Error(
      `Could not reach Auth emulator at ${AUTH_URL}. Is it running?\n  firebase emulators:start --only auth,firestore`
    )
  }
  if (fsRes.status === "rejected") {
    throw new Error(
      `Could not reach Firestore emulator at ${FIRESTORE_URL}. Is it running?\n  firebase emulators:start --only auth,firestore`
    )
  }
}

/**
 * Create a user directly via the Auth emulator REST API.
 * Returns the created user's localId (uid).
 */
export async function createTestUser(
  email: string,
  password: string,
  displayName: string
): Promise<string> {
  const res = await fetch(
    `${AUTH_URL}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=test-api-key`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName, returnSecureToken: false }),
    }
  )
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`createTestUser failed (${res.status}): ${body}`)
  }
  const data = await res.json()
  return data.localId as string
}

/** Poll until both emulators respond (max ~30 s). */
export async function waitForEmulators(maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const res = await fetch(
        `${AUTH_URL}/emulator/v1/projects/${PROJECT_ID}/accounts`
      )
      if (res.status < 500) return
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  throw new Error(
    "Firebase emulators did not become ready in time.\n" +
      "Start them with: firebase emulators:start --only auth,firestore"
  )
}
