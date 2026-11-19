---
name: backend-db-rbac
description: >-
  Use when creating or modifying Drizzle ORM schemas, Neon Postgres migrations,
  Better Auth authentication, or RBAC permissions (superadmin vs admin) in Server
  Components, Server Actions, or API routes.
---

# Backend, Base de Datos y RBAC (`superadmin` | `admin`)

## 1. Arquitectura de Datos (Drizzle ORM + Neon Postgres)

- **Esquema único:** `src/db/schema.ts` (tablas Better Auth + `siteSettings`, `pageSections`, `actionAreas`, `projects`, `mediaAssets`, `contactMessages`, `auditLogs`).
- `pageSections` y `projects` incluyen columnas JSONB `media_items` (galerías mixtas foto/video) y `documents` (cartillas PDF). `mediaAssets` almacena `asset_type` (`image` | `pdf` | `video`) y `title`.
- **Conexiones Neon:**
  - `DATABASE_URL` (pooled) → runtime en Next.js / Vercel Serverless.
  - `DATABASE_URL_UNPOOLED` (direct) → migraciones con `drizzle-kit`.
- **Resiliencia sin BD:** Las páginas públicas usan `src/lib/content/queries.ts` con caché ISR (`public-site-content-v2`) y respaldo a `src/data/default-content.ts`.

## 2. Comandos CLI de Base de Datos (sin MCP de BD)

```powershell
pnpm run db:generate         # Genera migración SQL en drizzle/
pnpm run db:migrate          # Aplica migraciones a Neon
pnpm run db:push             # Sync rápido en rama dev de Neon
pnpm run db:studio           # Abre Drizzle Studio local
pnpm run db:seed             # Carga contenido inicial
pnpm run admin:bootstrap     # Crea/promueve el primer superadmin vía env vars
pnpm run media:migrate-blob  # Sincroniza blobs existentes y migra public/images/ a Vercel Blob
```

## 3. Reglas Estrictas de RBAC (Better Auth `createAccessControl`)

Definidas en `src/lib/auth/permissions.ts` y aplicadas en servidor vía `src/lib/auth/guards.ts`:

| Recurso / Acción                                                     |       `admin`       |    `superadmin`     |
| :------------------------------------------------------------------- | :-----------------: | :-----------------: |
| Secciones, Áreas de Acción y Proyectos (CRUD + galerías/PDFs)        |         Sí          |         Sí          |
| Biblioteca multimedia (subir/sincronizar/editar/eliminar)            |         Sí          |         Sí          |
| Mensajes de contacto (leer/cambiar estado semaforizado/eliminar)     |         Sí          |         Sí          |
| Configuración global sensible (`site_settings`: email/redes/SEO)     |    Solo lectura     | Lectura y escritura |
| Gestión de usuarios, roles, suspensión y claves (`/api/admin/users`) | **Prohibido (403)** |        Total        |
| Registro de auditoría (`/api/admin/audit`)                           | **Prohibido (403)** |       Lectura       |

## 4. Checklist de Seguridad al Tocar Backend

1. Llamar `requireApiPermission(...)` al inicio de cada handler `/api/admin/*` y verificar que `getServerActor()` rechace cuentas suspendidas (`banned`).
2. Nunca permitir degradar, suspender o eliminar la propia cuenta ni al último `superadmin` activo; al suspender, revocar sus filas en `session`.
3. Registrar mutaciones de contenido, medios, mensajes, settings y usuarios en `audit_logs`.
4. Ejecutar `pnpm run test:coverage` para validar matriz RBAC, esquemas Zod y utilidades multimedia.
