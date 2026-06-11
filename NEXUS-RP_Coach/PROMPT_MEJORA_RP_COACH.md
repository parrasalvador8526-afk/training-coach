# Prompt: Evolución Premium de NEXUS-RP Coach

Actúa como Arquitecto de Software Senior y Diseñador UX/UI. Tu objetivo es evolucionar la aplicación **NEXUS-RP Coach** (ubicada en `/Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach/`) hacia un producto premium, construyendo el ecosistema de Nutrición Avanzada integrado con el entrenamiento autorregulado existente.

## Contexto técnico (respétalo — NO migrar de stack)

- App vanilla JavaScript: `index.html` (~3,400 líneas) + `js/rp-coach.js` + módulos en `js/modules/` + `css/rp-coach.css`.
- Persistencia: `localStorage`. No hay backend ni build system.
- Ya existen: `nutrition-rp.js` (básico), `nexus-bridge.js`, `gate-check.js`, `fatigue-heatmap.js`, `strength-tests.js`, `progress-charts.js`, sistema de readiness.
- Navegación por tabs: home, strength, workout, routine-display, visual, progress, nutrition.
- Cada feature nueva debe ser un módulo nuevo en `js/modules/` siguiendo el patrón existente (IIFE/objeto global + `init()`), sin romper los módulos actuales.
- Playwright está instalado como devDependency: úsalo para verificar cada fase.

## FASE 1 — Dashboard de Evolución unificado

1. Fusiona las vistas "visual" (📈) y "progress" (⬆️) en un solo **Dashboard de Evolución** con un tab único:
   - Anillos de progreso estilo Apple Watch (SVG + CSS, sin librerías) para: adherencia semanal, volumen vs MEV/MRV, y readiness promedio.
   - Gráficas con Chart.js vía CDN (línea de progresión de cargas, barras de volumen semanal) reutilizando los datos que ya generan `progress-charts.js` y `progress-analytics.js`.
2. Refina el dark mode existente para uso en gimnasio: contraste mínimo WCAG AA, tipografía legible a distancia de brazo, botones táctiles ≥44px.
3. Micro-interacciones solo con CSS (transiciones, `:active` con scale, skeleton loaders). Glassmorphism sutil en cards (backdrop-filter) sin sacrificar legibilidad.
4. **Verificación:** la app carga sin errores de consola, los 2 tabs viejos quedan fusionados sin perder ninguna métrica, y los datos históricos de `localStorage` siguen apareciendo.

## FASE 2 — Coach Nutricional completo (core feature)

Expande `js/modules/nutrition-rp.js` (o crea módulos hermanos) con:

1. **Dos modalidades de dieta:**
   - **Plan Estricto:** generador de menús fijos por día a partir de los targets de macros que ya calcula el módulo (usa una base local de ~80-120 alimentos comunes en México en un JSON dentro de `js/data/`).
   - **Plan Flexible:** registro dinámico de comidas con barras de progreso fluidas de kcal/proteína/carbs/grasa, restando contra el target diario.
2. **Asistente Geonutricional (sin APIs de pago):**
   - Detecta país con `navigator.geolocation` + reverse-geocoding gratuito (Nominatim/BigDataCloud) y fallback a selección manual.
   - Catálogo estático en `js/data/tiendas.json`: México (Oxxo, Chedraui, 7-Eleven, Walmart MX) y USA (Walmart, Target, CVS), cada tienda con su lista de alimentos disponibles y macros.
   - Lógica "Qué comprar aquí": dado los macros que le FALTAN al usuario hoy (calculados del Plan Flexible), sugiere 3-5 productos de esa tienda que mejor cierren el gap (algoritmo greedy simple sobre el catálogo).
3. **Escáner de códigos de barras:**
   - Usa la API nativa `BarcodeDetector` cuando exista; fallback a ZXing-js vía CDN.
   - Busca el código en la API gratuita de **Open Food Facts** (sin key) y registra el alimento en el Plan Flexible con un tap. Entrada manual como fallback offline.
4. **Verificación:** registrar una comida actualiza las barras; el escáner abre la cámara (probar con Playwright que la UI se renderiza); las sugerencias de tienda cambian según los macros restantes.

## FASE 3 — Sinergia Entrenamiento ↔ Nutrición

- Extiende `nexus-bridge.js` (que ya conecta módulos) con un evento `session-completed` que lleve: fatiga reportada, readiness, y si hubo PR (dato de `strength-tests.js` / `enhanced-session-logger.js`).
- Reglas de auto-ajuste en el Coach Nutricional:
  - Sesión de fatiga extrema o PR → +10-15% carbohidratos y +200-300 kcal ese día, con una notificación visual explicando el porqué.
  - Día de descanso o readiness muy bajo → ajuste inverso moderado.
- El ajuste debe ser visible y reversible (toggle "aceptar/ignorar ajuste del coach").
- **Verificación:** simular una sesión con PR (los scripts `simular-*.js` existentes sirven de referencia) y comprobar que el target de macros del día cambia.

## FASE 4 — PWA y entrega

1. Crea `manifest.json` + `service-worker.js` con cache-first para assets y stale-while-revalidate para Open Food Facts, de modo que las sugerencias de supermercado funcionen sin señal dentro de la tienda.
   - Nota: el service worker solo funciona sobre HTTP(S); documenta cómo servir la app localmente (`npx serve`) o desplegarla.
2. Genera `IMPLEMENTATION_PLAN.md` ANTES de tocar código: esquema de claves de `localStorage`, flujo de eventos entre módulos, y contratos de las APIs gratuitas usadas.

## Reglas de ejecución

1. Trabaja por fases en orden; al final de cada fase corre una verificación con Playwright y reporta resultado antes de continuar.
2. Haz respaldo de `index.html` antes de la Fase 1 (ya existe el patrón `.bak` en el proyecto).
3. No introduzcas frameworks, bundlers ni APIs que requieran key de pago.
4. Todo el texto de UI en español.
5. No te detengas hasta completar las 4 fases o encontrar un bloqueo real que requiera decisión del usuario.
