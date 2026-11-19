---
name: brand-ui-ux-tejer-paz
description: >-
  Use when designing, building, or auditing UI/UX, styling, responsive layouts,
  typography, or WCAG AA accessibility for Corporación Tejer Paz. Covers the
  verified logo-derived 60-30-10 brand tokens, Tailwind CSS v4 @theme conventions,
  and Playwright + axe-core checks.
---

# Brand UI/UX & Accesibilidad — Corporación Tejer Paz

## 1. Sistema Visual 60-30-10 Derivado del Logotipo (Tailwind v4 `@theme` en `src/app/globals.css`)

- **60% Neutrales cálidos dominantes:**
  - `--color-cream: #fcfbf8` (lienzo alabastro principal)
  - `--color-surface: #ffffff` (tarjetas elevadas y modales)
  - `--color-sand: #f3eee5` (superficie secundaria lino)
  - `--color-taupe: #e2d9c9` (bordes sutiles estructurales)
- **30% Tierra tejida y bronce institucional:**
  - `--color-ink: #22170c` (texto de contraste AAA `>15:1`)
  - `--color-espresso: #3b2816` (encabezados y secciones oscuras)
  - `--color-umber: #6e4713` (bronce de marca para CTAs primarios y controles activos)
  - `--color-earth: #6b5b4a` (texto secundario descriptivo `>= 5.2:1`)
- **10% Acentos oro artesanal tejido:**
  - `--color-gold: #c68e28` (filetes decorativos, insignias y foco visual)
  - `--color-ochre: #9a6b1b` (acentos y estados hover)
  - `--color-butter: #fbf3df` (marfil dorado para Misión, citas y avisos)
- **Tipografías (`next/font/google`, autoalojadas):**
  - Display/Encabezados: `Syne` (`700`) → `font-display`.
  - Cuerpo/UI: `Public Sans` (`400`, `500`, `600`, `700` + italic) → `font-sans`.

## 2. Reglas de Diseño, Multimedia y Accesibilidad

1. **Un solo logotipo sin recortes en móvil (`360px`):** Usar `logo-corporacion-tejer-paz.png` (o su versión en Vercel Blob) con `object-contain`.
2. **Jerarquía semántica estricta:** Exactamente un `<h1>` visible por página (`/` y `/proyectos`), seguido de `<h2>` y `<h3>` sin saltos.
3. **Contraste WCAG AA/AAA (`>= 4.5:1`):** Usar `text-ink` o `text-espresso` sobre fondos claros/butter y `text-cream` sobre `bg-espresso` / `bg-umber`.
4. **Multimedia híbrida:** Galerías mixtas (fotos + fachada de YouTube `youtube-nocookie.com` / Vimeo `dnt=1`) con `MixedMediaShowcase` y cartillas PDF con `DocumentDownloadList`.
5. **Atributos `alt` reales:** Todo activo del CMS exige `alt` descriptivo, respetando `prefers-reduced-motion` y `focus-visible`.

## 3. Verificación Visual y Accesibilidad (CLI local sin MCP)

```powershell
pnpm run build
pnpm run test:e2e
```

- Validar desktop (`1440×900`) y móvil (`360×800` / `390×844`) sin desbordamiento horizontal (`scrollWidth <= innerWidth`).
- `@axe-core/playwright` debe pasar con **0 violaciones `critical` o `serious`**.
