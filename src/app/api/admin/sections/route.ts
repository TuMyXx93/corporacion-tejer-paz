import { NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';
import { requireDb } from '@/db';
import { pageSections } from '@/db/schema';
import { recordAuditLog, requireApiPermission } from '@/lib/auth/guards';
import { updateSectionSchema } from '@/lib/cms/schemas';
import { SITE_CONTENT_CACHE_TAG } from '@/lib/content/queries';

export async function GET() {
  const guard = await requireApiPermission('section', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const rows = await db.select().from(pageSections);
  return NextResponse.json({ sections: rows });
}

export async function PATCH(request: Request) {
  const guard = await requireApiPermission('section', 'update');
  if (!guard.ok) return guard.response;

  const body = await request.json().catch(() => null);
  const parsed = updateSectionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Datos de sección inválidos.', details: parsed.error.issues },
      { status: 400 }
    );
  }

  const d = parsed.data;
  const db = requireDb();

  await db
    .insert(pageSections)
    .values({
      key: d.key,
      title: d.title,
      subtitle: d.subtitle,
      body: d.body,
      imageUrl: d.imageUrl ?? null,
      imageAlt: d.imageAlt ?? null,
      ctaPrimaryLabel: d.ctaPrimaryLabel ?? null,
      ctaPrimaryHref: d.ctaPrimaryHref ?? null,
      ctaSecondaryLabel: d.ctaSecondaryLabel ?? null,
      ctaSecondaryHref: d.ctaSecondaryHref ?? null,
      items: d.items ?? [],
      mediaItems: d.mediaItems ?? [],
      documents: d.documents ?? [],
      isVisible: d.isVisible ?? true,
      updatedByUserId: guard.actor.id,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: pageSections.key,
      set: {
        title: d.title,
        subtitle: d.subtitle,
        body: d.body,
        imageUrl: d.imageUrl ?? null,
        imageAlt: d.imageAlt ?? null,
        ctaPrimaryLabel: d.ctaPrimaryLabel ?? null,
        ctaPrimaryHref: d.ctaPrimaryHref ?? null,
        ctaSecondaryLabel: d.ctaSecondaryLabel ?? null,
        ctaSecondaryHref: d.ctaSecondaryHref ?? null,
        items: d.items ?? [],
        mediaItems: d.mediaItems ?? [],
        documents: d.documents ?? [],
        isVisible: d.isVisible ?? true,
        updatedByUserId: guard.actor.id,
        updatedAt: new Date(),
      },
    });

  await recordAuditLog({
    actor: guard.actor,
    action: 'section.update',
    resourceType: 'page_sections',
    resourceId: d.key,
    summary: `Sección actualizada: ${d.key}`,
  });

  revalidateTag(SITE_CONTENT_CACHE_TAG, 'max');
  revalidatePath('/');
  revalidatePath('/proyectos');

  return NextResponse.json({ ok: true, key: d.key });
}
