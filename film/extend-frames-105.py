"""Reuse the verified 90-second film, inserting 15 seconds before the build."""
from pathlib import Path
import hashlib
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'film/output/political-sculptures-90s.mp4'
SOURCE_SHA256 = '932ed11528c472264d1a2a4a19f6dd2995fea884afe85752099df531352105c5'
assert source.exists(), 'Restore the committed 90-second MP4 before extending'
assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Source video checksum mismatch'

target = ROOT / '.cache/film105-frames'
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
assert len(frames) == 2160, f'Expected 2160 source frames; got {len(frames)}'
for index in range(2159, 1439, -1):
    (target / f'{index:05d}.jpg').replace(target / f'{index + 360:05d}.jpg')
print('Prepared 2160 verified source frames; 60–75 seconds is open for 360 new frames.')
