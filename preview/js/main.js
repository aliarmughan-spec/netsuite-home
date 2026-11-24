/* Header: sticky scroll state + responsive nav drawer */
(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var nav = document.getElementById("primary-nav");
  var toggle = header && header.querySelector(".nav-toggle");
  if (!header) return;

  /* ---- Scroll state ---------------------------------------------
     A 1px sentinel at the top of the page is observed; once it leaves
     the viewport the header gets .is-scrolled (shadow + compact height).
     IntersectionObserver avoids running work on every scroll event. */
  var SCROLL_OFFSET = 8;
  var sentinel = document.createElement("div");
  sentinel.setAttribute("aria-hidden", "true");
  sentinel.style.cssText = "position:absolute;top:" + SCROLL_OFFSET + "px;left:0;width:1px;height:1px;pointer-events:none;";
  document.body.prepend(sentinel);

  function setScrolled(on) {
    header.classList.toggle("is-scrolled", on);
    syncNavTop();
  }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      setScrolled(!entries[0].isIntersecting);
    }).observe(sentinel);
  } else {
    var onScroll = function () { setScrolled(window.scrollY > SCROLL_OFFSET); };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---- Mobile / tablet drawer ----------------------------------- */
  var mq = window.matchMedia("(max-width: 1199px)");

  // Drawer is anchored under the header; header height changes with scroll state.
  function syncNavTop() {
    if (!nav) return;
    // wait for the height transition to settle before measuring
    window.requestAnimationFrame(function () {
      nav.style.setProperty("--nav-top", header.getBoundingClientRect().bottom + "px");
    });
  }
  header.addEventListener("transitionend", syncNavTop);

  function setOpen(open) {
    if (!nav || !toggle) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.documentElement.style.overflow = open ? "hidden" : "";
    if (open) {
      syncNavTop();
      var first = nav.querySelector("a");
      if (first) first.focus({ preventScroll: true });
    }
  }

  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        setOpen(false);
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (nav.classList.contains("is-open") && !header.contains(e.target)) setOpen(false);
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false);
    });
    // Keep keyboard focus inside the open menu: Tab past the last item closes it
    // instead of moving focus to the scroll-locked page behind.
    header.addEventListener("focusout", function (e) {
      if (nav.classList.contains("is-open") && e.relatedTarget && !header.contains(e.relatedTarget)) {
        setOpen(false);
      }
    });
    // Leaving the drawer breakpoint closes it so desktop never inherits locked scroll.
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () {
      setOpen(false);
    });
  }

  syncNavTop();
})();

/* Shared helpers */
var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
// restart a one-shot CSS animation on an element
function fresh(el) { el.classList.remove("is-fresh"); void el.offsetWidth; el.classList.add("is-fresh"); }
function $$(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

/* ---- Placeholder links (href="#") stay put instead of jumping to the top of the page */
document.addEventListener("click", function (e) {
  var a = e.target.closest && e.target.closest('a[href="#"]');
  if (a) e.preventDefault();
});

/* ---- Tabs (services + FAQ): WAI-ARIA tabs with arrow-key support and a sliding "ink" pill */
(function () {
  "use strict";
  $$("[data-tabs]").forEach(function (root) {
    var tabs = $$('[role="tab"]', root);
    if (!tabs.length) return;
    var list = tabs[0].parentElement;
    var ink = null;

    if (list.classList.contains("services__tablist")) {
      ink = document.createElement("span");
      ink.className = "tab-ink";
      ink.setAttribute("aria-hidden", "true");
      list.prepend(ink);
      list.classList.add("has-ink");
    }

    function moveInk(tab, instant) {
      if (!ink) return;
      if (instant) ink.style.transition = "none";
      ink.style.width = tab.offsetWidth + "px";
      ink.style.transform = "translateX(" + tab.offsetLeft + "px)";
      if (instant) { ink.getBoundingClientRect(); ink.style.transition = ""; }
    }

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (!panel) return;
        if (on) {
          panel.hidden = false;
          if (!REDUCED) { panel.classList.remove("is-entering"); panel.getBoundingClientRect(); panel.classList.add("is-entering"); }
        } else {
          panel.hidden = true;
        }
      });
      moveInk(tab);
      if (focus) {
        tab.focus();
        // keep the active tab visible when the tab bar scrolls horizontally (tablet/mobile)
        if (list.scrollWidth > list.clientWidth) {
          list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: REDUCED ? "auto" : "smooth" });
        }
      }
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () { select(tab, true); });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) { e.preventDefault(); select(next, true); }
      });
    });

    var current = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0] || tabs[0];
    moveInk(current, true);
    window.addEventListener("resize", function () {
      var cur = tabs.filter(function (t) { return t.getAttribute("aria-selected") === "true"; })[0];
      if (cur) moveInk(cur, true);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { moveInk(current, true); });
  });
})();

