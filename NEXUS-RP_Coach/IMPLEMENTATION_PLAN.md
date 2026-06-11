# IMPLEMENTATION_PLAN — NEXUS-RP Coach Premium

## Arquitectura general

App vanilla JS sin build system. Cada feature es un módulo IIFE en `js/modules/` expuesto en `window`,
cargado por `<script>` en `index.html`. Persistencia 100% en `localStorage`. Los datos estáticos se cargan
como JS globals (`js/data/*.js`) — NO como `fetch()` de JSON, para que la app siga funcionando sobre `file://`.

## Archivos nuevos

| Archivo | Responsabilidad |
|---|---|
| `js/modules/evolution-dashboard.js` | Anillos SVG + gráficas Chart.js del Dashboard de Evolución |
| `js/modules/nutrition-flexible.js` | Plan Flexible: diario de comidas, barras de macros, targets efectivos |
| `js/modules/nutrition-stores.js` | Asistente geonutricional: país, tiendas, sugerencias por gap de macros |
| `js/modules/barcode-scanner.js` | Escáner (BarcodeDetector → fallback ZXing) + Open Food Facts |
| `js/modules/recovery-nutrition-sync.js` | Sinergia entrenamiento↔nutrición (auto-ajuste de macros) |
| `js/data/alimentos-db.js` | `window.ALIMENTOS_DB` (~90 alimentos comunes MX con macros) |
| `js/data/tiendas-db.js` | `window.TIENDAS_DB` (tiendas MX/USA con productos y macros) |
| `manifest.json`, `service-worker.js`, `img/icon.svg` | PWA |

## Archivos modificados

- `index.html`: nav (fusión visual+progress → tab "Evolución"), sección `module-evolution`,
  sub-tabs en `module-nutrition`, scripts nuevos, link a manifest, registro de Service Worker.
- `js/rp-coach.js`: `switchModule`/`renderCurrentModule` con caso `evolution` + sub-vistas
  (reusa las secciones `module-visual` y `module-progress` existentes sin mover su HTML).
- `css/rp-coach.css`: anillos, glassmorphism, micro-interacciones, barras de macros fluidas.
- `js/modules/nutrition-rp.js`: generador de menús del Plan Estricto desde `ALIMENTOS_DB`.

## Esquema de localStorage (claves nuevas)

| Clave | Forma | Dueño |
|---|---|---|
| `rpCoach_evolution_subtab` | `'resumen' \| 'metricas' \| 'progresion'` | rp-coach.js |
| `rpCoach_nutrition_log` | `{ 'YYYY-MM-DD': [ {id, nombre, kcal, prot, carb, grasa, gramos, hora, fuente} ] }` | nutrition-flexible |
| `rpCoach_nutrition_targets_manual` | `{kcal, prot, carb, grasa}` (override manual opcional) | nutrition-flexible |
| `rpCoach_nutrition_adjustment` | `{date, reason: 'pr'\|'fatiga'\|'descanso', kcalDelta, carbDelta, status: 'applied'\|'ignored', detalle}` | recovery-nutrition-sync |
| `rpCoach_country` | `'MX' \| 'US'` | nutrition-stores |
| `rpCoach_off_cache` | `{ [barcode]: {nombre, kcal100, prot100, carb100, grasa100, marca, ts} }` | barcode-scanner |

Claves existentes que se LEEN (no se modifican): `rpCoach_enhanced_sessions`, `rpCoach_readiness_history`,
`rpCoach_strength_prs`, `rpCoach_active_routine`, `rpCoach_fatigue_carb_boost`, datos de BioimpedanciaRP.

## Flujo de targets de macros (fuente de verdad)

```
BioimpedanciaRP.getDatosCalculados().metricas.macros   (si el usuario llenó DATOS)
        └─ fallback: rpCoach_nutrition_targets_manual
        └─ fallback: defaults seguros {2500 kcal, 180P, 280C, 75G}
            │
            ▼
NutritionFlexible.getTargetsHoy()  ──  aplica rpCoach_nutrition_adjustment si status==='applied'
            │
            ├──► barras del Plan Flexible (consumido vs target)
            ├──► NutritionStores (gap = target − consumido → sugerencias)
            └──► NutricionRP Plan Estricto (menús generados)
```

## Flujo de eventos (Fase 3)

```
EnhancedSessionLogger.finishSession()        StrengthTests (nuevo PR hoy)
        │ (wrap no invasivo en init)                │ (scan de rpCoach_strength_prs)
        ▼                                           ▼
RecoveryNutritionSync.evaluateToday() ── reglas:
    · PR hoy                      → +250 kcal, +15% carbs  (prioriza recuperación)
    · fatiga extrema (readiness≤2 o flag rpCoach_fatigue_carb_boost) → +10% kcal, +12% carbs
    · día de descanso sin sesión  → −10% kcal, −20% carbs
        │
        ▼ guarda rpCoach_nutrition_adjustment (status 'applied', reversible)
window.dispatchEvent('rp:nutrition-adjusted')
        │
        ▼
NutritionFlexible re-renderiza banner + barras (botón "Ignorar ajuste" → status 'ignored')
```

## APIs externas (todas gratuitas, sin key)

| API | Uso | Estrategia offline |
|---|---|---|
| `https://world.openfoodfacts.org/api/v2/product/{code}.json` | macros por código de barras | cache en `rpCoach_off_cache` + stale-while-revalidate en SW |
| `https://api.bigdatacloud.net/data/reverse-geocode-client` | país desde GPS (countryCode) | fallback: selector manual MX/US |
| CDN jsdelivr/unpkg (Chart.js, ZXing) | librerías | cache-first en SW |

Notas de contexto seguro: `getUserMedia` (cámara) y el Service Worker requieren HTTPS o `localhost`.
Sobre `file://` la app funciona completa salvo cámara y PWA (la UI lo indica y ofrece entrada manual).

## PWA

- `manifest.json`: standalone, theme `#0D0D1A`, icono SVG.
- `service-worker.js`: precache de assets locales (cache-first) + runtime cache para CDN
  y stale-while-revalidate para Open Food Facts → las sugerencias de tienda y alimentos escaneados
  recientes funcionan sin señal dentro del súper.
- Servir local: `npx serve .` o `python3 -m http.server 8080` desde la carpeta de la app.

## Verificación (Playwright)

`test-premium.js`: carga la app, falla si hay errores de consola; navega a Evolución (anillos presentes,
sub-tabs muestran Métricas y Progresión); en Nutrición registra un alimento y verifica que las barras
cambian; selecciona tienda y verifica sugerencias; siembra un PR de hoy y verifica banner de ajuste.
