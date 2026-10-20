# Nest backend

NestJS application with TypeScript, feature modules, and validated runtime
configuration. The `welcome` module temporarily preserves the official
starter's behavior while the pilot features are built.

```sh
npm ci
npm run start:dev
```

The default port is `3000`. The `.env.example` file lists the available
variables. `BUSINESS_DATE` defaults to `2026-05-15`, independent of the system
date. Configuration rejects invalid ports and invalid date-only strings.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run start:prod
```

The root README documents the pinned Node/npm versions, planned features,
cross-application checks, and dependency-audit status.