/* ---- Accordions (solutions, go-live timeline, FAQ): one item open at a time, animated height */
(function () {
  "use strict";
  $$("[data-accordion]").forEach(function (root) {
    var triggers = $$("[aria-controls][aria-expanded]", root);

    function setItem(btn, open) {
      var panel = document.getElementById(btn.getAttribute("aria-controls"));
      var item = btn.closest("[class*='__item']");
      if (!panel) return;
      btn.setAttribute("aria-expanded", String(open));
      if (item) item.classList.toggle("is-open", open);

      if (REDUCED) { panel.hidden = !open; return; }
      if (open) {
        panel.hidden = false;
        panel.classList.add("is-collapsing");      // start at 0fr …
        panel.getBoundingClientRect();
        panel.classList.remove("is-collapsing");   // … and grow to 1fr
      } else if (!panel.hidden) {
        panel.classList.add("is-collapsing");
        var done = function (e) {
          if (e && e.target !== panel) return;
          panel.removeEventListener("transitionend", done);
          if (btn.getAttribute("aria-expanded") === "false") panel.hidden = true;
          panel.classList.remove("is-collapsing");
        };
        panel.addEventListener("transitionend", done);
        window.setTimeout(done, 450); // fallback if transitionend never fires
      }
    }

    // Optional: the open item swaps a companion image (solutions screenshot, go-live photo)
    var mediaSel = root.getAttribute("data-media-target");
    var media = mediaSel ? document.querySelector(mediaSel) : null;
    if (media) {
      // warm the cache so swaps are instant
      $$("[data-media-src]", root).forEach(function (it) { var i = new Image(); i.src = it.getAttribute("data-media-src"); });
    }
    function swapMedia(item) {
      if (!media || !item) return;
      var src = item.getAttribute("data-media-src");
      if (!src || media.getAttribute("src") === src) return;
      var apply = function () {
        media.src = src;
        media.alt = item.getAttribute("data-media-alt") || "";
        media.classList.remove("is-swapping");
        fresh(media);
      };
      if (REDUCED) { apply(); return; }
      media.classList.add("is-swapping");
      window.setTimeout(apply, 180);
    }

    triggers.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var willOpen = btn.getAttribute("aria-expanded") !== "true";
        if (willOpen && root.getAttribute("data-accordion") === "single") {
          triggers.forEach(function (other) { if (other !== btn && other.getAttribute("aria-expanded") === "true") setItem(other, false); });
        }
        setItem(btn, willOpen);
        if (willOpen) swapMedia(btn.closest("[data-media-src]"));
      });
    });
  });
})();

