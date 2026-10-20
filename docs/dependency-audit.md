# Dependency audit

Audit date: **2026-10-20**. Results describe the lockfiles at this foundation
milestone and must be refreshed when dependencies change.

## Results

| Application | Official starter baseline | Refactored foundation |
| --- | --- | --- |
| Nuxt | 11 high findings | 11 high findings |
| Nest | 5 findings: 2 low, 1 moderate, 2 high | 0 findings |

The Nest findings came through the unused `@nestjs/mau` deployment CLI.
Removing that optional tooling removed its vulnerable dependency subtree.
The backend's production dependencies remain installed and its build and tests
are checked independently.

## Outstanding Nuxt findings

The 11 affected package entries propagate from two upstream advisories:

- [`braces` stack-exhaustion denial of service](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm),
  reported for versions through 3.0.3.
- [`node-forge` RSA signature verification](https://github.com/advisories/GHSA-86w9-cpqp-85rv),
  reported for versions through 1.4.0.

The registry's latest versions were 3.0.3 and 1.4.0 respectively when checked.
The installed Nuxt version is 3.21.11. npm's offered remediation upgrades Nuxt
to 4.6.2, while the test brief specifically requires Nuxt 3. No forced major
upgrade, arbitrary override, or audit suppression has been applied.

This report does not establish whether either vulnerable function is reachable
in the final deployed application. That assessment and a supported remediation
remain open work before deployment. Build, lint, type-check, and behavior-test
success do not clear these findings. The CI application checks currently do
not use the dependency audit as a passing gate.

## Reproduce

```sh
npm audit --prefix nuxt
npm audit --prefix nest
```

An audit command exits nonzero when findings remain. Re-evaluate upstream
patches before deployment and keep any remediation in a focused dependency
change with the full application checks.
