# Nest backend

NestJS application with TypeScript, feature modules, and validated runtime
configuration, JWT authentication, and seeded pilot, flight-hour, document,
and schedule services. `POST /auth/login` and the minimal `GET /health` are
public; every pilot-data endpoint requires the issued bearer token.

```sh
npm ci
npm run start:dev
```

The default port is `3000`. The `.env.example` file lists the available
variables. `BUSINESS_DATE` defaults to `2026-05-15`, independent of the system
date. Configuration rejects invalid ports and invalid date-only strings.
Production requires `JWT_SECRET` with at least 32 characters. Development
generates a per-process secret when no value is provided.

```sh
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run start:prod
```

The [root README](../README.md) documents the pinned Node/npm versions,
all API endpoints, local production commands, cross-application checks,
live deployments, and dependency-audit status.
