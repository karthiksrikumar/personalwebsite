import './style.css';
import { projects, papers, sculptures } from './data.js';

const main = document.querySelector('main');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
const base = import.meta.env.BASE_URL;
let scene, cleanup = () => {}, generation = 0, photos = {};
const asset = url => /^(https?:|mailto:)/.test(url) ? url : `${base}${url}`;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const external = (label, url) => `<a class="text-link" href="${esc(asset(url))}" target="_blank" rel="noopener noreferrer">${esc(label)} <span aria-hidden="true">↗</span></a>`;
const image = (src, alt, classes = '') => `<img class="${classes}" src="${asset(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
const gallery = id => photos[id]?.length ? `<div class="photo-gallery">${photos[id].map(p => `<button class="photo-button" data-photo="${esc(p.src)}" data-caption="${esc(p.alt)}">${image(p.src, p.alt)}<span>View photograph ↗</span></button>`).join('')}</div>` : '';

function bindPhotos() {
  main.querySelectorAll('[data-photo]').forEach(b => b.addEventListener('click', () => {
    dialogContent.innerHTML = `<h2 id="dialog-title" class="photo-caption">${esc(b.dataset.caption)}</h2>${image(b.dataset.photo, b.dataset.caption, 'full-photo')}`; dialog.showModal();
  }));
}
dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', e => { if (e.target === dialog) { const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close(); } });
dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));

function home() {
  main.innerHTML = `<section class="home-hero" aria-labelledby="home-title">
    <div class="hero-intro"><p class="eyebrow">A personal collection</p><h1 id="home-title">Hi, I’m <br><span>Karthik Srikumar.</span></h1><p class="intro-caption">This is my head in 3D.</p><p class="intro-sub">Here are some things<br>that revolve around me.</p></div>
    <div class="portrait-stage" aria-label="Interactive 3D portrait of Karthik, surrounded by links to his work">
      <div class="scene-status" role="status">Setting the portrait in place…</div>
      <a class="orbit-link orbit-projects" data-route="projects" href="#/projects"><span class="orbit-number">01</span><span>Projects</span><span class="orbit-arrow">↗</span></a>
      <a class="orbit-link orbit-research" data-route="research" href="#/research"><span class="orbit-number">02</span><span>Research</span><span class="orbit-arrow">↗</span></a>
      <a class="orbit-link orbit-equity" data-route="equity" href="#/equity"><span class="orbit-number">03</span><span>Equity &<br>representation</span><span class="orbit-arrow">↗</span></a>
      <a class="orbit-link orbit-gala" data-route="gala" href="#/gala"><span class="orbit-number">04</span><span>Sculpture gala</span><span class="orbit-arrow">↗</span></a>
    </div>
    <div class="portrait-note"><span class="tiny-star">✳</span><p>An actual scan.<br>A slightly unusual introduction.</p></div>
    <div class="hero-bottom"><p>Senior at South Windsor High School<br><span>Connecticut, USA</span></p><div class="scene-tools"><span class="drag-hint">Drag to turn my head</span><button data-pause aria-pressed="false">Ⅱ Pause motion</button><button data-reset aria-label="Reset portrait rotation">↺</button></div><a href="#selected" class="scroll-link">A closer look <span>↓</span></a></div>
  </section>
  <section class="home-index" id="selected"><div class="index-intro"><span class="eyebrow">Away from the orbit</span><h2>A few things<br>I’m working on.</h2><p>Machine learning, public life, and things made to be looked at from more than one angle.</p></div><div class="index-links"><a href="#/research"><span>Research & publications</span><p>Distillation, language, and the limits of reasoning.</p><span class="index-arrow">↗</span></a><a href="#/projects"><span>Projects</span><p>From ternary networks to political writing.</p><span class="index-arrow">↗</span></a><a href="#/equity"><span>Equity & representation</span><p>AI education and language representation in Hartford.</p><span class="index-arrow">↗</span></a><a href="#/gala"><span>Sculpture gala</span><p>Seven objects. A small room. A different perspective.</p><span class="index-arrow">↗</span></a></div></section>`;
  const current = generation;
  import('./scene.js').then(async ({ createPortrait }) => {
    if (current !== generation) return;
    const container = main.querySelector('.portrait-stage');
    const instance = await createPortrait(container, { onReady: () => { container.querySelector('.scene-status').textContent = ''; }, onError: () => { container.querySelector('.scene-status').textContent = 'The portrait needs WebGL. Explore the collection using the links around it.'; container.classList.add('scene-unavailable'); } });
    if (current !== generation) { instance.dispose(); return; } scene = instance;
    main.querySelector('[data-reset]').onclick = () => instance.reset?.();
  }).catch(() => { if (current === generation) main.querySelector('.scene-status').textContent = 'The portrait could not load. All sections remain available from the navigation.'; });
}

function projectDetail(project) {
  dialogContent.innerHTML = `<div class="project-detail"><div class="detail-visual">${image(project.image, project.title)}</div><div class="detail-copy"><p class="eyebrow">${project.type}</p><h2 id="dialog-title">${project.title}</h2><p class="detail-subtitle">${project.subtitle}</p><p>${project.description}</p>${project.awards ? `<ul class="awards">${project.awards.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}<div class="link-row">${project.links.map(l => external(...l)).join('')}</div>${gallery(project.id)}</div></div>`;
  dialog.showModal(); document.body.classList.add('modal-open');
  dialog.querySelectorAll('[data-photo]').forEach(b => b.onclick = () => { dialogContent.innerHTML = `<h2 id="dialog-title" class="photo-caption">${esc(b.dataset.caption)}</h2>${image(b.dataset.photo, b.dataset.caption, 'full-photo')}`; });
}
function projectPage() {
  main.innerHTML = `<div class="page-wrap"><header class="page-heading"><p class="eyebrow">Selected work</p><h1>Projects</h1><p>Some built, some written, some still being worked out.</p></header><div class="project-list">${projects.map((p, i) => `<button class="project-item" data-project="${p.id}"><div class="project-art">${image(p.image, p.title)}<span class="view-project">Open project ↗</span></div><div class="project-summary"><span class="project-number">${String(i + 1).padStart(2, '0')} / ${p.type}</span><h2>${p.title}</h2><p>${p.subtitle}</p></div></button>`).join('')}</div></div>`;
  main.querySelectorAll('[data-project]').forEach(b => b.onclick = () => projectDetail(projects.find(p => p.id === b.dataset.project)));
}

