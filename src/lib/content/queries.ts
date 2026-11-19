import { unstable_cache } from 'next/cache';
import { asc, eq } from 'drizzle-orm';
import { getDb, isDatabaseConfigured } from '@/db';
import { actionAreas, pageSections, projects, siteSettings } from '@/db/schema';
import {
  DEFAULT_ACTION_AREAS,
  DEFAULT_PAGE_SECTIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  type ActionAreaData,
  type PageSectionData,
  type ProjectItemData,
  type SiteSettingsData,
} from '@/data/default-content';

export const SITE_CONTENT_CACHE_TAG = 'site-content';

export interface PublicSiteContent {
  settings: SiteSettingsData;
  sections: Record<string, PageSectionData>;
  actionAreas: ActionAreaData[];
  projects: ProjectItemData[];
  source: 'database' | 'fallback';
}

async function fetchPublicSiteContent(): Promise<PublicSiteContent> {
  if (!isDatabaseConfigured()) {
    return {
      settings: DEFAULT_SITE_SETTINGS,
      sections: DEFAULT_PAGE_SECTIONS,
      actionAreas: DEFAULT_ACTION_AREAS,
      projects: DEFAULT_PROJECTS,
      source: 'fallback',
    };
  }

  try {
    const db = getDb();
    if (!db) {
      return {
        settings: DEFAULT_SITE_SETTINGS,
        sections: DEFAULT_PAGE_SECTIONS,
        actionAreas: DEFAULT_ACTION_AREAS,
        projects: DEFAULT_PROJECTS,
        source: 'fallback',
      };
    }

    const [settingsRows, sectionRows, areaRows, projectRows] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(pageSections),
      db
        .select()
        .from(actionAreas)
        .where(eq(actionAreas.isActive, true))
        .orderBy(asc(actionAreas.sortOrder), asc(actionAreas.id)),
      db
        .select()
        .from(projects)
        .where(eq(projects.isPublished, true))
        .orderBy(asc(projects.sortOrder), asc(projects.id)),
    ]);

    const mergedSections: Record<string, PageSectionData> = {
      ...DEFAULT_PAGE_SECTIONS,
    };
    for (const row of sectionRows) {
      mergedSections[row.key] = {
        key: row.key,
        title: row.title,
        subtitle: row.subtitle,
        body: row.body,
        imageUrl: row.imageUrl,
        imageAlt: row.imageAlt,
        ctaPrimaryLabel: row.ctaPrimaryLabel,
        ctaPrimaryHref: row.ctaPrimaryHref,
        ctaSecondaryLabel: row.ctaSecondaryLabel,
        ctaSecondaryHref: row.ctaSecondaryHref,
        items: Array.isArray(row.items) ? row.items : [],
        isVisible: row.isVisible,
      };
    }

    const settingsRow = settingsRows[0];
    const settings: SiteSettingsData = settingsRow
      ? {
          organizationName: settingsRow.organizationName,
          seoTitle: settingsRow.seoTitle,
          seoDescription: settingsRow.seoDescription,
          contactEmail: settingsRow.contactEmail,
          phones: Array.isArray(settingsRow.phones)
            ? settingsRow.phones
            : DEFAULT_SITE_SETTINGS.phones,
          instagramHandle: settingsRow.instagramHandle,
          instagramUrl: settingsRow.instagramUrl,
          quoteText: settingsRow.quoteText,
          footerCopyright: settingsRow.footerCopyright,
          logoUrl: settingsRow.logoUrl,
          logoAlt: settingsRow.logoAlt,
        }
      : DEFAULT_SITE_SETTINGS;

    return {
      settings,
      sections: mergedSections,
      actionAreas: areaRows.length > 0 ? areaRows : DEFAULT_ACTION_AREAS,
      projects: projectRows.length > 0 ? projectRows : DEFAULT_PROJECTS,
      source: 'database',
    };
  } catch (err) {
    console.error('[content_fallback]', err);
    return {
      settings: DEFAULT_SITE_SETTINGS,
      sections: DEFAULT_PAGE_SECTIONS,
      actionAreas: DEFAULT_ACTION_AREAS,
      projects: DEFAULT_PROJECTS,
      source: 'fallback',
    };
  }
}

export const getPublicSiteContent = unstable_cache(
  fetchPublicSiteContent,
  ['public-site-content-v1'],
  {
    revalidate: 300,
    tags: [SITE_CONTENT_CACHE_TAG],
  }
);
