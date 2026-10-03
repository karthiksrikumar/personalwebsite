import { mkdir, writeFile } from 'node:fs/promises';
async function publicFile(url, destination) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  await mkdir(destination.slice(0, destination.lastIndexOf('/')), { recursive: true });
  await writeFile(destination, Buffer.from(await response.arrayBuffer()));
  console.log(destination);
}
const media = [
  ['MachinaMundiLogo.png', 'public/media/machina-mundi-logo.png'],
  ['MainYMCA.jpg', 'public/photos/machina-mundi/01-YMCA-AI-workshop.jpg'],
  ['YMCAClassroom.jpg', 'public/photos/machina-mundi/02-Learning-about-AI.jpg'],
  ['CongressmanMeeting.png', 'public/photos/machina-mundi/03-Congressional-meeting.png'],
  ['MainPrinecton.jpg', 'public/photos/convoaave/01-Princeton-Prize-ceremony.jpg'],
  ['PrinectonSpeech.JPG', 'public/photos/convoaave/02-Presenting-ConvoAAVE.jpg'],
  ['ConvoAAVE.png', 'public/media/convoaave.png'],
];
for (const [source, dest] of media) await publicFile(`https://machinamundi.vercel.app/media/${source}`, dest);
await publicFile('https://raw.githubusercontent.com/karthiksrikumar/Exponential-Periods-in-Finite-Subtraction-Games/main/paper/paper.pdf', 'public/papers/subtraction-games.pdf');
await mkdir('public/papers', { recursive: true });
const papers = [
  ['ntk', 'https://openreview.net/attachment?id=UpMG1bPKSB&name=pdf'],
  ['oromo', 'https://raw.githubusercontent.com/mlresearch/v314/main/assets/srikumar26a/srikumar26a.pdf'],
  ['reasoning', 'https://openreview.net/pdf?id=l8VMwSaOGL'],
  ['tempirl', 'https://openreview.net/attachment?id=Dux58yUgUC&name=pdf'],
  ['euhr', 'https://openreview.net/pdf?id=BvImRZyNf5'],
];
for (const [name, url] of papers) {
  const response = await fetch(url);
  if (!response.ok) { console.log(`Could not download ${name}: ${response.status}`); continue; }
  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.subarray(0, 4).toString() !== '%PDF') { console.log(`Not a PDF: ${name}`); continue; }
  await writeFile(`public/papers/${name}.pdf`, buffer);
  console.log(`Downloaded ${name}`);
}
