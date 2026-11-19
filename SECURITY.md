# Política de Seguridad

## Versiones Soportadas

| Versión                  | Estado                                     |
| :----------------------- | :----------------------------------------- |
| `0.1.x` (`main` / `dev`) | Soportada con parches de seguridad activos |

## Reporte Privado de Vulnerabilidades

Por favor **no abras issues públicos** para reportar fallos de seguridad, fugas de credenciales o bypass de permisos.

Reporta cualquier hallazgo de forma privada mediante **GitHub Security Advisories** en el repositorio (`Security → Advisories → Report a vulnerability`) o contactando directamente a los mantenedores (`@TuMyXx93` / `@Tumi-dev`). Confirmaremos la recepción en un plazo máximo de 72 horas.

## Controles de Seguridad Implementados

- **Autorización RBAC en servidor (`src/lib/auth/guards.ts`):** Todas las rutas administrativas (`/admin/*`, `/api/admin/*`) validan sesión activa en Better Auth y permisos explícitos por recurso/acción (`superadmin` vs `admin`).
- **Cabeceras HTTP defensivas (`next.config.ts`):** `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy`.
- **Protección del endpoint de contacto (`POST /api/contact`):**
  - Límite estricto de lectura en streaming de `16 KiB` (`413` al exceder).
  - Validación con Zod (`src/lib/contact/schema.ts`), _honeypot_ antispam y _rate limiting_ por IP (`5 req / 60s`).
  - Escape HTML y saneamiento de cabeceras CRLF antes de enviar vía Resend.
  - Registros JSON estructurados sin PII (cero nombres, correos, IPs o mensajes en logs).
- **Subida directa de medios (`src/lib/storage/`):** Tokens firmados en servidor con lista blanca de MIME (`jpeg`, `png`, `webp`, `avif`) y tope de `10 MB` sin pasar binarios por funciones serverless.
- **Cadena de suministro y análisis estático:** `pnpm-workspace.yaml` exige `minimumReleaseAge: 1440` (24 horas), `pnpm audit --prod --audit-level=high` en CI, análisis semanal con **CodeQL** y actualizaciones revisadas vía **Dependabot**.
- **Higiene de secretos:** `.env` y `.env.*` están excluidos en `.gitignore`; las claves de producción residen únicamente en Environment Variables de Vercel.
