import { mkdir, copyFile, readdir, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
const root = process.cwd();
await mkdir('public/models', { recursive: true });
for (const name of await readdir('obj')) {
  if (/\.(obj|mtl)$/i.test(name)) await copyFile(path.join('obj', name), path.join('public/models', name));
}
await copyFile('obj/head.stl', 'public/head.stl');
await mkdir('public/papers', { recursive: true });
try {
  await access('writing/The Revolution Boutta Be Televised.pdf');
  await copyFile('writing/The Revolution Boutta Be Televised.pdf', 'public/papers/we-the-corporations.pdf');
} catch { /* The source essay is optional in forks of this project. */ }
const sections = ['oatnet', 'corporations', 'subtraction-games', 'driveaeye', 'babyvlm', 'safenet', 'machina-mundi', 'convoaave', 'student-ai', 'gala'];
const manifest = {};
for (const section of sections) {
  const folder = path.join(root, 'public', 'photos', section);
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, '.gitkeep'), '');
  const files = (await readdir(folder)).filter(f => /\.(png|jpe?g|webp|avif|gif)$/i.test(f)).sort();
  manifest[section] = files.map(file => ({ src: `photos/${section}/${encodeURIComponent(file)}`, alt: file.replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replace(/[-_]/g, ' ') }));
}
await writeFile('public/photos/manifest.json', JSON.stringify(manifest, null, 2));
const content = {};
for (const name of ['ntk', 'oromo', 'euhr', 'reasoning', 'tempirl', 'we-the-corporations']) {
  content[name] = {};
  for (const [key, file] of [['pdf', `papers/${name}.pdf`], ['preview', `previews/${name}.png`]]) {
    try { await access(`public/${file}`); content[name][key] = file; } catch { /* Use the verified remote source and bibliographic cover. */ }
  }
}
await writeFile('public/content-manifest.json', JSON.stringify(content, null, 2));
console.log('Prepared the head scan, 7 sculptures, and photo galleries.');
