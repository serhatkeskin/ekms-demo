import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration for EKMS Frontend E2E Tests
 *
 * Uses shared authentication state across tests to enable parallel execution
 */

export default defineConfig({
  testDir: './e2e',

  // Enable parallel execution - sessions are reused so no login conflicts
  fullyParallel: true,
  globalSetup: './e2e/global-setup.ts',

  forbidOnly: !!process.env.CI,

  // No retries - stop on first failure
  retries: 0,

  // Multiple workers for parallel execution
  workers: process.env.CI ? 2 : 4,

  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['list'],
  ],

  timeout: 120000,

  expect: {
    timeout: 15000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://ekms.localhost',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    actionTimeout: 15000,
  },

  projects: [
    // Main tests - use shared auth state
    {
      name: 'page-editor',
      testMatch: /page-editor(-nested)?\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        // Use stored auth state from setup
        storageState: 'playwright/.auth/user.json',
      },
    },
    {
      name: 'chromium',
      testIgnore: [/page-editor(-nested)?\.spec\.ts/, /global-setup\.ts/],
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
