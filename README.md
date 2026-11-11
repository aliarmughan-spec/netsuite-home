# Folio3 NetSuite homepage: header + hero

Built from Figma **Netsuite-2025 → "Home page"** (node `13042:13452`), sections:

| Section | Figma node | Markup |
|---|---|---|
| Site header | `13042:13555` | `<header class="site-header">` |
| Hero | `13042:13617` | `<section class="hero">` |

Plain HTML/CSS/JS, no build step. Run: `python3 -m http.server 4173` and open http://localhost:4173.

## Files
- `index.html`: markup (each section carries its `data-node-id` for traceability)
- `css/styles.css`: tokens from Figma variables (`--primary-red #ec1515`, `--text-lighter #303030`, `--text-full-light #585858`, `--secondary-blue #ecf2fd`), components, breakpoints
- `js/main.js`: sticky-header scroll state and the tablet/mobile nav drawer
- `assets/fonts/`: Poppins 300/400/500/600, Plus Jakarta Sans 500 (self-hosted woff2, from @fontsource)
- `assets/img/`: logo, hero background, avatars, partner logos (exported from Figma)
- `qa/`: Figma reference render and breakpoint screenshots

## Responsive behaviour
| Width | Header | Hero |
|---|---|---|
| ≥1536 | Figma spec: 90px, 192px side margins at 1920, 6 nav links, search, "Get Started" | 140px vertical padding, 54/70 title, 5 partner cards in a row |
| 1200–1535 | Nav link padding tightened (12px, then 9px/15px below 1320) so it stays on one row | Same as desktop |
| 768–1199 | 76px tall; nav collapses into a drop-down drawer (hamburger), search + "Get Started" stay visible | 96px padding, 44/58 title, partner cards wrap 3 + 2 |
| <768 | 68px tall; "Get Started" moves into the drawer | 30/40 title, 16/26 body, buttons stack full-width (max 360px), avatars stack above label, partner cards in a 2-column grid |

## Interactions
- **Sticky header scroll state**: the header is `position: sticky`. After 8px of scroll it gets `.is-scrolled`, which adds a shadow, a translucent blurred background, compacts the height (90 → 72px desktop) and shrinks the logo. The trigger is an IntersectionObserver on a sentinel element, with a scroll-listener fallback.
- **Nav drawer** (<1200px): aria-expanded/aria-controls; closes on Escape, an outside click, a link click, or resizing past the breakpoint; page scroll is locked while open.
- **Hover/focus**: nav links get a red underline that grows in (Figma carries a 0-width `--primary` bottom border on nav items). Buttons darken and lift slightly. Partner cards lift. All controls have a `:focus-visible` outline.
- **Micro-animations** (in `js/main.js` + the "Micro-animations" block in `css/styles.css`):
  - Hero copy, buttons, experts row and partner cards fade up in a short stagger on load.
  - The red "Certified NetSuite Experts" words get one soft light sweep after the headline lands.
  - "+150" counts up from 0 when the experts row comes into view.
  - Nexus AI: the hub pops in, the dashed connectors draw outward from it, then the six agents rise in. Afterwards the dashes flow slowly toward the right, the hub glow breathes and a faint ring ripples out every few seconds.
  - Everything runs once per element (IntersectionObserver), uses only opacity/transform/clip-path, and rests at the normal final state.
- `prefers-reduced-motion: reduce` turns all animation off and shows everything immediately. With JavaScript disabled the page renders fully, with no animation.

## Needs developer review
1. **Merge into the real codebase.** No existing project was reachable, so this is standalone. Port the markup and CSS into your components and map the tokens to your existing variables and button component.
2. **Asset quality.** The cloud workspace couldn't reach figma.com, so the images are 1× renders of the Figma nodes. Re-export from Figma before production: the **logo as SVG** (node `13042:13558`), the **Salesforce mark as SVG** (`13042:13659`), and the avatars and partner logos at 2× (`13042:13641`–`13645`, `13042:13651/53/55/57`). The hero background (`13042:13618`) is a flattened render of the photo, gradient and line art; consider rebuilding it from its layers or exporting a WebP.
3. **Hero background crop.** The Figma background frame is 1576px tall but the hero is 854px. The build uses the top 1000px with `background-size: cover`. Confirm the intended crop on tablet and mobile with design.
4. **Not specified in Figma**, so these are my calls: tablet/mobile layouts, the drawer design, the sticky compact height, and hover colours (`#c90f0f` red hover, inverted outline button).
5. **Search button** has no behaviour yet. Figma has hidden "Search" label and close-icon layers, which suggests an expanding search field.
6. **Nav dropdowns.** Figma shows plain links. If the live site has mega-menus, wire them into `.primary-nav__list`.
7. **Link targets** (`#contact`, `#services`, `#`) are placeholders.
8. The "Talk to Experts" arrow uses Font Awesome Pro `arrow-up-right` in Figma; it's an inline SVG approximation here. Swap in your icon set.
9. Hero height measures 851px vs 854px in Figma, a 3px difference from font metrics in the body copy.

## Security
- No third-party scripts, CDNs, trackers or remote fonts: everything is served from the site itself.
- Content-Security-Policy (meta tag) allows only same-origin scripts/styles/fonts/images plus `data:` images; the one inline script (adds the `js` class) is allowed by its SHA-256 hash. If you change that script, update the hash.
- `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `upgrade-insecure-requests`, strict referrer policy.
- The script writes only `textContent` / classes, never HTML, so there is no injection path.
- No secrets, tokens or expiring Figma asset URLs in the repo.
- `noindex, nofollow` keeps this public preview out of search engines. **Remove it at launch.**
- Header-only protections (`frame-ancestors`, HSTS, `X-Content-Type-Options`) can't be set from a meta tag or on GitHub Pages; set them on the production server/CDN.
- Font licences (SIL OFL) are included in `assets/fonts/`.
