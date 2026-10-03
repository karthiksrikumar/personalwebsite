import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { projects, papers, sculptures } from '../src/data.js';
const local = async path => { if (!/^(https?:|mailto:)/.test(path)) await access(`public/${decodeURIComponent(path)}`); };
assert.equal(sculptures.length, 7);
assert.equal(papers.length, 5);
for (const p of projects) { await local(p.image); for (const [, url] of p.links) await local(url); }
for (const p of papers) { await local(p.pdf); await local(p.preview); assert.ok(p.url.startsWith('https://')); }
for (const s of sculptures) { await access(`public/models/${s.id}.obj`); await access(`public/models/${s.id}.mtl`); }
const original = await readFile('obj/head.stl'), published = await readFile('public/head.stl');
assert.ok(original.equals(published), 'The published head must be the exact original scan');
const manifest = JSON.parse(await readFile('public/photos/manifest.json', 'utf8'));
for (const gallery of Object.values(manifest)) for (const image of gallery) await local(image.src);
for (const file of ['src/main.js', 'src/data.js', 'src/scene.js', 'index.html']) {
  const text = await readFile(file, 'utf8');
  assert.ok(!/gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}/.test(text), `Credential found in ${file}`);
  assert.ok(!text.includes('\uFFFD') && !text.includes('â€'), `Encoding error in ${file}`);
}
console.log('All local asset links, 7 model pairs, photo manifests, text encoding, and exact head scan verified.');
