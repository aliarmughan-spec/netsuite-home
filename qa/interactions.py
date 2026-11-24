"""Interaction tests with animations ON. Prints PASS/FAIL lines."""
from playwright.sync_api import sync_playwright

URL = "http://localhost:4173/"
results = []
def check(name, cond, info=""):
    results.append(("PASS" if cond else "FAIL") + "  " + name + ("  " + str(info) if info and not cond else ""))

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1440, "height": 900})
    pg = ctx.new_page()
    errs = []
    pg.on("pageerror", lambda e: errs.append(str(e)))
    pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
    pg.goto(URL, wait_until="networkidle")

    # Services tabs: click + arrow keys
    pg.click("#svc-tab-3")
    check("service tab click shows panel 3", pg.is_visible("#svc-panel-3") and not pg.is_visible("#svc-panel-1"))
    pg.keyboard.press("ArrowRight")
    check("ArrowRight moves to tab 4", pg.evaluate("document.activeElement.id") == "svc-tab-4" and pg.is_visible("#svc-panel-4"))
    pg.keyboard.press("Home")
    check("Home returns to tab 1", pg.get_attribute("#svc-tab-1", "aria-selected") == "true")
    pg.wait_for_timeout(500)
    ink = pg.evaluate("(() => { const i=document.querySelector('.tab-ink'), t=document.querySelector('#svc-tab-1'); return [Math.round(i.getBoundingClientRect().left), Math.round(t.getBoundingClientRect().left), Math.round(i.offsetWidth), t.offsetWidth]; })()")
    check("tab ink sits under active tab", abs(ink[0] - ink[1]) <= 1 and abs(ink[2] - ink[3]) <= 1, ink)

    # Accordion (solutions): open second, first closes
    pg.click("#sol-2-btn"); pg.wait_for_timeout(600)
    check("accordion opens item 2", pg.get_attribute("#sol-2-btn", "aria-expanded") == "true" and pg.is_visible("#sol-2"))
    check("accordion closes item 1", pg.get_attribute("#sol-1-btn", "aria-expanded") == "false" and pg.evaluate("document.getElementById('sol-1').hidden"))
    pg.click("#sol-2-btn"); pg.wait_for_timeout(600)
    check("accordion item can close again", pg.evaluate("document.getElementById('sol-2').hidden"))

    # FAQ
    pg.click("#faq-4-btn"); pg.wait_for_timeout(600)
    check("FAQ item 4 opens", pg.is_visible("#faq-4"))
    pg.click("#faq-tab-2")
    check("FAQ tab 2 shows its panel", pg.is_visible("#faq-panel-2"))

    # Clutch carousel arrows: 4 badges fit at 1440 -> both disabled
    check("clutch arrows disabled when nothing to scroll", pg.is_disabled("[data-carousel-prev]") and pg.is_disabled("[data-carousel-next]"))

    # Video dialog open / Esc / focus return
    pg.click(".play-btn--hero")
    check("video dialog opens", pg.evaluate("document.getElementById('video-dialog').open"))
    check("dialog title set", pg.inner_text("#video-dialog-title") == "Folio3 NetSuite overview")
    pg.keyboard.press("Escape"); pg.wait_for_timeout(100)
    check("Esc closes dialog", not pg.evaluate("document.getElementById('video-dialog').open"))
    check("focus returns to play button", pg.evaluate("document.activeElement.classList.contains('play-btn--hero')"))

    # Contact form validation
    pg.click(".form__submit")
    errs_shown = pg.evaluate("[...document.querySelectorAll('#contact-form .field__error')].filter(e=>e.textContent).length")
    check("empty submit shows required errors", errs_shown >= 4, errs_shown)
    check("focus moves to first invalid field", pg.evaluate("document.activeElement.id") == "f-name")
    pg.fill("#f-name", "Ali Test"); pg.fill("#f-email", "bad@"); pg.select_option("#f-service", index=1)
    pg.fill("#f-captcha", "7"); pg.check("#f-terms"); pg.click(".form__submit")
    check("bad email flagged", "valid email" in pg.inner_text("#f-email-err"))
    check("wrong captcha flagged", "isn’t right" in pg.inner_text("#f-captcha-err"))
    pg.fill("#f-email", "ali@example.com"); pg.fill("#f-captcha", "6"); pg.click(".form__submit")
    check("valid submit shows not-connected notice", "isn’t connected" in pg.inner_text("#contact-form .form__status"))
    # XSS probe: input is never rendered as HTML
    pg.fill("#f-name", "<img src=x onerror=alert(1)>"); pg.click(".form__submit")
    check("no injected element from form input", pg.evaluate("document.querySelectorAll('img[src=\"x\"]').length") == 0)

    # Newsletter
    pg.fill("#nl-email", "nope"); pg.click(".newsletter__btn")
    check("newsletter rejects invalid email", pg.get_attribute("#nl-email", "aria-invalid") == "true")

    # Marquee duplicated once, clones hidden from AT and not focusable
    n = pg.evaluate("[...document.querySelectorAll('.marquee__row')].map(r=>[r.children.length, r.querySelectorAll('[aria-hidden=true] a[tabindex=\"-1\"]').length])")
    check("marquee rows cloned once, clones inert", n == [[18, 9], [20, 10]], n)

    # Scroll through: everything revealed, counters land on final values
    for y in range(0, 14000, 500):
        pg.evaluate(f"scrollTo(0,{y})"); pg.wait_for_timeout(60)
    pg.wait_for_timeout(2200)
    hidden = pg.evaluate("[...document.querySelectorAll('[data-reveal]')].filter(e=>!e.classList.contains('is-in')).length")
    check("all reveal blocks shown after scrolling", hidden == 0, hidden)
    vals = pg.evaluate("[...document.querySelectorAll('.stat dd')].map(d=>d.textContent)")
    check("stat counters end on design values", vals == ["1000+", "18+", "50+", "300+", "98%", "1 Million+"], vals)
    op = pg.evaluate("getComputedStyle(document.querySelector('.cases__grid li')).opacity")
    check("staggered children end fully visible", op == "1", op)

    # Anchor jump (End key) must not leave content hidden
    pg2 = ctx.new_page(); pg2.goto(URL + "#contact", wait_until="networkidle"); pg2.wait_for_timeout(1500)
    check("deep link to #contact reveals content", pg2.evaluate("document.querySelector('.contact__card').classList.contains('is-in')"))

    # Mobile nav
    m = b.new_context(viewport={"width": 390, "height": 844}).new_page()
    m.goto(URL, wait_until="networkidle")
    m.click(".nav-toggle")
    check("mobile drawer opens", m.get_attribute(".nav-toggle", "aria-expanded") == "true" and m.is_visible(".primary-nav__cta"))
    m.keyboard.press("Escape")
    check("Esc closes mobile drawer", m.get_attribute(".nav-toggle", "aria-expanded") == "false")
    # awards carousel on mobile has dots and swipes
    m.evaluate("document.querySelector('.awards').scrollIntoView()"); m.wait_for_timeout(800)
    dots = m.evaluate("document.querySelectorAll('.awards .carousel__dot').length")
    check("awards carousel has dots on mobile", dots >= 2, dots)
    if dots >= 2:
        m.click(".awards .carousel__dot:nth-child(2)"); m.wait_for_timeout(900)
        check("dot click scrolls carousel", m.evaluate("document.querySelector('.awards__grid').scrollLeft") > 50)
    check("no horizontal page scroll on mobile", m.evaluate("document.documentElement.scrollWidth") == 390)

    check("no JS errors", not errs, errs[:3])
    b.close()

print("\n".join(results))
print(sum(r.startswith("FAIL") for r in results), "failures")
