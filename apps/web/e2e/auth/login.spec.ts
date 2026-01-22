import { test, expect } from '@playwright/test'
import { TEST_USER } from '../helpers/auth'

test.describe('Login Flow', () => {
  test('shows login form', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /sign in/i })).toBeVisible()
    await expect(page.locator('[name="email"]')).toBeVisible()
    await expect(page.locator('[name="password"]')).toBeVisible()
  })

  test('redirects to game on successful login', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', TEST_USER.email)
    await page.fill('[name="password"]', TEST_USER.password)
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL(/.*game.*/, { timeout: 10000 })
  })

  test('shows error on invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.fill('[name="email"]', 'invalid@test.com')
    await page.fill('[name="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    await expect(page.getByText(/invalid/i)).toBeVisible({ timeout: 5000 })
  })
})
