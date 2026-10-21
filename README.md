# Susi Air Pilot App

Fullstack developer technical test using **Nuxt 3, Pinia, SCSS, NestJS, and
TypeScript**. Development is incremental, with an independently reviewable
branch for each feature.

## Review status

Authentication, flight hours, documents, schedules, and final brand styling
are deployed from `main`, together with health and deployment checks. Both
applications run as separate Vercel Hobby projects. Production follows `main`;
check the [deployment history](https://github.com/BramsuryaJP/susi-air-pilot-app/deployments)
for the currently deployed revision.
See [submission review](docs/submission.md) for requirement coverage, verification,
and delivery notes.

## Hosted demonstration

- Frontend: [Susi Air Pilot App](https://susi-air-pilot-app-self.vercel.app)
- Backend: [public health endpoint](https://susi-air-pilot-api.vercel.app/health)
- Demo sign-in: `johndoe` / `susiairtest`

Both projects use the personal Vercel Hobby workspace. No database or paid
hosting resource is required. The account is seeded demonstration data.

**Hosting deviation:** the brief names Railway, Render, or Fly for the backend.
This submission uses Vercel Hobby for NestJS because Render required a payment
card and the project has a no-payment-method constraint. The API is deployed
and tested independently, but the backend provider differs from the listed
choices. This deviation must be disclosed to the reviewer.

See [authentication](docs/authentication.md) for the account and session boundary,
[flight hours](docs/flight-hours.md) for rolling calculations,
[documents](docs/documents.md) for expiry rules, and
[schedules](docs/schedules.md) for the monthly API and calendar behavior, and
[interface](docs/interface.md) for branding, asset sources, and accessibility.
See [free deployment](docs/deployment.md) for Vercel Hobby setup and the Render fallback,
provider limits, required variables, and the verification checklist.

## Requirements

- Node.js **22.22.3**, recorded in `.nvmrc`
- npm **11.21.1**, recorded in `package.json`

The npm 10.9.8 resolver crashed on the unchanged Nuxt starter. npm 11 installed
the dependencies with peer validation enabled. If your npm version differs,
substitute `npx --yes npm@11.21.1` for `npm` in the commands below. No global
package-manager change is required.

## Setup

```sh
git clone https://github.com/BramsuryaJP/susi-air-pilot-app.git
cd susi-air-pilot-app
nvm install
nvm use
npm run setup
```

The repository is public and can be cloned without collaborator access.
The `nvm` commands are optional if the required Node version is already installed.
This runs `npm ci` in each application using its own lockfile. There are no
root dependencies to install. To install just one application:

```sh
npm run setup -- nuxt
npm run setup -- nest
```

The separate lockfiles keep each application independently deployable.

## Development

Run the backend in one terminal:

```sh
npm run dev:nest
```

Run the frontend in another:

```sh
npm run dev:nuxt
```

- Frontend: <http://localhost:3001>
- Backend: <http://localhost:3000>

Sign in with `johndoe` / `susiairtest`. Data is loaded into Nest from the
provided JSON files at startup; there is no database to create or migrate.

## Run production builds locally

Build both applications after setup:

```sh
npm run build
```

Start Nest in one terminal with a local production signing secret:

```sh
JWT_SECRET="$(openssl rand -hex 32)" NODE_ENV=production npm --prefix nest run start:prod
```

Start Nuxt in another terminal, using the same browser origin as development:

```sh
NODE_ENV=production HOST=127.0.0.1 PORT=3001 node nuxt/.output/server/index.mjs
```

Open <http://localhost:3001>. Stop any servers using ports 3000/3001 first, or
configure different ports and matching `NUXT_API_BASE` / `NUXT_APP_ORIGIN` values.
The standalone Node commands use the regular node-server build. Provider builds
use the committed Vercel presets described in [deployment](docs/deployment.md).

## Environment variables

Defaults allow local development without creating an environment file.
Copy the application's `.env.example` to `.env` to override them.

| App | Variable | Default | Purpose |
| --- | --- | --- | --- |
| Nest | `PORT` | `3000` | Validated HTTP port |
| Nest | `BUSINESS_DATE` | `2026-05-15` | Validated date-only business clock |
| Nest | `JWT_SECRET` | Random in development | Required production signing secret, at least 32 characters |
| Nuxt | `NUXT_API_BASE` | `http://127.0.0.1:3000` | Private server-side API base URL |
| Nuxt | `NUXT_APP_ORIGIN` | `http://localhost:3001` | Exact frontend origin; HTTPS in deployment |

The business date follows the brief, including where the documents fixture
contains a different date. No domain logic uses the machine's current date.
`NUXT_API_BASE` is used only by the server-side adapter and is not exposed
through public runtime configuration. Browser API writes require an Origin
matching `NUXT_APP_ORIGIN`. Use `localhost:3001` for local development unless
you update that variable. Production requires an explicit `JWT_SECRET`;
generate one with `openssl rand -hex 32`.

## REST API

All six brief endpoints are implemented in Nest. Authenticate with the demo
credentials at `POST /auth/login`, then send the returned token as
`Authorization: Bearer <accessToken>` for pilot data. The browser uses Nuxt's
same-origin `/api` adapter and an HttpOnly cookie instead of managing the token.

| Method | Nest path | Purpose |
| --- | --- | --- |
| POST | `/auth/login` | Validate `{ username, password }` and issue a token |
| GET | `/pilot/me` | Name, total flight hours, avatar URL, and business date |
| GET | `/flight-hours?from=2026-05-08&to=2026-05-22` | Inclusive daily values |
| GET | `/flight-hours/summary?range=1w` | Server-calculated cards and 15 chart points |
| GET | `/documents` | Documents, expiry dates, and urgency states |
| GET | `/schedules?year=2026&month=05` | One month of duties and its legend |

`GET /health` is an additional public operational endpoint returning only
`{ "status": "ok" }`. All brief pilot-data endpoints require authentication.
Parameterized endpoints use validated DTOs; a global exception filter returns
the same error envelope. See the feature guides for response and edge-case policies.

## Validation

```sh
npm run check
```

This runs frontend lint, type checks, a production build, and adapter tests; backend lint,
type checks, unit tests, HTTP end-to-end tests, and a production build; then
starts each built application on a temporary port and checks its HTTP response.
The backend also exercises a captured-listener serverless adapter. The smoke
checks stop their own servers afterward.

To check just one application:

```sh
npm run check -- nuxt
npm run check -- nest
```

Other commands: `npm run build`, `npm run lint`, `npm run typecheck`,
`npm test`, and `npm run smoke`. The smoke command requires existing builds.
`npm test` runs backend unit tests and frontend calendar utility tests. To run
the browser authentication, flight-hour, document, calendar, and responsive
interface journeys after `npm run check` has built both apps:

```sh
npm --prefix nuxt exec -- playwright install chromium
npm run test:e2e
```

The browser suite starts and stops its own production servers on ports 4310/4311.
Workspace, error-recovery, schedule-picker, schedule-calendar, unavailable-page, chart-interaction, route-privacy, and session-security
projects run in separate invocations
so real session checks stay within the unchanged production rate limits. Run all with
`npm run test:e2e`; their screenshots and traces use separate output folders.
Run build checks in a separate checkout if a Nuxt development server is active;
both commands generate files under `.nuxt`.

GitHub Actions checks each application independently on pull requests and
pushes to `main`. Audit findings are documented separately from passing build
and behavior checks in [the dependency audit](docs/dependency-audit.md).

## Structure and engineering choices

See [architecture](docs/architecture.md) for the current layout, feature
boundaries, and performance decisions. See [contributing](CONTRIBUTING.md) for
the branch, commit, and review workflow.

The original JSON fixtures remain unchanged at the repository root. The
backend packages unchanged flight-hours, documents, and schedules fixture copies in
`nest/src/data` to seed services at startup and support independent deployment. The
recruitment PDF stays local and is excluded from Git. Comments, documentation,
commit messages, and interface copy use English.

The main choices are:

- Separate Nuxt and Nest roots and lockfiles keep each application independently
  installable and deployable without extra monorepo tooling.
- Nest owns the fixed business clock, document urgency, completion counts, and
  all rolling sums. A startup prefix-sum index uses integer tenths for exact
  decimal totals and O(1) rolling-window lookups.
- Missing dates and dates before the seed contribute zero. Future chart values
  include supplied planned hours and use a dashed line. Above-scale values keep
  their numeric values and receive a visible overflow marker.
- Pinia stores session/profile and UI selections per Nuxt request. SSR async
  data is reused at hydration; cancelled requests cannot replace newer selections.
- The server adapter keeps tokens and the API address out of browser state.
  Private responses are not publicly cached; login is disabled until hydration.
- Route chunks, dynamically imported chart/documents, a small SVG chart, and
  local font/logo assets keep feature loading small. Static named Lucide imports
  include only the UI icons used by each component.

## Scope, limitations, and submission

Logbook and More open protected placeholder pages reading "Page unavailable",
with working navigation back to Home or Schedule. Their complete features are
outside the brief. Missing pages
use a branded 404 screen. Its "Back to Home" link loads a fresh document so session
validation runs again, restoring the dashboard or redirecting to sign-in when
the session is no longer valid. Other page errors use safe recovery copy without
displaying internal diagnostics. Date links intentionally
open "Detail page coming soon", as requested. The avatar is a local placeholder
URL returned by the API. UI icons use Lucide's official Vue package through
static named imports. No frontend pilot fixtures or database are needed.

The application has been deployed and reviewed. The public repository can be
reviewed without collaborator access. The brief requests the repository link
and both live deployment URLs; include the demo account and hosting deviation
with those links. No submission email has been sent.

With more time:

- Track upstream fixes for the assessed dependency advisories.
- Measure hosted cold starts, request latency, and browser performance on real devices.
- Add persistent accounts, credential lifecycle management, token revocation,
  and distributed rate limiting if extending beyond this seeded demonstration.
- Confirm the backend hosting alternative with the reviewer, or move to a
  listed provider if its account requirements can be met.

Security behavior and remaining demonstration limits are documented in the
[authentication guide](docs/authentication.md): protected read failures never
mutate session cookies, expired sessions show an explanatory sign-in notice,
and production SSR uses a per-document script nonce with enforced CSP. Existing
[dependency findings](docs/dependency-audit.md) remain a separate assessment.
