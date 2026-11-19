# Guía de Entorno Local (Windows) y Despliegue en Vercel

## 1. Requisitos Previos

- **Node.js `26.13.1`** y **`pnpm 12.21.0`** (`node -v` y `pnpm -v`).
- Cuenta en **Neon Postgres** (plan Free con conexión pooled y directa).
- Proyecto en **Vercel** con **Vercel Blob** (store público) y cuenta en **Resend**.

---

## 2. Configuración Local (`.env.local`)

Copia `.env.example` a `.env.local` (archivo ignorado por Git; **nunca** versiones secretos reales):

```powershell
Copy-Item .env.example .env.local
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Variables requeridas:

| Variable                              | Uso                                                                                          | Preview (`dev`) | Producción (`main`) |
| :------------------------------------ | :------------------------------------------------------------------------------------------- | :-------------: | :-----------------: |
| `DATABASE_URL`                        | Cadena **pooled** de Neon para runtime serverless                                            |       Sí        |         Sí          |
| `DATABASE_URL_UNPOOLED`               | Cadena **direct** de Neon para `drizzle-kit`                                                 |    Opcional     |      Opcional       |
| `BETTER_AUTH_SECRET`                  | Secreto aleatorio de 32 bytes en hexadecimal                                                 |       Sí        |         Sí          |
| `BETTER_AUTH_URL`                     | URL canónica (local `http://localhost:3000`; en Preview Vercel usa `VERCEL_BRANCH_URL` auto) |   Auto/Manual   |    Sí (`https`)     |
| `NEXT_PUBLIC_APP_URL`                 | URL pública canónica para SEO/sitemap (`https://...`)                                        |   Auto/Manual   |    Sí (`https`)     |
| `STORAGE_PROVIDER`                    | `vercel-blob` (o `r2` con adaptador futuro)                                                  |  `vercel-blob`  |    `vercel-blob`    |
| `BLOB_READ_WRITE_TOKEN`               | Token Read/Write de Vercel Storage → Blob                                                    |       Sí        |         Sí          |
| `RESEND_API_KEY`                      | Clave API de Resend                                                                          |       Sí        |     Sí (rotada)     |
| `CONTACT_FROM_EMAIL`                  | Remitente (`onboarding@resend.dev` hasta verificar dominio propio)                           |       Sí        |         Sí          |
| `CONTACT_TO_EMAIL`                    | Correo receptor institucional (en sandbox Resend debe ser el titular de la cuenta Resend)    |       Sí        |         Sí          |
| `BOOTSTRAP_SUPERADMIN_EMAIL/PASSWORD` | Solo para el comando inicial `pnpm run admin:bootstrap` en local                             |   Solo local    |      No subir       |

---

## 3. Inicialización de Base de Datos, Medios y Superadministrador

```powershell
pnpm run db:push            # Sincroniza tablas y columnas JSONB en Neon
pnpm run db:seed            # Carga textos, áreas, proyectos y settings base de Tejer Paz
pnpm run admin:bootstrap    # Crea o promueve el primer superadmin desde .env.local
pnpm run media:migrate-blob # Sincroniza blobs y migra public/images/ a Vercel Blob
pnpm run dev                # Inicia servidor local en http://localhost:3000
```

_(También puedes sincronizar o migrar imágenes locales hacia Vercel Blob directamente desde **Panel Admin → Multimedia**)._

---

## 4. Despliegue en Vercel (`dev` → Preview, `main` → Producción)

1. Conecta el repositorio `TuMyXx93/corporacion-tejer-paz` en Vercel configurando:
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm run build`
   - **Install Command:** `pnpm install --frozen-lockfile`
   - **Node.js Version:** `26.x`
   - **Production Branch:** `main`
2. Verifica en Vercel **Settings → Environment Variables** y **Storage → Blob** que todas las variables de entorno críticas estén cargadas tanto en **Preview** como en **Production** (con `Sensitive` habilitado donde aplique y credenciales de Producción independientes).
3. Flujo seguro de liberación:
   - Todo desarrollo se trabaja en `dev` (o ramas `feat/*` / `fix/*` hacia `dev`), generando despliegues **Preview** automáticos en Vercel y ejecutando CI + CodeQL.
   - Para liberar a **Producción (`main`)**, abre un Pull Request de **`dev` → `main`**. El ruleset de GitHub exige CI en verde (`Quality, Coverage & Audit` y `Build & E2E Accessibility`) y aprobación de `@Tumi-dev` antes del merge que dispara Producción en Vercel.
