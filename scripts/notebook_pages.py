"""Keep Sociales as a notebook and derive the English Science shell."""
from pathlib import Path
import re
import shutil
ROOT=Path(__file__).resolve().parents[1]
social=ROOT/'sociales.html'
if not social.exists():shutil.copy2(ROOT/'index.html',social)
source=social.read_text(encoding='utf-8-sig')
source=source.replace('href="#" class="brand"','href="./index.html" class="brand"')
source=source.replace('<a class="nav-link notebook-back" href="./index.html">','<a class="nav-link notebook-back" href="./index.html" style="display:flex;align-items:center;text-decoration:none">')
source=source.replace('<nav aria-label="Principal">','<nav aria-label="Principal"><a class="nav-link notebook-back" href="./index.html">← Cuadernos</a>') if 'notebook-back' not in source else source
social.write_text(source,encoding='utf-8')
science=source.replace('lang="es"','lang="en"').replace('/src/app.ts','/src/science.ts')
translations={
 'Atlas · Laboratorio de Sociales':'Atlas · Science notebook',
 'Cinco capítulos animados para observar, conectar y explicar: un repaso interactivo de Sociales.':'Life cycles, offspring and animal care: an interactive Science review in English.',
 'Atlas, inicio':'Atlas, notebook library','LABORATORIO DE SOCIALES':'SCIENCE NOTEBOOK','Principal':'Main navigation','← Cuadernos':'← Notebooks',
 'Explorar':'Explore','Misión final':'Final mission','Tus hojas':'Your worksheets','A tu ritmo':'At your pace','TU EXPEDICIÓN':'YOUR EXPEDITION','5 capítulos':'5 chapters',
 'Elegir capítulo':'Choose a chapter','Ideas conquistadas':'Ideas connected','Equivocarse también da pistas.':'Mistakes can reveal a useful clue.','Repasar lo que cuesta':'Review tricky questions',
 'OBSERVA':'OBSERVE','CONECTA':'CONNECT','EXPLICA.':'EXPLAIN.','CAPÍTULO 01 · ORIENTACIÓN':'CHAPTER 01 · SCIENCE',
 'Encuentra tu rumbo':'What makes something alive?','Puntos cardinales y brújula':'Living things, growth and life cycles',
 'Pantalla completa':'Full screen','Video educativo del capítulo':'Educational chapter video','Comenzar explicación':'Start the explanation','Vamos a descubrirlo':'Let’s investigate',
 'EXPLICACIÓN ANIMADA':'ANIMATED EXPLANATION','El clip no pudo cargarse. Comprueba que la carpeta media esté junto al HTML.':'The video could not load. Check that the Science media folder is available.',
 'Volver a cargar':'Reload video','Posición del video':'Video position','Reproducir':'Play','Retroceder 10 segundos':'Go back 10 seconds','Silenciar':'Mute','Volumen':'Volume','Velocidad de reproducción':'Playback speed','Mostrar subtítulos':'Show captions','Ocultar subtítulos':'Hide captions','Repetir explicación actual':'Replay this scene',
 'Escenas del capítulo':'Chapter scenes','Actividades del capítulo':'Chapter activities','Las ideas clave':'Key ideas','Ponte a prueba':'Test your thinking','Explora y conecta':'Investigation lab',
 'Quédate con esto.':'Keep these ideas.','UNA IDEA CONECTA CON OTRA':'ONE IDEA CONNECTS TO ANOTHER','¿Puedes explicárselo a alguien con tus palabras?':'Can you explain one idea in your own words?',
 'Acepto el reto':'Take the challenge','Piensa. Elige. Comprueba.':'Think. Choose. Explain.','Volver a intentar':'Try again','Siguiente capítulo':'Next chapter',
 'ALTO, DETECTIVE':'PAUSE AND THINK','Antes de seguir…':'Before you move on…','La explicación espera. Tómate el tiempo que necesites.':'The explanation can wait. Take the time you need.','Continuar explorando':'Continue exploring',
 'EL PUNTO DE PARTIDA':'THE STARTING EVIDENCE','Tus cinco hojas':'Your seven worksheets','Cerrar hojas':'Close worksheets',
 'Conservamos las imágenes originales. El repaso se organiza por temas y cubre los ejercicios 1 al 10.':'Seven worksheet photos connect to five investigations. The display copy of page 4 omits the handwritten name header.',
 'CONECTA LOS CINCO CAPÍTULOS':'CONNECT ALL FIVE CHAPTERS','La misión final':'The final mission','Cerrar misión':'Close final mission',
 'Recupera una idea de cada capítulo. Puedes volver a investigar cuando lo necesites.':'Use one idea from each chapter. You can return to the evidence whenever you need to.'
}
for old,new in translations.items():science=science.replace(old,new)
science=science.replace('UNA IDEA CONNECT CON OTRA','ONE IDEA CONNECTS TO ANOTHER').replace('CONNECT LOS CINCO CAPÍTULOS','CONNECT ALL FIVE CHAPTERS')
science=re.sub(r'<div class="source-note">.*?</details>', '''<div class="source-note"><strong>Check the evidence</strong><p>A tadpole belongs to the frog life cycle, even though “Tiger” is circled on one worksheet. The full butterfly cycle has four stages; the drawing task asks you to choose two.</p></div><details><summary>Source notes and family controls</summary><p>Based on the seven supplied Science worksheets, reviewed visually without OCR. Andrew reads the explanations in native English at a normal rate. Sentence captions use measured timing when available, with an estimated fallback.</p><p><a href="https://www.floridamuseum.ufl.edu/educators/resource/butterfly-life-cycle/" target="_blank" rel="noopener">Florida Museum: butterfly life cycle</a> · <a href="https://australian.museum/learn/teachers/learning/frog-life-cycle/" target="_blank" rel="noopener">Australian Museum: frog life cycle</a></p><p>Progress and written or drawn answers stay in this browser. There is no automatic grading of drawings or free writing.</p><button class="text-button" id="reset-progress">Restart Science progress ↻</button></details>''',science,flags=re.S)
(ROOT/'science.html').write_text(science,encoding='utf-8')
