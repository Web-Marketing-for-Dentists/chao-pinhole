# Rebuild notes — what changed vs. the WordPress original

Source: `https://thepinholeclinic.com/` (WordPress + Elementor + Hello Elementor
child theme), captured from a full view-source dump plus the live site and the
WP REST API.

All body copy, testimonials, study citations, FAQ answers, and legal text are
carried over verbatim. The changes below are structural, not editorial.

## Design tokens taken from the original

Read out of the Elementor kit CSS and confirmed against computed styles on the
live site.

| Token | Value | Where it came from |
| --- | --- | --- |
| `--gold` | `#DD9933` | Elementor `primary` / `accent` |
| `--rose` | `#C04557` | computed bg of the header phone pill |
| `--red` | `#CA0000` | mobile call bar |
| `--ink` | `#2A2B2B` | Elementor `secondary` |
| `--cream` | `#F4DEBE` | Elementor `text` colour, used as the research band |
| `--mist` | `#E5EBF1` | alternating section background |
| `--navy-deep` | `#0D1B2A` | booking section |
| `--black` | `#090B0B` | footer |
| Display face | DM Serif Display | Elementor `primary` typography |
| Body face | Montserrat | Elementor `secondary` / `text` typography |

## What was dropped

| Dropped | Why |
| --- | --- |
| WordPress, Elementor, Hello Elementor | The point of the rebuild. ~1.2 MB of view-source became ~70 KB of HTML. |
| WP Rocket, RocketCDN | No build to optimise; assets are local and cached via `_headers`. |
| Gravity Forms | All three forms removed entirely — see **Forms** below. |
| Header Footer Code Manager | Its three tracking snippets were ported directly — see **Tracking** below. |
| Popup Maker | The two form popups are gone. (A native `<dialog>` for "more reviews" replaced the third, and was itself removed in October 2026.) |
| jQuery, Swiper, the before/after slider plugin | Replaced with ~300 lines of vanilla JS: CSS scroll-snap carousels, a before/after comparison slider (since October 2026, the `BeforeAfterSlider` component from the ppc-sites template). |
| Accessibility OneTap plugin | An overlay widget, not accessibility. Replaced with real semantics: landmarks, skip link, labelled controls, visible focus rings, ARIA tabs/accordion, 44px+ tap targets, `prefers-reduced-motion`. |
| The 38-language translation dropdown | It was the OneTap plugin's machine-translation widget, not real localisation. |
| `login-with-google`, `xmlrpc.php`, feeds, `wp-json` | No WordPress to log into. `_redirects` 301s these to `/`. |

## What changed, and why

### Navigation — the original menu was broken

Every item in the live site's primary nav (`Home`, `About Us`, `Meet the
Doctor`, `Technology`, `Financing`, `Office Tour`, `Pinhole Gum Rejuvenation`,
`Testimonials`, `Gallery`, `Contact Us`) points at a `?page_id=NNNN` URL. **All
ten return HTTP 404.** Only six pages are published in WordPress at all: the
homepage, an older v2/v3 copy of it, and the four legal/utility pages.

The rebuilt nav therefore links to the on-page sections that actually exist:

| Nav item | Target |
| --- | --- |
| Home | `#top` |
| Benefits of Pinhole | `#benefits` (the Pinhole vs. grafting comparison table) |
| Research | `#research` |
| Before & After | `#gallery` |
| Testimonials | `#testimonials` |
| As Seen On TV | `#as-seen-on` (the media-features tabs) |
| Meet the Doctor | `#doctor` |
| FAQ | `#faq` |

**It is a popup at every width**, opened by the hamburger — there is no
horizontal nav bar on desktop any more. The panel is full-bleed below 900px and
a 340px right-aligned card above it, anchored to the bottom of the sticky
header. A generated `.nav-backdrop` button sits behind it, so tapping away
closes the menu; `site.js` also closes on link click (at every width now) and on
Escape.

`text-transform: capitalize` was removed from the nav links — it was rendering
"Benefits **Of** Pinhole" and "Meet **The** Doctor".

