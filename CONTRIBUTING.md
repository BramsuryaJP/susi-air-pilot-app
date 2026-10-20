# Contributing

## Branches and commits

Start a focused branch from an up-to-date `main` after its prerequisite change
has been reviewed and merged. Do not stack unrelated features in one branch.

| Change | Example branch | Example commit |
| --- | --- | --- |
| Feature | `feat/authentication` | `feat(auth): add pilot sign-in` |
| Fix | `fix/calendar-navigation` | `fix(schedule): reject stale month responses` |
| Structure | `refactor/project-structure` | `refactor: establish application boundaries` |
| Visual styling | `style/pilot-interface` | `style(home): refine mobile limit cards` |
| Performance | `perf/summary-index` | `perf(flight-hours): index rolling sums` |
| Tests | `test/pilot-journeys` | `test: cover pilot navigation journeys` |
| Tooling | `chore/dependency-updates` | `chore(deps): update compatible dependencies` |

Conventional Commit messages describe the concrete change in English.
Keep commits focused and avoid unrelated formatting changes.

## Before pushing

1. Run `npm run check`, or the relevant application check for a scoped change.
2. Review `git diff` and `git diff --check`.
3. Check that only intended paths are staged and no secrets or build output
   are included.
4. Commit and push the feature branch.
5. Open a pull request with the behavior change, validation, and limitations.
6. Inspect the remote CI result before considering the change ready to merge.

For a bug or a new behavior, first demonstrate a failing behavioral test, then
implement the change and run the test again. For a pure refactor, preserve the
existing tests and verify that the behavior is unchanged.

## Implementation rules

- Use TypeScript, Vue Composition API, and `<script setup lang="ts">`.
- Keep business calculations and fixture access in Nest services.
- Use API responses for pilot data. Do not bundle fixtures in the frontend.
- Keep controllers thin and validate input through DTOs.
- Use UTC date-only arithmetic with the configured business date.
- Keep Pinia state scoped to a Nuxt application/request; do not create a
  module-level shared store for SSR.
- Add shared abstractions only when there is an actual second consumer.
- Measure bundle output and verify browser behavior for performance changes.
- Add dependencies deliberately; retain the lockfiles and review audit output.

The local author identity for this repository is
`BramsuryaJP <bramsuryajohannespaulus.work@gmail.com>`.
