---
type: "query"
date: "2026-10-29T17:09:32.782953+00:00"
question: "¿Cuál es la base de audio vigente de Atlas tras Antigravity?"
contributor: "graphify"
source_nodes: ["speech()", "generate_beat_tts()"]
---

# Q: ¿Cuál es la base de audio vigente de Atlas tras Antigravity?

## Answer

La base vigente documentada en docs/BITACORA.md y scripts/prepare.py es es-ES-AlvaroNeural a +8%, con bg_music.ogg en bucle, ganancia 0.18 y fade final de 4 segundos. speech() llama a generate_beat_tts(). Las ventanas de escenas y checkpoints se conservan. Esta revisión no generó audio ni desplegó.

## Source Nodes

- speech()
- generate_beat_tts()