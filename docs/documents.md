# Documents

## API and expiry rules

Nest exposes authenticated `GET /documents`. Its response contains `today`,
`warningDays`, and a `documents` array. Every item retains the supplied `id`,
`label`, and `expiryDate`, plus server-derived `daysRemaining` and `status`.
The endpoint accepts no configuration from query parameters.

The service imports the unchanged documents fixture at startup. It deliberately
uses the configured business date **2026-05-15**, overriding the fixture's
`2026-05-31` date to follow the brief. UTC midnight arithmetic counts calendar
days without daylight-saving or local-time offsets. The supplied warning
threshold is 30 days:

| Days remaining | Status | Badge |
| --- | --- | --- |
| Zero or fewer | `expired` | Expired, red |
| 1 through 30 | `soon` | Due soon, amber |
| Greater than 30 | `safe` | Valid, green |

A document expiring today is already expired under the supplied rule. With the
default business date, recurrent and PPC documents are safe, the license and
medical documents are soon, and security clearance is expired. The original
fixture is preserved at the repository root and packaged as an identical copy
under `nest/src/data` for an independent backend deployment.

The business date is immutable for a running process, so the five statuses are
computed once at startup. Changing `BUSINESS_DATE` requires a backend restart.
A future editable document source would need to recompute these fields when
its records or clock change.

## Browser behavior

Nuxt exposes the fixed `GET /api/documents` adapter. It reads only the HttpOnly
session cookie, forwards the bearer token privately, and does not forward
browser-supplied clock/threshold overrides or arbitrary authorization headers.
Both endpoints return `Cache-Control: private, no-store`; the adapter varies
responses by Cookie. The existing adapter clears invalid sessions on 401,
preserves sessions during outages, and hides upstream diagnostics.

The Home page renders a separate documents component with scoped SCSS. Status
colors and labels come directly from the API's status; the browser only formats
dates and day-count descriptions. Badge text accompanies color so urgency can
be understood without relying on color alone. Loading, empty, failure, retry,
and refresh states are explicit. Refresh requests coalesce while pending.

`useAsyncData` transfers initial records in the SSR payload and reuses them
without a hydration fetch. The component and its styles are split from the
Home entry; the sign-in route does not import them. Read-only response state
stays in Nuxt's request-scoped data lifecycle rather than duplicating it in a
second Pinia store. Existing session and flight-range state remain in Pinia.

## Verification

Unit tests cover the conflicting fixture date, negative/zero/1/30/31-day
boundaries, leap years, year boundaries, and independence from the wall clock.
HTTP tests exercise the global guard, private responses, derived metadata, and
clock-override isolation. Native adapter tests cover private token forwarding,
ignored query overrides, rate limiting, cookie cleanup, and masked outages.

The real-browser documents journey compares all five rows to the API, verifies
all three urgency states and SSR reuse, checks mobile/desktop layout, and
exercises failure/retry and an empty API result. Empty and outage responses are
controlled only inside tests; the application always reads the real backend.

Read-only feature journeys authenticate once per Playwright worker and copy
that session into separate browser contexts. The explicit authentication
journeys still test login and rate limits independently. This keeps the suite
within the application's real login limit without relaxing it or writing
session state to disk. Run `npm run check` and then `npm run test:e2e`.
