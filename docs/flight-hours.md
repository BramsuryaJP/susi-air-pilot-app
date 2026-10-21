# Flight hours

## API

All endpoints require the existing bearer token and return private, non-cacheable
responses. Browser calls use the Nuxt adapter and its HttpOnly session cookie.
The backend address and token stay on the server.

| Nest endpoint | Nuxt adapter | Response |
| --- | --- | --- |
| `GET /flight-hours?from=YYYY-MM-DD&to=YYYY-MM-DD` | `GET /api/flight-hours` with the same query | Inclusive daily values, including zero-hour days |
| `GET /flight-hours/summary?range=1w` | `GET /api/flight-hours/summary` with the same query | Four limit cards, chart configuration, and 15 rolling-sum points |

Dates must be real calendar dates in exactly `YYYY-MM-DD` format. Daily queries
must contain both parameters, be ordered, and span at most 366 days. Summary
queries require one of `1w`, `1m`, `3m`, `6m`, or `1y`. Repeated parameters and
unknown fields are rejected. Nest DTOs and the global exception filter preserve
the existing validation contract. The adapter validates its own public input
before forwarding only the fixed route and allowed query fields.

## Calculation policy

The backend imports the supplied flight-hours fixture once at startup. A daily
lookup and prefix-sum index use **integer tenths of an hour**. Index construction
costs O(n) time and space across the supplied date interval; each rolling sum
costs O(1). A summary returns four cards and fifteen points without scanning the
historical dataset again. A daily response costs O(d) for at most 366 dates.

The business clock defaults to **2026-05-15**, independently of the system date.
For an endpoint date D and window N, sum the inclusive interval **D − N + 1
through D**. Cards use 1, 7, 30, and 365 days; chart windows use 7, 30, 90, 180,
and 365 days. Limits and chart bounds come from the fixture. All day arithmetic
uses UTC, including leap days and year boundaries.

Missing dates and dates before or after the dataset contribute zero. Supplied
hours after the business date are treated as **planned projections**, not
completed flights. Each future point is marked `isProjection`, with a dashed
line and explanatory caption. A future rolling window includes recorded hours
and supplied planned hours in that window. Today's cards exclude future dates.

The service method `rollingWindowBluffing()` contains the required rolling-sum
calculation and the exact comment specified by the brief. Card hours, remaining
hours, utilization percentages, and over-limit state are all computed in Nest.
Values above a limit remain intact; only remaining hours are floored at zero.

## Rendering and request ownership

Pinia holds the selected range, scoped to each Nuxt application. `useAsyncData`
transfers the initial summary in the SSR payload without another hydration
request. A range change calls the API. Cancellation and `dedupe: 'cancel'`
prevent an older response from replacing a newer selection. The chart is hidden
while loading or after a failure, so it cannot present an old range as current.
Errors expose a retry action. A lost session redirects to sign-in.

The SVG chart is dynamically imported into its own chunk with component-scoped
styles. It adds no chart dependency. The axis uses the exact configured maximum;
points above that scale receive an overflow marker rather than expanding or
breaking the layout. The accessible daily-value table retains every numeric
value, including values above the scale. Chart geometry alone is clamped;
response values are never changed by the frontend.

## Verification

Unit tests compare every point in all five ranges against an independent naive
sum over the original seed. They cover dataset edges, zero days, UTC leap days,
range bounds, projections, decimal precision, and over-limit values. HTTP tests
exercise the real guards, DTO validation, private responses, and error filter.

The production browser suite checks card values against the real API, all range
toggles, SSR hydration reuse, deliberately reordered responses, errors and retry,
the daily endpoint, an accessible data table, and mobile/desktop layouts. Run
`npm run check`, then `npm run test:e2e` after installing the test browser as
described in the authentication guide.

Documents and schedules are implemented in their own modules. Brand artwork,
local typography, and responsive presentation are described in [the interface guide](interface.md).

The daily-value disclosure uses native details/summary controls, a date count,
and a caption identifying the rolling window in hours. Numeric values remain
right-aligned and unchanged; Recorded/Planned status text and a Today badge
make the rows easier to scan. Its layout preserves all dates at narrow widths
and uses the shared focus policy without a new dependency or client state.

Chart hover, keyboard, and tap inspection shows the same API series values as
the daily table. A selected point above `yMax` retains its full value and an
explicit scale note. Selection is local presentation state, resets with the
summary, and does not trigger another request or alter chart bounds.
