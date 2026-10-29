"""Prepare actual source assets and TTS. No OCR, paid API, or simulated media."""
import asyncio
import hashlib
import json
import shutil
import subprocess
import urllib.request
from pathlib import Path

import edge_tts
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
VOICE = 'es-DO-EmilioNeural'
SOURCES = [
    Path('C:/Users/ingan/Desktop/WhatsApp Image 2026-10-28 at 7.38.02 PM.jpeg'),
    Path('C:/Users/ingan/Desktop/imgwww2 PM.jpeg'),
    Path('C:/Users/ingan/Downloads/f9da8577-422d-454e-84ac-6d96919752f4.JPG'),
    Path('C:/Users/ingan/Downloads/f32eac69-04a8-4303-9433-6984b064400e.JPG'),
    Path('C:/Users/ingan/Downloads/c7388468-62f1-44a2-9617-8eb8da1935ea.JPG'),
]


def run(*args):
    return subprocess.check_output(args, text=True, encoding='utf-8', errors='replace').strip()


def duration(path):
    return float(run('ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(path)))


def geography():
    target = PUBLIC / 'maps.json'
    if target.exists():
        return
    records = []
    for iso, level in [('DOM', 'ADM1'), ('HTI', 'ADM0')]:
        api = f'https://www.geoboundaries.org/api/current/gbOpen/{iso}/{level}/'
        meta = json.load(urllib.request.urlopen(api, timeout=60))
        geo = json.load(urllib.request.urlopen(meta['simplifiedGeometryGeoJSON'], timeout=60))
        records.append({'iso': iso, 'meta': meta, 'features': geo['features']})
    target.write_text(json.dumps(records, ensure_ascii=False), encoding='utf-8')


def source_assets():
    manifest = []
    dest = PUBLIC / 'sources'
    dest.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(SOURCES, 1):
        original = dest / f'hoja-{i}.jpg'
        if not original.exists():
            shutil.copy2(src, original)
        manifest.append({'image': i, 'file': original.name, 'sha256': hashlib.sha256(original.read_bytes()).hexdigest()})
        thumb = Image.open(src)
        thumb.thumbnail((360, 480))
        thumb.save(dest / f'hoja-{i}-thumb.jpg', quality=86)
    # Documentary crop only: preserve unmodified original alongside it.
    sign = Image.open(SOURCES[4])
    w, h = sign.size
    sign.crop((int(w*.515), int(h*.60), w, int(h*.955))).save(dest / 'letrero.jpg', quality=95)
    (dest / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')


async def speech():
    lessons = json.loads((ROOT / 'content/lessons.json').read_text(encoding='utf-8'))
    media = PUBLIC / 'media'
    cache = ROOT / '.render/audio'
    cache.mkdir(parents=True, exist_ok=True)
    media.mkdir(parents=True, exist_ok=True)
    for lesson in lessons:
        cursor = 0
        concat = []
        captions = ['WEBVTT', '']
        for i, beat in enumerate(lesson['beats']):
            key = hashlib.sha256((VOICE + '|-8%|' + beat['narration']).encode()).hexdigest()[:14]
            mp3 = cache / f'{key}.mp3'
            if not mp3.exists():
                for attempt in range(3):
                    try:
                        await edge_tts.Communicate(beat['narration'], VOICE, rate='-8%').save(str(mp3))
                        break
                    except Exception:
                        if attempt == 2:
                            raise
                        await asyncio.sleep(2 + attempt)
            voice_duration = duration(mp3)
            # Frame-aligned beat durations allow audio, video and checkpoints to agree.
            seconds = __import__('math').ceil((voice_duration + 1.5) * 24) / 24
            beat.update(start=round(cursor, 6), duration=seconds, end=round(cursor + seconds, 6))
            wav = cache / f'{lesson["id"]}-{i}.wav'
            subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-i',str(mp3),
                            '-af','adelay=650:all=1,apad','-t',str(seconds),'-ar','48000','-ac','1',str(wav)], check=True)
            concat.append(f"file '{wav.as_posix()}'")
            # Sentence-level captions; distribute by reading length inside actual speech interval.
            import re
            sentences = re.split(r'(?<=[.!?])\s+', beat['narration'])
            total = sum(len(x) for x in sentences)
            local = cursor + .65
            for sentence in sentences:
                end = local + voice_duration * len(sentence) / total
                captions.extend([f'{stamp(local)} --> {stamp(end)}', sentence, ''])
                local = end
            cursor += seconds
            print(f'{lesson["id"]} {i+1}/6: {seconds:.2f}s', flush=True)
        listing = cache / f'{lesson["id"]}.txt'
        listing.write_text('\n'.join(concat), encoding='utf-8')
        subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-y','-f','concat','-safe','0','-i',str(listing),
                        '-c:a','libmp3lame','-b:a','128k',str(media / f'{lesson["id"]}.mp3')], check=True)
        lesson['duration'] = round(cursor, 6)
        lesson['checkpointAt'] = lesson['beats'][2]['end']
        (media / f'{lesson["id"]}.vtt').write_text('\n'.join(captions), encoding='utf-8')
    (PUBLIC / 'lessons.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'content/timed-lessons.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2), encoding='utf-8')
    shutil.copy2(PUBLIC / 'maps.json', ROOT / 'content/geography.json')
    (PUBLIC / 'production.json').write_text(json.dumps({
        'voice': VOICE, 'tts': 'edge-tts', 'rate': '-8%', 'paid_generation_usd': 0,
        'ocr': False, 'audio': 'Actual generated speech, not simulated',
        'caption_timing': 'Sentence timing estimated proportionally inside each measured audio segment',
        'source': 'Five user-provided worksheet photographs; manually reviewed',
        'video_engine': 'Motion Canvas 3.17.2',
    }, ensure_ascii=False, indent=2), encoding='utf-8')


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms//3600000:02}:{ms//60000%60:02}:{ms//1000%60:02}.{ms%1000:03}'


if __name__ == '__main__':
    source_assets()
    geography()
    asyncio.run(speech())
