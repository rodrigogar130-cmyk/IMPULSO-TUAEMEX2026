# Reporte de discrepancias - Impulso Tuaeméx 2026

Fecha de revisión: 20 de octubre de 2026.

| Indicador | Fuente revisada | Resultado | Acción aplicada |
| --- | --- | --- | --- |
| Actividades | `data/activities-public.json` | 55 registros locales | No se sustituyó por 60 ni se cambió la fuente del catálogo. |
| Referencia operativa | Encargo de actualización postevento | 60 actividades | Se mantiene como cifra a contrastar con los registros oficiales. |
| Ponentes | Contador público dinámico | Depende de actividades abiertas y datos públicos de Supabase | Se quitó el valor fijo de respaldo para evitar una cifra no verificada. |
| Ganadores | Encargo de actualización postevento | 107 identificados para revisión | No se consultó, publicó ni modificó ningún resultado. |

El sitio conserva los contadores dinámicos existentes cuando las fuentes públicas responden. Las cifras no verificadas se muestran inicialmente como un guion, evitando presentar los valores históricos de 54 actividades y 66 ponentes como datos confirmados. No se hicieron cambios a Supabase, tablas, RLS, funciones, autenticación, asistencias, QR/NFC, tokens ni la regla de siete actividades.
