# PRODUCTION_READINESS — NEXUS-RP Coach
**Fecha:** 11-jun-2026 · Auditoría verificada contra el código real (se citan archivos).

## 0. Veredicto ejecutivo

La app es funcionalmente sólida (2 suites Playwright en verde, PWA offline operativa, auditoría UX
previa con 8 bugs corregidos), pero **hoy NO es lanzable**. Tres bloqueadores absolutos:

| # | Bloqueador | Evidencia |
|---|-----------|-----------|
| B1 | `simular-meister.js` se carga en `index.html` y **se auto-ejecuta en cada visita: borra todas las claves `rpCoach_*`/`nexus_*` del usuario e inyecta datos falsos de demostración** (solo lo frena un `confirm()` si ya había datos) | `simular-meister.js:1-15`, cargado en `index.html` |
| B2 | El login es decorativo: pide usuario y contraseña pero `handleLogin` solo oculta el overlay. Transmite una seguridad que no existe (datos de salud sensibles) | `index.html:357-366` |
| B3 | Todo el trabajo premium está **sin commitear** en el repo (`origin = github.com/parrasalvador8526-afk/training-coach`, sin `.gitignore`, `node_modules/` sin ignorar). Un fallo de disco hoy pierde semanas de trabajo | `git status` |

## 1. Análisis de arquitectura

### Realidad actual
100% frontend (vanilla JS, sin build), persistencia exclusiva en `localStorage` (~15 claves),
PWA con service worker cache-first, APIs gratuitas sin key (Open Food Facts, BigDataCloud).
No hay backend, BD, cuentas, pagos ni sincronización.

### Decisión central: Opción A vs Opción B

| | **Opción A — PWA estática (recomendada para lanzar YA)** | **Opción B — Backend mínimo** |
|---|---|---|
| Qué es | Hosting estático (Netlify/GitHub Pages/Vercel) + datos en el dispositivo | A + Supabase (auth + Postgres + sync) + Stripe para suscripción |
| Tiempo | Días | 3-6 semanas adicionales |
| Costo fijo | $0 (dominio opcional ~$12/año) | ~$0-25/mes + comisiones Stripe |
| Riesgos | Sin multi-dispositivo; si el usuario borra el navegador pierde todo (mitigable con export/import, ver Fase 2); el cobro de suscripción se difiere o se hace por canal externo | Mantenimiento de un sistema con cuentas y pagos siendo equipo de 1 persona |
| Veredicto | **Lanzar como beta pública gratuita** para validar retención real antes de cobrar | Ejecutar solo cuando A demuestre usuarios recurrentes |

**Recomendación:** A ahora, B después con datos de uso. El modelo "suscripción premium" se valida
primero con una beta; Stripe + Supabase se integran sin reescribir el frontend (la migración
natural es: sincronizar las mismas claves de localStorage por usuario).

### Elementos críticos por capa (para Opción A)

- **Frontend:** manejo global de errores (`window.onerror` → aviso amable, hoy no existe);
  versionado/migración del esquema de localStorage; **export/import de datos** como seguro de vida
  del usuario; compatibilidad iOS (ícono PNG — Safari ignora SVG en `apple-touch-icon`); revisar
  Lighthouse (meta ≥90).
- **Seguridad/Privacidad:** HTTPS (lo da el hosting); reemplazar login fake por bienvenida honesta
  (B2); aviso de privacidad simple: qué se guarda (todo local), qué sale del dispositivo (solo
  código de barras a Open Food Facts y coordenadas a BigDataCloud, nunca se almacenan fuera).
- **Infraestructura:** hosting estático + CI (GitHub Actions: `node test-premium.js` y
  `node test-auditoria.js` en cada push) + bump de versión del service worker en cada deploy
  (ya quedó el patrón `rp-coach-vN`).

## 2. Herramientas disponibles para trabajar juntos

**Ya disponibles en este entorno (sin configurar nada):** lectura/escritura del proyecto, terminal
(node 24, npx, Playwright, git, gh CLI), servidor de preview con navegador integrado, control de
Chrome del usuario (extensión), búsqueda/lectura web, docs de librerías (context7).

**Requiere acción de Salvador según la fase:**
- Deploy: cuenta Netlify/Vercel (o GitHub Pages con el repo existente — `gh` ya puede crearlo si
  está autenticado: verificar con `gh auth status`).
- CI: nada extra si usamos GitHub Actions en el repo existente.
- Opción B (futuro): cuentas Supabase y Stripe.

## 3. Checklist hasta el despliegue

**Fase 0 — Respaldo (HOY, la hace Claude):**
- [x] `.gitignore` (node_modules, .bak, .DS_Store, capturas)
- [x] Commit de todo el trabajo premium
- [ ] Push a `origin` (requiere SSH de Salvador operativo — JUNTOS)

**Fase 1 — Decisión (SALVADOR):** aprobar Opción A (beta gratuita) o pedir B.

**Fase 2 — Endurecimiento (CLAUDE, esta misma ejecución — Capa WOW):**
- [x] B1: retirar `simular-meister.js` de producción
- [x] B2: login → pantalla de bienvenida real (nombre → personaliza la app)
- [x] Onboarding 3 pasos para usuario nuevo en Home
- [x] Placeholder calculadora 1RM y aviso de PDF sin datos
- [x] Íconos PNG 192/512 + `apple-touch-icon`
- [x] Manejo global de errores con aviso visual
- [x] Transiciones de módulo + micro-interacciones (respetando `prefers-reduced-motion`)

**Fase 2.5 — Export/Import de datos (CLAUDE, siguiente sesión):** botón "Respaldar mis datos"
(descarga JSON) + "Restaurar" en Perfil. *Prerequisito para invitar usuarios reales.*

**Fase 3 — Calidad (JUNTOS):**
- [ ] Lighthouse ≥90 (PWA/Performance/Best Practices)
- [ ] Prueba en iPhone/Android físico (instalación, cámara del escáner, GPS)
- [ ] Escáner con 5 productos mexicanos reales

**Fase 4 — Despliegue (JUNTOS):**
- [ ] Hosting estático conectado al repo + CI con las 2 suites
- [ ] Dominio (opcional) + verificación HTTPS/SW en producción
- [ ] Smoke test post-deploy en el dominio real

**Fase 5 — Post-lanzamiento (JUNTOS):**
- [ ] Sentry (plan gratuito) para errores reales de usuarios
- [ ] Analytics respetuoso (Plausible/Umami) o ninguno en beta
- [ ] Canal de feedback (link de WhatsApp/Forms en el footer)

## 4. Riesgos aceptados conscientemente en la beta (Opción A)
- Sin multi-dispositivo ni recuperación remota de datos (mitigado por export/import en Fase 2.5).
- Open Food Facts es comunitario: productos MX pueden faltar (existe entrada manual como fallback).
- El "ranking RPizado" sigue latente (hallazgo #11 de AUDITORIA_UX.md) — decidir antes de la v1.1.
