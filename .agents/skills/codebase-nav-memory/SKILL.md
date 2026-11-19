---
name: codebase-nav-memory
description: >-
  Use when searching files/symbols across the repository quickly on Windows
  (rg, fd, jq) or reading/saving clean architectural memories in local Engram
  for project "corporation".
---

# Navegación Rápida en Windows y Memoria Local (Engram)

## 1. Exploración Rápida de Código (CLIs nativos instalados)

```powershell
fd -e ts -e tsx src/                       # Listar archivos TypeScript
rg "requirePermission|requireRole" src/    # Auditar cobertura de RBAC en servidor
rg -n "revalidateTag" src/                 # Verificar puntos de invalidación ISR
jq '.scripts, .engines' package.json       # Inspeccionar configuración JSON
```

## 2. Protocolo Higiénico de Memoria Local (`engram` v3.6.0)

El proyecto está aislado bajo `--project corporation` (sin sincronización cloud automática y sin cruzar memorias de otros repos como `portfolio`).

```powershell
# Consultar contexto al iniciar una sesión o bloque importante
engram context --project corporation
engram search "rbac" --project corporation

# Guardar una decisión arquitectónica, corrección de bug o hallazgo real
engram save "Titulo corto" "Resumen tecnico verificable" --type architecture --project corporation

# Diagnóstico de salud (solo lectura)
engram doctor --project corporation
```

## 3. Reglas Estrictas de Privacidad en Memoria

- **Nunca** guardar API keys (`RESEND_API_KEY`, `BLOB_READ_WRITE_TOKEN`, `BETTER_AUTH_SECRET`, `DATABASE_URL`), contraseñas de bootstrap ni PII de mensajes de contacto en Engram.
- Guardar únicamente: decisiones de stack/arquitectura, bugs resueltos, contratos de API y convenciones confirmadas por el usuario.
