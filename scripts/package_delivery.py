"""Package the real portable delivery without node_modules or build caches."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import shutil

root=Path(__file__).resolve().parents[1]
output=root/'entrega'
output.mkdir(exist_ok=True)
target=output/'Atlas-Repaso-Sociales.zip'
with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=6) as archive:
    for path in sorted((root/'dist').rglob('*')):
        if path.is_file():
            archive.write(path,path.relative_to(root/'dist'))
    archive.writestr('LEEME.txt','ATLAS - REPASO DE SOCIALES\n\nAbre index.html en un navegador moderno. Conserva las carpetas media y sources al lado.\nLos cinco videos incluyen narracion; las pausas, preguntas y actividades funcionan desde el HTML.\nTodo el repaso funciona sin conexion. No se solicitan cuentas ni microfono.\nLos subtitulos por frases tienen tiempos aproximados.\n')
shutil.copy2(root/'verification/contact-sheet.jpg',output/'Vista-de-los-clips.jpg')
print(f'{target} ({target.stat().st_size/1024/1024:.1f} MB)')
