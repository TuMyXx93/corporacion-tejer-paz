## Resumen del cambio

<!-- Describe brevemente qué resuelve este PR y por qué. -->

## Rama destino

- [ ] `dev` (desarrollo diario / feature / fix)
- [ ] `main` (promoción de `dev` a Producción en Vercel — requiere aprobación de `@Tumi-dev` y CI en verde)

## Checklist de calidad

- [ ] Ejecuté `pnpm run format:check`, `pnpm run lint` y `pnpm run type-check` sin errores
- [ ] Ejecuté `pnpm run test:coverage` manteniendo umbrales de cobertura V8
- [ ] Ejecuté `pnpm run build` y `pnpm run test:e2e` (incluyendo `@axe-core/playwright`)
- [ ] Validé que todo endpoint/action admin verifica RBAC en servidor (`superadmin` vs `admin`)
- [ ] Confirmé que no hay secretos, `.env.local` ni PII en el diff
