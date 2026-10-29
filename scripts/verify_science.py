"""Audit final real Science clips and confirm that Sociales assets are unchanged."""
import json
import subprocess
import hashlib
from pathlib import Path
from PIL import Image,ImageDraw
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification/science';OUT.mkdir(parents=True,exist_ok=True)
lessons=json.loads((ROOT/'content/science/timed-lessons.json').read_text(encoding='utf-8'))
rows=[];sheet=Image.new('RGB',(1280,len(lessons)*270),'#102731');painter=ImageDraw.Draw(sheet)
for row,lesson in enumerate(lessons):
    path=ROOT/'public/science/media'/f'{lesson["id"]}.mp4'
    info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]))
    v=next(s for s in info['streams'] if s['codec_type']=='video');a=next(s for s in info['streams'] if s['codec_type']=='audio')
    assert (v['width'],v['height'],v['r_frame_rate'])==(1280,720,'24/1')
    assert abs(float(info['format']['duration'])-lesson['duration'])<.12
    decode=subprocess.run(['ffmpeg','-hide_banner','-v','error','-i',str(path),'-f','null','-'],capture_output=True,text=True)
    assert decode.returncode==0 and not decode.stderr,decode.stderr
    for i,beat in enumerate(lesson['beats']):
        frame=OUT/f'{lesson["id"]}-{i}.jpg'
        subprocess.run(['ffmpeg','-hide_banner','-v','error','-y','-ss',str(beat['start']+6),'-i',str(path),'-frames:v','1',str(frame)],check=True)
        if i in [0,2,4]:sheet.paste(Image.open(frame).resize((416,234)),([0,2,4].index(i)*428,row*270+35))
    painter.text((8,row*270+8),f'{lesson["number"]} {lesson["id"]} | {float(info["format"]["duration"]):.2f}s | H.264 + AAC | en-US',fill='#b7ecbe')
    rows.append({'id':lesson['id'],'seconds':float(info['format']['duration']),'video':v['codec_name'],'audio':a['codec_name'],'decode':'passed','sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
sheet.save(OUT/'contact-sheet.jpg',quality=94)
baseline={}
for name in ['orientacion','hemisferios','isla','provincias','comunidad']:
    relative=f'public/media/{name}.mp4'
    previous=subprocess.check_output(['git','show',f'd9e1c5c:{relative}'],cwd=ROOT)
    equal=hashlib.sha256(previous).digest()==hashlib.sha256((ROOT/relative).read_bytes()).digest()
    assert equal,f'Sociales was changed: {name}'
    baseline[name]='unchanged from Antigravity d9e1c5c'
(OUT/'media-audit.json').write_text(json.dumps({'science':rows,'sociales':baseline,'paid_generation_usd':0},indent=2),encoding='utf-8')
print(json.dumps({'science_clips':len(rows),'seconds':sum(r['seconds'] for r in rows),'decode':'all passed','sociales':'all five original clips unchanged'},indent=2))
