# Guía de Entorno Local (Windows) y Despliegue en Vercel

## 1. Requisitos Previos

- **Node.js `26.13.1`** y **`pnpm 12.21.0`** (`node -v` y `pnpm -v`).
- Cuenta en **Neon Postgres** (plan Free: `1 GB`, sin pausa automática tras 7 días de inactividad).
- Proyecto en **Vercel** con **Vercel Blob** (demo) y cuenta en **Resend**.

## 2. Configuración Local (`.env.local`)

Copia `.env.example` a `.env.local` (nunca versiones `.env.local`):

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Variables necesarias:

- `DATABASE_URL`: cadena **pooled** de Neon (uso en runtime / funciones serverless).
- `DATABASE_URL_UNPOOLED`: cadena **direct** de Neon (migraciones `drizzle-kit`).
- `BETTER_AUTH_SECRET`: secreto aleatorio generado arriba.
- `BETTER_AUTH_URL` y `NEXT_PUBLIC_APP_URL`: `http://localhost:3000` en local; URL pública `https://...` en Vercel.
- `STORAGE_PROVIDER=vercel-blob` y `BLOB_READ_WRITE_TOKEN` (de Vercel Storage → Blob).
- `RESEND_API_KEY`, `CONTACT_FROM_EMAIL=onboarding@resend.dev`, `CONTACT_TO_EMAIL` (en sandbox Resend usar el correo dueño de la cuenta Resend hasta verificar dominio propio).
- `BOOTSTRAP_SUPERADMIN_EMAIL` y `BOOTSTRAP_SUPERADMIN_PASSWORD` (mín. 10 caracteres; solo para el comando inicial).

## 3. Inicialización de Base de Datos y Primer Superadministrador

```powershell
pnpm run db:push          # Sincroniza tablas en Neon
pnpm run db:seed          # Carga textos e imágenes iniciales de Tejer Paz
pnpm run admin:bootstrap  # Crea o promueve el primer superadmin desde .env.local
pnpm run dev              # Inicia en http://localhost:3000
```

## 4. Despliegue en Vercel (`dev` → Preview, `main` → Producción)

1. Conecta el repositorio `TuMyXx93/corporacion-tejer-paz` en Vercel configurando **Production Branch = `main`** y **Node.js = 26.x**.
2. Carga las mismas variables de entorno en Vercel (Preview para `dev`/PRs y Production para `main`, rotando `RESEND_API_KEY` y usando credenciales distintas para producción).
3. Flujo seguro de liberación:
   - Todo desarrollo ocurre en ramas desde `dev` y se integra a `dev` mediante PR (generando una URL Preview automática en Vercel).
   - Para llevar cambios a **Producción (`main`)**, abre un Pull Request de **`dev` → `main`**. GitHub exige que los checks de CI (`Quality, Coverage & Audit` y `Build & E2E Accessibility`) pasen en verde y que `@Tumi-dev` apruebe el PR antes del merge.
