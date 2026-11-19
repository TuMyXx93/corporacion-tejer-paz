import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Corporación Tejer Paz — Smoke, Responsiveness & Accessibility', () => {
  test('Inicio renders with valid H1, working mission anchor, clickable contact, and zero serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(
      /Construyendo paz y reconciliaci[oó]n/i
    );

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);

    await expect(page.locator('#nuestra-mision')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
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
    await expect(page.locator('h1')).toContainText(/Iniciativas actuales/i);
    await expect(
      page.getByText('Fomentar espacios protectores a partir del diálogo')
    ).toBeVisible();

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);

    const axe = await new AxeBuilder({ page }).analyze();
    const blocking = axe.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking).toEqual([]);
  });

  test('Admin route redirects unauthenticated visitors to /admin/login with zero serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/admin\/login/);
    await expect(page.locator('h1')).toContainText('Panel Administrativo');

    const axe = await new AxeBuilder({ page }).analyze();
    const blocking = axe.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blocking).toEqual([]);
  });

  test('Zero horizontal overflow at 360x800 compact mobile viewport', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 800 });

    for (const route of ['/', '/proyectos', '/admin/login']) {
      await page.goto(route);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth
      );
      expect(overflow, `Overflow detected on ${route} at 360px`).toBe(false);
    }
  });

  test('Protected admin API rejects unauthenticated requests cleanly', async ({
    request,
  }) => {
    const response = await request.get('/api/admin/users');
    expect([401, 503]).toContain(response.status());
  });

  test('CSP allows Vercel Blob client upload endpoints and privacy video iframes', async ({
    request,
  }) => {
    const response = await request.get('/');
    const csp = response.headers()['content-security-policy'] ?? '';
    expect(csp).toContain('connect-src');
    expect(csp).toContain('https://vercel.com/api/blob');
    expect(csp).toContain('https://vercel.com/api/blob/');
    expect(csp).toContain('https://*.public.blob.vercel-storage.com');
    expect(csp).toContain('frame-src');
    expect(csp).toContain('https://www.youtube-nocookie.com');
    expect(csp).toContain('https://player.vimeo.com');
  });
});
