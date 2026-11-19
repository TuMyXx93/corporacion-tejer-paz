# Corporación Tejer Paz — Plataforma Web & Panel Administrativo

[![CI](https://github.com/TuMyXx93/corporacion-tejer-paz/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/TuMyXx93/corporacion-tejer-paz/actions/workflows/ci.yml)
[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9_Strict-3178c6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![pnpm](https://img.shields.io/badge/pnpm-12.21.0-f69220?style=flat-square&logo=pnpm)](https://pnpm.io/)
[![WCAG 2.1 AA](https://img.shields.io/badge/WCAG_2.1-AA-15803d?style=flat-square)](https://www.w3.org/WAI/standards-guidelines/wcag/)

Plataforma institucional de **Corporación Tejer Paz** (construcción de paz, defensa de derechos humanos y protección territorial en el suroccidente colombiano) con sitio público optimizado por ISR, formulario de contacto híbrido y panel administrativo con control de acceso basado en roles (`superadmin` | `admin`).

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

# 5. Levantar entorno de desarrollo
pnpm run dev
```

_(Si aún no configuras `DATABASE_URL`, las páginas públicas `/` y `/proyectos` renderizan automáticamente con el respaldo editorial en `src/data/default-content.ts`)._

---

## Stack Tecnológico

| Capa                   | Tecnología                                                            | Propósito                                                         |
| :--------------------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------- |
| **Framework & UI**     | Next.js 16.4 (App Router, RSC + ISR) · React 19 · Tailwind CSS v4     | Sitio público rápido, SEO nativo y panel administrativo           |
| **Tipado y Contratos** | TypeScript 5.9 (`strict`) · Zod 4                                     | Validación compartida cliente/servidor                            |
| **Auth y RBAC**        | Better Auth 1.7 (`admin` plugin + `createAccessControl`)              | Sesiones en BD y matriz estricta `superadmin` vs `admin`          |
| **Base de Datos**      | Drizzle ORM 0.45 · Neon Postgres (`@neondatabase/serverless`)         | Secciones, proyectos, medios, mensajes y auditoría                |
| **Media Storage**      | Vercel Blob (`@vercel/blob/client`, abstraído para Cloudflare R2)     | Subida directa cliente `<= 10 MB` (evita tope `4.5 MB` de Vercel) |
| **Mensajería**         | Resend 6 + persistencia en `contact_messages`                         | Notificación por correo + bandeja administrativa                  |
| **Calidad y CI/CD**    | Vitest 5 (V8 coverage) · Playwright + `@axe-core/playwright` · CodeQL | Cobertura unitaria/API, E2E desktop/móvil y accesibilidad WCAG AA |

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
pnpm run test:coverage                # Vitest + umbrales V8 (>=85% líneas/funciones, >=80% ramas)
pnpm run build                        # next build (producción)
pnpm run test:e2e                     # Playwright + @axe-core/playwright (1440px y 390px)
```