/* ---- Scroll-snap carousels (awards, Clutch): pagination dots + prev/next state */
(function () {
  "use strict";
  $$("[data-carousel]").forEach(function (root) {
    var track = root.querySelector(".carousel__track");
    var dotsEl = root.querySelector("[data-carousel-dots]");
    var prev = root.querySelector("[data-carousel-prev]");
    var next = root.querySelector("[data-carousel-next]");
    if (!track) return;
    var pages = 1;

    function pageWidth() { return track.clientWidth || 1; }
    function currentPage() { return Math.round(track.scrollLeft / pageWidth()); }
    function go(page) {
      track.scrollTo({ left: Math.max(0, Math.min(page, pages - 1)) * pageWidth(), behavior: REDUCED ? "auto" : "smooth" });
    }

    function build() {
      pages = Math.max(1, Math.ceil((track.scrollWidth - 4) / pageWidth()));
      if (dotsEl) {
        dotsEl.textContent = "";
        if (pages > 1) {
          for (var i = 0; i < pages; i++) {
            var b = document.createElement("button");
            b.type = "button";
            b.className = "carousel__dot";
            b.setAttribute("aria-label", "Page " + (i + 1) + " of " + pages);
            b.addEventListener("click", go.bind(null, i));
            dotsEl.appendChild(b);
          }
        }
      }
      sync();
    }

    function sync() {
      var p = currentPage();
      if (dotsEl) $$(".carousel__dot", dotsEl).forEach(function (d, i) { d.setAttribute("aria-current", String(i === p)); });
      var max = track.scrollWidth - track.clientWidth;
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft >= max - 2;
    }

    if (prev) prev.addEventListener("click", function () { track.scrollBy({ left: -pageWidth(), behavior: REDUCED ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { track.scrollBy({ left: pageWidth(), behavior: REDUCED ? "auto" : "smooth" }); });

    var ticking = false;
    track.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(function () { ticking = false; sync(); }); }
    }, { passive: true });
    var t;
    window.addEventListener("resize", function () { window.clearTimeout(t); t = window.setTimeout(build, 150); });
    window.addEventListener("load", build);
    build();
  });
})();

/* ---- Industries marquee: clone each row once so the CSS loop is seamless */
(function () {
  "use strict";
  if (REDUCED) return; // reduced motion: rows stay static and wrap (see CSS), no duplicates
  $$("[data-marquee] .marquee__row").forEach(function (row) {
    $$(":scope > li", row).forEach(function (li) {
      var clone = li.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      $$("a, button", clone).forEach(function (el) { el.tabIndex = -1; });
      row.appendChild(clone);
    });
    row.classList.add("is-looping");
  });
})();

/* ---- Testimonials: the active card expands; hover (desktop), focus or click another to switch */
(function () {
  "use strict";
  var grid = document.querySelector("[data-testimonials]");
  if (!grid) return;
  var cards = $$(".t-card", grid);
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");

  function activate(i) {
    cards.forEach(function (card, k) {
      var on = k === i;
      card.classList.toggle("is-active", on);
      var hit = card.querySelector(".t-card__hit");
      if (hit) hit.setAttribute("aria-pressed", String(on));
    });
    grid.setAttribute("data-active", String(i));
  }

  cards.forEach(function (card, i) {
    var hit = card.querySelector(".t-card__hit");
    if (!hit) return;
    hit.addEventListener("click", function () { activate(i); });
    hit.addEventListener("focus", function () { activate(i); });
    // short hover intent so sweeping the pointer across the row doesn't flick between cards
    var t;
    card.addEventListener("mouseenter", function () { if (canHover.matches) t = window.setTimeout(function () { activate(i); }, 140); });
    card.addEventListener("mouseleave", function () { window.clearTimeout(t); });
  });
  activate(0);
})();

/* ---- Case studies: hovering, focusing or clicking a client logo shows its story in the large card */
(function () {
  "use strict";
  var root = document.querySelector("[data-cases]");
  if (!root) return;
  var img = root.querySelector(".case-feature img");
  var play = root.querySelector("[data-case-play]");
  var tiles = $$(".cases__tile", root);
  if (!img || !tiles.length) return;
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)");
  var timer;

  // preload cards once the section is near, so swaps are instant
  var warm = function () { tiles.forEach(function (t) { var i = new Image(); i.src = t.getAttribute("data-card"); }); };
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (e, obs) { if (e[0].isIntersecting) { warm(); obs.disconnect(); } }, { rootMargin: "400px" });
    io.observe(root);
  } else { warm(); }

  function show(tile) {
    var src = tile.getAttribute("data-card");
    tiles.forEach(function (t) { t.setAttribute("aria-pressed", String(t === tile)); });
    if (play) {
      var title = tile.getAttribute("data-name") + " case study";
      play.setAttribute("data-video-title", title);
      play.setAttribute("aria-label", "Play video: " + title);
    }
    if (img.getAttribute("src") === src) return;
    window.clearTimeout(timer);
    var apply = function () { img.src = src; img.alt = tile.getAttribute("data-alt") || ""; img.classList.remove("is-swapping"); fresh(img); };
    if (REDUCED) { apply(); return; }
    img.classList.add("is-swapping");
    timer = window.setTimeout(apply, 160);
  }

  tiles.forEach(function (tile) {
    tile.addEventListener("click", function () { show(tile); });
    tile.addEventListener("focus", function () { show(tile); });
    tile.addEventListener("mouseenter", function () { if (canHover.matches) show(tile); });
  });
})();

