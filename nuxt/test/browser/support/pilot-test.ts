import { test as base, expect } from '@playwright/test';
import type { APIRequestContext } from '@playwright/test';

type PilotState = Awaited<ReturnType<APIRequestContext['storageState']>>;

// Read-only feature journeys share one login while keeping separate contexts.
export const test = base.extend<
  Record<never, never>,
  { pilotState: PilotState }
>({
  pilotState: [
    async ({ playwright }, use, workerInfo) => {
      const baseURL = workerInfo.project.use.baseURL;
      if (!baseURL) throw new Error('The pilot journeys require a base URL.');
      const api = await playwright.request.newContext({ baseURL });
      try {
        const response = await api.post('/api/auth/login', {
          headers: { Origin: new URL(baseURL).origin },
          data: { username: 'johndoe', password: 'susiairtest' },
        });
        expect(response.status()).toBe(200);
        await use(await api.storageState());
      } finally {
        await api.dispose();
      }
    },
    { scope: 'worker' },
  ],
});
export { expect };
