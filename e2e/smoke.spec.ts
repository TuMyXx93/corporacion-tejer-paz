import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Corporación Tejer Paz — Smoke & Accessibility', () => {
  test('Inicio renders with valid H1, working mission anchor, clickable contact, and zero serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Construyendo Paz y Reconciliación');

    // No horizontal overflow
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);

    // Fixed anchor target exists
    await expect(page.locator('#nuestra-mision')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]')).toBeVisible();
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();

    const axe = await new AxeBuilder({ page }).analyze();
    const blocking = axe.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking).toEqual([]);
  });

  test('Proyectos renders with real H1, visible project descriptions, and zero serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/proyectos');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText('Iniciativas Actuales');
    await expect(
      page.getByText('Fomentar espacios protectores a partir del diálogo')
    ).toBeVisible();

    const axe = await new AxeBuilder({ page }).analyze();
    const blocking = axe.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking).toEqual([]);
  });

  test('Admin route redirects unauthenticated visitors to /admin/login', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Panel Administrativo');
  });

  test('Protected admin API rejects unauthenticated requests cleanly', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/users');
    expect([401, 503]).toContain(response.status());
  });
});
