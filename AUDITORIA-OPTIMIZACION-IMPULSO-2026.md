# Auditoría técnica y optimización — Impulso Tuaeméx 2026

Fecha: 3 de noviembre de 2026  
Alcance: sitio estático HTML/CSS/JavaScript, medios locales y uso cliente de Supabase.

## Resultado ejecutivo

Se aplicaron mejoras reversibles al camino de carga inicial, sin cambiar rutas,
funcionalidades, autenticación, pasaporte digital, datos ni configuración remota de
Supabase. La copia previa a la optimización está en
`backups/20261030-auditoria-preoptimizacion/`.

## Hallazgos y acciones aplicadas

| Prioridad | Hallazgo comprobado | Acción realizada |
| --- | --- | --- |
| Alta | El video principal `assets/videos/impulso-2026-resumen.MP4` pesa 63.89 MB y se solicitaba desde la carga inicial. | El hero ahora usa `preload="none"`; carga metadatos y reproduce el video sólo al interactuar con sus controles. Se conserva la experiencia, incluidos pausa y sonido. |
| Alta | `navbar-auth.js` volvía a importar `site-header.js`, aunque cada página ya cargaba el header directamente. | Se eliminó esa segunda importación, evitando un montaje y listeners duplicados del encabezado. |
| Media | Las estadísticas públicas iniciaban consultas de actividades y ponentes al cargar la portada. | `public-stats.js` difiere esas consultas hasta que el bloque se aproxima al viewport o el navegador queda inactivo. |
| Media | Los cambios de `navbar-auth.js` necesitaban invalidar la caché de módulos en las páginas públicas. | Se actualizó el identificador de versión del script en las páginas que usan navegación autenticada. |

## Medios y carga diferida

- El hero de escritorio y móvil ya se precarga de forma condicional mediante `media`.
- Agenda, ponentes, mapa PDF y galería utilizan carga diferida o activación por
  proximidad cuando aplica.
- Se verificó que la galería tenga recursos existentes: 11 entradas, incluido el
  video de resumen y las fotografías nuevas.
- Permanecen como oportunidades de una siguiente fase las conversiones WebP/AVIF
  de imágenes fotográficas y la compresión/reencodificación del video de 63.89 MB.
  No se hicieron automáticamente porque implican decisiones de calidad visual y
  sustitución de activos institucionales.

## Revisión de Supabase y seguridad (solo lectura)

- El cliente expone una clave publicable, no se detectaron claves `service_role`,
  secretos privados ni credenciales administrativas en el código revisado.
- Las consultas públicas localizadas son las previstas para actividades y ponentes;
  la sesión se usa para autenticación y consulta de rol en la navegación.
- No se modificaron tablas, políticas RLS, funciones RPC, Storage, sesiones ni
  configuración de Supabase.
- El código fuente no permite confirmar por sí mismo las políticas reales de RLS ni
  los permisos remotos. Esa comprobación requiere acceso autorizado al proyecto de
  Supabase; queda como recomendación de auditoría de servidor.

## Validación realizada

- `node --check` correcto en `navbar-auth.js`, `public-stats.js`, `gallery.js`,
  `site-header.js`, `activities.js`, `agenda-loader.js` y `speakers.js`.
- Confirmado: hero con `preload="none"`, sin autoplay forzado, sin importación
  duplicada de header y con estadísticas diferidas mediante `IntersectionObserver`.
- Confirmado: cada recurso declarado como `thumbnail` en `data/galeria.json` existe
  localmente.
- Se intentó generar Lighthouse por línea de comandos. La herramienta no produjo un
  informe utilizable en este entorno, por lo que no se reportan FCP, LCP, TBT ni
  puntuaciones inventadas.
- La instancia local de Live Server no estaba activa al repetir las pruebas HTTP;
  por esa razón, la verificación de rutas en servidor debe repetirse al iniciar la
  vista previa habitual de VS Code.

## Recomendaciones pendientes (no aplicadas)

1. Generar versiones WebP/AVIF de las fotografías de mayor peso y servirlas con
   `srcset`/`picture` después de aprobación visual.
2. Exportar una versión web del video principal (H.264/VP9 con bitrate optimizado)
   y conservar el original como fuente maestra.
3. Ejecutar Lighthouse en un navegador con la vista previa activa para fijar una
   línea base cuantitativa antes/después.
4. Con acceso autorizado a Supabase, revisar RLS, permisos de RPC y los asesores de
   base de datos sin hacer cambios hasta aprobarlos.
