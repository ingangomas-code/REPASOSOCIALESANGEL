"""Prepare actual source assets, TTS (es-ES-AlvaroNeural + SentenceBoundary), background intrigue music mix, and muxed MP4s."""
import asyncio
import hashlib
import json
import math
import re
import shutil
import subprocess
import urllib.request
from pathlib import Path

import edge_tts
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
VOICE = 'es-ES-AlvaroNeural'
RATE = '+8%'
BG_MUSIC_SOURCE = Path('C:/Users/ingan/Desktop/ANTIGRAVITY/DOMI NOTEBOOK/outputs/bg_music.ogg')
BG_MUSIC_LOCAL = ROOT / '.render/audio/bg_music.ogg'

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
    dest = PUBLIC / 'sources'
    if (dest / 'manifest.json').exists() and (dest / 'letrero.jpg').exists():
        return
    manifest = []
    dest.mkdir(parents=True, exist_ok=True)
    for i, src in enumerate(SOURCES, 1):
        original = dest / f'hoja-{i}.jpg'
        if not original.exists() and src.exists():
            shutil.copy2(src, original)
        if original.exists():
            manifest.append({'image': i, 'file': original.name, 'sha256': hashlib.sha256(original.read_bytes()).hexdigest()})
            thumb = Image.open(original)
            thumb.thumbnail((360, 480))
            thumb.save(dest / f'hoja-{i}-thumb.jpg', quality=86)
    if (dest / 'hoja-5.jpg').exists():
        sign = Image.open(dest / 'hoja-5.jpg')
        w, h = sign.size
        sign.crop((int(w * .515), int(h * .60), w, int(h * .955))).save(dest / 'letrero.jpg', quality=95)
    (dest / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')


async def generate_beat_tts(text: str, mp3_path: Path, meta_path: Path):
    if mp3_path.exists() and meta_path.exists():
        return json.loads(meta_path.read_text(encoding='utf-8'))
    for attempt in range(3):
        try:
            comm = edge_tts.Communicate(text, VOICE, rate=RATE)
            sentences = []
            with open(mp3_path, 'wb') as f:
                async for chunk in comm.stream():
                    if chunk['type'] == 'audio':
                        f.write(chunk['data'])
                    elif chunk['type'] == 'SentenceBoundary':
                        sentences.append({
                            'offset': round(chunk['offset'] / 10_000_000, 4),
                            'duration': round(chunk['duration'] / 10_000_000, 4),
                            'text': chunk['text'].strip(),
                        })
            meta_path.write_text(json.dumps(sentences, ensure_ascii=False, indent=2), encoding='utf-8')
            return sentences
        except Exception:
            if attempt == 2:
                raise
            await asyncio.sleep(2 + attempt)


async def speech():
    timed_path = ROOT / 'content/timed-lessons.json'
    base_path = ROOT / 'content/lessons.json'
    lessons = json.loads((timed_path if timed_path.exists() else base_path).read_text(encoding='utf-8'))
    media = PUBLIC / 'media'
    cache = ROOT / '.render/audio'
    cache.mkdir(parents=True, exist_ok=True)
    media.mkdir(parents=True, exist_ok=True)

    if BG_MUSIC_SOURCE.exists():
        shutil.copy2(BG_MUSIC_SOURCE, BG_MUSIC_LOCAL)
    bg_music = BG_MUSIC_LOCAL if BG_MUSIC_LOCAL.exists() else BG_MUSIC_SOURCE
    if not bg_music.exists():
        raise FileNotFoundError(f'No se encontró la música de fondo en {BG_MUSIC_SOURCE}')

    for lesson in lessons:
        cursor = 0.0
        captions = ['WEBVTT', '']
        filter_inputs = []
        filter_delays = []

        for i, beat in enumerate(lesson['beats']):
            key = hashlib.sha256((f'{VOICE}|{RATE}|' + beat['narration']).encode()).hexdigest()[:14]
            mp3 = cache / f'{key}.mp3'
            meta = cache / f'{key}.json'
            sentences = await generate_beat_tts(beat['narration'], mp3, meta)
            voice_duration = duration(mp3)

            # Conservar exactamente la ventana de escena (beat['duration']) ya renderizada en .render/*-silent.mp4
            # para no alterar ni un fotograma de la sincronización visual ni de los checkpoints.
            if 'duration' in beat and beat['duration'] > 10:
                seconds = float(beat['duration'])
            else:
                seconds = math.ceil((voice_duration + 1.5) * 24) / 24

            start_sec = round(cursor, 6)
            end_sec = round(cursor + seconds, 6)

            # Si por alguna razón una frase superara la ventana de la escena, ajustamos atempo suavemente
            max_voice_window = seconds - 0.85
            tempo_ratio = 1.0
            if voice_duration > max_voice_window:
                tempo_ratio = min(1.25, math.ceil((voice_duration / max_voice_window) * 100) / 100)
                effective_voice_duration = voice_duration / tempo_ratio
            else:
                effective_voice_duration = voice_duration

            # Escalar tiempos de SentenceBoundary si se aplicó tempo_ratio
            scaled_sentences = []
            if sentences:
                for s in sentences:
                    s_off = round(s['offset'] / tempo_ratio, 4)
                    s_dur = round(s['duration'] / tempo_ratio, 4)
                    scaled_sentences.append({
                        'offset': s_off,
                        'duration': s_dur,
                        'text': s['text'],
                    })
                    c_start = start_sec + 0.65 + s_off
                    c_end = min(end_sec - 0.1, c_start + s_dur)
                    captions.extend([f'{stamp(c_start)} --> {stamp(c_end)}', s['text'], ''])
            else:
                raw_sentences = re.split(r'(?<=[.!?])\s+', beat['narration'])
                total_chars = sum(len(x) for x in raw_sentences)
                local = 0.0
                for sentence in raw_sentences:
                    s_dur = effective_voice_duration * len(sentence) / total_chars
                    scaled_sentences.append({
                        'offset': round(local, 4),
                        'duration': round(s_dur, 4),
                        'text': sentence,
                    })
                    c_start = start_sec + 0.65 + local
                    c_end = c_start + s_dur
                    captions.extend([f'{stamp(c_start)} --> {stamp(c_end)}', sentence, ''])
                    local += s_dur

            beat.update(
                start=start_sec,
                duration=seconds,
                end=end_sec,
                voiceDuration=round(effective_voice_duration, 3),
                sentences=scaled_sentences,
            )

            delay_ms = int(round((start_sec + 0.65) * 1000))
            filter_inputs.extend(['-i', str(mp3)])
            atempo_filter = f'atempo={tempo_ratio:.2f},' if tempo_ratio > 1.0 else ''
            filter_delays.append(f'[{i}:a]{atempo_filter}adelay={delay_ms}|{delay_ms},volume=1.05[v{i}];')

            cursor += seconds
            print(
                f'{lesson["id"]} escena {i+1}/6: voz={effective_voice_duration:.2f}s / ventana={seconds:.2f}s ({len(scaled_sentences)} frases)',
                flush=True,
            )

        total_duration = round(cursor, 6)
        lesson['duration'] = total_duration
        lesson['checkpointAt'] = lesson['beats'][2]['end']
        (media / f'{lesson["id"]}.vtt').write_text('\n'.join(captions), encoding='utf-8')

        # Mezcla maestra en FFmpeg idéntica a DOMI NOTEBOOK (prepare_audio_master.py):
        # Voces con presencia clara + bg_music.ogg en loop (-stream_loop -1) con volume=0.18 y fade-out de 4s al final.
        num_beats = len(lesson['beats'])
        voices_mix_inputs = ''.join(f'[v{i}]' for i in range(num_beats))
        fade_start = max(0.0, total_duration - 4.0)
        filter_complex = (
            ''.join(filter_delays)
            + f'{voices_mix_inputs}amix=inputs={num_beats}:dropout_transition=0:normalize=0[all_voices];'
            + f'[{num_beats}:a]atrim=0:{total_duration},afade=t=out:st={fade_start:.3f}:d=4,volume=0.18[music_base];'
            + f'[all_voices][music_base]amix=inputs=2:duration=longest:dropout_transition=0:normalize=0,volume=1.25[outa]'
        )

        out_mp3 = media / f'{lesson["id"]}.mp3'
        subprocess.run(
            [
                'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                *filter_inputs,
                '-stream_loop', '-1', '-i', str(bg_music),
                '-filter_complex', filter_complex,
                '-map', '[outa]',
                '-t', str(total_duration),
                '-ar', '48000',
                '-c:a', 'libmp3lame', '-b:a', '160k',
                str(out_mp3),
            ],
            check=True,
        )
        print(f'  -> Audio maestro mezclado (voz + intriga): {out_mp3.name} ({total_duration:.2f}s)', flush=True)

        # Ensamblar con el video mudo renderizado (.render/{id}-silent.mp4) sin tocar un solo fotograma
        silent_mp4 = ROOT / '.render' / f'{lesson["id"]}-silent.mp4'
        out_mp4 = media / f'{lesson["id"]}.mp4'
        if silent_mp4.exists():
            subprocess.run(
                [
                    'ffmpeg', '-hide_banner', '-loglevel', 'error', '-y',
                    '-i', str(silent_mp4),
                    '-i', str(out_mp3),
                    '-map', '0:v:0',
                    '-map', '1:a:0',
                    '-c:v', 'copy',
                    '-c:a', 'aac', '-b:a', '192k',
                    '-t', str(total_duration),
                    '-movflags', '+faststart',
                    str(out_mp4),
                ],
                check=True,
            )
            print(f'  -> Video MP4 actualizado con nueva voz y música: {out_mp4.name}', flush=True)

    (PUBLIC / 'lessons.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'content/timed-lessons.json').write_text(json.dumps(lessons, ensure_ascii=False, indent=2), encoding='utf-8')
    if (PUBLIC / 'maps.json').exists():
        shutil.copy2(PUBLIC / 'maps.json', ROOT / 'content/geography.json')
    (PUBLIC / 'production.json').write_text(
        json.dumps(
            {
                'voice': VOICE,
                'tts': 'edge-tts',
                'rate': RATE,
                'bg_music': 'bg_music.ogg (loop, volume=0.18, fade_out=4s)',
                'paid_generation_usd': 0,
                'ocr': False,
                'audio': 'Actual generated speech (es-ES-AlvaroNeural) mixed with subtle intrigue background music',
                'caption_timing': 'Exact SentenceBoundary offsets from edge-tts inside each frame-aligned scene',
                'source': 'Five user-provided worksheet photographs; manually reviewed',
                'video_engine': 'Motion Canvas 3.17.2',
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding='utf-8',
    )


def stamp(seconds):
    ms = round(seconds * 1000)
    return f'{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02}.{ms % 1000:03}'


if __name__ == '__main__':
    source_assets()
    geography()
    asyncio.run(speech())
