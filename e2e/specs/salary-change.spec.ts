import { expect, test } from '@playwright/test';

test('HR can change an employee salary and the change persists', async ({
  page,
}) => {
  await page.goto('/employees/seed-employee-000501');
  await expect(page.getByText('EMP000501')).toBeVisible();
  await expect(
    page.getByRole('table', { name: 'Salary history' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Change salary' }).click();
  const dialog = page.getByRole('dialog', { name: 'Change salary' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel('Currency')).toHaveAttribute('readonly');
  await dialog.getByLabel('New annual salary').fill('325000');
  await dialog.getByLabel('Effective date').fill('2026-09-01');

  const salaryResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith('/api/employees/seed-employee-000501/salaries') &&
      response.request().method() === 'POST' &&
      response.status() === 201,
  );
  await dialog.getByRole('button', { name: 'Save change' }).click();
  await salaryResponse;

  await expect(page.getByText('Salary change saved.')).toBeVisible();
  await expect(page.getByText(/325,000\.00/).first()).toBeVisible();
  const history = page.getByRole('table', { name: 'Salary history' });
  const newSalaryRow = history.getByRole('row').filter({
    hasText: 'Sep 1, 2026',
  });
  await expect(newSalaryRow).toContainText(/325,000\.00/);
  await expect(newSalaryRow).toContainText('Current');

  await page.reload();

  await expect(page.getByText('EMP000501')).toBeVisible();
  await expect(page.getByText(/325,000\.00/).first()).toBeVisible();
  await expect(
    page
      .getByRole('table', { name: 'Salary history' })
      .getByRole('row')
      .filter({ hasText: 'Sep 1, 2026' }),
  ).toContainText(/325,000\.00/);
});
