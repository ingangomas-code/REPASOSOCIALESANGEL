# Bitácora de Atlas

Registro propio del producto educativo. Zona horaria: America/Santo_Domingo. No reemplaza ni reescribe el historial de Cinema/Manus de la carpeta superior.

## 2026-10-29 — Cierre del cuaderno de Science, biblioteca de cuadernos y quinto clip pendiente

**Punto donde quedó la sesión anterior de GPT:** estaban completados los guiones y audios en inglés (`en-US-AndrewMultilingualNeural`, velocidad `+0%`, con música suave `bg_music.ogg` a ganancia `0.10`), la portada/biblioteca (`index.html` con tarjetas de Sociales y Science y creación de borradores locales en IndexedDB), las vistas separadas (`sociales.html` y `science.html`), las pruebas (`tests/notebooks.test.mjs`) y cuatro de los cinco clips MP4 de Science (`science-living.mp4`, `science-cycles.mp4`, `science-offspring.mp4`, `science-care.mp4`). Faltaba completar la exportación del quinto clip (`science-signals.mp4`, cuyo archivo temporal `.render/science-signals-silent.mp4` había quedado en 48 bytes al interrumpirse la sesión), ejecutar `verify_science.py`, construir `dist/` portable y actualizar el grafo de Graphify.

**Cierre ejecutado:**
- Se completó el render real con Motion Canvas en `127.0.0.1:9010/render.html?notebook=science&chapter=science-signals`, generando `.render/science-signals-silent.mp4` y ensamblando `public/science/media/science-signals.mp4`.
- `scripts/verify_science.py` aprobó los 5 clips de Science (`590.46 s` totales, H.264 1280×720 a 24 fps + AAC, decodificación completa sin errores) y verificó por SHA-256 que los 5 clips de Sociales permanecen idénticos al commit `d9e1c5c`.
- `npm run check`, `npm test` (13/13 pruebas), `npm run build` y `node scripts/portable.mjs` (`dist/index.html`, `dist/sociales.html`, `dist/science.html`) finalizaron sin errores.
- Se actualizó el grafo local con `npm run graph:update`. No se utilizó ninguna API pagada (`US$0`).

## 2026-10-29 — Motivo de la voz, el ritmo y la música

**Criterio expresado por el usuario:** la voz anterior sonaba demasiado lenta y aburrida. Se eligió una voz percibida como más fuerte, con más presencia y más atractiva, y se añadió música suave de intriga para acompañar la explicación y despertar curiosidad.

**Aclaración importante:** no se acortó ni se simplificó la explicación; el usuario considera que está magistral y desea conservarla completa. Lo que se redujo fue el tiempo muerto y se aceleró un poco el ritmo, aproximadamente un 10% según su descripción. La configuración de TTS observada es `+8%`; es un parámetro concreto del código, no una medición de la reducción total del montaje. Las ventanas de escena conservadas en los archivos no contradicen que la locución y los espacios internos se hayan vuelto más ágiles.

**Decisión para próximos repasos:** preservar la profundidad y el contenido educativo; mejorar la atención mediante una locución con energía, menos esperas innecesarias y un ritmo algo más rápido, sin atropellar las ideas. Mantener la música de intriga suave para que acompañe a la voz. No interpretar esta preferencia como autorización para resumir, eliminar explicaciones o reducir contenidos.

**Alcance de la evidencia:** motivo y percepción aportados directamente por el usuario; parámetro `+8%` confirmado en el código durante la revisión anterior. No se ha medido aquí una reducción global exacta del 10% ni un efecto sobre el aprendizaje. Esta entrada corrige cualquier interpretación previa de que se hubiera recortado la explicación. Solo se modifica documentación: no se regenera audio/video ni se publica.

## 2026-10-29 — Base vigente y Graphify independiente

**Solicitud:** detener la publicación pendiente a cargo de Codex, instalar Graphify en este proyecto, entender los cambios realizados con Google Antigravity y dejar continuidad para nuevos repasos. El usuario informa que ya publicó la aplicación y desea convertirla más adelante en una web donde padres carguen fotos/tareas y obtengan contenido educativo interactivo.

