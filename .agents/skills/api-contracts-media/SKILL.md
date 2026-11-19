---
name: api-contracts-media
description: >-
  Use when implementing or debugging API routes, Zod contracts, Resend contact
  email flows, rate limiting, ISR cache revalidation, or direct-to-storage media
  uploads (Vercel Blob now, Cloudflare R2 ready).
---

# Contratos API, Contacto (Resend) y Subida Directa de Medios

## 1. Contratos API con Zod Compartido

- Toda entrada HTTP/Action se valida en servidor con Zod (`src/lib/contact/schema.ts`, `src/lib/cms/schemas.ts`).
- Responder siempre errores estructurados JSON (`{ error, details? }`) con códigos HTTP semánticos (`400`, `401`, `403`, `413`, `429`, `500`, `503`).
- Al mutar contenido público desde `/api/admin/*`, invocar `revalidateTag('site-content', 'max')` y `revalidatePath('/')` / `revalidatePath('/proyectos')`.

## 2. Subida Directa de Imágenes (> 4.5 MB en Vercel)

- **Restricción Vercel:** Las Serverless Functions rechazan payloads `> 4.5 MB` (`413`).
- **Patrón obligatorio:** Usar la capa `src/lib/storage/`:
  - Demo actual: `@vercel/blob/client` (`upload(...)` en cliente + `handleUpload(...)` en `POST /api/admin/media/upload`, autenticado por RBAC).
  - Migración futura a **Cloudflare R2**: cambiar `STORAGE_PROVIDER=r2` e implementar presigned `PUT` URLs en `src/lib/storage/r2.ts` sin alterar componentes UI.
- Permitir únicamente MIME de imagen seguros (`image/jpeg`, `image/png`, `image/webp`, `image/avif`) y máximo `10 MB`.

## 3. Contacto Híbrido (BD + Resend)

- Limitar lectura del payload a `16 KiB`, validar con Zod, verificar _honeypot_ (`website`), aplicar _rate limit_ por IP (`5 req / 60s`), escapar HTML/cabeceras con `validator`.
- Guardar en `contact_messages` (si hay BD) y notificar vía Resend.
- **Límite Resend Sandbox:** Con `onboarding@resend.dev` (sin dominio verificado), Resend solo entrega al email propietario de la cuenta Resend (`correoprueba1993@gmail.com`) y tiene tope de `100 correos/día`.

## 4. Pruebas Rápidas de API desde Terminal Windows (`curl.exe` + `jq`)

```powershell
# Health / rechazo de payload inválido en contacto
curl.exe -s -X POST http://localhost:3000/api/contact `
  -H "Content-Type: application/json" `
  -d '{"firstName":"A"}' | jq .

# Confirmar bloqueo RBAC sin sesión (debe devolver 401)
curl.exe -i http://localhost:3000/api/admin/users
```
