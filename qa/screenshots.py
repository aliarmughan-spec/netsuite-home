"""QA: full-page screenshots per breakpoint + console errors + horizontal-overflow check.
usage: shoot.py [widths...]"""
import sys, json
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
widths = [int(w) for w in sys.argv[1:]] or [1920, 1440, 1024, 768, 390]
import os
OUT = os.path.join(os.path.dirname(__file__), "shots") + "/"

with sync_playwright() as p:
    b = p.chromium.launch()
    for w in widths:
        ctx = b.new_context(viewport={"width": w, "height": 900}, reduced_motion="reduce", device_scale_factor=1)
        pg = ctx.new_page()
        errs = []
        pg.on("console", lambda m: errs.append(m.type + ": " + m.text) if m.type in ("error", "warning") else None)
        pg.on("pageerror", lambda e: errs.append("pageerror: " + str(e)))
        pg.goto(URL, wait_until="networkidle")
        pg.evaluate("document.fonts.ready")
        pg.evaluate("""async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } scrollTo(0, 0); }""")
        pg.wait_for_timeout(500)
        over = pg.evaluate("""() => {
          const W = document.documentElement.clientWidth, bad = [];
          document.querySelectorAll('body *').forEach(el => {
            const r = el.getBoundingClientRect();
            if (r.width && (r.right > W + 1 || r.left < -1)) {
              let p = el.parentElement, clipped = false;
              while (p) { const s = getComputedStyle(p); if (s.overflowX !== 'visible' || s.overflow === 'hidden' || s.overflow === 'clip') { clipped = true; break; } p = p.parentElement; }
              if (!clipped) bad.push(el.tagName + '.' + el.className + ' ' + Math.round(r.left) + '→' + Math.round(r.right));
            }
          });
          return { scrollW: document.documentElement.scrollWidth, W, bad: bad.slice(0, 12) };
        }""")
        h = pg.evaluate("document.documentElement.scrollHeight")
        pg.screenshot(path=f"{OUT}{w}-full.png", full_page=True)
        print(json.dumps({"w": w, "height": h, "overflow": over, "errors": sorted(set(e[:160] for e in errs))}))
        ctx.close()
    b.close()
