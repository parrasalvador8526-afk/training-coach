# Cómo servir NEXUS-RP Coach (PWA, escáner y modo offline)

Abrir `index.html` con doble clic (file://) funciona para casi todo, pero el navegador
bloquea dos cosas por seguridad en ese modo:

- 📷 **La cámara del escáner de códigos** (requiere HTTPS o localhost)
- 📲 **El modo PWA/offline** (Service Worker, instalar en pantalla de inicio)

## Opción 1 — Servidor local (recomendada para probar en tu Mac)

```bash
cd "/Users/salvador/Documents/DATOS PARA METODOLOGIA/FISICOCULTURIMO ENTRENAMIENTO /NEXUS-RP_Coach"
npx serve .
# o sin instalar nada:
python3 -m http.server 8080
```

Luego abre `http://localhost:8080` (o el puerto que indique `serve`).
Con localhost ya funcionan la cámara, el Service Worker y la instalación como app.

## Opción 2 — Publicarla gratis (para usarla en el celular dentro del gym/súper)

Cualquiera de estas sirve archivos estáticos con HTTPS gratis:

- **GitHub Pages**: sube la carpeta a un repo → Settings → Pages.
- **Netlify Drop**: arrastra la carpeta a https://app.netlify.com/drop
- **Vercel**: `npx vercel` dentro de la carpeta.

Al abrirla desde el celular: menú del navegador → **"Agregar a pantalla de inicio"**.
Desde ese momento la app abre como aplicación nativa y el catálogo de tiendas +
los alimentos escaneados recientemente funcionan **sin señal dentro de la tienda**.

## Verificación rápida

1. Abre la app servida por HTTP y revisa en consola: `✅ PWA: Service Worker activo`.
2. Activa modo avión → recarga → la app debe seguir abriendo.
3. Coach Nutricional → Escáner → "Iniciar escáner" debe pedir permiso de cámara.
