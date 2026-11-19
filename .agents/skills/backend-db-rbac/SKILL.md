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
- **Conexiones Neon:**
  - `DATABASE_URL` (pooled) → runtime en Next.js / Vercel Serverless.
  - `DATABASE_URL_UNPOOLED` (direct) → migraciones con `drizzle-kit`.
- **Resiliencia sin BD:** Las páginas públicas deben usar `src/lib/content/queries.ts`, que devuelve contenido desde `src/data/default-content.ts` si `DATABASE_URL` no está definida.

## 2. Comandos CLI de Base de Datos (sin MCP de BD)

```powershell
pnpm run db:generate         # Genera migración SQL en drizzle/
pnpm run db:migrate          # Aplica migraciones a Neon
pnpm run db:push             # Sync rápido en rama dev de Neon
pnpm run db:studio           # Abre Drizzle Studio local
pnpm run db:seed             # Carga contenido inicial extraído de Wix
pnpm run admin:bootstrap     # Crea/promueve el primer superadmin vía env vars
```

## 3. Reglas Estrictas de RBAC (Better Auth `createAccessControl`)

Definidas en `src/lib/auth/permissions.ts` y aplicadas en servidor vía `src/lib/auth/guards.ts`:

| Recurso / Acción                                                 |       `admin`       |    `superadmin`     |
| :--------------------------------------------------------------- | :-----------------: | :-----------------: |
| Secciones, Áreas y Proyectos (leer/crear/editar/ordenar)         |         Sí          |         Sí          |
| Biblioteca multimedia (subir/editar alt/eliminar)                |         Sí          |         Sí          |
| Mensajes de contacto (leer/cambiar estado)                       |         Sí          |         Sí          |
| Configuración global sensible (`site_settings`: email/redes/SEO) |    Solo lectura     | Lectura y escritura |
| Gestión de usuarios y roles (`/api/admin/users`)                 | **Prohibido (403)** |        Total        |
| Registro de auditoría (`audit_logs`)                             | **Prohibido (403)** |       Lectura       |

## 4. Checklist de Seguridad al Tocar Backend

1. Llamar `requirePermission(...)` o `requireRole('superadmin')` al inicio de cada handler/action admin.
2. Nunca confiar en el `role` enviado desde el body del cliente.
3. Registrar cambios críticos (usuarios, settings, borrados) en `audit_logs`.
4. Ejecutar `pnpm run test` para validar la matriz RBAC tras cualquier cambio.
