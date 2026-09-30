import { expect, test } from '@playwright/test';

test('renders the builder shell', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('main')).toBeVisible();
  await expect(page.getByText('DropUI')).toBeVisible();
});
