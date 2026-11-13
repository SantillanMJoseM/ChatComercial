import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const ADMIN_PASS = 'ChangeMeF0!2026';
const ROUTES = [
  '/dashboard','/clients','/ai','/knowledge','/automations','/reports','/users','/help','/integrations','/settings',
];

test('axe audit', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  for (const r of ROUTES) {
    await page.goto(r);
    await page.waitForTimeout(500);
    const results = await new AxeBuilder({ page }).analyze();
    console.log(`AXE ${r}: violations=${results.violations.length}`);
    for (const v of results.violations) {
      console.log(`  - ${v.id}: ${v.description} (nodes: ${v.nodes.length})`);
    }
  }
});
