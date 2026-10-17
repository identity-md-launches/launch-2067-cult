# Cult design system

## Overview

Cult is a dark, irreverent token launch site built around the Council of Two. The signature image is a pair of faceless, coin-headed figures at a candlelit table. Gold blackletter, violet ritual drawings, tilted stationery and an eye with two pupils carry the same joke across the seven sections. The precise creative copy and section sequence come from the retrieved brief, preserved in `artifacts/creative-brief.txt`.

The implementation is plain `site/index.html`, `site/styles.css`, `site/app.js` and `site/art.js`. `dist/` is an exact static copy, not a separate source. `site/404.html` reuses the same tokens and assets.

## Colors

Canonical colors are hex values in `site/styles.css`. Semantic tokens point to the primitive palette; scene-specific drawing colors live in `site/art.js`.

| Semantic token | Value | Role |
| --- | --- | --- |
| `--bg` | `#16141f` | Page background |
| `--bg-deep` | `#100e17` | Recessed sections, dark text on gold |
| `--surface` | `#201b2c` | Tokenomics, controls, subtle panel fills |
| `--border` | `#342744` | Structural borders and dividers |
| `--plum-600` | `#5c4a70` | Stronger control boundaries |
| `--text` | `#e2d6ff` | Primary ink |
| `--muted` | `#baabcf` | Secondary text |
| `--accent` / `--focus` | `#fde047` | Primary buttons, focus, significant numbers and gold drawing accents |
| `--brand` | `#9400d3` | Illustration fills and the swarm allocation arc |

Status includes readable words; the gold dot alone never carries meaning. All solid text pairs measured by the final design probe passed AA. The probe cannot establish every composite SVG/artwork contrast pair; art labels and control focus were also inspected in screenshots. The site intentionally implements only the requested dark theme.

## Typography

All fonts are local WOFF2 assets in `site/assets/fonts/`, with matching license files.

- **UnifrakturCook, Georgia, serif; 700:** Cult wordmark and section headings. Its blackletter form belongs to the brand; use it for short display copy, not instructions.
- **Inter, Arial, sans-serif; 400, 600, 700:** body, labels, actions and the hero's plain-language headline. The quiet candle whisper uses the bundled 400 italic.
- **Space Mono, monospace; 400:** contract address, round number and sparse document-style annotations. Body paragraphs remain sans serif.

Six size roles are declared in CSS:

| Token | Desktop | 761–1100px | Up to 760px |
| --- | --- | --- | --- |
| `--small` | 14px | 14px | 14px |
| `--body` | 16px | 16px | 16px |
| `--sub` | 24px | 24px | 22px |
| `--heading` | 40px | 40px | 32px |
| `--display` | 64px | 56px | 44px |
| `--monument` | 180px | 144px | 112px |

These are rem-based values at a 16px root, not caps on text zoom. Body line height is 1.6; hero headline 1.15; section headings 1.05; small headings 1.3. The hero headline and large numbers use `-.04em` tracking; small copy uses natural spacing. Headings balance their wrapping, prose uses `text-wrap: pretty`, long paragraphs cap around 54ch, and addresses wrap rather than truncate. Changing market numbers use tabular numerals. SVG artwork uses its own coordinate-space lettering and does not add DOM interface type sizes.

## Layout

`.wrap` aligns content to a maximum 1280px width, with 112px total desktop gutters. Below 1100px, total gutters become 64px; below 760px, 40px; below 380px, 32px. Spacing tokens are 8, 16, 24, 32, 48, 80 and 120px. Section padding is normally 120px vertically, reduced to 64px on mobile.

The desktop hero uses two `minmax(0, …)` columns for copy and the council. The mobile hero shows the brand, description and Buy/Chart controls first, then the interactive table. At 390px the primary Buy action is visible without scrolling. Section illustrations and copy use two columns on desktop and one column below 760px. Credential copy precedes its chalkboard on mobile.

The meme wall has four columns, two below 1100px, and one below 380px. The generator stacks its preview above controls below 760px. Three live metrics become a vertical list on mobile. The 88px desktop sticky navigation becomes a 72px mobile header with a Menu button and expandable anchor links. Header and action groups can wrap when text is enlarged; the mobile address/copy panel uses one column.

Observed no horizontal overflow at 320, 360, 375, 390, 768, 1024, 1440 and 1920px, and at 390px with 200% root text size. The rotated ticker has a small inset and its own clipping boundary. The draggable sticker is bounded to the viewport during interaction and resets on resize. Its resting desktop offset includes its rotated bounds.

