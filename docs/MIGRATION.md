# Migrating to Astro

The site currently ships as hand-written static HTML in `public/`. Nothing is
compiled; Cloudflare Pages serves that folder as-is. This document is the plan
for turning it into an Astro build when that becomes worthwhile.

**One rule throughout:** when a page moves into `src/pages/`, delete its
`public/*.html` counterpart **in the same commit**. Two copies of the same page
is the only way this migration goes wrong.

## What's already in place

| File | Status |
| --- | --- |
| `package.json` | Astro, `@astrojs/cloudflare`, `wrangler` declared in devDependencies |
| `astro.config.mjs` | `output: 'static'`, `build.format: 'file'` (keeps `/privacy-policy.html` URLs), adapter commented out |
| `tsconfig.json` | Extends `astro/tsconfigs/strict`, `~/*` → `src/*` |
| `src/layouts/BaseLayout.astro` | Full page shell — head, header, footer, mobile CTA, analytics, chat, script tag |
| `src/components/Header.astro` | Header + primary nav, nav items as data |
| `src/components/Footer.astro` | Footer |
| `src/components/Analytics.astro` | GA4 + WhatConverts + Meta Pixel, rendered from `BaseLayout` |
| `src/pages/` | Empty — **`astro build` will fail until at least one page exists** |

`npm install` has not been run. There is no `node_modules/`, no lockfile.

## Step 1 — Install and confirm the toolchain

```bash
npm install
```

## Step 2 — Move the small pages first

The legal and utility pages are the low-risk warm-up. For each of
`privacy-policy`, `terms-and-conditions`, `disclaimer`, `thank-you`, `404`:

1. Create `src/pages/<slug>.astro`.
2. Wrap the existing `<div class="prose">…</div>` body in `BaseLayout`,
   passing `title`, `description`, `noindex`, `canonical`, and `homeHref="/"`.
3. Delete `public/<slug>.html`.

```astro
---
import BaseLayout from '~/layouts/BaseLayout.astro';
---
<BaseLayout
  title="Privacy Policy | Chao Pinhole®"
  description="How Chao Pinhole® collects, uses, and protects your personal information."
  canonical="/privacy-policy.html"
  noindex
>
  <div class="section">
    <div class="shell prose">
      <!-- body of public/privacy-policy.html, unchanged -->
    </div>
  </div>
</BaseLayout>
```

`build.format: 'file'` means these emit as `/privacy-policy.html`, so the URLs
and the `_redirects` rules keep working untouched.

## Step 3 — Split the homepage

`public/index.html` is one long single-page layout. Each `<section>` is already
a clean seam. Suggested split into `src/components/home/`:

| Component | Source section in `public/index.html` |
| --- | --- |
| `Hero.astro` | `.hero` |
| `InventorStrip.astro` | first `.section--mist` with `.inventor` — carries the 9:16 YouTube Short facade |
| `CaseGrid.astro` | the three `.bas-container` slider figures |
| `WhatIsPinhole.astro` | `#pinhole` |
| `CtaBand.astro` | the repeated `.section--gold` CTA (used 3×) |
| `Research.astro` | `#research` |
| `GumRecession.astro` | `#gum-recession` |
| `Symptoms.astro` | the symptoms slider + checklist |
| `CompareTable.astro` | `.compare` |
| `Gallery.astro` | `#gallery` |
| `Testimonials.astro` | `#testimonials` — four TikTok player embeds |
| `MediaTabs.astro` | the `[data-tabs]` block |
| `MeetTheDoctor.astro` | `#doctor` |
| `Booking.astro` | `#book` — GHL iframe (needs `form_embed.js`) + offer countdown |
| `Faq.astro` | `#faq` |
| `Contact.astro` | `#contact` — call + schedule cards, no form |

Three repeat with different copy and are the best candidates for props:

- `CtaBand` — appears 3× with the same buttons, differing headline.
- `BeforeAfter` — 10 instances; props: `beforeSrc`, `afterSrc`, `beforeLabel`,
  `afterLabel`, `ratio`, `label`, `caption`. Renders the `data-bas` div that
  `site.js` builds the slider into.
- `Carousel` — 2 instances; slot in the slides, prop the aria-labels.

Content that is currently inline and would be better as data:

- `src/data/testimonials.json` — the 4 TikTok video IDs and their titles.
- `src/data/faq.json` — the 12 accordion entries.
- `src/data/studies.json` — the 3 published papers.

## Step 4 — Move CSS and JS into the pipeline (optional)

Today `site.css` and `site.js` are plain files under `public/assets/`, linked
with a `?v=N` query for cache-busting against the immutable `Cache-Control` in
`public/_headers`.

To let Astro hash and bundle them instead:

1. `git mv public/assets/css/site.css src/styles/site.css` and
   `import '~/styles/site.css'` from `BaseLayout.astro`.
2. `git mv public/assets/js/site.js src/scripts/site.js` and replace the
   `<script is:inline>` tag with `<script>import '~/scripts/site.js';</script>`.
3. Drop the `?v=N` query strings — Astro's content hashes replace them.
4. Update the `url("../img/…")` references in the CSS; from `src/styles/` the
   relative path becomes `/assets/img/…` (absolute) or Astro resolves imports.

Images and video stay in `public/assets/` — they are referenced by absolute
path from both HTML and CSS and do not need processing.

## Step 5 — Keep the third-party embeds inline

Three scripts must survive the migration verbatim and stay on every page:

| Script | Constraint |
| --- | --- |
| `src/components/Analytics.astro` | GA4 + WhatConverts + Meta Pixel. Already rendered from `BaseLayout`. The `$wc_leads` bootstrap must stay immediately before `141394.js`. |
| `src/components/ChatWidget.astro` | SellWithChat. Already rendered from `BaseLayout`. |
| GHL `form_embed.js` | `https://link.msgsndr.com/js/form_embed.js` — sizes the booking iframe. Only needed on pages carrying the calendar. |

Use `is:inline` on all of them so Astro emits them as-is rather than bundling
or hoisting. Order matters for the WhatConverts pair.

**There is no `/api/contact` and no server route to build.** The site has no
forms; every conversion path is call, chat, or schedule. `output` stays
`'static'` and the Cloudflare adapter stays commented out unless something new
actually needs SSR.

## Step 6 — Switch the Cloudflare Pages build

Until the migration completes, Pages should be configured as:

- Build command: *(empty)*
- Build output directory: `public`

After it completes:

- Build command: `npm run astro:build`
- Build output directory: `dist`

Move `_headers`, `_redirects`, `robots.txt`, `sitemap.xml` and `favicon.ico`
along with the rest of `public/` — Astro copies `public/` into `dist/`
verbatim, so they need no changes.
