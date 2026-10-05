import { expect, Locator, Page, test } from '@playwright/test';

interface Point {
  x: number;
  y: number;
}

async function centerOf(locator: Locator): Promise<Point> {
  const box = await locator.boundingBox();
  if (!box) throw new Error('Drag source or target is not visible');
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function dragBetween(page: Page, from: Point, to: Point): Promise<void> {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(from.x + 10, from.y, { steps: 5 });
  await page.mouse.move(to.x, to.y, { steps: 20 });
  await page.mouse.up();
}

async function drag(page: Page, source: Locator, target: Locator): Promise<void> {
  await dragBetween(page, await centerOf(source), await centerOf(target));
}

function cell(canvas: Locator, row: number, column: number): Locator {
  return canvas.getByRole('group', { name: `Row ${row}, column ${column}`, exact: true });
}

async function setColumns(page: Page, columns: number): Promise<void> {
  const columnsInput = page
    .getByRole('complementary', { name: 'Sidebar' })
    .getByRole('spinbutton', { name: 'Grid columns' });

  await columnsInput.fill(String(columns));
  await columnsInput.blur();
  await expect(page.getByRole('region', { name: 'Canvas' }).getByTestId('canvas-cell')).toHaveCount(columns);
}

test('drops a text input, a textfield and a datepicker from the palette onto the canvas', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Sidebar' });
  const canvas = page.getByRole('region', { name: 'Canvas' });

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Text input' }), canvas);
  await expect(canvas.getByTestId('dropped-text-input')).toHaveCount(1);

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Textfield' }), canvas);
  await expect(canvas.getByTestId('dropped-textfield')).toHaveCount(1);

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Datepicker' }), canvas);
  await expect(canvas.getByTestId('dropped-datepicker')).toHaveCount(1);

  const types = await canvas.locator('[data-element-type]').evaluateAll((wrappers) =>
    wrappers.map((wrapper) => wrapper.getAttribute('data-element-type')),
  );
  expect(types.sort()).toEqual(['datepicker', 'text-input', 'textfield']);
});

test('edits the placeholder of a dropped text input through its actions menu', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Sidebar' });
  const canvas = page.getByRole('region', { name: 'Canvas' });

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Text input' }), canvas);
  const input = canvas.getByTestId('dropped-text-input');
  await expect(input).toHaveAttribute('placeholder', 'enter text');

  await canvas.getByRole('button', { name: 'Element actions' }).click();
  await page.getByRole('menuitem', { name: 'Edit text' }).click();

  const dialog = page.getByRole('dialog', { name: 'Edit text' });
  await dialog.getByRole('textbox', { name: 'Text' }).fill('Your name');
  await dialog.getByRole('button', { name: 'Save' }).click();

  await expect(dialog).toBeHidden();
  await expect(input).toHaveAttribute('placeholder', 'Your name');
  await expect(input).toHaveValue('');
});

test('lets the user work inside a dropped text input without dragging the element', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Sidebar' });
  const canvas = page.getByRole('region', { name: 'Canvas' });
  await setColumns(page, 2);

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Text input' }), cell(canvas, 1, 1));
  const input = cell(canvas, 1, 1).getByTestId('dropped-text-input');
  await expect(input).toHaveCount(1);

  await input.click();
  await page.keyboard.type('hello');
  await expect(input).toHaveValue('hello');

  await drag(page, input, cell(canvas, 1, 2));

  await expect(cell(canvas, 1, 1).getByTestId('dropped-text-input')).toHaveCount(1);
  await expect(cell(canvas, 1, 2).getByText('Drop elements here')).toBeVisible();
});

test('moves a dropped text input to another cell when dragged by its wrapper', async ({ page }) => {
  await page.goto('/');
  const palette = page.getByRole('complementary', { name: 'Sidebar' });
  const canvas = page.getByRole('region', { name: 'Canvas' });
  await setColumns(page, 2);

  await drag(page, palette.getByRole('listitem').filter({ hasText: 'Text input' }), cell(canvas, 1, 1));
  await expect(cell(canvas, 1, 1).getByTestId('dropped-text-input')).toHaveCount(1);

  const wrapper = await cell(canvas, 1, 1).locator('[data-element-type="text-input"]').boundingBox();
  if (!wrapper) throw new Error('Dropped text input is not visible');
  const besideTheControl = { x: wrapper.x + wrapper.width - 16, y: wrapper.y + wrapper.height - 8 };

  await dragBetween(page, besideTheControl, await centerOf(cell(canvas, 1, 2)));

  await expect(cell(canvas, 1, 2).getByTestId('dropped-text-input')).toHaveCount(1);
  await expect(cell(canvas, 1, 1).getByTestId('dropped-text-input')).toHaveCount(0);
});
