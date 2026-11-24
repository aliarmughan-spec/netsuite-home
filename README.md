# Folio3 NetSuite homepage

Built from Figma **Ali Designs → "Home page"** (node `1:1022`). The site header and the **Nexus AI** section come from the earlier "Netsuite-2025" file (`13042:13452`) and are kept as they were.

Plain HTML/CSS/JS, no build step. Run: `python3 -m http.server 4173` and open http://localhost:4173.

## Sections
| # | Section | Figma node | Markup |
|---|---|---|---|
| 1 | Site header (unchanged) | `13042:13555` / `1:1125` | `header.site-header` |
| 2 | Hero with dashboard and video button | `1:1187` | `section.hero` |
| 3 | Client logos | `1:1756` | `section.clients` |
| 4 | Nexus AI agents (kept, not in the new frame) | `13042:13664` | `section.nexus` |
| 5 | Services tabs | `1:1893` | `section.services` |
| 6 | Stats | `1:2289` | `section.stats` |
| 7 | Awards | `1:2329` | `section.awards` |
| 8 | Niche solutions accordion | `1:2989` | `section.solutions` |
| 9 | Go-live projects timeline | `1:3581` | `section.golive` |
| 10 | Integrations | `1:3619` | `section.integrations` |
| 11 | Testimonials | `1:3817` | `section.testimonials` |
| 12 | Industries marquee | `1:3844` | `section.industries` |
| 13 | Case studies | `1:3921` | `section.cases` |
| 14 | Clutch badges | `1:4249` | `section.clutch` |
| 15 | FAQ | `1:4272` | `section.faq` |
| 16 | Contact form | `1:4307` | `section.contact` |
| 17 | Footer and newsletter | `1:4386` | `footer.site-footer` |

Every section carries its `data-node-id` for traceability.

## Files
- `index.html`: markup and an inline SVG icon sprite
- `css/styles.css`: Figma variables as tokens (`--primary-red`, `--text-lighter`, `--text-full-light`, `--grey-highlights`, `--yellow`, `--secondary`, `--bg`, …), components, breakpoints, motion
- `js/main.js`: header scroll state and drawer, tabs, accordions, carousels, marquee, video dialog, form validation, scroll animations
- `assets/fonts/`: Poppins 300–600 and Plus Jakarta Sans 500/600/700 (self-hosted woff2, SIL OFL)
- `assets/img/`: images exported from Figma
- `qa/`: Figma reference (`figma-reference-home-1920.jpg`), breakpoint screenshots (`shots/`), and the test scripts (`screenshots.py`, `interactions.py`; need `pip install playwright && playwright install chromium`, plus the local server running)

## Responsive behaviour
| Width | Behaviour |
|---|---|
| ≥1600 | Figma spec: 1536px content, fixed Figma column widths |
| 1200–1599 | Two-column sections become fluid; service tabs and nav tighten so they stay on one row |
| 768–1199 | Header drawer. Two-column sections stack (text, then media). Integrations become a centred logo grid under the copy. Testimonials: feature card full width, two cards below. Case studies: feature card above a 5-column logo grid. Tab bars scroll horizontally. |
| <768 | Single column. Stats in 2 columns. Awards become a swipeable carousel with dots, Clutch 2 per view. Feature testimonial switches to a text-free photo with a live quote. Case logos in 3 columns. Map labels become a text line under the map below 560px. Footer link lists stack. |

## Interactions and motion
- **Tabs** (services, FAQ): WAI-ARIA tabs with arrow/Home/End keys. On services, a red pill slides to the active tab. Panels cross-fade.
- **Accordions** (solutions, go-live, FAQ): one item open at a time, with animated height and correct `aria-expanded` state. In solutions and go-live, opening an item cross-fades the screenshot or photo to match (content from Figma frames `1:5625`, `1:9388`, `1:9667`, `1:5526`, `1:5558`, `1:5592`).
- **Testimonials** (Figma `1:3817`, `1:5022`, `1:5032`): the active card expands to the wide layout with its quote; hover, focus or click another card to switch (column widths animate). Below 1200px every card shows a logo photo with its quote as live text.
- **Case studies** (Figma client cards `1:4613`–`1:5013`): hover, focus or click a client logo to show that client's story in the large card; the play button retitles to match.
- **Service tabs 2–7** use the Figma frames `1:10306`–`1:11094` (copy, button labels and visuals).
- **Carousels** (awards, Clutch): CSS scroll-snap. Dots appear and prev/next arrows disable only when there is something to scroll.
- **Video buttons** (hero, testimonials, case study): open an accessible `<dialog>`. Add `data-video-src="media/file.mp4"` to a button to play a real file. Only same-origin `.mp4`/`.webm` paths are accepted.
- **Forms**: client-side validation with inline errors, `aria-invalid`, and focus on the first error. Nothing is sent until you configure an endpoint (see review list).
- **Micro-animations**, all subtle and run once unless noted:
  - Sections fade up as they enter the viewport.
  - Grids cascade in (stats, awards, case logos, Clutch badges, client logos).
  - The hero dashboard settles up from a slight tilt, and a soft ring pulses from its play button.
  - Stats count up to their values.
  - The go-live rail fills red as you scroll.
  - Integration tiles pop in, then drift by a few pixels.
  - The two industry rows drift in opposite directions and pause on hover or focus.
  - The Clutch stars light up in sequence.
  - Map pins drop in and their rings pulse.
  - Arrow links nudge once.
  - The existing header scroll state, hero headline sheen and Nexus diagram animations are kept.
