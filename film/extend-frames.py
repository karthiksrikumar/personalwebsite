"""Reuse the verified 75-second render, leaving a 15-second gap for new shots."""
from pathlib import Path
import hashlib
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'film/output/political-sculptures-75s.mp4'
SOURCE_SHA256 = '38a2a202e4d9cd8b611103f0f35391114058deb9676a4460cc3952d615c89be7'
assert source.exists(), 'Restore the committed 75-second MP4 before extending'
assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Source video checksum mismatch'

target = ROOT / '.cache/film90-frames'
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
assert len(frames) == 1800, f'Expected 1800 source frames; got {len(frames)}'
for index in range(1799, 1079, -1):
    (target / f'{index:05d}.jpg').replace(target / f'{index + 360:05d}.jpg')
print('Prepared 1800 verified source frames; 45–60 seconds is open for 360 new frames.')
