import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Corporación Tejer Paz — Smoke, Responsiveness & Accessibility', () => {
  test('Inicio renders adaptive glass navbar, clean editorial sections, footer without Inicio, and zero serious a11y issues', async ({
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

    // Hero banner starts cleanly below the fixed header without horizontal clipping
    const header = page.locator('header');
    const bannerBox = await page.getByTestId('hero-banner').boundingBox();
    const headerBox = await header.boundingBox();
    const viewportWidth = page.viewportSize()?.width ?? 1440;
    expect(bannerBox).not.toBeNull();
    expect(headerBox).not.toBeNull();
    if (bannerBox && headerBox) {
      expect(bannerBox.y).toBeGreaterThanOrEqual(headerBox.height - 1);
      expect(bannerBox.width).toBeLessThanOrEqual(viewportWidth);
    }

    // Header navigation excludes "Inicio" and includes the 4 unified links (desktop or via mobile menu)
    const mobileMenuButton = header.getByRole('button', { name: /abrir menú/i });
    const isMobileHeader = await mobileMenuButton.isVisible();
    if (isMobileHeader) {
      await mobileMenuButton.click();
    }
    await expect(header.getByRole('link', { name: 'Inicio', exact: true })).toHaveCount(
      0
    );
    await expect(header.getByRole('link', { name: 'Misión' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Áreas' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Proyectos' })).toBeVisible();
    await expect(header.getByRole('link', { name: 'Contáctanos' })).toBeVisible();
    if (isMobileHeader) {
      await header.getByRole('button', { name: /cerrar menú/i }).click();
    }

    // Removed redundant eyebrow pills
    await expect(page.getByText('Propósito Territorial')).toHaveCount(0);
    await expect(page.getByText('Tejido en el Territorio')).toHaveCount(0);
    await expect(page.getByText('Alianzas y Escucha')).toHaveCount(0);

    await expect(page.locator('#nuestra-mision')).toBeVisible();
    await expect(page.locator('a[href^="mailto:"]').first()).toBeVisible();
    await expect(page.locator('a[href^="tel:"]').first()).toBeVisible();

    // Footer excludes "Inicio" and renders scalable icon link for Instagram
    const footer = page.locator('footer');
    await expect(footer.getByRole('link', { name: 'Inicio', exact: true })).toHaveCount(
      0
    );
    await expect(footer.locator('a[aria-label^="Instagram"]')).toBeVisible();

    // Axe check in initial top position (dark hero glass navbar)
    const axeTop = await new AxeBuilder({ page }).analyze();
    const blockingTop = axeTop.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blockingTop).toEqual([]);

    // Scroll to light section so adaptive header switches to light glass and verify a11y again
    await page.locator('#nuestra-mision').scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const axeScrolled = await new AxeBuilder({ page }).analyze();
    const blockingScrolled = axeScrolled.violations.filter(
      v => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(blockingScrolled).toEqual([]);
  });

  test('Proyectos renders cleanly without redundant eyebrow and with zero serious a11y issues', async ({
    page,
  }) => {
    await page.goto('/proyectos');
    await expect(page.locator('h1')).toHaveCount(1);
    await expect(page.locator('h1')).toContainText(/Iniciativas actuales/i);
    await expect(page.getByText('Procesos Vivos')).toHaveCount(0);
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

      if (route === '/') {
        const bannerBox = await page.getByTestId('hero-banner').boundingBox();
        const headerBox = await page.locator('header').boundingBox();
        expect(bannerBox).not.toBeNull();
        expect(headerBox).not.toBeNull();
        if (bannerBox && headerBox) {
          expect(bannerBox.y).toBeGreaterThanOrEqual(headerBox.height - 1);
          expect(bannerBox.width).toBeLessThanOrEqual(360);
        }
      }
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
