# Image Color Replace

A free, privacy-friendly web app for replacing a specific color in an image. Users open a PNG, JPEG or WebP image, click the color they want to change, choose a new color, fine-tune tolerance and edge feathering, compare before/after and download the result. **All image processing happens in the browser** — images are never uploaded.

The site also includes original guide pages, an FAQ, About/Contact pages and legal pages, all prerendered to static HTML for search engines.

---

## Features

**Editor**
- Upload by drag-and-drop, file picker or clipboard paste; built-in sample image.
- Upload validation *before decoding*: file type by magic bytes (not name/MIME), 30 MB size limit, pixel dimensions read from the file header (PNG, JPEG, WebP lossy/lossless/extended) so “decompression bombs” are rejected without decoding. Images over 16.7 MP can be scaled down — only after the user confirms.
- Pick the source color by clicking/tapping the image (coordinates are correct at any zoom) or by keyboard (arrow keys + Enter); swatch with HEX, RGB and HSL; native color picker; validated HEX and per-channel RGB inputs.
- Replacement color via picker, HEX or RGB; swap button.
- Real pixel-level replacement on Canvas `ImageData`:
  - Perceptual CIELAB ΔE (CIE76) distance (default) or normalised RGB distance.
  - Adjustable tolerance and smoothstep edge feathering.
  - “Preserve shading” (Lab offset keeps highlights/shadows) or flat exact color.
  - Alpha channel never modified; fully transparent pixels skipped.
  - “Highlight affected area” mask preview.
- Multiple replacements (“Keep & pick another color”), each removable.
- Undo / redo (buttons and Ctrl/Cmd+Z, Ctrl/Cmd+Shift+Z, Ctrl+Y), reset (undoable).
- Non-destructive: every render is replayed from the untouched original pixels.
- Processing in a Web Worker with cancellation of stale renders, progress feedback and a main-thread fallback.
- Views: side by side (stacked on mobile), before/after compare slider, original only, result only; zoom to fit, 100 %, zoom in/out; image dimensions and hovered pixel color shown.
- Export PNG / JPEG / WebP at the same dimensions, quality slider, custom (sanitised) filename, JPEG background color with a transparency explanation, WebP disabled automatically where the browser cannot encode it. Object URLs and canvases are released after use.

**Site**
- Pages: Home/tool, How to Replace a Color in an Image, How Color Tolerance Works, FAQ, About, Contact, Privacy Policy, Terms of Service, and a 404 page.
- Static prerendering of every route with unique `<title>`, meta description, canonical URL, Open Graph/Twitter tags; JSON-LD `WebApplication` (home) and `FAQPage` (FAQ) only.
- Generated `sitemap.xml`, `robots.txt`, `ads.txt` (only with a real publisher ID) and `_headers` (security headers, strict CSP while ads are off, immutable asset caching).
- Favicon (SVG + PNG), Apple touch icon, web app manifest, Open Graph image.
- Accessible: skip link, labelled controls, live-region announcements, focus management on navigation, keyboard-operable picker, reduced-motion support. Automated axe-core audit in the E2E suite.
- AdSense-ready but **disabled by default** (see below).

## Technology

React 19 · React Router 7 · Vite 8 · Tailwind CSS 4 · Canvas API · Web Workers · Vitest + Testing Library (jsdom) · Playwright (E2E) · axe-core.
No backend, no paid APIs, no runtime dependencies beyond React and React Router.

## Prerequisites

- Node.js 20 or newer (22 recommended; see `.nvmrc`) and npm.
- For the E2E tests only: the `playwright` package with Chromium (`npm i -D playwright && npx playwright install chromium` if it is not already available on your machine).

## Getting started

```bash
npm install
cp .env.example .env      # optional locally; fill in values when you have them
npm run dev               # http://localhost:5173
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload. |
| `npm test` | Unit and component tests (Vitest). |
| `npm run test:watch` | Tests in watch mode. |
| `npm run build` | Production build into `dist/` (client build → SSR build → prerender). |
| `npm run preview` | Serves `dist/` like the static host (no SPA fallback, real 404s). |
| `npm run test:e2e` | End-to-end tests in Chromium against the production build (run `npm run build` first). |
| `npm run generate:icons` | Regenerates PNG icons and `og-image.png` from `public/favicon.svg`. |

## Configuration (environment variables)

All values are **public** — they end up in HTML/JS. Never put secrets in `VITE_*` variables.

| Variable | Purpose |
| --- | --- |
| `VITE_SITE_URL` | Public origin without trailing slash, e.g. `https://imagecolorreplace.com`. Enables canonical URLs, `og:url`/`og:image`, `sitemap.xml` and the `Sitemap:` line in `robots.txt`. If unset, these are omitted (the build prints a warning) rather than pointing at a wrong domain. |
| `VITE_CONTACT_EMAIL` | Address shown on the Contact page. |
| `VITE_GOOGLE_SITE_VERIFICATION` | Optional. The `content` value of Google Search Console’s HTML-tag verification meta tag. |
| `VITE_ADSENSE_CLIENT` | AdSense publisher ID, `ca-pub-` + 16 digits. Leave empty to disable ads entirely. |
| `VITE_ADSENSE_SLOT_HOME` | Ad unit ID for the slot at the bottom of the home page (below all content, far from the editor). |
| `VITE_ADSENSE_SLOT_ARTICLE` | Ad unit ID for the slot after the article on the How-to, Tolerance and FAQ pages. |

