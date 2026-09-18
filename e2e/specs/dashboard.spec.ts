import { expect, test } from '@playwright/test';

test('HR can filter compensation insights by country and department', async ({
  page,
}) => {
  await page.goto('/dashboard');
  await expect(
    page.getByRole('heading', { name: 'Compensation insights' }),
  ).toBeVisible();

  const summary = page.getByRole('region', { name: 'Organization summary' });
  const headcountCard = summary.getByText('Headcount').locator('..');
  await expect(headcountCard).toContainText('501 employees');
  await expect(page.getByRole('heading', { name: 'AED' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'USD' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /global average salary/i }),
  ).toHaveCount(0);

  const countrySummaryResponse = waitForSummary(page, {
    country: 'AE',
  });
  await page.getByRole('combobox', { name: 'Country' }).selectOption('AE');
  await countrySummaryResponse;
  await expect(headcountCard).not.toContainText('501 employees');
  await expect(
    page.getByText('Departments in United Arab Emirates.'),
  ).toBeVisible();

  const combinedSummaryResponse = waitForSummary(page, {
    country: 'AE',
    department: 'Engineering',
  });
  await page
    .getByRole('combobox', { name: 'Department' })
    .selectOption('Engineering');
  await combinedSummaryResponse;
  await expect(page.getByRole('combobox', { name: 'Department' })).toHaveValue(
    'Engineering',
  );
  await expect(page.getByText('Countries within Engineering.')).toBeVisible();
  await expect(
    page.getByText("We couldn't load compensation insights."),
  ).toHaveCount(0);

  await page.getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.getByRole('combobox', { name: 'Country' })).toHaveValue('');
  await expect(page.getByRole('combobox', { name: 'Department' })).toHaveValue(
    '',
  );
  await expect(headcountCard).toContainText('501 employees');
});

function waitForSummary(
  page: import('@playwright/test').Page,
  filters: { country?: string; department?: string },
) {
  return page.waitForResponse((response) => {
    const url = new URL(response.url());

    return (
      url.pathname === '/api/analytics/summary' &&
      (url.searchParams.get('country') ?? undefined) === filters.country &&
      (url.searchParams.get('department') ?? undefined) ===
        filters.department &&
      response.status() === 200
    );
  });
}
