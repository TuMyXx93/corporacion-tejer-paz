import { NextResponse } from 'next/server';
import { desc } from 'drizzle-orm';
import { requireDb } from '@/db';
import { auditLogs } from '@/db/schema';
import { requireApiPermission } from '@/lib/auth/guards';

export async function GET() {
  const guard = await requireApiPermission('audit', 'read');
  if (!guard.ok) return guard.response;

  const db = requireDb();
  const logs = await db
    .select()
    .from(auditLogs)
    .orderBy(desc(auditLogs.createdAt))
    .limit(50);

  return NextResponse.json({ logs });
}
