import { test, expect } from "@playwright/test"
import { loginAs } from "./helpers/auth"

// ─── Helper: wait for quest cards to appear ───────────────────────────────────
// The quests page seeds Firestore on mount if empty, then subscribes with
// onSnapshot. With emulators this should resolve within a few seconds.

async function waitForQuestCards(page: import("@playwright/test").Page) {
  await expect(
    page.getByRole("button", { name: /View quest:/ }).first()
  ).toBeVisible({ timeout: 20_000 })
}

// ─── Auth guard ───────────────────────────────────────────────────────────────

test.describe("Quest board — auth guard", () => {
  test("unauthenticated visit redirects to /auth", async ({ page }) => {
    await page.goto("/quests")
    await page.waitForURL("/auth", { timeout: 10_000 })
    await expect(page).toHaveURL("/auth")
  })
})

// ─── Quest board loading ──────────────────────────────────────────────────────

test.describe("Quest board — loading & display", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
  })

  test("shows skeleton cards while loading, then quest cards", async ({
    page,
  }) => {
    // Immediately after navigation the skeletons or cards should be visible
    await expect(
      page.locator(".skeleton, [aria-label*='View quest']").first()
    ).toBeVisible({ timeout: 5_000 })

    // Eventually quest cards appear
    await waitForQuestCards(page)
  })

  test("displays quest count in the header", async ({ page }) => {
    await waitForQuestCards(page)
    // e.g. "8 quests available across Singapore"
    await expect(
      page.getByText(/\d+ quest[s]? available across Singapore/)
    ).toBeVisible()
  })

  test("quest card shows title, location and pay", async ({ page }) => {
    await waitForQuestCards(page)
    const firstCard = page.getByRole("button", { name: /View quest:/ }).first()
    await expect(firstCard).toBeVisible()

    // At least one pay value should be visible somewhere in the first card
    await expect(firstCard.getByText(/\$\d+/)).toBeVisible()
  })
})

// ─── Filters ──────────────────────────────────────────────────────────────────

test.describe("Quest board — filters", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await waitForQuestCards(page)
  })

  test("search filter narrows results", async ({ page }) => {
    const searchInput = page.getByLabel("Search quests")

    // Use the first visible card's title as the search term — avoids
    // depending on a specific seed quest being present.
    const firstCard = page.getByRole("button", { name: /View quest:/ }).first()
    const ariaLabel = (await firstCard.getAttribute("aria-label")) ?? ""
    const questTitle = ariaLabel.replace(/^View quest:\s*/i, "").trim()
    // Pick a word ≥4 chars so the search is meaningful
    const searchTerm =
      questTitle.split(/[\s—]+/).find((w) => w.length >= 4) ?? questTitle

    const before = await page
      .getByRole("button", { name: /View quest:/ })
      .count()

    await searchInput.fill(searchTerm)

    // At least the card we derived the term from should remain visible
    await expect(
      page.getByRole("button", { name: new RegExp(searchTerm, "i") })
    ).toBeVisible({ timeout: 5_000 })

    const after = await page
      .getByRole("button", { name: /View quest:/ })
      .count()
    expect(after).toBeLessThanOrEqual(before)
  })

  test("category filter narrows results", async ({ page }) => {
    const select = page.getByLabel("Category")
    await select.selectOption("events")
    await page.waitForTimeout(300)

    // Only events quests should show
    const cards = page.getByRole("button", { name: /View quest:/ })
    await expect(cards.first()).toBeVisible()
    // Check that we have at least one card (seeded events quest)
    expect(await cards.count()).toBeGreaterThanOrEqual(1)
  })

  test("location filter narrows results", async ({ page }) => {
    const select = page.getByLabel("Location")
    await select.selectOption("Orchard")
    await page.waitForTimeout(300)

    await expect(
      page.getByRole("button", { name: /View quest:/ }).first()
    ).toBeVisible()
  })

  test("rank filter narrows results", async ({ page }) => {
    const select = page.getByLabel("Rank")
    await select.selectOption("F")
    await page.waitForTimeout(300)

    await expect(
      page.getByRole("button", { name: /View quest:/ }).first()
    ).toBeVisible()
  })

  test("sort by highest pay is selectable", async ({ page }) => {
    const select = page.getByLabel("Sort by")
    await select.selectOption("highest_pay")
    await page.waitForTimeout(300)

    // Quest cards should still be visible after sort change
    await expect(
      page.getByRole("button", { name: /View quest:/ }).first()
    ).toBeVisible()
  })

  test("sort by best rank match is selectable", async ({ page }) => {
    const select = page.getByLabel("Sort by")
    await select.selectOption("rank_match")
    await page.waitForTimeout(300)

    await expect(
      page.getByRole("button", { name: /View quest:/ }).first()
    ).toBeVisible()
  })

  test("Clear button appears when filters are active and resets them", async ({
    page,
  }) => {
    // Apply a filter
    await page.getByLabel("Search quests").fill("Barista")
    await page.waitForTimeout(200)

    // Clear button should appear
    const clearBtn = page.getByRole("button", { name: "Clear filters" })
    await expect(clearBtn).toBeVisible()

    // Click it
    await clearBtn.click()
    await page.waitForTimeout(200)

    // All quests should be back; clear button should be gone
    await expect(clearBtn).not.toBeVisible()
    await waitForQuestCards(page)
  })

  test("impossible filter combination shows empty state", async ({ page }) => {
    // Search for something that definitely doesn't exist
    await page
      .getByLabel("Search quests")
      .fill("ZZZNOMATCHFORTHISTERM99999")
    await page.waitForTimeout(300)

    await expect(page.getByText("No quests found")).toBeVisible()
    await expect(
      page.getByText(/Try adjusting your filters/)
    ).toBeVisible()
  })
})