- Motion only uses opacity and transform. With `prefers-reduced-motion: reduce`, everything renders static (the marquee becomes a wrapped list). With JavaScript off, all content is visible.

## Security
- Strict Content-Security-Policy (meta tag): only same-origin scripts, styles, fonts, images and media. No inline styles. The one inline script is allowed by its hash. Also sets `object-src 'none'`, `frame-src 'none'`, `worker-src 'none'`, `base-uri 'self'`, `form-action 'self'` and `require-trusted-types-for 'script'`. If you change the inline script, update its hash.
- The script never builds HTML from strings. It only uses `textContent`, classes and DOM nodes, so form input can't inject markup (this is tested in `qa/interactions.py`).
- Forms post only to a same-origin path (`data-endpoint="/…"`). The default is no endpoint, so no data leaves the page. Inputs have `maxlength` limits.
- No third-party scripts, CDNs, trackers, remote fonts, secrets or expiring Figma URLs.
- `noindex, nofollow` keeps the preview out of search engines. **Remove it at launch.**
- Header-only protections (`frame-ancestors`, HSTS, `X-Content-Type-Options`, `Permissions-Policy`) can't be set from a meta tag; set them on the server/CDN.

## Needs developer review
1. **Nexus AI placement.** The section isn't in the new Figma frame. It's kept after the client logos (where it sat before). Confirm placement with design, or remove it.
2. **Image quality.** The Figma export limit is 1×, so images are 1× crops of the Figma renders. Re-export at 2× (logos and badges as SVG) before launch.
3. **Flattened cards.** The testimonial cards and the Bank & Vogue case card are single images in Figma with the text baked in. They're used as images with full alt text. Supply the source photos and logos so the quotes can be live text at every size (mobile already does this for the ADM card).
4. **Draft copy (marked `data-draft` in the HTML), not in Figma:** FAQ answers 2–5, and the "coming soon" text in FAQ tabs 2–5. These need approved content.
5. **FAQ tab labels** ("Property Types", "Investment Management", …) look carried over from another product page. They're kept as designed; please confirm.
6. **Case-study captions.** In Figma, CORE's card caption is identical to Naked Wardrobe's ("NetSuite AFA Standard with NStitch CMT…"). It's built as designed; please confirm the real CORE summary.
7. **Videos.** No video files were supplied, so play buttons open the dialog with a "not added yet" message.
8. **Forms.**
   - Set `data-endpoint` on `#contact-form` and `#newsletter-form`.
   - Replace the client-side "4+2" check with server-side verification. A client-side check is not real bot protection.
   - Add a privacy-policy link target.
9. **Clutch badges.** Figma adds two more badges to the carousel, but they repeat two that are already shown (Top NetSuite Company 2024 and Top Software Developers, Manufacturing). They're built as designed so the arrows work; swap in different badges if you have them. The awards row has only 6 badges, so its dots only appear on mobile.
10. **Industries.** Figma has a hidden "Manufacturing" detail panel ("Click here to learn more"), which suggests a per-industry detail view. It isn't built. Chips are links (`#` for now).
11. **Footer.**
    - The third contact row repeats the email next to a location pin; it probably needs an address.
    - Social links are `#`.
    - The Figma frame also has a "Copyright © 2025 Folio3 FoodTech" bar from another brand. It was left out on purpose.
12. **Icons.** Font Awesome Pro icons are replaced with inline SVG approximations. Swap in your icon set if you have the licence.
13. **Link targets.** "View all …" buttons, nav items and chips point to `#`.
14. **Off-canvas layers.** Several layers sit outside the 1920 frame in Figma (a "Start The Transformation" button, ellipses and a bitmap). These are treated as leftovers and not built.
