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
legend below the month inside the same calendar panel at every width. Neutral date surfaces contain compact
duty bands in the original API colors, with visible duty codes and base names.

Navigation uses a compact floating bar on desktop and a bottom bar on narrow
screens, with reserved scroll space. The polish uses component-scoped SCSS;
authentication and API behavior are unchanged. A shared focus policy now
updates the global stylesheet and all interactive controls, including sign-in. A shared header replaces repeated authenticated-page markup;
route, chart, and document splitting remain in place without another package.

A shared official logo sits on the navy header. Home puts the pilot's profile
and total hours first, followed by limit cards, the trend, and document status.
Two-column mobile limit cards become four columns on larger screens. The
calendar keeps its seven-column layout, original API duty bands, and readable
foreground colors. Bottom navigation reserves space and the device safe area.
No layout introduces another source of pilot data or business calculations.

Logbook and More are working navigation links to protected pages reading "Page
unavailable". Each page identifies its section and provides a working return to
Home. The active tab has `aria-current="page"`. Full Logbook and More features
are not defined in the brief. These pages share the workspace header, reserve
space for navigation, and keep their SSR responses private and non-cacheable.

The custom error screen reuses the masthead, palette, and pill action. A clear
404 message replaces the framework's default missing-page screen; other statuses
use generic recovery copy without rendering diagnostic messages. Error pages
have their own main landmark and skip link, no workspace navigation, and a
`noindex, nofollow` directive. Their "Back to Home" action uses a native document
navigation to revalidate the session outside the failed router context. Normal
workspace links continue to use client navigation.

The error composition places recovery copy beside a local SVG flight-path
illustration on desktop and stacks it on narrow screens. The illustration is
decorative and adds no external requests or dependency.

Schedule uses compact native Month and Year selects with accessible labels,
custom decorative chevrons, and 44px minimum control heights. The joined selects
form the calendar header, with separate circular previous/next buttons around
"This month". The native selects use an inset focus outline that stays within
each control while remaining visible for keyboard use. Controls reflow into two rows on mobile. The header, date grid,
status key, and legend share one bordered panel, with a divider above the legend. The year options stay bounded around the selected
year rather than rendering thousands of DOM nodes. The calendar, its API colors,
and the legend below it retain all API information. The [calendar design rationale](calendar-design.md)
distinguishes the brief's requirements from the presentation choices and records
the primary accessibility/design sources. Today has both a visible label and
an outline; completion ticks/counts remain separate from duty type. Text uses
a measured foreground, with a black fallback when navy and white both fall
below 4.5:1 contrast on a supplied duty color.

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

## Shared focus indicators

All interactive controls use the same 2px solid inset outline with a -2px offset.
The global rule covers keyboard focus and native select focus. Shared custom
properties define the width, offset, and color; components only adapt color for
contrast. Light surfaces and red actions use navy. Selected navy range buttons
and controls on the navy masthead use white. Red actions share a hover color
that keeps the navy focus outline above 3:1 contrast. Main content targets remain free
of a focus outline when reached through a skip link.

A browser journey focuses every visible enabled control on sign-in, Home,
Schedule, duty details, Logbook, More, and the 404 screen at 320px and 1280px.
It verifies the common geometry and at least 3:1 contrast with the painted
surface. Focused screenshots intentionally differ from the earlier login
captures; this change does not alter layout or sign-in behavior.

## Daily chart values

The native daily-values disclosure uses a full-width summary with a date count
and decorative chevron. It keeps keyboard Enter/Space behavior and the shared
inset focus outline without JavaScript state. The table names its rolling window
and unit, aligns numeric hours to the right, and distinguishes Recorded/Planned
with visible text and quiet status pills. Today has a labelled date and a subtle
row highlight. All 15 supplied values remain available, including above-scale
projections, with the same one-decimal precision. The table stays in the normal
page scroll flow and reflows down to 320px without an inner scrolling region.

## Chart inspection

The chart exposes a nearest-date tooltip across its plot area, with a guide line,
active point, full date, exact one-decimal hours, and Recorded/Planned status.
Today and values above the scale remain explicit. The tooltip stays inside the
plot at narrow widths and edge dates, can itself be hovered, and closes with
Escape or pointer leave. A tap selects a date; tapping outside dismisses it.

The plot has one keyboard focus target using the shared inset style. Left/Right
select dates, Home/End select the edges, and Escape closes the tooltip. A polite
status announces keyboard selections; the semantic daily-values table remains
available. Range/data changes reset inspection. Event listeners are removed on
unmount, hover sends no API requests, and pointer movement updates only the
selected date. Native touch scrolling is not prevented. The implementation
stays inside the existing lazy chart component without a charting dependency.

The additional interaction journeys run in their own browser-project invocation
with fresh servers, preserving the production request/login rate limits while
exercising every range at four widths.

Chart inspection becomes focusable and pointer-enabled only after its client
handlers mount. Until then the static SVG and native daily-value disclosure
remain available. Tap selections ignore touch pointer-leave events, so contact
ending after a tap does not dismiss the chosen date.
