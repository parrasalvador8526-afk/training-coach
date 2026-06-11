# Prompt: Auditoría de Preparación para Producción — NEXUS-RP Coach

**Rol:** Actúa como Arquitecto de Software Senior y Mentor Técnico.

**Contexto:** Quiero preparar mi aplicación **NEXUS-RP Coach** para su lanzamiento oficial al
público como producto premium. Necesito una auditoría completa que me diga exactamente qué piezas
faltan, qué mejorar, corregir o asegurar antes de salir a producción.

## Detalles del proyecto (estado real, no asumir nada distinto)

- **Qué es:** PWA de entrenamiento de hipertrofia autorregulado (readiness, gate check, RIR
  dinámico, 11 metodologías) + Coach Nutricional (plan flexible, menús, sugerencias por tienda
  con geolocalización, escáner de códigos de barras con Open Food Facts).
- **Ubicación:** `/Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach/`
- **Stack:** 100% frontend. Vanilla JS sin framework ni build system: `index.html` (~3,500 líneas)
  + ~30 módulos IIFE en `js/modules/` + datos estáticos como JS globals en `js/data/`.
  Chart.js y ZXing por CDN.
- **NO existe backend ni base de datos.** Persistencia 100% en `localStorage` del navegador.
- **El login actual es decorativo**: el formulario solo oculta un overlay; no hay autenticación,
  usuarios ni protección de datos reales.
- **PWA ya configurada** (jun-2026): `manifest.json` + `service-worker.js` offline-first; icono
  solo en SVG. Funciona en `localhost`; nunca se ha desplegado a un dominio público.
- **APIs externas (gratuitas, sin key):** Open Food Facts (macros por código de barras),
  BigDataCloud (país por GPS). Usa permisos de cámara y geolocalización.
- **Calidad:** suites Playwright existentes — `test-premium.js` (18 checks funcionales) y
  `test-auditoria.js` (regresión de espacios muertos). Auditoría UX previa en `AUDITORIA_UX.md`
  (8 bugs corregidos, mejoras pendientes listadas en su sección 4).
- **Versionado:** la carpeta vive en un repo git (rama `main`, con remote `origin`) con TODOS los
  cambios premium recientes **sin commitear**. No hay CI/CD.
- **Objetivo de negocio:** producto de suscripción premium. Hoy no hay pagos, cuentas ni sincronización
  entre dispositivos.

## Instrucción 1 — Análisis de arquitectura para el lanzamiento

Dado que hoy NO hay backend, la primera decisión de la auditoría es la **arquitectura de
lanzamiento**, con costos y tiempos estimados de cada opción:

- **Opción A — PWA estática (sin cuentas):** hosting estático + datos locales del usuario.
  Analiza qué riesgos quedan (pérdida de datos si se borra el navegador, sin multi-dispositivo,
  ¿cómo se cobra una suscripción sin cuentas?).
- **Opción B — Backend mínimo:** auth real + sincronización de localStorage a una BD + pasarela
  de pago (Stripe/similar). Propón el stack más simple que un proyecto de una sola persona pueda
  mantener (ej. Supabase/Firebase como backend-as-a-service vs Node propio).

Para la opción recomendada, detalla los elementos críticos por capa:
- **Frontend:** manejo global de errores, validación de datos de localStorage (versionado/migración
  de esquema), export/import de datos del usuario como respaldo, compatibilidad iOS/Safari
  (incluye ícono PNG — Safari no acepta SVG en apple-touch-icon), accesibilidad y rendimiento
  (Lighthouse ≥ 90 en PWA/Performance/Best Practices).
- **Backend/Datos (si aplica):** modelo de datos mínimo para sincronizar las ~15 claves de
  localStorage existentes, estrategia de migración del usuario local → cuenta.
- **Seguridad:** decidir el destino del login decorativo (implementarlo de verdad o quitarlo para
  no transmitir falsa seguridad), HTTPS obligatorio, política de permisos (cámara/GPS), y aviso
  de privacidad (los datos de salud/composición corporal son sensibles).
- **Infraestructura/Despliegue:** hosting (GitHub Pages/Netlify/Vercel para A; + Supabase para B),
  dominio, CI que corra `test-premium.js` y `test-auditoria.js` en cada push, y estrategia de
  versionado del service worker para que los usuarios reciban updates.

## Instrucción 2 — Herramientas y MCP disponibles (inventario honesto)

