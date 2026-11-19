# Corporación Tejer Paz — Plataforma Web & Panel Administrativo

[![CI](https://github.com/TuMyXx93/corporacion-tejer-paz/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TuMyXx93/corporacion-tejer-paz/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-12.21.0-f69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG_2.1-AA-15803d?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

Plataforma institucional de **Corporación Tejer Paz** (construcción de paz, defensa de derechos humanos y protección territorial en el suroccidente colombiano) con sistema visual **60-30-10** derivado del logotipo oficial, sitio público optimizado por ISR, multimedia híbrida (imágenes en Vercel Blob, videos YouTube/Vimeo con privacidad y cartillas PDF), formulario de contacto híbrido y panel administrativo modular con RBAC (`superadmin` | `admin`).

---

## Inicio Rápido

> **Requisito estricto:** Node `26.13.1` y **`pnpm 12.21.0`** exclusivamente (`npm` bloqueado por script `preinstall`).

```powershell
# 1. Clonar repositorio en la rama de desarrollo
git clone -b dev https://github.com/TuMyXx93/corporacion-tejer-paz.git
cd corporacion-tejer-paz

# 2. Instalar dependencias
pnpm install

# 3. Configurar entorno local (ignorado por Git)
Copy-Item .env.example .env.local
# Completa DATABASE_URL, DATABASE_URL_UNPOOLED, BETTER_AUTH_SECRET, BLOB_READ_WRITE_TOKEN y RESEND_API_KEY

# 4. Inicializar base de datos, contenido institucional y primer superadmin
pnpm run db:push
pnpm run db:seed
pnpm run admin:bootstrap

# 5. (Opcional) Sincronizar blobs y migrar imágenes iniciales de public/images/ a Vercel Blob
pnpm run media:migrate-blob

# 6. Levantar entorno de desarrollo
pnpm run dev
```

_(Si aún no configuras `DATABASE_URL`, las páginas públicas `/` y `/proyectos` renderizan automáticamente con el respaldo editorial en [`src/data/default-content.ts`](./src/data/default-content.ts))._

---

## Características Principales

- **Identidad Visual 60-30-10:** Paleta muestreada del logotipo (`#FCFBF8`, `#3B2816`, `#6E4713`, `#C68E28`, `#FBF3DF`), tipografía `Syne` + `Public Sans`, cabecera translúcida adaptativa (`SiteHeader`) con contraste dinámico en secciones claras/oscuras y Hero panorámico `45:17` sin recorte en móvil/desktop.
- **Panel Administrativo Modular (`/admin`) con 7 Módulos:**
  1. **Secciones:** textos, visibilidad, imagen principal, galerías mixtas y documentos PDF por sección.
  2. **Áreas de Acción:** CRUD completo con orden, activación y confirmación destructiva segura.
  3. **Proyectos:** CRUD completo, publicación/borrador, galería mixta (imágenes + videos) y PDFs adjuntos.
  4. **Multimedia:** biblioteca unificada con subida directa a Vercel Blob (`<= 10 MB` imágenes, `<= 15 MB` PDFs), registro de videos YouTube/Vimeo y sincronización/migración Blob.
  5. **Mensajes:** bandeja semaforizada (`Nuevo`, `Leído`, `Respondido`), carpeta dedicada de `Archivados`, respuesta `mailto:` y eliminación segura.
  6. **Configuración:** marca, SEO, teléfonos, correo, Instagram (`https://`) y logotipo (escritura exclusiva `superadmin`).
  7. **Usuarios y Roles:** alta, edición de rol, restablecimiento de contraseña, suspensión con revocación inmediata de sesiones, eliminación y registro de auditoría (`superadmin`).

---

## Stack Tecnológico

| Capa                   | Tecnología                                                            | Propósito                                                                   |
| :--------------------- | :-------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Framework & UI**     | Next.js 16.4 (App Router, RSC + ISR) · React 19 · Tailwind CSS v4     | Sitio público rápido, SEO nativo y panel administrativo responsivo          |
| **Tipado y Contratos** | TypeScript 5.9 (`strict`) · Zod 4                                     | Validación compartida cliente/servidor                                      |
| **Auth y RBAC**        | Better Auth 1.7 (`admin` plugin + `createAccessControl`)              | Sesiones en BD, orígenes Preview/Prod y matriz `superadmin` vs `admin`      |
| **Base de Datos**      | Drizzle ORM 0.45 · Neon Postgres (`@neondatabase/serverless`)         | Secciones, áreas de acción, proyectos, medios JSONB, mensajes y auditoría   |
| **Media Storage**      | Vercel Blob (`@vercel/blob/client`, abstraído para Cloudflare R2)     | Subida directa cliente (imágenes `<= 10 MB`, PDFs `<= 15 MB`, embeds HTTPS) |
| **Mensajería**         | Resend 6 + persistencia en `contact_messages`                         | Notificación por correo + bandeja administrativa semaforizada               |
| **Calidad y CI/CD**    | Vitest 5 (V8 coverage) · Playwright + `@axe-core/playwright` · CodeQL | Cobertura unitaria/API, E2E (`1440px`, `390px`, `360px`) y WCAG AA          |

---

## Documentación (Estándar Diátaxis)

Explora el índice completo en [`docs/README.md`](./docs/README.md):

- **Tutoriales y Operación:** [Guía de Entorno Local y Despliegue en Vercel](./docs/guides/local-and-deployment.md) · [Guía de Contribución y Flujo Git (`dev` → `main`)](./CONTRIBUTING.md)
- **Referencia Técnica:** [Contratos API y Matriz RBAC](./docs/reference/api-and-rbac.md) · [Política de Seguridad](./SECURITY.md)
- **Explicación y Arquitectura:** [Arquitectura del Sistema e ISR](./docs/architecture/overview.md) · [Historial de Cambios](./CHANGELOG.md)

---

## Gates de Verificación Local

```powershell
pnpm audit --prod --audit-level=high  # 0 vulnerabilidades altas/críticas
pnpm run format:check                 # Prettier
pnpm run lint                         # ESLint 9
pnpm run type-check                   # tsc --noEmit
pnpm run test:coverage                # Vitest + umbrales V8 (>=85% líneas/funciones/sentencias, >=80% ramas)
pnpm run build                        # next build (producción)
pnpm run test:e2e                     # Playwright + @axe-core/playwright (1440px, 390px y 360px)
```
