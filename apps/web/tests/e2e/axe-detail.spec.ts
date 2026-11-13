import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe detail dashboard', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', 'ChangeMeF0!2026');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  const results = await new AxeBuilder({ page }).analyze();
  for (const v of results.violations) {
    if (v.id === 'color-contrast') {
      for (const n of v.nodes) {
        console.log('NODE:', n.html);
        console.log('FG:', n.any?.[0]?.data?.contrastRatio, 'BG:', n.any?.[0]?.data?.expectedContrastRatio);
      }
    }
  }
});
