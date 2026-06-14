import { Page, expect } from '@playwright/test';

const EDITOR_LOAD_TIMEOUT = 15000;
const BLOCK_UPDATE_DELAY = 4000;

export class PageEditorHelper {
  constructor(private page: Page) {}

  async waitForEditorLoad() {
    await this.page.waitForSelector('.blocknote-editor-container', {
      state: 'visible',
      timeout: EDITOR_LOAD_TIMEOUT,
    });
    await this.page.waitForSelector('[data-node-type="blockContainer"]', {
      state: 'visible',
      timeout: EDITOR_LOAD_TIMEOUT,
    });
    await this.page.waitForTimeout(1000);
  }

  getEditorContainer() {
    return this.page.locator('.blocknote-editor-container');
  }

  getBlocks() {
    return this.page.locator('[data-node-type="blockContainer"]');
  }

  getBlockByIndex(index: number) {
    return this.page.locator('[data-node-type="blockContainer"]').nth(index);
  }

  getBlockByText(text: string) {
    // Try blockContainer first, fall back to paragraph elements for nested content
    return this.page
      .locator('[data-node-type="blockContainer"], .bn-block-content, p[data-content-type], [role="textbox"] p')
      .filter({ hasText: text })
      .first();
  }

  async waitForBlockByText(text: string, timeoutMs: number = 15000) {
    const block = this.getBlockByText(text);
    await expect(block).toBeVisible({ timeout: timeoutMs });
  }

  async clickBlock(index: number) {
    const block = this.getBlockByIndex(index);
    await block.click();
    await this.page.waitForTimeout(200);
  }

  async clickBlockByText(text: string) {
    const block = this.getBlockByText(text);
    await expect(block).toBeVisible({ timeout: 15000 });
    await block.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(100);

    // Try to find contenteditable inside, otherwise click the block directly
    const editable = block.locator('[contenteditable="true"]').first();
    if (await editable.isVisible().catch(() => false)) {
      await editable.click();
    } else {
      await block.click();
    }
    await this.page.waitForTimeout(200);
  }

  async typeInBlock(text: string) {
    await this.page.keyboard.type(text);
    await this.page.waitForTimeout(200);
  }

  async pressEnter() {
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(300);
  }

  async pressBackspace() {
    await this.page.keyboard.press('Backspace');
    await this.page.waitForTimeout(200);
  }

  async pressTab() {
    await this.page.keyboard.press('Tab');
    await this.page.waitForTimeout(200);
  }

  async pressShiftTab() {
    await this.page.keyboard.press('Shift+Tab');
    await this.page.waitForTimeout(200);
  }

  async insertBlockWithSlashCommand(blockType: string) {
    await this.page.keyboard.type('/');
    await this.page.waitForTimeout(500);
    await this.page.waitForSelector(
      '[class*="suggestion"], [class*="menu"], [class*="dropdown"], [role="menu"], [role="listbox"]',
      {
        state: 'visible',
        timeout: 5000,
      }
    );
    await this.page.keyboard.type(blockType);
    await this.page.waitForTimeout(500);
    await this.page.keyboard.press('Enter');
    await this.page.waitForTimeout(500);
  }

  async selectAll() {
    const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';
    await this.page.keyboard.press(`${modifier}+a`);
    await this.page.waitForTimeout(100);
  }

  async deleteBlock(index: number) {
    const block = this.getBlockByIndex(index);
    await block.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(100);

    // Triple-click to select the entire paragraph (not the whole document)
    await block.click({ clickCount: 3 });
    await this.page.waitForTimeout(200);

    await this.pressBackspace();
    await this.pressBackspace();
    await this.page.waitForTimeout(500);
  }

  async deleteBlockByText(text: string) {
    const block = this.getBlockByText(text);
    await expect(block).toBeVisible({ timeout: 15000 });
    await block.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(100);

    // Triple-click to select the entire paragraph (not the whole document)
    await block.click({ clickCount: 3 });
    await this.page.waitForTimeout(200);

    await this.pressBackspace();
    await this.pressBackspace();
    await this.page.waitForTimeout(500);
  }

  async updateBlockText(oldText: string, newText: string) {
    // Find the paragraph/block containing the text
    const block = this.getBlockByText(oldText);
    await expect(block).toBeVisible({ timeout: 15000 });
    await block.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(100);

    // Triple-click to select the entire paragraph (not the whole document)
    await block.click({ clickCount: 3 });
    await this.page.waitForTimeout(200);

    // Type the new text to replace selected content
    await this.page.keyboard.type(newText);
    await this.page.waitForTimeout(200);
  }

  async getBlockText(index: number): Promise<string> {
    const block = this.getBlockByIndex(index);
    return await block.innerText();
  }

  async waitForSync(delayMs: number = BLOCK_UPDATE_DELAY) {
    await this.page.waitForTimeout(delayMs);
  }
}

export async function findOrCreateTestPage(page: Page): Promise<string> {
  if (page.url().includes('/pages/')) {
    const match = page.url().match(/\/pages\/([^/]+)/);
    if (match) return match[1];
  }

  if (!page.url().includes('dashboard') && !page.url().includes('pages')) {
    await page.goto('/dashboard/project');
    await page.waitForLoadState('networkidle');
  }

  const pagesLink = page.locator('a, [role="link"]').filter({ hasText: /^Pages$/ }).first();
  if (await pagesLink.isVisible().catch(() => false)) {
    await pagesLink.click();
    await page.waitForTimeout(2000);
  }

  let pageLinks = page.locator('a[href*="/pages/"]');
  let count = await pageLinks.count();

  if (count > 0) {
    const href = await pageLinks.first().getAttribute('href');
    if (href) {
      const match = href.match(/\/pages\/([^/]+)/);
      if (match) return match[1];
    }
  }

  const projectRow = page
    .locator('tr, [class*="project"]')
    .filter({ hasText: /EKMS|Test Project/i })
    .first();
  if (await projectRow.isVisible().catch(() => false)) {
    await projectRow.click();
    await page.waitForTimeout(2000);

    pageLinks = page.locator('a[href*="/pages/"]');
    count = await pageLinks.count();

    if (count > 0) {
      const href = await pageLinks.first().getAttribute('href');
      if (href) {
        const match = href.match(/\/pages\/([^/]+)/);
        if (match) return match[1];
      }
    }
  }

  const createButton = page.getByRole('button', { name: /create page|add page|new page/i }).first();
  if (await createButton.isVisible().catch(() => false)) {
    await createButton.click();
    await page.waitForTimeout(1000);

    const titleInput = page.getByLabel(/title|name/i).first();
    if (await titleInput.isVisible().catch(() => false)) {
      const timestamp = Date.now();
      await titleInput.fill(`E2E Test Page ${timestamp}`);

      const submitButton = page.getByRole('button', { name: /create|save|submit/i }).first();
      await submitButton.click();

      await page.waitForURL(/\/pages\//, { timeout: 15000 });
      const url = page.url();
      const match = url.match(/\/pages\/([^/]+)/);
      if (match) return match[1];
    }
  }

  throw new Error('Could not find or create a test page');
}
