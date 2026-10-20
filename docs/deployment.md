# Free deployment

## Target and status

Use **Vercel Hobby** for two independently deployed projects, with `nest` and
`nuxt` as their respective root directories. This personal recruitment
demonstration needs no database, paid compute, custom domain, persistent disk,
or paid trial. Do not add a payment method or enable a paid plan for this test.
Grant provider repository access only to this repository when that choice exists.

Deployment is in progress. The first API deployment completed its build but
failed at runtime. The fixes below have a local regression test; live verification
must finish before either URL is recorded as ready for review.

## Backend: Vercel Hobby

1. Import this repository into the personal Hobby workspace as a separate
   `susi-air-pilot-api` project. Select **nest** as its root directory.
   `nest/vercel.json` explicitly selects **NestJS**. Auto-detection can suggest
   Vite because Vitest uses it as a development dependency.
2. Keep the default NestJS build settings. The install command uses npm
   11.21.1 with locked dependencies and includes development build tools.
   Application engines select Node 22; functions run in Singapore (`sin1`).
3. Set private `JWT_SECRET` to a securely generated value with at least 32
   non-padding characters. Keep it stable across deployments. Set
   `BUSINESS_DATE=2026-05-15` for both Production and the Preview environment
   being tested. Do not put the secret in Git, the frontend, screenshots, or logs.
4. The non-secret runtime flag
   `NODE_OPTIONS=--experimental-require-module` is versioned in the backend
   configuration. [Vercel disables require(ESM) by default](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration).
   The CommonJS throttler package requires the ESM Nest 12 package; without
   this flag, the function exits with `ERR_REQUIRE_ESM` before handling requests.
5. Keep the bootstrap invocation free of top-level `await`. Vercel captures
   `listen()` during module import and starts the captured listener afterward.
   Waiting for that listener at module scope prevents import from finishing.
   `node scripts/smoke-serverless.mjs` reproduces this lifecycle and checks
   health, anonymous rejection, login, and profile retrieval on the built app.
   It simulates listener capture locally; it does not replace a live cloud test.
6. Wait for the deployed `GET /health` to return `200` with `{"status":"ok"}`
   and `Cache-Control: no-store`. Pilot data still requires a token. Copy the
   actual API HTTPS origin into the frontend's private `NUXT_API_BASE`.

[NestJS on Vercel](https://vercel.com/docs/frameworks/backend/nestjs) runs as
one function. Fixture data is read at startup and needs no writable filesystem.
In-memory rate limits are per function instance, not shared across instances.
Publish reviewed commits after checks pass and review Git deployment settings
to avoid unnecessary preview builds against the free allowance.

## Alternative backend: Render Free

`render.yaml` remains available for a standard Node server with `nest` as its
root, a build followed by production pruning, `node dist/main.js` as its start
command, `/health`, and automatic deploys disabled. It is optional, not a second
API required by the application. On this account, both Blueprint and manual Free
service creation requested a payment card and a temporary USD 1 authorization.
No card was submitted and no Render service was provisioned. Use Vercel for the
current no-payment-method deployment.

## Frontend: Vercel Hobby

1. Sign in to [Vercel](https://vercel.com) using a personal **Hobby** workspace,
   without starting a Pro trial. Import this repository and select **nuxt** as
   the root directory and **Nuxt** as the framework.
2. `nuxt/vercel.json` uses the locked npm version and the Nitro `vercel` preset.
   Keep SSR and server routes enabled; a static export cannot provide the
   existing private cookie/API adapter. The application-level Node engine selects
   Node 22, even with `nuxt` as the project root. The function region is Singapore (`sin1`).
3. Before deploying, set these private environment variables:

   | Variable | Value |
   | --- | --- |
   | `NUXT_API_BASE` | Actual NestJS API HTTPS origin, without a trailing slash |
   | `NUXT_APP_ORIGIN` | Exact stable frontend HTTPS origin, without a path |

   Set variables for the deployment environment being tested. If the stable
   frontend domain is assigned during the first deployment, set
   `NUXT_APP_ORIGIN` afterward and redeploy before testing sign-in. Preview
   URLs require their own matching origin; do not weaken the origin check to
   accept arbitrary hosts. Never add `JWT_SECRET` or use `NUXT_PUBLIC_*` for
   the backend address or credentials.
4. Use the stable production domain for review. Verify that reviewers can
   reach the pilot sign-in page without a separate hosting-account login.
   Preserve the application's own sign-in and cookie protections.
5. A Git-linked project can create deployments when branches change. Review
   its provider deployment settings before enabling ongoing automatic deploys.

## Free-tier behavior

[Vercel Hobby](https://vercel.com/docs/plans/hobby) is intended for personal,
non-commercial projects and has usage limits. This is a personal technical-test
demonstration, not a production airline system. Both projects consume the same
workspace allowance. Functions may cold-start; the frontend retains its five-second
API timeout and does not retry login writes automatically. Do not add keep-alive
traffic or enable paid capacity to work around a free-tier limit.

If Render is used later, [its Free plan](https://render.com/docs/free) sleeps
after 15 minutes without traffic and can take about one minute to wake. It has
750 free instance hours per workspace per month and separate bandwidth/build
limits. Open its health endpoint before reviewing the frontend after idle time.
The account's card-verification gate must be resolved separately if choosing it.

## Verification and review

`npm run check` and `npm run test:e2e` remain the application regression checks.
The additional CI deployment job builds the actual Vercel output, builds and
prunes Nest, exercises both standalone and captured-listener startup on the
pruned backend, and runs `npm run check:deployment`.
That command requires a Vercel build and pruned backend dependencies; run it
in an isolated checkout, not a checkout used by a development server. It checks
SSR function/runtime configuration, private route headers, shipped package
metadata, local brand assets, and packaged fixture data.

Before recording live URLs, verify the following against the deployed apps:

- Backend health is public and pilot endpoints reject anonymous requests.
- The demo account `johndoe` / `susiairtest` can sign in through the frontend.
- The session cookie is HttpOnly, Secure, SameSite=Strict, and host-only;
  profile retrieval, reload, sign-out, and protected routes work over HTTPS.
- Home cards/chart, all document states, and month navigation use live API
  data. The business date remains 15 May 2026.
- Source secrets and fixture data are absent from browser bundles. Private
  HTML and API responses are not cached publicly.
- Mobile layout and keyboard navigation work at the actual deployment URL.

Then replace the pending status above with the actual verified frontend and
backend URLs, deployed commit, and verification date. Assess the documented
[dependency findings](dependency-audit.md) separately from passing behavior
checks. With more time, address upstream patches, add persistent user management
and distributed rate limiting if this evolves beyond the seeded single-user
demonstration, and measure actual hosted cold-start and request latency.

No submission email is sent by the deployment workflow.