function paperRow(p) {
  const preview = p.preview || `previews/${p.id}.png`;
  return `<article class="paper-row ${p.featured ? 'featured-paper' : ''}"><a class="paper-preview" href="${asset(p.pdf)}" target="_blank" rel="noopener noreferrer" aria-label="Read ${esc(p.title)} PDF">${image(preview, `${p.actualPreview ? "First page" : "Publication cover"}: ${p.title}`)}<span>Read paper ↗</span></a><div class="paper-content"><p class="paper-venue">${p.venue}</p><h2><a href="${asset(p.pdf)}" target="_blank" rel="noopener noreferrer">${p.title}</a></h2><p class="paper-authors">${p.authors}</p><p class="paper-description">${p.description}</p><div class="link-row">${external('PDF', p.pdf)}${external('Publication', p.url)}<button class="text-link" data-cite="${p.id}">Cite <span aria-hidden="true">↗</span></button></div>${p.featured ? `<aside class="citation-note"><span class="eyebrow">Read & cited by</span><p>Researchers at the University of Washington, Georgia Tech, Samsung, and Peking University.</p><div>${external('NTK trace estimation', 'https://arxiv.org/abs/2511.10796')}${external('Mixture-of-agents serving', 'https://arxiv.org/abs/2512.18126')}</div></aside>` : ''}</div><span class="paper-year">${p.year}</span></article>`;
}
function researchPage() {
  main.innerHTML = `<div class="page-wrap research-wrap"><header class="page-heading research-heading"><div><p class="eyebrow">Research & publications</p><h1>Thinking on paper.</h1></div><p>My work looks at how machine learning systems learn, reason, and represent the people who use them.</p></header><div class="research-toolbar"><span>Selected publications, 2025–2026</span><div class="year-filters" aria-label="Filter publications by year"><button class="active" data-year="all" aria-pressed="true">All</button><button data-year="2026" aria-pressed="false">2026</button><button data-year="2025" aria-pressed="false">2025</button></div></div><div id="papers">${papers.map(paperRow).join('')}</div><p class="research-footnote">Workshop venues are listed in full. PDFs link to the papers themselves.</p></div>`;
  main.querySelectorAll('[data-year]').forEach(button => button.onclick = () => {
    main.querySelectorAll('[data-year]').forEach(b => { b.classList.toggle('active', b === button); b.setAttribute('aria-pressed', String(b === button)); });
    main.querySelector('#papers').innerHTML = papers.filter(p => button.dataset.year === 'all' || p.year === button.dataset.year).map(paperRow).join(''); bindCitations();
  }); bindCitations();
}
function bindCitations() {
  main.querySelectorAll('[data-cite]').forEach(b => b.onclick = () => {
    const p = papers.find(p => p.id === b.dataset.cite);
    const cite = `@inproceedings{srikumar${p.year}${p.id},\n  title = {${p.title}},\n  author = {${p.authors.split(', ').join(' and ')}},\n  booktitle = {${p.venue}},\n  year = {${p.year}},\n  url = {${p.url}}\n}`;
    dialogContent.innerHTML = `<div class="citation-dialog"><p class="eyebrow">BibTeX</p><h2 id="dialog-title">Cite this paper</h2><pre>${esc(cite)}</pre><button class="solid-button" data-copy>Copy citation</button><span role="status" class="copy-status"></span></div>`; dialog.showModal();
    dialog.querySelector('[data-copy]').onclick = async () => { try { await navigator.clipboard.writeText(cite); dialog.querySelector('.copy-status').textContent = 'Copied.'; } catch { dialog.querySelector('.copy-status').textContent = 'Select and copy the citation above.'; } };
  });
}

