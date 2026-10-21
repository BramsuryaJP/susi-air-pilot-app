# Dependency audit

Source audit refreshed: **2026-10-21** against the current lockfiles: Nuxt still
reports 11 high affected entries and Nest reports zero. Deployment artifact
assessment below was performed on 20 October against the unchanged application
code and lockfiles. Repeat it when dependencies or build presets change.

## Current results

| Scope | Result |
| --- | --- |
| Nuxt source installation, all dependencies | 11 high affected package entries |
| Nest source installation, all dependencies | 0 findings |
| Fresh Nest installation after production pruning | 0 findings across 126 audited packages |
| Generated Vercel functions and pruned Nest package metadata | None of `braces`, `node-forge`, or `listhen` shipped or declared as runtime dependencies |

The original Nest starter had five findings through its unused `@nestjs/mau`
deployment CLI. Removing that tooling eliminated its dependency subtree. The
Nuxt starter and the current Nuxt installation have the same 11 affected
entries, propagated from the two advisories below; this is not 11 distinct
vulnerable functions.

## Unpatched upstream findings

- [`braces` stack-exhaustion denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm)
  affects versions through 3.0.3 when an attacker supplies deeply nested brace
  patterns to its recursive walkers.
- [`node-forge` RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv)
  affects versions through 1.4.0, accepting malformed nested algorithm elements
  during PKCS#1 v1.5 signature verification.

The registry still reports 3.0.3 and 1.4.0 as latest. Neither advisory lists a
patched version. Nuxt 3.21.11 remains the latest Nuxt 3 version returned by the
registry. npm proposes Nuxt 4.6.2, which conflicts with the brief's Nuxt 3
requirement. No forced major upgrade, arbitrary override, or audit suppression
has been applied. The source audit remains red and must not be reported as a
clean dependency tree.

## Deployment exposure assessment

The affected chains are `nuxt` / Nitro / `globby` / `fast-glob` / `micromatch`
/ `braces`, and `nuxt` / its CLI / `listhen` / `node-forge`. They belong to the
framework's build/development tooling. The application does not accept user
file glob patterns or certificates and does not call either vulnerable API.
The app's JWT verification uses HS256, not node-forge RSA verification. Hosting
providers terminate TLS; the production command does not start the development
HTTPS server.

The actual Nitro Vercel preset was built and its five Node 22 functions were
inspected. Its traced package metadata contains none of the three named
packages or dependency references to them. A fresh Nest build was pruned to
production dependencies, successfully started, served its health endpoint,
and completed authenticated profile retrieval. Its runtime metadata likewise
contains none of those packages. The deployment artifact check enforces these
boundaries in CI, along with private route headers and original fixture data.
The separate node-server build and browser regression suite also pass.

This supports deploying the compiled personal demonstration while retaining
Nuxt 3. It does **not** establish that the build environment, every bundled
function, or every other dependency is free of vulnerabilities. Build only
reviewed source with locked dependencies, keep build credentials scoped, avoid
publishing the source installation or development server as the runtime, and
revisit upstream patches before extending this into a production system.
Package metadata checks complement code review and behavior tests; they are
not a complete reachability or security proof.

## Reproduce

```sh
npm audit --prefix nuxt
npm audit --prefix nest
```

The Nuxt audit exits nonzero while these findings remain. CI's application
checks do not turn that source result into a passing audit. The additional
Deployment artifact checks job builds Vercel output, builds/prunes Nest,
exercises the pruned backend, and runs:

```sh
npm run check:deployment
```

Run deployment checks in a separate checkout: pruning dependencies would remove
local development tooling. See [free deployment](deployment.md) for the exact
hosting setup and the remaining live verification steps.
