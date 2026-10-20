import { createError } from 'h3';
import { ofetch } from 'ofetch';
import type { H3Event } from 'h3';
import type { LoginInput } from '../../shared/types/auth';
import { clearPilotSession } from './auth-session';

export async function pilotApi<T>(
  event: H3Event,
  path:
    | '/auth/login'
    | '/pilot/me'
    | '/flight-hours'
    | '/flight-hours/summary'
    | '/documents',
  options: {
    method: 'GET' | 'POST';
    body?: LoginInput;
    token?: string;
    query?: Record<string, string>;
  },
): Promise<T> {
  try {
    return await ofetch<T>(path, {
      baseURL: useRuntimeConfig(event).apiBase,
      method: options.method,
      body: options.body,
      query: options.query,
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
        message:
          path === '/auth/login'
            ? 'Check your username and password.'
            : 'Choose a valid date or flight-hour range.',
      });
    if (status === 429)
      throw createError({
        statusCode: 429,
        message:
          path === '/auth/login'
            ? 'Too many sign-in attempts. Try again in a minute.'
            : 'Too many requests. Try again in a minute.',
      });
    throw createError({
      statusCode: 503,
      message: path.startsWith('/flight-hours')
        ? 'Flight hours are unavailable. Please try again.'
        : path === '/documents'
          ? 'Documents are unavailable. Please try again.'
          : 'The sign-in service is unavailable. Please try again.',
    });
  }
}
