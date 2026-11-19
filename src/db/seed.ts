import { existsSync } from 'node:fs';
import { requireDb } from './index';
import { actionAreas, pageSections, projects, siteSettings } from './schema';
import {
  DEFAULT_ACTION_AREAS,
  DEFAULT_PAGE_SECTIONS,
  DEFAULT_PROJECTS,
  DEFAULT_SITE_SETTINGS,
} from '../data/default-content';

for (const envFile of ['.env.local', '.env']) {
  if (existsSync(envFile)) {
    process.loadEnvFile(envFile);
  }
}

async function seed() {
  const db = requireDb();

  console.log('1. Sembrando configuración institucional (site_settings)...');
  await db
    .insert(siteSettings)
    .values({
      id: 'default',
      ...DEFAULT_SITE_SETTINGS,
    })
    .onConflictDoNothing();

  console.log('2. Sembrando secciones editables (page_sections)...');
  for (const sec of Object.values(DEFAULT_PAGE_SECTIONS)) {
    await db
      .insert(pageSections)
      .values({
        key: sec.key,
        title: sec.title,
        subtitle: sec.subtitle,
        body: sec.body,
        imageUrl: sec.imageUrl,
        imageAlt: sec.imageAlt,
        ctaPrimaryLabel: sec.ctaPrimaryLabel,
        ctaPrimaryHref: sec.ctaPrimaryHref,
        ctaSecondaryLabel: sec.ctaSecondaryLabel,
        ctaSecondaryHref: sec.ctaSecondaryHref,
        items: sec.items,
        isVisible: sec.isVisible,
      })
      .onConflictDoNothing();
  }

  console.log('3. Sembrando áreas de acción (action_areas)...');
  for (const area of DEFAULT_ACTION_AREAS) {
    await db
      .insert(actionAreas)
      .values({
        slug: area.slug,
        title: area.title,
        description: area.description,
        imageUrl: area.imageUrl,
        imageAlt: area.imageAlt,
        href: area.href,
        sortOrder: area.sortOrder,
        isActive: area.isActive,
      })
      .onConflictDoNothing();
  }

  console.log('4. Sembrando proyectos iniciales (projects)...');
  for (const proj of DEFAULT_PROJECTS) {
    await db
      .insert(projects)
      .values({
        slug: proj.slug,
        numberLabel: proj.numberLabel,
        title: proj.title,
        summary: proj.summary,
        description: proj.description,
        imageUrl: proj.imageUrl,
        imageAlt: proj.imageAlt,
        sortOrder: proj.sortOrder,
        isPublished: proj.isPublished,
      })
      .onConflictDoNothing();
  }

  console.log('Seed completado de forma idempotente.');
}

seed().catch(err => {
  console.error('Error en db:seed:', err);
  process.exit(1);
});
