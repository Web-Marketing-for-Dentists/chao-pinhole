/* ==========================================================================
   Chao Pinhole® — site behaviour
   No dependencies. Every widget degrades to usable markup without JS.
   ========================================================================== */
(function () {
  'use strict';

  var on = function (el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); };
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ------------------------------------------------------------------------
     Header height → CSS var, so anchor scrolling clears the sticky header
     ------------------------------------------------------------------------ */
  function syncHeaderHeight() {
    var header = $('.site-header');
    if (!header) return;
    document.documentElement.style.setProperty('--header-h', header.offsetHeight + 'px');
  }

  /* ------------------------------------------------------------------------
     Mobile navigation
     ------------------------------------------------------------------------ */
  function initNav() {
    var toggle = $('.nav-toggle');
    var nav    = $('#primary-nav');
    if (!toggle || !nav) return;

    var backdrop = null;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      nav.setAttribute('data-open', String(open));
      toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');

      if (open && !backdrop) {
        backdrop = document.createElement('button');
        backdrop.type = 'button';
        backdrop.className = 'nav-backdrop';
        backdrop.setAttribute('aria-label', 'Close menu');
        backdrop.addEventListener('click', function () { setOpen(false); toggle.focus(); });
        document.body.appendChild(backdrop);
      } else if (!open && backdrop) {
        backdrop.remove();
        backdrop = null;
      }
    }

    on(toggle, 'click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    // The menu is a popup at every width now, so always close after a choice.
    $$('a', nav).forEach(function (a) {
      on(a, 'click', function () { setOpen(false); });
    });

    on(document, 'keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setOpen(false);
        toggle.focus();
      }
    });

    // Keep the panel anchored correctly if the header height changes.
    on(window, 'resize', function () { if (backdrop) setOpen(false); });
  }

  /* ------------------------------------------------------------------------
     Before / after comparison sliders — BeforeAfterSlider
     Ported from ppc-sites/templates/before-after-slider-demo.html. The DOM it
     builds, the clip-path reveal and the eased auto-sweep (N sweeps, stops
     the moment the visitor touches it) are the demo's.

     Changes from the demo, all deliberate:
     - Pointer events with pointer capture replace the separate mouse + touch
       listeners on window. Same behaviour, and with touch-action: pan-y a
       vertical swipe still scrolls the page (the browser cancels the drag).
     - Keyboard: it is a focusable role="slider"; arrows move 2%
       (Shift = 10%), Home/End jump to the edges.
     - Built from data-* attributes on the markup, and only once the slider
       nears the viewport, so ~1.5 MB of photos is not fetched up front.
     - The auto-sweep waits until the slider is half on screen (below-the-fold
       sliders would otherwise finish sweeping unseen), and is skipped under
       prefers-reduced-motion.
     ------------------------------------------------------------------------ */
  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function BeforeAfterSlider(el, options) {
    var opts = Object.assign(
      {
        beforeImage: '',
        afterImage: '',
        beforeLabel: 'Before',
        afterLabel: 'After',
        startPosition: 50,
        autoSlide: true,
        autoSlideSpeed: 1400,
        autoSlideSweeps: 3,
        autoSlideRange: [15, 85]
      },
      options || {}
    );

    this.el = el;
    this.opts = opts;
    this.position = clamp(opts.startPosition, 0, 100);
    this.dragging = false;
    this.autoTimer = null;
    this.stopped = false;

    this._buildDom();
    this._bindEvents();
    this.setPosition(this.position);

    if (opts.autoSlide) {
      this._startAutoSlide();
    }
  }

  BeforeAfterSlider.prototype._buildDom = function () {
    var el = this.el;
    el.classList.add('bas-container');
    el.innerHTML = '';   // drops the <noscript> fallback

    var after = document.createElement('div');
    after.className = 'bas-image bas-image--after';
    after.style.backgroundImage = 'url("' + this.opts.afterImage + '")';

    var afterLabel = document.createElement('span');
    afterLabel.className = 'bas-label bas-label--after';
    afterLabel.textContent = this.opts.afterLabel;
    after.appendChild(afterLabel);

    var before = document.createElement('div');
    before.className = 'bas-image bas-image--before';
    before.style.backgroundImage = 'url("' + this.opts.beforeImage + '")';

    var beforeLabel = document.createElement('span');
    beforeLabel.className = 'bas-label bas-label--before';
    beforeLabel.textContent = this.opts.beforeLabel;
    before.appendChild(beforeLabel);

    var handle = document.createElement('div');
    handle.className = 'bas-handle';
    var grip = document.createElement('div');
    grip.className = 'bas-handle-grip';
    handle.appendChild(grip);

    el.appendChild(after);
    el.appendChild(before);
    el.appendChild(handle);

    el.setAttribute('role', 'slider');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-valuemin', '0');
    el.setAttribute('aria-valuemax', '100');

    this.beforeEl = before;
    this.handleEl = handle;
  };

  BeforeAfterSlider.prototype._bindEvents = function () {
    var self = this;
    var el = this.el;

    on(el, 'pointerdown', function (e) {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      self._stopAutoSlide();
      self.dragging = true;
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* already released */ }
      self._updateFromEvent(e);
    });
    on(el, 'pointermove', function (e) {
      if (!self.dragging) return;
      self._updateFromEvent(e);
    });
    on(el, 'pointerup', function () { self.dragging = false; });
    on(el, 'pointercancel', function () { self.dragging = false; });

    on(el, 'click', function () { self._stopAutoSlide(); });

    on(el, 'keydown', function (e) {
      var step = e.shiftKey ? 10 : 2;
      var next;
      switch (e.key) {
        case 'ArrowLeft':  case 'ArrowDown': next = self.position - step; break;
        case 'ArrowRight': case 'ArrowUp':   next = self.position + step; break;
        case 'Home': next = 0;   break;
        case 'End':  next = 100; break;
        default: return;
      }
      e.preventDefault();
      self._stopAutoSlide();
      self.setPosition(next);
    });
  };

  BeforeAfterSlider.prototype._updateFromEvent = function (e) {
    var rect = this.el.getBoundingClientRect();
    var pct = ((e.clientX - rect.left) / rect.width) * 100;
    this.setPosition(pct);
  };

  BeforeAfterSlider.prototype.setPosition = function (pct) {
    this.position = clamp(pct, 0, 100);
    this.beforeEl.style.clipPath = 'inset(0 ' + (100 - this.position) + '% 0 0)';
    this.handleEl.style.left = this.position + '%';
    this.el.setAttribute('aria-valuenow', String(Math.round(this.position)));
  };

  BeforeAfterSlider.prototype._startAutoSlide = function () {
    if (this.stopped) return;   // the visitor got there first
    var self = this;
    var range = this.opts.autoSlideRange;
    var speed = this.opts.autoSlideSpeed;
    var sweepsRemaining = this.opts.autoSlideSweeps * 2;
    var goingRight = true;

    function animateStep(fromPct, toPct, duration, onDone) {
      var start = null;

      function frame(timestamp) {
        if (self.stopped) return;
        if (start === null) start = timestamp;
        var elapsed = timestamp - start;
        var t = clamp(elapsed / duration, 0, 1);
        var eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        self.setPosition(fromPct + (toPct - fromPct) * eased);

        if (t < 1) {
          self.autoTimer = requestAnimationFrame(frame);
        } else if (onDone) {
          onDone();
        }
      }

      self.autoTimer = requestAnimationFrame(frame);
    }

    function next() {
      if (self.stopped || sweepsRemaining <= 0) {
        self.autoTimer = null;
        return;
      }
      var from = goingRight ? range[0] : range[1];
      var to = goingRight ? range[1] : range[0];
      animateStep(from, to, speed, function () {
        goingRight = !goingRight;
        sweepsRemaining -= 1;
        next();
      });
    }

    this.setPosition(range[0]);
    goingRight = true;
    next();
  };

  BeforeAfterSlider.prototype._stopAutoSlide = function () {
    if (this.stopped) return;
    this.stopped = true;
    if (this.autoTimer) {
      cancelAnimationFrame(this.autoTimer);
      this.autoTimer = null;
    }
  };

  /* Markup:
     <div class="bas-container" data-bas
          data-before="/img/x-before.webp" data-after="/img/x-after.webp"
          data-before-label="Before" data-after-label="After"
          style="--bas-ratio:500/325" aria-label="What the photos show">
       <noscript><img src="/img/x-after.webp" alt="…"></noscript>
     </div> */
  function initBeforeAfter() {
    var els = $$('[data-bas]');
    if (!els.length) return;

    var reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function build(el) {
      var d = el.dataset;
      el._bas = new BeforeAfterSlider(el, {
        beforeImage: d.before,
        afterImage: d.after,
        beforeLabel: d.beforeLabel || 'Before',
        afterLabel: d.afterLabel || 'After',
        autoSlide: false,          // started separately, once it is on screen
        autoSlideSpeed: 2400,      // the demo's own settings
        autoSlideSweeps: 3
      });
    }

    function sweep(el) {
      if (!reduceMotion && el._bas) el._bas._startAutoSlide();
    }

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { build(el); sweep(el); });
      return;
    }

    var sweepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        sweepObserver.unobserve(entry.target);
        sweep(entry.target);
      });
    }, { threshold: 0.5 });

    var buildObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        buildObserver.unobserve(entry.target);
        build(entry.target);
        sweepObserver.observe(entry.target);
      });
    }, { rootMargin: '400px 0px' });

    els.forEach(function (el) { buildObserver.observe(el); });
  }

  /* ------------------------------------------------------------------------
     Carousels (native scroll-snap; buttons just nudge scrollLeft)
     ------------------------------------------------------------------------ */
  function initCarousels() {
    $$('.carousel').forEach(function (carousel) {
      var track = $('.carousel-track', carousel);
      var prev  = $('[data-carousel="prev"]', carousel);
      var next  = $('[data-carousel="next"]', carousel);
      if (!track) return;

      function step() {
        var first = track.firstElementChild;
        return first ? first.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
      }
      function updateButtons() {
        var max = track.scrollWidth - track.clientWidth - 2;
        if (prev) prev.disabled = track.scrollLeft <= 2;
        if (next) next.disabled = track.scrollLeft >= max;
      }

      on(prev, 'click', function () { track.scrollBy({ left: -step(), behavior: 'smooth' }); });
      on(next, 'click', function () { track.scrollBy({ left:  step(), behavior: 'smooth' }); });
      on(track, 'scroll', updateButtons, { passive: true });
      on(window, 'resize', updateButtons);
      updateButtons();
    });
  }

  /* ------------------------------------------------------------------------
     Tabs (media features). Roving tabindex + arrow keys, per WAI-ARIA.
     ------------------------------------------------------------------------ */
  function initTabs() {
    $$('[data-tabs]').forEach(function (root) {
      var tabs   = $$('[role="tab"]', root);
      var panels = $$('[role="tabpanel"]', root);
      if (!tabs.length) return;

      function select(index, focus) {
        tabs.forEach(function (tab, i) {
          var on_ = i === index;
          tab.setAttribute('aria-selected', String(on_));
          tab.tabIndex = on_ ? 0 : -1;
          if (panels[i]) panels[i].hidden = !on_;
        });
        if (focus) tabs[index].focus();
      }

      tabs.forEach(function (tab, i) {
        on(tab, 'click', function () { select(i); });
        on(tab, 'keydown', function (e) {
          var last = tabs.length - 1;
          var next = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i === last ? 0 : i + 1;
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i === 0 ? last : i - 1;
          else if (e.key === 'Home') next = 0;
          else if (e.key === 'End') next = last;
          if (next !== null) { e.preventDefault(); select(next, true); }
        });
      });

      select(0);
    });
  }

  /* ------------------------------------------------------------------------
     YouTube click-to-load facade — nothing hits youtube.com until asked
     ------------------------------------------------------------------------ */
  function initYouTubeFacades() {
    $$('.yt-facade').forEach(function (btn) {
      on(btn, 'click', function () {
        var id = btn.getAttribute('data-video');
        if (!id) return;
        var iframe = document.createElement('iframe');
        iframe.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0';
        iframe.title = btn.getAttribute('data-title') || 'Video';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
        iframe.allowFullscreen = true;
        iframe.loading = 'lazy';
        btn.replaceWith(iframe);
      });
    });
  }

  /* ------------------------------------------------------------------------
     Offer countdown — resets to a fresh window per visitor, persisted locally
     ------------------------------------------------------------------------ */
  function initCountdown() {
    var wrap = $('#offer-countdown');
    if (!wrap) return;

    var WINDOW_MS = 24 * 60 * 60 * 1000;
    var KEY = 'cp.offerDeadline';
    var deadline;

    try {
      var stored = window.localStorage.getItem(KEY);
      deadline = stored ? Number(stored) : 0;
      if (!deadline || deadline < Date.now()) {
        deadline = Date.now() + WINDOW_MS;
        window.localStorage.setItem(KEY, String(deadline));
      }
    } catch (err) {
      deadline = Date.now() + WINDOW_MS;   // private mode / storage blocked
    }

    var h = $('[data-unit="h"] b', wrap);
    var m = $('[data-unit="m"] b', wrap);
    var s = $('[data-unit="s"] b', wrap);
    var pad = function (n) { return String(n).padStart(2, '0'); };

    function tick() {
      var left = Math.max(0, deadline - Date.now());
      var total = Math.floor(left / 1000);
      if (h) h.textContent = pad(Math.floor(total / 3600));
      if (m) m.textContent = pad(Math.floor((total % 3600) / 60));
      if (s) s.textContent = pad(total % 60);
    }

    tick();
    setInterval(tick, 1000);
  }

  /* ------------------------------------------------------------------------
     Scrollspy for the primary nav
     ------------------------------------------------------------------------ */
  function initScrollSpy() {
    var links = $$('#primary-nav a[href^="#"]');
    if (!links.length || !('IntersectionObserver' in window)) return;

    var byId = {};
    var targets = [];
    links.forEach(function (a) {
      var el = document.getElementById(a.getAttribute('href').slice(1));
      if (el) { byId[el.id] = a; targets.push(el); }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var link = byId[entry.target.id];
        if (link) link.setAttribute('aria-current', 'page');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });

    targets.forEach(function (t) { observer.observe(t); });
  }

  /* ------------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------------ */
  function boot() {
    syncHeaderHeight();
    initNav();
    initBeforeAfter();
    initCarousels();
    initTabs();
    initYouTubeFacades();
    initCountdown();
    initScrollSpy();
    on(window, 'resize', syncHeaderHeight);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
