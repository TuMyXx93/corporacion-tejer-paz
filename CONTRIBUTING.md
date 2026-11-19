# Guía de Contribución

¡Gracias por contribuir a **Corporación Tejer Paz**! Este repositorio sigue un flujo estricto de ramas y validación automática para proteger la rama de producción en Vercel.

## Modelo de Ramas y Despliegue

| Rama                         | Propósito                       | Despliegue en Vercel | Regla de Protección                                                                                                                                     |
| :--------------------------- | :------------------------------ | :------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `main`                       | Producción estable              | Producción           | **Protegida (Ruleset):** solo Pull Requests desde `dev` con CI en verde y aprobación de otro colaborador (`@Tumi-dev`). Sin push directo ni force-push. |
| `dev`                        | Integración y desarrollo activo | Preview automático   | Prohibido `push --force` o eliminación de rama.                                                                                                         |
| `feat/*`, `fix/*`, `chore/*` | Ramas de trabajo temporal       | Preview por PR       | Se crean desde `dev` y se integran a `dev` mediante PR.                                                                                                 |

## Toolchain Obligatorio

- **Node.js:** `26.13.1` (definido en `.node-version`)
- **Gestor de paquetes:** **`pnpm 12.21.0` exclusivamente** (`npm` y `npx` están bloqueados por el script `preinstall`).

## Flujo de Trabajo Paso a Paso

1. Asegúrate de partir de `dev` actualizada:
   ```powershell
   git checkout dev
   git pull origin dev
   git checkout -b feat/mi-cambio
   ```
2. Implementa cambios pequeños y verificables. Nunca modifiques ni commitees `.env` o `.env.local` (usa `.env.example` para documentar variables nuevas).
3. Usa mensajes de commit semánticos (_Conventional Commits_):
   - `feat(admin): ...`
   - `fix(contact): ...`
   - `docs(api): ...`
   - `test(rbac): ...`
   - `chore(ci): ...`
4. Antes de abrir el Pull Request, ejecuta el gate completo localmente:
   ```powershell
   pnpm run format
   pnpm run format:check
   pnpm run lint
   pnpm run type-check
   pnpm run test:coverage
   pnpm run build
   pnpm run test:e2e
   ```
5. Abre el PR hacia `dev` (o de `dev` hacia `main` para liberar a producción) completando la plantilla de PR y asegurando que todos los checks de GitHub Actions y la revisión de `@Tumi-dev` pasen en verde.
