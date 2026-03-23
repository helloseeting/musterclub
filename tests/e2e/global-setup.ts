import { clearEmulatorData, createTestUser, waitForEmulators } from "./helpers/emulator"
import { TEST_USER } from "./helpers/auth"

export default async function globalSetup() {
  console.log("\n🔥 Waiting for Firebase emulators…")
  await waitForEmulators()

  console.log("🗑️  Clearing emulator data…")
  await clearEmulatorData()

  console.log("👤 Creating shared test user…")
  await createTestUser(TEST_USER.email, TEST_USER.password, TEST_USER.name)

  console.log("✅ Global setup complete\n")
}
