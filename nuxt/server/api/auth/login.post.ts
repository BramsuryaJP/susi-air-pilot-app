import { createError, getHeader, readBody, setCookie } from 'h3';
import type { LoginInput, TokenResponse } from '../../../shared/types/auth';
import {
  privateResponse,
  requireSameOrigin,
  SESSION_COOKIE,
  SESSION_HINT_COOKIE,
  sessionCookieOptions,
} from '../../utils/auth-session';
import { pilotApi } from '../../utils/pilot-api';

export default defineEventHandler(async (event) => {
  privateResponse(event);
  requireSameOrigin(event);
  if (
    getHeader(event, 'content-type')?.split(';')[0]?.trim().toLowerCase() !==
    'application/json'
  ) {
    throw createError({
      statusCode: 415,
      message: 'Sign-in requires a JSON request.',
    });
  }
  const body: unknown = await readBody(event);
  if (
    !body ||
    typeof body !== 'object' ||
    Array.isArray(body) ||
    Object.keys(body).some((key) => !['username', 'password'].includes(key)) ||
    !('username' in body) ||
    !('password' in body) ||
    typeof body.username !== 'string' ||
    typeof body.password !== 'string' ||
    body.username.length < 1 ||
    body.username.length > 64 ||
    body.password.length < 1 ||
    body.password.length > 128
  ) {
    throw createError({
      statusCode: 400,
      message: 'Check your username and password.',
    });
  }
  const result = await pilotApi<TokenResponse>(event, '/auth/login', {
    method: 'POST',
    body: body as LoginInput,
  });
  if (
    typeof result.accessToken !== 'string' ||
    !result.accessToken ||
    result.expiresIn !== 1800 ||
    result.tokenType !== 'Bearer'
  ) {
    throw createError({
      statusCode: 503,
      message: 'The sign-in service is unavailable. Please try again.',
    });
  }
  setCookie(event, SESSION_COOKIE, result.accessToken, {
    ...sessionCookieOptions(event),
    maxAge: result.expiresIn,
  });
  // This session-scoped flag carries no identity and never authorizes a request.
  setCookie(event, SESSION_HINT_COOKIE, '1', sessionCookieOptions(event));
  return { authenticated: true };
});