**Three original items have no content anywhere on the site and were left
out: Technology, Financing, and Office Tour.** If those pages are wanted, they
need to be written — there is nothing to port.

### Forms — there are none

The original ran three Gravity Forms (contact, patient referral, extend offer).
**All three are gone.** Every conversion path on the site is now call, chat, or
schedule. There is no form markup, no form JavaScript, and no form endpoint.

Removed along with them:

- `functions/api/contact.js` — the Mailgun Pages Function. Nothing POSTs
  anywhere any more, so it was dead code.
- `.env.example` — `MAILGUN_API_KEY` / `MAILGUN_DOMAIN` are no longer needed.
- `initForms()` in `site.js`, and the form styles in section 20 of `site.css`
  (only `.form-note`, which styles the Privacy/Terms links, survives).

`reporting_thepinholeclinic@100marketers.com` will therefore never receive
anything from this site. Leads arrive through the GHL calendar, the chat widget,
and the phone.

Two consequences worth knowing:

- **The referring-dentist path lost its form.** The "Are you a dentist?" block in
  the contact section now says *"Call us to refer a patient"* and links to
  `tel:`. If referrals need to be captured in writing, that needs a channel.
- **`thank-you.html` is now unreachable from the site.** It was the form
  success page. It's kept (with its `/thank-you/` redirect) in case the GHL
  calendar is configured to redirect there after a booking — verify that in GHL,
  and delete the page if not.

### Booking

The GoHighLevel calendar is unchanged — same widget ID
(`TX1hD6n3spgsECdh6ev9`), plus `allow="payment"` and GHL's
`https://link.msgsndr.com/js/form_embed.js`, which listens for the widget's
`postMessage` and sets the iframe height.

Do **not** set a fixed height on that iframe. `.booking-frame iframe` carries a
`min-height: 600px` purely so the frame doesn't collapse before the resize
message arrives; `form_embed.js` grows it from there.

Verified: both `form_embed.js` and the widget load. The auto-resize message did
**not** fire on `localhost` — GHL gates it by domain — so the frame sat at the
600px fallback. **Confirm the calendar sizes itself correctly once this is on
the real domain.**

### Contact — no form, by design

The contact section offers two cards, plus the chat widget that floats over
every page:

| Card | Target |
| --- | --- |
| Call a Gum Rejuvenation Advisor | `tel:+16265482891` |
| Schedule your consultation | `#book` (the GHL calendar) |

The "schedule" card is styled as the primary action.

### Chat

GoHighLevel chat, widget `6ae0f05c8147ba697cbb0bfe`, loaded on every page
before `site.js` through WM4D's hosted loader:

```html
<script defer src="https://ghl-chat.whitney-fad.workers.dev/v1.js"
  data-ghl-widget-id="6ae0f05c8147ba697cbb0bfe"
  data-auto-open="true"
  data-hide-bubble-below="900"></script>
```

It replaced a SellWithChat (ApexChat) widget. The original WordPress site had
no chat at all. Loader source and its full attribute list:
`github.com/Web-Marketing-for-Dentists/ghl-chat` (`README.md`).

What the loader does here:

- Opens the chat once per browser session, 3 seconds after load.
- Appends the landing URL (with gclid/UTMs) to the visitor's first message as
  `[PAGE_URL:…]`.
- **Below 900px** hides GHL's floating bubble, which would otherwise sit on top
  of the fixed call/book bar. The bar gains a third cell, **Chat**
  (`<button data-chat-open>`), which the loader wires to open the widget. 900px
  is the bar's own breakpoint (`56.25em`), so there is always exactly one way
  in: the bar's button on phones, GHL's bubble on desktop.
- While the chat window is open it sets `<html data-chat="open">`;
  `site.css` hides the bar then so it doesn't cover the message box.

