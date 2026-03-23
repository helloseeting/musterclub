/**
 * Responsive layout tests.
 * Run against multiple viewport sizes to verify layout shifts.
 */
import { test, expect } from "@playwright/test"
import { loginAs } from "./helpers/auth"

// ─── Auth page responsiveness ─────────────────────────────────────────────────

test.describe("Auth page — responsive", () => {
  test("renders correctly on mobile (375 × 812)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/auth")
    await page.waitForSelector('[aria-label="Continue with Google"]')

    // Key elements should be visible and not overflow
    await expect(page.getByLabel("Continue with Google")).toBeVisible()
    await expect(page.getByRole("tab", { name: "Sign In" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Sign Up" })).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
    await expect(page.getByLabel("Password")).toBeVisible()

    // The card should not overflow horizontally
    const card = page.locator("main").first()
    const box = await card.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)
  })

  test("renders correctly on tablet (768 × 1024)", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto("/auth")
    await page.waitForSelector('[aria-label="Continue with Google"]')

    await expect(page.getByLabel("Continue with Google")).toBeVisible()
    await expect(page.getByLabel("Email")).toBeVisible()
  })
})

// ─── Quest board responsiveness ───────────────────────────────────────────────

test.describe("Quest board — responsive grid", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    // Wait for quest cards
    await expect(
      page.getByRole("button", { name: /View quest:/ }).first()
    ).toBeVisible({ timeout: 20_000 })
  })

  test("shows single-column grid on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    const grid = page.locator(".grid").first()
    const columns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(" ").length
    })
    expect(columns).toBe(1)
  })

  test("shows two-column grid on tablet (640px)", async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 })

    const grid = page.locator(".grid").first()
    const columns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(" ").length
    })
    expect(columns).toBe(2)
  })

  test("shows three-column grid on desktop (1280px)", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })

    const grid = page.locator(".grid").first()
    const columns = await grid.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns.split(" ").length
    })
    expect(columns).toBe(3)
  })

  test("filters toolbar wraps on mobile without overflow", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    const filterBar = page.locator("section").nth(1) // sticky filter section
    const box = await filterBar.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)

    // Search input and at least one select should still be visible
    await expect(page.getByLabel("Search quests")).toBeVisible()
    await expect(page.getByLabel("Category")).toBeVisible()
  })

  test("quest detail modal is usable on mobile (375px)", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })

    await page
      .getByRole("button", { name: /View quest:/ })
      .first()
      .click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Dialog should fit within the viewport width
    const box = await dialog.boundingBox()
    expect(box?.width).toBeLessThanOrEqual(375)

    // Apply Now and Close should be accessible without horizontal scroll
    await expect(page.getByRole("button", { name: "Apply Now" })).toBeVisible()
    await expect(page.getByLabel("Close")).toBeVisible()
  })
})

// ─── Mobile navbar ────────────────────────────────────────────────────────────

test.describe("Navbar — mobile menu", () => {
  test("shows hamburger button on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    await expect(
      page.getByLabel(/Open menu|Close menu/)
    ).toBeVisible()
  })

  test("hamburger opens and closes the mobile menu", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto("/")

    const hamburger = page.getByLabel("Open menu")
    await hamburger.click()

    // Mobile menu drawer should appear with nav links
    const mobileMenu = page.getByTestId("mobile-menu")
    await expect(mobileMenu).toBeVisible()
    await expect(mobileMenu.getByText("Guild System")).toBeVisible()

    // Close it
    await page.getByLabel("Close menu").click()
    await expect(mobileMenu).not.toBeVisible()
  })
})
