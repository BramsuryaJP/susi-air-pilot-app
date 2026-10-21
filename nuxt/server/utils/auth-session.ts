import {
  createError,
  deleteCookie,
  getCookie,
  getHeader,
  setResponseHeader,
} from 'h3';
import type { H3Event } from 'h3';

export const SESSION_COOKIE = 'pilot_session';
// A non-sensitive hint explains expiry after the authentication cookie expires.
export const SESSION_HINT_COOKIE = 'pilot_session_hint';

export function sessionCookieOptions(event: H3Event) {
  const configured = useRuntimeConfig(event).appOrigin;
  let origin: URL;
  try {
    origin = new URL(configured);
  } catch {
    throw createError({
      statusCode: 500,
      message: 'The sign-in service is not configured.',
    });
  }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(
    origin.hostname,
  );
  if (
    !['http:', 'https:'].includes(origin.protocol) ||
    origin.username ||
    origin.password ||
    (process.env.NODE_ENV === 'production' &&
      !loopback &&
      origin.protocol !== 'https:')
  ) {
    throw createError({
      statusCode: 500,
      message: 'The sign-in service requires a valid HTTPS origin.',
    });
  }
  return {
    httpOnly: true,
    secure: origin.protocol === 'https:',
    sameSite: 'strict' as const,
    path: '/',
  };
}

export function requireSameOrigin(event: H3Event): void {
  sessionCookieOptions(event);
  const expected = new URL(useRuntimeConfig(event).appOrigin).origin;
  if (getHeader(event, 'origin') !== expected) {
    throw createError({
      statusCode: 403,
      message: 'This request must come from the pilot application.',
    });
  }
}

export function clearPilotSession(event: H3Event): void {
  const options = sessionCookieOptions(event);
  deleteCookie(event, SESSION_COOKIE, options);
  deleteCookie(event, SESSION_HINT_COOKIE, options);
}

export function privateResponse(event: H3Event): void {
  setResponseHeader(event, 'Cache-Control', 'private, no-store');
  setResponseHeader(event, 'Vary', 'Cookie');
}

export function pilotSessionToken(event: H3Event): string {
  const token = getCookie(event, SESSION_COOKIE);
  if (!token)
    throw createError({
      statusCode: 401,
      message: 'Please sign in to continue.',
      data: {
        code:
          getCookie(event, SESSION_HINT_COOKIE) === '1'
            ? 'SESSION_EXPIRED'
            : 'AUTH_REQUIRED',
      },
    });
  return token;
}
