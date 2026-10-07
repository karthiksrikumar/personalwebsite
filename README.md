# Karthik Srikumar's personal website

A personal portfolio with a real-time head scan, orbiting navigation, research publications, project details, community photographs, and a seven-piece 3D sculpture exhibition.

The [105-second, four-piece political sculpture film](https://github.com/karthiksrikumar/personalwebsite/raw/refs/heads/main/film/output/political-sculptures-105s.mp4) and its [rendering source and instructions](film/README.md) are in `film/`.

## Preview and build

Use Node 22 or newer:

```sh
npm ci
npm run dev
npm run build
npm test
```

The development preview is served at the address printed by Vite. The production website is in `dist/`. Relative asset paths and hash navigation support GitHub Pages at `/personalwebsite/` without server rewrites.

## Adding photographs without editing code

Upload images through GitHub's **Add file → Upload files** into the appropriate `public/photos/` folder:

| Folder | Appears in |
| --- | --- |
| `oatnet` | OATNet project |
| `corporations` | We the Corporations project |
| `subtraction-games` | Mathematics project |
| `driveaeye` | DriveAEye project |
| `babyvlm` | BabyVLM project |
| `safenet` | SafeNet AI project |
| `machina-mundi` | Machina Mundi section |
| `convoaave` | Reserved; not displayed in the current equity page |
| `student-ai` | Reserved for future Student AI Squad materials |
| `gala` | Below the sculpture catalogue |

Commit the upload to `main`. The website reads the public repository's photo folders when it opens, so new photographs appear without a rebuild. On the equity page, only Machina Mundi photographs appear; ConvoAAVE and Student AI Squad currently use text-only panels. If GitHub is temporarily unavailable or rate limited, the site uses the last bundled gallery. JPG, PNG, WebP, AVIF, and GIF are supported. Empty folders produce no empty boxes. Files sort alphabetically, so use names such as `01-Classroom-workshop.jpg`; the filename becomes the accessible caption. Resize photographs to roughly 1800 pixels wide for faster loading. For local changes, restart `npm run dev` after adding photos.

## Content and art

- Edit `src/data.js` for project descriptions, publication records, and sculpture labels.
- Edit `src/main.js` for biography and community copy.
- The Scholastic Gold Medal project links directly to `we-the-corporations.pdf` on the repository's `main` branch. Its designed project cover remains in `public/previews/we-the-corporations.svg`.
- The palette is defined in `src/style.css` and `src/scene.js`: `#0075F2`, `#51D6FF`, `#C5A059`, `#1F2421`, `#5C2C23`.
- Original models stay in `obj/`. `prepare-assets.mjs` copies the head and all OBJ/MTL pairs into the public build. Generated copies are ignored by Git.
- The homepage loads the original STL with Three.js STLLoader. The sculpture room uses OBJLoader and MTLLoader, batching material groups to keep rendering efficient.
- Motion can be paused. Reduced-motion preferences start the homepage paused. All section links and the sculpture catalogue work with a keyboard.
- See [SOURCES.md](SOURCES.md) for provenance and remaining document/social-link limitations.

## GitHub Pages

The repository is `karthiksrikumar/personalwebsite`. GitHub Pages publishes the `gh-pages` branch at <https://karthiksrikumar.github.io/personalwebsite/>. Website source stays on `main`.

After code changes, commit and push `main`, then run `npm run publish:pages`. This builds the site and pushes generated output from a dedicated, marked checkout under `.cache/pages-publish`. The script never deletes source files and does not force-push. Authenticate with `gh auth login` first if needed. Photo uploads alone do not need this step.

`deployment/pages.yml` is an optional Actions workflow template. The current GitHub sign-in does not have the `workflow` permission needed to install it. If that permission is granted later, move it to `.github/workflows/pages.yml` and switch Pages to **GitHub Actions** for automatic builds on every code change.

No access tokens belong in the site, workflow, or repository. Publishing uses the existing GitHub CLI sign-in.
