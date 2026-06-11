# NEXUS-RP Coach

PWA de entrenamiento de hipertrofia autorregulado (readiness, gate check, RIR dinámico,
11 metodologías) + Coach Nutricional (plan flexible, menús, sugerencias por tienda con
geolocalización y escáner de códigos de barras con Open Food Facts).

**Stack:** 100% frontend — vanilla JS sin framework ni build system. Persistencia en
`localStorage`. No requiere backend.

## 🚀 Cómo abrir la app (Antigravity, VS Code, Claude Code o terminal)

```bash
npm start
```

Luego abre **http://localhost:8080** en el navegador.

> Equivalente sin npm: `npx serve --listen 8080 .` o `python3 -m http.server 8080`
>
> Abrir `index.html` con doble clic (file://) también funciona, pero el navegador
> bloquea la cámara del escáner y el modo offline/PWA — usa el servidor para todo.

## 🧪 Verificación

```bash
npm test
```

Corre las dos suites Playwright: `test-premium.js` (18 checks funcionales) y
`test-auditoria.js` (simulación de 2 usuarios + regresión de espacios muertos).
**Requiere que el servidor esté corriendo en el puerto 8080.**

## 📁 Estructura

```
index.html              ← toda la UI (secciones module-*)
js/rp-coach.js          ← núcleo: navegación, readiness, home
js/modules/*.js         ← ~35 módulos IIFE (un feature por archivo)
js/data/*.js            ← datos estáticos como globals (NO usar fetch de JSON)
css/rp-coach.css        ← estilos + capa premium
manifest.json / service-worker.js  ← PWA (SW v3: network-first en navegación)
```

## 📚 Documentación del proyecto

| Archivo | Contenido |
|---|---|
| `IMPLEMENTATION_PLAN.md` | Arquitectura del upgrade premium, esquema de localStorage, flujo de eventos |
| `AUDITORIA_UX.md` | Auditoría QA: hallazgos, fixes y mejoras propuestas |
| `PRODUCTION_READINESS.md` | Checklist hasta el despliegue (Opción A: beta estática / Opción B: backend) |
| `COMO_SERVIR_LA_APP.md` | Opciones de hosting y prueba en celular |

## ⚠️ Reglas para agentes de IA que editen este proyecto

1. **No introducir frameworks ni build systems** — el patrón es módulos IIFE vanilla JS.
2. Los datos estáticos van como JS globals en `js/data/` (la app debe funcionar en `file://`).
3. **Nunca** volver a cargar `simular-meister.js` ni `simular-mesociclo.js` en `index.html`:
   son scripts de desarrollo que borran los datos del usuario.
4. Tras cualquier cambio, correr `npm test` y subir la versión del cache en
   `service-worker.js` (`rp-coach-vN`).
5. Texto de UI en español.