Caveat: the auto-open, the bubble hiding and the `[PAGE_URL:…]` tag rely on
undocumented GHL internals (listed in the loader's README). If any of them stop
working, fix it once in `ghl-chat` — every WM4D site picks it up within five
minutes.

### Offer countdown

The original ran a countdown with hard-coded markup and no visible reset logic.
The rebuild gives each visitor a fresh 24-hour window persisted in
`localStorage`, falling back gracefully when storage is blocked. **If the offer
has a real fixed deadline, change `WINDOW_MS`/`deadline` in
`public/assets/js/site.js`** — an evergreen countdown that resets per visitor is
a marketing choice, and should be a deliberate one.

### YouTube embeds

Seven YouTube videos, all behind a click-to-load facade: nothing is requested
from youtube.com until the visitor presses play, and playback then uses
`youtube-nocookie.com`.

- Six in the media-features tabs.
- One vertical Short (`qs59Wb890WE`) in the **inventor strip**, the second
  section, replacing the photo of Dr. Chao that was there. The photo still
  appears in the "Meet the Doctor" section further down and in the `Physician`
  schema — only the second-section instance changed.

The Short is framed 9:16 via `.short-frame` (`aspect-ratio: 9 / 16`), capped at
280px wide on mobile and filling the 320px column on desktop. Poster art is the
Short's own 1080×1920 `oardefault` thumbnail, re-encoded locally to
`dr-chao-short-poster.webp` (39 KB) so the facade needs no third-party request
either.

The facade was used here rather than the raw iframe deliberately: this section
sits near the fold, and a live embed there would pull ~1 MB of third-party
JavaScript into first paint. The supplied `allow` list (including `web-share`)
and `allowfullscreen` are applied to the iframe that replaces the facade on
click — verified.

### Before / after sliders

Ten instances, all built by one component: `BeforeAfterSlider` in `site.js`,
ported from `ppc-sites/templates/before-after-slider-demo.html` (styles are
the `.bas-*` rules, section 11 of `site.css`). Five are the hero, the
3/10/6-year cases and the Symptoms photo; the other five are the gallery.

| Slider | Before (left) | After (right) |
| --- | --- | --- |
| Hero — "14 Years Later" | `ba-sharon-hero-before.webp` | `ba-sharon-hero-after.webp` |
| 3-Year Case | `ba-eliza-before.webp` | `ba-eliza-after.webp` |
| 10-Year Case | `ba-rocio-before.webp` | `ba-rocio-after.webp` |
| 6-Year Case | `ba-rodney-before.webp` | `ba-rodney-after.webp` |
| Symptoms | `ba-czarina-before.webp` | `ba-czarina-after.webp` |
| Gallery ×5 | `gallery-<name>-before.webp` | `gallery-<name>-after.webp` |

**The hero Sharon pair was displayed reversed, and is now `ba-sharon-hero-*`.**
The WordPress filenames were correct: the "before" file shows long teeth with
exposed yellow roots (recession), the "after" file shows full gum coverage. The
original markup wired them crossed, and a rename on 28 Oct 2026 matched the
filenames to that crossed markup, so the hero showed the result as "Before".
Fixed 29 Oct 2026, under new filenames on purpose: `/assets/*` is cached
`immutable` for a year, so swapping contents under the old names would have
kept the reversed pair on screen for anyone who had already visited.
Rule of thumb when checking a pair: the **before** photo shows longer teeth and
exposed root surfaces at the gum line.

Markup is one empty div per slider; `site.js` builds the inside:

```html
<div class="bas-container" data-bas
     data-before="/assets/img/x-before.webp" data-after="/assets/img/x-after.webp"
     data-before-label="Before" data-after-label="After"
     style="--bas-ratio:500/325"
     aria-label="What the comparison shows">
  <noscript><img src="/assets/img/x-after.webp" alt="…"></noscript>
</div>
```

Behaviour kept from the demo: clip-path reveal, white divider with a round grip,
pill labels, and an eased auto-sweep (15% ↔ 85%, 2.4s per pass, 3 round trips)
that stops for good on the first touch, click or key press.

Changes from the demo, all deliberate:

- **Lazy build.** Photos are CSS backgrounds, which a browser fetches as soon
  as the element exists. Each slider is built only when it comes within 400px
  of the viewport, so the ~1.5 MB of slider photos is not fetched up front.
  The two hero photos are `<link rel="preload">`ed in `<head>` instead.
- **Sweep on sight.** The sweep starts when a slider is half on screen;
  otherwise sliders below the fold would finish sweeping unseen. Skipped under
  `prefers-reduced-motion`.
- **Per-slider aspect ratio** via `--bas-ratio`, matching each photo so `cover`
  never crops. The demo hard-codes 4:3. The gallery shares one ratio
  (308/200) so caption rows line up.
- **Pointer events + `touch-action: pan-y`** instead of mouse/touch listeners
  and `touch-action: none`. Dragging sideways moves the divider; swiping
  vertically still scrolls the page.
- **Keyboard and screen readers.** `role="slider"`, focusable, `aria-valuenow`
  tracks the divider. Arrow keys move 2% (Shift 10%), Home/End jump to the
  edges. The container's `aria-label` replaces the `<img alt>` the demo lacks.
- **No-JS fallback.** A `<noscript>` after-photo sits in the reserved box.

### Animated gold CTAs

Every "Call Us" and "Book Your Appointment" button carries `.btn--glow`: a gold
gradient outline that shifts, plus a pulsing glow. 13 buttons in total.

The outline is two background layers rather than a pseudo-element — a solid fill
clipped to the padding box, and `--glow-gradient` clipped to the border box,
showing through the transparent 2px border. No wrapper, and nothing fighting the
button's own background for stacking order.

Three things that are load-bearing:

- **Border width stays at the `.btn` value of 2px.** Glow and non-glow buttons
  sit in the same rows; changing it would make them different heights.
- **The hover rule restates `background`.** `.btn:hover` sets the shorthand and
  would otherwise flatten both layers back to one colour, killing the ring.
- **`.btn--ghost.btn--glow` forces `border-color: transparent`**, because
  `.btn--ghost` sets `currentColor` and would paint over the gradient.

Timing verified by seeking both timelines: `btn-glow-shift` 3s linear sweeps
background-position 0% → 100% (the gradient is symmetrical, so it loops with no
jump); `btn-glow-pulse` 2.4s ease-in-out takes the box-shadow from
`10px / .35` to `26px / .62` and back.

The header's own phone and Book buttons were deliberately **left un-glowed** —
the header is sticky, and a permanently animating element pinned to the top of
every screen is a lot. Easy to extend if wanted: add `btn--glow` to those two.

`prefers-reduced-motion` neutralises both animations via the global rule,
leaving a static gradient ring.

### Before & After gallery

Five cases — Rocio, John, Sharon, Lynda, Cynthia. **Ceasar was removed** at the
client's request (it was `gallery-04.webp`, a 13-year upper-arch result).

Each case is a before/after slider (see above). The only source for these five
was a set of **695x250 composites** with both photos, an arrow and captions
baked in; no originals exist in the repo or the WordPress output. In October
2026 each composite was cropped into a before/after pair with the arrow and
text trimmed off, which leaves **~308x200px per photo**. The grid is sized to
keep them near native width (1 / 2 / 3 columns, max 440px each, last row
centred). They are still small; larger originals from the client would be the
fix.

Names and dates are `<figcaption>` text, and "Individual results may vary" is in
the intro line above the grid (the composites carried it as pixels).

The separate five-across vertical case carousel that used to sit under the
3/10/6-year sliders was **removed entirely**, along with its five images.

### Testimonials — patient videos

In October 2026 the section was retitled **"Join the Hundreds of Happy
Patients"** and its content replaced with four TikTok player embeds
(`tiktok.com/player/v1/…`, autoplay muted, as supplied). The three Google review
cards, the "View more reviews" button and the reviews `<dialog>` (14 older
reviews) were all **removed** at the client's request, along with their CSS and
the dialog JS.

The iframes keep the supplied `src`, `allow` list and `loading="lazy"`. Their
`title`s are short descriptions rather than the supplied TikTok captions, which
were long hashtag strings that screen readers would read aloud. Layout: a
swipeable row on phones, 2-up from 640px, 4-up from 1100px, each 9:16.

The **Rasio "Patient Spotlight"** section and the **"Common Questions"** section
(with `consultation.webp`) were removed at the same time. The FAQ accordion
further down is unaffected.

### Comparison table

The original rendered the Pinhole-vs-grafting comparison three separate times
(a full table for desktop plus two split half-tables for narrow screens), all
three present in the DOM at once. The rebuild uses one semantic `<table>` that
restyles into stacked cards below 640px via `data-label` attributes.

### Mobile header

The original stacked a dark logo strip, a red phone bar, and a white logo +
hamburger bar — all sticky, ~230px of a 812px viewport before any content.

The rebuild keeps the red call bar but moves it outside `<header>` so it scrolls
away, and drops the duplicate logo strip. The sticky header is **88px**. A fixed
bottom bar keeps Call / Book reachable at every scroll position.

## Assets

32 images and 2 videos were pulled from the original CDN
(`a6d2fd1c.delivery.rocketcdn.me`) into `public/assets/`. The one exception was
the patient-spotlight portrait (inlined as base64 in the WordPress output); it
was removed with the spotlight section in October 2026.

Filenames were normalised (`Rodney-K.-before-10-19-2015-scaled.webp` →
`ba-rodney-before.webp`). The originals are ~10 MB total, dominated by
`pst-animation.mp4` at 6.2 MB — worth re-encoding before launch.

## Verified

Checked in-browser at 375px, 768px, and 1440px:

- No horizontal overflow at any width.
- No broken images; no console errors.
- All tap targets ≥44px.
- Nav toggle, tabs (with arrow-key roving tabindex), YouTube facades,
  before/after sliders, carousels, countdown, and accordion all functional.
- Every first-party asset serves without error (remaining console noise is
  third-party DNS in the test sandbox).
- Zero forms and zero dialogs on any page.
- Legal pages, thank-you, and 404 render with correct titles and `noindex`.

## Tracking

The original injected three tags via the Header Footer Code Manager plugin.
All three are ported and present on **every** page (`public/*.html`, and via
`src/components/Analytics.astro` for anything added after the Astro migration):

| Tag | ID | Notes |
| --- | --- | --- |
| GA4 (gtag.js) | `G-8V0B4FHSPH` | |
| WhatConverts | account `141394`, `s.ksrndkehqnwntyxlhgto.com` | The inline `$wc_leads` bootstrap **must** stay before `141394.js` |
| Meta Pixel | `2717228771967714` | `init` + `PageView`, plus the `<noscript>` fallback |

Verified loading in-browser: `gtag` and `fbq` defined, `dataLayer` populated,
`facebook.com/tr/?ev=PageView` fired, and WhatConverts installed its full
global set (`wc_form_*`, `wc_transaction_*`) and posted to
`p.ksrndkehqnwntyxlhgto.com/session/`.

The original's WP Rocket `type="text/rocketlazyloadscript"` wrappers were
removed — those were WP Rocket's deferral mechanism and mean nothing without it.
The tags now load normally (gtag `async`, WhatConverts `defer`).

**One thing to test live:** the forms submit via `fetch`, not a native page
navigation. `preventDefault()` doesn't stop WhatConverts' own submit listener
from firing, so form capture *should* work — but confirm with a real test
submission that the lead lands in WhatConverts before relying on it.

## Not done

- Image re-encoding and responsive `srcset`.
- `Technology`, `Financing`, `Office Tour` pages (no source content exists).

## One more thing about the original

The live site serves `<meta name="robots" content="noindex, nofollow">` on the
homepage — HFCM "Snippet # 1: No Index tag". **The whole site is currently
deindexed.** That looks like a staging leftover that was never removed. This
rebuild does *not* carry it over: `index.html` is indexable, and only the
legal/utility pages carry `noindex`. Worth confirming that's intended.
