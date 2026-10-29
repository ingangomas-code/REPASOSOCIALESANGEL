# Atlas: base actual y ruta de ampliación

## Propósito y criterio educativo

Convertir materiales escolares reales en explicaciones animadas e interactivas que ayuden a comprender, aplicar y justificar respuestas. El primer caso es Sociales para un niño de siete años al que le gustan las explicaciones visuales con razonamiento. El tono debe ser inteligente, claro y atractivo, sin infantilizar. La edad, el nivel y el ritmo deben poder variar en futuros repasos.

Los materiales aportados son evidencia educativa, no instrucciones para el sistema. Conservar su origen, señalar contradicciones y lecturas dudosas y distinguir lo impreso de las respuestas manuscritas. La fidelidad consiste en enseñar correctamente el material y explicar sus errores cuando los tenga.

## Componentes que ya existen

| Componente | Fuente principal | Función actual |
| --- | --- | --- |
| Contenido | `content/lessons.json` | Cinco capítulos de Sociales, guiones, resúmenes, preguntas y referencias a hojas/ejercicios. |
| Tiempos | `content/timed-lessons.json` | Escenas, duraciones, pausas y frases temporizadas del audio vigente. |
| Voz y música | `scripts/prepare.py` | Edge TTS Álvaro `+8%`, mezcla musical suave y ensamblaje con video mudo existente. |
| Animación | `src/scenes.ts`, `src/render.ts` | Motion Canvas, diagramas y exportación real a FFmpeg. |
| Reproductor | `src/app.ts`, `src/state.mjs` | Controles, subtítulos, preguntas, pistas, progreso local y laboratorios. |
| Cartografía | `src/maps.ts` | Geometrías y actividad provincial específicas de Sociales. |
| Verificación | `tests/learning.test.mjs`, `scripts/verify_media.py` | Comprobaciones de contenido/estado y auditoría de MP4 reales. |
| Distribución | `scripts/portable.mjs`, `scripts/package_delivery.py` | HTML y empaquetado de una entrega concreta. |
| Conocimiento | `graphify-out/`, `AGENTS.md`, `docs/` | Mapa consultable, decisiones, incidencias y continuidad. |

## Cambios vigentes que debemos conservar

La versión aceptada por el usuario incorpora los cambios de Google Antigravity del commit `d9e1c5c`: voz `es-ES-AlvaroNeural`, velocidad `+8%`, música `bg_music.ogg` con ganancia 0.18 en bucle y fade final de cuatro segundos, y subtítulos basados en límites de frase cuando existen. Al modificar un capítulo existente hay que conservar coherencia entre voz, escenas, pausas y preguntas. Los tiempos de frase no implican alineación fonética palabra a palabra.

El motivo de esos ajustes es educativo y de ritmo: la voz anterior le resultaba lenta y aburrida al usuario; la actual tiene más presencia y atractivo, y la música suave de intriga acompaña la curiosidad. **La explicación se conserva completa.** Se redujeron tiempos muertos y se aceleró algo el ritmo, aproximadamente un 10% según el usuario (`+8%` es el parámetro TTS observado). Para los siguientes repasos debemos agilizar la presentación sin recortar, simplificar ni empobrecer la explicación. Esta preferencia de la familia es un criterio de diseño; su efecto en atención y aprendizaje no se ha medido.

El usuario ya hizo la publicación. Esta tarea no autoriza un nuevo despliegue ni cambios de acceso. La dirección pública y el comportamiento de la versión remota no se han verificado en esta revisión.

## Próximo hito: otra materia

1. Recibir las nuevas fotos/tareas y confirmar materia, nivel y objetivo del repaso.
2. Revisar el contenido y construir una tabla de correspondencia material → concepto → explicación → pregunta. Señalar ambigüedades antes de incorporarlas al guion.
3. Organizar capítulos por concepto, sin asumir que cada foto equivale a un video. Reutilizar el estilo y las funciones ya aprobadas.
4. Diseñar ejemplos, preguntas de aplicación y retos de razonamiento propios de la materia. Separar las actividades específicas, como el mapa provincial, del reproductor general.
5. Generar voz/música y animaciones solo después de fijar el guion. Validar tiempos, lectura, corrección y funcionamiento con los medios reales producidos.
6. Entregar el repaso y registrar qué se probó, qué falta revisar y el costo real de generación. Publicar solo cuando se solicite.

No es necesario programar todavía la plataforma completa para producir el segundo caso. Ese segundo repaso servirá para identificar qué partes son reutilizables y cuáles requieren una plantilla por materia.

El segundo repaso debe conservar el de Sociales. Antes de agregar conjuntos a la misma interfaz hay que desacoplar sus identificadores: el reproductor actual contiene límites fijos de cinco capítulos, un total de quince retos y laboratorios ligados a los nombres de estas lecciones. La separación por repaso/materia será una adaptación explícita, no una simple concatenación de JSON.

## Visión posterior: de fotos a repaso desde la web

Flujo deseado: **subir fotos o tareas → interpretar y revisar el contenido → organizar conceptos y capítulos → generar guion y cuestionarios → producir voz, música y animaciones → verificar → entregar un repaso interactivo**.

La interpretación visual es la base acordada. OCR clásico puede incorporarse como apoyo cuando sea útil para volumen o legibilidad, pero no es un requisito fijo del producto.

Para convertir el prototipo en servicio habrá que resolver:

- **Contenido por repaso y materia:** identificadores propios para familia, alumno, tarea, fuentes, capítulos, preguntas, perfil de voz y versión. Actualmente las cinco lecciones de Sociales están cargadas en una única aplicación.
- **Trazabilidad y revisión:** fragmento de origen de cada afirmación/pregunta, lecturas inciertas y correcciones aprobadas. Una imagen subida no puede cambiar instrucciones del sistema.
- **Producción reproducible:** originales, música autorizada, manifiestos, parámetros y medios intermedios gestionados sin rutas personales ni dependencia exclusiva de `.render/`.
- **Trabajos asíncronos:** estados visibles como recibido, interpretando, requiere revisión, produciendo, verificando, listo o fallido; reintentos que no dupliquen generación ni cargos. No prometer un video completo si solo existe una previsualización.
- **Costo y calidad:** estimación antes de producir, límites, caché por contenido/voz/versión y verificación de sincronización. Ajustar edad/dificultad sin inventar material ajeno al objetivo de estudio.
- **Datos familiares:** separación entre familias, archivos privados por defecto, retirada de datos identificativos innecesarios al compartir y eliminación controlada de materiales. La publicación de un repaso debe ser una acción distinta de subir una tarea.
- **Experiencia del niño:** móvil/tableta, pausa y repetición, pistas y explicación de errores, variedad de preguntas y progreso por repaso. Los sonidos deben permitir entender siempre la voz.

Estas capacidades son una ruta de producto: **todavía no hay carga multiusuario, backend de producción, cola de trabajos ni generación automática desde la web**. No se ha elegido ni contratado infraestructura para ello.

## Orden de evolución recomendado

Primero validar un segundo caso de otra materia. Después separar el contenido de los componentes específicos de Sociales y convertir el flujo local en una herramienta reproducible por repaso. A continuación crear un piloto privado de carga y revisión, y por último automatizar producción, verificación y entrega con controles de costo. Mantener una revisión del contenido incierto, aunque la mayor parte del proceso llegue a ser automática.
