import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { asc, desc, eq } from 'drizzle-orm';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import {
  DEFAULT_ACTION_AREAS,
  DEFAULT_PAGE_SECTIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
  type PageSectionData,
  type ProjectItemData,
  type SiteSettingsData,
} from '@/data/default-content';
import { getDb } from '@/db';
import {
  actionAreas,
  auditLogs,
  contactMessages,
  mediaAssets,
  pageSections,
  projects,
  siteSettings,
  user,
} from '@/db/schema';
import { getServerActor } from '@/lib/auth/guards';
import { getActiveStorageProvider, isStorageConfigured } from '@/lib/storage';
import { syncBlobStoreToDatabase } from '@/lib/storage/blob-sync';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Panel Administrativo',
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const actor = await getServerActor();
  if (!actor) {
    redirect('/admin/login');
  }

  const db = getDb();
  const storageConfigured = isStorageConfigured();

  let settings: SiteSettingsData = DEFAULT_SITE_SETTINGS;
  let sectionList: PageSectionData[] = Object.values(DEFAULT_PAGE_SECTIONS);
  let areaList = DEFAULT_ACTION_AREAS;
  let projectList: ProjectItemData[] = DEFAULT_PROJECTS;
  let mediaRows: Array<typeof mediaAssets.$inferSelect> = [];
  let messageRows: Array<typeof contactMessages.$inferSelect> = [];
  let userRows: Array<{
    id: string;
    name: string;
    email: string;
    role: string;
    banned: boolean | null;
    banReason: string | null;
    createdAt: Date;
  }> = [];
  let auditRows: Array<typeof auditLogs.$inferSelect> = [];

  if (db) {
    const [
      settingsRows,
      dbSections,
      dbAreas,
      dbProjects,
      initialMedia,
      dbMessages,
      dbUsers,
      dbAuditLogs,
    ] = await Promise.all([
      db.select().from(siteSettings).where(eq(siteSettings.id, 'default')).limit(1),
      db.select().from(pageSections),
      db
        .select()
        .from(actionAreas)
        .orderBy(asc(actionAreas.sortOrder), asc(actionAreas.id)),
      db.select().from(projects).orderBy(asc(projects.sortOrder), asc(projects.id)),
      db.select().from(mediaAssets).orderBy(desc(mediaAssets.createdAt)).limit(200),
      db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt))
        .limit(200),
      actor.role === 'superadmin'
        ? db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              banned: user.banned,
              banReason: user.banReason,
              createdAt: user.createdAt,
            })
            .from(user)
            .orderBy(desc(user.createdAt))
        : Promise.resolve([]),
      actor.role === 'superadmin'
        ? db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(50)
        : Promise.resolve([]),
    ]);

    if (settingsRows[0]) {
      const row = settingsRows[0];
      settings = {
        organizationName: row.organizationName,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        contactEmail: row.contactEmail,
        phones: Array.isArray(row.phones) ? row.phones : DEFAULT_SITE_SETTINGS.phones,
        instagramHandle: row.instagramHandle,
        instagramUrl: row.instagramUrl,
        quoteText: row.quoteText,
        footerCopyright: row.footerCopyright,
        logoUrl: row.logoUrl,
        logoAlt: row.logoAlt,
      };
    }

    const mergedSections: Record<string, PageSectionData> = {
      ...DEFAULT_PAGE_SECTIONS,
    };
    for (const row of dbSections) {
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
        mediaItems: Array.isArray(row.mediaItems) ? row.mediaItems : [],
        documents: Array.isArray(row.documents) ? row.documents : [],
        isVisible: row.isVisible,
      };
    }
    sectionList = Object.values(mergedSections);

    if (dbAreas.length > 0) {
      areaList = dbAreas;
    }

    if (dbProjects.length > 0) {
      projectList = dbProjects.map(p => ({
        ...p,
        mediaItems: Array.isArray(p.mediaItems) ? p.mediaItems : [],
        documents: Array.isArray(p.documents) ? p.documents : [],
      }));
    }

    mediaRows = initialMedia;
    if (storageConfigured && mediaRows.length === 0) {
      try {
        await syncBlobStoreToDatabase();
        mediaRows = await db
          .select()
          .from(mediaAssets)
          .orderBy(desc(mediaAssets.createdAt))
          .limit(200);
      } catch (err) {
        console.warn('[admin_initial_blob_sync_warning]', err);
      }
    }

    messageRows = dbMessages;
    userRows = dbUsers;
    auditRows = dbAuditLogs;
  }

  return (
    <AdminDashboardClient
      actor={actor}
      initialSettings={settings}
      initialSections={sectionList}
      initialActionAreas={areaList}
      initialProjects={projectList}
      initialMediaAssets={mediaRows.map(a => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }))}
      initialMessages={messageRows.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialUsers={userRows.map(u => ({
        ...u,
        createdAt: u.createdAt.toISOString(),
      }))}
      initialAuditLogs={auditRows.map(l => ({
        ...l,
        createdAt: l.createdAt.toISOString(),
      }))}
      storageProvider={getActiveStorageProvider()}
      storageConfigured={storageConfigured}
    />
  );
}
