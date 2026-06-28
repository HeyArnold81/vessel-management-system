import { expect, test } from '@playwright/test';

test('loads the vessel operations dashboard', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Vessel Management System' })).toBeVisible();
  await expect(page.getByText("Today's movement board")).toBeVisible();
  await expect(page.getByText('Berth conflicts')).toBeVisible();
});
