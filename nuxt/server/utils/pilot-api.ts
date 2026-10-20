import { createError } from 'h3';
import { ofetch } from 'ofetch';
import type { H3Event } from 'h3';
import type { LoginInput } from '../../shared/types/auth';
import { clearPilotSession } from './auth-session';

export async function pilotApi<T>(
  event: H3Event,
  path: '/auth/login' | '/pilot/me',
  options: { method: 'GET' | 'POST'; body?: LoginInput; token?: string },
): Promise<T> {
  try {
    return await ofetch<T>(path, {
      baseURL: useRuntimeConfig(event).apiBase,
      method: options.method,
      body: options.body,
      headers: options.token
        ? { Authorization: `Bearer ${options.token}` }
        : undefined,
      timeout: 5000,
      retry: 0,
    });
  } catch (error: unknown) {
    const status =
      typeof error === 'object' && error !== null && 'statusCode' in error
        ? error.statusCode
        : undefined;
    if (status === 401) {
      if (options.token) clearPilotSession(event);
      throw createError({
        statusCode: 401,
        message:
          path === '/auth/login'
            ? 'Invalid username or password.'
            : 'Please sign in to continue.',
      });
    }
    if (status === 400)
      throw createError({
        statusCode: 400,
        message: 'Check your username and password.',
      });
    if (status === 429)
      throw createError({
        statusCode: 429,
        message: 'Too many sign-in attempts. Try again in a minute.',
      });
    throw createError({
      statusCode: 503,
      message: 'The sign-in service is unavailable. Please try again.',
    });
  }
}
