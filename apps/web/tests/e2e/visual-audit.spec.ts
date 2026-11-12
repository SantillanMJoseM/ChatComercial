import { test } from '@playwright/test';

const ADMIN_PASS = 'ChangeMeF0!2026';
const ROUTES = [
  '/dashboard','/clients','/contacts','/segments','/whatsapp-groups','/conversations','/assignments','/operators','/teams','/metrics',
  '/ai','/ai/playground','/knowledge','/skills','/ai/audit','/ai/feedback','/ai/metrics',
  '/automations','/automations/builder','/automations/supervision',
  '/reports','/users','/integrations','/settings','/system','/profile','/help','/notifications',
];

test('visual audit all routes', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'admin@cap.local');
  await page.fill('input[type="password"]', ADMIN_PASS);
  await page.click('button:has-text("Ingresar")');
  await page.waitForURL('**/dashboard');
  for (const r of ROUTES) {
    await page.goto(r);
    await page.waitForTimeout(800);
    await page.screenshot({ path: `test-results/audit-${r.replace(/\//g,'_')}.png`, fullPage: true });
  }
});
