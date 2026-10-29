# Graphify local en Atlas

Graphify 0.9.95 se instala en el `.venv/` de este repositorio. El grafo educativo se guarda en `graphify-out/`; el grafo de Cinema de la carpeta superior se mantiene aparte. No se actualizan habilidades globales automáticamente.

## Preparar otro equipo Windows

Desde la raíz del repositorio, con Python 3.12 disponible:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-graph.txt
```

Para reproducir también las versiones transitivas verificadas en esta instalación, usar `requirements-graph.lock.txt` en lugar de `requirements-graph.txt`.

Este entorno instala Graphify. Para generar medios en un equipo nuevo, instalar además `requirements-media.txt`, disponer de FFmpeg y recuperar los recursos musicales/visuales necesarios. No ejecutar producción de voz para comprobar una consulta de grafo.

## Actualizar y consultar

```powershell
npm run graph:update
npm run graph:query -- "¿Cómo se genera la narración y se mezcla la música?"
npm run graph:explain -- "generate_beat_tts()"
```

El wrapper fija el directorio del proyecto y `GRAPHIFY_NO_AUTO_REFRESH=1`. La actualización ejecuta `graphify update .` y luego el finalizador local, sin una llamada semántica a un LLM.

Equivalentes directos:

```powershell
$env:GRAPHIFY_NO_AUTO_REFRESH='1'
.\.venv\Scripts\graphify.exe update .
.\.venv\Scripts\python.exe scripts/finalize_graph.py
.\.venv\Scripts\graphify.exe query "voz música subtítulos"
.\.venv\Scripts\graphify.exe path "speech()" "generate_beat_tts()"
```

`graphify-out/graph.html` ofrece la vista interactiva. `GRAPH_REPORT.md` describe la estructura; `communities.json` conserva agrupaciones y `cost.json` distingue extracción local sin API de los tokens del agente, cuyo uso no está expuesto.

La extracción actual cubre estructura de código, encabezados y referencias de documentación. No transcribe videos ni demuestra por sí sola que una función, un despliegue o una afirmación educativa sea correcta. Las decisiones y verificaciones reales están en la bitácora.
