import { test, expect } from '@playwright/test';

const ADMIN_PASS = 'ChangeMeF0!2026';
const ROUTES = [
  '/dashboard','/clients','/contacts','/segments','/whatsapp-groups','/conversations','/assignments','/operators','/teams','/metrics',
  '/ai','/ai/playground','/knowledge','/skills','/ai/audit','/ai/feedback','/ai/metrics',
  '/automations','/automations/builder','/automations/supervision',
  '/reports','/users','/integrations','/settings','/system','/profile','/help','/notifications',
];
const VIEWPORTS = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 1366, height: 768, name: 'notebook' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 390, height: 844, name: 'mobile' },
];

for (const vp of VIEWPORTS) {
  test(`responsive ${vp.name} (${vp.width}x${vp.height})`, async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@cap.local');
    await page.fill('input[type="password"]', ADMIN_PASS);
    await page.click('button:has-text("Ingresar")');
    await page.waitForURL('**/dashboard');
    for (const r of ROUTES) {
      await page.goto(r);
      await page.waitForTimeout(400);
      // check horizontal overflow
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 5);
      expect(overflow, `${r} has horizontal overflow at ${vp.width}`).toBe(false);
  // screenshot skipped for speed
    }
  });
}
