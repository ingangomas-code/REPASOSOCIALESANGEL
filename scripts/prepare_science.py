"""Produce English Science narration and preserve all seven worksheet sources."""
import asyncio
import hashlib
import json
import math
from pathlib import Path
import re
import shutil
import subprocess
import edge_tts
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/science'
CACHE=ROOT/'.render/science/audio'
VOICE='en-US-AndrewMultilingualNeural'
RATE='+0%'
FILES=['IMG_7630.JPG','IMG_7628.JPG','IMG_7627.JPG','IMG_7624.JPG','IMG_7626.JPG','IMG_7629.JPG','IMG_7625.JPG']

def duration(path):
    return float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(path)]))

def ffmpeg(*args):
    subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y',*map(str,args)],check=True)

def stamp(t):
    n=round(t*1000)
    return f'{n//3600000:02}:{n//60000%60:02}:{n//1000%60:02}.{n%1000:03}'

def sources():
    dest=OUT/'sources';dest.mkdir(parents=True,exist_ok=True)
    originals=ROOT/'.render/science/originals';originals.mkdir(parents=True,exist_ok=True)
    manifest=[]
    for i,name in enumerate(FILES,1):
        src=Path('C:/Users/ingan/Downloads')/name
        original=originals/f'original-{i}.jpg'
        if not original.exists():shutil.copy2(src,original)
        image=ImageOps.exif_transpose(Image.open(original))
        # Browser copy of page 4 omits the child's handwritten identity header.
        # The exact original remains local and is excluded from deployment.
        if i==4:image=image.crop((0,int(image.height*.27),image.width,image.height))
        image.save(dest/f'hoja-{i}.jpg',quality=94)
        image.thumbnail((360,480));image.save(dest/f'hoja-{i}-thumb.jpg',quality=86)
        manifest.append({'image':i,'original_filename':name,'sha256':hashlib.sha256(original.read_bytes()).hexdigest(),'display_file':f'hoja-{i}.jpg','identity_header_removed':i==4})
    (dest/'manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')

async def ensure_voice(lesson_id,index,beat,gate):
    key=hashlib.sha256((VOICE+'|'+RATE+'|'+beat['narration']).encode()).hexdigest()[:18]
    mp3=CACHE/f'{key}.mp3';meta=CACHE/f'{key}.json'
    if mp3.exists() and mp3.stat().st_size>1000 and meta.exists():return
    async with gate:
        for attempt in range(5):
            try:
                sentences=[]
                with mp3.open('wb') as stream:
                    async for chunk in edge_tts.Communicate(beat['narration'],VOICE,rate=RATE,connect_timeout=15,receive_timeout=30).stream():
                        if chunk['type']=='audio':stream.write(chunk['data'])
                        elif chunk['type']=='SentenceBoundary':sentences.append({'offset':chunk['offset']/10000000,'duration':chunk['duration']/10000000,'text':chunk['text']})
                meta.write_text(json.dumps(sentences),encoding='utf-8')
                print(f'Voice ready: {lesson_id} scene {index+1}',flush=True)
                return
            except Exception:
                if attempt==4:raise
                print(f'TTS retry {attempt+1}: {lesson_id} scene {index+1}',flush=True)
                await asyncio.sleep(min(15,3*(attempt+1)))

