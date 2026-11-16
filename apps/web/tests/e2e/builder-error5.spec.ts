import { test } from '@playwright/test';
test('builder error5', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', 'ChangeMeF0!2026');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  await page.goto('/automations/builder');
  await page.waitForTimeout(3000);
  console.log('ERRORS:', JSON.stringify(errors));
});