function equityPage() {
  main.innerHTML = `<div class="page-wrap equity-wrap"><header class="page-heading"><p class="eyebrow">Equity & representation</p><h1>Who gets a seat<br>at the table?</h1><p>Work on access to AI education, dialect representation, and student voices in the classroom.</p></header>
  <section class="equity-section"><div class="equity-label"><span>01</span><img class="mm-logo" src="${asset('media/machina-mundi-logo.png')}" alt="Machina Mundi logo"></div><div class="equity-copy"><h2>Machina Mundi</h2><p class="large-copy">AI education begins with access.</p><p>Machina Mundi runs hands-on AI programs in Greater Hartford, including Hartford, East Hartford, Manchester, and South Windsor. Students work with models, examine how chatbots respond, and discuss whose experiences those systems represent.</p><p>The work extends beyond the classroom into dialect research and education policy, including conversations with local partners and elected officials.</p><div class="link-row">${external('Visit Machina Mundi', 'https://machinamundi.vercel.app')}${external('Source & projects', 'https://github.com/karthiksrikumar/MachinaMundiWebsite')}</div>${gallery('machina-mundi')}</div></section>
  <section class="equity-section"><div class="equity-label"><span>02</span></div><div class="equity-copy"><h2>ConvoAAVE</h2><p class="large-copy">Speech should not have to change to be understood.</p><p>ConvoAAVE is an African American Vernacular English speech corpus developed with community partners in Hartford and East Hartford. More than 80,000 words of transcript preserve the grammar of the original speech, rather than rewriting it into Standard English.</p><p>The project releases written transcripts. Voice recordings remain restricted to protect the people who contributed them.</p><p class="recognition">Princeton Prize in Race Relations, regional finalist, 2026.</p><div class="link-row">${external('Explore the corpus', 'https://github.com/karthiksrikumar/ConvoAAVE-POLLEN')}${external('Project & methodology', 'https://machinamundi.vercel.app/convoaave')}</div>${gallery('convoaave')}</div></section>
  <section class="equity-section"><div class="equity-label"><span>03</span></div><div class="equity-copy"><h2>Students in the AI conversation</h2><p class="large-copy">South Windsor High School Student AI Council</p><p>As a Student AI Squad co-lead, I work with educators on ethical AI use in K–12 classrooms and speak at Board of Education meetings about students’ experiences with these tools.</p><p>I created video resources that helped introduce AI tools to 900 students within the first few months. By March 2025, student use reached 2,400. I also helped educators develop tools used in 72% of classrooms across the district.</p><p>I was one of two district students selected for the “AI in Education” panel for New England educators, and was invited to return for the October 2026 conference. The South Windsor superintendent also recognized this work in the district newsletter.</p><div class="link-row">${external('South Windsor Public Schools', 'https://www.southwindsorschools.org/')}</div>${gallery('student-ai')}</div></section></div>`;
  bindPhotos();
}