async def main():
    sources();CACHE.mkdir(parents=True,exist_ok=True);media=OUT/'media';media.mkdir(exist_ok=True)
    lessons=json.loads((ROOT/'content/science/lessons.json').read_text(encoding='utf-8'))
    music=ROOT/'.render/audio/bg_music.ogg'
    if not music.exists():raise FileNotFoundError('Existing approved music is missing')
    gate=asyncio.Semaphore(3)
    await asyncio.gather(*(ensure_voice(l['id'],i,b,gate) for l in lessons for i,b in enumerate(l['beats'])))
    for lesson in lessons:
        cursor=0;segments=[];vtt=['WEBVTT','']
        for i,beat in enumerate(lesson['beats']):
            key=hashlib.sha256((VOICE+'|'+RATE+'|'+beat['narration']).encode()).hexdigest()[:18]
            mp3=CACHE/f'{key}.mp3';meta=CACHE/f'{key}.json'
            if not mp3.exists() or not meta.exists():
                for attempt in range(5):
                    try:
                        sentences=[]
                        with mp3.open('wb') as stream:
                            async for chunk in edge_tts.Communicate(beat['narration'],VOICE,rate=RATE).stream():
                                if chunk['type']=='audio':stream.write(chunk['data'])
                                elif chunk['type']=='SentenceBoundary':sentences.append({'offset':chunk['offset']/10000000,'duration':chunk['duration']/10000000,'text':chunk['text']})
                        meta.write_text(json.dumps(sentences),encoding='utf-8');break
                    except Exception:
                        if attempt==4:raise
                        print(f'TTS retry {attempt+1}: {lesson["id"]} scene {i+1}',flush=True)
                        await asyncio.sleep(min(15,3*(attempt+1)))
            voice_duration=duration(mp3)
            seconds=math.ceil((voice_duration+1.05)*24)/24
            sentences=json.loads(meta.read_text(encoding='utf-8'))
            measured=bool(sentences)
            if not sentences:
                parts=re.split(r'(?<=[.!?])\s+',beat['narration']);total=sum(map(len,parts));at=0
                for part in parts:
                    length=voice_duration*len(part)/total;sentences.append({'offset':at,'duration':length,'text':part});at+=length
            beat.update(start=round(cursor,6),end=round(cursor+seconds,6),duration=seconds,voiceDuration=voice_duration,sentences=sentences,captionTiming='measured' if measured else 'estimated')
            for sentence in sentences:vtt.extend([f'{stamp(cursor+.45+sentence["offset"])} --> {stamp(min(cursor+seconds-.1,cursor+.45+sentence["offset"]+sentence["duration"]))}',sentence['text'],''])
            wav=CACHE/f'{lesson["id"]}-{i}.wav'
            ffmpeg('-i',mp3,'-af','adelay=450:all=1,apad','-t',seconds,'-ar',48000,'-ac',2,wav)
            segments.append(wav);cursor+=seconds
            print(f'{lesson["id"]}: scene {i+1}/{len(lesson["beats"])} {seconds:.2f}s',flush=True)
        listing=CACHE/f'{lesson["id"]}.txt';listing.write_text('\n'.join(f"file '{p.as_posix()}'" for p in segments),encoding='utf-8')
        voice=CACHE/f'{lesson["id"]}-voice.wav';ffmpeg('-f','concat','-safe',0,'-i',listing,'-c:a','pcm_s16le',voice)
        ffmpeg('-i',voice,'-stream_loop',-1,'-i',music,'-filter_complex',f'[1:a]volume=0.10,afade=t=out:st={max(0,cursor-3)}:d=3[m];[0:a][m]amix=inputs=2:duration=first:normalize=0[out]','-map','[out]','-t',cursor,'-ar',48000,'-c:a','libmp3lame','-b:a','160k',media/f'{lesson["id"]}.mp3')
        lesson.update(duration=round(cursor,6),checkpointAt=lesson['beats'][1]['end'])
        (media/f'{lesson["id"]}.vtt').write_text('\n'.join(vtt),encoding='utf-8')
    for path in [ROOT/'content/science/timed-lessons.json',OUT/'lessons.json']:
        path.write_text(json.dumps(lessons,ensure_ascii=False,indent=2),encoding='utf-8')
    (OUT/'production.json').write_text(json.dumps({'voice':VOICE,'rate':RATE,'language':'en-US','tts':'edge-tts','music':'existing bg_music.ogg, gain 0.10, fade 3 seconds','paid_generation_usd':0,'source_photographs':7,'chapters':len(lessons),'ocr':False,'audio_lead_in_seconds':.45,'semantic_review':'Reviewed against supplied worksheets; marked answers not treated as answer key'},indent=2),encoding='utf-8')

if __name__=='__main__':asyncio.run(main())
