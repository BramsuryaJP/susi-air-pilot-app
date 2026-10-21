import { defineStore } from 'pinia';
import type { FetchError } from 'ofetch';
import type { LoginInput, PilotProfile } from '../../shared/types/auth';

export const useSessionStore = defineStore('session', () => {
  const profile = ref<PilotProfile | null>(null);
  const request = useRequestFetch();
  const expired = ref(false);
  let generation = 0;
  let pending: Promise<void> | null = null;
  let authentication: Promise<void> | null = null;

  async function refresh(): Promise<void> {
    while (authentication) await authentication;
    if (pending) return pending;
    const current = generation;
    const task = (async () => {
      try {
        const result = await request<PilotProfile>('/api/auth/session', {
          retry: 0,
        });
        if (current === generation) {
          profile.value = result;
          expired.value = false;
        }
      } catch (error: unknown) {
        if (current !== generation) return;
        const failure = error as Partial<FetchError>;
        const status = failure.statusCode;
        if (status !== 401) throw error;
        const data = failure.data as { data?: { code?: unknown } } | undefined;
        expired.value =
          data?.data?.code === 'SESSION_EXPIRED' || profile.value !== null;
        profile.value = null;
      }
    })();
    pending = task;
    try {
      await task;
    } finally {
      if (pending === task) pending = null;
    }
  }

  async function mutateSession(write: () => Promise<unknown>): Promise<void> {
    // Serialize explicit writes; a failed earlier action must not block a later one.
    while (authentication) {
      try {
        await authentication;
      } catch {
        // Each caller still receives its own write failure.
      }
    }
    generation++;
    pending = null;
    const task = Promise.resolve()
      .then(write)
      .then(() => {
        profile.value = null;
        expired.value = false;
      })
      .finally(() => {
        // Fence reads both before and after the cookie mutation settles.
        generation++;
        pending = null;
      });
    authentication = task;
    try {
      await task;
    } finally {
      if (authentication === task) authentication = null;
    }
  }

  function signIn(input: LoginInput): Promise<void> {
    return mutateSession(() =>
      request<{ authenticated: true }>('/api/auth/login', {
        method: 'POST',
        body: input,
        retry: 0,
      }),
    );
  }

  function signOut(): Promise<void> {
    return mutateSession(() =>
      request<undefined>('/api/auth/logout', { method: 'POST', retry: 0 }),
    );
  }

  return { profile, expired, refresh, signIn, signOut };
});