Enumera qué puedes usar YA en este entorno y qué requiere configuración mía:
- Ya disponible: lectura/escritura de mi sistema de archivos, terminal (node, npx, Playwright,
  git, gh CLI), servidor de preview local con navegador integrado, control de Chrome (extensión
  Claude in Chrome), búsqueda y lectura web, documentación de librerías (context7).
- Indica qué me falta configurar para llegar a producción contigo: p. ej. autenticación de `gh`
  con mi cuenta GitHub para crear el repo público/privado y CI, CLI de Netlify/Vercel autenticada
  para desplegar, y cuenta de Supabase/Stripe si elegimos la Opción B.

## Instrucción 3 — Hoja de ruta ejecutable (checklist)

Entrega una checklist paso a paso desde HOY hasta el despliegue, organizada en fases con criterio
de "hecho" verificable en cada paso. Como mínimo debe cubrir:

- **Fase 0 — Control de versiones (hacerla HOY):** commit de todo el trabajo premium actual,
  `.gitignore` para `node_modules/`, capturas y archivos `.bak`; push a `origin`.
- **Fase 1 — Decisión de arquitectura** (Opción A vs B) con mi aprobación explícita.
- **Fase 2 — Endurecimiento:** los pendientes de `AUDITORIA_UX.md` sección 4 que bloqueen
  lanzamiento, login real o removido, export/import de datos, ícono PNG iOS, manejo global de
  errores, limpieza de scripts de simulación (`simular-meister.js` se carga en producción).
- **Fase 3 — Calidad:** Lighthouse, prueba real en un iPhone/Android físico, prueba del escáner
  con productos mexicanos reales, cross-browser.
- **Fase 4 — Despliegue:** hosting + dominio + HTTPS + CI.
- **Fase 5 — Post-lanzamiento:** monitoreo de errores (ej. Sentry gratuito), analytics respetuoso,
  canal de feedback de usuarios.

Marca en cada paso: si lo puedes hacer TÚ directamente, si lo hacemos JUNTOS, o si es 100% mío
(cuentas, pagos, decisiones de negocio).

## Instrucción 4 — Capa WOW: interfaz súper innovadora (con criterios medibles)

El lanzamiento debe entrar por los ojos. Además de la auditoría, diseña y ejecuta un "pase premium
de UI" acotado que NO rompa funcionalidad existente (los tests deben seguir en verde):

1. **Primera impresión**: convertir el login decorativo en una **pantalla de bienvenida real**
   (pide el nombre, personaliza el saludo del Home, elimina la falsa sensación de seguridad del
   campo contraseña). Animación de entrada de la app digna de producto premium.
2. **Onboarding visible**: si el usuario es nuevo (sin rutina ni readiness), el Home debe mostrar
   una guía de 3 pasos accionable (Perfil → Generar rutina → Primer readiness) que desaparece sola
   al completarse — resuelve el hallazgo #2 del top de mejoras de `AUDITORIA_UX.md`.
3. **Movimiento con propósito**: transición sutil al cambiar de módulo, micro-interacciones en
   botones y tabs, respetando `prefers-reduced-motion`.
4. **Detalles de pulido pendientes de la auditoría**: placeholder en la calculadora 1RM (#9) y
   aviso al exportar PDF sin datos (#10).
5. **Identidad iOS/Android**: generar íconos PNG reales (192/512) desde el SVG y referenciarlos en
   manifest y `apple-touch-icon` para que al instalarla en el teléfono se vea perfecta.
6. **Criterio de éxito**: `test-premium.js` (18/18) y `test-auditoria.js` siguen pasando después
   del pase; captura de pantalla antes/después como evidencia.

## Reglas de ejecución

1. Sé estructurado, técnico y directo; justifica cada recomendación con el estado real del código.
2. El entregable documental es `PRODUCTION_READINESS.md` (análisis + checklist). Los únicos
   cambios de código autorizados en esta ejecución son: la **Fase 0** (commit de respaldo) y la
   **Instrucción 4 (Capa WOW)**. Las decisiones de arquitectura (Opción A vs B), pagos y
   despliegue público requieren mi aprobación posterior.
3. Verifica afirmaciones contra el código real (no asumas); cita archivos concretos.
4. Cierra reportando: auditoría entregada, Fase 0 hecha, Capa WOW implementada y verificada,
   y cuál es la siguiente decisión que me toca tomar.
