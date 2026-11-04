# Actualizar Momentos Impulso

1. Sube cada fotografía optimizada a `assets/galeria/`. Se recomienda WebP o JPEG de 1600 px en su lado mayor; prepara una miniatura de aproximadamente 800 px cuando haya muchas fotografías.
2. Agrega un objeto a `data/galeria.json`. Conserva un `id` único, rutas relativas válidas en `image` y `thumbnail`, texto alternativo descriptivo, `category`, `order` y `published`.
3. Usa una de estas categorías: `inauguracion`, `cultura`, `deporte`, `tecnologia`, `diseno`, `investigacion`, `gobernanza`, `bienestar` o `bootcamp`.
4. Usa `featured: true` para que una fotografía pueda aparecer en la vista previa de la portada. La portada muestra hasta ocho fotos publicadas.
5. Antes de publicar, abre `galeria.html`, confirma que no haya imágenes rotas, prueba los filtros, el visor, las flechas y la tecla Escape.

Ejemplo:

```json
{
  "id": "impulso-2026-002",
  "image": "assets/galeria/impulso-2026-002.webp",
  "thumbnail": "assets/galeria/impulso-2026-002-thumb.webp",
  "title": "Nombre del momento",
  "description": "Descripción breve.",
  "category": "tecnologia",
  "date": "2026-10-16",
  "alt": "Descripción visual de la fotografía.",
  "order": 2,
  "published": true,
  "featured": true
}
```

La cortina superior utiliza `assets/videos/impulso-2026-resumen.mp4`. Para futuras sustituciones, conserva este nombre y codifica el video en H.264/AAC; la imagen institucional original funciona como portada de respaldo.