Also update `lastUpdated` in `src/config/site.js` when you materially change the guides or legal pages (it drives “Last updated” dates and sitemap `lastmod`).

## Project structure

```
index.html                 HTML template (placeholders filled by the prerenderer)
public/                    favicon, icons, manifest, OG image
scripts/prerender.js       renders routes to HTML; writes 404, sitemap, robots, ads.txt, _headers
scripts/e2e.cjs            Playwright end-to-end + accessibility tests
scripts/generate-icons.cjs icon/OG image generator
src/
  App.jsx, entry-client.jsx, entry-server.jsx
  config/                  site.js, routes.js (page metadata), ads.js
  content/faq.js           FAQ text (page + structured data)
  lib/                     color math, replacement algorithm, pipeline/worker client,
                           file validation, export, history, coordinates, head tags
  workers/replace.worker.js
  hooks/                   upload, processor, history, layout hooks
  components/editor/       Editor (upload), Workspace (lazy-loaded), ImageStage,
                           ColorField, MatchOptions, ReplacementList, ExportPanel
  components/layout/       Header, Footer, ArticleLayout, Logo
  components/AdSlot.jsx
  pages/                   one component per route
```

The replacement algorithm is documented at the top of `src/lib/replace.js`.

---

## Deployment (Cloudflare Pages, free plan)

The build output is a static site; no server or functions are needed.

1. **Put the code in a Git repository.** Create an empty repository on GitHub (or GitLab), then from the project folder:
   ```bash
   git remote add origin https://github.com/<you>/image-color-replace.git
   git push -u origin main
   ```
2. **Create the Pages project.** In the Cloudflare dashboard go to **Workers & Pages → Create → Pages → Connect to Git**, authorise GitHub, and select the repository. (You sign in and authorise in the browser — no tokens go into the code.)
3. **Build settings:**
   - Framework preset: *None* (or *Vite*)
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Root directory: leave empty (or the folder containing `package.json`)
4. **Environment variables** (Settings → Variables and secrets, *Production*): set `NODE_VERSION` = `22`, and `VITE_SITE_URL`, `VITE_CONTACT_EMAIL`. For a first launch on the free subdomain use `VITE_SITE_URL=https://<project>.pages.dev`.
5. **Save and deploy.** Cloudflare builds and publishes to `https://<project>.pages.dev`. HTTPS is provided automatically.

Routing needs no extra configuration: each page is a real HTML file (`/faq` → `faq.html`), Cloudflare serves extensionless URLs, and `404.html` is returned with a 404 status for unknown paths. `_headers` is applied automatically.

### Updating and redeploying
Push to the production branch (`main`): Cloudflare rebuilds and deploys automatically. Pushes to other branches get preview URLs. Changing environment variables requires a new deployment (**Deployments → … → Retry deployment**) because values are baked in at build time. You can roll back from the Deployments list.

### Custom domain
1. Buy a domain from any registrar (or Cloudflare Registrar).
2. In the Pages project open **Custom domains → Set up a custom domain** and enter it (e.g. `imagecolorreplace.com`, and optionally `www.`).
   - If the domain’s DNS is on Cloudflare, records are created for you.
   - Otherwise add the `CNAME` record Cloudflare shows (pointing to `<project>.pages.dev`) at your DNS provider. An apex domain generally requires moving DNS to Cloudflare.
3. Wait for the certificate to become active (HTTPS is automatic).
4. Choose one canonical host (e.g. without `www`) and redirect the other with a Cloudflare **Redirect Rule** or **Bulk Redirect**. Optionally redirect `<project>.pages.dev` to the custom domain as well.
5. Change `VITE_SITE_URL` to the new origin and redeploy so canonical URLs and the sitemap use it.

Other static hosts (Netlify, GitHub Pages via an action, Vercel) work with the same build command and `dist` folder; `_headers` is Netlify-compatible, other hosts need their own header configuration.

## SEO setup checklist