## Elevation & Depth

The interface uses flat tonal surfaces and structural borders rather than box shadows. Depth belongs to the illustrations: dark table ellipses, purple arch glow, candle SVG blur, and muted lower coins. A subtle noninteractive SVG grain texture overlays the page; halftone dots texture the table.

The sticky header is at z-index 40, persistent notifications at 80 and temporary confetti at 90. The grain layer has `pointer-events: none`. The scene's admission message overlays only its artwork. The mobile menu is a navigation disclosure rather than a modal; Escape closes it and returns focus to Menu.

## Shapes

`--radius: 6px` is used on buttons, inputs and image surfaces. Logo coins and the motion control are circular. Drawings use bold outlined geometry; the physical sticker and round badge have deliberately tilted edges. Keep valuable text outside clipping containers. Only artwork and the decorative marquee clip their own contents.

## Components

| Pattern | Source | Behavior |
| --- | --- | --- |
| Primary and secondary actions | `.button-gold`, `.button-outline` in CSS; anchors in HTML | Gold primary action, outlined secondary; 54px minimum height, hover fill, 0.96 press scale, visible 3px focus ring |
| Navigation | `.site-header`, `#navigation`, `#menu-toggle` | Sticky links; mobile disclosure with `aria-expanded`, outside-click and Escape dismissal |
| Motion switch | `#motion-toggle`, `applyMotion()` | Pauses CSS motion and confetti; respects OS reduced-motion preference; state is announced through its name and `aria-pressed` |
| Council table | `council()` and admission handlers | Hover/focus/click reveal the rope and exact refusal; Enter/Space work on the native button; current-visit knock count, silent rare whisper |
| Buying guide | `.step-tabs`, `steps`, `#step-detail` | Three native buttons with selected state, a polite update region, scroll-lit candles and full selectable contract address |
| Market record | `applyCoin()`, `refreshCoin()`, `.stats-grid` | Empty, valid, partial, stale, unavailable and retry states; numeric animation only with motion allowed; no fabricated values |
| Allocation | `.donut` and tokenomics description | Animated 90/10 SVG ring with accessible numeric description and explicit token quantities |
| Relic card | `memeTitles`, `meme()`, `.meme-card` | Eight distinct scene compositions; named PNG download controls; per-card pending state and failure feedback |
| Meme generator | `renderMeme()`, `downloadSVG()` | Native labeled select/text inputs, 70-character limits, escaped SVG text, 1200px PNG output; no transmitted text |
| Share actions | `shareTexts`, `#share-x`, `#copy-link` | Three actual X intent links; clipboard feedback and manual-copy fallback |
| Invitation | `envelope()`, `#open-invite` | A sealed envelope opens a clearly fictional card and exposes expanded state |
| Draggable sticker | `moveSticker()`, `#logo-sticker` | Pointer capture; arrow keys move 12px, Home resets; visible focus and instructions |

Native elements supply button, link, details, field and keyboard semantics. `.skip-link` jumps to main content. Motion is opt-in via `prefers-reduced-motion: no-preference`; reduced motion stops recurring effects. Normal motion includes 32-second ticker travel, 4-second coin bobbing, 1.7-second candle flicker, 10-second seal stamping, 5-second meme scenes and one-time scroll reveals. No audio plays.

## Do's and Don'ts

- Start another page from the same `.wrap`, typography, `.button` variants and local fonts. Export it into its own directory and adjust relative asset links for that depth.
- Preserve the exact creative copy and seven-section order. Additional instructions should be plain and specific, as in the IMD-pair clarification.
- Use the logo as material for a new illustration; keep the existing compositions distinct. `data-logo` marks image references that follow the runtime logo choice.
- Keep the site usable before deployment. Show `launching…`, hide absent market values, and retain retry/status text.
- Keep addresses fully visible and selectable. Do not invent wallet, membership, yield, audit or partnership claims.
- Extend the existing type and color tokens rather than adding another font or one-off scale. Do not add section kicker labels or gradients to text.
- Use canvas only as the detached PNG encoder. The visible page remains CSS and SVG, with all required assets bundled locally.

Design guidance attribution and license records are in `README.md` and `artifacts/licenses/`. Review coverage and the remaining browser limitations belong in `artifacts/validation.md`.
