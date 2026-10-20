# Susi Air Pilot App

Fullstack developer technical test using **Nuxt 3, Pinia, SCSS, NestJS, and
TypeScript**. Development is incremental, with an independently reviewable
branch for each feature.

## Current milestone

The official starter baseline is on `main`. The `refactor/project-structure`
branch establishes the application boundaries, runtime configuration, and CI.
The starter welcome screens remain in place. Authentication, pilot data,
flight-hour calculations, documents, schedules, and the final interface are
subsequent features. This foundation is not the completed test submission.

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
| Nuxt | `NUXT_API_BASE` | `http://127.0.0.1:3000` | Private server-side API base URL |

The business date follows the brief, including where the documents fixture
contains a different date. No domain logic uses the machine's current date.
`NUXT_API_BASE` is reserved for the server-side API adapter in the authentication
feature. It is not exposed through public runtime configuration.

## Validation

```sh
npm run check
```

This runs frontend lint, type checks, and a production build; backend lint,
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
At this milestone, `npm test` runs backend tests. Frontend interaction tests
will accompany the actual user flows rather than testing placeholder markup.

GitHub Actions checks each application independently on pull requests and
pushes to `main`. Audit findings are documented separately from passing build
and behavior checks in [the dependency audit](docs/dependency-audit.md).

## Structure and engineering choices

See [architecture](docs/architecture.md) for the current layout, planned feature
boundaries, and performance decisions. See [contributing](CONTRIBUTING.md) for
the branch, commit, and review workflow.

The original JSON fixtures remain unchanged at the repository root. The
recruitment PDF stays local and is excluded from Git. Comments, documentation,
commit messages, and interface copy use English.

## Remaining submission work

- Implement and test the API and the three requested screens.
- Verify mobile layouts, keyboard access, stale-response handling, and bundles.
- Resolve or explicitly assess outstanding dependency advisories.
- Deploy both applications and record the actual verified URLs.
- Grant reviewers access to this private repository if needed.

No deployment or submission email has been sent.
