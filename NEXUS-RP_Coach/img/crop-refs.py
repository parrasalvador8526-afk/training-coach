#!/usr/bin/env python3
"""
Recorta las imágenes de referencia panorámicas (3 poses: frontal, lateral, espalda)
en 6 archivos individuales para usar como siluetas guía.

USO:
1. Guarda la imagen del hombre como: img/ref-male.jpg
2. Guarda la imagen de la mujer como: img/ref-female.jpg
3. Ejecuta: python3 img/crop-refs.py

Se generan:
  img/sil-m-front.png, sil-m-side.png, sil-m-back.png
  img/sil-f-front.png, sil-f-side.png, sil-f-back.png
"""
import os
import sys
from collections import deque

try:
    from PIL import Image, ImageFilter, ImageEnhance
except ImportError:
    print("Instalando Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image, ImageFilter, ImageEnhance

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Umbral de PROPAGACIÓN del flood-fill (alto = conservador, preserva más manos)
FLOOD_SPREAD = 205
# Umbral para hacer transparente un píxel de fondo confirmado
BG_THRESHOLD = 195
# Zona de transición para suavizar bordes del cuerpo
EDGE_SOFT_LOW = 185


def flood_fill_background(gray_img):
    """
    Identifica el fondo usando flood-fill desde los bordes de la imagen.
    El flood-fill solo se propaga por píxeles muy claros (>= FLOOD_SPREAD),
    evitando comer los bordes de manos y dedos que tienen brillo intermedio.
    Luego se aplica transparencia gradual en los bordes encontrados.
    """
    w, h = gray_img.size
    pixels = gray_img.load()
    # Máscara: True = es fondo
    is_bg = [[False] * h for _ in range(w)]

    queue = deque()

    # Sembrar desde los 4 bordes (solo píxeles muy claros)
    for x in range(w):
        for y in [0, h - 1]:
            if pixels[x, y] >= FLOOD_SPREAD and not is_bg[x][y]:
                is_bg[x][y] = True
                queue.append((x, y))
    for y in range(h):
        for x in [0, w - 1]:
            if pixels[x, y] >= FLOOD_SPREAD and not is_bg[x][y]:
                is_bg[x][y] = True
                queue.append((x, y))

    # Flood-fill: solo se propaga por píxeles claros (>= FLOOD_SPREAD)
    # Esto evita que el flood entre en la zona de manos/dedos (175-205)
    while queue:
        cx, cy = queue.popleft()
        for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            nx, ny = cx + dx, cy + dy
            if 0 <= nx < w and 0 <= ny < h and not is_bg[nx][ny]:
                if pixels[nx, ny] >= FLOOD_SPREAD:
                    is_bg[nx][ny] = True
                    queue.append((nx, ny))

    return is_bg


def keep_largest_body(rgba_img):
    """
    Encuentra el componente conectado opaco más grande (el cuerpo principal)
    y hace transparente cualquier fragmento aislado (restos de poses vecinas).
    """
    w, h = rgba_img.size
    px = rgba_img.load()

    # Crear máscara de píxeles opacos (alpha > 128)
    is_body = [[px[x, y][3] > 128 for y in range(h)] for x in range(w)]
    visited = [[False] * h for _ in range(w)]

    # Encontrar todos los componentes conectados
    components = []
    for sx in range(w):
        for sy in range(h):
            if is_body[sx][sy] and not visited[sx][sy]:
                # BFS para encontrar este componente
                comp = []
                queue = deque()
                queue.append((sx, sy))
                visited[sx][sy] = True
                while queue:
                    cx, cy = queue.popleft()
                    comp.append((cx, cy))
                    for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                        nx, ny = cx + dx, cy + dy
                        if 0 <= nx < w and 0 <= ny < h and not visited[nx][ny] and is_body[nx][ny]:
                            visited[nx][ny] = True
                            queue.append((nx, ny))
                components.append(comp)

    if not components:
        return

    # Solo eliminar fragmentos pequeños (< 0.5% del área total de la imagen)
    # Esto preserva la cabeza y otras partes grandes del cuerpo
    min_size = int(w * h * 0.005)

    removed = 0
    for comp in components:
        if len(comp) < min_size:
            for (x, y) in comp:
                r, g, b, a = px[x, y]
                px[x, y] = (r, g, b, 0)
                removed += 1

    if removed > 0:
        print(f"    (eliminados {removed} px de fragmentos pequeños)")


def process_image(src_name, prefix):
    src_path = os.path.join(SCRIPT_DIR, src_name)
    if not os.path.exists(src_path):
        print(f"  [!] No encontrado: {src_path}")
        return False

    img = Image.open(src_path)
    w, h = img.size
    third = w // 3

    # Recortes generosos para incluir cuerpo completo (brazos y manos).
    poses = [
        ("front", 0, third + int(third * 0.30)),             # margen amplio derecha para dedos completos
        ("side", third + int(third * 0.30), 2 * third - int(third * 0.15)),  # márgenes estrictos para excluir poses vecinas
        ("back", 2 * third - int(third * 0.10), w),          # extender izquierda para mano completa
    ]

    for pose_name, x_start, x_end in poses:
        # Asegurar límites válidos
        x_start = max(0, x_start)
        x_end = min(w, x_end)
        cropped = img.crop((x_start, 0, x_end, h))

        # Convertir a escala de grises
        gray = cropped.convert("L")

        # Ajustar contraste ligeramente
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(1.0)

        # Flood-fill desde bordes para identificar fondo real
        w_crop, h_crop = gray.size
        is_bg = flood_fill_background(gray)

        # Crear imagen RGBA y aplicar transparencia solo al fondo conectado
        rgba = gray.convert("RGBA")
        px = rgba.load()
        gray_px = gray.load()
        for y in range(h_crop):
            for x in range(w_crop):
                if is_bg[x][y]:
                    brightness = gray_px[x, y]
                    r, g, b, a = px[x, y]
                    if brightness >= BG_THRESHOLD:
                        # Fondo claro confirmado → transparente
                        px[x, y] = (r, g, b, 0)
                    elif brightness >= EDGE_SOFT_LOW:
                        # Zona de transición → semi-transparente (borde suave)
                        alpha = int(255 * (BG_THRESHOLD - brightness) / (BG_THRESHOLD - EDGE_SOFT_LOW))
                        px[x, y] = (r, g, b, alpha)

        # Eliminar fragmentos aislados de poses vecinas
        keep_largest_body(rgba)

        # Suavizar sombras extremas: aplicar piso de brillo mínimo a píxeles del cuerpo.
        # Las sombras muy oscuras del modelo 3D (fosas nasales, bordes de dedos)
        # se ven como manchas negras a baja opacidad. Elevarlas a un mínimo sutil.
        MIN_BODY_BRIGHTNESS = 75
        px = rgba.load()
        for y in range(h_crop):
            for x in range(w_crop):
                r, g, b, a = px[x, y]
                if a > 128 and r < MIN_BODY_BRIGHTNESS:
                    px[x, y] = (MIN_BODY_BRIGHTNESS, MIN_BODY_BRIGHTNESS, MIN_BODY_BRIGHTNESS, a)

        # Guardar como PNG con transparencia
        out_name = f"sil-{prefix}-{pose_name}.png"
        out_path = os.path.join(SCRIPT_DIR, out_name)
        rgba.save(out_path, "PNG", optimize=True)
        print(f"  [OK] {out_name} ({w_crop}x{h_crop})")

    return True


print("=== Procesando imágenes de referencia ===\n")

print("Hombre (ref-male.jpg):")
m_ok = process_image("ref-male.jpg", "m")
if not m_ok:
    # Intentar con .png
    m_ok = process_image("ref-male.png", "m")

print("\nMujer (ref-female.jpg):")
f_ok = process_image("ref-female.jpg", "f")
if not f_ok:
    f_ok = process_image("ref-female.png", "f")

if m_ok or f_ok:
    print("\n=== Listo! Las imágenes recortadas están en img/ ===")
    print("Recarga la app para ver los cambios.")
else:
    print("\n[ERROR] No se encontraron las imágenes fuente.")
    print("Guarda las imágenes como:")
    print(f"  {os.path.join(SCRIPT_DIR, 'ref-male.jpg')}")
    print(f"  {os.path.join(SCRIPT_DIR, 'ref-female.jpg')}")
