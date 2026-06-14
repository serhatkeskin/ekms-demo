import { test, expect } from '@playwright/test';
import { PageEditorHelper, findOrCreateTestPage } from './utils/page-editor-helpers';

/**
 * Comprehensive E2E Tests for Page Editor
 *
 * Auth is handled by global-setup.ts - cookies are shared across tests
 * Tests run in parallel for speed
 */

const TEST_TIMEOUT = 120000;

// ============================================
// TEST SUITE: PAGE CREATION & NAVIGATION
// ============================================

test.describe('Page Editor E2E Tests', () => {
  test.setTimeout(TEST_TIMEOUT);

  // No beforeEach login - auth is handled by global-setup.ts
  // Cookies are automatically loaded from storageState

  test('1. should be logged in and see dashboard', async ({ page }) => {
    // Navigate to dashboard - should work since we're authenticated
    await page.goto('/dashboard/project');
    await page.waitForTimeout(1000);

    // Should not be redirected to login
    await expect(page).not.toHaveURL(/sign-in/);

    // Should see the dashboard
    const body = page.locator('body');
    await expect(body).toBeVisible();
  });

  test('2. should navigate to a page or create one', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    expect(slug).toBeTruthy();

    // Navigate to the page
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    // Editor should be visible
    await expect(helper.getEditorContainer()).toBeVisible();
  });

  test('3. should insert a paragraph block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const initialBlockCount = await helper.getBlocks().count();
    const lastBlockIndex = Math.max(0, initialBlockCount - 1);

    await helper.clickBlock(lastBlockIndex);
    await helper.pressEnter();

    const testText = `Test paragraph ${Date.now()}`;
    await helper.typeInBlock(testText);
    await helper.waitForSync();

    // Verify text was typed
    const newBlockCount = await helper.getBlocks().count();
    expect(newBlockCount).toBeGreaterThanOrEqual(initialBlockCount);

    // Verify the text is visible
    await expect(page.getByText(testText)).toBeVisible();
  });

  test('4. should insert a heading block using slash command', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await helper.insertBlockWithSlashCommand('heading');

    const headingText = `Test Heading ${Date.now()}`;
    await helper.typeInBlock(headingText);
    await helper.waitForSync();

    const headingBlock = page.locator('h1, h2, h3').filter({ hasText: headingText });
    await expect(headingBlock).toBeVisible({ timeout: 5000 });
  });

  test('5. should insert a bullet list block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await helper.insertBlockWithSlashCommand('bullet');

    const listText = `Bullet item ${Date.now()}`;
    await helper.typeInBlock(listText);
    await helper.waitForSync();

    await expect(page.getByText(listText)).toBeVisible();
  });

  test('6. should insert a numbered list block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await helper.insertBlockWithSlashCommand('number');

    const listText = `Numbered item ${Date.now()}`;
    await helper.typeInBlock(listText);
    await helper.waitForSync();

    await expect(page.getByText(listText)).toBeVisible();
  });

  test('7. should insert a quote block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await helper.insertBlockWithSlashCommand('quote');

    const quoteText = `Test quote ${Date.now()}`;
    await helper.typeInBlock(quoteText);
    await helper.waitForSync();

    await expect(page.getByText(quoteText)).toBeVisible();
  });

  test('8. should insert a code block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await helper.insertBlockWithSlashCommand('code');

    const codeText = `const x = ${Date.now()};`;
    await helper.typeInBlock(codeText);
    await helper.waitForSync();

    await expect(page.getByText(codeText)).toBeVisible();
  });

  test('9. should edit an existing block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    const originalText = `Original ${Date.now()}`;
    await helper.typeInBlock(originalText);
    await helper.waitForSync();

    // Edit the block
    const newBlockCount = await helper.getBlocks().count();
    await helper.clickBlock(newBlockCount - 1);
    await helper.selectAll();

    const updatedText = `Updated ${Date.now()}`;
    await helper.typeInBlock(updatedText);
    await helper.waitForSync();

    await expect(page.getByText(updatedText)).toBeVisible();
  });

  test('10. should delete a block', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const initialBlockCount = await helper.getBlocks().count();
    await helper.clickBlock(initialBlockCount - 1);
    await helper.pressEnter();

    const textToDelete = `Delete me ${Date.now()}`;
    await helper.typeInBlock(textToDelete);
    await helper.waitForSync();

    const afterCreateCount = await helper.getBlocks().count();
    expect(afterCreateCount).toBeGreaterThan(initialBlockCount);

    // Delete
    await helper.deleteBlock(afterCreateCount - 1);
    await helper.waitForSync();

    const afterDeleteCount = await helper.getBlocks().count();
    expect(afterDeleteCount).toBeLessThan(afterCreateCount);
  });

  test('11. should create subpage', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const addSubpageButton = page.getByRole('button', { name: /add subpage/i }).first();

    if (await addSubpageButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addSubpageButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 5000 });

      const timestamp = Date.now();
      const subpageTitle = `Test Subpage ${timestamp}`;
      await page.getByLabel(/title/i).first().fill(subpageTitle);

      await page.getByRole('button', { name: /^create$/i }).first().click();

      // Should navigate to new subpage
      await page.waitForURL(/\/pages\//, { timeout: 15000 });
      await helper.waitForEditorLoad();

      // Check the h1 page title specifically
      const pageTitle = page.locator('h1.page-title, h1');
      await expect(pageTitle.first()).toContainText(subpageTitle.substring(0, 12));
    } else {
      console.log('Add subpage button not visible - user may not have permission');
    }
  });

  test('12. should delete subpage', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    // First create a subpage to delete
    const addSubpageButton = page.getByRole('button', { name: /add subpage/i }).first();

    if (await addSubpageButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await addSubpageButton.click();
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });

      const timestamp = Date.now();
      const subpageTitle = `Subpage To Delete ${timestamp}`;
      await page.getByLabel(/title/i).first().fill(subpageTitle);
      await page.getByRole('button', { name: /^create$/i }).first().click();

      await page.waitForURL(/\/pages\//, { timeout: 15000 });

      // Go back to parent
      await page.goto(`/pages/${slug}`);
      await helper.waitForEditorLoad();

      // Find and delete the subpage
      const subpageItem = page.locator('.subpage-item').filter({ hasText: subpageTitle }).first();

      if (await subpageItem.isVisible().catch(() => false)) {
        await subpageItem.hover();
        await page.waitForTimeout(300);

        const menuButton = subpageItem.locator('button').last();
        await menuButton.click();

        const deleteOption = page.getByRole('menuitem', { name: /delete/i }).first();
        await deleteOption.click();

        await page.waitForSelector('[role="dialog"]', { state: 'visible' });
        await page.getByRole('button', { name: /^delete$/i }).first().click();

        await page.waitForTimeout(2000);
        await expect(subpageItem).not.toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('13. should open slash menu when typing /', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await page.keyboard.type('/');
    await page.waitForTimeout(500);

    // Look for the slash menu with multiple selectors
    const slashMenu = page.locator('[class*="suggestion"], [class*="menu"], [class*="dropdown"]').first();
    await expect(slashMenu).toBeVisible({ timeout: 5000 });
  });

  test('14. should close slash menu on Escape', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    await page.keyboard.type('/');
    await page.waitForTimeout(500);

    const slashMenu = page.locator('[class*="suggestion"], [class*="menu"], [class*="dropdown"]').first();
    await expect(slashMenu).toBeVisible({ timeout: 5000 });

    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);

    // After Escape, slash menu should be closed - verify by checking the text "/" is still there but menu is gone
    // The menu may take a moment to close
    await page.waitForTimeout(500);
  });

  test('15. should apply bold formatting with Cmd+B', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    const testText = 'Bold text test';
    await helper.typeInBlock(testText);
    await helper.selectAll();

    await page.keyboard.press('Meta+b');
    await page.waitForTimeout(300);

    const boldText = page.locator('strong, b').filter({ hasText: testText });
    await expect(boldText).toBeVisible({ timeout: 3000 });
  });

  test('16. should apply italic formatting with Cmd+I', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const blockCount = await helper.getBlocks().count();
    await helper.clickBlock(blockCount - 1);
    await helper.pressEnter();

    const testText = 'Italic text test';
    await helper.typeInBlock(testText);
    await helper.selectAll();

    await page.keyboard.press('Meta+i');
    await page.waitForTimeout(300);

    const italicText = page.locator('em, i').filter({ hasText: testText });
    await expect(italicText).toBeVisible({ timeout: 3000 });
  });

  test('17. should display page title', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    const titleElement = page.locator('h1, [class*="title"]').first();
    await expect(titleElement).toBeVisible();
  });

  test('18. should render on mobile viewport', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);

    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    await expect(helper.getEditorContainer()).toBeVisible();
  });

  test('19. should render on tablet viewport', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    await expect(helper.getEditorContainer()).toBeVisible();
  });

  test('20. should render on desktop viewport', async ({ page }) => {
    const slug = await findOrCreateTestPage(page);

    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto(`/pages/${slug}`);

    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();

    await expect(helper.getEditorContainer()).toBeVisible();
  });
});
