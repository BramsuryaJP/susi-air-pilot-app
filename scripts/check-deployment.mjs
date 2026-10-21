import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join, relative } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'nuxt/.vercel/output');
const readJson = async (path) => JSON.parse(await readFile(path, 'utf8'));
const backendConfig = await readJson(join(root, 'nest/vercel.json'));
assert.equal(backendConfig.framework, 'nestjs');
assert.equal(backendConfig.env.NODE_OPTIONS, '--experimental-require-module');
assert.deepEqual(backendConfig.regions, ['sin1']);
const config = await readJson(join(output, 'config.json'));
assert.equal(config.version, 3);
assert.equal(config.framework.name, 'nuxt');
assert.match(config.framework.version, /^3\./);
function headersFor(path) {
  // Vercel applies all matching continue rules, from general to specific.
  return Object.assign(
    {},
    ...config.routes
      .filter(
        (route) => route.headers && new RegExp(`^${route.src}$`).test(path),
      )
      .map((route) =>
        Object.fromEntries(
          Object.entries(route.headers).map(([name, value]) => [
            name.toLowerCase(),
            value,
          ]),
        ),
      ),
  );
}
for (const path of ['/', '/login', '/schedule', '/duty/2026-05-15']) {
  const headers = headersFor(path);
  assert.match(
    headers['cache-control'] ?? '',
    /private.*no-store/,
    `${path} must not be publicly cached`,
  );
}
for (const path of [
  '/',
  '/login',
  '/Schedule/',
  '/api/auth/session',
  '/fonts/plus-jakarta-sans-latin-variable.woff2',
  '/brand/susi-air-white.png',
]) {
  const headers = headersFor(path);
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'DENY');
  assert.equal(headers['referrer-policy'], 'no-referrer');
}
assert.doesNotMatch(
  headersFor('/fonts/plus-jakarta-sans-latin-variable.woff2')[
    'cache-control'
  ] ?? '',
  /private|no-store/,
);

const blocked = new Set(['braces', 'node-forge', 'listhen']);
async function checkPackages(path, names, visited = new Set()) {
  const resolved = await realpath(path);
  if (visited.has(resolved)) return;
  visited.add(resolved);
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const child = join(path, entry.name);
    if (
      entry.isDirectory() ||
      (entry.isSymbolicLink() && (await stat(child)).isDirectory())
    ) {
      await checkPackages(child, names, visited);
    } else if (entry.name === 'package.json') {
      const pkg = await readJson(child);
      if (pkg.name) names.add(pkg.name);
      for (const name of [pkg.name, ...Object.keys(pkg.dependencies ?? {})])
        assert.ok(
          !blocked.has(name),
          `Affected build dependency shipped in ${relative(root, child)}: ${name}`,
        );
    }
  }
}
const names = new Set();
const functions = (await readdir(join(output, 'functions'))).filter((name) =>
  name.endsWith('.func'),
);
assert.ok(functions.length > 0, 'The frontend requires an SSR function');
for (const name of functions) {
  const path = join(output, 'functions', name);
  const runtime = await readJson(join(path, '.vc-config.json'));
  assert.equal(runtime.runtime, 'nodejs22.x');
  assert.ok((await stat(join(path, runtime.handler))).isFile());
  await checkPackages(path, names);
}
for (const path of [
  'brand/susi-air-white.png',
  'fonts/plus-jakarta-sans-latin-variable.woff2',
  'fonts/OFL.txt',
])
  assert.ok((await stat(join(output, 'static', path))).size > 0);
await checkPackages(join(root, 'nest/node_modules'), names);
assert.ok(
  !names.has('@nestjs/cli'),
  'Prune backend development dependencies before this check',
);
for (const name of ['flight-hours', 'documents', 'schedules']) {
  const source = await readJson(join(root, `mock-${name}.json`));
  assert.deepEqual(
    await readJson(join(root, `nest/dist/data/mock-${name}.json`)),
    source,
  );
}
console.log(
  `Deployment artifacts verified: ${functions.length} Nuxt 3 / Node 22 functions, private route headers, local assets, pruned backend, original fixture data; ${names.size} runtime package names checked.`,
);