- [ ] `VITE_SITE_URL` set to the final canonical origin; redeployed.
- [ ] `https://<domain>/sitemap.xml` and `/robots.txt` load and list only real pages.
- [ ] View source of each page: unique title/description, canonical link, one `<h1>`.
- [ ] Share preview checked (e.g. the Open Graph image appears in a link preview).
- [ ] Rich Results Test passes for the home page (WebApplication) and FAQ page. Note: Google currently shows FAQ rich results only for a small set of authoritative sites, so do not expect FAQ snippets; the markup is still valid.
- [ ] Only one host (www / non-www / pages.dev) serves as canonical; others redirect.
- [ ] Guides reviewed and improved with your own experience; add new genuinely useful pages over time rather than many thin ones.

No ranking, indexing speed or traffic is guaranteed — search engines decide that.

## Google Search Console

1. Open <https://search.google.com/search-console> and add a property.
   - **Domain property** (recommended, needs a custom domain): add the DNS `TXT` record Google shows. With Cloudflare DNS, add it under **DNS → Records**.
   - **URL-prefix property** (works for `*.pages.dev`): choose the *HTML tag* method, copy only the `content="…"` value into the `VITE_GOOGLE_SITE_VERIFICATION` environment variable, redeploy, then click Verify.
2. **Sitemaps** → submit `sitemap.xml`.
3. Use **URL Inspection** on the home page → *Request indexing*.
4. Check the **Pages** and **Core Web Vitals** reports after a few weeks.
5. Optionally also verify in Bing Webmaster Tools (it can import from Search Console).

## Google AdSense configuration

Ads are off until you supply your own IDs. Building these components does not guarantee approval; Google reviews the site against its policies (original, useful content; clear navigation; privacy policy; no policy-violating content). In practice AdSense needs a site on a domain you own, so plan to connect a custom domain first.

1. Make sure the site is live on your domain with real content, a working contact address and the privacy policy.
2. Sign up at <https://adsense.google.com>, add your site and copy your publisher ID (`ca-pub-…`).
3. Set `VITE_ADSENSE_CLIENT` in the hosting dashboard and redeploy. The build then adds the AdSense script and the `google-adsense-account` meta tag to every page, generates `/ads.txt`, adds the Google advertising disclosures to the Privacy Policy, and drops the strict Content-Security-Policy header (AdSense loads code from many Google domains).
4. In AdSense, request the site review (choose the meta tag or ads.txt verification — both are already in place).
5. **Consent:** under **Privacy & messaging**, create a *European regulations* (GDPR) message using Google’s certified consent management platform for visitors in the EEA, UK and Switzerland, and a *US state regulations* message if applicable. Google’s CMP is delivered by the AdSense script, so no extra code is needed. If you use a different certified CMP, it must load before the AdSense script.
6. After approval, create **Display ad units** (responsive) and set `VITE_ADSENSE_SLOT_HOME` / `VITE_ADSENSE_SLOT_ARTICLE` to their IDs; redeploy. Each `AdSlot` renders only when its slot ID is configured, is labelled “Advertisement” and reserves height to limit layout shift.
7. **Auto ads:** if you enable them, use the AdSense page exclusions/ad-load controls to keep ads away from the editor, and check that no ad appears next to the upload or download buttons.

Never click your own ads or ask others to. Read the current [AdSense Program policies](https://support.google.com/adsense/answer/48182) before applying.

## Known limitations

- Pixels are selected by color, not by object or region; similar colors elsewhere in the image change too (no brush/lasso mask).
- Images above ~16.7 MP are edited at a reduced size (with confirmation); maximum 30 MB files and 16 384 px per side.
- Browser canvases store premultiplied alpha, so semi-transparent pixels can shift by ±1 color level when decoded or exported.
- The browser converts images to sRGB; embedded color profiles (e.g. Display P3) and EXIF/metadata are not preserved in downloads. Animated WebP files are edited as a single frame.
- GIF, HEIC, AVIF, SVG and BMP are not supported.
- CIE76 is a fast approximation of perceived color difference (less accurate than CIEDE2000 for saturated blues).
- WebP export depends on the browser (unsupported browsers fall back to PNG/JPEG).
- Very large images on low-memory phones may be slow or fail; the editor shows an error and lets the user start over.
- The legal pages are a sensible starting point, not legal advice. Add the operator’s name/jurisdiction if required and have them reviewed for your situation.

## Future improvements

- Brush or rectangle mask to restrict replacement to a region.
- Optional CIEDE2000 matching and averaged (3×3) sampling.
- Hue-only replacement mode; multiple source colors per replacement.
- Installable offline PWA; dark mode; translations.
- Privacy-friendly, cookieless analytics (e.g. Cloudflare Web Analytics) with the privacy policy updated accordingly.
