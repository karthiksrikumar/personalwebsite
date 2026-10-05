# Political sculptures — 60-second film

[Watch or download the finished MP4](output/political-sculptures-60s.mp4).

1920 × 1080, 24 fps, exactly 60 seconds. H.264 video with a stereo AAC soundscape. No titles or text overlays; lettering that is part of the original sculptures remains intact.

![Final composition](output/poster.jpg)

## Reproduce

Run these commands from the repository root. Node 22+, Python 3.12+, and a WebGL2-capable Chromium are recommended.

```sh
npm ci
npx playwright install chromium
python -m pip install numpy pillow imageio-ffmpeg
node film/render.mjs --preview
node film/render.mjs
node film/verify-scene.mjs
python film/finish.py
node film/verify-playback.mjs
```

`CHROME_PATH` can point to a Chromium executable. `FFMPEG_PATH` can point to a full FFmpeg executable with libx264 and AAC support. The exporter also discovers a project-local imageio-ffmpeg installation in `.cache/film-tools`, or an installed Python `imageio_ffmpeg` package. No external rendering service is required.

Preview frames go to `.cache/film-preview`. The complete render writes 1,440 JPEG frames to `.cache/film-frames`; the script resumes by skipping existing frames. **Clear that frame directory before rerendering after any scene, source asset, resolution, or renderer change.** The WAV score and intermediate frames remain in the ignored `.cache` directory. Final outputs are in `film/output`.

To deliberately replace specific shots after a localized edit, use, for example, `node film/render.mjs --only=12:16,38:50`, then run the finishing and verification commands again. Ranges are start-inclusive and end-exclusive, in seconds.

## Scene and edit

| Time | Composition |
| --- | --- |
| 0–8s | Dark surface reveal and slow pullback across Capitol at Auction |
| 8–12s | Marionette currency and suspension detail |
| 12–16s | Price of Power sculptural detail |
| 16–20s | Machina Mundi metallic detail |
| 20–25s | Foundation and lower components assemble |
| 25–33.5s | Camera cranes upward with the forming structure |
| 33.5–38s | Pullback to the completed assembly |
| 38–44s | Camera retreats through the central gallery aisle |
| 44–50s | Wide reveal of all eight supplied models |
| 50–60s | Final hero pullback; camera holds from 57.1s; fade at 59–60s |

`scene.mjs` is the complete scene project: materials, lights, camera, post-processing, and deterministic animation. It loads the supplied files directly from `obj/`. There is no Blender project because this film is rendered in Three.js.

Capitol at Auction assembles from its 365 original OBJ components. Their actual bounding heights determine the build order; the foundation starts first, and individual components settle downward into their original coordinates. No proxy sculpture, mesh decimation, or whole-object opacity fade is used. Static models are batched by material without removing triangles. The original STL scan is included in the gallery with a neutral porcelain material.

The supplied MTL color palette and material identities are retained, with metalness and roughness added for the studio treatment. These assets contain material colors rather than external image texture maps. Rendering uses an HDR environment approximation, warm key/cool rim lighting, shadow maps, screen-space ambient occlusion, environment reflections, depth of field, multisample antialiasing, ACES tone mapping, and two temporal samples per frame for a subtle 180-degree shutter. This is a rasterized PBR render, not path-traced global illumination. No textures or geometric detail were invented to replace the models.

`finish.py` synthesizes an original restrained ambient score and damped metallic construction sounds. Accents follow the component completion times exported from the scene. There are no third-party music recordings or sound samples.

## Verification artifacts

- `output/model-inventory.json`: all eight assets, triangle counts, component counts, and materials.
- `output/assembly-parts.json`: original component height bounds.
- `output/assembly-events.json`: sound synchronization times derived from the actual animation.
- `output/contact-sheet.jpg`: representative rendered shots for visual review.
- `output/verification.json`: duration, resolution, frame count, full-file decode, audio levels, checksum, and browser playback result.
- `output/scene-verification.json`: asset-loading errors and camera near-plane ray checks at half-second intervals. These sampled checks supplement visual review; they are not an exhaustive geometric collision proof.

The exporter checks every intermediate image, then decodes the entire finished audio/video file with FFmpeg and requires 1,440 decoded frames. The playback check runs the MP4 from start to the ended event in Chromium at four-times speed. Representative opening, detail, construction, collection, and hero frames were inspected for framing and appearance.
