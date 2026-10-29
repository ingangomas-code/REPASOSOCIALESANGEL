"""Label Atlas communities locally and preserve explicit graph accounting."""
from collections import Counter, defaultdict
import json
import os
from pathlib import Path
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'graphify-out'


def community_label(graph, ids):
    categories = [
        ('src/scenes', 'Animaciones educativas Motion Canvas'),
        ('src/render', 'Render y exportación de clips'),
        ('src/app', 'Reproductor y actividades interactivas'),
        ('src/state', 'Progreso, subtítulos y estado de aprendizaje'),
        ('src/maps', 'Cartografía y provincias'),
        ('scripts/prepare', 'Narración, música y sincronización'),
        ('scripts/verify', 'Verificación de medios reales'),
        ('scripts/package', 'Entrega portable'),
        ('scripts/portable', 'Entrega portable'),
        ('scripts/finalize_graph', 'Graphify local y trazabilidad'),
        ('scripts/graphify', 'Graphify local y trazabilidad'),
        ('tests/', 'Pruebas de aprendizaje y reproducción'),
        ('docs/', 'Decisiones y evolución del producto'),
        ('content/', 'Contenido educativo y trazabilidad'),
    ]
    counts = Counter()
    for node in ids:
        source = str(graph.nodes[node].get('source_file', '')).replace('\\', '/')
        for prefix, label in categories:
            if prefix in source:
                counts[label] += 1
                break
    return counts.most_common(1)[0][0] if counts else 'Integración y dependencias de Atlas'


def main():
    from networkx.readwrite import json_graph
    from graphify.cluster import score_all
    from graphify.analyze import god_nodes, surprising_connections, suggest_questions
    from graphify.detect import detect
    from graphify.report import generate

    raw = json.loads((OUT / 'graph.json').read_text(encoding='utf-8'))
    graph = json_graph.node_link_graph(raw, edges='links')
    communities = defaultdict(list)
    for node in raw['nodes']:
        communities[int(node.get('community', -1))].append(node['id'])
    labels = {cid: community_label(graph, ids) for cid, ids in communities.items()}
    for node in raw['nodes']:
        node['community_name'] = labels[int(node.get('community', -1))]
    raw.setdefault('graph', {}).update(
        project='Atlas · repasos educativos interactivos',
        extraction='deterministic_code_and_document_structure',
        semantic_extraction='not_performed',
        agent_token_usage='unavailable_not_zero',
    )
    (OUT / 'graph.json').write_text(json.dumps(raw, ensure_ascii=False, indent=2), encoding='utf-8')
    scores = score_all(graph, communities)
    report = generate(graph, communities, scores, labels, god_nodes(graph),
                      surprising_connections(graph, communities), detect(ROOT),
                      {'input': 0, 'output': 0}, str(ROOT),
                      suggested_questions=suggest_questions(graph, communities, labels))
    report = report.replace('- Token cost: 0 input · 0 output',
                            '- Graph extraction API tokens: 0 (deterministic); agent tokens: unavailable, not zero')
    report += ('\n\n## Alcance y contabilidad\n\n'
               'Grafo independiente de Atlas. Se extrajeron estructura de código, encabezados y referencias '
               'localmente; no se ejecutó extracción semántica con un LLM ni una transcripción de los MP4. '
               'Las consultas son recuperación de subgrafos, no pruebas de funcionamiento. '
               'El consumo de tokens del agente no está expuesto y no se declara cero. '
               'Esta actualización no generó voces, videos ni un despliegue.\n')
    (OUT / 'GRAPH_REPORT.md').write_text(report, encoding='utf-8')
    (OUT / '.graphify_labels.json').write_text(json.dumps({str(k): v for k, v in labels.items()}, ensure_ascii=False), encoding='utf-8')
    (OUT / 'communities.json').write_text(json.dumps({str(cid): {'label': labels[cid], 'cohesion': scores[cid],
        'nodes': [graph.nodes[n].get('label', n) for n in ids]} for cid, ids in communities.items()}, ensure_ascii=False, indent=2), encoding='utf-8')
    (OUT / 'cost.json').write_text(json.dumps({'mode': 'deterministic', 'semantic_llm_api_calls': 0,
        'semantic_llm_api_tokens': 0, 'agent_tokens': None, 'agent_tokens_status': 'not_exposed_not_zero',
        'media_generated_this_update': False, 'paid_media_generation_usd_this_update': 0}, indent=2), encoding='utf-8')
    (OUT / '.graphify_python').write_text(sys.executable, encoding='utf-8')
    (OUT / '.graphify_root').write_text(str(ROOT), encoding='utf-8')
    executable = ROOT / ('.venv/Scripts/graphify.exe' if os.name == 'nt' else '.venv/bin/graphify')
    subprocess.run([str(executable), 'export', 'html'], cwd=ROOT,
                   env={**os.environ, 'GRAPHIFY_NO_AUTO_REFRESH': '1'}, check=True)
    print(f'Atlas graph: {len(raw["nodes"])} nodes, {len(raw["links"])} relationships, {len(communities)} communities')


if __name__ == '__main__':
    main()
