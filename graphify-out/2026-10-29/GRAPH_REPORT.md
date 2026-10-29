# Graph Report - sociales-explorador  (2026-10-29)

## Corpus Check
- Corpus is ~42,668 words - fits in a single context window. You may not need a graph.

## Summary
- 293 nodes · 579 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.95)
- Graph extraction API tokens: 0 (deterministic); agent tokens: unavailable, not zero

## Community Hubs (Navigation)
- Render y exportación de clips
- Integración y dependencias de Atlas
- Animaciones educativas Motion Canvas
- Progreso, subtítulos y estado de aprendizaje
- Reproductor y actividades interactivas
- Narración, música y sincronización
- Integración y dependencias de Atlas
- Pruebas de aprendizaje y reproducción
- Graphify local y trazabilidad
- Integración y dependencias de Atlas
- Progreso, subtítulos y estado de aprendizaje
- Integración y dependencias de Atlas
- Integración y dependencias de Atlas
- Integración y dependencias de Atlas
- Decisiones y evolución del producto
- Integración y dependencias de Atlas

## God Nodes (most connected - your core abstractions)
1. `main()` - 12 edges
2. `load()` - 12 edges
3. `renderScienceLab()` - 11 edges
4. `compilerOptions` - 11 edges
5. `loadChapter()` - 10 edges
6. `speech()` - 10 edges
7. `diagram()` - 10 edges
8. `text()` - 10 edges
9. `updateTime()` - 9 edges
10. `scripts` - 9 edges

## Surprising Connections (you probably didn't know these)
- `currentCaption()` --references--> `2026-10-29 — Base vigente y Graphify independiente`  [INFERRED]
  src/state.mjs → docs/BITACORA.md
- `drawLab()` --calls--> `geometryPath()`  [EXTRACTED]
  src/app.ts → src/maps.ts
- `drawLab()` --calls--> `mapSvg()`  [EXTRACTED]
  src/app.ts → src/maps.ts
- `drawQuiz()` --calls--> `recordAnswer()`  [EXTRACTED]
  src/app.ts → src/state.mjs
- `loadChapter()` --calls--> `formatTime()`  [EXTRACTED]
  src/app.ts → src/state.mjs

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

### Community 2 - "Animaciones educativas Motion Canvas"
Cohesion: 0.17
Nodes (25): StudyState, Beat, Feature, Geography, Lesson, Question, SentenceTiming, geometryPath() (+17 more)

### Community 8 - "Progreso, subtítulos y estado de aprendizaje"
Cohesion: 0.13
Nodes (31): ScienceLesson, caption(), current(), finalMission(), finalResult(), load(), play(), progress() (+23 more)

### Community 0 - "Reproductor y actividades interactivas"
Cohesion: 0.15
Nodes (24): drawLab(), drawQuiz(), drawSidebar(), finalResult(), lesson(), loadChapter(), openFinal(), persist() (+16 more)

### Community 1 - "Narración, música y sincronización"
Cohesion: 0.11
Nodes (15): community_label(), main(), duration(), generate_beat_tts(), geography(), run(), duration(), ensure_voice() (+7 more)

### Community 11 - "Integración y dependencias de Atlas"
Cohesion: 0.21
Nodes (21): scienceIcon(), box(), choices(), drawing(), element(), order(), remember(), renderScienceLab() (+13 more)

### Community 13 - "Pruebas de aprendizaje y reproducción"
Cohesion: 0.13
Nodes (13): drawDrafts(), openDraft(), showFiles(), readDrafts(), removeDraft(), validateDraft(), writeDraft(), dialog (+5 more)

### Community 4 - "Graphify local y trazabilidad"
Cohesion: 0.13
Nodes (7): [command='update',...args], env, executable, python, root, dir, science

### Community 10 - "Integración y dependencias de Atlas"
Cohesion: 0.40
Nodes (4): Atlas · instrucciones del proyecto, Estado del producto y decisiones, Graphify local, Próximas materias y automatización

### Community 3 - "Integración y dependencias de Atlas"
Cohesion: 0.09
Nodes (25): dependencies, @motion-canvas/2d@3.17.2, @motion-canvas/core@3.17.2, devDependencies, @types/node@^22.0.0, typescript@^5.7.0, vite@^7.3.1, name (+17 more)

### Community 5 - "Integración y dependencias de Atlas"
Cohesion: 0.15
Nodes (12): compilerOptions, esModuleInterop, lib, module, moduleResolution, noEmit, resolveJsonModule, skipLibCheck (+4 more)

### Community 6 - "Decisiones y evolución del producto"
Cohesion: 0.07
Nodes (25): Atlas: base actual y ruta de ampliación, Cambios vigentes que debemos conservar, Componentes que ya existen, Orden de evolución recomendado, Propósito y criterio educativo, Próximo hito: otra materia, Visión posterior: de fotos a repaso desde la web, 2026-10-29 — Base vigente y Graphify independiente (+17 more)

### Community 9 - "Integración y dependencias de Atlas"
Cohesion: 0.50
Nodes (3): Answer, Q: ¿Cuál es la base de audio vigente de Atlas tras Antigravity?, Source Nodes

## Knowledge Gaps
- **2 isolated node(s):** `STORAGE_KEY`, `DRAFT_DB`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 115 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `currentCaption()` connect `Progreso, subtítulos y estado de aprendizaje` to `Reproductor y actividades interactivas`, `Decisiones y evolución del producto`?**
  _High betweenness centrality (0.139) - this node is a cross-community bridge._
- **What connects `STORAGE_KEY`, `DRAFT_DB` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Progreso, subtítulos y estado de aprendizaje` be split into smaller, more focused modules?**
  _Cohesion score 0.13109243697478992 - nodes in this community are weakly interconnected._
- **Why does `2026-10-29 — Base vigente y Graphify independiente` connect `Decisiones y evolución del producto` to `Progreso, subtítulos y estado de aprendizaje`?**
  _High betweenness centrality (0.131) - this node is a cross-community bridge._
- **Should `Reproductor y actividades interactivas` be split into smaller, more focused modules?**
  _Cohesion score 0.14814814814814814 - nodes in this community are weakly interconnected._
- **Should `Narración, música y sincronización` be split into smaller, more focused modules?**
  _Cohesion score 0.10707070707070707 - nodes in this community are weakly interconnected._
- **Should `Pruebas de aprendizaje y reproducción` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._

## Alcance y contabilidad

Grafo independiente de Atlas. Se extrajeron estructura de código, encabezados y referencias localmente; no se ejecutó extracción semántica con un LLM ni una transcripción de los MP4. Las consultas son recuperación de subgrafos, no pruebas de funcionamiento. El consumo de tokens del agente no está expuesto y no se declara cero. Esta actualización no generó voces, videos ni un despliegue.
