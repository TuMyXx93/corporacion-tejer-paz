# Changelog

Todos los cambios notables de este proyecto se documentan aquí siguiendo [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [Versionado Semántico](https://semver.org/lang/es/).

## [Unreleased]

## [0.1.0] - 2026-11-19

### Added

- Plataforma pública en **Next.js 16.4 (App Router, RSC + ISR)** + **Tailwind CSS v4** para `/` (Inicio) y `/proyectos`, con respaldo automático a `src/data/default-content.ts` cuando `DATABASE_URL` no está definida.
- Sistema visual oficial de **Corporación Tejer Paz** (`#FDF9F2`, `#4D3F32`, `#6A543D`, `#FFD32E`, `#B58C61`, `#FFF0B1`) y fuentes autoalojadas `Syne` y `Public Sans` vía `next/font/google`.
- Solución a deficiencias heredadas del sitio Wix: logotipo responsive sin duplicación ni recorte móvil, ancla funcional `#nuestra-mision`, `<h1>` único por página, descripciones de proyectos visibles, contraste WCAG AA y enlaces `mailto:`/`tel:` clicables.
- Panel administrativo (`/admin`, `/admin/login`) con autenticación **Better Auth 1.7** y matriz RBAC en servidor para roles `superadmin` y `admin` (edición de secciones, gestión de proyectos, subida directa de imágenes, bandeja de mensajes, configuración global y gestión de usuarios).
- Persistencia con **Drizzle ORM 0.45** y **Neon Postgres** (`schema.ts`, `seed.ts`, `bootstrap-admin.ts`).
- Capa de almacenamiento desacoplada (`src/lib/storage/`) con `@vercel/blob/client` (`<= 10 MB`, evitando límite `4.5 MB` de Vercel) preparada para migrar a Cloudflare R2.
- Endpoint seguro `POST /api/contact` (límite `16 KiB`, _rate limit_, _honeypot_, validación Zod, escape HTML/CRLF, persistencia en BD y envío vía Resend).
- Suite de pruebas unitarias/API con **Vitest** + cobertura V8 y pruebas E2E + accesibilidad con **Playwright** y `@axe-core/playwright`.
- Documentación Diátaxis (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`), flujo Git `dev` → `main` con `CODEOWNERS`, Dependabot, **CodeQL** y pipeline estricto de **CI** en GitHub Actions.
