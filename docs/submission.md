# Submission review

Review date: **21 October 2026**. Production follows `main`; the
[deployment history](https://github.com/BramsuryaJP/susi-air-pilot-app/deployments)
records each deployed revision. Earlier verification results below retain
their original release references.

## Requirement coverage

| Brief requirement | Implementation and verification |
| --- | --- |
| `/nuxt` and `/nest`; Nuxt 3, Composition API, Pinia, SCSS, NestJS, TypeScript | Independent application roots and lockfiles; typed Vue setup scripts; application lint, type checks, and production builds |
| Load the supplied JSON at startup; no database required | Nest services import unchanged copies under `nest/src/data`; original root fixtures are retained |
| Login and authenticated pilot profile | Auth/pilot modules, issued JWT, global token guard, seeded account; auth HTTP and browser journeys |
| Daily flight-hour endpoint | Inclusive range with zero-filled missing days; DTO validation and HTTP tests |
| Server rolling sums | `FlightHoursService.rollingWindowBluffing()` with the exact required comment immediately above it; independent naive-sum comparison for every chart point in all five ranges |
| Four cards | Today, rolling 7/30/365-day sums with limits 8/40/100/1050; API-derived hours, remaining hours, and visual meters |
| Chart centered on today, five toggles, fixed bounds and red limit line | Fifteen points from 8 through 22 May 2026; windows 7/30/90/180/365, limits 40/100/300/600/1050, maxima 45/125/325/625/1200; browser range tests |
| Zero days, early windows, future values, and above-limit periods | Integer tenths, zero-fill outside seed, explicit planned projections, overflow markers and a numeric table; unit and browser checks |
| Fixed business date | Configured `2026-05-15`; UTC date-only calculations; takes precedence over the documents fixture's different date |
| Documents and urgency badges | API-derived expiry days and safe/soon/expired states; boundary tests and browser checks for all five documents |
| Monthly schedules and a request on month change | Validated month endpoint, startup month index, cancellable requests, previous/next controls, and reordered-response browser tests |
| Day colors, completion, legend, date placeholder | Original API `base_color` on compact duty bands with visible duty/base codes; completion from count equality; remaining-duty count otherwise; API legend below the calendar and protected date links |
| Sign-in, Home, and Schedule screens | Live API data through Nuxt's server adapter; no pilot JSON in frontend source; bad-credential, reload, logout, empty/error/retry journeys |
| Bottom navigation | All four tabs work; Logbook and More open protected "Page unavailable" placeholders because their complete features are outside scope |
| Module/controller/service/DTO separation and consistent errors | Feature modules, validated request DTOs, global validation pipe and exception filter; HTTP rejection tests |
| Minimal mobile-first airline interface | Brief palette, official local Susi Air logo, local Plus Jakarta Sans, rounded cards, pill controls, inline line icons; responsive and keyboard browser checks plus screenshot review |
| Live frontend and backend | Separate working Vercel Hobby deployments; backend provider deviation is disclosed below |
| Setup, environment variables, choices, and future improvements | Root README and linked feature/deployment guides; no database setup needed |

For the calculation, expiry, request ownership, and rendering policies, see
[flight hours](flight-hours.md), [documents](documents.md),
[schedules](schedules.md), [authentication](authentication.md), and
[interface](interface.md).

## Delivery links

- Repository: <https://github.com/BramsuryaJP/susi-air-pilot-app>
- Frontend: <https://susi-air-pilot-app-self.vercel.app>
- Backend health: <https://susi-air-pilot-api.vercel.app/health>
- Demo account: `johndoe` / `susiairtest`

The repository remains private by the owner's choice. **Reviewer access is
pending** and must be granted before the repository link can be reviewed.
The brief asks for the repository and both deployment URLs. Include the demo
account and the backend-hosting deviation with those links. Submission itself
is a separate manual step; no email has been sent.

## Deviations and limitations

- **Backend provider:** the brief lists Railway, Render, or Fly. The API uses
  Vercel Hobby instead because Render required a payment card and a temporary
  authorization. No card, paid service, or Render resource was provisioned.
  This delivers a live NestJS API but does not match the listed backend providers.
  Disclose the alternative for reviewer acceptance.
- **Additional public endpoint:** `/health` exposes only a constant status for
  operational checks. All five brief pilot-data GET endpoints remain guarded;
  `/auth/login` is the only public brief endpoint.
- **Presentation choices:** the pilot avatar is a local placeholder returned by
  the backend. Navigation uses small inline SVG line icons rather than a named
  icon package. Original duty colors and legend codes follow the supplied data,
  even where the brief's example names differ.
- **Dependency findings:** the documented Nuxt source audit has unresolved
  upstream findings. Passing behavior checks do not mean a clean audit.
  See [dependency assessment](dependency-audit.md) for scope and reproducible commands.
- **Demonstration scope:** one seeded account, no persistence, no immediate
  bearer-token revocation, and per-instance rate limiting. These are documented
  limits rather than production airline capabilities.

## Verification

The deployed `7e4081e` release passed all four
[main CI jobs](https://github.com/BramsuryaJP/susi-air-pilot-app/actions/runs/39458607241),
including ten real-browser journeys. Production verification on 20 October 2026
at 23:37 WIB passed API, sign-in, cookie, reload, calendar, logout, and responsive
checks; [PR #9](https://github.com/BramsuryaJP/susi-air-pilot-app/pull/9) records
the release results. A provider build is not the sole readiness check.

The final review on **21 October 2026** repeated application lint, type checks,
both production builds, five frontend calendar tests, eight server-adapter
tests, 47 Nest unit tests, 68 HTTP tests, standalone/captured-listener smoke
checks, and all ten browser journeys. They passed against an exact source
snapshot without interrupting development servers.

Fresh HTTPS production checks also passed all six brief endpoints, anonymous
rejection, DTO validation, exact chart bounds, and 75 rolling points compared
with independent sums over the original fixture. The browser passed all five
range toggles, live documents and schedules, secure cookie handling, SSR reload,
origin rejection, keyboard date navigation, and sign-out without runtime errors.
Screenshot review covered mobile and desktop layouts. The source dependency
audit was refreshed separately; its unresolved Nuxt findings remain disclosed.

The dashboard refinement in [PR #11](https://github.com/BramsuryaJP/susi-air-pilot-app/pull/11)
adds a compact overview, desktop chart/document columns, a shared masthead,
and a responsive calendar. The legend now sits below the date grid within the same calendar panel at every width, with
neutral date surfaces and exact-color duty bands. The chart has readable axes, a centered
Today marker, a separate limit key, and circular 44px range buttons. The
browser suite now contains **32 journeys**, including guest-only login redirects,
browser-back navigation, expired-session cleanup, and chart-label separation
at all five ranges and four widths, desktop/mobile layout, and exact table
values for an above-scale projection. The original login, API, and domain
behavior remain covered. See [interface](interface.md) for the design and
accessibility details.

The error recovery update adds a branded 404 and safe fallback for other page
errors. Six browser journeys cover complete dashboard recovery, HTTP error
statuses, keyboard and responsive behavior, removed/invalid sessions, anonymous
access, and recovery without JavaScript. The "Back to Home" action starts a new
document so SSR session validation cannot be skipped by the failed router state.

The Schedule month picker adds compact native month/year selects with accessible
labels, circular previous/next controls surrounding This month,
and a return to the API-derived current month. Five additional browser journeys
cover direct jumps, leap years, URL/history/reload synchronization, quick combined
selections during session validation, year bounds, keyboard access, reflow, and
server-rendered selections before JavaScript runs, and controls that wait for
hydration before accepting the first selection.

One additional focus journey checks all visible enabled controls across seven
routes at mobile and desktop widths, including shared inset geometry and
contrast on light, red, and navy surfaces.

Two navigation-page journeys cover Logbook/More placeholders, active tabs,
responsive layouts, private SSR headers including route variants, return links,
and missing/invalid/removed-session protection. These defined application routes
return HTTP 200 with "Page unavailable"; unknown routes still return the branded
404. The required duty-detail placeholder text remains unchanged.

For a fresh local verification:

```sh
npm run setup
npm run check
npm --prefix nuxt exec -- playwright install chromium
npm run test:e2e
```

The root check includes standalone and captured-listener backend smoke tests.
Deployment CI separately builds the real Nitro Vercel preset, prunes backend
dependencies, and checks packaged fixtures and runtime metadata. Run these
builds in an isolated checkout when development servers are active.

## Quick reviewer walkthrough

1. Open the frontend and sign in with the demo account. Home shows John Doe,
   1,444.5 total hours, and the fixed date 15 May 2026.
2. Check the daily/weekly/monthly/annual cards: 6.4, 25.2, 87.2, and 1013.8
   hours. Switch all five chart ranges and open the daily-value table.
3. Inspect all five documents: two Valid, two Due soon, and one Expired.
4. Open Schedule, navigate April/May/June, inspect colors and completion
   counts, then open a date placeholder and return. Reload and sign out.

Two chart-inspection journeys verify exact API values at every range and four
widths, tooltip containment, hovering the tooltip, dismissal, keyboard and tap
selection, range resets, and above-scale values. Hover does not issue requests.
