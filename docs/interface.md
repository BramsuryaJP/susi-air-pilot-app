# Pilot interface

## Brand and layout

The interface follows the brief's navy `#0E2138`, red `#E63757`, background
`#F5F6F8`, white surfaces, secondary `#6B7280`, success `#1FBF8F`, warning
`#F59E0B`, and chart cyan `#22C5E8`. Global CSS properties define the palette;
component styles remain scoped. Darker text variants preserve contrast on
light status badges and the page background. The red sign-in button uses
large bold white text. Cards use 12–16px corners and restrained shadows;
primary actions use pill shapes.

A shared official logo sits on the navy header. Home puts the pilot's profile
and total hours first, followed by limit cards, the trend, and document status.
Two-column mobile limit cards become four columns on larger screens. The
calendar keeps its seven-column layout, original API fills, and readable
foreground colors. Bottom navigation reserves space and the device safe area.
No layout introduces another source of pilot data or business calculations.

## Local assets and typography

- Logo: unmodified white PNG from the [official Susi Air website](https://susiair.com/images/susiairlogo.png),
  served locally at `/brand/susi-air-white.png` (3,598 bytes). The website uses
  this asset in its footer. The logo remains the property of Susi Air.
- Typeface: [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans)
  by Tokotype, obtained through the official Google Fonts CSS service. The
  upright Latin variable WOFF2 is 27,272 bytes and covers weights 200–800.
  Its [source metadata](https://github.com/google/fonts/tree/main/ofl/plusjakartasans)
  identifies the family and license. The full SIL Open Font License is included
  at `public/fonts/OFL.txt`.

One local font file covers interface text and bold, tabular numerical data.
A single font preload matches the `@font-face` URL and uses anonymous CORS.
`font-display: swap` keeps text visible while loading; system fonts cover
unsupported characters. Explicit logo dimensions reserve its space. The
browser makes no external asset requests. No font, icon, or chart package was
added. Existing route, chart, and document code splitting is retained.

## Access and verification

Pages provide a keyboard skip link, visible focus, labelled controls, and
semantic headings. Touch controls have at least 44px height. Status words,
completion ticks, counts, and chart line patterns communicate meaning beyond
color. There is no automatic animation. Reduced-motion preferences retain
instant scrolling. SVG chart labels grow on narrow screens; the Today caption
uses normal HTML text to avoid overlapping axis labels. All chart values are
also available in the existing accessible table.

The production browser suite checks local logo/font loading, absence of
external requests, keyboard skip/focus behavior, and horizontal overflow at
320, 390, 768, and 1280px. It captures sign-in, Home, Schedule, and the detail
placeholder at each width. Existing authentication, flight-hour, document,
and calendar journeys remain regression coverage, including failures, retries,
and deliberately reordered responses. Screenshot review supplements these
checks; layout assertions alone do not establish visual quality.
