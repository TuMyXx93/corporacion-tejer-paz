# Changelog

Todos los cambios notables de este proyecto se documentan aquí siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.2.0] - 2026-11-19

### Added

- **Sistema visual 60-30-10 derivado del logotipo oficial** en `src/app/globals.css` (`#FCFBF8`, `#3B2816`, `#6E4713`, `#C68E28`, `#FBF3DF`).
- **Cabecera translúcida adaptativa (`SiteHeader`)** con detección de contraste por sección (`data-nav-theme="dark" | "light"`), píldoras unificadas y botón cuadrado escalable de redes sociales en `SiteFooter`.
- **Panel administrativo modular en 7 pestañas (`src/components/admin/`)** con barra lateral desktop y drawer móvil único vía botón hamburguesa (`< lg`):
  - `ActionAreasTab` y `/api/admin/action-areas` para CRUD completo de áreas de acción.
  - `ProjectsTab` mejorado con edición inline, publicación/borrador, galería mixta, PDFs y eliminación con confirmación (`ConfirmDialog`).
  - `MediaLibraryTab`, `MediaPickerModal`, `MediaGalleryEditor` y `/api/admin/media` + `/api/admin/media/sync` para gestionar imágenes (`<= 10 MB`), PDFs (`<= 15 MB`), enlaces externos YouTube/Vimeo y sincronización/migración con Vercel Blob (`pnpm run media:migrate-blob`).
  - `MessagesTab` con bandeja semaforizada (`Nuevo`, `Leído`, `Respondido`), carpeta dedicada de `Archivados` y eliminación segura (`DELETE /api/admin/messages`).
  - `UsersTab` y `/api/admin/audit` con matriz RBAC visible, edición de roles, restablecimiento de contraseña, suspensión con revocación inmediata de sesiones, eliminación y visor de auditoría.
- **Componentes multimedia públicos (`src/components/media/`)**: fachada ligera de video (`VideoEmbedCard` para `youtube-nocookie.com` y `player.vimeo.com?dnt=1`), carrusel mixto con lightbox (`MixedMediaShowcase`) y descargador de documentos (`DocumentDownloadList`).
- **Utilidades compartidas y listbox accesible**: `src/lib/format.ts` (`toSlug`, `formatTelHref`, `formatDateTimeEs`), `resolvePublicSiteUrl` en `src/lib/auth/origins.ts`, y `ResponsiveSelect` para selects accesibles contenidos al ancho del viewport móvil (`360px`).

### Changed

- Esquema Neon/Drizzle (`src/db/schema.ts`) ampliado de forma aditiva con columnas JSONB `media_items` y `documents` en `page_sections` y `projects`, más `asset_type` y `title` en `media_assets`.
- Hero principal ajustado con contenedor `aspect-[45/17]` (`object-contain`) bajo la cabecera fija para evitar recortes en desktop y móviles compactos (`360×800`).
- Simplificación editorial eliminando insignias redundantes en secciones públicas y enlaces `"Inicio"` duplicados, además de unificar URLs SEO (`layout.tsx`, `robots.ts`, `sitemap.ts`) con `resolvePublicSiteUrl`.
- Carga directa desde CDN para activos remotos en Vercel Blob/R2/YouTube (`isNextOptimizableImage`), evitando timeouts del proxy `/_next/image`.
- Eliminación de código muerto (`useSession`, `requireConfirmText`, `GET /api/admin/media/upload`, helpers duplicados) y asociación explícita `id`/`name`/`htmlFor` en controles administrativos.

### Fixed

- Desbordamiento horizontal de desplegables `<select>` nativos en `SectionsTab` y `UsersTab` sobre pantallas móviles (`360×800`), corregido mediante `ResponsiveSelect` (`role="listbox"`).
- Error de hidratación en `<html>`/`<body>` causado por atributos inyectados por extensiones del navegador (`suppressHydrationWarning`).
- Bloqueos de subida directa `@vercel/blob/client` añadiendo `https://vercel.com/api/blob` y `https://*.blob.vercel-storage.com` a `connect-src` en `next.config.ts`.
- Pérdida de foco al editar elementos de listas dinámicas cambiando keys basadas en valor por índices estables en `SectionsTab` y `SettingsTab`.
- Rechazo silencioso o pérdida de manejo de errores de red en mutaciones administrativas agregando bloques `try/catch` en todas las pestañas.

### Security

- Rechazo inmediato de cuentas suspendidas (`banned`) en `getServerActor()` y revocación de filas en `session` al suspender un usuario, con protección contra auto-suspensión o eliminación del último `superadmin` activo.
- Límites diferenciados por tipo MIME en `/api/admin/media/upload` (`<= 10 MB` imágenes, `<= 15 MB` PDFs) y exigencia estricta de `https://` en `instagramUrl` (`updateSiteSettingsSchema`) y enlaces de video (`parseVideoEmbed`).
- CSP ampliada de forma acotada para `frame-src` (`youtube-nocookie.com`, `player.vimeo.com`) y poda automática en `rateLimiter.ts` al superar 500 identificadores en memoria.

## [0.1.0] - 2026-11-19

### Added

- Plataforma pública inicial en **Next.js 16.4 (App Router, RSC + ISR)** + **Tailwind CSS v4** para `/` (Inicio) y `/proyectos`, con respaldo automático a `src/data/default-content.ts` cuando `DATABASE_URL` no está definida.
- Panel administrativo inicial (`/admin`, `/admin/login`) con **Better Auth 1.7**, **Drizzle ORM 0.45** y **Neon Postgres**, subida directa `@vercel/blob/client`, contacto híbrido (`POST /api/contact` + Resend), suite Vitest + Playwright/axe-core, documentación Diátaxis y CI/CD con CodeQL y reglas de rama `dev` → `main`.