function galaPage() {
  main.innerHTML = `<section class="gala-room"><header class="gala-heading"><div><p class="eyebrow">A collection of seven</p><h1>Sculpture gala</h1></div><p>Public buildings. Private interests.<br>A few things in between.</p></header><div class="gallery-stage" aria-label="Interactive exhibition of seven original sculptures"><div class="scene-status" role="status">Opening the exhibition…</div>${sculptures.map((s, i) => `<button class="gallery-label" aria-label="Inspect ${s.title}"><span>${String(i + 1).padStart(2, '0')}</span>${s.title}</button>`).join('')}</div><div class="gala-controls"><p>Drag to look around <span>·</span> Scroll to move closer</p><div class="gala-view-buttons"><button class="solid-button tour-button" data-tour>Enter the exhibition →</button><button class="outline-button" data-overview>↖ View the whole room</button></div></div><div class="gala-detail" aria-live="polite"><span class="gala-detail-number">01 / 07</span><div><p class="eyebrow" data-category>${sculptures[0].category}</p><h2 data-sculpture-title>${sculptures[0].title}</h2><p data-sculpture-description>${sculptures[0].description}</p></div><div class="gala-pagination"><button data-prev aria-label="Previous sculpture">←</button><button data-next aria-label="Next sculpture">→</button></div></div></section><section class="gala-catalogue page-wrap"><div class="catalogue-heading"><h2>The collection</h2><p>Select a piece to see it in the room.</p></div>${sculptures.map((s, i) => `<button class="catalogue-row" data-sculpture="${i}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${s.title}</h3><span>${s.category}</span><span>↗</span></button>`).join('')}${gallery('gala')}</section>`;
  let selected = 0; const current = generation;
  function update(index) { selected = index; main.querySelector('.gala-detail-number').textContent = `${String(index + 1).padStart(2, '0')} / 07`; main.querySelector('[data-category]').textContent = sculptures[index].category; main.querySelector('[data-sculpture-title]').textContent = sculptures[index].title; main.querySelector('[data-sculpture-description]').textContent = sculptures[index].description; }
  import('./scene.js').then(async ({ createGallery }) => {
    if (generation !== current) return;
    const instance = await createGallery(main.querySelector('.gallery-stage'), sculptures, update);
    if (generation !== current) { instance.dispose(); return; } scene = instance;
    main.querySelector('[data-prev]').onclick = () => instance.select((selected + 6) % 7);
    main.querySelector('[data-next]').onclick = () => instance.select((selected + 1) % 7);
    main.querySelector('[data-overview]').onclick = () => instance.overview();
    main.querySelector('[data-tour]').onclick = () => instance.select(0);
    main.querySelectorAll('[data-sculpture]').forEach(b => b.onclick = () => { instance.select(Number(b.dataset.sculpture)); main.querySelector('.gala-room').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  }); bindPhotos();
}

async function route() {
  if (location.hash === '#selected') { document.querySelector('#selected')?.scrollIntoView({ behavior: 'smooth' }); return; }
  generation++; scene?.dispose(); scene = null; cleanup(); dialog.close();
  const path = location.hash.replace(/^#\/?/, '') || 'home';
  document.body.dataset.page = path;
  document.querySelectorAll('.site-header nav a').forEach(a => { const active = a.hash === `#/${path}`; if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  const titles = { home: 'Karthik Srikumar', projects: 'Projects', research: 'Research & publications', equity: 'Equity & representation', gala: 'Sculpture gala' };
  document.title = titles[path] ? `${titles[path]}${path === 'home' ? '' : ' | Karthik Srikumar'}` : 'Karthik Srikumar';
  ({ home, projects: projectPage, research: researchPage, equity: equityPage, gala: galaPage }[path] || home)();
  window.scrollTo(0, 0);
  main.setAttribute('tabindex', '-1');
}
try { const response = await fetch(`${base}photos/manifest.json`); if (response.ok) photos = await response.json(); } catch { /* Text and navigation remain available without photography. */ }
async function refreshPhotos() {
  try {
    const response = await fetch('https://api.github.com/repos/karthiksrikumar/personalwebsite/git/trees/main?recursive=1', { signal: AbortSignal.timeout(5000) });
    if (!response.ok) return;
    const tree = await response.json();
    if (tree.truncated || !Array.isArray(tree.tree) || !tree.tree.some(f => f.path === 'public/photos/manifest.json')) return;
    const fresh = Object.fromEntries(Object.keys(photos).map(key => [key, []]));
    for (const file of tree.tree) {
      const match = file.path.match(/^public\/photos\/([^/]+)\/([^/]+\.(?:png|jpe?g|webp|avif|gif))$/i);
      if (!match || file.type !== 'blob' || !(match[1] in fresh)) continue;
      fresh[match[1]].push({ src: `https://raw.githubusercontent.com/karthiksrikumar/personalwebsite/main/${file.path.split('/').map(encodeURIComponent).join('/')}`, alt: match[2].replace(/\.[^.]+$/, '').replace(/^\d+[-_ ]*/, '').replace(/[-_]/g, ' '), name: match[2] });
    }
    for (const collection of Object.values(fresh)) collection.sort((a, b) => a.name.localeCompare(b.name));
    photos = fresh;
    // Refresh the photographic page only before a reader has started interacting with it.
    if (document.body.dataset.page === 'equity' && window.scrollY < 50 && !dialog.open) equityPage();
  } catch { /* Keep the bundled photo manifest when GitHub is unavailable or rate limited. */ }
}
try {
  const response = await fetch(`${base}content-manifest.json`), content = await response.json();
  for (const p of papers) { if (content[p.id]?.pdf) p.pdf = content[p.id].pdf; if (content[p.id]?.preview) { p.preview = content[p.id].preview; p.actualPreview = true; } }
  if (content['we-the-corporations']?.pdf) { projects[1].links = [['Read the essay', content['we-the-corporations'].pdf]]; projects[1].image = content['we-the-corporations'].preview || projects[1].image; }
} catch { /* Verified external sources remain available. */ }
window.addEventListener('hashchange', route); route(); refreshPhotos();
