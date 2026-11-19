import {
  boolean,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// ============================================================================
// Better Auth Core + Admin Plugin Tables
// ============================================================================

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('admin'), // 'superadmin' | 'admin'
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  impersonatedBy: text('impersonated_by'),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ============================================================================
// Institutional CMS Tables — Corporación Tejer Paz
// ============================================================================

export const siteSettings = pgTable('site_settings', {
  id: text('id').primaryKey().default('default'),
  organizationName: text('organization_name').notNull(),
  seoTitle: text('seo_title').notNull(),
  seoDescription: text('seo_description').notNull(),
  contactEmail: text('contact_email').notNull(),
  phones: jsonb('phones').$type<string[]>().notNull(),
  instagramHandle: text('instagram_handle').notNull(),
  instagramUrl: text('instagram_url').notNull(),
  quoteText: text('quote_text').notNull(),
  footerCopyright: text('footer_copyright').notNull(),
  logoUrl: text('logo_url').notNull(),
  logoAlt: text('logo_alt').notNull(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedByUserId: text('updated_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
});

export const pageSections = pgTable('page_sections', {
  key: text('key').primaryKey(), // 'hero' | 'mission' | 'community_impact' | 'contact_intro' | 'projects_intro' | 'projects_impact'
  title: text('title').notNull(),
  subtitle: text('subtitle').notNull().default(''),
  body: text('body').notNull().default(''),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt'),
  ctaPrimaryLabel: text('cta_primary_label'),
  ctaPrimaryHref: text('cta_primary_href'),
  ctaSecondaryLabel: text('cta_secondary_label'),
  ctaSecondaryHref: text('cta_secondary_href'),
  items: jsonb('items').$type<string[]>().notNull().default([]),
  isVisible: boolean('is_visible').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  updatedByUserId: text('updated_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
});

export const actionAreas = pgTable('action_areas', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  imageAlt: text('image_alt').notNull(),
  href: text('href').notNull().default('/proyectos'),
  sortOrder: integer('sort_order').notNull().default(0),
  isActive: boolean('is_active').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  numberLabel: text('number_label').notNull(),
  title: text('title').notNull(),
  summary: text('summary').notNull().default(''),
  description: text('description').notNull().default(''),
  imageUrl: text('image_url').notNull(),
  imageAlt: text('image_alt').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  isPublished: boolean('is_published').notNull().default(true),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const mediaAssets = pgTable('media_assets', {
  id: serial('id').primaryKey(),
  url: text('url').notNull().unique(),
  pathname: text('pathname').notNull(),
  filename: text('filename').notNull(),
  alt: text('alt').notNull().default(''),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  storageProvider: text('storage_provider').notNull().default('vercel-blob'), // 'vercel-blob' | 'r2' | 'local'
  uploadedByUserId: text('uploaded_by_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const contactMessages = pgTable('contact_messages', {
  id: serial('id').primaryKey(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  email: text('email').notNull(),
  subject: text('subject').notNull(),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'), // 'new' | 'read' | 'replied' | 'archived'
  emailSent: boolean('email_sent').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const auditLogs = pgTable('audit_logs', {
  id: serial('id').primaryKey(),
  actorUserId: text('actor_user_id').references(() => user.id, {
    onDelete: 'set null',
  }),
  actorRole: text('actor_role').notNull(),
  action: text('action').notNull(),
  resourceType: text('resource_type').notNull(),
  resourceId: text('resource_id').notNull(),
  summary: text('summary').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
