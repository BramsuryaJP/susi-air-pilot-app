import { defineStore } from 'pinia';
import type { FetchError } from 'ofetch';
import type { LoginInput, PilotProfile } from '../../shared/types/auth';

export const useSessionStore = defineStore('session', () => {
  const profile = ref<PilotProfile | null>(null);
  const request = useRequestFetch();
  const responseCookie = import.meta.server
    ? useResponseHeader('set-cookie')
    : null;
  let generation = 0;
  let pending: Promise<void> | null = null;

  async function refresh(): Promise<void> {
    if (pending) return pending;
    const current = generation;
    const task = (async () => {
      try {
        const result = await request<PilotProfile>('/api/auth/session', {
          retry: 0,
        });
        if (current === generation) profile.value = result;
      } catch (error: unknown) {
        if (current !== generation) return;
        const failure = error as Partial<FetchError>;
        const status = failure.statusCode;
        if (responseCookie) {
          const cookies = failure.response?.headers.getSetCookie() ?? [];
          if (cookies.length) {
            const previous = responseCookie.value;
            responseCookie.value = [
              ...(typeof previous === 'string'
                ? [previous]
                : Array.isArray(previous)
                  ? previous
                  : []),
              ...cookies,
            ];
          }
        }
        if (status !== 401) throw error;
        if (current === generation) profile.value = null;
      }
    })();
    pending = task;
    try {
      await task;
    } finally {
      if (pending === task) pending = null;
    }
  }

  async function signIn(input: LoginInput): Promise<void> {
    await request('/api/auth/login', { method: 'POST', body: input, retry: 0 });
    generation++;
    pending = null;
    profile.value = null;
  }

  async function signOut(): Promise<void> {
    await request('/api/auth/logout', { method: 'POST', retry: 0 });
    generation++;
    pending = null;
    profile.value = null;
  }

  return { profile, refresh, signIn, signOut };
});
