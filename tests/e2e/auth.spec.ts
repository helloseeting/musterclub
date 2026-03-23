import { test, expect } from "@playwright/test"
import { AuthPage, TEST_USER, uniqueEmail, loginAs } from "./helpers/auth"

// ─── Auth page rendering ──────────────────────────────────────────────────────

test.describe("Auth page — rendering", () => {
  test("renders all elements correctly", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()

    await expect(page.getByRole("link", { name: "Back to home" })).toBeVisible()
    await expect(page.getByText("Your next quest awaits.")).toBeVisible()
    await expect(page.getByLabel("Continue with Google")).toBeVisible()
    await expect(page.getByRole("tab", { name: "Sign In" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Sign Up" })).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
  })

  test("Sign In tab is active by default", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()

    // Sign In tab should be selected
    await expect(
      page.getByRole("tab", { name: "Sign In" })
    ).toHaveAttribute("data-state", "active")

    // Name field only exists on Sign Up tab
    await expect(page.getByLabel("Name")).not.toBeVisible()
  })

  test("switches to Sign Up tab and shows Name field", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.switchToSignUp()

    await expect(
      page.getByRole("tab", { name: "Sign Up" })
    ).toHaveAttribute("data-state", "active")
    await expect(page.getByLabel("Name")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Join the Guild" })
    ).toBeVisible()
  })

  test("switches back to Sign In from Sign Up", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.switchToSignUp()
    await auth.switchToSignIn()

    await expect(page.getByLabel("Name")).not.toBeVisible()
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible()
  })
})

// ─── Sign Up form validation ──────────────────────────────────────────────────

test.describe("Auth page — Sign Up validation", () => {
  test("shows error when name is empty", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.switchToSignUp()

    await page.getByLabel("Email").fill("someone@test.com")
    await page.getByLabel("Password").fill("validpassword")
    await page.getByRole("button", { name: "Join the Guild" }).click()

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText(
      "Please enter your name"
    )
  })

  test("shows error when email is empty", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.switchToSignUp()

    await page.getByLabel("Name").fill("Test User")
    await page.getByLabel("Password").fill("validpassword")
    await page.getByRole("button", { name: "Join the Guild" }).click()

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText(
      "Please enter your email"
    )
  })

  test("shows error when password is shorter than 8 characters", async ({
    page,
  }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.switchToSignUp()

    await page.getByLabel("Name").fill("Test User")
    await page.getByLabel("Email").fill("someone@test.com")
    await page.getByLabel("Password").fill("short")
    await page.getByRole("button", { name: "Join the Guild" }).click()

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText(
      "at least 8 characters"
    )
  })

  test("shows error for duplicate email", async ({ page }) => {
    // TEST_USER was created in globalSetup; try to register again with same email
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signUp("Another Name", TEST_USER.email, "password12345")

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText("already exists")
  })
})

// ─── Sign In form validation ──────────────────────────────────────────────────

test.describe("Auth page — Sign In validation", () => {
  test("shows error when both fields are empty", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()

    await page.getByRole("button", { name: "Sign In" }).click()

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText(
      "Please fill in all fields"
    )
  })

  test("shows error for wrong password", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signIn(TEST_USER.email, "wrongpassword999")

    await expect(page.getByRole("alert").filter({ hasText: /\w/ })).toContainText(
      "Incorrect email or password"
    )
  })
})

// ─── Auth flows ───────────────────────────────────────────────────────────────

test.describe("Auth page — flows", () => {
  test("successful sign-up redirects to /quests", async ({ page }) => {
    const email = uniqueEmail("signup")
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signUp("New Adventurer", email, "securepassword")

    await page.waitForURL("/quests", { timeout: 15_000 })
    await expect(page).toHaveURL("/quests")
  })

  test("successful sign-in redirects to /quests", async ({ page }) => {
    const auth = new AuthPage(page)
    await auth.goto()
    await auth.signIn(TEST_USER.email, TEST_USER.password)

    await page.waitForURL("/quests", { timeout: 15_000 })
    await expect(page).toHaveURL("/quests")
  })

  test("already-logged-in user visiting /auth is redirected to /quests", async ({
    page,
  }) => {
    await loginAs(page)

    // Navigate to /auth while already logged in
    await page.goto("/auth")
    await page.waitForURL("/quests", { timeout: 10_000 })
    await expect(page).toHaveURL("/quests")
  })

  test("sign out from navbar redirects to home", async ({ page }) => {
    await loginAs(page)

    // Navigate to home first — avoids AuthGuard race condition on /quests
    await page.goto("/")

    // Open user dropdown
    await page.getByLabel("User menu").click()

    // Click Sign Out
    await page.getByRole("menuitem", { name: "Sign Out" }).click()

    // Should land on home page (Navbar sign-out → router.push("/"))
    await page.waitForURL("/", { timeout: 10_000 })
    await expect(page).toHaveURL("/")
  })
})
