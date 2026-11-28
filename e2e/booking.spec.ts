import { expect, test } from '@playwright/test';

test('demo patient signs in and books a real slot', async ({ page }) => {
  await page.goto('/auth');
  await page.getByRole('button', { name: /enter as demo patient/i }).click();
  await page.waitForURL((url) => !url.pathname.includes('/auth'));

  await page.goto('/doctors');
  await expect(page.getByText('Dr. Sarah Johnson')).toBeVisible();
  await page.getByRole('button', { name: 'Book', exact: true }).first().click();

  await expect(page.getByText('Step 2 / reason for visit')).toBeVisible();
  await page.locator('div.grid.grid-cols-3 button').first().click();
  await page.getByLabel('What should the doctor know?').fill('E2E booking check');
  await page.getByRole('button', { name: /confirm appointment/i }).click();

  await expect(page.getByText('Appointment held.')).toBeVisible();
});
