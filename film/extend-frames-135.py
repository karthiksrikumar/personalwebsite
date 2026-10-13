"""Reuse the verified 120-second film, opening a 15-second inspection montage."""
from pathlib import Path
import hashlib
import os
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
source = ROOT / 'film/output/political-sculptures-120s.mp4'
SOURCE_SHA256 = 'f59fc4f6b58f392013b71a2313e54a38ddfc5eed3a33b74c4c3ae683f26c7a3a'
assert source.exists(), 'Restore the committed 120-second MP4 before extending'
assert hashlib.sha256(source.read_bytes()).hexdigest() == SOURCE_SHA256, 'Source video checksum mismatch'

target = ROOT / '.cache/film135-frames'
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
assert len(frames) == 2880, f'Expected 2880 source frames; got {len(frames)}'
for index in range(2879, 2519, -1):
    (target / f'{index:05d}.jpg').replace(target / f'{index + 360:05d}.jpg')
print('Prepared 2880 verified source frames; 105-120 seconds is open for 360 new frames.')
