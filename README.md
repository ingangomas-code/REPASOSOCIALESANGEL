# Atlas · Laboratorio de Sociales

Repaso en cinco clips reales hechos con Motion Canvas 3.17.2. La base vigente incorpora los cambios de Antigravity: voz `es-ES-AlvaroNeural` a `+8%`, música suave en bucle y tiempos de subtítulos por frase cuando están disponibles. Basado en las cinco fotografías aportadas por el usuario, sin OCR. Las hojas originales y los materiales anteriores de Cinema/Manus se conservan.

Para continuar: [bitácora](docs/BITACORA.md), [arquitectura y ruta hacia nuevas materias](docs/ARQUITECTURA_Y_RUTA.md), [incidencias](docs/ERRORES_Y_SOLUCIONES.md) y [Graphify local](docs/GRAPHIFY.md). Este repositorio tiene su propio entorno de Graphify y grafo, independientes del proyecto cinematográfico superior.

## Abrir el repaso

Haz doble clic en `ABRIR-REPASO.cmd`, o abre `dist/index.html`. El HTML portable incluye el código y los estilos una vez ejecutado `scripts/portable.mjs`; necesita conservar al lado las carpetas `media/` y `sources/`. Si un navegador restringe archivos locales, ejecuta `SERVIR-REPASO.cmd` y abre `http://127.0.0.1:9011/`. El usuario ya realizó la publicación con Antigravity; estos comandos locales no despliegan cambios.

El ZIP de primera entrega contiene el HTML y sus medios originales, pero es anterior al cambio de voz/música: no asumir que representa la versión vigente. Los cinco MP4 de `public/media/` y `dist/media/` sí coinciden en la revisión del 2026-10-29. Una nueva entrega portable debe fijarse y empaquetarse de nuevo cuando se solicite. La reproducción no requiere claves, backend ni instalación de Motion Canvas.

## Experiencia

- Cinco capítulos de unos tres minutos, seis escenas por capítulo.
- Voz `es-ES-AlvaroNeural` a `+8%` y música suave incorporadas en los MP4; controles de pausa, volumen, velocidad, repetición y navegación por escenas.
- Una pausa de razonamiento por capítulo, tres retos finales por capítulo y cinco preguntas de misión final.
- Subtítulos por frases, resúmenes, pistas, corrección con explicación y repaso de errores.
- Laboratorios: orientación al girar, hemisferios, límites de la isla, mapa con estrella y colores, y siete asociaciones de comunidad.
- Progreso y posición guardados únicamente en el navegador. No se solicita micrófono, cuentas ni datos del niño. Se puede reiniciar desde Tus hojas → Fuentes y notas.

Las pausas del HTML no están dentro del MP4: al abrir un MP4 por separado solo se reproduce su explicación. Se puede continuar una pausa sin responder. El progreso de 15 ideas contabiliza únicamente los tres retos de cada capítulo; la misión final tiene su propio estado.

## Fidelidad educativa

`content/lessons.json` contiene los guiones y las preguntas, con referencia a hojas y ejercicios. `content/timed-lessons.json` añade los tiempos medidos del audio. Se cubren los ejercicios 1–10. Las respuestas manuscritas no se usan como clave de corrección.

Se explica que el cartel de la hoja 5 corresponde a una estación de bomberos, aunque las preguntas mencionen una escuela. Se distingue Calle 72 de No. 38–150, y se identifica Barrio El Recreo, Barranquilla, Colombia. También se distingue el límite oeste del país (Haití) del de la isla (canal del Viento, según el vocabulario de la hoja).

Los mapas provinciales de `content/geography.json` y `public/maps.json` proceden de Natural Earth, dominio público, distribuidos por geoBoundaries. La silueta de Haití procede de OpenStreetMap/Wambacher a través de geoBoundaries, licencia ODbL. Los metadatos de origen y licencia están incluidos en el JSON. El JSON conserva los nombres de origen; la interfaz actualiza los alias antiguos La Estrelleta, El Seybo y Hermanas a Elías Piña, El Seibo y Hermanas Mirabal. El globo es un esquema didáctico, sin escala.

Fuentes: https://www.geoboundaries.org/ · https://www.openstreetmap.org/copyright · https://presidencia.gob.do/acerca-de-rd/informacion-general

## Desarrollo y reproducción de la producción

Requisitos: Node.js 22.12+ o 24, FFmpeg y Python con `edge-tts==7.3.1`, `Pillow==13.0.0`. La generación de voz requiere Internet y usa el servicio de Microsoft mediante edge-tts; el repaso final no lo necesita. La configuración actual también necesita `bg_music.ogg` y, para actualizar el MP4 sin renderizar otra vez, los videos mudos de `.render/`. Las dependencias locales y la portabilidad pendiente se registran en `docs/ERRORES_Y_SOLUCIONES.md`. Generación pagada declarada por los metadatos vigentes: US$0.

```powershell
npm ci
..\..\.venv\Scripts\python.exe scripts/prepare.py
npm run dev
```

Abre `http://127.0.0.1:9010/render.html` para renderizar los pendientes. `?chapter=orientacion` selecciona uno. Los MP4 ya existentes se conservan: para regenerar uno, mueve ese MP4 a una ubicación de respaldo y vuelve a abrir su render. No se sobrescriben las fotografías originales.

La exportación usa el `Renderer` real de Motion Canvas. Las escenas procedurales de `src/scenes.ts` se dibujan a 1280×720, 24 fps. El exportador local envía los fotogramas JPEG a FFmpeg y combina el resultado con la narración medida. El endpoint solo existe en el servidor de desarrollo ligado a 127.0.0.1. HMR se desactiva para que editar el HTML no interrumpa una exportación. Evita recargar la pestaña de producción mientras renderiza.

```powershell
npm run check
npm test
npm run build
node scripts/portable.mjs
..\..\.venv\Scripts\python.exe scripts/verify_media.py
```

`scripts/prepare.py` guarda en caché la voz según texto, voz y velocidad, preserva copias exactas de las fuentes con SHA-256 y crea subtítulos VTT. Los tiempos de frase proceden de `SentenceBoundary` cuando el servicio los proporciona; se conserva una estimación proporcional como respaldo. El botón CC consulta los tiempos incorporados en los datos, sin cargar archivos externos. No es una alineación fonética palabra a palabra.

## Verificación

Las pruebas automáticas comprueban cobertura de hojas/ejercicios, preguntas válidas, continuidad y alineación a fotogramas, corrección/progreso, pausas, restauración de estado y existencia de las cinco provincias. La auditoría de medios verifica los cinco MP4 reales, sus duraciones, pistas de voz y decodificación, y genera una hoja de muestras para inspección visual. El informe se guarda en `verification/`.

La revisión visual se hace por muestras de las escenas y mediante el navegador. No equivale a una escucha humana completa de toda la narración ni a una evaluación de aprendizaje con el niño.

