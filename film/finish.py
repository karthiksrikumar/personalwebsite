"""Synthesize the score, encode the film, and decode every frame for verification."""
from pathlib import Path
import hashlib
import json
import os
import re
import shutil
import struct
import subprocess
import wave
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
CACHE = ROOT / '.cache'
OUT = ROOT / 'film/output'
FRAMES = CACHE / 'film105-frames'
RATE = 48000
DURATION = 105
FPS = 24

def encoder():
    explicit = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
    if explicit:
        return explicit
    matches = list((CACHE / 'film-tools/imageio_ffmpeg/binaries').glob('ffmpeg-*.exe'))
    if matches:
        return str(matches[0])
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()

def score():
    """Original deterministic ambient score; no samples or licensed recordings."""
    rng = np.random.default_rng(1207)
    t = np.arange(RATE * DURATION, dtype=np.float64) / RATE
    stereo = np.zeros((len(t), 2), np.float64)
    swell = .55 + .2*np.sin(2*np.pi*t/31 - 1) + .1*np.sin(2*np.pi*t/13)
    for index, hz in enumerate([36.708, 73.416, 110, 146.832, 220.0]):
        amp = [.019, .025, .013, .009, .004][index]
        for channel in range(2):
            vibrato = .08*np.sin(2*np.pi*t*.09+channel*.25)
            stereo[:, channel] += amp*swell*np.sin(2*np.pi*hz*t+vibrato+channel*.18)
    # Quiet, band-limited room air, independently seeded per channel.
    for channel in range(2):
        air = rng.normal(0, 1, len(t))
        air = np.convolve(air, np.ones(48)/48, mode='same')
        stereo[:, channel] += .003*air
    events = json.loads((OUT / 'assembly-events.json').read_text())
    for index, event in enumerate(events):
        start = round(event['time']*RATE)
        length = min(round(2.2*RATE), len(t)-start)
        x = np.arange(length)/RATE
        envelope = (1-np.exp(-x*110))*np.exp(-x*3.3)
        hz = [147, 196, 220, 294][index % 4]
        strike = .045*np.sin(2*np.pi*hz*x)*envelope
        strike += .012*np.sin(2*np.pi*hz*2.73*x)*np.exp(-x*6.5)
        strike += .006*rng.normal(0,1,length)*np.exp(-x*60)
        pan = .3+.4*(index%3)/2
        stereo[start:start+length,0] += strike*np.sqrt(1-pan)
        stereo[start:start+length,1] += strike*np.sqrt(pan)
    # Slow upper harmonic bloom as the completed collection appears.
    bloom = np.clip((t-90)/7, 0, 1)*np.clip((103-t)/9, 0, 1)
    stereo += (.012*bloom*np.sin(2*np.pi*293.664*t))[:,None]
    fade = np.clip(t/4,0,1)*np.clip((105-t)/2,0,1)
    # A gently evolving harmonic bed gives the longer edit more movement.
    for start,hz in [(3,174.614),(13.5,196),(24,220),(34.5,164.814),(45,174.614),(48.75,196),(52.5,220),(56.25,164.814),(60,174.614),(63.75,196),(67.5,220),(71.25,164.814),(90,220),(99,293.664)]:
        local=t-start
        env=np.clip(local/2,0,1)*np.clip((11-local)/3,0,1)
        for channel in range(2):
            stereo[:,channel]+=.014*env*np.sin(2*np.pi*hz*t+.2*channel)
            stereo[:,channel]+=.005*env*np.sin(2*np.pi*hz*1.5*t+.3*channel)
    stereo *= fade[:,None]
    peak = float(np.max(np.abs(stereo)))
    with wave.open(str(CACHE/'film105-score.wav'),'wb') as wav:
        wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE)
        wav.writeframes((stereo*32767).astype('<i2').tobytes())
    return {'sampleRate':RATE,'channels':2,'peakDbFS':round(20*np.log10(peak),2),'originalSynthesis':True,'constructionAccents':events}

