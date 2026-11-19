# Referencia de Contratos API y Matriz RBAC

## 1. Matriz de Permisos RBAC (`src/lib/auth/permissions.ts`)

La autorización se valida siempre en servidor mediante `requireApiPermission(resource, action)` en `src/lib/auth/guards.ts`.

| Recurso    | Acción                                        |   `admin`    | `superadmin` |
| :--------- | :-------------------------------------------- | :----------: | :----------: |
| `section`  | `read`, `update`                              |      Sí      |      Sí      |
| `project`  | `read`, `create`, `update`, `delete`          |      Sí      |      Sí      |
| `media`    | `read`, `create`, `update`, `delete`          |      Sí      |      Sí      |
| `message`  | `read`, `update`                              |      Sí      |      Sí      |
| `settings` | `read`                                        |      Sí      |      Sí      |
| `settings` | `update`                                      | **No (403)** |      Sí      |
| `audit`    | `read`                                        | **No (403)** |      Sí      |
| `user`     | `list`, `create`, `set-role`, `ban`, `delete` | **No (403)** |      Sí      |

---

## 2. Endpoints Públicos y de Autenticación

| Endpoint             | Método        | Validación / Seguridad                                                                                                                                                  | Respuestas                        |
| :------------------- | :------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------- |
| `/api/contact`       | `POST`        | Límite lectura `16 KiB`, rate limit `5 req/60s` por IP, `contactSchema` (Zod), honeypot `website`, escape HTML/CRLF, persistencia en `contact_messages` + envío Resend. | `200`, `400`, `413`, `429`, `503` |
| `/api/auth/[...all]` | `GET`, `POST` | Manejador oficial de Better Auth (`emailAndPassword`, cookies `HttpOnly`, plugin `admin`).                                                                              | Según Better Auth / `503` sin BD  |

> **Nota sobre Resend Sandbox:** Mientras `CONTACT_FROM_EMAIL` sea `onboarding@resend.dev` (sin dominio propio verificado), Resend solo permite entregar notificaciones al correo titular de la cuenta Resend. El mensaje siempre queda guardado en `contact_messages` cuando hay base de datos activa.

---

## 3. Endpoints Administrativos (`/api/admin/*`)

Todos requieren sesión válida (`401` si falta, `503` si falta BD) y permiso RBAC (`403` si el rol no está autorizado).

| Endpoint                  | Métodos                          | Esquema / Límite                                                           | Efecto                                                                                                                                               |
| :------------------------ | :------------------------------- | :------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/admin/sections`     | `GET`, `PATCH`                   | `updateSectionSchema`                                                      | Edita secciones (`hero`, `mission`, `community_impact`, `contact_intro`, `projects_intro`, `projects_impact`), registra `audit_logs` y revalida ISR. |
| `/api/admin/projects`     | `GET`, `POST`, `PATCH`, `DELETE` | `createProjectSchema` / `updateProjectSchema` / `?id=`                     | Gestiona iniciativas en `projects`, registra `audit_logs` y revalida `/proyectos`.                                                                   |
| `/api/admin/media/upload` | `GET`, `POST`                    | Direct upload `@vercel/blob/client`, MIME imagen, `<= 10 MB`               | Emite token firmado (`onBeforeGenerateToken`) y registra activo en `media_assets` (`onUploadCompleted`).                                             |
| `/api/admin/messages`     | `GET`, `PATCH`                   | `updateMessageStatusSchema` (`new`, `read`, `replied`, `archived`)         | Lista y actualiza estado de mensajes recibidos.                                                                                                      |
| `/api/admin/settings`     | `GET`, `PATCH`                   | `updateSiteSettingsSchema` (`PATCH` exclusivo `superadmin`)                | Actualiza marca, SEO, correo, teléfonos, Instagram y cita; revalida ISR.                                                                             |
| `/api/admin/users`        | `GET`, `POST`, `PATCH`           | `createAdminUserSchema` / `updateAdminUserSchema` (exclusivo `superadmin`) | Lista, crea cuentas (`admin`/`superadmin`), cambia rol o suspende usuarios (impide auto-modificación).                                               |
