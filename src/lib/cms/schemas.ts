import { z } from 'zod';

const safeUrlSchema = z
  .string()
  .trim()
  .refine(
    v =>
      v === '' ||
      v.startsWith('/') ||
      v.startsWith('#') ||
      v.startsWith('https://') ||
      v.startsWith('http://'),
    'URL inválida: usa una ruta relativa (/) o https://'
  );

export const updateSectionSchema = z.object({
  key: z.enum([
    'hero',
    'mission',
    'community_impact',
    'contact_intro',
    'projects_intro',
    'projects_impact',
  ]),
  title: z.string().trim().min(2).max(160),
  subtitle: z.string().trim().max(500).optional().default(''),
  body: z.string().trim().max(4000).optional().default(''),
  imageUrl: safeUrlSchema.nullable().optional(),
  imageAlt: z.string().trim().max(300).nullable().optional(),
  ctaPrimaryLabel: z.string().trim().max(80).nullable().optional(),
  ctaPrimaryHref: safeUrlSchema.nullable().optional(),
  ctaSecondaryLabel: z.string().trim().max(80).nullable().optional(),
  ctaSecondaryHref: safeUrlSchema.nullable().optional(),
  items: z.array(z.string().trim().min(1).max(160)).max(20).optional(),
  isVisible: z.boolean().optional(),
});

export const createProjectSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.'),
  numberLabel: z.string().trim().min(1).max(10),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(300).default(''),
  description: z.string().trim().max(3000).default(''),
  imageUrl: safeUrlSchema.min(1, 'Debes indicar una imagen.'),
  imageAlt: z.string().trim().min(4, 'Agrega un texto alternativo descriptivo.').max(300),
  sortOrder: z.number().int().min(0).max(999).default(0),
  isPublished: z.boolean().default(true),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  id: z.number().int().positive(),
});

export const updateSiteSettingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  seoTitle: z.string().trim().min(5).max(160),
  seoDescription: z.string().trim().min(20).max(320),
  contactEmail: z.string().trim().email().max(254),
  phones: z.array(z.string().trim().min(7).max(30)).min(1).max(5),
  instagramHandle: z.string().trim().min(2).max(60),
  instagramUrl: z.string().trim().url(),
  quoteText: z.string().trim().min(10).max(500),
  footerCopyright: z.string().trim().min(5).max(160),
  logoUrl: safeUrlSchema.min(1),
  logoAlt: z.string().trim().min(4).max(200),
});

export const updateMessageStatusSchema = z.object({
  id: z.number().int().positive(),
  status: z.enum(['new', 'read', 'replied', 'archived']),
});

export const createAdminUserSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  password: z
    .string()
    .min(10, 'La contraseña debe tener al menos 10 caracteres.')
    .max(128),
  role: z.enum(['admin', 'superadmin']).default('admin'),
});

export const updateAdminUserSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(['admin', 'superadmin']).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().trim().max(200).optional(),
});
