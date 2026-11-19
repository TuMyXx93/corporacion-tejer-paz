# Centro de Documentación (Diátaxis)

La documentación técnica de **Corporación Tejer Paz** sigue el marco **Diátaxis** para mantener la información concisa, verificable y libre de redundancias:

| Cuadrante                  | Propósito                                                                                   | Documento                                                              |
| :------------------------- | :------------------------------------------------------------------------------------------ | :--------------------------------------------------------------------- |
| **Tutoriales & How-To**    | Levantar el entorno en Windows, configurar Neon/Blob/Resend y promover cambios a Vercel     | [Guía de Entorno Local y Despliegue](./guides/local-and-deployment.md) |
| **How-To (Equipo)**        | Flujo de ramas `dev` / `main`, Pull Requests, commits y checks locales                      | [Guía de Contribución](../CONTRIBUTING.md)                             |
| **Referencia**             | Contratos Zod, endpoints API, matriz RBAC (`superadmin` vs `admin`) y límites de plataforma | [Contratos API y Matriz RBAC](./reference/api-and-rbac.md)             |
| **Referencia (Seguridad)** | Reporte de vulnerabilidades, CSP/HSTS, sanitización y cadena de suministro                  | [Política de Seguridad](../SECURITY.md)                                |
| **Explicación**            | Arquitectura Next.js 16 + ISR + Auth + Storage desacoplado y decisiones técnicas            | [Arquitectura del Sistema](./architecture/overview.md)                 |
| **Gobernanza AI/CLI**      | Reglas concisas para agentes/IDEs y skills bajo demanda (AAIF)                              | [`AGENTS.md`](../AGENTS.md) · [`.agents/skills/`](../.agents/skills/)  |
