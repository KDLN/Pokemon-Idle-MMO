import { test, expect } from '@playwright/test'
import { login, waitForGameLoad } from '../helpers/auth'

test.describe('Party Management', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForGameLoad(page)
  })

  test('displays party panel', async ({ page, isMobile }) => {
    // On mobile, may need to click Party tab
    if (isMobile) {
      const partyTab = page.getByRole('tab', { name: /party/i })
      if (await partyTab.isVisible()) {
        await partyTab.click()
      }
    }

    // Should show party section with Pokemon - use class selector
    await expect(page.locator('[class*="party"], [class*="Party"]').first()).toBeVisible()
  })

  test('shows Pokemon in party', async ({ page, isMobile }) => {
    if (isMobile) {
      const partyTab = page.getByRole('tab', { name: /party/i })
      if (await partyTab.isVisible()) {
        await partyTab.click()
      }
    }

    // Should show at least one Pokemon (starter) - use class selector for pokemon cards
    const pokemonCard = page.locator('[class*="pokemon"], [class*="Pokemon"]').first()
    await expect(pokemonCard).toBeVisible({ timeout: 10000 })
  })
})
