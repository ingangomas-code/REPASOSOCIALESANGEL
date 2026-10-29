# Incidencias de Atlas

Incidencias propias del producto educativo. El historial anterior de la creación inicial permanece en `../../docs/ERRORES_Y_SOLUCIONES.md` y `../../docs/BITACORA.md`.

## ATLAS-001 — Documentación de la voz y subtítulos anterior a Antigravity

**Fecha:** 2026-10-29. **Reproducción:** el README describía `es-DO-EmilioNeural` y subtítulos exclusivamente proporcionales. `scripts/prepare.py`, `src/state.mjs`, los datos temporizados y `public/production.json` indican voz Álvaro `+8%`, música suave y límites de frase con respaldo proporcional.

**Solución:** actualizar el README, crear bitácora propia y fijar el estado vigente en las instrucciones del proyecto. **Verificación:** comparación de archivos y commit `d9e1c5c`, sin regeneración ni escucha humana integral. **Estado:** documentación corregida; no se altera la voz aprobada.

## ATLAS-002 — Música y medios intermedios dependen de rutas locales

**Evidencia:** `BG_MUSIC_SOURCE` apunta a `C:/Users/ingan/Desktop/ANTIGRAVITY/DOMI NOTEBOOK/outputs/bg_music.ogg`; la copia disponible está en `.render/audio/bg_music.ogg`, ignorada por Git. El ensamblaje actualizado reutiliza `.render/{id}-silent.mp4` si existe. `prepare.py` no garantiza por sí solo un MP4 renovado cuando falta ese video mudo.

**Estado:** dependencia confirmada por lectura del código y existencia de la copia musical local. No es una avería observada de los cinco MP4 actuales. **Solución futura:** gestionar un catálogo musical con permisos de uso, manifiestos de origen y ubicación configurable, y declarar explícitamente si el resultado incluye solo audio o también video actualizado. No se mueve música ni se cambia el render en esta tarea.

## ATLAS-003 — ZIP de primera entrega anterior al cambio de audio

**Evidencia:** `entrega/Atlas-Repaso-Sociales.zip` tiene fecha anterior a los MP4 vigentes. Los cinco MP4 de `public/media/` coinciden por SHA-256 con sus copias de `dist/media/`, pero el ZIP no debe asumirse actualizado.

**Estado:** desfase de empaquetado identificado. El usuario pidió detener la publicación y preparar Graphify; no se reemplaza el ZIP ni se realiza otro despliegue. **Acción para una futura entrega:** empaquetar desde una versión fijada y comparar hashes de cada medio con el artefacto publicado o descargable.

## ATLAS-004 — Grafo cinematográfico y repositorio educativo en ámbitos distintos

**Evidencia:** Graphify ya estaba en `.venv/` y `graphify-out/` de CINEMA; Atlas es ahora un repositorio Git independiente en `projects/sociales-explorador/`.

**Solución:** instalar Graphify 0.9.95 en el entorno local de Atlas, añadir su grafo y comandos, e ignorar entornos/cachés en Git y Vercel. Se conserva el grafo de Cinema. **Verificación:** instalación local, actualización, finalización, integridad JSON y consulta del grafo educativo aprobadas. Se confirmó la relación `speech() → generate_beat_tts()`; ver bitácora. **Estado:** resuelta y probada con el código vigente del proyecto, sin generar medios.
