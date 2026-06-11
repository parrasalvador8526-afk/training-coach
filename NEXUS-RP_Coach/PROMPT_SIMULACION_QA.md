# Prompt: Simulación de Usuario Real + Auditoría de Espacios Muertos — NEXUS-RP Coach

Actúa como QA Engineer senior y Diseñador UX. Tu objetivo es **simular ser un usuario real** de
NEXUS-RP Coach (`/Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach/`,
servida en `http://localhost:8080`) durante un ciclo completo de uso, **probar TODAS las opciones de
TODOS los módulos**, y detectar cada "espacio muerto" antes de proponer y aplicar mejoras.

## Definición de "espacio muerto" (lo que debes cazar)

1. **Botones/controles sin efecto**: clic que no cambia nada visible ni dispara handler.
2. **Contenedores vacíos**: divs que se renderizan sin contenido y sin mensaje de estado vacío.
3. **Flujos rotos**: pasos que dependen de datos de otro módulo y fallan en silencio si no existen.
4. **Estados sin datos pobres**: pantallas que ante un usuario nuevo no explican qué hacer ni cómo llenarlas.
5. **Errores de consola** durante cualquier interacción.
6. **Callejones sin salida**: vistas desde las que no es obvio cómo continuar el flujo natural
   (ej. terminé mi sesión… ¿y ahora qué?).
7. **Inconsistencias de datos**: módulos que leen claves de localStorage que nadie escribe (o viceversa).

## Metodología de simulación (Playwright, sobre localhost:8080)

Simula DOS personas distintas, porque revelan espacios muertos diferentes:

### Persona A — "Usuario nuevo" (localStorage limpio)
Recorre la app sin ningún dato previo y documenta qué ve en cada módulo:
login → INICIO (readiness, gate check, sobrecarga) → Perfil/DATOS → TESTS DE FUERZA →
ENTRENAMIENTO (wizard completo: generar rutina) → FEEDBACK → EVOLUCIÓN (3 sub-pestañas) →
COACH NUTRICIONAL (4 sub-pestañas: Hoy, Plan Estricto, Tiendas, Escáner).
En cada vista: ¿entiende un novato qué hacer? ¿hay textos de estado vacío útiles?

### Persona B — "Usuario con 3 semanas de historial" (datos sembrados)
Siembra datos realistas vía `page.evaluate` ANTES de cargar (usa los scripts `simular-*.js`
existentes como referencia de formato): rutina activa, ~12 sesiones en `rpCoach_enhanced_logs`,
readiness diario en `rpCoach_readiness_history`, 2-3 PRs en `rpCoach_strength_prs`, mediciones
corporales, comidas en `rpCoach_nutrition_log`. Después recorre los mismos módulos y verifica que
cada gráfica, anillo, tabla, historial y sugerencia muestre los datos sembrados correctamente.

### Barrido exhaustivo de interacciones
Para CADA módulo: enumera todos los `button`, `select`, `input` y elementos con `onclick` visibles,
interactúa con cada uno, y registra: (a) qué pasó en el DOM, (b) errores de consola, (c) si no pasó
nada → espacio muerto. Incluye los flujos secundarios: modales (resumen diario, fin de mesociclo),
exportar PDF, calculadora 1RM, fotos del mesociclo, escáner con código manual, selector de país/tiendas,
banner de ajuste (aceptar/ignorar), y el cambio de metodología en el header.

## Entregables (en este orden)

1. **`AUDITORIA_UX.md`** con:
   - Mapa de la app (módulos, sub-vistas y dependencias de datos entre ellos).
   - Tabla de TODOS los hallazgos: `#, módulo, hallazgo, tipo (espacio muerto/bug/UX), severidad (alta/media/baja), evidencia`.
   - Top 10 de mejoras priorizadas por impacto en retención.
2. **Script `test-auditoria.js`** reproducible que ejecute ambas personas y falle si reaparecen
   los espacios muertos encontrados (test de regresión).
3. **Fixes aplicados**: corrige directamente los hallazgos de severidad ALTA que tengan solución
   acotada (botones muertos, contenedores vacíos, estados sin datos). Los de rediseño grande solo
   propónlos en el reporte — no los implementes sin aprobación.

## Reglas de ejecución

1. Usa el servidor ya corriendo en `http://localhost:8080` (si no responde, levántalo con
   `npx serve --listen 8080` desde la carpeta de la app).
2. No rompas datos del usuario: la simulación corre en el contexto del navegador de Playwright,
   nunca borres claves del localStorage de Chrome del usuario real.
3. Respeta el stack: vanilla JS, módulos IIFE, sin frameworks ni build system.
4. Haz respaldo de cualquier archivo antes de modificarlo (patrón `.bak` del proyecto).
5. Después de cada fix, re-corre `node test-premium.js` + `node test-auditoria.js` para confirmar
   que no rompiste nada.
6. Trabaja módulo por módulo y reporta avances; no te detengas hasta cubrir el 100% de las
   interacciones visibles.
