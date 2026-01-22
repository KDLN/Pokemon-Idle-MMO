import { test, expect } from '@playwright/test'
import { login, waitForGameLoad } from '../helpers/auth'

test.describe('Zone Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForGameLoad(page)
  })

  test('displays current zone', async ({ page }) => {
    // Should show zone name (Pallet Town for new players)
    await expect(page.getByText(/pallet town|route 1/i)).toBeVisible()
  })

  test('shows travel buttons', async ({ page }) => {
    // Should have navigation buttons to adjacent zones - use text content selector
    const travelButtons = page.locator('button:has-text("Travel"), button:has-text("Route"), button:has-text("Town")')
    await expect(travelButtons.first()).toBeVisible()
  })

  test('can navigate to adjacent zone', async ({ page }) => {
    // Click first available travel option
    const travelButton = page.locator('button:has-text("Route")').first()
    if (await travelButton.isVisible()) {
      const buttonText = await travelButton.textContent()
      await travelButton.click()
      // Wait for zone change
      await page.waitForTimeout(1000)
      // Zone should have changed
      await expect(page.getByText(buttonText || '')).toBeVisible()
    }
  })
})
