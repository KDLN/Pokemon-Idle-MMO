import { Page } from '@playwright/test'

// Test account credentials (create in Supabase if needed)
export const TEST_USER = {
  email: 'e2e-test@pokemon-idle.local',
  password: 'TestPassword123!'
}

export async function login(page: Page) {
  await page.goto('/login')
  await page.fill('[name="email"]', TEST_USER.email)
  await page.fill('[name="password"]', TEST_USER.password)
  await page.click('button[type="submit"]')
  // Wait for redirect to game
  await page.waitForURL('**/game**', { timeout: 10000 })
}

export async function waitForGameLoad(page: Page) {
  // Wait for WebSocket connection and initial state
  // Use CSS selectors - more resilient than data-testid for existing components
  await page.waitForSelector('[class*="game-shell"], [class*="GameShell"], main', { timeout: 15000 })
}