**Estado inicial observado:** Atlas ya tiene repositorio Git propio. HEAD al iniciar la revisión: `d9e1c5c595e19c7873b3dccb406f8664199579a2`, con mensaje de actualización de voz y música. Los cambios previos están preservados. La publicación se considera realizada por el usuario; no se ha desplegado nada ni se ha comprobado una URL de producción en esta sesión.

**Cambios de Antigravity confirmados en el código y metadatos locales:**

- Voz vigente: `es-ES-AlvaroNeural`, velocidad `+8%`, en `scripts/prepare.py` y `public/production.json`. La voz anterior `es-DO-EmilioNeural` a `-8%` pertenece a la primera entrega.
- Música `bg_music.ogg` en bucle con ganancia 0.18 y desvanecimiento final de cuatro segundos, mezclada por FFmpeg. Se conserva una copia local en `.render/audio/bg_music.ogg`.
- Se mantienen las ventanas de las treinta escenas y los puntos de pausa de los cinco capítulos. La voz puede ajustarse con `atempo` para caber en esas ventanas.
- Se guardan tiempos de frases de `SentenceBoundary`; `currentCaption()` los utiliza cuando existen. El código conserva una estimación proporcional como respaldo. Los datos actuales contienen 163 frases temporizadas entre los cinco capítulos.
- Los cinco MP4 de `public/media/` y `dist/media/` coinciden por SHA-256. Los metadatos de duración de voz no indican desbordamientos de las ventanas revisadas. Esto es verificación de archivos/datos, no escucha humana integral.

**Instalación y configuración:** Graphify 0.9.95 en `.venv/` del repositorio educativo, fijado en `requirements-graph.txt`; grafo propio en `graphify-out/`. Se añaden comandos `npm run graph:update`, `graph:query` y `graph:explain`, instrucciones `AGENTS.md`, exclusiones de dependencias/medios duplicados y un finalizador local que mantiene etiquetas y contabilidad explícita. No se actualizan habilidades globales ni se utiliza una instalación global de Graphify.

**Documentación creada:** esta bitácora, `ARQUITECTURA_Y_RUTA.md`, `ERRORES_Y_SOLUCIONES.md` y `GRAPHIFY.md`. El README se actualiza para reflejar la voz/música vigentes y el carácter ya publicado comunicado por el usuario. La ruta futura queda documentada, sin implementar todavía una plataforma multiusuario.

**Incidencias registradas:** README anterior describía la primera voz y subtítulos aproximados; el ZIP de primera entrega es anterior al audio vigente; la fuente musical y el render dependen de archivos locales ignorados. No se sobrescribe el ZIP ni se regenera material como parte de esta tarea.

**Contabilidad:** no se generan voces ni videos, no se llama a una API de generación pagada y no se publica. Extracción del grafo estructural y documental local; sin extracción semántica mediante LLM. El consumo de tokens del agente no está expuesto y no se declara cero.

**Estado para continuar:** la base aceptada es Atlas con voz Álvaro, música suave, Motion Canvas, resúmenes, preguntas y laboratorios. El próximo paso de producto es otro repaso de la materia que indique el usuario, reutilizando este proceso y conservando la trazabilidad hacia las fotos/tareas nuevas. La automatización web será una etapa posterior.

**Validación de cierre:** Graphify 0.9.95 instalado y ejecutado desde el entorno local de Atlas. `npm run graph:update` construyó y finalizó un grafo de 202 nodos, 344 relaciones y 13 comunidades en la primera comprobación. La consulta de narración/música recuperó las funciones y las incidencias pertinentes; `graphify path` confirmó `speech() → generate_beat_tts()` como relación de llamada extraída. Se validaron JSON, etiquetas y exclusión de `.venv`, dependencias, cachés y `dist` del grafo. `npm run check` pasó y las siete pruebas de `npm test` también pasaron. No se ejecutó generación multimedia ni despliegue. ATLAS-004 queda resuelta. Los recuentos pueden aumentar en la actualización final al incorporar esta documentación.
