# Susi Air Pilot App

Fullstack developer technical test using **Nuxt 3, Pinia, SCSS, NestJS, and
TypeScript**. Development is incremental, with an independently reviewable
branch for each feature.

## Current milestone

Authentication is on `main`. The `feat/flight-hours` branch adds authenticated
daily queries, server-derived rolling summaries, Home limit cards, and a trend
chart. Documents, schedules, and the final branded interface are subsequent
features. This milestone is not the completed test submission.

See [authentication](docs/authentication.md) for the account, API contract,
session behavior, production settings, and security limitations. See
[flight hours](docs/flight-hours.md) for calculation policies and API details.

## Requirements

- Node.js **22.22.3**, recorded in `.nvmrc`
- npm **11.21.1**, recorded in `package.json`

The npm 10.9.8 resolver crashed on the unchanged Nuxt starter. npm 11 installed
the dependencies with peer validation enabled. If your npm version differs,
substitute `npx --yes npm@11.21.1` for `npm` in the commands below. No global
package-manager change is required.

## Setup

```sh
npm run setup
```

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

## Validation

```sh
npm run check
```

This runs frontend lint, type checks, a production build, and adapter tests; backend lint,
type checks, unit tests, HTTP end-to-end tests, and a production build; then
starts each built application on a temporary port and checks its HTTP response.
The smoke checks stop their own servers afterward.

To check just one application:

```sh
npm run check -- nuxt
npm run check -- nest
```

Other commands: `npm run build`, `npm run lint`, `npm run typecheck`,
`npm test`, and `npm run smoke`. The smoke command requires existing builds.
`npm test` runs backend unit tests. `npm run test:e2e` exercises the real
browser authentication and flight-hour journeys after both apps are built and Chromium is
installed. See the authentication guide for the browser setup command.

GitHub Actions checks each application independently on pull requests and
pushes to `main`. Audit findings are documented separately from passing build
and behavior checks in [the dependency audit](docs/dependency-audit.md).

## Structure and engineering choices

See [architecture](docs/architecture.md) for the current layout, planned feature
boundaries, and performance decisions. See [contributing](CONTRIBUTING.md) for
the branch, commit, and review workflow.

The original JSON fixtures remain unchanged at the repository root. The
backend packages an unchanged flight-hours fixture copy in `nest/src/data`
to seed the profile and flight-hour service at startup and support independent deployment. The
recruitment PDF stays local and is excluded from Git. Comments, documentation,
commit messages, and interface copy use English.

## Remaining submission work

- Implement the documents and schedules APIs and screens, including bottom navigation.
- Complete the brand artwork, typography, and dashboard interface.
- Verify mobile layouts, keyboard access, stale-response handling, and bundles.
- Resolve or explicitly assess outstanding dependency advisories.
- Deploy both applications and record the actual verified URLs.
- Grant reviewers access to this private repository if needed.

No deployment or submission email has been sent.
