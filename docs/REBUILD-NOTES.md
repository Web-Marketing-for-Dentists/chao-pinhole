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
| Popup Maker | The two form popups are gone; the "more reviews" popup is a native `<dialog>`. |
| jQuery, Swiper, the before/after slider plugin | Replaced with ~300 lines of vanilla JS: CSS scroll-snap carousels, a `range`-input comparison slider. |
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

`//sellwithchat.com/scripts/invitation.ashx?company=thepinholeclinic`, loaded on
every page before `site.js`. The widget renders its own CTA, so there is no chat
card in the contact section and nothing to style.

The original WordPress site had **no chat widget at all** — this is new.

Verified loading: the script resolves and chains out to
`invitation.apexchat.com` and `v2.vialivechat.com` (SellWithChat is an ApexChat
white-label), so it initialises rather than just 200-ing.

The snippet is protocol-relative (`//sellwithchat.com/...`) exactly as supplied.
On the live HTTPS domain that resolves to HTTPS.

**It collided with the fixed mobile call/book bar.** Both the invitation bubble
(`#apexchat_prechat_invitation_wrapper`) and the chat window
(`#apexchat_dompopup_chatwindow_frame`) anchor to `bottom: 0` at
`z-index: 9999999`, landing on top of the bar — the agent avatar sat over the
"Book Now" button. Section 21 of `site.css` lifts both by `--mobile-cta-h`
below the 900px breakpoint and resets them to `bottom: 0` above it, where there
is no bar. Measured overlap after the fix: 0px.

Two caveats on that fix:

- It targets **vendor element IDs**. If the widget is swapped or upgraded, re-check
  those selectors — the rule fails silently if the IDs change.
- Only the **invitation bubble** state could be tested here. The expanded chat
  window never rendered (it needs a live agent session), so its `max-height`
  clamp is unverified. Open a real chat on mobile once this is live and confirm
  the window header isn't pushed off the top of the screen.

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

Five instances. **Which photo sits on which side is not derivable from the
filenames** — check the rendered page, not the `src`.

| Slider | Left ("Before") | Right |
| --- | --- | --- |
| Hero — "14 Years Later" | `ba-sharon-after.webp` | `ba-sharon-before.webp` |
| 3-Year Case | `ba-eliza-before.webp` | `ba-eliza-after.webp` |
| 10-Year Case | `ba-rocio-before.webp` | `ba-rocio-after.webp` |
| 6-Year Case | `ba-rodney-before.webp` | `ba-rodney-after.webp` |
| Symptoms | `ba-czarina-before.webp` | `ba-czarina-after.webp` |

The hero looks inverted and is not. **The Sharon pair's CDN filenames are
mislabelled at source**, and the original WordPress site compensated the same
way — its slider markup put `Sharon-H.-14-years-after01.webp` in the
`bafg-before-label="Before"` slot. This arrangement was confirmed on screen by
the client. Do not "fix" it to match the filenames.

The other four pairs have unambiguous names (`-before-1` vs `-35-months-after`)
and are wired the obvious way.

Watch the class name too: `.ba-after` is the *clipped overlay*, and because it
is `position: absolute` with `width` and `left: 0` it covers the **left** half
of the frame. The bare `<img>` underneath shows through on the right. The name
describes layering, not chronology — reading it as chronology inverts the
comparison, and did on four sliders until it was caught.

Each slider's `alt` text describes its **side**, matching the visible label, so
alt stays put when images are swapped.

#### Idle sweep — hero only, CSS only

The hero divider animates back and forth to advertise that it is draggable:
`ba-sweep-clip` / `ba-sweep-handle`, 4s `ease-in-out` infinite — **2 seconds per
pass**, 4s round trip. Verified by seeking the timeline: 8% at 0ms, 92% at
2000ms, back to 8% at 4000ms, clip and handle in sync at every offset.

It is **opt-in via `.ba--animated`, and only the hero carries that class.** The
four sliders below the fold stay parked at the 50% `site.js` sets — five
sliders animating forever is noise, and they remain fully draggable (verified
at 20% and 75%).

Two keyframe sets rather than one animated custom property, so no `@property`
support is needed. It travels 8% → 92% rather than 0% → 100% because the handle
is a 44px circle centred on its position; at the exact edges half of it would be
clipped by the frame's `overflow: hidden`.

Interaction handling, also pure CSS:

- `:hover` (pointer devices only) → `animation-play-state: paused`, so the
  comparison can be read.
- `:active` and `:focus-within` → `animation: none`. Animations outrank inline
  styles in the cascade, so dropping the animation hands control back to the
  inline `width`/`left` that `site.js` writes — the visitor's position sticks.
  Pressing the range focuses it, and that focus outlives the drag.

**Known limitation:** pure CSS cannot remember that an interaction happened, so
the sweep resumes if the visitor clicks away and the range loses focus. Making
it permanent needs one line of JS (set a class on `input`), which was out of
scope.

`prefers-reduced-motion: reduce` neutralises the sweep via the global rule in
section 2, leaving the divider at 50%.

The sweep also means the range's `aria-valuenow` (50) does not track the
animated position. That is intentional — the motion is a decorative affordance,
and the real value only changes when someone moves it.

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

It was a horizontal scroll carousel showing four at a time; it is now a grid:
one column on mobile, two from 900px. Three reasons:

1. Each source image is a **695x250 panorama** with the before/after pair,
   dates and patient name already baked in. The carousel rendered them ~264px
   wide, which made all of that unreadable. The grid gives each ~540px.
2. Horizontal scroll hid the majority of cases behind an affordance people miss.
3. Names and dates are now real `<figcaption>` text rather than only pixels
   inside a JPEG, so they are selectable and available to screen readers.

The separate five-across vertical case carousel that used to sit under the
3/10/6-year sliders was **removed entirely**, along with its five images.

### Google reviews

The four original testimonials were replaced with three current Google reviews
(Scotch Crisostomo, Pearson Nibley, Ginger de Paris), each with an avatar, the
client-supplied bold emphasis preserved, and a "View review on Google" link out
to the specific review.

Avatars were supplied as 450x450 PNGs at 231-328 KB each; re-encoded to 160px
webp at ~5-6 KB. The grid is 1 / 2 / 3 columns.

The "View more reviews" dialog with the 14 older reviews was **kept** — it was
not part of the replacement request, and it is additional social proof.

**One thing to check:** Pearson's review says "the photos to prove it below!"
and describes a top and bottom row of photos. Those photos live in his Google
review, not on this page, so on-site that sentence points at nothing. The text
is reproduced verbatim as supplied. Either trim that clause or add his photos.

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
(`a6d2fd1c.delivery.rocketcdn.me`) into `public/assets/`. The one exception is
the patient-spotlight portrait, which was inlined as a base64 data URI in the
WordPress output and was extracted to `public/assets/img/rasio-patient.jpg`.

Filenames were normalised (`Rodney-K.-before-10-19-2015-scaled.webp` →
`ba-rodney-before.webp`). The originals are ~10 MB total, dominated by
`pst-animation.mp4` at 6.2 MB — worth re-encoding before launch.

## Verified

Checked in-browser at 375px, 768px, and 1440px:

- No horizontal overflow at any width.
- No broken images; no console errors.
- All tap targets ≥44px.
- Nav toggle, tabs (with arrow-key roving tabindex), YouTube facades, the
  reviews dialog, before/after sliders, carousels, countdown, and accordion all
  functional.
- Every first-party asset serves without error (remaining console noise is
  third-party DNS in the test sandbox).
- Zero forms on any page; only the reviews `<dialog>` remains.
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
