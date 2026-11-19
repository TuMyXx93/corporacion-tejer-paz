---
name: brand-ui-ux-tejer-paz
description: >-
  Use when designing, building, or auditing UI/UX, styling, responsive layouts,
  typography, or WCAG AA accessibility for Corporación Tejer Paz. Covers the
  verified brand tokens, Tailwind CSS v4 @theme conventions, and Playwright + axe-core checks.
---

# Brand UI/UX & Accesibilidad — Corporación Tejer Paz

## 1. Sistema de Diseño Real (Tailwind v4 `@theme` en `src/app/globals.css`)

- **Superficies cálidas:** `--color-cream: #FDF9F2` (fondo principal), `--color-sand: #EBE6DF` (superficie secundaria), `--color-butter: #FFF0B1` (franja cita).
- **Marca y contraste:** `--color-espresso: #4D3F32` (texto principal y bloques oscuros), `--color-umber: #6A543D` (CTAs y bordes), `--color-ink: #2E241C` (texto de alto contraste sobre ocre `#B58C61`).
- **Acentos territoriales:** `--color-gold: #FFD32E` (tarjeta Misión), `--color-ochre: #B58C61` (panel Impacto en `/proyectos`), `--color-taupe: #C8C1B8`, `--color-earth: #8B8075`.
- **Tipografías (`next/font/google`, autoalojadas):**
  - Display/Encabezados: `Syne` (`700`) → `font-display`.
  - Cuerpo/UI: `Public Sans` (`400`, `500`, `600`, `700` + italic) → `font-sans`.

## 2. Reglas de Corrección Frente al Wix Heredado

1. **Un solo logotipo sin recortes en móvil (`390px`):** Usar `logo-corporacion-tejer-paz.png` en cabecera/hero con `object-contain`; jamás superponer dos logos ni recortar texto en pantallas pequeñas.
2. **Jerarquía semántica estricta:** Exactamente un `<h1>` visible por página (`/` y `/proyectos`), seguido de `<h2>` y `<h3>` sin saltos (`H2 → H5` prohibido).
3. **Contraste WCAG AA (`>= 4.5:1`):** Sobre `--color-ochre` (`#B58C61`), usar texto oscuro `--color-ink` (`#2E241C`, contraste `>5.4:1`) o tarjetas internas claras; jamás texto fino `#4D3F32` de bajo contraste.
4. **Geometría coherente:** Unificar radios de botones (`rounded-lg`), respetar `prefers-reduced-motion` y ofrecer `SkipToContent` + `focus-visible` nítido.
5. **Atributos `alt` reales:** Prohibido usar nombres de archivo (`IMG_*.JPG`); todo activo del CMS exige `alt` descriptivo.

## 3. Verificación Visual y Accesibilidad (CLI local sin MCP)

```powershell
pnpm run build
pnpm run test:e2e
```

- Validar desktop (`1440×900`) y móvil (`390×844`) sin desbordamiento horizontal (`scrollWidth <= innerWidth`).
- `@axe-core/playwright` debe pasar con **0 violaciones `critical` o `serious`**.