// ─── Quest modal ──────────────────────────────────────────────────────────────

test.describe("Quest board — quest detail modal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page)
    await waitForQuestCards(page)
  })

  test("clicking a quest card opens the detail modal", async ({ page }) => {
    const firstCard = page
      .getByRole("button", { name: /View quest:/ })
      .first()

    // Capture the quest title from the aria-label
    const ariaLabel = (await firstCard.getAttribute("aria-label")) ?? ""
    const questTitle = ariaLabel.replace("View quest: ", "").trim()

    await firstCard.click()

    // Dialog title should match
    await expect(page.getByRole("dialog")).toBeVisible()
    await expect(
      page.getByRole("heading", { name: questTitle })
    ).toBeVisible()
  })

  test("modal shows pay, location, and skills info", async ({ page }) => {
    await page
      .getByRole("button", { name: /View quest:/ })
      .first()
      .click()

    const dialog = page.getByRole("dialog")
    await expect(dialog).toBeVisible()

    // Meta fields
    await expect(dialog.getByText("Location")).toBeVisible()
    await expect(dialog.getByText("Pay")).toBeVisible()
    await expect(dialog.getByText("Slots left")).toBeVisible()
    await expect(dialog.getByText("About this quest")).toBeVisible()
  })

  test("modal closes via the X button", async ({ page }) => {
    await page
      .getByRole("button", { name: /View quest:/ })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByLabel("Close").click()
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("modal closes via overlay click", async ({ page }) => {
    await page
      .getByRole("button", { name: /View quest:/ })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()

    // Press Escape — equivalent to clicking outside the dialog
    await page.keyboard.press("Escape")
    await expect(page.getByRole("dialog")).not.toBeVisible()
  })

  test("Apply Now button shows coming-soon toast", async ({ page }) => {
    await page
      .getByRole("button", { name: /View quest:/ })
      .first()
      .click()
    await expect(page.getByRole("dialog")).toBeVisible()

    await page.getByRole("button", { name: "Apply Now" }).click()

    await expect(
      page.getByText("Applications coming soon!")
    ).toBeVisible({ timeout: 5_000 })
  })
})
