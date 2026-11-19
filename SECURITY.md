# Política de Seguridad

## Versiones Soportadas

| Versión                  | Estado                                     |
| :----------------------- | :----------------------------------------- |
| `0.2.x` (`main` / `dev`) | Soportada con parches de seguridad activos |

## Reporte Privado de Vulnerabilidades

Por favor **no abras issues públicos** para reportar fallos de seguridad, fugas de credenciales o bypass de permisos.

Reporta cualquier hallazgo de forma privada mediante **GitHub Security Advisories** en el repositorio (`Security → Advisories → Report a vulnerability`) o contactando directamente a los mantenedores (`@TuMyXx93` / `@Tumi-dev`). Confirmaremos la recepción en un plazo máximo de 72 horas.

## Controles de Seguridad Implementados

- **Autorización RBAC en servidor (`src/lib/auth/guards.ts`):** Todas las rutas administrativas (`/admin/*`, `/api/admin/*`) validan sesión activa en Better Auth, rechazan cuentas suspendidas (`banned`), y verifican permisos explícitos por recurso/acción (`superadmin` vs `admin`). Al suspender una cuenta se revocan sus filas activas en `session`, y se bloquea cualquier acción que degrade, suspenda o elimine al propio actor o al último `superadmin` activo.
- **Cabeceras HTTP defensivas (`next.config.ts`):** `Content-Security-Policy` (incluyendo `frame-src` estricto solo para `'self'`, `https://www.youtube-nocookie.com` y `https://player.vimeo.com`), `Strict-Transport-Security`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin` y `Permissions-Policy`.
- **Protección del endpoint de contacto (`POST /api/contact`):**
  - Límite estricto de lectura en streaming de `16 KiB` (`413` al exceder).
  - Validación con Zod (`src/lib/contact/schema.ts`), _honeypot_ antispam y _rate limiting_ por IP (`5 req / 60s` con poda automática de entradas expiradas cuando supera `500` claves).
  - Escape HTML y saneamiento de cabeceras CRLF antes de enviar vía Resend.
  - Registros JSON estructurados sin PII (cero nombres, correos, IPs o mensajes en logs).
- **Subida directa de medios y embeds (`src/lib/storage/`, `src/lib/media/embeds.ts`):** Tokens firmados en servidor con separación estricta por tipo: imágenes (`jpeg`, `png`, `webp`, `avif`) hasta `10 MB` y documentos (`application/pdf`) hasta `15 MB`, sin pasar binarios por funciones serverless. Enlaces externos de video y redes sociales exigen protocolo `https://`.
- **Cadena de suministro y análisis estático:** `pnpm-workspace.yaml` exige `minimumReleaseAge: 1440` (24 horas), `pnpm audit --prod --audit-level=high` en CI, análisis semanal con **CodeQL** y actualizaciones revisadas vía **Dependabot**.
- **Higiene de secretos:** `.env` y `.env.*` están excluidos en `.gitignore`; las claves de producción residen únicamente en Environment Variables de Vercel.
