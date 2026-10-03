import { createCanvas, DOMMatrix, ImageData, Path2D } from '@napi-rs/canvas';
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
if (!process.getBuiltinModule) process.getBuiltinModule = createRequire(import.meta.url);
globalThis.DOMMatrix = DOMMatrix; globalThis.ImageData = ImageData; globalThis.Path2D = Path2D;
const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
await mkdir('public/previews', { recursive: true });
for (const file of (await readdir('public/papers')).filter(f => f.endsWith('.pdf'))) {
  const pdf = await getDocument({ data: new Uint8Array(await readFile(`public/papers/${file}`)), useSystemFonts: true, disableFontFace: true }).promise;
  const page = await pdf.getPage(1), viewport = page.getViewport({ scale: 1.6 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  await writeFile(`public/previews/${file.replace('.pdf', '.png')}`, canvas.toBuffer('image/png'));
  console.log('Preview:', file);
  const text = await page.getTextContent(); console.log(text.items.map(i => i.str).join(' ').slice(0, 380));
  await pdf.destroy();
}