/* ---- Video dialog for every play button */
(function () {
  "use strict";
  var dialog = document.getElementById("video-dialog");
  if (!dialog || typeof dialog.showModal !== "function") return;
  var title = dialog.querySelector(".video-dialog__title");
  var stage = dialog.querySelector(".video-dialog__stage");
  var lastTrigger = null;

  // Only same-origin, relative media paths are accepted (CSP media-src 'self').
  function safeSrc(src) { return /^(?!\/\/)[\w\-./]+\.(mp4|webm)$/i.test(src || "") ? src : ""; }

  $$("[data-video]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      lastTrigger = btn;
      title.textContent = btn.getAttribute("data-video-title") || "Video";
      var src = safeSrc(btn.getAttribute("data-video-src"));
      stage.textContent = "";
      if (src) {
        var v = document.createElement("video");
        v.controls = true; v.autoplay = true; v.playsInline = true; v.src = src;
        stage.appendChild(v);
      } else {
        var p = document.createElement("p");
        p.className = "video-dialog__empty";
        p.textContent = "The video for this item hasn’t been added yet.";
        stage.appendChild(p);
      }
      dialog.showModal();
    });
  });

  function close() { dialog.close(); }
  dialog.querySelector("[data-dialog-close]").addEventListener("click", close);
  dialog.addEventListener("click", function (e) { if (e.target === dialog) close(); }); // backdrop click
  dialog.addEventListener("close", function () {
    var v = stage.querySelector("video"); if (v) v.pause();
    stage.textContent = "";
    if (lastTrigger) lastTrigger.focus();
  });
})();

/* ---- Forms: client-side validation only. No data leaves the page until an endpoint is configured. */
(function () {
  "use strict";
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function setError(field, msg) {
    var wrap = field.closest(".field");
    var err = document.getElementById(field.id + "-err");
    if (wrap) wrap.classList.toggle("has-error", !!msg);
    if (err) err.textContent = msg || "";
    if (msg) { field.setAttribute("aria-invalid", "true"); if (err) field.setAttribute("aria-describedby", err.id); }
    else field.removeAttribute("aria-invalid");
  }

  function validate(field) {
    var v = (field.value || "").trim();
    if (field.type === "checkbox") return field.required && !field.checked ? "Please accept the terms to continue." : "";
    if (field.required && !v) return "This field is required.";
    if (field.type === "email" && v && !EMAIL.test(v)) return "Enter a valid email address.";
    if (field.name === "phone" && v && !/^[0-9+()\-\s]{7,20}$/.test(v)) return "Enter a valid phone number.";
    if (field.name === "captcha" && v && v !== "6") return "That answer isn’t right – try again.";
    if (v.length > 2000) return "Please keep this under 2000 characters.";
    return "";
  }

  function wire(form, onValid) {
    if (!form) return;
    var status = form.querySelector(".form__status");
    var fields = $$("input, select, textarea", form);
    fields.forEach(function (f) {
      f.addEventListener("blur", function () { if (f.value || f.getAttribute("aria-invalid")) setError(f, validate(f)); });
      f.addEventListener("input", function () { if (f.getAttribute("aria-invalid")) setError(f, validate(f)); });
      f.addEventListener("change", function () { if (f.getAttribute("aria-invalid")) setError(f, validate(f)); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { var m = validate(f); setError(f, m); if (m && !firstBad) firstBad = f; });
      if (status) { status.textContent = ""; status.classList.remove("is-ok"); }
      if (firstBad) { firstBad.focus(); return; }
      onValid(form, status);
    });
  }

  function submit(form, status, okMsg) {
    var endpoint = form.getAttribute("data-endpoint");
    // Only same-origin endpoints are allowed (matches CSP connect-src 'self').
    if (!endpoint || !/^\/(?!\/)/.test(endpoint)) {
      status.textContent = "Thanks! This preview isn’t connected to a backend yet, so nothing was sent.";
      return;
    }
    var btn = form.querySelector("[type=submit]");
    btn.disabled = true;
    fetch(endpoint, { method: "POST", body: new FormData(form), credentials: "same-origin" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); status.textContent = okMsg; status.classList.add("is-ok"); })
      .catch(function () { status.textContent = "Something went wrong. Please try again or email netsuite.sales@folio3.com."; })
      .then(function () { btn.disabled = false; });
  }

  wire(document.getElementById("contact-form"), function (form, status) { submit(form, status, "Thanks! Our team will get back to you shortly."); });
  wire(document.getElementById("newsletter-form"), function (form, status) { submit(form, status, "You’re subscribed. Thank you!"); });
})();

