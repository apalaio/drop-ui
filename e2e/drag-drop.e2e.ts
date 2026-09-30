import { expect, Locator, Page, test } from '@playwright/test';

/** CDK drag needs real, incremental pointer movement past its drag threshold — `dragTo` jumps too far at once. */
async function drag(page: Page, source: Locator, target: Locator): Promise<void> {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Drag source or target is not visible');

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(from.x + from.width / 2 + 10, from.y + from.height / 2, { steps: 5 });
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 20 });
  await page.mouse.up();
}

test('drops a div and a span from the palette onto the canvas', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Element palette' });
  const canvas = page.getByRole('region', { name: 'Canvas' });

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Div' }), canvas);
  await expect(canvas.getByTestId('dropped-div')).toHaveCount(1);

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Span' }), canvas.getByTestId('dropped-div'));
  await expect(canvas.getByTestId('dropped-span')).toHaveCount(1);

  const types = await canvas.locator('[data-element-type]').evaluateAll((wrappers) =>
    wrappers.map((wrapper) => wrapper.getAttribute('data-element-type')),
  );
  expect(types.sort()).toEqual(['div', 'span']);
});

test('edits the text of a dropped element through its actions menu', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Element palette' });
  const canvas = page.getByRole('region', { name: 'Canvas' });

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Div' }), canvas);
  const div = canvas.getByTestId('dropped-div');
  await expect(div).toHaveText('enter text');

  await canvas.getByRole('button', { name: 'Element actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit text' }).click();

  const dialog = page.getByRole('dialog', { name: 'Edit text' });
  await dialog.getByRole('textbox', { name: 'Text' }).fill('Hello world');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();
  await expect(div).toHaveText('Hello world');
  await expect(canvas.getByTestId('dropped-div')).toHaveCount(1);
});

test('deletes a dropped element through its actions menu after confirming', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Element palette' });
  const canvas = page.getByRole('region', { name: 'Canvas' });

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Div' }), canvas);
  await expect(canvas.getByTestId('dropped-div')).toHaveCount(1);

  const openDeleteDialog = async () => {
    await canvas.getByRole('button', { name: 'Element actions' }).click();
    await page.getByRole('menuitem', { name: 'Delete element' }).click();
    return page.getByRole('dialog', { name: 'Delete element' });
  };

  await (await openDeleteDialog()).getByRole('button', { name: 'Cancel' }).click();
  await expect(canvas.getByTestId('dropped-div')).toHaveCount(1);

  await (await openDeleteDialog()).getByRole('button', { name: 'Delete' }).click();
  await expect(canvas.getByTestId('dropped-div')).toHaveCount(0);
  await expect(canvas.getByText('Drop elements here')).toBeVisible();
});
