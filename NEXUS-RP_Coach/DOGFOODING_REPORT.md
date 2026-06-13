# DOGFOODING_REPORT — NEXUS-RP Coach
**Fecha:** 11-jun-2026 · Método: un "atleta" recorre la app POR LA UI (sin sembrar datos) con
`dogfood-athlete.js`, + censo de widgets sin autoridad real.

## 1. El recorrido vivido (17 pasos, reproducible con `node dogfood-athlete.js`)

Bienvenida con nombre → saludo personalizado → onboarding 3 pasos → perfil (82kg/175/32) →
rutina con wizard (9 metodologías) → readiness 🟡 → registro de 6 sets en la tabla del día →
guardar sesión → tabla de Próxima Sesión → desayuno en 1 tap → tienda con 5 sugerencias →
Evolución reflejando la sesión de HOY (anillos 25%/10%/74% y tonelaje).

**Resultado final: 17/17 pasos, 0 fricciones.** Pero al inicio NO era así:

## 2. Bugs críticos encontrados Y corregidos gracias al dogfooding

| # | Bug | Causa raíz | Impacto si llegaba a producción |
|---|-----|-----------|--------------------------------|
| 1 | "CALCULAR Y GUARDAR SESIÓN" tronaba con `showDoubleTier is not defined` | `buildWarmupBlock` se llamaba con 3 argumentos pero su firma declaraba 2 (`workout-ui-controller.js:2540`) | El guardado moría a la mitad |
| 2 | Aun sin el crash, **la sesión nunca se guardaba** | El handler llamaba `generateProgressiveRoutine()` (que re-renderiza la tabla y la VACÍA) **antes** de `saveSessionToHistory()` (que lee la tabla) | **Ningún usuario real habría conservado jamás una sesión registrada** — el feature central de la app roto en silencio, con botón diciendo "✅ GUARDADA CON ÉXITO" |
| 3 | El onboarding no se marcaba completo al evaluar readiness | `evaluateReadiness` no refrescaba la checklist | Guía "pegada" en 2/3 |

El #2 es la prueba de valor del dogfooding: las suites de QA anteriores no lo detectaban porque
ninguna llegaba hasta "guardar una sesión completa por la UI".

## 3. Espacios basura eliminados (censo con evidencia)

| Elemento | Evidencia de que era basura | Acción |
|---|---|---|
| Tablero "Macros Diarios Sugeridos" (2,850 kcal / 180g / 350g / 80g) | Valores HARDCODEADOS en HTML; ningún módulo los escribía. Contradecían los macros reales del Plan Flexible | ❌ Eliminado |
| "Motor de Inteligencia (Motor Metabólico)" | Análisis fijo "Estancado (Promedio sin cambios)" + cita falsa; el botón "+25g Carbos" decía "guardados en tu perfil" pero solo editaba `innerText` sin persistir nada | ❌ Eliminado (el motor REAL es RecoveryNutritionSync, con datos reales y reversible) |
| "Protocolo de Suplementación" estático | Duplicado pobre de la tabla que ya genera `nutrition-rp.js` en la misma sub-pestaña | ❌ Eliminado |
| `#weight-tracking-nutrition-placeholder` | Div huérfano: `renderWeightTracking` pinta en `#weight-tracking-section` (vive en FEEDBACK) | ❌ Eliminado |
| Alerta "Aviso del Motor Metabólico" en JS | Sumaba +30g al tablero falso; el flag `rpCoach_fatigue_carb_boost` ya lo consume la regla 'fatiga' de RecoveryNutritionSync | ❌ Eliminado (~150 líneas de JS muerto) |

## 4. Backlog (detectado, NO eliminado hoy — decisión de Salvador)

1. **Módulo `active-workout.js` huérfano**: su botón de entrada (`btn-start-workout`) no existe en
   el HTML y nadie llama `startWorkout()` desde la UI. El flujo real es la tabla del día. Es un
   sistema paralelo completo (~500 líneas) → decidir: conectarlo como "modo guiado set por set"
   o retirarlo del bundle.
2. **Ranking RPizado** (`rpCoach_rpized_progress`): sigue latente, nadie escribe esa clave.
3. **Auto-propagación de peso** entre sets usa `placeholder` (sugerencia visual): correcto, pero
   un usuario puede creer que el valor ya está registrado. Considerar botón "copiar a todas".

## 5. Verificación final

- `node test-premium.js` → 18/18 ✅
- `node test-auditoria.js` → 0 hallazgos ✅
- `node dogfood-athlete.js` → 17 pasos, 0 fricciones ✅
- Service worker → v4 (los usuarios reciben la app limpia)
