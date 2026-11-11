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

/* Micro-animations: reveal-on-scroll and the "+150" count-up */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = document.querySelectorAll("[data-reveal]");
  var counters = document.querySelectorAll("[data-count]");

  function showAll() {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  if (reduceMotion || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }

  var revealObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      obs.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
  revealEls.forEach(function (el) { revealObserver.observe(el); });

  // Safety net: never leave content hidden (e.g. print, odd viewports)
  window.addEventListener("beforeprint", showAll);

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (!target) return;
    var duration = 1200;
    var start = null;
    function frame(t) {
      if (start === null) start = t;
      var p = Math.min((t - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3); // ease-out cubic
      el.textContent = "+" + Math.round(target * eased);
      if (p < 1) window.requestAnimationFrame(frame);
    }
    el.textContent = "+0";
    window.requestAnimationFrame(frame);
  }

  var countObserver = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      // start after the experts row has faded in
      window.setTimeout(function () { countUp(entry.target); }, 450);
      obs.unobserve(entry.target);
    });
  }, { threshold: 0.6 });
  counters.forEach(function (el) { countObserver.observe(el); });
})();
