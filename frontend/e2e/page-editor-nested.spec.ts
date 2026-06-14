import { test, expect } from '@playwright/test';
import { PageEditorHelper, findOrCreateTestPage } from './utils/page-editor-helpers';
import { v4 as uuidv4 } from 'uuid';

const TEST_TIMEOUT = 180000;

test.describe.serial('Page Editor Nested Structure E2E', () => {
  test.setTimeout(TEST_TIMEOUT);

  let slug = '';
  let timestamp = 0;
  let parentTexts: string[] = [];
  let childTexts: string[] = [];
  let grandchildTexts: string[] = [];
  let insertedParent = '';
  let insertedChild = '';
  let insertedGrandchild = '';
  let updatedParent = '';
  let updatedChild = '';
  let updatedGrandchild = '';
  let deletedParent = '';
  let deletedChild = '';
  let deletedGrandchild = '';
  let deletedParentChildren: string[] = [];
  let deletedParentGrandchildren: string[] = [];
  let deletedChildGrandchildren: string[] = [];

  async function openEditor(page: any) {
    if (!slug) {
      throw new Error('Slug should have been set by the setup test');
    }
    await page.goto(`/pages/${slug}`);
    const helper = new PageEditorHelper(page);
    await helper.waitForEditorLoad();
    return helper;
  }

  test('0. setup: create unique test page', async ({ page }) => {
    // 1. Navigate to pages listing
    await page.goto('/pages');
    await page.waitForLoadState('networkidle');

    // 2. Open page creation modal
    const createButton = page.getByRole('button', { name: /new page/i }).first();
    await expect(createButton).toBeVisible();
    await createButton.click();
    await page.waitForTimeout(1000);

    // 3. Fill unique title
    const titleInput = page.getByLabel(/title|name/i).first();
    await expect(titleInput).toBeVisible();
    const uniqueTitle = `Nested E2E ${uuidv4()}`;
    await titleInput.fill(uniqueTitle);

    // 4. Submit
    const submitButton = page.getByRole('button', { name: /create|save|submit/i }).first();
    await submitButton.click();

    // 5. Wait for redirection and capture slug
    await page.waitForURL(/\/pages\//, { timeout: 15000 });
    const url = page.url();
    const match = url.match(/\/pages\/([^/]+)/);
    if (match) {
      slug = match[1];
      console.log(`Created test page: ${uniqueTitle} (slug: ${slug})`);
    } else {
      throw new Error('Failed to capture slug from URL after page creation');
    }
  });

  test('1. create 3x3x3 nested structure', async ({ page }) => {
    const helper = await openEditor(page);

    const initialBlockCount = await helper.getBlocks().count();
    await helper.clickBlock(Math.max(0, initialBlockCount - 1));
    await helper.pressEnter();

    timestamp = Date.now();
    parentTexts = [];
    childTexts = [];
    grandchildTexts = [];

    for (let p = 1; p <= 3; p++) {
      const parentText = `Parent ${p} ${timestamp}`;
      parentTexts.push(parentText);
      await helper.typeInBlock(parentText);
      await helper.waitForSync(300);
      await helper.pressEnter();
      await helper.pressTab();

      for (let c = 1; c <= 3; c++) {
        const childText = `Parent ${p} Child ${c} ${timestamp}`;
        childTexts.push(childText);
        await helper.typeInBlock(childText);
        await helper.waitForSync(300);
        await helper.pressEnter();
        await helper.pressTab();

        for (let g = 1; g <= 3; g++) {
          const grandchildText = `Parent ${p} Child ${c} Grandchild ${g} ${timestamp}`;
          grandchildTexts.push(grandchildText);
          await helper.typeInBlock(grandchildText);
          await helper.waitForSync(300);
          if (g < 3) {
            await helper.pressEnter();
          }
        }

        await helper.pressEnter();
        await helper.pressShiftTab();

        if (c === 3) {
          await helper.pressShiftTab();
        }
      }
    }

    await helper.waitForSync(1500);
  });

  test('2. insert parent, child, and grandchild', async ({ page }) => {
    const helper = await openEditor(page);
    await page.reload({ waitUntil: 'networkidle' });
    await helper.waitForEditorLoad();
    await helper.waitForBlockByText(parentTexts[2], 20000);

    insertedParent = `Inserted Parent ${timestamp}`;
    insertedChild = `Inserted Child ${timestamp}`;
    insertedGrandchild = `Inserted Grandchild ${timestamp}`;

    await helper.clickBlockByText(parentTexts[2]);
    await helper.pressEnter();
    await helper.typeInBlock(insertedParent);
    await helper.waitForSync(800);

    await helper.clickBlockByText(parentTexts[0]);
    await helper.pressEnter();
    await helper.pressTab();
    await helper.typeInBlock(insertedChild);
    await helper.waitForSync(800);

    await helper.clickBlockByText(childTexts[0]);
    await helper.pressEnter();
    await helper.pressTab();
    await helper.typeInBlock(insertedGrandchild);
    await helper.waitForSync(800);
  });

  test('3. update parent, child, and grandchild', async ({ page }) => {
    const helper = await openEditor(page);

    updatedParent = `Parent 1 Updated ${timestamp}`;
    updatedChild = `Parent 1 Child 2 Updated ${timestamp}`;
    updatedGrandchild = `Parent 3 Child 1 Grandchild 1 Updated ${timestamp}`;

    await helper.updateBlockText(parentTexts[0], updatedParent);
    await helper.waitForSync(800);
    await helper.updateBlockText(childTexts[1], updatedChild);
    await helper.waitForSync(800);
    await helper.updateBlockText(grandchildTexts[18], updatedGrandchild);
    await helper.waitForSync(800);

    await helper.waitForSync(5500); // waits for 5.5 seconds
  });

  test('4. delete parent, child, and grandchild', async ({ page }) => {
    const helper = await openEditor(page);

    deletedParent = parentTexts[1];
    deletedChild = childTexts[7];
    deletedGrandchild = grandchildTexts[2];
    deletedParentChildren = childTexts.slice(3, 6);
    deletedParentGrandchildren = grandchildTexts.slice(9, 18);
    deletedChildGrandchildren = grandchildTexts.slice(21, 24);

    await helper.deleteBlockByText(deletedGrandchild);
    await helper.waitForSync(800);
    await helper.deleteBlockByText(deletedChild);
    await helper.waitForSync(800);
    await helper.deleteBlockByText(deletedParent);
    await helper.waitForSync(800);

    await helper.waitForSync(5500); // waits for 5.5 seconds
  });

  test('5. refresh and verify persistence', async ({ page }) => {
    const helper = await openEditor(page);

    await helper.waitForSync(1500);
    await page.reload({ waitUntil: 'networkidle' });
    await helper.waitForEditorLoad();

    const expectedVisible = [
      ...parentTexts.filter((text) => text !== deletedParent && text !== parentTexts[0]),
      ...childTexts.filter(
        (text) =>
          text !== deletedChild &&
          text !== childTexts[1] &&
          !deletedParentChildren.includes(text)
      ),
      ...grandchildTexts.filter(
        (text) =>
          text !== deletedGrandchild &&
          text !== grandchildTexts[18] &&
          !deletedParentGrandchildren.includes(text) &&
          !deletedChildGrandchildren.includes(text)
      ),
      insertedParent,
      insertedChild,
      insertedGrandchild,
      updatedParent,
      updatedChild,
      updatedGrandchild,
    ];

    for (const text of expectedVisible) {
      await expect(page.getByText(text)).toBeVisible({ timeout: 5000 });
    }

    await expect(page.getByText(deletedParent)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(deletedChild)).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(deletedGrandchild)).not.toBeVisible({ timeout: 5000 });
  });
});
