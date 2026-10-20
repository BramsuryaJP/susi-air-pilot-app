# Susi Air Pilot App

Fullstack developer technical test built with Nuxt 3 and NestJS.

## Applications

- `nuxt/`: official Nuxt 3 starter, using Vue and TypeScript.
- `nest/`: official NestJS starter, using TypeScript.
- `mock-*.json`: the original fixtures supplied with the technical test.

## Requirements

- Node.js 22 LTS
- npm 11.21.1 (used to generate the lockfiles)

The npm 10.9.8 resolver crashed while installing the unchanged Nuxt starter.
Use npm 11 for this project; peer dependency validation remains enabled.

## Local development

Install dependencies in each application with `npm ci`.

```sh
cd nest
npm run start:dev
```

In another terminal:

```sh
cd nuxt
npm run dev -- --port 3001
```

The untouched starters both default to port 3000. The frontend uses port 3001
above so both can run at the same time.

## Delivery workflow

1. Generate the official starters, validate them, and push the baseline.
2. Organize the project structure on a separate `refactor/` branch.
3. Implement each feature on a focused `feat/` branch.
4. Keep visual changes on focused `style/` branches where appropriate.
5. Validate each change before committing and pushing it for review.

Comments, documentation, commit messages, and application copy use English.
The implementation will use **2026-05-15** as its configurable business date,
as required by the brief, including when a fixture contains another date.
