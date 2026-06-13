# Prompt: Dogfooding de Atleta Real + Limpieza de Espacios Basura — NEXUS-RP Coach

**Rol:** Actúa como un atleta intermedio de hipertrofia que usa NEXUS-RP Coach por primera vez
para entrenar DE VERDAD, y a la vez como Product Engineer que convierte cada fricción vivida en
una mejora aplicada.

**App:** `/Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach/`
servida en `http://localhost:8080` (`npm start` si está caída).

## Orden lógico de ejecución

### Paso 0 — Infraestructura (antes de tocar nada)
1. Verificar que el servidor de preview responde; si no, levantarlo.
2. Reducir las solicitudes de autorización: ejecutar la skill `fewer-permission-prompts`
   para pre-autorizar en `.claude/settings.json` los comandos que este proyecto usa siempre
   (node, npx, git, grep sobre la carpeta de la app).

### Paso 1 — Vivir la app como atleta (recorrido REAL por la UI, no sembrando datos)
Conduce la interfaz con Playwright como lo haría una persona, en este orden natural:
1. **Llegar**: pantalla de bienvenida → poner nombre → entrar.
2. **Onboarding**: seguir los 3 pasos tal como la app los propone.
3. **Perfil**: llenar peso/altura/edad/nivel y guardar.
4. **Generar rutina**: usar el wizard completo de ENTRENAMIENTO con una metodología real.
5. **Día de entreno**: evaluar readiness → iniciar la sesión del día → registrar sets
   (peso/reps/RIR) de al menos 2 ejercicios → terminar sesión con feedback.
6. **Comer**: registrar desayuno y comida en el Plan Flexible; pedir sugerencia de tienda;
   verificar que el ajuste del coach reaccionó al entrenamiento.
7. **Revisar progreso**: abrir Evolución y confirmar que la sesión real aparece en anillos,
   gráficas y heatmap.

**Registra cada fricción** con severidad: ¿dónde te atoraste?, ¿qué botón esperabas y no estaba?,
¿qué dato no se reflejó donde debía?

### Paso 2 — Censo de espacios basura (funciones sin autoridad real)
Inventaría TODOS los widgets/tarjetas/botones de cada módulo y clasifícalos:
- **CON autoridad**: leen/escriben datos reales del usuario y reaccionan a ellos.
- **BASURA**: contenido estático que finge ser inteligente (números hardcodeados, análisis
  falsos, botones sin handler, duplicados de otra sección). Evidencia requerida: cita el
  archivo/línea que demuestra que es estático o huérfano.

### Paso 3 — Eliminar la basura HOY
- Quitar (o conectar a datos reales si es trivial) cada elemento clasificado como basura.
- Prioridad: lo que MIENTE al usuario (análisis falsos con datos hardcodeados) se elimina primero.
- Cada eliminación se verifica: la app carga sin errores y los tests siguen en verde.

### Paso 4 — Mejoras nacidas del dogfooding
Aplicar las fricciones de severidad alta del Paso 1 que tengan solución acotada.
Las grandes se documentan en `DOGFOODING_REPORT.md` con propuesta concreta.

### Paso 5 — Cierre
1. `npm test` (ambas suites en verde) + captura de la app final.
2. `DOGFOODING_REPORT.md`: recorrido vivido, fricciones, basura eliminada (tabla con evidencia),
   mejoras aplicadas y backlog priorizado.
3. Commit + push a GitHub.

## Reglas
1. Autonomía total autorizada por Salvador: no preguntar entre pasos, solo reportar al final.
2. La simulación corre en el navegador de Playwright/preview — NUNCA tocar datos del Chrome real.
3. Respetar el stack vanilla JS y las reglas del README. Subir versión del service worker.
4. Estándar premium: cada pantalla que quede debe ganarse su lugar con datos reales.
