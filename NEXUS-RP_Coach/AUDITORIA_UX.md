# AUDITORÍA UX — NEXUS-RP Coach
**Fecha:** 11-jun-2026 · **Método:** simulación de 2 personas con Playwright (`test-auditoria.js`)
+ barrido de todos los botones de todos los módulos + análisis estático de claves de localStorage.

## 1. Mapa de la app y dependencias de datos

```
INICIO ──── readiness diario ──► rpCoach_readiness_history ──► Gate Check, Evolución, Coach Nutricional
ENTRENAMIENTO (wizard) ──► rpCoach_active_routine ──► Feedback, Gate Check, Perfil
  └─ sesión completada ──► rpCoach_session_history (flujo principal)
                           rpCoach_enhanced_logs   (logger set-by-set)
                           rpCoach_session_logs    (logger legado)
                               └──► Evolución (anillos/gráficas), Heatmap, Smart Alerts, Sinergia nutricional
TESTS DE FUERZA ──► rpCoach_strength_prs ──► Evolución (PRs), Sinergia (regla PR)
EVOLUCIÓN = Resumen (anillos+gráficas) + Métricas y Fotos (module-visual) + Progresión (module-progress)
COACH NUTRICIONAL = Hoy (flexible) + Plan Estricto + Tiendas + Escáner
  └─ targets: BioimpedanciaRP → ajuste de RecoveryNutritionSync (PR/fatiga/descanso)
Metodologías: js/data/metodologias_data.json → MethodologiesSync → MethodologyEngine → todo lo demás
```

Nota estructural: **coexisten 3 almacenes de sesiones** (`session_history`, `enhanced_logs`,
`session_logs`). Todo módulo que consuma sesiones debe leer los tres (ver hallazgos #2 y #3).

## 2. Hallazgos

| # | Módulo | Hallazgo | Tipo | Severidad | Estado |
|---|--------|----------|------|-----------|--------|
| 1 | Global | Metodologías se cargaban de `../Metodos creados HTML/…` (404 en web, bloqueado en file://): selector atascado en "Cargando metodologías…" y errores "Metodología X no encontrada" en consola al usar Entrenamiento/Progresión | Flujo roto | **ALTA** | ✅ Corregido: carga primero la copia local `js/data/metodologias_data.json` con doble fallback |
| 2 | Global | `smart-alerts.js` y `nexus-bridge.js` leían `rpCoach_enhanced_sessions`, clave que **nadie escribe** (el logger usa `rpCoach_enhanced_logs`): las alertas inteligentes nunca se disparaban y el export a NEXUS iba vacío | Inconsistencia de datos | **ALTA** | ✅ Corregido |
| 3 | Evolución/Nutrición | El dashboard nuevo y la sinergia no leían `rpCoach_session_history`, que es donde guarda el **flujo real** de entrenamiento: anillos/gráficas ignoraban las sesiones reales | Inconsistencia de datos | **ALTA** | ✅ Corregido (lee los 3 almacenes; usa `stats` precalculados) |
| 4 | rp-coach.js | Se pasaba el **texto** del selector de metodología ("FST-7 (Fascia Stretch Training)" o "Cargando metodologías…") como ID a las gráficas → error de lookup | Bug | **ALTA** | ✅ Corregido (se pasa el `value` + lookup tolerante por id/nombre en MethodologyEngine) |
| 5 | Nutrición | Si el ajuste del coach se generaba estando ya dentro del módulo, el banner no aparecía hasta salir y volver | Espacio muerto UX | MEDIA | ✅ Corregido (refresco inmediato del banner y las barras) |
| 6 | Inicio | Modal "Fin de Mesociclo" buscaba fotos en `rpCoach_photos_s1/s5`, claves inexistentes (las fotos viven en `rpCoach_progress_photos`): la comparativa S1→S5 salía siempre "Sin foto guardada" | Inconsistencia de datos | MEDIA | ✅ Corregido (lee fases `start-front`/`end-front`) |
| 7 | Inicio | Gate Check leía `rpCoach_mesocycleWeek` (nunca se escribe) y caía siempre a semana 1 | Inconsistencia de datos | MEDIA | ✅ Corregido (fallback a la semana de la rutina activa) |
| 8 | Perfil | `saveProfile` leía `rpCoach_routine` en vez de `rpCoach_active_routine` para contar días | Inconsistencia de datos | BAJA | ✅ Corregido |
| 9 | Fuerza | `#rm-resultado` (resultado de la calculadora 1RM) es un div vacío sin placeholder hasta que calculas | Estado vacío pobre | BAJA | 📋 Propuesto (cosmético) |
| 10 | Feedback | "Exportar PDF" sin rutina/sesiones genera un reporte vacío sin avisar al usuario que le faltan datos | UX | BAJA | 📋 Propuesto |
| 11 | Progresión | `progress-analytics` lee `rpCoach_rpized_progress` que nada escribe; la vista tiene fallback con texto guía, pero el ranking RPizado nunca tendrá datos reales | Funcionalidad latente | BAJA | 📋 Propuesto (requiere decidir qué módulo alimenta esa clave) |

**Verificados como NO-hallazgos** (falsos positivos del barrido): "Exportar PDF" sí funciona (abre
ventana nueva), "📊 Resumen" es la sub-pestaña ya activa, "Huevo entero" sí registra la comida
(0→72 kcal verificado).

## 3. Resultado de las personas simuladas

- **Persona A (usuario nuevo):** todos los módulos muestran texto guía suficiente (>80 chars);
  1 contenedor vacío menor (#9). Tras los fixes: **0 errores de consola** en todo el recorrido.
- **Persona B (3 semanas de historial):** anillos, gráficas Chart.js, PRs, heatmap de fatiga,
  sub-vista Progresión, diario de comidas y banner de sinergia **pintan correctamente** los datos
  sembrados. 0 hallazgos de "datos no pintados".

## 4. Top mejoras propuestas (no implementadas, por impacto en retención)

1. **Unificar los 3 almacenes de sesiones** en uno solo con migración automática — elimina la
   clase entera de bugs #2/#3 a futuro.
2. **Onboarding guiado de 3 pasos** para usuario nuevo (Perfil → Generar rutina → Primer readiness):
   hoy el orden correcto se descubre por prueba y error.
3. **Aviso en "Exportar PDF" sin datos** (#10) y placeholder en la calculadora 1RM (#9).
4. **Decidir el destino del ranking RPizado** (#11): alimentarlo desde session_history o retirarlo.
5. **Indicador de countdown/fecha en el ciclado ondulante** del Plan Estricto: hoy el usuario no
   sabe qué día (alto/moderado/descanso) le toca — conectarlo con la rutina activa.

## 5. Reproducir esta auditoría

```bash
npx serve --listen 8080   # desde la carpeta de la app
node test-auditoria.js    # simulación 2 personas + barrido (regresión de espacios muertos)
node test-premium.js      # suite funcional de las fases premium (18 checks)
```
