import { z } from 'zod';
import { parseVideoEmbed } from '@/lib/media/embeds';

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

export const galleryMediaItemSchema = z
  .object({
    id: z.string().trim().min(1).max(80),
    type: z.enum(['image', 'video']),
    url: safeUrlSchema.min(1, 'Debes indicar la URL del recurso.'),
    title: z.string().trim().max(160).optional(),
    alt: z.string().trim().max(300).optional(),
    thumbnailUrl: safeUrlSchema.optional(),
  })
  .superRefine((val, ctx) => {
    if (val.type === 'video' && !parseVideoEmbed(val.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'Enlace de video inválido: usa una URL https:// de YouTube o Vimeo.',
      });
    }
  });

export const documentAttachmentSchema = z.object({
  id: z.string().trim().min(1).max(80),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().max(400).optional(),
  url: safeUrlSchema.min(1, 'Debes indicar la URL del documento PDF.'),
  fileName: z.string().trim().max(180).optional(),
  sizeBytes: z.number().int().min(0).max(50_000_000).optional(),
});

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
  mediaItems: z.array(galleryMediaItemSchema).max(16).optional().default([]),
  documents: z.array(documentAttachmentSchema).max(10).optional().default([]),
  isVisible: z.boolean().optional(),
});

const projectFieldsBase = {
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.'),
  numberLabel: z.string().trim().min(1).max(10),
  title: z.string().trim().min(2).max(160),
  summary: z.string().trim().max(300),
  description: z.string().trim().max(3000),
  imageUrl: safeUrlSchema.min(1, 'Debes indicar una imagen.'),
  imageAlt: z.string().trim().min(4, 'Agrega un texto alternativo descriptivo.').max(300),
  mediaItems: z.array(galleryMediaItemSchema).max(16),
  documents: z.array(documentAttachmentSchema).max(10),
  sortOrder: z.number().int().min(0).max(999),
  isPublished: z.boolean(),
};

export const createProjectSchema = z.object({
  slug: projectFieldsBase.slug,
  numberLabel: projectFieldsBase.numberLabel,
  title: projectFieldsBase.title,
  summary: projectFieldsBase.summary.default(''),
  description: projectFieldsBase.description.default(''),
  imageUrl: projectFieldsBase.imageUrl,
  imageAlt: projectFieldsBase.imageAlt,
  mediaItems: projectFieldsBase.mediaItems.default([]),
  documents: projectFieldsBase.documents.default([]),
  sortOrder: projectFieldsBase.sortOrder.default(0),
  isPublished: projectFieldsBase.isPublished.default(true),
});

export const updateProjectSchema = z.object(projectFieldsBase).partial().extend({
  id: z.number().int().positive(),
});

const actionAreaFieldsBase = {
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'El slug solo admite minúsculas, números y guiones.'),
  title: z.string().trim().min(2).max(160),
  description: z.string().trim().min(10).max(1500),
  imageUrl: safeUrlSchema.min(1, 'Debes indicar una imagen.'),
  imageAlt: z.string().trim().min(4, 'Agrega un texto alternativo descriptivo.').max(300),
  href: safeUrlSchema.min(1, 'Debes indicar un enlace de destino.'),
  sortOrder: z.number().int().min(0).max(999),
  isActive: z.boolean(),
};

export const createActionAreaSchema = z.object({
  slug: actionAreaFieldsBase.slug,
  title: actionAreaFieldsBase.title,
  description: actionAreaFieldsBase.description,
  imageUrl: actionAreaFieldsBase.imageUrl,
  imageAlt: actionAreaFieldsBase.imageAlt,
  href: actionAreaFieldsBase.href.default('/proyectos'),
  sortOrder: actionAreaFieldsBase.sortOrder.default(0),
  isActive: actionAreaFieldsBase.isActive.default(true),
});

export const updateActionAreaSchema = z.object(actionAreaFieldsBase).partial().extend({
  id: z.number().int().positive(),
});

export const registerMediaAssetSchema = z
  .object({
    url: safeUrlSchema.min(1),
    pathname: z.string().trim().min(1).max(300),
    filename: z.string().trim().min(1).max(180),
    title: z.string().trim().max(160).optional().default(''),
    alt: z.string().trim().max(300).optional().default(''),
    mimeType: z.string().trim().min(3).max(120),
    sizeBytes: z.number().int().min(0).max(50_000_000).optional().default(0),
    assetType: z.enum(['image', 'pdf', 'video']).default('image'),
    storageProvider: z
      .enum(['vercel-blob', 'r2', 'local', 'external'])
      .default('vercel-blob'),
  })
  .superRefine((val, ctx) => {
    if (val.assetType === 'video' && !parseVideoEmbed(val.url)) {
      ctx.addIssue({
        code: 'custom',
        path: ['url'],
        message: 'URL de video inválida: usa una URL https:// de YouTube o Vimeo.',
      });
    }
  });

export const updateMediaAssetSchema = z.object({
  id: z.number().int().positive(),
  title: z.string().trim().max(160),
  alt: z.string().trim().max(300),
});

export const updateSiteSettingsSchema = z.object({
  organizationName: z.string().trim().min(2).max(120),
  seoTitle: z.string().trim().min(5).max(160),
  seoDescription: z.string().trim().min(20).max(320),
  contactEmail: z.string().trim().email().max(254),
  phones: z.array(z.string().trim().min(7).max(30)).min(1).max(5),
  instagramHandle: z.string().trim().min(2).max(60),
  instagramUrl: z
    .string()
    .trim()
    .url()
    .refine(v => v.startsWith('https://'), 'Usa un enlace https:// válido.'),
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
  name: z.string().trim().min(2).max(100).optional(),
  role: z.enum(['admin', 'superadmin']).optional(),
  banned: z.boolean().optional(),
  banReason: z.string().trim().max(200).optional(),
  newPassword: z
    .string()
    .min(10, 'La nueva contraseña debe tener al menos 10 caracteres.')
    .max(128)
    .optional(),
});
