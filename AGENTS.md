# AGENTS.md — Corporación Tejer Paz

> Fuente única de verdad para agentes, IDEs y harnesses (Antigravity, OpenCode, Codex, Claude Code, VS Code).
> Diseñado bajo criterios empíricos (conciso, `<120` líneas, solo reglas no inferibles; detalle por dominio en `.agents/skills/`).

## Stack y Toolchain Estricto

- **Aplicación:** Next.js 16.4 (App Router, RSC + ISR) · React 19 · TypeScript 5.9 (`strict`) · Tailwind CSS v4 (`@theme`).
- **Backend / Datos:** Drizzle ORM 0.45 · Neon Postgres · Better Auth 1.7 (RBAC `superadmin` | `admin`) · Vercel Blob (abstraído para futura migración a Cloudflare R2) · Resend · Zod 4.
- **Runtime obligatorio:** Node `26.13.1` y **`pnpm 12.21.0` exclusivamente**.
- **Prohibido:** Nunca ejecutar `npm` ni `npx`; usar `pnpm`, `pnpm exec` o `pnpm dlx`.

## Comandos de Verificación

```powershell
pnpm run format:check    # Prettier
pnpm run type-check      # tsc --noEmit
pnpm run lint            # ESLint 9 flat config
pnpm run test:coverage   # Vitest + umbrales V8 (>=85% líneas/funciones, >=80% ramas)
pnpm run build           # next build (producción)
pnpm run test:e2e        # Playwright + @axe-core/playwright
```

Antes de cerrar cualquier cambio en `src/`, ejecutar `format:check`, `type-check`, `lint`, `test:coverage` y `build`.

## Flujo Git y Ramas

- **`dev`**: rama activa de desarrollo diario y origen de Pull Requests de features/fixes.
- **`main`**: rama protegida exclusiva para despliegue en Vercel Producción; solo acepta PRs desde `dev` con CI verde y aprobación de otro colaborador (`@Tumi-dev`). Prohibido hacer push directo a `main`.

## Guardarraíles Críticos (No Negociables)

1. **Autorización RBAC siempre en servidor:** Toda ruta `/admin`, Server Action y endpoint `/api/admin/*` debe validar sesión y permisos mediante `src/lib/auth/guards.ts` (`superadmin` vs `admin`). Ocultar controles en UI nunca sustituye la validación en servidor.
2. **Límite de 4.5 MB en Vercel Serverless:** Nunca pasar binarios grandes por endpoints serverless. Toda subida multimedia usa **direct upload** desde cliente mediante `src/lib/storage/` (`@vercel/blob/client`, intercambiable por presigned URLs de Cloudflare R2).
3. **Secretos y PII:** Nunca leer, registrar ni commitear `.env`, `.env.local`, API keys, tokens ni PII de formularios en Git, logs, MCP o Engram. Solo `.env.example` puede versionarse.
4. **Resiliencia de páginas públicas:** `/` y `/proyectos` renderizan como Server Components con caché ISR (`revalidateTag('site-content')`) y respaldo automático a `src/data/default-content.ts` si `DATABASE_URL` no está configurada en entorno local/CI.
5. **Formulario de contacto híbrido:** Validar con el esquema Zod compartido (`src/lib/contact/schema.ts`), aplicar _honeypot_ y _rate limit_, persistir en `contact_messages` cuando haya BD, y notificar vía Resend (recordar que `onboarding@resend.dev` solo entrega al email dueño de la cuenta Resend hasta verificar dominio propio).
6. **Flujo de trabajo:** FTD + ODD (entregas pequeñas verificables y revisión visual). Evitar sobre-ingeniería documental o arneses burocráticos.

## Skills bajo Demanda (`.agents/skills/` — Estándar AAIF)

Cargar solo la skill correspondiente a la tarea (divulgación progresiva):

- `brand-ui-ux-tejer-paz` — Identidad visual, tokens Tailwind v4, accesibilidad WCAG AA y verificación con Playwright/axe.
- `backend-db-rbac` — Esquema Drizzle, Neon Postgres, Better Auth (`superadmin`/`admin`) y bootstrap seguro.
- `api-contracts-media` — Contratos Zod, Resend, direct uploads Vercel Blob/R2 y pruebas con `curl.exe` + `jq`.
- `vercel-git-ops` — Flujos seguros con `git`, `gh` CLI y `pnpm exec vercel` (sin MCPs mutantes).
- `codebase-nav-memory` — Búsqueda rápida en Windows (`rg`, `fd`, `jq`) e higiene de memoria local en Engram.

## MCPs y Memoria (Engram + Context7)

- **Context7** (`https://mcp.context7.com/mcp`): consultar documentación actualizada de Next.js 16, Tailwind v4, Better Auth, Drizzle y Vercel Blob antes de usar APIs sensibles a versión.
- **Engram** (local, `--project corporation`, sin _cloud sync_ automático): consultar `mem_context` / `engram context --project corporation` al iniciar una tarea no trivial y guardar únicamente decisiones arquitectónicas, hallazgos técnicos o correcciones de bugs (nunca secretos ni PII).
