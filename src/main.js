import './style.css';
import { projects, papers, sculptures } from './data.js';

const main = document.querySelector('main');
const dialog = document.querySelector('#detail-dialog');
const dialogContent = document.querySelector('#dialog-content');
const base = import.meta.env.BASE_URL;
let scene, cleanup = () => {}, generation = 0, photos = {}, equityInteracted = false;
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
    <div class="hero-intro"><p class="eyebrow">A personal collection</p><h1 id="home-title">Hi, I’m <br><span>Karthik Srikumar.</span></h1><p class="intro-caption">I’m a senior at South Windsor High School.</p><p class="intro-sub">I created a pipeline to generate my head with neural networks.</p><p class="intro-orbit">Here is what revolves around my head right now.</p><p class="intro-created">Created in 3D</p><ol class="intro-accomplishments" aria-label="Selected accomplishments"><li><a href="#/projects">International Science and Engineering Fair Finalist, 2025</a></li><li><a href="#/projects">Boston University RISE Internship <span>(2.2%)</span></a></li><li><a href="#/research">NeurIPS paper cited by Georgia Tech and Samsung</a></li><li><a href="#/equity">Princeton Prize in Race Relations Regional Finalist</a></li><li><a href="${asset('papers/we-the-corporations.pdf')}" target="_blank" rel="noopener noreferrer">Scholastic Gold Medal &#8599;</a></li></ol></div>
    <div class="portrait-stage" aria-label="Interactive 3D portrait of Karthik, surrounded by links to his work">
      <div class="scene-status" role="status">Setting the portrait in place…</div>
      <a class="orbit-link" data-route="projects" href="#/projects" title="Projects" aria-label="Projects"><span class="orbit-number">01</span><span>Projects</span><span class="orbit-arrow">&#8599;</span></a>
      <a class="orbit-link" data-route="research" href="#/research" title="Research" aria-label="Research"><span class="orbit-number">02</span><span>Research</span><span class="orbit-arrow">&#8599;</span></a>
      <a class="orbit-link" data-route="equity" href="#/equity" title="Equity & representation" aria-label="Equity & representation"><span class="orbit-number">03</span><span>Equity & representation</span><span class="orbit-arrow">&#8599;</span></a>
      <a class="orbit-link" data-route="gala" href="#/gala" title="Sculpture gala" aria-label="Sculpture gala"><span class="orbit-number">04</span><span>Sculpture gala</span><span class="orbit-arrow">&#8599;</span></a>
    </div>
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
  dialogContent.innerHTML = `<div class="project-detail"><div class="detail-visual">${project.id === 'oatnet' ? `<div class="isef-visual">${image('media/oatnet-isef-project.jpg', 'Karthik Srikumar, portrait from his ISEF OATNet project page')}${image('media/isef-logo.png', '2025 Regeneron ISEF logo', 'isef-detail-logo')}</div>` : image(project.image, project.title)}</div><div class="detail-copy"><p class="eyebrow">${project.type}</p><h2 id="dialog-title">${project.title}</h2><p class="detail-subtitle">${project.subtitle}</p><p>${project.description}</p>${project.awards ? `<ul class="awards">${project.awards.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}<div class="link-row">${project.links.map(l => external(...l)).join('')}</div>${gallery(project.id)}</div></div>`;
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
  cleanup();
  const stories = [
    { title: 'Machina Mundi', claim: 'AI education begins with access.', body: 'Machina Mundi brings hands-on AI programs to Hartford, East Hartford, Manchester, and South Windsor. Students test models and ask whose experiences those systems represent. The work reaches into dialect research and education policy with local partners and elected officials.', links: [['Visit Machina Mundi', 'https://machinamundi.vercel.app'], ['Source & projects', 'https://github.com/karthiksrikumar/MachinaMundiWebsite']] },
    { title: 'ConvoAAVE', claim: 'Speech should not have to change to be understood.', body: 'Developed with community partners in Hartford and East Hartford, this African American Vernacular English corpus preserves the grammar of more than 80,000 transcribed words. Written transcripts are public; contributor recordings remain restricted. Princeton Prize in Race Relations regional finalist, 2026.', links: [['Explore the corpus', 'https://github.com/karthiksrikumar/ConvoAAVE-POLLEN'], ['Project & methodology', 'https://machinamundi.vercel.app/convoaave']] },
    { title: 'Student AI Squad', claim: 'Students belong in decisions about classroom AI.', body: 'As a South Windsor Student AI Squad co-lead, I work with educators and speak at Board of Education meetings. My videos helped introduce AI tools to 900 students; by March 2025, student use reached 2,400. I also helped educators build tools used in 72% of district classrooms and joined an AI in Education panel for New England educators.', links: [['South Windsor Public Schools', 'https://www.southwindsorschools.org/']] },
  ];
  const slides = [...(photos['machina-mundi'] || [])];
  const fallback = { src: 'media/machina-mundi-logo.png', alt: 'Machina Mundi emblem' };
  if (!slides.length) slides.push(fallback);
  main.innerHTML = `<section class="equity-screen" aria-labelledby="equity-title"><div class="equity-head"><p class="eyebrow">Equity & representation</p><h1 id="equity-title">Who gets a seat at the table?</h1><p>Three ways to make AI more accountable to the people it serves.</p></div><div class="equity-tabs" role="tablist" aria-label="Equity projects">${stories.map((s, i) => `<button role="tab" id="equity-tab-${i}" aria-controls="equity-panel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-equity-tab="${i}"><span>0${i + 1}</span>${s.title}</button>`).join('')}</div><div class="equity-feature"><article class="equity-story" id="equity-panel" role="tabpanel" aria-labelledby="equity-tab-0" tabindex="0"></article><div class="equity-media"><button class="equity-photo" data-photo="" data-caption="" aria-label="Open photograph">${image(slides[0].src, slides[0].alt, 'equity-photo-image')}<span class="equity-photo-open">View photograph ↗</span></button><div class="equity-media-bar"><p class="equity-photo-caption"></p><div class="equity-reel-controls"><button data-slide-prev aria-label="Previous photograph">←</button><span class="equity-slide-count"></span><button data-slide-next aria-label="Next photograph">→</button><button data-slide-pause aria-label="Pause image rotation" aria-pressed="false">Ⅱ</button></div></div></div></div></section>`;
  let selected = 0, slide = 0, timer, paused = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const panel = main.querySelector('#equity-panel');
  const tabs = [...main.querySelectorAll('[data-equity-tab]')];
  const photoButton = main.querySelector('.equity-photo');
  const media = main.querySelector('.equity-media');
  const feature = main.querySelector('.equity-feature');
  const pauseButton = main.querySelector('[data-slide-pause]');
  function showStory(index) {
    selected = index;
    const story = stories[index];
    panel.innerHTML = `<p class="eyebrow">0${index + 1} / 03</p><h2>${story.title}</h2><p class="equity-thesis">${story.claim}</p><p class="equity-body">${story.body}</p><div class="link-row">${story.links.map(l => external(...l)).join('')}</div>`;
    panel.setAttribute('aria-labelledby', `equity-tab-${index}`);
    media.hidden = index !== 0;
    feature.classList.toggle('text-only', index !== 0);
    tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
    startRotation();
  }
  function showSlide(index) {
    slide = (index + slides.length) % slides.length;
    const current = slides[slide];
    const img = photoButton.querySelector('img');
    img.src = asset(current.src); img.alt = current.alt;
    photoButton.dataset.photo = current.src; photoButton.dataset.caption = current.alt;
    main.querySelector('.equity-photo-caption').textContent = current.alt;
    main.querySelector('.equity-slide-count').textContent = `${String(slide + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
  }
  function startRotation() { clearInterval(timer); if (!paused && selected === 0 && slides.length > 1) timer = setInterval(() => showSlide(slide + 1), 5000); }
  tabs.forEach((tab, i) => { tab.onclick = () => { equityInteracted = true; showStory(i); }; tab.onkeydown = e => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { e.preventDefault(); equityInteracted = true; const next = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length; showStory(next); tabs[next].focus(); } }; });
  main.querySelector('[data-slide-prev]').onclick = () => { equityInteracted = true; showSlide(slide - 1); startRotation(); };
  main.querySelector('[data-slide-next]').onclick = () => { equityInteracted = true; showSlide(slide + 1); startRotation(); };
  pauseButton.onclick = () => { equityInteracted = true; paused = !paused; pauseButton.setAttribute('aria-pressed', String(paused)); pauseButton.setAttribute('aria-label', paused ? 'Resume image rotation' : 'Pause image rotation'); pauseButton.textContent = paused ? '▶' : 'Ⅱ'; startRotation(); };
  pauseButton.setAttribute('aria-pressed', String(paused)); pauseButton.setAttribute('aria-label', paused ? 'Resume image rotation' : 'Pause image rotation'); pauseButton.textContent = paused ? '▶' : 'Ⅱ';
  showStory(selected); showSlide(slide); startRotation(); bindPhotos();
  cleanup = () => { clearInterval(timer); cleanup = () => {}; };
}

