import { expect, test } from '@playwright/test';

test('HR can search for an employee and open their details', async ({
  page,
}) => {
  await page.goto('/employees');
  await expect(page.getByRole('heading', { name: 'Employees' })).toBeVisible();

  const searchResponse = page.waitForResponse((response) => {
    const url = new URL(response.url());

    return (
      url.pathname === '/api/employees' &&
      url.searchParams.get('search') === 'EMP000500' &&
      response.status() === 200
    );
  });

  await page
    .getByRole('searchbox', { name: 'Search employees' })
    .fill('EMP000500');
  await searchResponse;

  const employeeRow = page.getByRole('row').filter({ hasText: 'EMP000500' });
  await expect(employeeRow).toBeVisible();
  const employeeLink = employeeRow.getByRole('link');
  const employeeName = (await employeeLink.innerText()).trim();
  expect(employeeName).not.toBe('');

  await employeeLink.click();

  await expect(page).toHaveURL(/\/employees\/seed-employee-000500$/);
  await expect(page.getByRole('heading', { name: employeeName })).toBeVisible();
  await expect(page.getByText('EMP000500')).toBeVisible();
  await expect(
    page.getByRole('heading', { name: 'Employee information' }),
  ).toBeVisible();
});