def main():
    files = sorted(FRAMES.glob('*.jpg'))
    assert len(files) == FPS*DURATION, f'Expected 2520 frames; found {len(files)}'
    assert [p.name for p in files] == [f'{i:05}.jpg' for i in range(2520)]
    for p in files:
        with Image.open(p) as im:
            assert im.size == (1920,1080), (p, im.size)
            im.verify()
    models=json.loads((OUT/'model-inventory.json').read_text())
    expected={'price-of-power','liberty-tug-of-war (1)','capitol-at-auction','capitol-marionette'}
    assert {m['id'] for m in models} == expected, 'Missing source model'
    source_checks=[]
    for model in models:
        source=ROOT/'obj'/(model['id']+('.stl' if model['id']=='head' else '.obj'))
        data=source.read_bytes()
        triangles=struct.unpack('<I',data[80:84])[0] if source.suffix=='.stl' else sum(len(line.split())-3 for line in data.decode().splitlines() if line.startswith('f '))
        assert triangles==model['triangles'], f'Triangle count changed: {source}'
        if source.suffix=='.obj':
            mtl=source.with_suffix('.mtl')
            lines=mtl.read_text().splitlines()
            names={line.split(maxsplit=1)[1] for line in lines if line.startswith('newmtl ')}
            assert set(model['materials']) <= names, f'Unknown material: {source}'
            for line in lines:
                if line.strip().startswith('map_'):
                    assert (mtl.parent/line.split()[-1]).exists(), f'Missing texture: {line}'
        source_checks.append({'file':source.relative_to(ROOT).as_posix(),'triangles':triangles,'sha256':hashlib.sha256(data).hexdigest()})
    sound = score()
    ffmpeg = encoder()
    video = OUT/'political-sculptures-105s.mp4'
    subprocess.run([ffmpeg,'-y','-hide_banner','-loglevel','error','-framerate','24',
        '-i',str(FRAMES/'%05d.jpg'),'-i',str(CACHE/'film105-score.wav'),
        '-vf','scale=in_range=full:out_range=limited:in_color_matrix=bt601:out_color_matrix=bt709',
        '-c:v','libx264','-preset','slow','-crf','18','-pix_fmt','yuv420p',
        '-color_primaries','bt709','-color_trc','bt709','-colorspace','bt709','-c:a','aac','-b:a','160k','-ar','48000','-t','105',
        '-movflags','+faststart','-metadata','title=Political Sculptures',str(video)], check=True)
    # A full decode verifies every video frame and the entire audio stream.
    decoded = subprocess.run([ffmpeg,'-v','error','-xerror','-i',str(video),
        '-progress','pipe:1','-f','null','-'],capture_output=True,text=True,check=True)
    counts=re.findall(r'^frame=(\d+)', decoded.stdout, re.M)
    assert counts and int(counts[-1]) == 2520, decoded.stdout
    assert not decoded.stderr.strip(), decoded.stderr
    metadata=subprocess.run([ffmpeg,'-hide_banner','-i',str(video)],capture_output=True,text=True).stderr
    assert 'Duration: 00:01:45.00' in metadata, metadata
    assert '1920x1080' in metadata and '24 fps' in metadata, metadata
    assert 'Audio: aac' in metadata, metadata
    assert video.stat().st_size < 95_000_000, 'Video exceeds the conservative GitHub size budget'
    with Image.open(FRAMES/'02448.jpg') as poster:
        poster.save(OUT/'poster.jpg',quality=95)
    times=[7.5,18,29,39,46.875,50.625,54.375,58.125,61.875,65.625,69.375,73.125,81,87,94,102]
    contact=Image.new('RGB',(1600,980),'#0a0a0a');draw=ImageDraw.Draw(contact)
    for i,seconds in enumerate(times):
        with Image.open(FRAMES/f'{round(seconds*24):05}.jpg') as frame:
            contact.paste(frame.resize((400,225)),(i%4*400,i//4*245))
            draw.text((i%4*400+8,i//4*245+227),f'{seconds:04.1f}s',fill='#c9c9c9')
    contact.save(OUT/'contact-sheet.jpg',quality=92)
    report={'durationSeconds':105,'fps':24,'decodedFrames':int(counts[-1]),'width':1920,'height':1080,
            'videoCodec':'H.264','pixelFormat':'yuv420p','audioCodec':'AAC','decodeErrors':[],
            'bytes':video.stat().st_size,'sha256':hashlib.sha256(video.read_bytes()).hexdigest(),
            'sourceTrianglesPreserved':True,'sources':source_checks,'models':models,'sound':sound}
    (OUT/'verification.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k not in ['models','sound']},indent=2))

if __name__ == '__main__':
    main()
