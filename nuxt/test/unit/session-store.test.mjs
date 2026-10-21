import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { ref } = require('vue');
const { createPinia, setActivePinia } = require('pinia');
const { transpileModule, ModuleKind, ScriptTarget } = require('typescript');
const source = readFileSync(
  new URL('../../src/stores/session.ts', import.meta.url),
  'utf8',
);
const compiled = transpileModule(source, {
  compilerOptions: { module: ModuleKind.CommonJS, target: ScriptTarget.ES2022 },
}).outputText;
function storeFor(request) {
  setActivePinia(createPinia());
  const exports = {};
  vm.runInNewContext(
    compiled,
    { exports, require, ref, useRequestFetch: () => request },
    {
      filename: fileURLToPath(
        new URL('../../src/stores/session.ts', import.meta.url),
      ),
    },
  );
  return exports.useSessionStore();
}
const profile = {
  name: 'Pilot',
  totalFlightHours: 1,
  avatarUrl: '/pilot-avatar.svg',
  today: '2026-05-15',
};
const deferred = () => {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
};

for (const action of ['signIn', 'signOut']) {
  test(`session refresh waits for ${action} and cannot repopulate a completed transition`, async () => {
    const gate = deferred();
    let completed = false;
    let reads = 0;
    const store = storeFor(async (path) => {
      if (path === '/api/auth/session') {
        reads++;
        if (!completed) return profile;
        throw { statusCode: 401, data: { data: { code: 'AUTH_REQUIRED' } } };
      }
      await gate.promise;
      completed = true;
    });
    store.profile = profile;
    const mutation = store[action]({ username: 'pilot', password: 'password' });
    const refresh = store.refresh();
    try {
      await Promise.resolve();
      await Promise.resolve();
      assert.equal(
        reads,
        0,
        'Do not read a cookie while its authentication write is pending.',
      );
    } finally {
      gate.resolve();
      await Promise.all([mutation, refresh]);
    }
    assert.equal(reads, 1);
    assert.equal(store.profile, null);
    assert.equal(store.expired, false);
  });
}

test('a refresh preceding logout cannot repopulate state after logout completes', async () => {
  const gate = deferred();
  const store = storeFor(async (path) =>
    path === '/api/auth/session' ? gate.promise : undefined,
  );
  store.profile = profile;
  const refresh = store.refresh();
  await store.signOut();
  gate.resolve(profile);
  await refresh;
  assert.equal(store.profile, null);
  assert.equal(store.expired, false);
});

test('a failed authentication write does not leave session reads blocked', async () => {
  const store = storeFor(async (path) => {
    if (path === '/api/auth/session') return profile;
    throw new Error('Service unavailable');
  });
  await assert.rejects(store.signOut(), /Service unavailable/);
  await store.refresh();
  assert.equal(store.profile.name, 'Pilot');
  assert.equal(store.expired, false);
});
