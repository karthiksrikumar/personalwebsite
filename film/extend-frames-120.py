"""Reuse the verified 105-second film, inserting 15 seconds of new builds."""
from pathlib import Path
import hashlib
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'film/output/political-sculptures-105s.mp4'
SOURCE_SHA256 = 'bb91c427e348d304acd9d43ca4acbb52cca70c95b2e60816fdb9e3aa4b2a154c'
assert source.exists(), 'Restore the committed 105-second MP4 before extending'
assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Source video checksum mismatch'

target = ROOT / '.cache/film120-frames'
target.mkdir(parents=True, exist_ok=True)
assert not list(target.glob('*.jpg')), 'Target frames already exist'
ffmpeg = os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg')
if not ffmpeg:
    import imageio_ffmpeg
    ffmpeg = imageio_ffmpeg.get_ffmpeg_exe()
subprocess.run([ffmpeg, '-hide_banner', '-loglevel', 'error', '-i', str(source),
                '-an', '-vsync', '0', '-q:v', '2', '-start_number', '0',
                str(target / '%05d.jpg')], check=True)
frames = sorted(target.glob('*.jpg'))
assert len(frames) == 2520, f'Expected 2520 source frames; got {len(frames)}'
for index in range(2519, 1799, -1):
    (target / f'{index:05d}.jpg').replace(target / f'{index + 360:05d}.jpg')
print('Prepared 2520 verified source frames; 75–90 seconds is open for 360 new frames.')
