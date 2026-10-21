# Nuxt frontend

Nuxt 3 application with TypeScript, Pinia, and SCSS.

```sh
npm ci
npm run dev
```

Development runs on <http://localhost:3001>. The Vue source is in `src/`;
server-only Nitro handlers belong in `server/`. Put the backend base URL in
`NUXT_API_BASE`. It is private runtime config. Set `NUXT_APP_ORIGIN` to the
exact browser origin (locally `http://localhost:3001`). Session tokens remain
in HttpOnly cookies; Pinia contains profile data only.

```sh
npm run lint
npm run typecheck
npm run build
NODE_ENV=production HOST=127.0.0.1 PORT=3001 node .output/server/index.mjs
```

This keeps the production browser origin at `http://localhost:3001`. Match
`NUXT_APP_ORIGIN` if changing the port. The [root README](../README.md)
documents the pinned Node/npm versions and the complete validation
workflow. No fixture data belongs in the frontend bundle.
