import { test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('axe detail4', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', 'ChangeMeF0!2026');
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  for (const r of ['/ai','/knowledge','/reports']) {
    await page.goto(r);
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    for (const v of results.violations) {
      if (v.id === 'heading-order' || v.id === 'label' || v.id === 'select-name') {
        for (const n of v.nodes) console.log(r, v.id, '::', n.html?.slice(0,120));
      }
    }
  }
});
