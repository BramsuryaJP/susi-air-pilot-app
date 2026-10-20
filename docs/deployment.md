# Free deployment

## Target and status

Use **Vercel Hobby** for the Nuxt frontend and **Render Free** for Nest. This
personal recruitment demonstration needs no database, paid compute, custom
domain, persistent disk, or paid trial. Use each provider's assigned HTTPS
subdomain. Account setup and GitHub repository access must be completed by the
repository owner. Grant access only to this repository when that choice exists.
Do not add a payment method or enable a paid plan for this test.

The repository contains deployment configuration. Live URLs are not yet
provisioned or verified; none are claimed here.

## Backend: Render Free

1. Sign in to [Render](https://dashboard.render.com) with the personal account
   that can access `BramsuryaJP/susi-air-pilot-app`.
2. After this branch is reviewed and merged, create a Blueprint from `main` and
   the repository-root `render.yaml`. Confirm that the service plan is **Free**.
3. The Blueprint selects `nest` as the root directory, Node 22.22.3, npm
   11.21.1, Singapore, and the fixed business date `2026-05-15`. It installs
   locked build dependencies, builds Nest, and prunes development packages.
   The production entry is `node dist/main.js`. Render supplies `PORT`.
4. Let Render generate `JWT_SECRET`. Do not copy it into Git, frontend
   configuration, screenshots, logs, or the README. Keep the value stable across
   restarts so existing sessions survive. Rotating it invalidates active tokens.
5. Wait for `GET /health` to return `200` with `{"status":"ok"}`. The response
   is non-cacheable and exposes no pilot, secret, or environment details.
   `/pilot/me`, documents, flight hours, and schedules still require a token.
6. Copy the actual backend HTTPS origin for the frontend's `NUXT_API_BASE`.

Automatic deploys are disabled in the Blueprint. Publish reviewed commits
manually after their checks pass. This prevents a merged commit from deploying
before validation finishes and avoids consuming free build minutes needlessly.

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
   | `NUXT_API_BASE` | Actual Render HTTPS origin, without a trailing slash |
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

[Render Free](https://render.com/docs/free) sleeps after 15 minutes without
traffic and normally needs about one minute to wake. Open the backend health
URL and wait for `200` before reviewing the frontend. The adapter deliberately
keeps its five-second timeout and does not automatically retry login writes.
A request made while the backend is waking can return a temporary service
error; retry after the health endpoint is ready. Do not add artificial
keep-alive traffic to defeat the free plan's sleep behavior.

Render supplies 750 free instance hours per workspace per month. It also has
bandwidth and build-minute limits; without a payment method, exhausting those
limits can suspend service or new builds rather than add paid capacity.
[Vercel Hobby](https://vercel.com/docs/plans/hobby) is intended for personal,
non-commercial projects and has its own usage limits. This deployment is a
personal technical-test demonstration, not a production airline system.

## Verification and review

`npm run check` and `npm run test:e2e` remain the application regression checks.
The additional CI deployment job builds the actual Vercel output, builds and
prunes Nest, exercises the pruned backend, and runs `npm run check:deployment`.
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
