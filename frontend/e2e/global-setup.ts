import { chromium, FullConfig } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const AUTH_FILE = path.join('playwright', '.auth', 'user.json');
const TEST_USER = { username: 'a', password: 'a' };

const DASHBOARD_PATH = '/dashboard/project';
const LOGIN_PATH = '/authentication/sign-in';

export default async function globalSetup(config: FullConfig) {
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const baseURL = config.projects[0]?.use?.baseURL || 'http://ekms.localhost';
  const browser = await chromium.launch();

  try {
    if (fs.existsSync(AUTH_FILE)) {
      const context = await browser.newContext({ storageState: AUTH_FILE, baseURL });
      const page = await context.newPage();

      await page.goto(DASHBOARD_PATH);
      await page.waitForTimeout(1500);

      if (!page.url().includes('sign-in') && !page.url().includes('authentication')) {
        console.log('Using existing valid auth state');
        await context.close();
        return;
      }

      await context.close();
    }

    console.log('Performing fresh login...');

    const context = await browser.newContext({ baseURL });
    const page = await context.newPage();

    await page.goto(LOGIN_PATH);
    await page.waitForLoadState('networkidle');

    await page.getByLabel(/username/i).fill(TEST_USER.username);
    await page.getByLabel(/password/i).fill(TEST_USER.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL(/dashboard|pages|projects/, { timeout: 30000 });
    if (page.url().includes('sign-in') || page.url().includes('authentication')) {
      throw new Error('Login failed, still on sign-in page');
    }

    console.log('Login successful, saving auth state');
    await context.storageState({ path: AUTH_FILE });
    await context.close();
  } finally {
    await browser.close();
  }
}
