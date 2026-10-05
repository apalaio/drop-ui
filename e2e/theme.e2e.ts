import { expect, Locator, Page, test } from '@playwright/test';

async function openThemeList(page: Page): Promise<void> {
  await page.getByRole('banner').getByRole('button', { name: 'Change theme' }).click();
}

function theme(page: Page, name: string): Locator {
  return page.getByRole('menuitemradio', { name, exact: true });
}

function background(locator: Locator): Promise<string> {
  return locator.evaluate((element) => getComputedStyle(element).backgroundColor);
}

test('starts in the fantasy theme', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'fantasy');
});

test('opens the theme list scrolled to the current theme', async ({ page }) => {
  await page.goto('/');

  await openThemeList(page);

  await expect(theme(page, 'fantasy')).toBeChecked();
  await expect(theme(page, 'fantasy')).toBeInViewport();
});

test('picking a theme restyles the whole app', async ({ page }) => {
  await page.goto('/');
  const header = page.getByRole('banner');
  const main = page.getByRole('main');
  const headerBefore = await background(header);
  const mainBefore = await background(main);

  await openThemeList(page);
  await theme(page, 'dracula').click();

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
  expect(await background(header)).not.toBe(headerBefore);
  expect(await background(main)).not.toBe(mainBefore);
});

test('a picked theme also restyles overlays rendered outside the app root', async ({ page }) => {
  await page.goto('/');
  const themeList = page.getByRole('menu', { name: 'Themes' });
  await openThemeList(page);
  const themeListBefore = await background(themeList);
  await theme(page, 'dracula').click();

  await openThemeList(page);

  await expect(theme(page, 'dracula')).toBeChecked();
  expect(await background(themeList)).not.toBe(themeListBefore);
});
