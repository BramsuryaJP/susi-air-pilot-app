import { randomBytes } from 'node:crypto';
import { defineConfig } from '@playwright/test';

const apiOrigin = 'http://127.0.0.1:4310';
const webOrigin = 'http://127.0.0.1:4311';

export default defineConfig({
  testDir: './test/browser',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: webOrigin, trace: 'retain-on-failure' },
  // Run each project in its own invocation to preserve production rate limits.
  projects: [
    {
      name: 'workspace',
      testIgnore: [
        '**/errors.spec.ts',
        '**/schedule-picker.spec.ts',
        '**/unavailable.spec.ts',
        '**/chart-interaction.spec.ts',
        '**/route-privacy.spec.ts',
        '**/session-security.spec.ts',
        '**/schedules.spec.ts',
        '**/sign-out.spec.ts',
      ],
      outputDir: './test-results/workspace',
    },
    {
      name: 'error-recovery',
      testMatch: '**/errors.spec.ts',
      outputDir: './test-results/error-recovery',
    },
    {
      name: 'schedule-picker',
      testMatch: '**/schedule-picker.spec.ts',
      outputDir: './test-results/schedule-picker',
    },
    {
      name: 'schedule-calendar',
      testMatch: '**/schedules.spec.ts',
      outputDir: './test-results/schedule-calendar',
    },
    {
      name: 'unavailable',
      testMatch: '**/unavailable.spec.ts',
      outputDir: './test-results/unavailable',
    },
    {
      name: 'chart-interaction',
      testMatch: '**/chart-interaction.spec.ts',
      outputDir: './test-results/chart-interaction',
    },
    {
      name: 'route-privacy',
      testMatch: '**/route-privacy.spec.ts',
      outputDir: './test-results/route-privacy',
    },
    {
      name: 'session-security',
      testMatch: '**/session-security.spec.ts',
      outputDir: './test-results/session-security',
    },
    {
      name: 'sign-out',
      testMatch: '**/sign-out.spec.ts',
      outputDir: './test-results/sign-out',
    },
  ],
  webServer: [
    {
      command: 'node dist/main.js',
      cwd: '../nest',
      url: `${apiOrigin}/pilot/me`,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'production',
        PORT: '4310',
        JWT_SECRET: randomBytes(32).toString('hex'),
      },
    },
    {
      command: 'node .output/server/index.mjs',
      url: webOrigin,
      reuseExistingServer: false,
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '4311',
        NUXT_API_BASE: apiOrigin,
        NUXT_APP_ORIGIN: webOrigin,
      },
    },
  ],
});
