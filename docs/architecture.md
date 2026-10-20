# Architecture

## Current foundation

```text
.
├── nuxt/
│   ├── src/
│   │   ├── app.vue
│   │   ├── assets/scss/main.scss
│   │   ├── layouts/default.vue
│   │   └── pages/index.vue
│   ├── server/
│   ├── public/
│   ├── nuxt.config.ts
│   └── package-lock.json
├── nest/
│   ├── src/
│   │   ├── config/
│   │   ├── modules/auth/
│   │   ├── modules/documents/
│   │   ├── modules/flight-hours/
│   │   ├── modules/pilot/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── test/
│   └── package-lock.json
├── scripts/
├── docs/
└── .github/workflows/ci.yml
```

The two application directories and independent lockfiles match the requested
deliverable and allow separate deployments. Root scripts orchestrate checks
without a monorepo build framework or root dependencies.

Nuxt's `srcDir` contains Vue application code. `serverDir` explicitly retains
Nitro handlers at `nuxt/server`, outside the browser application source.
The root component composes a layout and the file-based router. The current
pages render sign-in and the authenticated profile with flight-hour cards, chart, and document expiry list.
See `docs/flight-hours.md` and `docs/documents.md` for calculation and rendering policies.

Nest's root module composes authentication, pilot, flight-hours, and documents modules. The starter
welcome module was removed when the global authentication guard was added.
See `docs/authentication.md` for the implemented session boundary.

Configuration validates the port and the date-only business clock at startup.
The default date is **2026-05-15**, as required by the brief. Real date parsing
is anchored to UTC and rejects rollover dates such as 2026-02-29. Shutdown
hooks allow the process to close its resources on termination.

## Feature boundaries to add incrementally

Authentication, pilot profile, flight hours, and documents are implemented. Remaining feature boundaries
are added as needed, without empty placeholder directories:

| Area | Responsibility |
| --- | --- |
| `auth` | Login DTO, pilot credentials, token issuance and global guard |
| `pilot` | Profile returned from the seeded service |
| `flight-hours` | Date-range queries, rolling summaries and limit cards |
| `documents` | Expiry dates and urgency derived on the server |
| `schedules` | Month filtering, duty entries and legend |
| `common` | Exception filter and date helpers only when shared |
| Nuxt `stores` | SSR-safe session/profile and selected UI state |
| Nuxt `server/api` | Narrow API adapter and HttpOnly session cookie |
| Nuxt `components` | Reusable UI extracted from actual screen requirements |

Keep controllers and validated DTOs alongside their feature's service.
Load the supplied fixtures once when Nest boots. Include data assets in the
backend deployment artifact; never import fixtures from Vue code. The original
root inputs remain available for comparison.

## Data and performance rules for feature work

- Compute rolling windows on the server, with an index built once at startup.
  Use integer tenths of an hour internally to avoid accumulated decimal drift.
- Emit every day in a requested range, including missing or zero-hour days.
  State and test the policy for dates before the dataset and future projections.
- Return only the requested month or chart interval rather than the complete
  historical dataset.
- Preserve Nuxt's route-based code splitting. Split the chart component from
  the main route and prefer lightweight SVG to a general chart package unless
  interaction requirements justify one.
- Use `useAsyncData`/`useFetch` or Pinia actions coordinated with `callOnce`
  to transfer SSR data without fetching it twice during hydration.
- Keep rapidly changing request keys distinct and reject stale responses.
  Test rapid range/month changes with intentionally reordered responses.
- Keep tokens server-side, use private runtime configuration for the backend
  address, and validate browser-origin writes at the server adapter.
- Keep SCSS global rules small. Add brand tokens and component styles with
  the interface rather than shipping an unused design system in this refactor.
- Inspect production bundle sizes and browser behavior before claiming an
  optimization. Inventory and build checks do not prove visual quality.

Pinia now holds the request-scoped session profile. Vue Router is aligned with
the version family used by Nuxt 3, rather
than retaining the starter's additional major-version router dependency.

## Verification

The CI matrix runs the same root application checks used locally. It includes
type checks, lint, backend tests, production builds, and actual production HTTP
startup checks. Each smoke check reserves a temporary port, starts its own
child process, waits for a valid response, and terminates the child afterward.

CI actions use verified commit hashes with read-only repository permissions.
Redundant runs for the same ref are cancelled. Runtime dependency audit status
is tracked separately in `docs/dependency-audit.md`; a passing build is not a
claim that the dependency tree has no advisories.
