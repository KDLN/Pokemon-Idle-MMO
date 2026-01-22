import { test, expect } from '@playwright/test'
import { login, waitForGameLoad } from '../helpers/auth'

test.describe('Guild Features', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await waitForGameLoad(page)
  })

  test('can access guild panel', async ({ page, isMobile }) => {
    // On mobile, may need to navigate to Social tab
    if (isMobile) {
      const socialTab = page.getByRole('tab', { name: /social/i })
      if (await socialTab.isVisible()) {
        await socialTab.click()
      }
    }

    // Look for guild UI elements - use class selector
    const guildSection = page.locator('[class*="guild"], [class*="Guild"]')
    await expect(guildSection.first()).toBeVisible({ timeout: 10000 })
  })

  test('shows chat interface', async ({ page, isMobile }) => {
    if (isMobile) {
      const socialTab = page.getByRole('tab', { name: /social/i })
      if (await socialTab.isVisible()) {
        await socialTab.click()
      }
    }

    // Chat panel should be visible - use class selector
    const chatPanel = page.locator('[class*="chat"], [class*="Chat"]')
    await expect(chatPanel.first()).toBeVisible()
  })

  test('can switch chat channels', async ({ page, isMobile }) => {
    if (isMobile) {
      const socialTab = page.getByRole('tab', { name: /social/i })
      if (await socialTab.isVisible()) {
        await socialTab.click()
      }
    }

    // Look for channel tabs/buttons (Global, Zone, Guild, etc.)
    const channelSelector = page.locator('button:has-text("Global"), button:has-text("Zone"), button:has-text("Guild")')
    await expect(channelSelector.first()).toBeVisible()
  })

  test('chat input is functional', async ({ page, isMobile }) => {
    if (isMobile) {
      const socialTab = page.getByRole('tab', { name: /social/i })
      if (await socialTab.isVisible()) {
        await socialTab.click()
      }
    }

    // Find chat input - use placeholder selector
    const chatInput = page.locator('input[placeholder*="message"], textarea[placeholder*="message"], input[placeholder*="Message"]')
    await expect(chatInput.first()).toBeVisible()

    // Should be able to type (but don't actually send in test)
    await chatInput.first().fill('Test message')
    await expect(chatInput.first()).toHaveValue('Test message')
  })
})
