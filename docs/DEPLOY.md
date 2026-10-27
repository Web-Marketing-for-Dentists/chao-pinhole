# Deploying to Cloudflare Pages

The site is a plain static folder. There is no build step, no `node_modules`,
and no server code — Pages serves `public/` as-is.

## Project settings

| Setting | Value |
| --- | --- |
| Build command | *(leave empty)* |
| Build output directory | `public` |
| Root directory | *(repo root)* |
| Environment variables | none |
| Functions | none |

Node version is irrelevant — nothing is compiled.

## Option A — Direct upload (no git required)

Works today, as-is. `npx` pulls wrangler on demand; it is not installed globally.

```bash
npm run deploy
```

which is `npm run clean && npx wrangler pages deploy public --project-name=chao-pinhole`.
First run prompts an OAuth login and offers to create the project.

The `clean` step deletes `.DS_Store` files. macOS regenerates them inside
`public/` whenever the folder is opened in Finder, and **direct upload ships
whatever is in the directory** — `.gitignore` does not apply. Git integration is
unaffected, since they are gitignored.

## Option B — Git integration (recommended for ongoing work)

**This repo is not yet initialised.** Pages' Git integration needs a GitHub
repo, so this has to happen first:

```bash
git init && git add -A && git commit -m "Static rebuild of thepinholeclinic.com"
```

Then create the GitHub repo and connect it in the Cloudflare dashboard under
*Workers & Pages → Create → Pages → Connect to Git*, with the build settings in
the table above.

## URL behaviour — the thing most likely to trip you up

**Cloudflare Pages serves HTML extensionless and 301s `/foo.html` → `/foo`.**
This is automatic and cannot be turned off.

Everything in this repo is already written for that:

- Internal links point at `/privacy-policy`, not `/privacy-policy.html`.
- `<link rel="canonical">` matches the served URL (`/privacy-policy`).
- `_redirects` destinations are extensionless — pointing them at `.html` would
  make every old WordPress URL take **two** hops instead of one.
- `_headers` rules are written without `.html`, since matching happens against
  the request URL. A `/*.html` rule would silently never match.

The files on disk keep their `.html` names. That is correct — only the URLs are
extensionless.

Local preview mirrors this exactly:

```bash
npx serve public -l 4326
```

`serve` does the same clean-URL handling, so what you see locally is what Pages
serves. **Do not preview with `python3 -m http.server`** — it has no clean-URL
support, so `/privacy-policy` 404s and you get a false alarm.

## `_headers` — one Cache-Control per path, always

When several rules match one request, Pages applies **all** of them, and a
header set twice is **joined with a comma**, not overridden. A `Cache-Control`
on `/*` would concatenate with the one on `/assets/*` and emit
`max-age=0, must-revalidate, max-age=31536000, immutable` — nonsense.

That is why the HTML routes are listed individually instead of caught by a
wildcard. **If you add a page, add its `Cache-Control` line too.**

Assets are cached immutably for a year, so `site.css` and `site.js` are linked
with a `?v=N` query. **Bump `N` in every HTML file whenever you edit either
file**, or returning visitors keep the old copy. Currently at `v=13`.

## Verified before handoff

Against a local server that reproduces Pages' clean-URL behaviour:

- `/`, `/privacy-policy`, `/terms-and-conditions`, `/disclaimer`, `/thank-you`
  → all 200.
- `/privacy-policy.html` → 301 to `/privacy-policy` (matching Pages).
- Unknown path → 404 serving the custom `404.html`.
- Every internal link and asset reference → 200. No broken images.
- No `_redirects` rule shadows a real file (redirects take priority over static
  assets on Pages, so a careless rule would black-hole an asset).
- 50 files, 8.4 MB total, largest 6.2 MB — well inside the 20,000-file and
  25 MiB-per-file limits.
- 12 redirect rules, static before dynamic — inside the 2,000/100 limits.

## After the first deploy — check these on the real domain

Three things genuinely cannot be verified from localhost:

1. **The GHL calendar's auto-resize.** `form_embed.js` sizes the iframe via a
   `postMessage` that is domain-gated; on localhost it never fires and the frame
   falls back to a 600px `min-height`. Confirm the calendar renders at its full
   height.
2. **The chat widget's expanded state.** The invitation bubble is verified clear
   of the fixed mobile call/book bar, but the opened chat window needs a live
   agent session. Confirm its header is not clipped on a phone.
3. **WhatConverts number swapping** against the production domain and its
   campaign rules.

## Custom domain

`thepinholeclinic.com` currently points at the WordPress host. Cutting over is a
DNS change in the Pages project's *Custom domains* tab. Before doing it:

- The live WordPress site serves `<meta name="robots" content="noindex,
  nofollow">` site-wide. This rebuild does **not**. If that was deliberate
  rather than a leftover, say so before launch.
- `Strict-Transport-Security: max-age=31536000` ships in `_headers`. Once a
  browser sees it, that domain is HTTPS-only for a year. That is correct for a
  live site, but do not point a domain at this that still needs to serve HTTP.
