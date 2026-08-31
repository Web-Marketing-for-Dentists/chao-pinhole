# Chao Pinhole®

Static rebuild of [thepinholeclinic.com](https://thepinholeclinic.com/) —
Pinhole Gum Rejuvenation®, John C. Chao, DDS, MAGD, Alhambra CA.

Plain HTML, one stylesheet, one script, no build step. Scaffolded so it can
become an Astro project without restructuring.

## Run it

```bash
npx serve public -l 4321
```

Or open `public/index.html` directly — note that absolute asset paths
(`/assets/…`) need a server, so prefer the command above.

## Layout

```
public/                 the deployable site — this is the source of truth today
  index.html            the whole homepage (single-page, anchor-navigated)
  privacy-policy.html
  terms-and-conditions.html
  disclaimer.html
  thank-you.html
  404.html
  robots.txt  sitemap.xml  favicon.ico
  _headers              Cloudflare Pages: security + cache headers
  _redirects            301s from the old WordPress URLs
  assets/
    css/site.css        design tokens + every component, mobile-first
    js/site.js          nav, sliders, carousels, tabs, dialog, countdown, scrollspy
    img/                33 images
    video/              2 videos

src/                    Astro scaffolding — not yet driving the build
  layouts/BaseLayout.astro
  components/Header.astro, Footer.astro, Analytics.astro
  pages/                empty; astro build will fail until a page lands here

docs/
  MIGRATION.md          step-by-step plan for moving to Astro
  REBUILD-NOTES.md      what changed vs. the WordPress original, and why

astro.config.mjs  package.json  tsconfig.json
```

## Deploy (Cloudflare Pages)

While the site is static HTML:

| Setting | Value |
| --- | --- |
| Build command | *(leave empty)* |
| Build output directory | `public` |

```bash
npx wrangler pages deploy public --project-name=chao-pinhole
```

`_headers` sets a one-year immutable cache on `/assets/*`, so `site.css` and
`site.js` are linked with a `?v=N` query. **Bump that version in every HTML file
when you change either file**, or the change won't reach returning visitors.

After the Astro migration, switch the build command to `npm run astro:build`
and the output directory to `dist`. See `docs/MIGRATION.md`.

## Tracking

GA4 `G-8V0B4FHSPH`, WhatConverts account `141394`, and Meta Pixel
`2717228771967714` — all three ported from the original and present on **every**
page. New pages added after the Astro migration inherit them from
`src/components/Analytics.astro`.

The inline `$wc_leads` bootstrap must stay immediately before `141394.js`.

## No forms

Every conversion path is call, chat, or schedule. There is no form markup, no
form JavaScript, and no form endpoint anywhere in this repo — the Mailgun Pages
Function was removed along with the forms.

- **Call** — `tel:+16265482891`, in the header, the sticky mobile bar, every CTA
  band, and the contact section.
- **Chat** — SellWithChat widget, loaded on every page. It renders its own CTA.
- **Schedule** — the GoHighLevel calendar at `#book`
  (widget `TX1hD6n3spgsECdh6ev9`, auto-sized by `form_embed.js`).

## Before this goes live

Detail in `docs/REBUILD-NOTES.md`; the open items in short:

1. **Open a real chat on mobile.** The invitation bubble is verified clear of
   the fixed call/book bar, but the expanded chat window couldn't be triggered
   locally — confirm its header isn't clipped. The offset rule targets vendor
   element IDs, so re-check it if the widget is ever upgraded.
2. **Confirm the GHL calendar auto-sizes on the real domain.** `form_embed.js`
   is in place but its resize message is domain-gated and didn't fire on
   localhost; the frame falls back to a 600px min-height.
3. **Check whether the GHL calendar redirects to `/thank-you.html`.** That page
   was the form success page and is now otherwise unreachable — wire it up in
   GHL or delete it.
4. **The live site is `noindex, nofollow`** site-wide — looks like a staging
   leftover. This rebuild drops that. Confirm that's intended.
5. **Decide what the offer countdown means.** It currently gives each visitor a
   fresh 24-hour window. If there's a real deadline, set it in `site.js`.
6. **Technology / Financing / Office Tour** were in the original nav but every
   one of those links 404s on the live site and no content exists. They're left
   out of the rebuilt nav.
7. **Re-encode `pst-animation.mp4`** (6.2 MB) before launch.
8. **Referring dentists no longer have a form** — the contact block points them
   at the phone. Decide if that path needs written capture.
