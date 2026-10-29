"""Audit the actual five produced MP4s and create a contact sheet."""
import json
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'verification'
OUT.mkdir(exist_ok=True)
lessons=json.loads((ROOT/'content/timed-lessons.json').read_text(encoding='utf-8'))
report=[]
sheet=Image.new('RGB',(1280,5*270),'#10232c')
draw=ImageDraw.Draw(sheet)
for row,lesson in enumerate(lessons):
    media=ROOT/'public/media'/f'{lesson["id"]}.mp4'
    raw=subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(media)])
    probe=json.loads(raw)
    video=next(s for s in probe['streams'] if s['codec_type']=='video')
    audio=next(s for s in probe['streams'] if s['codec_type']=='audio')
    length=float(probe['format']['duration'])
    assert abs(length-lesson['duration'])<.12,(media,length,lesson['duration'])
    assert (video['width'],video['height'])==(1280,720)
    assert video['r_frame_rate']=='24/1'
    decoded=subprocess.run(['ffmpeg','-hide_banner','-v','error','-i',str(media),'-f','null','-'],capture_output=True,text=True)
    assert decoded.returncode==0 and not decoded.stderr,decoded.stderr
    volume=subprocess.run(['ffmpeg','-hide_banner','-i',str(media),'-vn','-af','volumedetect','-f','null','-'],capture_output=True,text=True).stderr
    assert 'mean_volume: -inf' not in volume
    for col,beat_i in enumerate([0,2,4]):
        sample=OUT/f'{lesson["id"]}-{beat_i}.jpg'
        timestamp=lesson['beats'][beat_i]['start']+8
        subprocess.run(['ffmpeg','-hide_banner','-v','error','-y','-ss',str(timestamp),'-i',str(media),'-frames:v','1',str(sample)],check=True)
        frame=Image.open(sample).resize((416,234))
        sheet.paste(frame,(col*428,row*270+35))
    draw.text((8,row*270+8),f'{lesson["number"]} {lesson["id"]} | {length:.2f} s | H.264 / AAC | 1280x720 24 fps',fill='#d9ff70')
    # Additional samples retain access to all six actual scenes for inspection.
    for beat_i in [1,3,5]:
        sample=OUT/f'{lesson["id"]}-{beat_i}.jpg'
        timestamp=lesson['beats'][beat_i]['start']+8
        subprocess.run(['ffmpeg','-hide_banner','-v','error','-y','-ss',str(timestamp),'-i',str(media),'-frames:v','1',str(sample)],check=True)
    report.append({'id':lesson['id'],'seconds':length,'video':video['codec_name'],'audio':audio['codec_name'],'decode':'passed','size_bytes':media.stat().st_size,'frames':video.get('nb_frames')})
sheet.save(OUT/'contact-sheet.jpg',quality=93)
(OUT/'media-audit.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'clips':len(report),'seconds':sum(x['seconds'] for x in report),'paid_generation_usd':0,'decode':'all passed'},indent=2))
