import { createError, getCookie } from 'h3';
import type { PilotProfile } from '../../../shared/types/auth';
import { privateResponse, SESSION_COOKIE } from '../../utils/auth-session';
import { pilotApi } from '../../utils/pilot-api';

export default defineEventHandler(async (event) => {
  privateResponse(event);
  const token = getCookie(event, SESSION_COOKIE);
  if (!token)
    throw createError({
      statusCode: 401,
      message: 'Please sign in to continue.',
    });
  return pilotApi<PilotProfile>(event, '/pilot/me', { method: 'GET', token });
});
