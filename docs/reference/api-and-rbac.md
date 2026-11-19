# Referencia de Contratos API y Matriz RBAC

## 1. Matriz de Permisos RBAC (`src/lib/auth/permissions.ts`)

La autorización se valida siempre en servidor mediante `requireApiPermission(resource, action)` en `src/lib/auth/guards.ts`. Adicionalmente, `getServerActor()` rechaza cualquier sesión cuya cuenta tenga `banned = true`.

| Recurso    | Acción                                                        |   `admin`    | `superadmin` |
| :--------- | :------------------------------------------------------------ | :----------: | :----------: |
| `section`  | `read`, `update`                                              |      Sí      |      Sí      |
| `area`     | `read`, `create`, `update`, `delete`                          |      Sí      |      Sí      |
| `project`  | `read`, `create`, `update`, `delete`                          |      Sí      |      Sí      |
| `media`    | `read`, `create`, `update`, `delete`                          |      Sí      |      Sí      |
| `message`  | `read`, `update`, `delete`                                    |      Sí      |      Sí      |
| `settings` | `read`                                                        |      Sí      |      Sí      |
| `settings` | `update`                                                      | **No (403)** |      Sí      |
| `audit`    | `read`                                                        | **No (403)** |      Sí      |
| `user`     | `list`, `create`, `set-role`, `ban`, `set-password`, `delete` | **No (403)** |      Sí      |

---

## 2. Endpoints Públicos y de Autenticación

| Endpoint             | Método        | Validación / Seguridad                                                                                                                                                   | Respuestas                        |
| :------------------- | :------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| `/api/contact`       | `POST`        | Límite lectura `16 KiB`, rate limit `5 req/60s` por IP (poda en memoria `> 500` claves), `contactSchema` (Zod), honeypot `website`, escape HTML/CRLF, BD + envío Resend. | `200`, `400`, `413`, `429`, `503` |
| `/api/auth/[...all]` | `GET`, `POST` | Manejador oficial de Better Auth (`emailAndPassword` mínimo 10 caracteres, cookies `HttpOnly`, orígenes Preview/Prod dinámicos, plugin `admin`).                         | Según Better Auth / `503` sin BD  |

> **Nota sobre Resend Sandbox:** Mientras `CONTACT_FROM_EMAIL` sea `onboarding@resend.dev` (sin dominio propio verificado), Resend solo permite entregar notificaciones al correo titular de la cuenta Resend. El mensaje siempre queda guardado en `contact_messages` cuando hay base de datos activa.

---

## 3. Endpoints Administrativos (`/api/admin/*`)

Todos requieren sesión activa válida (`401` si falta o está suspendida, `503` si falta BD) y permiso RBAC (`403` si el rol no está autorizado). Cada mutación registra trazabilidad en `audit_logs`.

| Endpoint                  | Métodos                          | Esquema / Límite                                                                   | Efecto                                                                                                                                                              |
| :------------------------ | :------------------------------- | :--------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `/api/admin/sections`     | `GET`, `PATCH`                   | `updateSectionSchema` (`mediaItems`, `documents`)                                  | Edita secciones (`hero`, `mission`, `community_impact`, `contact_intro`, `projects_intro`, `projects_impact`), registra auditoría y revalida `/` y `/proyectos`.    |
| `/api/admin/action-areas` | `GET`, `POST`, `PATCH`, `DELETE` | `createActionAreaSchema` / `updateActionAreaSchema` / `?id=`                       | CRUD completo de áreas de acción visibles en la portada principal con verificación de slug único y revalidación ISR de `/`.                                         |
| `/api/admin/projects`     | `GET`, `POST`, `PATCH`, `DELETE` | `createProjectSchema` / `updateProjectSchema` (`mediaItems`, `documents`) / `?id=` | CRUD completo de iniciativas con verificación de slug único, publicación/borrador y revalidación de `/` y `/proyectos`.                                             |
| `/api/admin/media`        | `GET`, `POST`, `PATCH`, `DELETE` | `registerMediaAssetSchema` / `updateMediaAssetSchema` / `?id=`                     | Lista activos (`image`, `pdf`, `video`), registra blobs o enlaces YouTube/Vimeo (`https://`), edita título/alt y elimina en BD + Vercel Blob (`del()`).             |
| `/api/admin/media/upload` | `POST`                           | Direct upload `@vercel/blob/client` (`<= 10 MB` imagen, `<= 15 MB` `.pdf`)         | Emite token firmado (`onBeforeGenerateToken` por tipo de archivo) y persiste automáticamente en `media_assets` (`onUploadCompleted`).                               |
| `/api/admin/media/sync`   | `POST`                           | `{ migrateLocal?: boolean }`                                                       | Sincroniza blobs existentes del store Vercel Blob hacia PostgreSQL y, si `migrateLocal=true`, sube `public/images/*` actualizando referencias + caché ISR.          |
| `/api/admin/messages`     | `GET`, `PATCH`, `DELETE`         | `updateMessageStatusSchema` (`new`, `read`, `replied`, `archived`) / `?id=`        | Lista, cambia estado semaforizado / archivado y elimina mensajes de forma definitiva con registro de auditoría.                                                     |
| `/api/admin/settings`     | `GET`, `PATCH`                   | `updateSiteSettingsSchema` (`PATCH` exclusivo `superadmin`, `instagramUrl` HTTPS)  | Actualiza marca, SEO, correo, teléfonos, Instagram y logotipo institucional; revalida ISR.                                                                          |
| `/api/admin/users`        | `GET`, `POST`, `PATCH`, `DELETE` | `createAdminUserSchema` / `updateAdminUserSchema` / `?id=` (solo `superadmin`)     | Alta de cuentas, cambio de rol/nombre, suspensión con revocación de filas en `session`, cambio de clave y borrado (impide tocar propia cuenta o último superadmin). |
| `/api/admin/audit`        | `GET`                            | Solo `superadmin` (`audit:read`)                                                   | Retorna los últimos 50 eventos ordenados cronológicamente desde `audit_logs`.                                                                                       |
