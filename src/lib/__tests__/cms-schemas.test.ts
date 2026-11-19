import { describe, expect, it } from 'vitest';
import {
  createAdminUserSchema,
  createProjectSchema,
  updateAdminUserSchema,
  updateMessageStatusSchema,
  updateProjectSchema,
  updateSectionSchema,
  updateSiteSettingsSchema,
} from '@/lib/cms/schemas';

describe('CMS & Admin Zod Schemas', () => {
  it('validates updateSectionSchema and rejects unsafe URL protocols', () => {
    const valid = updateSectionSchema.safeParse({
      key: 'hero',
      title: 'Construyendo Paz y Reconciliación',
      subtitle: 'Texto institucional',
      imageUrl: '/images/hero-banner-manos-tejiendo-paz.png',
      ctaPrimaryLabel: 'Nuestros Proyectos',
      ctaPrimaryHref: '/proyectos',
      ctaSecondaryLabel: 'Misión',
      ctaSecondaryHref: '#nuestra-mision',
      items: ['Comunidades fortalecidas'],
      isVisible: true,
    });
    expect(valid.success).toBe(true);

    const xssHref = updateSectionSchema.safeParse({
      key: 'hero',
      title: 'Título válido',
      ctaPrimaryHref: 'javascript:alert(1)',
    });
    expect(xssHref.success).toBe(false);

    const badKey = updateSectionSchema.safeParse({
      key: 'unknown_section',
      title: 'Título válido',
    });
    expect(badKey.success).toBe(false);
  });

  it('validates createProjectSchema and updateProjectSchema', () => {
    const validCreate = createProjectSchema.safeParse({
      slug: 'escuchar-la-voz-de-los-jovenes',
      numberLabel: '01',
      title: 'Escuchar la voz de los jóvenes',
      summary: 'Espacios protectores a partir del diálogo.',
      description: 'Descripción completa de la iniciativa territorial.',
      imageUrl: 'https://example.public.blob.vercel-storage.com/foto.jpg',
      imageAlt: 'Jóvenes dialogando en territorio rural',
      sortOrder: 1,
      isPublished: true,
    });
    expect(validCreate.success).toBe(true);

    const invalidSlug = createProjectSchema.safeParse({
      slug: 'Slug Con Espacios!',
      numberLabel: '01',
      title: 'Proyecto',
      imageUrl: '/images/proyecto.jpg',
      imageAlt: 'Descripción válida',
    });
    expect(invalidSlug.success).toBe(false);

    const validUpdate = updateProjectSchema.safeParse({
      id: 1,
      title: 'Título actualizado',
    });
    expect(validUpdate.success).toBe(true);

    const invalidUpdateId = updateProjectSchema.safeParse({
      id: -5,
      title: 'Título actualizado',
    });
    expect(invalidUpdateId.success).toBe(false);
  });

  it('validates updateSiteSettingsSchema and updateMessageStatusSchema', () => {
    const validSettings = updateSiteSettingsSchema.safeParse({
      organizationName: 'Corporación Tejer Paz',
      seoTitle: 'Corporación Tejer Paz | Paz y Reconciliación',
      seoDescription:
        'Organización nacida del impulso juvenil del suroccidente colombiano para la construcción de paz.',
      contactEmail: 'coorp.tejerpaz@gmail.com',
      phones: ['301 3617133', '301 6279744'],
      instagramHandle: '@corp.tejepaz',
      instagramUrl: 'https://www.instagram.com/corp.tejepaz/',
      quoteText: 'La paz es el tejido que nos une y la reconciliación nos sostiene.',
      footerCopyright: '© 2026 Corporación Tejer Paz.',
      logoUrl: '/images/logo-corporacion-tejer-paz.png',
      logoAlt: 'Logotipo de la Corporación Tejer Paz',
    });
    expect(validSettings.success).toBe(true);

    const invalidSettings = updateSiteSettingsSchema.safeParse({
      organizationName: 'A',
      seoTitle: 'X',
      seoDescription: 'corta',
      contactEmail: 'invalido',
      phones: [],
      instagramHandle: '@',
      instagramUrl: 'not-a-url',
      quoteText: 'corta',
      footerCopyright: 'x',
      logoUrl: 'javascript:void(0)',
      logoAlt: 'x',
    });
    expect(invalidSettings.success).toBe(false);

    expect(
      updateMessageStatusSchema.safeParse({ id: 10, status: 'replied' }).success
    ).toBe(true);
    expect(
      updateMessageStatusSchema.safeParse({ id: 10, status: 'deleted' }).success
    ).toBe(false);
  });

  it('enforces password length and valid roles on admin user schemas', () => {
    expect(
      createAdminUserSchema.safeParse({
        name: 'Ana Liderazgo',
        email: 'ana@tejerpaz.org',
        password: 'ClaveSegura2026!',
        role: 'admin',
      }).success
    ).toBe(true);

    expect(
      createAdminUserSchema.safeParse({
        name: 'Ana',
        email: 'ana@tejerpaz.org',
        password: 'corta',
        role: 'admin',
      }).success
    ).toBe(false);

    expect(
      updateAdminUserSchema.safeParse({
        userId: 'usr-123',
        role: 'superadmin',
        banned: false,
      }).success
    ).toBe(true);
  });
});
