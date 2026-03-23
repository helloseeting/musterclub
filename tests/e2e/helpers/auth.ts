import { type Page } from "@playwright/test"

/** Shared test user created in globalSetup. */
export const TEST_USER = {
  email: "testuser@muster.test",
  password: "testpassword123",
  name: "Test Adventurer",
}

/** Generate a unique email so sign-up tests never collide. */
export function uniqueEmail(prefix = "user"): string {
  return `${prefix}-${Date.now()}@muster.test`
}

// ─── Auth page object ─────────────────────────────────────────────────────────

export class AuthPage {
  constructor(private readonly page: Page) {}

  async goto() {
    await this.page.goto("/auth")
    // Wait for the page to fully hydrate
    await this.page.waitForSelector('[aria-label="Continue with Google"]')
  }

  async switchToSignUp() {
    await this.page.getByRole("tab", { name: "Sign Up" }).click()
  }

  async switchToSignIn() {
    await this.page.getByRole("tab", { name: "Sign In" }).click()
  }

  /** Fill + submit the Sign In form. */
  async signIn(email: string, password: string) {
    await this.page.getByLabel("Email").fill(email)
    await this.page.getByLabel("Password").fill(password)
    await this.page.getByRole("button", { name: "Sign In" }).click()
  }

  /** Switch to Sign Up, fill the form, and submit. */
  async signUp(name: string, email: string, password: string) {
    await this.switchToSignUp()
    await this.page.getByLabel("Name").fill(name)
    await this.page.getByLabel("Email").fill(email)
    await this.page.getByLabel("Password").fill(password)
    await this.page.getByRole("button", { name: "Join the Guild" }).click()
  }

  /** Return the text of the first visible [role=alert]. */
  async getAlertText(): Promise<string | null> {
    return this.page.getByRole("alert").first().textContent()
  }
}

// ─── Helper: sign in via UI and wait for /quests ──────────────────────────────

export async function loginAs(
  page: Page,
  email = TEST_USER.email,
  password = TEST_USER.password
) {
  await page.goto("/auth")
  await page.waitForSelector('[aria-label="Continue with Google"]')
  await page.getByLabel("Email").fill(email)
  await page.getByLabel("Password").fill(password)
  await page.getByRole("button", { name: "Sign In" }).click()
  await page.waitForURL("/quests", { timeout: 15_000 })
}
