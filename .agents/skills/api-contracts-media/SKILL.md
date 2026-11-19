---
name: api-contracts-media
description: >-
  Use when implementing or debugging API routes, Zod contracts, Resend contact
  email flows, rate limiting, ISR cache revalidation, embedded videos, PDFs, or
  direct-to-storage media uploads (Vercel Blob now, Cloudflare R2 ready).
---

# Contratos API, Contacto (Resend) y Subida Directa de Medios

## 1. Contratos API con Zod Compartido

- Toda entrada HTTP se valida en servidor con Zod (`src/lib/contact/schema.ts`, `src/lib/cms/schemas.ts`, `src/lib/media/embeds.ts`).
- Responder siempre errores estructurados JSON (`{ error, details? }`) con códigos HTTP semánticos (`400`, `401`, `403`, `404`, `409`, `413`, `429`, `500`, `503`).
- Al mutar contenido público desde `/api/admin/*`, invocar `revalidateTag('site-content', 'max')`, `revalidatePath('/')` y `revalidatePath('/proyectos')`.

## 2. Subida Directa de Imágenes y PDFs (> 4.5 MB en Vercel)

- **Restricción Vercel:** Las Serverless Functions rechazan payloads `> 4.5 MB` (`413`).
- **Patrón obligatorio (`src/lib/storage/` + `@vercel/blob/client`):**
  - Token de subida directa: `POST /api/admin/media/upload` permite imágenes (`image/jpeg`, `image/png`, `image/webp`, `image/avif`) hasta `10 MB` y documentos (`application/pdf`) hasta `15 MB`.
  - Registro, metadatos y borrado: `/api/admin/media` (`GET`, `POST`, `PATCH`, `DELETE`) registra archivos subidos en localhost/producción, guarda enlaces externos de **YouTube/Vimeo** (`assetType: 'video'`) y elimina objetos en Vercel Blob con `del()`.
  - Sincronización y migración: `POST /api/admin/media/sync` (y script CLI `pnpm run media:migrate-blob`) sincroniza blobs existentes del store hacia `media_assets` y migra activos iniciales de `public/images/` a Vercel Blob.
  - Migración futura a **Cloudflare R2**: cambiar `STORAGE_PROVIDER=r2` e implementar presigned `PUT` URLs sin alterar componentes UI.

## 3. Videos Embebidos con Privacidad

- `parseVideoEmbed(url)` en `src/lib/media/embeds.ts` exige `https:` y normaliza enlaces de YouTube (`youtube-nocookie.com/embed/...`) y Vimeo (`player.vimeo.com/video/...?dnt=1`), con respaldo seguro para enlaces externos.
- El CSP en `next.config.ts` permite únicamente `'self' https://www.youtube-nocookie.com https://player.vimeo.com` en `frame-src`.

## 4. Contacto Híbrido (BD + Resend)

- Limitar payload a `16 KiB`, validar con Zod, verificar _honeypot_ (`website`), aplicar _rate limit_ por IP (`5 req / 60s`), escapar HTML/cabeceras con `validator`.
- Guardar en `contact_messages` (si hay BD) y notificar vía Resend (`onboarding@resend.dev` en sandbox).