function galaPage() {
  main.innerHTML = `<section class="gala-room"><header class="gala-heading"><div><p class="eyebrow">Karthik Srikumar / digital sculpture</p><h1>Sculpture gala</h1><span class="gala-exhibition-number">An exhibition in seven objects · 2025–26</span></div><p class="gala-intro">These are pieces of art I made using CAD—some political, some just for fun. They’re a way for me to express myself in a digital medium.</p></header><div class="gallery-stage" aria-label="Interactive exhibition of seven original sculptures"><div class="scene-status" role="status">Opening the exhibition…</div>${sculptures.map((s, i) => `<button class="gallery-label" aria-label="Inspect ${s.title}"><span>${String(i + 1).padStart(2, '0')}</span>${s.title}</button>`).join('')}</div><div class="gala-controls"><p>Drag to look around <span>·</span> Scroll to move closer</p><div class="gala-view-buttons"><button class="solid-button tour-button" data-tour>Enter the exhibition →</button><button class="outline-button" data-overview>↖ View the whole room</button></div></div><div class="gala-detail" aria-live="polite"><span class="gala-detail-number">01 / 07</span><div><p class="eyebrow" data-category>${sculptures[0].category}</p><h2 data-sculpture-title>${sculptures[0].title}</h2><p data-sculpture-description>${sculptures[0].description}</p></div><div class="gala-pagination"><button data-prev aria-label="Previous sculpture">←</button><button data-next aria-label="Next sculpture">→</button></div></div></section><section class="gala-catalogue page-wrap"><div class="catalogue-heading"><h2>The collection</h2><p>Select a piece to see it in the room.</p></div>${sculptures.map((s, i) => `<button class="catalogue-row" data-sculpture="${i}"><span>${String(i + 1).padStart(2, '0')}</span><h3>${s.title}</h3><span>${s.category}</span><span>↗</span></button>`).join('')}${gallery('gala')}</section>`;
  let selected = 0; const current = generation;
  function update(index) { selected = index; main.querySelector('.gala-detail-number').textContent = `${String(index + 1).padStart(2, '0')} / 07`; main.querySelector('[data-category]').textContent = sculptures[index].category; main.querySelector('[data-sculpture-title]').textContent = sculptures[index].title; main.querySelector('[data-sculpture-description]').textContent = sculptures[index].description; }
  import('./scene.js').then(async ({ createGallery }) => {
    if (generation !== current) return;
    const instance = await createGallery(main.querySelector('.gallery-stage'), sculptures, update);
    if (generation !== current) { instance.dispose(); return; } scene = instance;
    main.querySelector('[data-prev]').onclick = () => instance.select((selected + 6) % 7);
    main.querySelector('[data-next]').onclick = () => instance.select((selected + 1) % 7);
    main.querySelector('[data-overview]').onclick = () => instance.overview();
    main.querySelector('[data-tour]').onclick = () => { instance.select(0); main.querySelector('.gala-room').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); };
    main.querySelectorAll('[data-sculpture]').forEach(b => b.onclick = () => { instance.select(Number(b.dataset.sculpture)); main.querySelector('.gala-room').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  }); bindPhotos();
}

async function route() {
  if (location.hash === '#selected') { document.querySelector('#selected')?.scrollIntoView({ behavior: 'smooth' }); return; }
  generation++; scene?.dispose(); scene = null; cleanup(); dialog.close();
  const path = location.hash.replace(/^#\/?/, '') || 'home';
  if (path === 'equity') equityInteracted = false;
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
    if (document.body.dataset.page === 'equity' && !equityInteracted && !dialog.open) equityPage();
  } catch { /* Keep the bundled photo manifest when GitHub is unavailable or rate limited. */ }
}
try {
  const response = await fetch(`${base}content-manifest.json`), content = await response.json();
  for (const p of papers) { if (content[p.id]?.pdf) p.pdf = content[p.id].pdf; if (content[p.id]?.preview) { p.preview = content[p.id].preview; p.actualPreview = true; } }
} catch { /* Verified external sources remain available. */ }
window.addEventListener('hashchange', route); route(); refreshPhotos();
