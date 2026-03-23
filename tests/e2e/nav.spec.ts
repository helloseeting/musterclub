import { test, expect } from "@playwright/test"
import { loginAs, TEST_USER } from "./helpers/auth"

test.describe("Navbar — unauthenticated", () => {
  test("shows Sign In and Join the Guild buttons when not logged in", async ({
    page,
  }) => {
    await page.goto("/")
    // Desktop buttons (hidden on mobile, but tests run at desktop size)
    await expect(
      page.getByRole("button", { name: "Sign In" }).first()
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Join the Guild" }).first()
    ).toBeVisible()
  })

  test("logo links to home (#) when not logged in", async ({ page }) => {
    await page.goto("/")
    // Scope to nav to avoid matching the footer logo with the same aria-label
    const logo = page.getByRole("navigation").getByLabel("Muster.club — home")
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute("href", "#")
  })
})

test.describe("Navbar — authenticated", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test("shows user menu when logged in", async ({ page }) => {
    await expect(page.getByLabel("User menu")).toBeVisible()
  })

  test("user menu shows name initial and rank", async ({ page }) => {
    const userMenu = page.getByLabel("User menu")
    await expect(userMenu).toBeVisible()
    // Rank F should appear
    await expect(userMenu.getByText("F")).toBeVisible()
    // First letter of the test user name
    await expect(
      userMenu.getByText(TEST_USER.name.split(" ")[0])
    ).toBeVisible()
  })

  test("logo links to /quests when logged in", async ({ page }) => {
    const logo = page.getByRole("navigation").getByLabel("Muster.club — home")
    await expect(logo).toBeVisible()
    await expect(logo).toHaveAttribute("href", "/quests")
  })

  test("user menu dropdown shows Profile, My Quests and Sign Out", async ({
    page,
  }) => {
    await page.getByLabel("User menu").click()

    await expect(page.getByRole("menuitem", { name: "Profile" })).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: "My Quests" })
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: "Sign Out" })
    ).toBeVisible()
  })

  test("My Quests menu item navigates to /quests", async ({ page }) => {
    // Start at home
    await page.goto("/")
    await page.getByLabel("User menu").click()
    await page.getByRole("menuitem", { name: "My Quests" }).click()

    await page.waitForURL("/quests", { timeout: 10_000 })
    await expect(page).toHaveURL("/quests")
  })

  test("Sign Out from dropdown redirects to home", async ({ page }) => {
    // Navigate to home first — avoids AuthGuard race condition on /quests
    await page.goto("/")
    await page.getByLabel("User menu").click()
    await page.getByRole("menuitem", { name: "Sign Out" }).click()

    await page.waitForURL("/", { timeout: 10_000 })
    await expect(page).toHaveURL("/")
  })
})
