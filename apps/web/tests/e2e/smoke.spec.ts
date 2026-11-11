import { test, expect } from '@playwright/test';

const ADMIN_PASS = 'ChangeMeF0!2026';

test('login page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByText('Iniciar sesión')).toBeVisible();
});

test('admin login and dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  await expect(page.getByText('Estado API')).toBeVisible();
});

test('protected route redirects unauthenticated', async ({ page }) => {
  await page.goto('/clients');
  await page.waitForURL('**/login');
});

test('knowledge page loads', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  await page.goto('/knowledge');
  await expect(page.getByText('Colecciones')).toBeVisible();
});
