# Schedules

## Monthly API

Authenticated Nest `GET /schedules?year=2026&month=05` returns `year`, `month`,
the configured `today`, the supplied `legend`, and `schedules` for that month.
Year must be four digits from 1000 through 9999. Month accepts 1–12 with an
optional leading zero. Missing, repeated, fractional, out-of-bound, and unknown
query parameters are rejected through the existing DTO validation/error filter.

The service imports the unchanged schedule seed at startup, sorts it by date,
and indexes entries by month. Lookup does not scan unrelated months. Empty
months return an empty schedules array and the complete legend. The original
root fixture is preserved, with an identical source copy packaged in Nest.

Every entry retains its original fields, including duty codes and `base_color`.
The service adds `remainingDuties = count_schedules - count_logbooks` and
`isComplete = count_logbooks === count_schedules`. Completion does not depend on
the independent `status` flag: the supplied data includes a pending day with
all logbooks complete and a verified day with duties still remaining.

The calendar preserves each entry's actual color. For example, 4 June uses
`#FBA577` even though its TRX legend color is `#F59E0B`. Legend labels and codes
come from the supplied API data rather than a normalized frontend mapping.

## Browser calendar and navigation

The fixed Nuxt `GET /api/schedules` adapter validates the same two parameters,
reads the private session cookie, and forwards only the permitted query fields
and bearer token. Both applications return private, non-cacheable responses.
Invalid sessions clear the cookie; service outages preserve it and hide internal
diagnostics, following the existing adapter behavior.

`/schedule` defaults to the month from the API-derived pilot business date.
An optional `month=YYYY-MM` URL parameter supports sharing, reload, browser
history, and returning from a detail placeholder. Pinia holds the current
selection for navigation within the application. The month response stays in
Nuxt's request-scoped async-data lifecycle. SSR data is reused during hydration.
Each month change makes a fresh API request, and direct refresh with cancellation
prevents an earlier response from replacing the latest selection. Old calendar
content is hidden while loading or after failure; retry reloads the selected
month without changing it.

The month picker provides compact native Month and Year selects with accessible labels alongside
previous/next controls and "This month". The latter uses the API business date,
not the device clock. The year list contains the selected year and up to ten
years on either side, bounded to 1000–9999, plus the current business year when
outside that range. This keeps the DOM small while preserving supported deep
links and allowing larger jumps. The controls keep consecutive choices together
while route authentication is pending; only committed route changes load data.
Browser history and reload restore the controls from the URL.
The server renders the selected options immediately, while controls remain
disabled until hydration attaches their handlers. Without JavaScript, a visible
message explains that changing the month requires it.

The table uses Monday-first weeks and UTC date arithmetic for presentation.
It includes every date in the month, including leap days and unscheduled days;
padding outside the month is inert. Actual day links are keyboard-accessible.
A tick means all duties are logged; otherwise the badge shows remaining duties
from the API. Today is marked with `aria-current="date"` and a red outline.
The date surface stays neutral; a compact duty band preserves each exact API
`base_color` and shows the duty code and base name. Band text selects a foreground
meeting at least 4.5:1 contrast without altering the supplied fill. Today also has
a visible label. The legend appears below the date grid at all widths, as required.
The toolbar, grid, status key, and legend share a single calendar container. A
thin divider separates the legend footer; it does not have a second card border.
See the [calendar design rationale](calendar-design.md) for the researched basis
and the distinction between requirements and presentation choices.

Tapping any date opens `/duty/YYYY-MM-DD`, a protected placeholder reading
“Detail page coming soon”. It validates the actual date and returns to the
same calendar month. A calendar-style date panel shows the selected weekday,
day, month, and year in UTC. The availability message and return action sit
beside the date on desktop and stack below it on mobile. This placeholder
does not request or invent additional duty data. Schedule/detail HTML responses use private/no-store
headers. The bottom navigation links Home and Schedule; Logbook and More open
protected placeholders reading "Page unavailable", since their complete features
are not defined in the brief. Invalid duty dates retain HTTP 404 and use the
shared branded recovery screen. Returning Home revalidates the session before
rendering dashboard content.
Bottom padding and safe-area handling let content scroll above the fixed bar.
Route prefetch is disabled on calendar/navigation links to avoid fetching
calendar code or many detail links before the user needs them.

Calendar code and styles are split into the Schedule route. Day-detail code
has its own route chunk. The feature adds no dependency or frontend pilot seed.
The business date remains 2026-05-15 regardless of the real wall clock.

## Verification

Backend unit/HTTP tests cover the three supplied months, original colors and
legend, count-based completion, empty months, the business clock, authentication,
and strict input validation. Native adapter tests verify private token/query
forwarding, error mapping, rate limiting, and session cleanup.

`npm test` now includes native Node tests of the TypeScript calendar utility,
including Monday-first alignment, leap days, six-row months, cross-year month
changes, valid URL months, bounds, and foreground contrast. Node 22.22.3 supports
these TypeScript files directly without an additional test dependency.

`npm run test:e2e` includes a real production-browser calendar journey covering
all supplied day colors/counts, legend, 320px/390px/desktop layouts, SSR reuse,
month changes, deliberately reordered responses, empty months, errors/retry,
keyboard detail navigation, reload, and the bottom navigation. Run the existing
`npm run check` before it. Use a separate checkout for production verification
while a development server is active: Nuxt development and build commands share
generated files under `.nuxt` in one checkout.
