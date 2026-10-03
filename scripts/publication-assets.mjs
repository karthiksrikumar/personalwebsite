import { mkdir, writeFile } from 'node:fs/promises';
await mkdir('public/papers', { recursive: true });
for (const [name, id] of [['ntk', 'UpMG1bPKSB'], ['reasoning', 'l8VMwSaOGL'], ['tempirl', 'Dux58yUgUC'], ['euhr', 'BvImRZyNf5']]) {
  const note = await fetch(`https://api2.openreview.net/notes?id=${id}`);
  const metadata = await note.json();
  console.log(name, metadata.notes?.[0]?.content?.title?.value || note.status);
  const urls = [`https://api2.openreview.net/pdf?id=${id}`, `https://api2.openreview.net/attachment?id=${id}&name=pdf`];
  for (const url of urls) {
    const r = await fetch(url); const data = Buffer.from(await r.arrayBuffer());
    if (r.ok && data.subarray(0, 4).toString() === '%PDF') { await writeFile(`public/papers/${name}.pdf`, data); console.log(`Saved ${name} PDF`); break; }
    console.log('Download status:', r.status);
  }
}
