# Nuxt frontend

Nuxt 3 application with TypeScript, Pinia, and SCSS.

```sh
npm ci
npm run dev
```

Development runs on <http://localhost:3001>. The Vue source is in `src/`;
server-only Nitro handlers belong in `server/`. Put the backend base URL in
`NUXT_API_BASE` when the API adapter is added. It is private runtime config.

```sh
npm run lint
npm run typecheck
npm run build
node .output/server/index.mjs
```

Set `PORT` when running the production server on a custom port. The root
README documents the pinned Node/npm versions and the complete validation
workflow. No fixture data belongs in the frontend bundle.
