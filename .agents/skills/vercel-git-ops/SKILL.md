---
name: vercel-git-ops
description: >-
  Use when managing Git branches, Pull Requests via GitHub CLI (gh), environment
  variables, or preview/production deployments on Vercel via the local vercel CLI.
---

# Operaciones Git, GitHub (`gh`) y Despliegue Vercel (`pnpm exec vercel`)

Reemplaza MCPs de GitHub/Vercel con CLIs locales auditables y con alcance acotado.

## 1. Higiene de Git y GitHub CLI (`gh`)

- Nunca desarrollar directamente sobre `main` una vez publicado; usar ramas descriptivas (`feat/...`, `fix/...`, `chore/...`) y abrir PR hacia `main`.
- Antes de cualquier commit o PR, verificar que ningún secreto esté rastreado:

```powershell
git status --short
git diff --cached --name-only
pnpm run type-check; pnpm run lint; pnpm run test; pnpm run build
```

- Flujo con `gh`:

```powershell
gh auth status
gh pr create --fill
gh pr checks --watch
gh run list --limit 5
```

## 2. Flujo con Vercel CLI (exclusivamente vía `pnpm exec`)

```powershell
pnpm exec vercel link                       # Enlazar repo a proyecto Vercel
pnpm exec vercel env ls                     # Listar variables (sin exponer secretos en logs)
pnpm exec vercel env pull .env.local        # Sincronizar env vars locales (archivo gitignored)
pnpm exec vercel build                      # Verificar build compatible con Vercel localmente
pnpm exec vercel deploy                     # Despliegue Preview para revisión
pnpm exec vercel deploy --prod              # Despliegue a Producción (solo tras confirmación)
pnpm exec vercel logs --follow              # Inspeccionar logs de funciones serverless
```

## 3. Guardarraíles de Seguridad

- Prohibido ejecutar `vercel deploy --prod` o `git push --force` sin confirmación explícita del usuario.
- Verificar en `vercel.json` / Vercel Project Settings que el runtime sea **Node.js `26.x`** y el gestor **`pnpm`**.
- Recordar: Vercel Hobby es para desarrollo/demo; para operación institucional oficial de la ONG evaluar plan Pro/Nonprofit o despliegue portable.
