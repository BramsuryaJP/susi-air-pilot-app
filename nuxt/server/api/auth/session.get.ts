import type { PilotProfile } from '../../../shared/types/auth';
import { pilotSessionToken, privateResponse } from '../../utils/auth-session';
import { pilotApi } from '../../utils/pilot-api';

export default defineEventHandler(async (event) => {
  privateResponse(event);
  const token = pilotSessionToken(event);
  return pilotApi<PilotProfile>(event, '/pilot/me', { method: 'GET', token });
});
