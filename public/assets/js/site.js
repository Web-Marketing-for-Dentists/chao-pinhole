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
     Before / after comparison sliders
     Markup owns a range input; JS only mirrors its value onto the clip width.
     Keyboard + pointer + touch all work through the native input.
     ------------------------------------------------------------------------ */
  function initBeforeAfter() {
    $$('.ba').forEach(function (ba) {
      var after  = $('.ba-after', ba);
      var handle = $('.ba-handle', ba);
      var range  = $('.ba-range', ba);
      var img    = $('.ba-after img', ba);
      if (!after || !range) return;

      function paint() {
        var pct = Number(range.value);
        after.style.width = pct + '%';
        if (handle) handle.style.left = pct + '%';
        range.setAttribute('aria-valuenow', String(Math.round(pct)));
      }

      // The clipped image must stay pinned to the container width, not the clip width
      function sizeImage() {
        if (img) img.style.width = ba.clientWidth + 'px';
      }

      on(range, 'input', paint);
      on(window, 'resize', sizeImage);
      if (img && !img.complete) on(img, 'load', sizeImage);

      sizeImage();
      paint();

      // Dragging anywhere on the image (not just the thumb) feels better on touch
      var dragging = false;
      function moveTo(clientX) {
        var rect = ba.getBoundingClientRect();
        var pct = ((clientX - rect.left) / rect.width) * 100;
        range.value = String(Math.max(0, Math.min(100, pct)));
        paint();
      }
      on(ba, 'pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true;
        ba.setPointerCapture(e.pointerId);
        moveTo(e.clientX);
      });
      on(ba, 'pointermove', function (e) { if (dragging) moveTo(e.clientX); });
      on(ba, 'pointerup', function () { dragging = false; });
      on(ba, 'pointercancel', function () { dragging = false; });
    });
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
     Dialogs
     ------------------------------------------------------------------------ */
  function initDialogs() {
    $$('[data-open-dialog]').forEach(function (trigger) {
      on(trigger, 'click', function (e) {
        var dlg = document.getElementById(trigger.getAttribute('data-open-dialog'));
        if (!dlg || typeof dlg.showModal !== 'function') return;  // let the href fall through
        e.preventDefault();
        dlg.showModal();
      });
    });

    $$('dialog.modal').forEach(function (dlg) {
      $$('[data-close-dialog]', dlg).forEach(function (btn) {
        on(btn, 'click', function () { dlg.close(); });
      });
      // Click the backdrop to dismiss
      on(dlg, 'click', function (e) {
        if (e.target === dlg) dlg.close();
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
    initDialogs();
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