/* ---- Micro-animations: reveal-on-scroll, staggered children, count-ups, timeline progress */
(function () {
  "use strict";

  var revealEls = document.querySelectorAll("[data-reveal]");
  var counters = $$("[data-count]");

  // Stagger index for children of grids/rows so they cascade in
  $$(".stats__grid, .awards__grid, .cases__grid, .int-tiles, .clutch__track, .contact__pins, .testimonials__grid, .clients__list").forEach(function (group) {
    $$(":scope > *", group).forEach(function (el, i) { el.style.setProperty("--i", i); });
  });

  function showAll() {
    Array.prototype.forEach.call(revealEls, function (el) { el.classList.add("is-in"); });
  }

  if (REDUCED || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  // Reveal anything whose top has reached the lower 92% of the viewport, including
  // elements already scrolled past. (An IntersectionObserver alone misses elements
  // skipped by a jump such as an anchor link or the End key, leaving them hidden.)
  var pending = Array.prototype.slice.call(revealEls);
  var ticking = false;
  function checkReveal() {
    ticking = false;
    var limit = window.innerHeight * 0.92;
    pending = pending.filter(function (el) {
      if (el.getBoundingClientRect().top < limit) {
        el.classList.add("is-in");
        return false;
      }
      return true;
    });
    if (!pending.length) {
      window.removeEventListener("scroll", onScrollReveal);
      window.removeEventListener("resize", onScrollReveal);
    }
  }
  function onScrollReveal() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(checkReveal); }
  }
  window.addEventListener("scroll", onScrollReveal, { passive: true });
  window.addEventListener("resize", onScrollReveal);
  checkReveal();

  // Safety net: never leave content hidden (e.g. print, odd viewports)
  window.addEventListener("beforeprint", showAll);

  // Count-up: numbers ease from 0 to their value once, keeping prefix/suffix
  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    var prefix = el.getAttribute("data-prefix") || "";
    var suffix = el.getAttribute("data-suffix") || "";
    var final = el.textContent;
    if (!target) return;
    var duration = target > 100 ? 1600 : 1200;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = prefix + Math.round(target * eased) + suffix;
      if (p < 1) window.requestAnimationFrame(frame);
      else el.textContent = final;
    }
    window.requestAnimationFrame(frame);
  }
  var countObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      window.setTimeout(function () { countUp(el); }, 250);
      obs.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { countObserver.observe(el); });

  // Go-live rail fills in red as the timeline scrolls through the viewport
  var timeline = document.querySelector(".timeline");
  if (timeline) {
    var tl = false;
    var updateRail = function () {
      tl = false;
      var r = timeline.getBoundingClientRect();
      var vh = window.innerHeight;
      var p = (vh * 0.85 - r.top) / (r.height || 1);
      timeline.style.setProperty("--progress", Math.max(0, Math.min(1, p)).toFixed(3));
    };
    timeline.style.setProperty("--progress", "0");
    window.addEventListener("scroll", function () { if (!tl) { tl = true; window.requestAnimationFrame(updateRail); } }, { passive: true });
    window.addEventListener("resize", updateRail);
    updateRail();
  }
})();
