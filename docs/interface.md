# Pilot interface

## Brand and layout

The interface follows the brief's navy `#0E2138`, red `#E63757`, background
`#F5F6F8`, white surfaces, secondary `#6B7280`, success `#1FBF8F`, warning
`#F59E0B`, and chart cyan `#22C5E8`. Global CSS properties define the palette;
component styles remain scoped. Darker text variants preserve contrast on
light status badges and the page background. The red sign-in button uses
large bold white text. Cards use 12–16px corners and restrained shadows;
primary actions use pill shapes.

The authenticated screens share a compact masthead. Home keeps the greeting,
total hours, and business date together above the limit cards. At desktop
widths, the flight trend and documents sit side by side; below 1024px they
return to a single reading column. Document dates and urgency labels stay
visible together without opening a detail screen. The calendar places its
legend beside the month at desktop widths and below it on mobile. Every duty
fill remains the original API color.

Navigation uses a compact floating bar on desktop and a bottom bar on narrow
screens, with reserved scroll space. The polish uses component-scoped SCSS;
the existing sign-in page, global stylesheet, authentication, and API behavior
are unchanged. A shared header replaces repeated authenticated-page markup;
route, chart, and document splitting remain in place without another package.

A shared official logo sits on the navy header. Home puts the pilot's profile
and total hours first, followed by limit cards, the trend, and document status.
Two-column mobile limit cards become four columns on larger screens. The
calendar keeps its seven-column layout, original API fills, and readable
foreground colors. Bottom navigation reserves space and the device safe area.
No layout introduces another source of pilot data or business calculations.

Logbook and More remain disabled, with visible "Unavailable" captions and matching
accessible names. Their screens are not defined in the brief. Home and Schedule
remain working links. The Schedule layout, legend, and duty colors are retained.

The custom error screen reuses the masthead, palette, and pill action. A clear
404 message replaces the framework's default missing-page screen; other statuses
use generic recovery copy without rendering diagnostic messages. Error pages
have their own main landmark and skip link, no workspace navigation, and a
`noindex, nofollow` directive. Their "Back to Home" action uses a native document
navigation to revalidate the session outside the failed router context. Normal
workspace links continue to use client navigation.

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
instant scrolling. Chart axes use HTML labels at a stable text size, with fewer date labels on
narrow screens. A centered Today marker and lightly shaded future dates
separate recorded hours from projections. The red limit key sits outside the
plot so it cannot collide with the data. Rounded display ticks retain the
API's exact scale bounds, and points keep their actual positions without
curve smoothing. Values above the scale retain an overflow marker and their
exact hours in the accessible daily table.

The production browser suite checks local logo/font loading, absence of
external requests, keyboard skip/focus behavior, and horizontal overflow at
320, 390, 768, and 1280px. It captures sign-in, Home, Schedule, and the detail
placeholder at each width. Existing authentication, flight-hour, document,
and calendar journeys remain regression coverage, including failures, retries,
and deliberately reordered responses. Screenshot review supplements these
checks; layout assertions alone do not establish visual quality.

The dashboard layout regression checks that the trend and document panels
share a desktop row and that all four limit cards stay above the mobile
navigation at 390px. Sign-in screenshots are also compared with the baseline
when reviewing this visual-only change. Chart regression coverage checks all
five ranges at all four widths for readable, separated date labels, centered
Today placement, and a limit key clear of the plot.

Error recovery coverage checks unknown routes, malformed duty dates, other page
statuses, keyboard access, and reflow at the same four widths. It also checks
dashboard content after recovery, removed or invalid cookies, anonymous access,
and recovery without JavaScript.
