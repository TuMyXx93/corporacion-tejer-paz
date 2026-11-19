import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc } from 'drizzle-orm';
import { AdminDashboardClient } from '@/components/admin/AdminDashboardClient';
import { getDb } from '@/db';
import { contactMessages, user } from '@/db/schema';
import { getServerActor } from '@/lib/auth/guards';
import { getPublicSiteContent } from '@/lib/content/queries';
import { getActiveStorageProvider, isStorageConfigured } from '@/lib/storage';

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

  const content = await getPublicSiteContent();
  const db = getDb();

  const messageRows = db
    ? await db
        .select()
        .from(contactMessages)
        .orderBy(desc(contactMessages.createdAt))
        .limit(50)
    : [];

  const userRows =
    db && actor.role === 'superadmin'
      ? await db
          .select({
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            banned: user.banned,
          })
          .from(user)
          .orderBy(desc(user.createdAt))
      : [];

  return (
    <AdminDashboardClient
      actor={actor}
      initialSettings={content.settings}
      initialSections={Object.values(content.sections)}
      initialProjects={content.projects}
      initialMessages={messageRows.map(m => ({
        ...m,
        createdAt: m.createdAt.toISOString(),
      }))}
      initialUsers={userRows}
      storageProvider={getActiveStorageProvider()}
      storageConfigured={isStorageConfigured()}
    />
  );
}
